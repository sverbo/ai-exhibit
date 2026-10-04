import { describe, expect, it, vi } from "vitest";
import { AUDIENCE_HEADER, AUDIENCE_LIMITS, createCloudApi, LADDER, PUBLIC_LIMITS, REMAINING_HEADER } from "./core.ts";

const FAKE = "fake-test-token";
const PHONE_A = "phone-aaaaaaaa";
const PHONE_B = "phone-bbbbbbbb";
const ROOM = "203.0.113.77";

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
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
  return { status: res.status, remaining: res.headers.get(REMAINING_HEADER), json: JSON.parse(raw) as Record<string, unknown> };
}

function setup() {
  const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => okJson({ choices: [{ text: "x" }] }));
  let t = 0;
  const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch, limits: PUBLIC_LIMITS, rateLimit: "per-client", now: () => t });
  return { api, f, at: (ms: number) => (t = ms) };
}

const complete = (device?: string) => req("POST", "/api/llm/complete", { prompt: "a", maxTokens: 5000 }, device ? aud(device) : {});

describe("audience budgets", () => {
  it("gives each device its own hourly allowance and reports what is left", async () => {
    const { api, f, at } = setup();
    const perHour = AUDIENCE_LIMITS.limits.perHour;
    for (let i = 0; i < perHour; i++) {
      at(i * 30_000);
      const r = await call(api, complete(PHONE_A), ROOM);
      expect(r.status).toBe(200);
      expect(r.remaining).toBe(String(perHour - i - 1));
    }
    // Smaller answers than the presenter's.
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body)).max_tokens).toBe(AUDIENCE_LIMITS.limits.maxTokens);
    at(perHour * 30_000);
    const out = await call(api, complete(PHONE_A), ROOM);
    expect(out.status).toBe(429);
    expect(out.json).toMatchObject({ error: "rate-limited", window: "hour", remaining: 0 });
    expect(out.remaining).toBe("0");
    // Another phone on the same Wi-Fi keeps its own allowance, and so does the presenter.
    expect((await call(api, complete(PHONE_B), ROOM)).status).toBe(200);
    expect((await call(api, complete(), ROOM)).status).toBe(200);
    const status = await call(api, req("GET", "/api/llm/status", undefined, aud(PHONE_A)), ROOM);
    expect(status.json.audience).toEqual({ remaining: 0, perHour });
    // The audience status says nothing about the key.
    expect(status.json.key).toBeUndefined();
    at(3_600_000 + 1_000);
    expect((await call(api, complete(PHONE_A), ROOM)).status).toBe(200);
  });

  it("caps all audience devices of one address together, without touching the presenter's budget", async () => {
    const { api, at } = setup();
    const room = AUDIENCE_LIMITS.roomPerHour;
    const perDevice = AUDIENCE_LIMITS.limits.perHour;
    let t = 0;
    for (let i = 0; i < room; i++) {
      // Many device ids (as someone resetting theirs would), each within its own allowance, over the hour.
      t += 15_000;
      at(t);
      expect((await call(api, complete(`device-${i % (room / perDevice)}-xxxxxx`), ROOM)).status).toBe(200);
    }
    t += 15_000;
    at(t);
    const full = await call(api, complete("fresh-device-000"), ROOM);
    expect(full.status).toBe(429);
    expect(full.json).toMatchObject({ window: "hour", remaining: 0 });
    expect(String(full.json.message)).toMatch(/audience/);
    // Phones behind another address, and the presenter at this one, are not affected.
    expect((await call(api, complete("fresh-device-000"), "198.51.100.200")).status).toBe(200);
    for (let i = 0; i < PUBLIC_LIMITS.perMinute; i++) expect((await call(api, complete(), ROOM)).status).toBe(200);
  });

  it("has smaller per-minute caps, and a refused call takes nothing", async () => {
    const { api, at } = setup();
    at(0);
    for (let i = 0; i < AUDIENCE_LIMITS.limits.perMinute; i++) expect((await call(api, complete(PHONE_A), ROOM)).status).toBe(200);
    const fast = await call(api, complete(PHONE_A), ROOM);
    expect(fast.status).toBe(429);
    expect(fast.json).toMatchObject({ window: "minute" });
    expect(Number(fast.json.remaining)).toBeGreaterThan(0);
    at(61_000);
    const r = await call(api, complete(PHONE_A), ROOM);
    expect(r.remaining).toBe(String(AUDIENCE_LIMITS.limits.perHour - AUDIENCE_LIMITS.limits.perMinute - 1));
    expect(AUDIENCE_LIMITS.limits.perMinute).toBeLessThan(PUBLIC_LIMITS.perMinute);
    expect(AUDIENCE_LIMITS.roomPerMinute).toBeLessThan(AUDIENCE_LIMITS.roomPerHour);
  });

  it("counts the ladder as one request per rung, refused as a whole before calling out", async () => {
    const { api, f, at } = setup();
    const perHour = AUDIENCE_LIMITS.limits.perHour;
    let t = 0;
    for (let i = 0; i < perHour - LADDER.length + 1; i++) {
      t += 30_000;
      at(t);
      expect((await call(api, complete(PHONE_A), ROOM)).status).toBe(200);
    }
    f.mockClear();
    t += 30_000;
    at(t);
    const ladder = await call(api, req("POST", "/api/llm/ladder", { question: "Hi" }, aud(PHONE_A)), ROOM);
    expect(ladder.status).toBe(429);
    expect(ladder.json).toMatchObject({ window: "hour", remaining: LADDER.length - 1 });
    expect(f).not.toHaveBeenCalled();
  });

  it("keeps tokenizing free of the hourly allowance", async () => {
    const { api, at } = setup();
    at(0);
    for (let i = 0; i < AUDIENCE_LIMITS.limits.perHour; i++) {
      at(i * 30_000);
      await call(api, complete(PHONE_A), ROOM);
    }
    // No tokenizer download in a unit test: the call fails upstream, but is not refused for budget.
    const tok = await call(api, req("POST", "/api/tokenize", { text: "hello" }, aud(PHONE_A)), ROOM);
    expect(tok.status).not.toBe(429);
  });

  it("serves only the audience endpoints, keeps the 300-character cap, refuses a malformed device id, and can be turned off", async () => {
    const { api } = setup();
    expect((await call(api, req("POST", "/api/llm/next", { prompt: "a" }, aud(PHONE_A)), ROOM)).status).toBe(404);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }, aud("bad id!")), ROOM)).status).toBe(400);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(301) }, aud(PHONE_A)), ROOM)).status).toBe(400);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(300) }, aud(PHONE_A)), ROOM)).status).toBe(200);
    const off = createCloudApi({ token: () => FAKE, fetch: vi.fn(), audience: false });
    expect((await call(off, complete(PHONE_A), ROOM)).status).toBe(403);
  });
});
