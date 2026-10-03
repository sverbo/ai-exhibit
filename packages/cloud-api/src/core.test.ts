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
import { ACCESS_CODE_HEADER, createCloudApi, NEXT_MODEL, PUBLIC_LIMITS } from "./core.ts";
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
    expect(s.json).toEqual({ configured: true, reachable: true, codeRequired: false });
    expect(s.raw).not.toContain(FAKE);
    // The probe is public: no token is sent with it.
    expect(JSON.stringify(f.mock.calls)).not.toContain(FAKE);
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
    expect(await res.json()).toEqual({ configured: true, reachable: true, codeRequired: false });
    vi.stubEnv("AI_EXHIBIT_ACCESS_CODE", "s3cret");
    const locked = await handleVercel(req("POST", "/api/llm/chat", { messages: [{ role: "user", content: "hi" }] }));
    expect(locked.status).toBe(401);
    expect((await handleVercel(req("GET", "/api/other"))).status).toBe(404);
  });
});
