import { describe, expect, it } from "vitest";
import { decideSource } from "./source.ts";

const base = { requested: "hf" as const, sceneFallback: false, cloud: { configured: true, reachable: true }, cloudFailed: false, hasAccessCode: false };

describe("decideSource", () => {
  it("uses Hugging Face when the server can answer, or while its status is unknown", () => {
    expect(decideSource(base)).toEqual({ requested: "hf", active: "hf", why: null });
    expect(decideSource({ ...base, cloud: null }).active).toBe("hf");
  });

  it("falls back to Simulation with a reason", () => {
    expect(decideSource({ ...base, cloud: { configured: false, reachable: null } })).toEqual({
      requested: "hf",
      active: "simulation",
      why: "cloud-not-configured",
    });
    expect(decideSource({ ...base, cloud: { configured: true, reachable: false } }).why).toBe("cloud-offline");
    expect(decideSource({ ...base, cloudFailed: true }).why).toBe("cloud-error");
    const locked = { configured: true, reachable: true, codeRequired: true };
    expect(decideSource({ ...base, cloud: locked }).why).toBe("cloud-code");
    expect(decideSource({ ...base, cloud: locked, hasAccessCode: true }).active).toBe("hf");
  });

  it("honours Simulation and the F key", () => {
    expect(decideSource({ ...base, requested: "simulation" })).toEqual({ requested: "simulation", active: "simulation", why: null });
    expect(decideSource({ ...base, sceneFallback: true })).toEqual({ requested: "hf", active: "simulation", why: "fallback-key" });
  });
});
