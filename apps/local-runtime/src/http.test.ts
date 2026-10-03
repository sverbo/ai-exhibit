import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import { isLoopback } from "./http.ts";

function req(remoteAddress: string, xff?: string): IncomingMessage {
  return { socket: { remoteAddress }, headers: xff ? { "x-forwarded-for": xff } : {} } as unknown as IncomingMessage;
}

describe("isLoopback", () => {
  it("accepts direct local requests", () => {
    expect(isLoopback(req("127.0.0.1"))).toBe(true);
    expect(isLoopback(req("::1"))).toBe(true);
  });
  it("rejects LAN clients, direct or through the dev proxy", () => {
    expect(isLoopback(req("192.168.1.20"))).toBe(false);
    expect(isLoopback(req("127.0.0.1", "192.168.1.20"))).toBe(false);
    expect(isLoopback(req("127.0.0.1", "127.0.0.1, 192.168.1.20"))).toBe(false);
  });
  it("accepts a local browser going through the dev proxy", () => {
    expect(isLoopback(req("127.0.0.1", "127.0.0.1"))).toBe(true);
    expect(isLoopback(req("::1", "::ffff:127.0.0.1"))).toBe(true);
  });
});
