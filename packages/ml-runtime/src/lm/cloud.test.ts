import { describe, expect, it, vi } from "vitest";
import { ACCESS_CODE_HEADER, cloudChat, cloudComplete, cloudEmbed, CloudLlmError, cloudStatus } from "./cloud.ts";

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
