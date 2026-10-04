import { mkdtempSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createCloudLlmModule, LIMITS, readToken, toTokenProbs } from "./cloud-llm.ts";
import type { RuntimeContext } from "./http.ts";

const FAKE = "fake-test-token";
const ctx: RuntimeContext = { repoRoot: "/nonexistent", cacheRoot: "/tmp", port: 0, dev: true };

function request(
  method: string,
  path: string,
  body?: unknown,
  opts: { address?: string; host?: string; forwarded?: string; audience?: string } = {},
) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  Object.assign(req, {
    method,
    url: path,
    headers: {
      host: opts.host ?? "127.0.0.1:4404",
      ...(opts.forwarded ? { "x-forwarded-for": opts.forwarded } : {}),
      ...(opts.audience ? { "x-ai-exhibit-audience": opts.audience } : {}),
    },
    socket: { remoteAddress: opts.address ?? "127.0.0.1" },
  });
  return req;
}

function response() {
  const out = { status: 0, body: "" as string };
  const res = {
    headersSent: false,
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(chunk?: string) {
      out.body = chunk ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out, json: () => JSON.parse(out.body) as Record<string, unknown> };
}

async function call(handler: ReturnType<typeof createCloudLlmModule>, req: IncomingMessage) {
  const r = response();
  const handled = await handler(req, r.res, new URL(req.url!, "http://localhost"));
  return { handled, status: r.out.status, json: r.json, raw: r.out.body };
}

const okJson = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

describe("readToken", () => {
  it("prefers the environment, then the repo-root .env", () => {
    expect(readToken("/nonexistent", { HF_TOKEN: " env-token " })).toBe("env-token");
    const dir = mkdtempSync(join(tmpdir(), "cloud-llm-"));
    writeFileSync(join(dir, ".env"), "OTHER=1\nHF_TOKEN='file-token'\n");
    expect(readToken(dir, {})).toBe("file-token");
    expect(readToken("/nonexistent", {})).toBeNull();
  });
});

describe("cloud LLM module", () => {
  it("ignores other paths and refuses non-local clients", async () => {
    const h = createCloudLlmModule(ctx, { token: () => FAKE, fetch: vi.fn() });
    expect((await call(h, request("GET", "/api/other"))).handled).toBe(false);
    expect((await call(h, request("GET", "/api/llm/status", undefined, { address: "192.168.1.9" }))).status).toBe(403);
    // Through the dev proxy: loopback socket, but a LAN Host header.
    expect((await call(h, request("GET", "/api/llm/status", undefined, { host: "192.168.1.20:5204" }))).status).toBe(403);
    expect((await call(h, request("GET", "/api/llm/status", undefined, { forwarded: "192.168.1.20" }))).status).toBe(403);
    expect((await call(h, request("GET", "/api/llm/status", undefined, { forwarded: "127.0.0.1", host: "localhost:5204" }))).status).toBe(200);
  });

  it("lets audience phones on the LAN use the audience endpoints only, in their own budget", async () => {
    const f = vi.fn(async (u: string | URL | Request) => (String(u).includes("/v1/models") ? okJson({ data: [] }) : okJson({ choices: [{ text: " ok" }] })));
    const h = createCloudLlmModule(ctx, { token: () => FAKE, fetch: f as unknown as typeof fetch });
    const phone = { host: "192.168.1.20:5173", forwarded: "192.168.1.31", audience: "phone-1234abcd" };
    const status = await call(h, request("GET", "/api/llm/status", undefined, phone));
    expect(status.status).toBe(200);
    expect(status.json().audience).toMatchObject({ perHour: 10 });
    expect(status.raw).not.toContain(FAKE);
    expect((await call(h, request("POST", "/api/llm/complete", { prompt: "Hi" }, phone))).status).toBe(200);
    // Not an audience endpoint, and no header at all: still this machine only.
    expect((await call(h, request("POST", "/api/llm/next", { prompt: "Hi" }, phone))).status).toBe(403);
    expect((await call(h, request("POST", "/api/llm/complete", { prompt: "Hi" }, { ...phone, audience: undefined }))).status).toBe(403);
    // The presenter's budget is untouched by the phone's calls.
    for (let i = 0; i < LIMITS.perMinute; i++) {
      expect((await call(h, request("POST", "/api/llm/complete", { prompt: "Hi" }))).status).toBe(200);
    }
  });

  it("reports not-configured without a token and never calls out", async () => {
    const f = vi.fn();
    const h = createCloudLlmModule(ctx, { token: () => null, fetch: f });
    const s = await call(h, request("GET", "/api/llm/status"));
    expect(s.json()).toEqual({ configured: false, reachable: null, codeRequired: false });
    const c = await call(h, request("POST", "/api/llm/complete", { prompt: "Hi" }));
    expect(c.status).toBe(503);
    expect(c.json().error).toBe("not-configured");
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the base prompt to the completions endpoint, capped, without echoing the token", async () => {
    const f = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      okJson({ choices: [{ text: " a continuation", finish_reason: "length" }], usage: { prompt_tokens: 3, completion_tokens: 5 } }),
    );
    const h = createCloudLlmModule(ctx, { token: () => FAKE, fetch: f as unknown as typeof fetch });
    const r = await call(h, request("POST", "/api/llm/complete", { prompt: "Once upon a", maxTokens: 9999 }));
    expect(r.status).toBe(200);
    expect(r.json().text).toBe(" a continuation");
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toContain("featherless-ai/v1/completions");
    const sent = JSON.parse(String(init!.body));
    expect(sent).toMatchObject({ model: "meta-llama/Llama-3.1-8B", prompt: "Once upon a", max_tokens: LIMITS.maxTokens });
    expect((init!.headers as Record<string, string>).authorization).toBe(`Bearer ${FAKE}`);
    expect(r.raw).not.toContain(FAKE);
  });

  it("asks the chat endpoint for top-5 logprobs and falls back to the next provider", async () => {
    let n = 0;
    const f = vi.fn(async () => {
      n++;
      if (n === 1) return new Response("busy", { status: 503 });
      return okJson({
        choices: [
          {
            message: { content: "Paris." },
            finish_reason: "stop",
            logprobs: { content: [{ token: "Paris", logprob: Math.log(0.9), top_logprobs: [{ token: "Paris", logprob: Math.log(0.9) }, { token: "The", logprob: Math.log(0.05) }] }] },
          },
        ],
      });
    });
    const h = createCloudLlmModule(ctx, { token: () => FAKE, fetch: f as unknown as typeof fetch });
    const r = await call(h, request("POST", "/api/llm/chat", { messages: [{ role: "user", content: "Capital of France?" }] }));
    expect(r.status).toBe(200);
    const body = r.json();
    expect(body.text).toBe("Paris.");
    expect(body.provider).toBe("novita");
    const tokens = body.tokens as { token: string; p: number; top: { p: number }[] }[];
    expect(tokens[0]!.p).toBeCloseTo(0.9);
    expect(tokens[0]!.top).toHaveLength(2);
    const firstBody = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(firstBody).toMatchObject({ logprobs: true, top_logprobs: 5, model: "meta-llama/Llama-3.1-8B-Instruct:nscale" });
  });

  it("streams the ladder line by line instead of buffering it", async () => {
    const enc = new TextEncoder();
    const f = vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "Hi" }, finish_reason: "stop" }] })}\n\n`));
              c.close();
            },
          }),
          { status: 200 },
        ),
    );
    const h = createCloudLlmModule(ctx, { token: () => FAKE, fetch: f as unknown as typeof fetch });
    const writes: string[] = [];
    let ended = false;
    const res = {
      writeHead: () => res,
      write: (chunk: Uint8Array) => writes.push(Buffer.from(chunk).toString("utf8")),
      end: () => {
        ended = true;
      },
      on: () => res,
      off: () => res,
    } as unknown as ServerResponse;
    const req = request("POST", "/api/llm/ladder", { question: "Hi" });
    expect(await h(req, res, new URL(req.url!, "http://localhost"))).toBe(true);
    expect(ended).toBe(true);
    expect(writes.length).toBeGreaterThan(1);
    const events = writes.join("").split("\n").filter(Boolean).map((l) => JSON.parse(l) as { type: string });
    expect(events.at(-1)).toEqual({ type: "end" });
    expect(events.filter((e) => e.type === "done")).toHaveLength(3);
  });

  it("validates input and rate-limits", async () => {
    const f = vi.fn(async () => okJson({ choices: [{ text: "x" }] }));
    let t = 0;
    const h = createCloudLlmModule(ctx, { token: () => FAKE, fetch: f as unknown as typeof fetch, now: () => t });
    expect((await call(h, request("POST", "/api/llm/complete", { prompt: "" }))).status).toBe(400);
    expect((await call(h, request("POST", "/api/llm/complete", { prompt: "x".repeat(LIMITS.promptChars + 1) }))).status).toBe(400);
    expect((await call(h, request("POST", "/api/llm/chat", { messages: [{ role: "tool", content: "x" }] }))).status).toBe(400);
    for (let i = 0; i < LIMITS.perMinute; i++) await call(h, request("POST", "/api/llm/complete", { prompt: "a" }));
    const limited = await call(h, request("POST", "/api/llm/complete", { prompt: "a" }));
    expect(limited.status).toBe(429);
    t = 61_000;
    expect((await call(h, request("POST", "/api/llm/complete", { prompt: "a" }))).status).toBe(200);
  });

  it("maps upstream errors and timeouts to clear codes", async () => {
    const h = createCloudLlmModule(ctx, {
      token: () => FAKE,
      fetch: (async () => {
        throw new TypeError("fetch failed");
      }) as unknown as typeof fetch,
    });
    const r = await call(h, request("POST", "/api/llm/complete", { prompt: "a" }));
    expect(r.status).toBe(502);
    expect(r.json().error).toBe("upstream");
  });
});

describe("toTokenProbs", () => {
  it("returns null when the provider sent no top logprobs", () => {
    expect(toTokenProbs(null)).toBeNull();
    expect(toTokenProbs({ content: [{ token: "a", logprob: -1, top_logprobs: [] }] })).toBeNull();
  });
});
