import { describe, expect, it, vi } from "vitest";
import { AUDIENCE_HEADER, AUDIENCE_LIMITS, createCloudApi, PUBLIC_LIMITS } from "./core.ts";

const FAKE = "fake-test-token";
const PHONE_A = "phone-aaaaaaaa";
const PHONE_B = "phone-bbbbbbbb";
const ROOM = "203.0.113.77";
const PER_MINUTE = AUDIENCE_LIMITS.limits.perMinute;

const aud = (device: string) => ({ [AUDIENCE_HEADER]: device });

function req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://exhibit.example${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function call(api: ReturnType<typeof createCloudApi>, r: Request, ip: string) {
  const res = (await api.handle(r, { ip }))!;
  const raw = await res.text();
  const json = (res.headers.get("content-type") ?? "").startsWith("application/json") ? (JSON.parse(raw) as Record<string, unknown>) : {};
  return { status: res.status, json };
}

function sse(text: string) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: "stop" }] })}\n\n`));
        c.close();
      },
    }),
    { status: 200 },
  );
}

function setup() {
  const f = vi.fn(async (_u: string | URL | Request, i?: RequestInit) => {
    const body = JSON.parse(String(i?.body ?? "{}")) as { stream?: boolean };
    if (body.stream) return sse("x");
    return new Response(JSON.stringify({ choices: [{ text: "x", message: { content: "x" } }] }), { status: 200, headers: { "content-type": "application/json" } });
  });
  let t = 0;
  const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch, limits: PUBLIC_LIMITS, rateLimit: "per-client", now: () => t });
  return { api, f, at: (ms: number) => (t = ms) };
}

const base = (device?: string) => req("POST", "/api/llm/complete", { prompt: "a", maxTokens: 5000 }, device ? aud(device) : {});
const ladder = (device: string) => req("POST", "/api/llm/ladder", { question: "Hi" }, aud(device));

describe("audience requests", () => {
  it("have no hourly budget on the server: the quota lives on the phone", async () => {
    const { api, f, at } = setup();
    // Far more than any phone quota, spread so the anti-burst cap never trips.
    for (let i = 0; i < 40; i++) {
      at(i * 30_000);
      expect((await call(api, base(PHONE_A), ROOM)).status).toBe(200);
    }
    // Smaller answers than the presenter's.
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body)).max_tokens).toBe(AUDIENCE_LIMITS.limits.maxTokens);
    const status = await call(api, req("GET", "/api/llm/status", undefined, aud(PHONE_A)), ROOM);
    expect(status.json).not.toHaveProperty("audience");
    expect(status.json).toMatchObject({ configured: true });
  });

  it("stop a burst from one device, a ladder question counting one, and take nothing from the presenter", async () => {
    const { api, f, at } = setup();
    at(0);
    expect((await call(api, ladder(PHONE_A), ROOM)).status).toBe(200);
    for (let i = 1; i < PER_MINUTE; i++) expect((await call(api, base(PHONE_A), ROOM)).status).toBe(200);
    f.mockClear();
    const burst = await call(api, base(PHONE_A), ROOM);
    expect(burst.status).toBe(429);
    expect(burst.json).toMatchObject({ error: "rate-limited" });
    expect(f).not.toHaveBeenCalled();
    // Another phone on the same Wi-Fi, and the presenter at the same address, are not affected.
    expect((await call(api, base(PHONE_B), ROOM)).status).toBe(200);
    for (let i = 0; i < PUBLIC_LIMITS.perMinute; i++) expect((await call(api, base(), ROOM)).status).toBe(200);
    at(61_000);
    expect((await call(api, base(PHONE_A), ROOM)).status).toBe(200);
    expect(PER_MINUTE).toBeLessThan(PUBLIC_LIMITS.perMinute);
  });

  it("keep tokenizing out of the model cap", async () => {
    const { api, at } = setup();
    at(0);
    for (let i = 0; i < PER_MINUTE; i++) await call(api, base(PHONE_A), ROOM);
    // No tokenizer download in a unit test: the call fails upstream, but is not refused as a burst.
    const tok = await call(api, req("POST", "/api/tokenize", { text: "hello" }, aud(PHONE_A)), ROOM);
    expect(tok.status).not.toBe(429);
  });

  it("serve only the audience endpoints, keep the 300-character cap, refuse a malformed device id, and can be turned off", async () => {
    const { api } = setup();
    expect((await call(api, req("POST", "/api/llm/next", { prompt: "a" }, aud(PHONE_A)), ROOM)).status).toBe(404);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }, aud("bad id!")), ROOM)).status).toBe(400);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(301) }, aud(PHONE_A)), ROOM)).status).toBe(400);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(300) }, aud(PHONE_B)), ROOM)).status).toBe(200);
    const off = createCloudApi({ token: () => FAKE, fetch: vi.fn(), audience: false });
    expect((await call(off, base(PHONE_A), ROOM)).status).toBe(403);
  });
});

describe("presenter requests", () => {
  it("count tokenizing in its own, larger per-minute cap, not in the model budget", async () => {
    const { api, at } = setup();
    at(0);
    // Typing a sentence sends a tokenize request per pause: more than the model cap, never refused.
    for (let i = 0; i < PUBLIC_LIMITS.perMinute + 5; i++) {
      const tok = await call(api, req("POST", "/api/tokenize", { text: "hello" }), ROOM);
      expect(tok.status).not.toBe(429);
    }
    // The model budget is untouched.
    for (let i = 0; i < PUBLIC_LIMITS.perMinute; i++) expect((await call(api, base(), ROOM)).status).toBe(200);
    expect(PUBLIC_LIMITS.freePerMinute).toBeGreaterThan(PUBLIC_LIMITS.perMinute);
  });
});

