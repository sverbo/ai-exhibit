import { describe, expect, it, vi } from "vitest";
import { AUDIENCE_GAMES as CLIENT_GAMES } from "../../ml-runtime/src/lm/cloud.ts";
import { AUDIENCE_GAMES, AUDIENCE_HEADER, AUDIENCE_LIMITS, createCloudApi, LADDER, PUBLIC_LIMITS, REMAINING_HEADER } from "./core.ts";

const FAKE = "fake-test-token";
const PHONE_A = "phone-aaaaaaaa";
const PHONE_B = "phone-bbbbbbbb";
const ROOM = "203.0.113.77";
const PER_GAME = AUDIENCE_LIMITS.limits.perHour;

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
  return { status: res.status, remaining: res.headers.get(REMAINING_HEADER), json };
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
  const f = vi.fn(async (u: string | URL | Request, i?: RequestInit) => {
    const body = JSON.parse(String(i?.body ?? "{}")) as { stream?: boolean; inputs?: unknown };
    if (body.stream) return sse("x");
    if (String(u).includes("feature-extraction") || body.inputs) return new Response(JSON.stringify([Array(384).fill(0.1)]), { status: 200 });
    return new Response(JSON.stringify({ choices: [{ text: "x", message: { content: "x" } }] }), { status: 200, headers: { "content-type": "application/json" } });
  });
  let t = 0;
  const api = createCloudApi({ token: () => FAKE, fetch: f as unknown as typeof fetch, limits: PUBLIC_LIMITS, rateLimit: "per-client", now: () => t });
  return { api, f, at: (ms: number) => (t = ms) };
}

const base = (device?: string) => req("POST", "/api/llm/complete", { prompt: "a", maxTokens: 5000 }, device ? aud(device) : {});
const chat = (device: string) => req("POST", "/api/llm/chat", { messages: [{ role: "user", content: "a" }] }, aud(device));
const ladder = (device: string) => req("POST", "/api/llm/ladder", { question: "Hi" }, aud(device));

describe("audience budgets", () => {
  it("names the same games as the browser client", () => {
    expect(Object.values(AUDIENCE_GAMES)).toEqual([...CLIENT_GAMES]);
  });

  it("gives each device a few asks per game and reports that game's asks left", async () => {
    const { api, f, at } = setup();
    expect(PER_GAME).toBe(5);
    for (let i = 0; i < PER_GAME; i++) {
      at(i * 30_000);
      const r = await call(api, base(PHONE_A), ROOM);
      expect(r.status).toBe(200);
      expect(r.remaining).toBe(String(PER_GAME - i - 1));
    }
    // Smaller answers than the presenter's.
    expect(JSON.parse(String(f.mock.calls[0]![1]!.body)).max_tokens).toBe(AUDIENCE_LIMITS.limits.maxTokens);
    at(PER_GAME * 30_000);
    const out = await call(api, base(PHONE_A), ROOM);
    expect(out.status).toBe(429);
    expect(out.json).toMatchObject({ error: "rate-limited", window: "hour", remaining: 0, game: "base", scope: "device" });
    // The other games keep their own asks, so do other phones and the presenter.
    const asked = await call(api, chat(PHONE_A), ROOM);
    expect(asked.status).toBe(200);
    expect(asked.remaining).toBe(String(PER_GAME - 1));
    expect((await call(api, base(PHONE_B), ROOM)).status).toBe(200);
    expect((await call(api, base(), ROOM)).status).toBe(200);
    const status = await call(api, req("GET", "/api/llm/status", undefined, aud(PHONE_A)), ROOM);
    expect(status.json.audience).toEqual({ perHour: PER_GAME, games: { words: PER_GAME, base: 0, assistant: PER_GAME - 1, ladder: PER_GAME } });
    at(3_600_000 + PER_GAME * 30_000 + 1);
    expect((await call(api, base(PHONE_A), ROOM)).status).toBe(200);
  });

  it("counts a ladder question as one ask for the device, three model requests for the room", async () => {
    const { api, at } = setup();
    for (let i = 0; i < PER_GAME; i++) {
      at(i * 30_000);
      const r = await call(api, ladder(PHONE_A), ROOM);
      expect(r.status).toBe(200);
      expect(r.remaining).toBe(String(PER_GAME - i - 1));
    }
    at(PER_GAME * 30_000);
    expect((await call(api, ladder(PHONE_A), ROOM)).json).toMatchObject({ window: "hour", game: "ladder", scope: "device" });
    // The room saw 3 model requests per question.
    const status = await call(api, req("GET", "/api/llm/status", undefined, aud(PHONE_B)), ROOM);
    const roomLeft = AUDIENCE_LIMITS.roomPerHour - PER_GAME * LADDER.length;
    expect((status.json.audience as { games: Record<string, number> }).games.ladder).toBe(Math.min(PER_GAME, Math.floor(roomLeft / LADDER.length)));
  });

  it("caps all audience devices of one address together in model requests, without touching the presenter's budget", async () => {
    const { api, f, at } = setup();
    const room = AUDIENCE_LIMITS.roomPerHour;
    let t = 0;
    for (let i = 0; i < room; i++) {
      // Many device ids (as someone resetting theirs would), each within its asks, over the hour.
      t += 15_000;
      at(t);
      expect((await call(api, base(`device-${i % (room / PER_GAME)}-xxxxxx`), ROOM)).status).toBe(200);
    }
    t += 15_000;
    at(t);
    f.mockClear();
    const full = await call(api, base("fresh-device-000"), ROOM);
    expect(full.status).toBe(429);
    expect(full.json).toMatchObject({ window: "hour", remaining: 0, scope: "room" });
    expect(f).not.toHaveBeenCalled();
    // Phones behind another address, and the presenter at this one, are not affected.
    expect((await call(api, base("fresh-device-000"), "198.51.100.200")).status).toBe(200);
    for (let i = 0; i < PUBLIC_LIMITS.perMinute; i++) expect((await call(api, base(), ROOM)).status).toBe(200);
  });

  it("has smaller per-minute caps, and a refused call takes nothing", async () => {
    const { api, at } = setup();
    at(0);
    const games = [base, chat, ladder];
    for (let i = 0; i < AUDIENCE_LIMITS.limits.perMinute; i++) expect((await call(api, games[i % 3]!(PHONE_A), ROOM)).status).toBe(200);
    const fast = await call(api, base(PHONE_A), ROOM);
    expect(fast.status).toBe(429);
    expect(fast.json).toMatchObject({ window: "minute" });
    at(61_000);
    // One base ask taken before, the refused one took nothing.
    expect((await call(api, base(PHONE_A), ROOM)).remaining).toBe(String(PER_GAME - 2));
    expect(AUDIENCE_LIMITS.limits.perMinute).toBeLessThan(PUBLIC_LIMITS.perMinute);
  });

  it("keeps tokenizing free, without a game budget", async () => {
    const { api, at } = setup();
    for (let i = 0; i < PER_GAME; i++) {
      at(i * 30_000);
      await call(api, base(PHONE_A), ROOM);
    }
    // No tokenizer download in a unit test: the call fails upstream, but is not refused for budget.
    const tok = await call(api, req("POST", "/api/tokenize", { text: "hello" }, aud(PHONE_A)), ROOM);
    expect(tok.status).not.toBe(429);
    expect(tok.remaining).toBeNull();
  });

  it("serves only the audience endpoints, keeps the 300-character cap, refuses a malformed device id, and can be turned off", async () => {
    const { api } = setup();
    expect((await call(api, req("POST", "/api/llm/next", { prompt: "a" }, aud(PHONE_A)), ROOM)).status).toBe(404);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "a" }, aud("bad id!")), ROOM)).status).toBe(400);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(301) }, aud(PHONE_A)), ROOM)).status).toBe(400);
    expect((await call(api, req("POST", "/api/llm/complete", { prompt: "x".repeat(300) }, aud(PHONE_A)), ROOM)).status).toBe(200);
    const off = createCloudApi({ token: () => FAKE, fetch: vi.fn(), audience: false });
    expect((await call(off, base(PHONE_A), ROOM)).status).toBe(403);
  });
});
