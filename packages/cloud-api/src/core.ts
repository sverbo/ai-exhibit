// Cloud models through the Hugging Face router, behind the same four endpoints
// wherever the app is served: the local runtime (apps/local-runtime) and the
// Vercel functions (api/). Web-standard Request/Response only, no framework.
//
//   GET  /api/llm/status    {configured, reachable, codeRequired}
//   POST /api/llm/complete  base model continuation (Llama 3.1 8B, pretraining only)
//   POST /api/llm/chat      assistant answer (Llama 3.1 8B Instruct) + top-5 probabilities per token
//   POST /api/llm/next      next-token probabilities (top 5) for raw text
//   POST /api/embed         sentence embeddings (paraphrase-multilingual-MiniLM-L12-v2)
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

  const requiredCode = () => options.accessCode?.()?.trim() || null;

  /** The hourly model budget, always per client address (in-memory: per server instance). */
  const allowHour = (ip: string) => {
    const key = ip || "unknown";
    const t = now();
    if (hours.size > 5000) {
      for (const [k, list] of hours) if (!list.length || t - list[list.length - 1]! > 3_600_000) hours.delete(k);
    }
    const list = hours.get(key) ?? [];
    while (list.length && t - list[0]! > 3_600_000) list.shift();
    if (list.length >= limits.perHour) {
      hours.set(key, list);
      return false;
    }
    list.push(t);
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

  const status = async (request: Request, client: ClientInfo) => {
    const configured = Boolean(options.token());
    const code = requiredCode();
    const sent = request.headers.get(ACCESS_CODE_HEADER);
    const out: { configured: boolean; reachable: boolean | null; codeRequired: boolean; codeAccepted?: boolean } = {
      configured,
      reachable: configured ? await probe() : null,
      codeRequired: Boolean(code),
    };
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
    "/api/embed": embed,
    "/api/tokenize": tokenize,
  };
  /** Free to serve: the tokenizer files are public, no Hugging Face token involved. */
  const tokenless = new Set(["/api/tokenize"]);

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
        if (!tokenless.has(pathname) && !allowHour(client.ip)) {
          throw new CloudError("rate-limited", `More than ${limits.perHour} model requests in an hour from this address`);
        }
        return jsonResponse(200, await route(body));
      } catch (err) {
        return errorResponse(err);
      }
    },
  };
}
