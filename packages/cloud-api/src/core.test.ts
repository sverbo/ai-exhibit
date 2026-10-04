import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTemplate,
  type CanonicalEmbeddingsJson,
  centerAndNormalize,
  cosine,
  decodeCanonical,
} from "../../ml-runtime/src/embeddings/index.ts";
import { Tokenizer } from "@huggingface/tokenizers";
import {
  ACCESS_CODE_HEADER,
  createCloudApi,
  isBusy,
  LADDER,
  LADDER_BASE_TOKENS,
  LADDER_REASONING_TOKENS,
  LADDER_SYSTEM,
  type LadderEvent,
  ladderPayload,
  MAX_INPUT_CHARS,
  NEXT_MODEL,
  parseLadderBody,
  parseStreamData,
  PUBLIC_LIMITS,
} from "./core.ts";
import { LADDER_MODELS } from "../../ml-runtime/src/lm/cloud.ts";
import { toSentenceVectors } from "./embed.ts";
import { forgetCloudTokenizers, tokenizeWith } from "./tokenize.ts";
import { handleVercel } from "./vercel.ts";

const here = dirname(fileURLToPath(import.meta.url));
const FAKE = "fake-test-token";

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

function req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://exhibit.example${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function call(api: ReturnType<typeof createCloudApi>, r: Request, ip = "203.0.113.5") {
  const res = await api.handle(r, { ip });
  if (!res) return { status: 0, json: null as Record<string, unknown> | null, raw: "" };
  const raw = await res.text();
  return { status: res.status, json: JSON.parse(raw) as Record<string, unknown>, raw };
}

describe("cloud API", () => {
  it("ignores other paths", async () => {
    const api = createCloudApi({ token: () => FAKE, fetch: vi.fn() });
    expect(await api.handle(req("GET", "/api/network"), { ip: "x" })).toBeNull();
  });

  it("status says only whether a token is configured, and whether a code is required", async () => {
    const f = vi.fn(async () => okJson({ data: [] }));
    const open = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    const s = await call(open, req("GET", "/api/llm/status"));
    expect(s.json).toMatchObject({ configured: true, reachable: true, codeRequired: false });
    expect(s.raw).not.toContain(FAKE);
    // The router probe is public: no token is sent with it (only Hugging Face's own whoami gets the key).
    const probeCalls = f.mock.calls.filter((c) => String((c as unknown[])[0]).includes("router.huggingface.co"));
    expect(probeCalls.length).toBeGreaterThan(0);
    expect(JSON.stringify(probeCalls)).not.toContain(FAKE);
    const none = createCloudApi({ token: () => null, accessCode: () => "1234", fetch: f as unknown as typeof fetch });
    expect((await call(none, req("GET", "/api/llm/status"))).json).toEqual({ configured: false, reachable: null, codeRequired: true });
  });

  it("requires the access code when one is set, and status can check it", async () => {
    const f = vi.fn(async () => okJson({ choices: [{ text: " ok" }] }));
    const api = createCloudApi({ token: () => FAKE, accessCode: () => "open-sesame", fetch: f as unknown as typeof fetch });
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }))).status).toBe(401);
    const wrong = await call(api, req("POST", "/api/llm/complete", { prompt: "a" }, { [ACCESS_CODE_HEADER]: "nope" }));
    expect(wrong.status).toBe(401);
    expect(wrong.json?.error).toBe("access-code");
    expect(f).not.toHaveBeenCalled();
    const right = await call(api, req("POST", "/api/llm/complete", { prompt: "a" }, { [ACCESS_CODE_HEADER]: "open-sesame" }));
    expect(right.status).toBe(200);
    const checked = await call(api, req("GET", "/api/llm/status", undefined, { [ACCESS_CODE_HEADER]: "nope" }));
    expect(checked.json).toMatchObject({ codeRequired: true, codeAccepted: false });
    const ok = await call(api, req("GET", "/api/llm/status", undefined, { [ACCESS_CODE_HEADER]: "open-sesame" }));
    expect(ok.json).toMatchObject({ codeRequired: true, codeAccepted: true });
  });

  it("applies the public caps and a budget per client", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => okJson({ choices: [{ text: "x" }] }));
    let t = 0;
    const api = createCloudApi({
      token: () => FAKE,
      fetch: f as unknown as typeof fetch,
      limits: PUBLIC_LIMITS,
      rateLimit: "per-client",
      now: () => t,
    });
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(PUBLIC_LIMITS.promptChars + 1) }))).status).toBe(400);
    await call(api, req("POST", "/api/llm/complete", { prompt: "a", maxTokens: 5000 }));
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body)).max_tokens).toBe(PUBLIC_LIMITS.maxTokens);
    for (let i = 1; i < PUBLIC_LIMITS.perMinute; i++) await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.1");
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.1")).status).toBe(200);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.1")).status).toBe(429);
    // Another visitor keeps its own budget.
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.2")).status).toBe(200);
    t = 61_000;
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.1")).status).toBe(200);
  });

  it("reports the key's validity, plan and permission, and credits refused lately, without the key", async () => {
    const whoami = { isPro: false, name: "someone", auth: { accessToken: { role: "fineGrained", fineGrained: { scoped: [{ permissions: ["inference.serverless.write"] }] } } } };
    let t = 0;
    const f = vi.fn(async (u: string | URL | Request) => {
      const url = String(u);
      if (url.includes("whoami")) return okJson(whoami);
      if (url.includes("/v1/models")) return okJson({ data: [] });
      return new Response("payment required", { status: 402 });
    });
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch, now: () => t });
    const keyOf = async () => (await call(api, req("GET", "/api/llm/status"))).json?.key as Record<string, unknown>;
    const first = await call(api, req("GET", "/api/llm/status"));
    expect(first.json?.key).toEqual({ valid: true, plan: "free", inference: true, creditsExhausted: false });
    expect(first.raw).not.toContain("someone");
    expect(first.raw).not.toContain(FAKE);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }))).status).toBe(502);
    t = 1000;
    expect((await keyOf()).creditsExhausted).toBe(true);
    t = 16 * 60_000;
    expect((await keyOf()).creditsExhausted).toBe(false);
  });

  it("says when Hugging Face refuses the key", async () => {
    const f = vi.fn(async (u: string | URL | Request) => (String(u).includes("whoami") ? new Response("no", { status: 401 }) : okJson({ data: [] })));
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    expect((await call(api, req("GET", "/api/llm/status"))).json?.key).toMatchObject({ valid: false, inference: false });
  });

  it("caps every text field at 300 characters", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => okJson({ choices: [{ text: "x" }] }));
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    expect(MAX_INPUT_CHARS).toBe(300);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(300) }))).status).toBe(200);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(301) }))).status).toBe(400);
    const long = { messages: [{ role: "user", content: "x".repeat(301) }] };
    expect((await call(api, req("POST", "/api/llm/chat", long))).status).toBe(400);
  });

  it("allows 100 model requests an hour per address, all endpoints together", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => okJson({ choices: [{ text: "x" }] }));
    let t = 0;
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch, limits: PUBLIC_LIMITS, rateLimit: "per-client", now: () => t });
    // Spread the calls so the per-minute budget never trips: only the hourly one does.
    for (let i = 0; i < PUBLIC_LIMITS.perHour; i++) {
      t = i * 10_000;
      expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.9")).status).toBe(200);
    }
    t += 10_000;
    expect((await call(api, req("POST", "/api/llm/chat", { messages: [{ role: "user", content: "a" }] }), "198.51.100.9")).status).toBe(429);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.10")).status).toBe(200);
    t = 3_600_000 + 20_000;
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.9")).status).toBe(200);
  });

  it("refuses oversized bodies before calling out", async () => {
    const f = vi.fn();
    const api = createCloudApi({ token: () => FAKE, fetch: f, limits: PUBLIC_LIMITS });
    const big = { messages: [{ role: "user", content: "x".repeat(PUBLIC_LIMITS.bodyBytes) }] };
    expect((await call(api, req("POST", "/api/llm/chat", big))).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("never echoes the token from an upstream error", async () => {
    const f = vi.fn(async () => new Response(`bad token ${FAKE}`, { status: 401 }));
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    const r = await call(api, req("POST", "/api/llm/complete", { prompt: "a" }));
    expect(r.status).toBe(502);
    expect(r.raw).not.toContain(FAKE);
  });
});

describe("/api/llm/next", () => {
  it("asks Together for the top 5 of one raw-text token and returns probabilities", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) =>
      okJson({
        choices: [
          {
            text: " How",
            logprobs: { tokens: [" How"], token_logprobs: [-2.59], top_logprobs: [{ " How": Math.log(0.075), " What": Math.log(0.04), " ": Math.log(0.06) }] },
          },
        ],
      }),
    );
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    const r = await call(api, req("POST", "/api/llm/next", { prompt: "How can I sleep better?", temperature: 0 }));
    expect(r.status).toBe(200);
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toBe("https://router.huggingface.co/together/v1/completions");
    expect(JSON.parse(String(init!.body))).toEqual({ model: NEXT_MODEL, prompt: "How can I sleep better?", max_tokens: 1, temperature: 0, logprobs: 5 });
    const body = r.json as { token: string; candidates: { text: string; p: number }[] };
    expect(body.token).toBe(" How");
    expect(body.candidates.map((c) => c.text)).toEqual([" How", " ", " What"]);
    expect(body.candidates[0]!.p).toBeCloseTo(0.075);
  });

  it("reports an answer without probabilities as an upstream error", async () => {
    const f = vi.fn(async () => okJson({ choices: [{ text: " How", logprobs: null }] }));
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    expect((await call(api, req("POST", "/api/llm/next", { prompt: "a" }))).status).toBe(502);
  });
});

describe("/api/tokenize", () => {
  afterEach(() => forgetCloudTokenizers());

  it("needs no Hugging Face token, checks the pinned files and reports a failed download", async () => {
    const hub = vi.fn(async (_u: string | URL | Request) => new Response("{}", { status: 200 }));
    const api = createCloudApi({ token: () => null, fetch: vi.fn(), hubFetch: hub as unknown as typeof fetch });
    const r = await call(api, req("POST", "/api/tokenize", { text: "Hello" }));
    expect(r.status).toBe(502);
    expect(String(r.json?.message)).toContain("sha256 mismatch");
    expect(String(hub.mock.calls[0]![0])).toBe(
      "https://huggingface.co/unsloth/Meta-Llama-3.1-8B-Instruct/resolve/a2856192dd7c25b842431f39c179a6c2c2f627d1/tokenizer.json",
    );
    expect((await call(api, req("POST", "/api/tokenize", { text: "Hi", tokenizer: "olmo" }))).status).toBe(400);
  });

  it("gives exact character spans, byte pieces included", () => {
    const chars = ["H", "e", "l", "o", "\u0120", "w", "r", "d", "\u00f0", "\u0141", "\u00a4", "\u0138"];
    const vocab: Record<string, number> = {};
    chars.forEach((c, i) => (vocab[c] = i));
    const merges = ["H e", "l l", "He ll", "Hell o", "\u0120 w", "o r", "\u0120w or", "\u0120wor l", "\u0120worl d"];
    for (const m of merges) vocab[m.replace(" ", "")] = Object.keys(vocab).length;
    const tokenizer = new Tokenizer(
      {
        version: "1.0",
        added_tokens: [],
        normalizer: null,
        pre_tokenizer: { type: "ByteLevel", add_prefix_space: false, trim_offsets: true, use_regex: true },
        post_processor: null,
        decoder: { type: "ByteLevel" },
        model: { type: "BPE", vocab, merges, dropout: null, unk_token: null, continuing_subword_prefix: "", end_of_word_suffix: "", fuse_unk: false, byte_fallback: false },
      },
      {},
    );
    expect(tokenizeWith(tokenizer, "Hello world")).toEqual([
      { id: 15, start: 0, end: 5 },
      { id: 20, start: 5, end: 11 },
    ]);
    const robot = tokenizeWith(tokenizer, "Hello \u{1F916}");
    expect(robot.filter((t) => t.partial).map((t) => t.bytes)).toEqual(["F0", "9F", "A4", "96"]);
  });
});

describe("/api/embed", () => {
  const fixture = JSON.parse(readFileSync(resolve(here, "fixtures/embed-hf.json"), "utf8")) as {
    words: string[];
    texts: string[];
    answer: unknown;
  };
  const canonical = JSON.parse(
    readFileSync(resolve(here, "../../../content/assets/embeddings/canonical.json"), "utf8"),
  ) as CanonicalEmbeddingsJson;
  const space = decodeCanonical(canonical);

  it("sends the templated texts and returns normalised vectors in the vocabulary's space", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => okJson(fixture.answer));
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    const texts = fixture.words.map((w) => applyTemplate(canonical.model.template, w));
    expect(texts).toEqual(fixture.texts);
    const r = await call(api, req("POST", "/api/embed", { texts }));
    expect(r.status).toBe(200);
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction",
    );
    expect(JSON.parse(String(init!.body))).toEqual({ inputs: texts });
    const body = r.json as { dims: number; vectors: number[][] };
    expect(body.dims).toBe(canonical.dims);
    fixture.words.forEach((word, i) => {
      const v = body.vectors[i]!;
      expect(Math.hypot(...v)).toBeCloseTo(1, 4);
      // Same treatment as a live browser query (locateQuery): centre, normalise, compare.
      const located = centerAndNormalize(Float32Array.from(v), canonical.centering.mean);
      const stored = space.vectors[space.items.findIndex((it) => it.text === word)]!;
      expect(cosine(located, stored)).toBeGreaterThan(0.99);
    });
  });

  it("validates the texts", async () => {
    const api = createCloudApi({ token: () => FAKE, fetch: vi.fn(), limits: PUBLIC_LIMITS });
    expect((await call(api, req("POST", "/api/embed", { texts: [] }))).status).toBe(400);
    expect((await call(api, req("POST", "/api/embed", { texts: ["a", "b", "c", "d", "e"] }))).status).toBe(400);
    expect((await call(api, req("POST", "/api/embed", { texts: ["x".repeat(PUBLIC_LIMITS.embedChars + 1)] }))).status).toBe(400);
  });

  it("mean-pools a token-level answer", () => {
    const [v] = toSentenceVectors([[[1, 0], [0, 1]]], 1)!;
    expect(v![0]).toBeCloseTo(Math.SQRT1_2);
    expect(toSentenceVectors([[1, 2]], 2)).toBeNull();
  });
});

describe("Vercel entry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reads the token and the access code from the environment", async () => {
    vi.stubEnv("HF_TOKEN", FAKE);
    vi.stubEnv("AI_EXHIBIT_ACCESS_CODE", "");
    const f = vi.fn(async () => okJson({ data: [] }));
    vi.stubGlobal("fetch", f);
    const res = await handleVercel(req("GET", "/api/llm/status", undefined, { "x-real-ip": "203.0.113.9" }));
    expect(await res.json()).toMatchObject({ configured: true, reachable: true, codeRequired: false });
    vi.stubEnv("AI_EXHIBIT_ACCESS_CODE", "s3cret");
    const locked = await handleVercel(req("POST", "/api/llm/chat", { messages: [{ role: "user", content: "hi" }] }));
    expect(locked.status).toBe(401);
    expect((await handleVercel(req("GET", "/api/other"))).status).toBe(404);
  });
});

/** A streamed upstream answer: one server-sent event per item, optionally split mid-line. */
function sse(chunks: unknown[], opts: { split?: boolean } = {}): Response {
  const text = chunks.map((c) => `data: ${typeof c === "string" ? c : JSON.stringify(c)}\n\n`).join("");
  const enc = new TextEncoder();
  const parts = opts.split ? [text.slice(0, 7), text.slice(7, 40), text.slice(40)] : [text];
  return new Response(
    new ReadableStream({
      start(c) {
        for (const p of parts) c.enqueue(enc.encode(p));
        c.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

const chatDelta = (content: string, finish: string | null = null) => ({ choices: [{ delta: { content }, finish_reason: finish }] });

async function ladderEvents(res: Response): Promise<LadderEvent[]> {
  const text = await res.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LadderEvent);
}

describe("/api/llm/ladder", () => {
  it("has the same rungs, in the same order, as the browser's labels", () => {
    expect(LADDER.map((r) => r.id)).toEqual(LADDER_MODELS.map((m) => m.id));
    expect(LADDER.map((r) => r.kind)).toEqual(LADDER_MODELS.map((m) => m.kind));
  });

  it("validates the question", () => {
    expect(() => parseLadderBody({})).toThrow(/required/);
    expect(() => parseLadderBody({ question: "   " })).toThrow(/required/);
    expect(() => parseLadderBody({ question: 42 })).toThrow(/required/);
    expect(() => parseLadderBody({ question: "x".repeat(MAX_INPUT_CHARS + 1) })).toThrow(/too long/);
    expect(parseLadderBody({ question: `  ${"x".repeat(MAX_INPUT_CHARS - 2)}` })).toEqual({ question: "x".repeat(MAX_INPUT_CHARS - 2) });
  });

  it("asks the base rung with a Q/A text and the chat rungs with the same short instruction, capped", () => {
    const [base, small, reasoning] = LADDER;
    const b = ladderPayload(base!, base!.targets[0]!, "Why?", PUBLIC_LIMITS);
    expect(b).toMatchObject({ prompt: "Q: Why?\nA:", max_tokens: LADDER_BASE_TOKENS, stream: true });
    const c = ladderPayload(small!, small!.targets[0]!, "Why?", PUBLIC_LIMITS);
    expect(c).toMatchObject({
      messages: [
        { role: "system", content: LADDER_SYSTEM },
        { role: "user", content: "Why?" },
      ],
      max_tokens: PUBLIC_LIMITS.maxTokens,
    });
    const r = ladderPayload(reasoning!, reasoning!.targets[0]!, "Why?", PUBLIC_LIMITS);
    expect(r.max_tokens).toBe(PUBLIC_LIMITS.maxTokens + LADDER_REASONING_TOKENS);
  });

  it("reads chat, completion, reasoning and error frames", () => {
    expect(parseStreamData("[DONE]")).toBeNull();
    expect(parseStreamData("not json")).toBeNull();
    expect(parseStreamData(JSON.stringify(chatDelta("Hi")))).toEqual({ text: "Hi", reasoning: false, finishReason: null, error: null });
    expect(parseStreamData(JSON.stringify({ choices: [{ text: " 15", finish_reason: "stop" }] }))).toMatchObject({ text: " 15", finishReason: "stop" });
    expect(parseStreamData(JSON.stringify({ choices: [{ delta: { reasoning: "We need" } }] }))).toMatchObject({ text: "", reasoning: true });
    expect(parseStreamData(JSON.stringify({ error: { message: "overloaded" } }))).toMatchObject({ error: "overloaded" });
  });

  it("streams every rung's words as NDJSON, falls back per rung, and reports a failing rung on its own", async () => {
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init!.body)) as { model: string };
      // The only provider of the base rung is busy, twice.
      if (String(url).includes("featherless-ai/v1/completions")) return new Response(`overloaded ${FAKE}`, { status: 503 });
      if (body.model === "meta-llama/Llama-3.1-8B-Instruct:nscale") return new Response("down", { status: 500 });
      if (body.model.includes("gpt-oss")) {
        // Together-style chunks repeat the words in "text": they must be read once.
        return sse(
          [
            { choices: [{ text: "", delta: { content: "", reasoning: "clock" } }] },
            { choices: [{ text: "3", delta: { content: "3", reasoning: null }, finish_reason: "stop" }] },
            "[DONE]",
          ],
          { split: true },
        );
      }
      return sse([chatDelta("Fif"), chatDelta("teen", "length")]);
    });
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    const res = await api.handle(req("POST", "/api/llm/ladder", { question: "When ten plus four is two, what is nine plus six?" }), { ip: "x" });
    expect(res!.status).toBe(200);
    expect(res!.headers.get("content-type")).toContain("application/x-ndjson");
    const events = await ladderEvents(res!);
    expect(JSON.stringify(events)).not.toContain(FAKE);
    const textOf = (rung: string) =>
      events
        .filter((e) => e.type === "text" && e.rung === rung)
        .map((e) => (e as { text: string }).text)
        .join("");
    expect(textOf("llama-3.1-8b")).toBe("Fifteen");
    expect(textOf("gpt-oss-120b")).toBe("3");
    expect(events).toContainEqual({ type: "start", rung: "llama-3.1-8b", model: "meta-llama/Llama-3.1-8B-Instruct", provider: "novita" });
    expect(events).toContainEqual({ type: "reasoning", rung: "gpt-oss-120b" });
    expect(events).toContainEqual(expect.objectContaining({ type: "done", rung: "llama-3.1-8b", finishReason: "length" }));
    expect(events).toContainEqual(expect.objectContaining({ type: "error", rung: "qwen2.5-0.5b-base", error: "upstream" }));
    expect(events.at(-1)).toEqual({ type: "end" });
    // Base: two tries at its busy provider; 8B: nscale, then novita; gpt-oss: one call.
    expect(f).toHaveBeenCalledTimes(5);
  });

  it("asks three models of increasing size, with a fallback provider where one exists", () => {
    expect(LADDER.map((r) => r.hubId)).toEqual(["Qwen/Qwen2.5-0.5B", "meta-llama/Llama-3.1-8B-Instruct", "openai/gpt-oss-120b"]);
    expect(LADDER[1]!.targets.length).toBeGreaterThan(1);
    expect(LADDER[2]!.targets.length).toBeGreaterThan(1);
  });

  it("tries a busy provider once more, and only a busy one", () => {
    expect(isBusy("Hugging Face answered 503: overloaded")).toBe(true);
    expect(isBusy("Hugging Face answered 429")).toBe(true);
    expect(isBusy("meta-llama/Llama-3.2-1B-Instruct is temporarily at capacity. Please try again shortly.")).toBe(true);
    expect(isBusy("Hugging Face answered 400: model not supported")).toBe(false);
  });

  it("counts one model request per rung in the hourly budget", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => okJson({ choices: [{ text: "x" }] }));
    let t = 0;
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch, limits: PUBLIC_LIMITS, rateLimit: "per-client", now: () => t });
    const used = PUBLIC_LIMITS.perHour - LADDER.length + 1;
    for (let i = 0; i < used; i++) {
      t = i * 10_000;
      expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.20")).status).toBe(200);
    }
    // Fewer requests left than rungs: refused as a whole, before calling out.
    f.mockClear();
    t += 10_000;
    expect((await call(api, req("POST", "/api/llm/ladder", { question: "Hi" }), "198.51.100.20")).status).toBe(429);
    expect(f).not.toHaveBeenCalled();
    // The refused ladder took nothing: the requests left are still there.
    for (let i = 0; i < LADDER.length - 1; i++) {
      t += 10_000;
      expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.20")).status).toBe(200);
    }
    t += 10_000;
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }), "198.51.100.20")).status).toBe(429);
  });

  it("refuses a long question, and says when no token is set, without calling out", async () => {
    const f = vi.fn();
    const api = createCloudApi({ token: () => FAKE, fetch: f });
    expect((await call(api, req("POST", "/api/llm/ladder", { question: "x".repeat(301) }))).status).toBe(400);
    const none = createCloudApi({ token: () => null, fetch: f });
    expect((await call(none, req("POST", "/api/llm/ladder", { question: "Hi" }))).json?.error).toBe("not-configured");
    expect(f).not.toHaveBeenCalled();
  });

  it("stops the upstream calls when the client leaves", async () => {
    const signals: AbortSignal[] = [];
    const f = vi.fn(async (_u: string | URL | Request, init?: RequestInit) => {
      signals.push(init!.signal!);
      return new Response(new ReadableStream({ start() {} }), { status: 200 });
    });
    const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch });
    const res = (await api.handle(req("POST", "/api/llm/ladder", { question: "Hi" }), { ip: "x" }))!;
    const reader = res.body!.getReader();
    await vi.waitFor(() => expect(signals).toHaveLength(LADDER.length));
    await reader.cancel();
    expect(signals.every((s) => s.aborted)).toBe(true);
  });
});
