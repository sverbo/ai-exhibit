// Cloud models through the Hugging Face router, behind the same four endpoints
// wherever the app is served: the local runtime (apps/local-runtime) and the
// Vercel functions (api/). Web-standard Request/Response only, no framework.
//
//   GET  /api/llm/status    {configured, reachable, codeRequired}
//   POST /api/llm/complete  base model continuation (Llama 3.1 8B, pretraining only)
//   POST /api/llm/chat      assistant answer (Llama 3.1 8B Instruct) + top-5 probabilities per token
//   POST /api/llm/next      next-token probabilities (top 5) for raw text
//   POST /api/llm/ladder    one question, streamed answers of a ladder of open models (NDJSON)
//   POST /api/embed        sentence embeddings (paraphrase-multilingual-MiniLM-L12-v2)
//   POST /api/tokenize      tokens of a text with the cloud model's tokenizer (no token needed)
//
// The token never leaves the server: it is not logged, not echoed in errors,
// and the status only says whether one is configured.
import { EMBED_MODEL, EMBED_URL, roundVector, toSentenceVectors } from "./embed.js";
import { CLOUD_TOKENIZERS, isCloudTokenizerId, loadCloudTokenizer, tokenizeWith } from "./tokenize.js";

export const BASE_MODEL = "meta-llama/Llama-3.1-8B";
export const BASE_URL = "https://router.huggingface.co/featherless-ai/v1/completions";
export const CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
/** Providers that return top_logprobs, in order of preference. */
export const CHAT_MODELS = ["meta-llama/Llama-3.1-8B-Instruct:nscale", "meta-llama/Llama-3.1-8B-Instruct:novita"];
const STATUS_PROBE_URL = "https://router.huggingface.co/v1/models";
/** The token's own account: tells whether the key is valid, its plan and whether it may call inference. */
const WHOAMI_URL = "https://huggingface.co/api/whoami-v2";

/** What the server knows about its Hugging Face key, without revealing the key or the account name. */
export interface KeyStatus {
  /** The key is accepted by Hugging Face; null when it could not be checked. */
  valid: boolean | null;
  /** "pro" accounts get monthly credits and can pay as they go; "free" ones get a small monthly allowance only. */
  plan: "free" | "pro" | null;
  /** The key may call Inference Providers. */
  inference: boolean | null;
  /** A model call was refused for payment (HTTP 402) in the last 15 minutes: credits look used up. */
  creditsExhausted: boolean;
}
/**
 * Next-token probabilities for raw text. No Hugging Face routed provider
 * returns them for a base model (featherless-ai, the only one serving Llama
 * 3.1 8B base, answers `logprobs: null`; checked 2026-10-03). Together returns
 * the top 5 for a raw completion of Llama 3.3 70B Instruct: the text is sent
 * as is, without the chat format, so the model only continues it. The scene
 * says so on screen.
 */
export const NEXT_URL = "https://router.huggingface.co/together/v1/completions";
export const NEXT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
export const NEXT_MODEL_LABEL = "Llama 3.3 70B Instruct";
/** Together's maximum for `logprobs`. */
export const NEXT_TOP = 5;

/** A router target: one model at one provider. */
export interface LadderTarget {
  url: string;
  /** The model id as the provider's endpoint expects it (`model:provider` on the chat router). */
  model: string;
  provider: string;
}

/**
 * One rung of the live ladder. `id` is shared with the browser client
 * (packages/ml-runtime/src/lm/cloud.ts LADDER_MODELS), which holds the labels.
 */
export interface LadderRung {
  id: string;
  /** Hub id of the model, as reported back to the client. */
  hubId: string;
  /**
   * "base": pretrained only, given a raw `Q: ...\nA:` text to continue (the
   * layout GPT-2 was asked in). "chat": an instruct model. "reasoning": an
   * instruct model that writes hidden reasoning first, so it gets more tokens.
   */
  kind: "base" | "chat" | "reasoning";
  /** Tried in order; the next one only when a target fails before its first word. */
  targets: LadderTarget[];
}

const FEATHERLESS_COMPLETIONS = "https://router.huggingface.co/featherless-ai/v1/completions";

/**
 * The live ladder: three open models of clearly increasing power, asked the
 * same question at once. GPT-2 is served by no Hugging Face provider
 * (hf-inference and featherless-ai both refuse openai-community/gpt2 and
 * gpt2-xl; checked 2026-10-04), and GPT-3 and GPT-4 are closed OpenAI models,
 * so the smallest rung is the smallest base model a provider serves. Each rung
 * falls back to its next provider; every target below answered a real
 * streamed call on 2026-10-04 (Qwen2.5 0.5B has a single provider).
 */
export const LADDER: LadderRung[] = [
  {
    id: "qwen2.5-0.5b-base",
    hubId: "Qwen/Qwen2.5-0.5B",
    kind: "base",
    targets: [{ url: FEATHERLESS_COMPLETIONS, model: "Qwen/Qwen2.5-0.5B", provider: "featherless-ai" }],
  },
  {
    id: "llama-3.1-8b",
    hubId: "meta-llama/Llama-3.1-8B-Instruct",
    kind: "chat",
    targets: ["nscale", "novita", "deepinfra"].map((p) => ({ url: CHAT_URL, model: `meta-llama/Llama-3.1-8B-Instruct:${p}`, provider: p })),
  },
  {
    id: "gpt-oss-120b",
    hubId: "openai/gpt-oss-120b",
    kind: "reasoning",
    targets: ["groq", "together", "novita"].map((p) => ({ url: CHAT_URL, model: `openai/gpt-oss-120b:${p}`, provider: p })),
  },
];

/** The same short instruction for every chat rung, so answers fit side by side. */
export const LADDER_SYSTEM = "Answer briefly.";
/** Answer length of the base rung (it rambles; its first line is the answer). */
export const LADDER_BASE_TOKENS = 60;
/** Extra tokens for the reasoning rung's hidden reasoning, on top of the answer's. */
export const LADDER_REASONING_TOKENS = 640;
/** Pause before trying a busy provider again. */
export const LADDER_RETRY_MS = 1500;

/**
 * A failure worth one more try at the same provider: rate limits, overload,
 * "temporarily at capacity" (featherless-ai answers so mid-stream when its
 * small models are all in use; seen 2026-10-04).
 */
export function isBusy(message: string): boolean {
  return /answered (429|503)\b|capacity|overloaded|try again/i.test(message);
}

/** Header that carries the optional access code (AI_EXHIBIT_ACCESS_CODE). */
export const ACCESS_CODE_HEADER = "x-ai-exhibit-code";

export interface Limits {
  promptChars: number;
  messages: number;
  maxTokens: number;
  defaultMaxTokens: number;
  embedTexts: number;
  embedChars: number;
  tokenizeChars: number;
  timeoutMs: number;
  /**
   * Whole answer of one ladder rung, streamed. Longer than `timeoutMs`: a
   * small model at featherless-ai may first need to load (up to about 30 s).
   */
  ladderTimeoutMs: number;
  /** Requests per rolling minute (per client or for everyone, see `rateLimit`). */
  perMinute: number;
  /**
   * Model requests (everything that calls Hugging Face) per rolling hour and
   * client address, all endpoints together. Tokenizing runs locally on the
   * server and does not count.
   */
  perHour: number;
  bodyBytes: number;
}

/** Longest text any endpoint accepts in one field (prompt, message, text to embed or tokenize). */
export const MAX_INPUT_CHARS = 300;

/** The presenter's own machine. */
export const LOCAL_LIMITS: Limits = {
  promptChars: MAX_INPUT_CHARS,
  messages: 4,
  maxTokens: 160,
  defaultMaxTokens: 60,
  embedTexts: 16,
  embedChars: MAX_INPUT_CHARS,
  tokenizeChars: MAX_INPUT_CHARS,
  timeoutMs: 20_000,
  ladderTimeoutMs: 50_000,
  perMinute: 30,
  perHour: 100,
  bodyBytes: 32_000,
};

/** A public deployment: smaller prompts and answers, a budget per visitor. */
export const PUBLIC_LIMITS: Limits = {
  promptChars: MAX_INPUT_CHARS,
  messages: 4,
  maxTokens: 120,
  defaultMaxTokens: 60,
  embedTexts: 4,
  embedChars: MAX_INPUT_CHARS,
  tokenizeChars: MAX_INPUT_CHARS,
  timeoutMs: 20_000,
  // Inside the 30 s a Vercel function may run (vercel.json maxDuration).
  ladderTimeoutMs: 27_000,
  perMinute: 20,
  perHour: 100,
  bodyBytes: 16_000,
};

export type CloudErrorCode =
  | "not-configured"
  | "forbidden"
  | "access-code"
  | "bad-request"
  | "not-found"
  | "rate-limited"
  | "upstream"
  | "timeout";

export const ERROR_STATUS: Record<CloudErrorCode, number> = {
  "not-configured": 503,
  forbidden: 403,
  "access-code": 401,
  "bad-request": 400,
  "not-found": 404,
  "rate-limited": 429,
  upstream: 502,
  timeout: 504,
};

export class CloudError extends Error {
  constructor(
    readonly code: CloudErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CloudError";
  }
}

function clampTokens(v: unknown, limits: Limits): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : limits.defaultMaxTokens;
  return Math.max(1, Math.min(limits.maxTokens, n));
}

function clampTemperature(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.max(0, Math.min(2, v));
}

export function parseCompleteBody(
  body: unknown,
  limits: Limits = LOCAL_LIMITS,
): { prompt: string; maxTokens: number; temperature?: number } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.prompt !== "string" || !b.prompt.trim()) throw new CloudError("bad-request", "prompt is required");
  if (b.prompt.length > limits.promptChars) throw new CloudError("bad-request", "prompt is too long");
  return { prompt: b.prompt, maxTokens: clampTokens(b.maxTokens, limits), temperature: clampTemperature(b.temperature) };
}

export interface ChatMessageIn {
  role: "system" | "user" | "assistant";
  content: string;
}

export function parseChatBody(
  body: unknown,
  limits: Limits = LOCAL_LIMITS,
): { messages: ChatMessageIn[]; maxTokens: number; temperature?: number } {
  const b = (body ?? {}) as Record<string, unknown>;
  const raw = b.messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > limits.messages) {
    throw new CloudError("bad-request", `messages must hold 1 to ${limits.messages} items`);
  }
  const messages = raw.map((m): ChatMessageIn => {
    const role = (m as Record<string, unknown>)?.role;
    const content = (m as Record<string, unknown>)?.content;
    if (role !== "system" && role !== "user" && role !== "assistant") throw new CloudError("bad-request", "bad role");
    if (typeof content !== "string" || content.length > limits.promptChars) throw new CloudError("bad-request", "bad content");
    return { role, content };
  });
  return { messages, maxTokens: clampTokens(b.maxTokens, limits), temperature: clampTemperature(b.temperature) };
}

export function parseEmbedBody(body: unknown, limits: Limits = LOCAL_LIMITS): { texts: string[] } {
  const texts = ((body ?? {}) as Record<string, unknown>).texts;
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > limits.embedTexts) {
    throw new CloudError("bad-request", `texts must hold 1 to ${limits.embedTexts} items`);
  }
  for (const t of texts) {
    if (typeof t !== "string" || !t.trim() || t.length > limits.embedChars) throw new CloudError("bad-request", "bad text");
  }
  return { texts: texts as string[] };
}

export function parseNextBody(
  body: unknown,
  limits: Limits = LOCAL_LIMITS,
): { prompt: string; temperature: number } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.prompt !== "string" || !b.prompt.trim()) throw new CloudError("bad-request", "prompt is required");
  if (b.prompt.length > limits.promptChars) throw new CloudError("bad-request", "prompt is too long");
  return { prompt: b.prompt, temperature: clampTemperature(b.temperature) ?? 1 };
}

export function parseTokenizeBody(body: unknown, limits: Limits = LOCAL_LIMITS): { text: string; tokenizer: keyof typeof CLOUD_TOKENIZERS } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.text !== "string" || b.text.length > limits.tokenizeChars) throw new CloudError("bad-request", "bad text");
  const tokenizer = b.tokenizer ?? "llama-3.1";
  if (!isCloudTokenizerId(tokenizer)) throw new CloudError("bad-request", "unknown tokenizer");
  return { text: b.text, tokenizer };
}

export function parseLadderBody(body: unknown, limits: Limits = LOCAL_LIMITS): { question: string } {
  const q = ((body ?? {}) as Record<string, unknown>).question;
  if (typeof q !== "string" || !q.trim()) throw new CloudError("bad-request", "question is required");
  if (q.length > limits.promptChars) throw new CloudError("bad-request", "question is too long");
  return { question: q.trim() };
}

/** The upstream request body of one ladder rung. */
export function ladderPayload(rung: LadderRung, target: LadderTarget, question: string, limits: Limits): Record<string, unknown> {
  if (rung.kind === "base") {
    return {
      model: target.model,
      prompt: `Q: ${question}\nA:`,
      max_tokens: LADDER_BASE_TOKENS,
      temperature: 0,
      stop: ["\nQ:"],
      stream: true,
    };
  }
  const messages = [
    { role: "system", content: LADDER_SYSTEM },
    { role: "user", content: question },
  ];
  if (rung.kind === "reasoning") {
    return { model: target.model, messages, max_tokens: limits.maxTokens + LADDER_REASONING_TOKENS, reasoning_effort: "low", stream: true };
  }
  return { model: target.model, messages, max_tokens: limits.maxTokens, temperature: 0, stream: true };
}

/** What one server-sent event of a streamed completion carries. */
export interface StreamDelta {
  text: string;
  reasoning: boolean;
  finishReason: string | null;
  error: string | null;
}

/** One `data:` payload of an OpenAI-style stream (chat or legacy completions). */
export function parseStreamData(data: string): StreamDelta | null {
  if (data === "[DONE]") return null;
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (json.error) {
    const e = json.error as { message?: unknown } | string;
    return { text: "", reasoning: false, finishReason: null, error: String(typeof e === "string" ? e : e.message ?? "error").slice(0, 200) };
  }
  const choice = (json.choices as Record<string, unknown>[] | undefined)?.[0];
  if (!choice) return null;
  const delta = (choice.delta ?? {}) as Record<string, unknown>;
  // A chat chunk's words are in `delta.content` only: some providers (Together)
  // repeat them in `text`, and a completion chunk has `text` alone.
  const text = choice.delta
    ? typeof delta.content === "string"
      ? delta.content
      : ""
    : typeof choice.text === "string"
      ? choice.text
      : "";
  const reasoning =
    (typeof delta.reasoning === "string" && delta.reasoning.length > 0) ||
    (typeof delta.reasoning_content === "string" && delta.reasoning_content.length > 0);
  const finishReason = typeof choice.finish_reason === "string" ? choice.finish_reason : null;
  return { text, reasoning, finishReason, error: null };
}

/** Calls `onData` with each `data:` payload of a server-sent event stream. */
export async function readSse(body: ReadableStream<Uint8Array>, onData: (data: string) => void): Promise<void> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const flush = (line: string) => {
    const l = line.trim();
    if (l.startsWith("data:")) onData(l.slice(5).trim());
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      flush(buf.slice(0, i));
      buf = buf.slice(i + 1);
    }
  }
  flush(buf + dec.decode());
}

/** One line of the /api/llm/ladder stream (NDJSON). */
export type LadderEvent =
  | { type: "start"; rung: string; model: string; provider: string }
  | { type: "reasoning"; rung: string }
  | { type: "text"; rung: string; text: string }
  | { type: "done"; rung: string; finishReason: string | null; ms: number }
  | { type: "error"; rung: string; error: CloudErrorCode; message: string }
  | { type: "end" };

/** Together's legacy `logprobs` object: the sampled token and the top alternatives (as probabilities). */
export function toNextCandidates(logprobs: unknown): { token: string; candidates: { text: string; p: number }[] } | null {
  const lp = logprobs as { tokens?: unknown; top_logprobs?: unknown } | null | undefined;
  const token = Array.isArray(lp?.tokens) ? lp.tokens[0] : undefined;
  const top = Array.isArray(lp?.top_logprobs) ? (lp.top_logprobs[0] as Record<string, unknown> | undefined) : undefined;
  if (typeof token !== "string" || !top || typeof top !== "object") return null;
  const candidates = Object.entries(top)
    .filter((e): e is [string, number] => typeof e[1] === "number" && Number.isFinite(e[1]))
    .map(([text, logprob]) => ({ text, p: Math.exp(logprob) }))
    .sort((a, b) => b.p - a.p);
  return candidates.length ? { token, candidates } : null;
}

export interface TokenProb {
  token: string;
  p: number;
  top: { token: string; p: number }[];
}

/** OpenAI-style logprobs.content to probabilities, or null when the provider sent none. */
export function toTokenProbs(logprobs: unknown): TokenProb[] | null {
  const content = (logprobs as { content?: unknown } | null | undefined)?.content;
  if (!Array.isArray(content) || content.length === 0) return null;
  const out: TokenProb[] = [];
  for (const item of content) {
    const it = item as { token?: unknown; logprob?: unknown; top_logprobs?: unknown };
    if (typeof it.token !== "string" || typeof it.logprob !== "number") return null;
    const top = Array.isArray(it.top_logprobs)
      ? (it.top_logprobs as { token?: unknown; logprob?: unknown }[])
          .filter((t) => typeof t.token === "string" && typeof t.logprob === "number")
          .map((t) => ({ token: t.token as string, p: Math.exp(t.logprob as number) }))
      : [];
    out.push({ token: it.token, p: Math.exp(it.logprob), top });
  }
  return out.some((t) => t.top.length > 0) ? out : null;
}

/** Constant-time string comparison (the access code). */
export function sameSecret(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export interface CloudApiOptions {
  /** Returns the Hugging Face token or null. */
  token: () => string | null;
  /** When it returns a non-empty string, every model call must carry it in ACCESS_CODE_HEADER. */
  accessCode?: () => string | null;
  limits?: Limits;
  /** "global": one budget for the whole server (local runtime). "per-client": one per IP. */
  rateLimit?: "global" | "per-client";
  fetch?: typeof fetch;
  /** Fetch for public Hub files (tokenizers); the local runtime adds a disk cache. Defaults to `fetch`. */
  hubFetch?: typeof fetch;
  now?: () => number;
}

export interface ClientInfo {
  /** Best known client address, the rate-limit key in "per-client" mode. */
  ip: string;
}

export interface CloudApi {
  /** null when the path is not one of the cloud endpoints. */
  handle(request: Request, client: ClientInfo): Promise<Response | null>;
}

export function isCloudPath(pathname: string): boolean {
  return pathname.startsWith("/api/llm/") || pathname === "/api/embed" || pathname === "/api/tokenize";
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function errorResponse(err: unknown): Response {
  const e = err instanceof CloudError ? err : new CloudError("upstream", "Unexpected error");
  return jsonResponse(ERROR_STATUS[e.code], { error: e.code, message: e.message });
}

async function readJson(request: Request, limits: Limits): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > limits.bodyBytes) throw new CloudError("bad-request", "Request body too large");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > limits.bodyBytes) throw new CloudError("bad-request", "Request body too large");
  try {
    return JSON.parse(text || "{}");
  } catch {
    throw new CloudError("bad-request", "Body is not JSON");
  }
}

export function createCloudApi(options: CloudApiOptions): CloudApi {
  const limits = options.limits ?? LOCAL_LIMITS;
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
  const now = options.now ?? Date.now;
  const perClient = options.rateLimit === "per-client";
  const windows = new Map<string, number[]>();
  const hours = new Map<string, number[]>();
  let reachable: { value: boolean; at: number } | null = null;
  let keyInfo: { value: Omit<KeyStatus, "creditsExhausted">; at: number } | null = null;
  let paymentRefusedAt: number | null = null;

  const requiredCode = () => options.accessCode?.()?.trim() || null;

  /**
   * The hourly model budget, always per client address (in-memory: per server
   * instance). `cost` model requests are taken at once, or none.
   */
  const allowHour = (ip: string, cost = 1) => {
    const key = ip || "unknown";
    const t = now();
    if (hours.size > 5000) {
      for (const [k, list] of hours) if (!list.length || t - list[list.length - 1]! > 3_600_000) hours.delete(k);
    }
    const list = hours.get(key) ?? [];
    while (list.length && t - list[0]! > 3_600_000) list.shift();
    if (list.length + cost > limits.perHour) {
      hours.set(key, list);
      return false;
    }
    for (let i = 0; i < cost; i++) list.push(t);
    hours.set(key, list);
    return true;
  };

  const allow = (ip: string) => {
    const key = perClient ? ip || "unknown" : "*";
    const t = now();
    // Forget idle clients so a long-lived instance does not grow without bound.
    if (windows.size > 5000) {
      for (const [k, list] of windows) if (!list.length || t - list[list.length - 1]! > 60_000) windows.delete(k);
    }
    const list = windows.get(key) ?? [];
    while (list.length && t - list[0]! > 60_000) list.shift();
    if (list.length >= limits.perMinute) {
      windows.set(key, list);
      return false;
    }
    list.push(t);
    windows.set(key, list);
    return true;
  };

  const post = async (url: string, body: unknown): Promise<unknown> => {
    const key = options.token();
    if (!key) throw new CloudError("not-configured", "HF_TOKEN is not set");
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), limits.timeoutMs);
    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.ok) {
        // Upstream messages can be long; never include request headers.
        if (res.status === 402) paymentRefusedAt = now();
        const detail = (await res.text().catch(() => "")).slice(0, 200).replaceAll(key, "[token]");
        throw new CloudError("upstream", `Hugging Face answered ${res.status}${detail ? `: ${detail}` : ""}`);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof CloudError) throw err;
      if (ac.signal.aborted) throw new CloudError("timeout", `No answer within ${limits.timeoutMs / 1000} s`);
      throw new CloudError("upstream", `Network error: ${String((err as Error)?.message ?? err).slice(0, 120)}`);
    } finally {
      clearTimeout(timer);
    }
  };

  const probe = async (): Promise<boolean | null> => {
    if (reachable && now() - reachable.at < 60_000) return reachable.value;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 6000);
    try {
      // Public endpoint: no token needed to know the router is reachable.
      const res = await doFetch(STATUS_PROBE_URL, { signal: ac.signal, method: "GET" });
      reachable = { value: res.status < 500, at: now() };
      return reachable.value;
    } catch {
      // A slow answer is not proof of an outage: report unknown, ask again next time.
      if (ac.signal.aborted) return null;
      reachable = { value: false, at: now() };
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  /** whoami-v2 with the key, cached 5 minutes; only the plan and permissions are kept. */
  const checkKey = async (): Promise<KeyStatus> => {
    const exhausted = paymentRefusedAt !== null && now() - paymentRefusedAt < 15 * 60_000;
    const key = options.token();
    if (!key) return { valid: null, plan: null, inference: null, creditsExhausted: exhausted };
    if (keyInfo && now() - keyInfo.at < 5 * 60_000) return { ...keyInfo.value, creditsExhausted: exhausted };
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 6000);
    try {
      const res = await (options.hubFetch ?? doFetch)(WHOAMI_URL, { headers: { authorization: `Bearer ${key}` }, signal: ac.signal });
      if (res.status === 401 || res.status === 403) {
        keyInfo = { value: { valid: false, plan: null, inference: false }, at: now() };
      } else if (res.ok) {
        const j = (await res.json().catch(() => null)) as {
          isPro?: boolean;
          auth?: { accessToken?: { role?: string; fineGrained?: { scoped?: { permissions?: string[] }[]; global?: string[] } } };
        } | null;
        const token = j?.auth?.accessToken;
        const perms = [...(token?.fineGrained?.global ?? []), ...(token?.fineGrained?.scoped ?? []).flatMap((x) => x.permissions ?? [])];
        const inference = token?.role === "write" || token?.role === "read" ? true : perms.some((x) => x.startsWith("inference."));
        keyInfo = { value: { valid: true, plan: j?.isPro ? "pro" : "free", inference }, at: now() };
      } else {
        return { valid: null, plan: null, inference: null, creditsExhausted: exhausted };
      }
      return { ...keyInfo.value, creditsExhausted: exhausted };
    } catch {
      return { valid: null, plan: null, inference: null, creditsExhausted: exhausted };
    } finally {
      clearTimeout(timer);
    }
  };

  const status = async (request: Request, client: ClientInfo) => {
    const configured = Boolean(options.token());
    const code = requiredCode();
    const sent = request.headers.get(ACCESS_CODE_HEADER);
    const out: { configured: boolean; reachable: boolean | null; codeRequired: boolean; codeAccepted?: boolean; key?: KeyStatus } = {
      configured,
      reachable: configured ? await probe() : null,
      codeRequired: Boolean(code),
    };
    if (configured) out.key = await checkKey();
    if (code && sent !== null) {
      // Checking a code counts against the budget, so it cannot be guessed quickly.
      if (!allow(client.ip)) throw new CloudError("rate-limited", `More than ${limits.perMinute} requests in a minute`);
      out.codeAccepted = sameSecret(sent, code);
    }
    return out;
  };

  const complete = async (body: unknown) => {
    const { prompt, maxTokens, temperature } = parseCompleteBody(body, limits);
    const t0 = now();
    const json = (await post(BASE_URL, {
      model: BASE_MODEL,
      prompt,
      max_tokens: maxTokens,
      ...(temperature !== undefined ? { temperature } : {}),
    })) as Record<string, unknown>;
    const choice = (json.choices as { text?: unknown; finish_reason?: unknown }[] | undefined)?.[0];
    if (typeof choice?.text !== "string") throw new CloudError("upstream", "Unexpected answer shape");
    return {
      text: choice.text,
      finishReason: typeof choice.finish_reason === "string" ? choice.finish_reason : null,
      model: BASE_MODEL,
      provider: "featherless-ai",
      ms: now() - t0,
      usage: json.usage ?? null,
    };
  };

  const chat = async (body: unknown) => {
    const { messages, maxTokens, temperature } = parseChatBody(body, limits);
    const t0 = now();
    let lastError: unknown = null;
    for (const model of CHAT_MODELS) {
      try {
        const json = (await post(CHAT_URL, {
          model,
          messages,
          max_tokens: maxTokens,
          logprobs: true,
          top_logprobs: 5,
          ...(temperature !== undefined ? { temperature } : {}),
        })) as Record<string, unknown>;
        const choice = (json.choices as { message?: { content?: unknown }; finish_reason?: unknown; logprobs?: unknown }[] | undefined)?.[0];
        if (typeof choice?.message?.content !== "string") throw new CloudError("upstream", "Unexpected answer shape");
        return {
          text: choice.message.content,
          tokens: toTokenProbs(choice.logprobs),
          finishReason: typeof choice.finish_reason === "string" ? choice.finish_reason : null,
          model: model.split(":")[0],
          provider: model.split(":")[1] ?? "",
          ms: now() - t0,
          usage: json.usage ?? null,
        };
      } catch (err) {
        lastError = err;
        if (err instanceof CloudError && (err.code === "not-configured" || err.code === "bad-request")) throw err;
      }
    }
    throw lastError instanceof CloudError ? lastError : new CloudError("upstream", String(lastError));
  };

  const next = async (body: unknown) => {
    const { prompt, temperature } = parseNextBody(body, limits);
    const t0 = now();
    const json = (await post(NEXT_URL, {
      model: NEXT_MODEL,
      prompt,
      max_tokens: 1,
      temperature,
      logprobs: NEXT_TOP,
    })) as Record<string, unknown>;
    const choice = (json.choices as { logprobs?: unknown }[] | undefined)?.[0];
    const parsed = toNextCandidates(choice?.logprobs);
    if (!parsed) throw new CloudError("upstream", "Unexpected answer shape");
    return { ...parsed, model: NEXT_MODEL_LABEL, provider: "together", ms: now() - t0 };
  };

  /**
   * Streams one rung: tries its targets in order until one answers, and
   * reports every word as it arrives. Never throws: failures become an
   * "error" event for this rung only.
   */
  const runRung = async (rung: LadderRung, question: string, key: string, send: (e: LadderEvent) => void, outer: AbortSignal) => {
    const t0 = now();
    const ac = new AbortController();
    const onAbort = () => ac.abort();
    outer.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => ac.abort(), limits.ladderTimeoutMs);
    let started = false;
    let lastError: CloudError = new CloudError("upstream", "No provider answered");
    try {
      // A provider that is busy right now gets one more try before the next one.
      const attempts = rung.targets.flatMap((target) => [
        { target, retry: false },
        { target, retry: true },
      ]);
      let busy = false;
      for (const { target, retry } of attempts) {
        if (ac.signal.aborted) break;
        if (retry && !busy) continue;
        if (retry) await new Promise((r) => setTimeout(r, LADDER_RETRY_MS));
        busy = false;
        try {
          const res = await doFetch(target.url, {
            method: "POST",
            headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
            body: JSON.stringify(ladderPayload(rung, target, question, limits)),
            signal: ac.signal,
          });
          if (!res.ok || !res.body) {
            const detail = (await res.text().catch(() => "")).slice(0, 200).replaceAll(key, "[token]");
            throw new CloudError("upstream", `Hugging Face answered ${res.status}${detail ? `: ${detail}` : ""}`);
          }
          send({ type: "start", rung: rung.id, model: rung.hubId, provider: target.provider });
          const seen: { finishReason: string | null; reasoning: boolean; error: string | null } = {
            finishReason: null,
            reasoning: false,
            error: null,
          };
          await readSse(res.body, (data) => {
            const d = parseStreamData(data);
            if (!d) return;
            if (d.error) seen.error ??= d.error;
            if (d.reasoning && !seen.reasoning) {
              seen.reasoning = true;
              send({ type: "reasoning", rung: rung.id });
            }
            if (d.text) {
              started = true;
              send({ type: "text", rung: rung.id, text: d.text });
            }
            if (d.finishReason) seen.finishReason = d.finishReason;
          });
          if (seen.error) throw new CloudError("upstream", seen.error.replaceAll(key, "[token]"));
          send({ type: "done", rung: rung.id, finishReason: seen.finishReason, ms: now() - t0 });
          return;
        } catch (err) {
          lastError =
            err instanceof CloudError
              ? err
              : ac.signal.aborted
                ? new CloudError("timeout", `No full answer within ${limits.ladderTimeoutMs / 1000} s`)
                : new CloudError("upstream", `Network error: ${String((err as Error)?.message ?? err).slice(0, 120)}`);
          // Words already shown cannot be taken back: no second try then.
          if (started) break;
          busy = isBusy(lastError.message);
        }
      }
      if (!outer.aborted) send({ type: "error", rung: rung.id, error: lastError.code, message: lastError.message });
    } finally {
      clearTimeout(timer);
      outer.removeEventListener("abort", onAbort);
    }
  };

  /** Every rung at once, one NDJSON line per event, as the words arrive. */
  const ladder = async (body: unknown): Promise<Response> => {
    const { question } = parseLadderBody(body, limits);
    const key = options.token();
    if (!key) throw new CloudError("not-configured", "HF_TOKEN is not set");
    const ac = new AbortController();
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (e: LadderEvent) => {
          if (ac.signal.aborted) return;
          try {
            controller.enqueue(enc.encode(`${JSON.stringify(e)}\n`));
          } catch {
            ac.abort();
          }
        };
        await Promise.all(LADDER.map((rung) => runRung(rung, question, key, send, ac.signal)));
        send({ type: "end" });
        try {
          controller.close();
        } catch {
          /* already cancelled */
        }
      },
      cancel() {
        // The client left: stop paying for answers nobody reads.
        ac.abort();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
    });
  };

  const tokenize = async (body: unknown) => {
    const { text, tokenizer } = parseTokenizeBody(body, limits);
    const t0 = now();
    let tok;
    try {
      tok = await loadCloudTokenizer(tokenizer, options.hubFetch ?? doFetch);
    } catch (err) {
      throw new CloudError("upstream", `Tokenizer unavailable: ${String((err as Error)?.message ?? err).slice(0, 120)}`);
    }
    return { tokenizer, label: CLOUD_TOKENIZERS[tokenizer].label, tokens: tokenizeWith(tok, text), ms: now() - t0 };
  };

  const embed = async (body: unknown) => {
    const { texts } = parseEmbedBody(body, limits);
    const t0 = now();
    const json = await post(EMBED_URL, { inputs: texts });
    const vectors = toSentenceVectors(json, texts.length);
    if (!vectors) throw new CloudError("upstream", "Unexpected answer shape");
    return { model: EMBED_MODEL, dims: vectors[0]!.length, vectors: vectors.map(roundVector), ms: now() - t0 };
  };

  const routes: Record<string, (body: unknown) => Promise<unknown>> = {
    "/api/llm/complete": complete,
    "/api/llm/chat": chat,
    "/api/llm/next": next,
    "/api/llm/ladder": ladder,
    "/api/embed": embed,
    "/api/tokenize": tokenize,
  };
  /** Free to serve: the tokenizer files are public, no Hugging Face token involved. */
  const tokenless = new Set(["/api/tokenize"]);
  /** Model requests one call makes, for the hourly budget (default 1). */
  const cost: Record<string, number> = { "/api/llm/ladder": LADDER.length };

  return {
    async handle(request, client) {
      const { pathname } = new URL(request.url);
      if (!isCloudPath(pathname)) return null;
      try {
        if (pathname === "/api/llm/status") {
          if (request.method !== "GET") throw new CloudError("not-found", "Use GET");
          return jsonResponse(200, await status(request, client));
        }
        const route = routes[pathname];
        if (!route || request.method !== "POST") throw new CloudError("not-found", "Unknown endpoint");
        const code = requiredCode();
        if (code && !sameSecret(request.headers.get(ACCESS_CODE_HEADER) ?? "", code)) {
          if (!allow(client.ip)) throw new CloudError("rate-limited", `More than ${limits.perMinute} requests in a minute`);
          throw new CloudError("access-code", "An access code is required");
        }
        const body = await readJson(request, limits);
        if (!tokenless.has(pathname) && !options.token()) throw new CloudError("not-configured", "HF_TOKEN is not set");
        if (!allow(client.ip)) throw new CloudError("rate-limited", `More than ${limits.perMinute} requests in a minute`);
        if (!tokenless.has(pathname) && !allowHour(client.ip, cost[pathname] ?? 1)) {
          throw new CloudError("rate-limited", `More than ${limits.perHour} model requests in an hour from this address`);
        }
        const out = await route(body);
        return out instanceof Response ? out : jsonResponse(200, out);
      } catch (err) {
        return errorResponse(err);
      }
    },
  };
}
