import { describe, expect, it, vi } from "vitest";
import {
  ACCESS_CODE_HEADER,
  AUDIENCE_HEADER,
  cloudChat,
  cloudComplete,
  cloudEmbed,
  cloudLadder,
  type CloudLadderEvent,
  CloudLlmError,
  cloudStatus,
  LADDER_MODELS,
} from "./cloud.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("cloud client", () => {
  it("reads the status", async () => {
    const f = vi.fn(async () => json(200, { configured: true, reachable: true }));
    expect(await cloudStatus({ fetch: f as unknown as typeof fetch })).toEqual({ configured: true, reachable: true });
  });

  it("posts completions and chats as JSON", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => json(200, { text: "hi", tokens: null }));
    await cloudComplete({ prompt: "Once", maxTokens: 10 }, { fetch: f as unknown as typeof fetch });
    await cloudChat({ messages: [{ role: "user", content: "Q" }] }, { fetch: f as unknown as typeof fetch });
    expect(String(f.mock.calls[0]![0])).toBe("/api/llm/complete");
    expect(JSON.parse(String(f.mock.calls[1]![1]!.body))).toEqual({ messages: [{ role: "user", content: "Q" }] });
  });

  it("sends the access code and posts texts to embed", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => json(200, { dims: 2, vectors: [[1, 0]] }));
    await cloudEmbed([": roi"], { fetch: f as unknown as typeof fetch, accessCode: "abc" });
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toBe("/api/embed");
    expect(new Headers(init!.headers).get(ACCESS_CODE_HEADER)).toBe("abc");
    expect(JSON.parse(String(init!.body))).toEqual({ texts: [": roi"] });
    const locked = vi.fn(async () => json(401, { error: "access-code", message: "An access code is required" }));
    await expect(cloudEmbed(["x"], { fetch: locked as unknown as typeof fetch, accessCode: null })).rejects.toMatchObject({ code: "access-code" });
  });

  it("turns runtime errors and network failures into codes", async () => {
    const notConfigured = vi.fn(async () => json(503, { error: "not-configured", message: "HF_TOKEN is not set" }));
    await expect(cloudComplete({ prompt: "x" }, { fetch: notConfigured as unknown as typeof fetch })).rejects.toMatchObject({
      code: "not-configured",
    });
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const err = await cloudChat({ messages: [] }, { fetch: offline as unknown as typeof fetch }).catch((e) => e);
    expect(err).toBeInstanceOf(CloudLlmError);
    expect(err.code).toBe("offline");
  });

  it("times out", async () => {
    const hang = vi.fn(
      (_u: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))),
    );
    await expect(cloudComplete({ prompt: "x" }, { fetch: hang as unknown as typeof fetch, timeoutMs: 20 })).rejects.toMatchObject({
      code: "timeout",
    });
  });
});

describe("cloudLadder", () => {
  /** An NDJSON body cut at arbitrary places, as a network delivers it. */
  const ndjson = (lines: unknown[], cuts: number[]) => {
    const text = lines.map((l) => JSON.stringify(l)).join("\n") + "\n";
    const enc = new TextEncoder();
    const bounds = [0, ...cuts, text.length];
    return new Response(
      new ReadableStream({
        start(c) {
          for (let i = 0; i < bounds.length - 1; i++) c.enqueue(enc.encode(text.slice(bounds[i], bounds[i + 1])));
          c.close();
        },
      }),
      { status: 200, headers: { "content-type": "application/x-ndjson" } },
    );
  };

  it("posts the question once, trimmed to 300 characters, and hands over each line as it arrives", async () => {
    const lines: CloudLadderEvent[] = [
      { type: "start", rung: "llama-3.1-8b", model: "meta-llama/Llama-3.1-8B-Instruct", provider: "nscale" },
      { type: "text", rung: "llama-3.1-8b", text: "Fif" },
      { type: "text", rung: "llama-3.1-8b", text: "teen" },
      { type: "done", rung: "llama-3.1-8b", finishReason: "stop", ms: 900 },
      { type: "end" },
    ];
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => ndjson(lines, [5, 70, 71, 140]));
    const seen: CloudLadderEvent[] = [];
    await cloudLadder("x".repeat(400), (e) => seen.push(e), { fetch: f as unknown as typeof fetch });
    expect(String(f.mock.calls[0]![0])).toBe("/api/llm/ladder");
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body))).toEqual({ question: "x".repeat(300) });
    expect(seen).toEqual(lines);
  });

  it("turns a refused request into a coded error", async () => {
    const f = vi.fn(async () => json(429, { error: "rate-limited", message: "More than 100 model requests in an hour from this address" }));
    await expect(cloudLadder("Hi", () => {}, { fetch: f as unknown as typeof fetch })).rejects.toMatchObject({ code: "rate-limited" });
  });

  it("marks audience calls, and only those", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => json(200, { text: "hi" }));
    await cloudComplete({ prompt: "Once" }, { fetch: f as unknown as typeof fetch, audience: "phone-1234abcd" });
    expect(new Headers(f.mock.calls[0]![1]!.headers).get(AUDIENCE_HEADER)).toBe("phone-1234abcd");
    const refused = vi.fn(async () => json(429, { error: "rate-limited", message: "Too many requests from this device in a minute" }));
    const err = await cloudComplete({ prompt: "Once" }, { fetch: refused as unknown as typeof fetch, audience: "phone-1234abcd" }).catch((e) => e);
    expect(err).toBeInstanceOf(CloudLlmError);
    expect((err as CloudLlmError).code).toBe("rate-limited");
    // The presenter's calls carry no audience header.
    await cloudComplete({ prompt: "Once" }, { fetch: f as unknown as typeof fetch });
    expect(new Headers(f.mock.calls[1]![1]!.headers).has(AUDIENCE_HEADER)).toBe(false);
  });

  it("labels every rung with a name, a size and a year", () => {
    expect(LADDER_MODELS.map((m) => m.paramsB)).toEqual([...LADDER_MODELS.map((m) => m.paramsB)].sort((a, b) => a - b));
    for (const m of LADDER_MODELS) expect(m.name && m.year >= 2019 && m.paramsB > 0).toBeTruthy();
  });
});
