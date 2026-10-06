/**
 * Browser client for the cloud model endpoints (packages/cloud-api), served by
 * the local runtime or by the Vercel functions in api/. The Hugging Face token
 * never reaches the browser: the server holds it. A public deployment may ask
 * for an access code, kept in this browser's localStorage.
 */
import type { ChatMessage } from "./types.ts";

export interface CloudStatus {
  configured: boolean;
  /** null when not configured (not checked). */
  reachable: boolean | null;
  /** A public deployment with AI_EXHIBIT_ACCESS_CODE set. Absent from older servers. */
  codeRequired?: boolean;
  /** Only when a code was sent and one is required. */
  codeAccepted?: boolean;
  /** The server's Hugging Face key: valid, plan, inference permission, credits refused lately. Absent from older servers. */
  key?: {
    valid: boolean | null;
    plan: "free" | "pro" | null;
    inference: boolean | null;
    creditsExhausted: boolean;
    /** The key may read the account's billing usage. Absent from older servers. */
    billing?: boolean | null;
    /** Estimated Hugging Face credit left, in US dollars; only with the billing permission and HF_CREDIT_USD set. */
    creditLeftUsd?: number;
  };
}

/** Header the server reads the access code from (packages/cloud-api ACCESS_CODE_HEADER). */
export const ACCESS_CODE_HEADER = "x-ai-exhibit-code";
const ACCESS_CODE_KEY = "ai-exhibit:access-code";
/**
 * Header that marks an audience request (the "Try it" tab of /glossary) with a
 * random device id: the server keeps it out of the presenter's budget, under
 * an anti-burst cap per device (packages/cloud-api AUDIENCE_HEADER).
 */
export const AUDIENCE_HEADER = "x-ai-exhibit-audience";

/** The access code this browser remembers, or null. */
export function getAccessCode(): string | null {
  try {
    return globalThis.localStorage?.getItem(ACCESS_CODE_KEY) || null;
  } catch {
    return null;
  }
}

export function setAccessCode(code: string | null): void {
  try {
    if (code) globalThis.localStorage?.setItem(ACCESS_CODE_KEY, code);
    else globalThis.localStorage?.removeItem(ACCESS_CODE_KEY);
  } catch {
    /* storage unavailable: the code lasts for this call only */
  }
}

export interface CloudTokenProb {
  token: string;
  p: number;
  top: { token: string; p: number }[];
}

export interface CloudCompletion {
  text: string;
  finishReason: string | null;
  model: string;
  provider: string;
  ms: number;
}

export interface CloudChatAnswer extends CloudCompletion {
  /** Per generated token: its probability and the top-5 alternatives (null if the provider sent none). */
  tokens: CloudTokenProb[] | null;
}

export type CloudErrorCode =
  | "not-configured"
  | "forbidden"
  | "access-code"
  | "not-found"
  | "bad-request"
  | "rate-limited"
  | "upstream"
  | "timeout"
  | "offline";

/** For a "rate-limited" refusal: which budget ran out, how big it is, and when it frees up. */
export interface CloudRateLimit {
  limit: "minute" | "hour";
  /** Requests allowed in that window, when the server says. */
  max?: number;
  /** Milliseconds until the server accepts calls again, when it says. */
  retryAfterMs?: number;
}

export class CloudLlmError extends Error {
  constructor(
    readonly code: CloudErrorCode,
    message: string,
    readonly rate?: CloudRateLimit,
  ) {
    super(message);
    this.name = "CloudLlmError";
  }
}

/**
 * The details of a "rate-limited" answer: the fields the server adds
 * (packages/cloud-api RateLimitInfo), else the Retry-After header and the
 * wording of an older server's message ("in a minute", "in an hour").
 */
function rateLimitOf(res: Response, body: Record<string, unknown> | null): CloudRateLimit {
  const message = typeof body?.message === "string" ? body.message : "";
  const limit = body?.limit === "hour" || body?.limit === "minute" ? body.limit : /\bin an hour\b/i.test(message) ? "hour" : "minute";
  const max = typeof body?.max === "number" ? body.max : Number(/More than (\d+)/i.exec(message)?.[1]) || undefined;
  const seconds = typeof body?.retryAfter === "number" ? body.retryAfter : Number(res.headers.get("retry-after"));
  return { limit, ...(max ? { max } : {}), ...(seconds > 0 ? { retryAfterMs: seconds * 1000 } : {}) };
}

export interface CloudOptions {
  signal?: AbortSignal;
  /** Client-side limit; the runtime has its own (about 20 s). */
  timeoutMs?: number;
  fetch?: typeof fetch;
  baseUrl?: string;
  /** Overrides the stored access code (to check a code before saving it). */
  accessCode?: string | null;
  /** Audience device id: the call stays out of the presenter's budget (AUDIENCE_HEADER). */
  audience?: string;
}

/** Headers every call carries: the access code, the audience device id. */
function callHeaders(opts: CloudOptions, code: string | null, base?: HeadersInit): Headers {
  const headers = new Headers(base);
  if (code) headers.set(ACCESS_CODE_HEADER, code);
  if (opts.audience) headers.set(AUDIENCE_HEADER, opts.audience);
  return headers;
}

/** The error a refused call reports. */
function refusal(res: Response, body: Record<string, unknown> | null, opts: CloudOptions, code: string | null): CloudLlmError {
  const error = (typeof body?.error === "string" ? body.error : "upstream") as CloudErrorCode;
  // A stored code the server refuses is stale: forget it, so the presenter is asked again.
  if (error === "access-code" && opts.accessCode === undefined && code) setAccessCode(null);
  const message = typeof body?.message === "string" ? body.message : `HTTP ${res.status}`;
  return new CloudLlmError(error, message, error === "rate-limited" ? rateLimitOf(res, body) : undefined);
}

async function request<T>(path: string, init: RequestInit, opts: CloudOptions): Promise<T> {
  const doFetch = opts.fetch ?? fetch;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 25_000);
  const onAbort = () => ac.abort();
  opts.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const code = opts.accessCode !== undefined ? opts.accessCode : getAccessCode();
    const headers = callHeaders(opts, code, init.headers);
    const res = await doFetch(`${opts.baseUrl ?? ""}${path}`, { ...init, headers, signal: ac.signal });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) throw refusal(res, body, opts, code);
    if (!body) throw new CloudLlmError("upstream", "Empty answer");
    return body as T;
  } catch (err) {
    if (err instanceof CloudLlmError) throw err;
    if (opts.signal?.aborted) throw new CloudLlmError("timeout", "Cancelled");
    if (ac.signal.aborted) throw new CloudLlmError("timeout", "The cloud model took too long");
    throw new CloudLlmError("offline", "The server or the network is unreachable");
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * The server refuses longer texts (MAX_INPUT_CHARS in packages/cloud-api): trim
 * before sending. A continuation keeps the end of its prompt, the part that
 * matters for the next words; other texts keep their start.
 */
export const MAX_INPUT_CHARS = 300;
/**
 * Output is free (MAX_OUTPUT_TOKENS in packages/cloud-api): ask for the
 * server's ceiling and let the model stop on its own.
 */
export const MAX_OUTPUT_TOKENS = 1024;
const keepEnd = (text: string) => (text.length > MAX_INPUT_CHARS ? text.slice(-MAX_INPUT_CHARS) : text);
const keepStart = (text: string) => text.slice(0, MAX_INPUT_CHARS);

export function cloudStatus(opts: CloudOptions = {}): Promise<CloudStatus> {
  return request<CloudStatus>("/api/llm/status", { method: "GET" }, { timeoutMs: 6000, ...opts });
}

/** Raw continuation by the base model (pretraining only). No probabilities. */
export function cloudComplete(
  req: { prompt: string; maxTokens?: number; temperature?: number },
  opts: CloudOptions = {},
): Promise<CloudCompletion> {
  return request<CloudCompletion>(
    "/api/llm/complete",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...req, prompt: keepEnd(req.prompt) }) },
    opts,
  );
}

/** Assistant answer by the instruct model, with top-5 probabilities per token when available. */
export function cloudChat(
  req: { messages: ChatMessage[]; maxTokens?: number; temperature?: number },
  opts: CloudOptions = {},
): Promise<CloudChatAnswer> {
  return request<CloudChatAnswer>(
    "/api/llm/chat",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...req, messages: req.messages.map((m) => ({ ...m, content: keepStart(m.content) })) }),
    },
    // A long answer may take the server's whole 25 s.
    { timeoutMs: 30_000, ...opts },
  );
}

export interface CloudEmbedding {
  model: string;
  dims: number;
  /** Mean-pooled, L2-normalised, like the browser embedder's output. */
  vectors: number[][];
  ms: number;
}

/**
 * Sentence embeddings by Hugging Face Inference, for texts already wrapped in
 * the vocabulary's template (`queryText`). Centre them with `locateQuery`.
 */
export function cloudEmbed(texts: string[], opts: CloudOptions = {}): Promise<CloudEmbedding> {
  return request<CloudEmbedding>(
    "/api/embed",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts: texts.map(keepStart) }) },
    { timeoutMs: 15_000, ...opts },
  );
}

export type CloudTokenizerId = "llama-3.1" | "gpt2";

export interface CloudTokenization {
  tokenizer: CloudTokenizerId;
  label: string;
  tokens: { id: number; start: number; end: number; partial?: boolean; bytes?: string }[];
  ms: number;
}

/** Tokens of a text with a real tokenizer, run on the server (no Hugging Face token needed). */
export function cloudTokenize(text: string, tokenizer: CloudTokenizerId = "llama-3.1", opts: CloudOptions = {}): Promise<CloudTokenization> {
  return request<CloudTokenization>(
    "/api/tokenize",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, tokenizer }) },
    // The first call may wait for the server to fetch the tokenizer files.
    { timeoutMs: 30_000, ...opts },
  );
}

export interface CloudNextToken {
  /** The token the provider picked (greedy at temperature 0). */
  token: string;
  /** Top 5 next tokens, most likely first. */
  candidates: { text: string; p: number }[];
  model: string;
  provider: string;
  ms: number;
}

/** Probabilities of the next token after a raw text (no chat format). */
export function cloudNextToken(req: { prompt: string; temperature?: number }, opts: CloudOptions = {}): Promise<CloudNextToken> {
  return request<CloudNextToken>(
    "/api/llm/next",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...req, prompt: keepEnd(req.prompt) }) },
    opts,
  );
}

/* ---------------------------------------------------------------------------- */
/* Live ladder: one question, open models of increasing size, streamed.          */

/**
 * The rungs of /api/llm/ladder as the audience sees them, in order. The ids
 * match LADDER in packages/cloud-api (a test checks it); the server decides
 * the providers. Sizes are the Hub's safetensors totals (494M, 8.03B, 753B),
 * years the publication of each model's repository on huggingface.co
 * (Qwen2.5-0.5B 2024-09, Llama-3.1-8B-Instruct 2024-07, GLM-5.3 2026-08;
 * checked 2026-10-04).
 */
export interface LadderModel {
  id: string;
  /** Shown on screen. */
  name: string;
  maker: string;
  /** Parameters, in billions. */
  paramsB: number;
  year: number;
  /** "base": pretrained only, asked as a raw `Q: ...\nA:` text. */
  kind: "base" | "chat" | "reasoning";
}

export const LADDER_MODELS: readonly LadderModel[] = [
  { id: "qwen2.5-0.5b-base", name: "Qwen2.5 0.5B", maker: "Alibaba", paramsB: 0.5, year: 2024, kind: "base" },
  { id: "llama-3.1-8b", name: "Llama 3.1 8B Instruct", maker: "Meta", paramsB: 8, year: 2024, kind: "chat" },
  { id: "glm-5.3", name: "GLM-5.3", maker: "Z.ai", paramsB: 753, year: 2026, kind: "reasoning" },
];

/** One line of the ladder stream (packages/cloud-api LadderEvent). */
export type CloudLadderEvent =
  | { type: "start"; rung: string; model: string; provider: string }
  | { type: "reasoning"; rung: string }
  | { type: "text"; rung: string; text: string }
  | { type: "done"; rung: string; finishReason: string | null; ms: number }
  | { type: "error"; rung: string; error: CloudErrorCode; message: string }
  | { type: "end" };

/**
 * Asks every rung the same question; `onEvent` gets each word as the server
 * receives it. Resolves when the stream ends; throws a CloudLlmError when the
 * server refuses the request as a whole (budget, access code, no token).
 */
export async function cloudLadder(question: string, onEvent: (e: CloudLadderEvent) => void, opts: CloudOptions = {}): Promise<void> {
  const doFetch = opts.fetch ?? fetch;
  const ac = new AbortController();
  // The whole ladder: the server stops each rung on its own well before this.
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 70_000);
  const onAbort = () => ac.abort();
  opts.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const code = opts.accessCode !== undefined ? opts.accessCode : getAccessCode();
    const headers = callHeaders(opts, code, { "content-type": "application/json" });
    const res = await doFetch(`${opts.baseUrl ?? ""}/api/llm/ladder`, {
      method: "POST",
      headers,
      body: JSON.stringify({ question: keepStart(question) }),
      signal: ac.signal,
    });
    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      throw refusal(res, body, opts, code);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    const line = (l: string) => {
      if (!l.trim()) return;
      try {
        onEvent(JSON.parse(l) as CloudLadderEvent);
      } catch {
        /* a malformed line: skip it */
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        line(buf.slice(0, i));
        buf = buf.slice(i + 1);
      }
    }
    line(buf + dec.decode());
  } catch (err) {
    if (err instanceof CloudLlmError) throw err;
    if (opts.signal?.aborted) throw new CloudLlmError("timeout", "Cancelled");
    if (ac.signal.aborted) throw new CloudLlmError("timeout", "The cloud models took too long");
    throw new CloudLlmError("offline", "The server or the network is unreachable");
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}
