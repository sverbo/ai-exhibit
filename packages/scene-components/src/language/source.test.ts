import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CloudLlmError, type CloudStatus } from "@ai-exhibit/ml-runtime/lm";
import type { ModelSource } from "../contract.ts";
import { canRetry, type CloudFailure, classifyFailure, decideSource, failureReducer, isPause, pauseLeftMs, RATE_LIMIT_RETRY_MS } from "./source.ts";
import { SourceBadge, sourceWhyText } from "./ui.tsx";

const base = {
  requested: "hf" as ModelSource,
  sceneFallback: false,
  cloud: { configured: true, reachable: true } as CloudStatus | null,
  cloudFailed: null as CloudFailure | null,
  hasAccessCode: false,
};

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
    const locked = { configured: true, reachable: true, codeRequired: true };
    expect(decideSource({ ...base, cloud: locked }).why).toBe("cloud-code");
    expect(decideSource({ ...base, cloud: locked, hasAccessCode: true }).active).toBe("hf");
  });

  it("says why a call failed, and keeps Hugging Face through a pause", () => {
    const hour = { kind: "rate-hour", until: 5_000_000, max: 100 } as const;
    expect(decideSource({ ...base, cloudFailed: hour })).toEqual({ requested: "hf", active: "simulation", why: "cloud-rate-hour", failure: hour });
    expect(decideSource({ ...base, cloudFailed: { kind: "timeout" } }).why).toBe("cloud-timeout");
    expect(decideSource({ ...base, cloudFailed: { kind: "network" } }).why).toBe("cloud-network");
    expect(decideSource({ ...base, cloudFailed: { kind: "error" } })).toMatchObject({ active: "simulation", why: "cloud-error" });
    // Too many requests this minute: still Hugging Face, the badge says why calls wait.
    expect(decideSource({ ...base, cloudFailed: { kind: "rate-minute", until: 1 } })).toMatchObject({ active: "hf", why: "cloud-rate-minute" });
    // A missing token outranks a failure.
    expect(decideSource({ ...base, cloud: { configured: false, reachable: null }, cloudFailed: { kind: "error" } }).why).toBe("cloud-not-configured");
  });

  it("honours Simulation and the F key", () => {
    expect(decideSource({ ...base, requested: "simulation" })).toEqual({ requested: "simulation", active: "simulation", why: null });
    expect(decideSource({ ...base, requested: "simulation", cloudFailed: { kind: "error" } }).why).toBeNull();
    expect(decideSource({ ...base, sceneFallback: true })).toEqual({ requested: "hf", active: "simulation", why: "fallback-key" });
  });
});

describe("cloud failures", () => {
  it("reads the reason from the client's error", () => {
    const now = 1_000;
    const minute = new CloudLlmError("rate-limited", "More than 20 requests in a minute", { limit: "minute", max: 20, retryAfterMs: 7000 });
    expect(classifyFailure(minute, now)).toEqual({ kind: "rate-minute", until: 8000, max: 20 });
    // Without a delay from the server, a short default wait.
    expect(classifyFailure(new CloudLlmError("rate-limited", "x"), now)).toEqual({ kind: "rate-minute", until: now + RATE_LIMIT_RETRY_MS });
    const hour = new CloudLlmError("rate-limited", "x", { limit: "hour", max: 100, retryAfterMs: 600_000 });
    expect(classifyFailure(hour, now)).toEqual({ kind: "rate-hour", until: 601_000, max: 100 });
    expect(classifyFailure(new CloudLlmError("timeout", "The cloud model took too long"))).toEqual({ kind: "timeout" });
    expect(classifyFailure(new CloudLlmError("offline", "unreachable"))).toEqual({ kind: "network" });
    expect(classifyFailure(new CloudLlmError("upstream", "Hugging Face answered 500"))).toEqual({ kind: "error" });
    expect(classifyFailure(new Error("boom"))).toEqual({ kind: "error" });
    expect(classifyFailure(undefined)).toEqual({ kind: "error" });
    expect(isPause(classifyFailure(minute))).toBe(true);
    expect(pauseLeftMs({ kind: "rate-minute", until: 8000 }, 5000)).toBe(3000);
  });

  it("clears on retry; a pause clears itself, and only itself", () => {
    const error: CloudFailure = { kind: "error" };
    const failed = failureReducer(null, { type: "failed", failure: error });
    expect(decideSource({ ...base, cloudFailed: failed }).active).toBe("simulation");
    const retried = failureReducer(failed, { type: "clear" });
    expect(retried).toBeNull();
    expect(decideSource({ ...base, cloudFailed: retried })).toEqual({ requested: "hf", active: "hf", why: null });

    const pause: CloudFailure = { kind: "rate-minute", until: 10 };
    const paused = failureReducer(null, { type: "failed", failure: pause });
    expect(failureReducer(paused, { type: "pause-over", failure: pause })).toBeNull();
    // A failure after the pause is not cleared by the pause's timer.
    const later = failureReducer(paused, { type: "failed", failure: error });
    expect(failureReducer(later, { type: "pause-over", failure: pause })).toBe(error);
    // A pause never hides a fallback already decided.
    expect(failureReducer(error, { type: "failed", failure: pause })).toBe(error);
  });

  it("offers a retry after a failure only", () => {
    const d = (over: Partial<typeof base>) => decideSource({ ...base, ...over });
    expect(canRetry(d({ cloudFailed: { kind: "error" } }))).toBe(true);
    expect(canRetry(d({ cloudFailed: { kind: "timeout" } }))).toBe(true);
    expect(canRetry(d({ cloudFailed: { kind: "rate-hour" } }))).toBe(true);
    expect(canRetry(d({ cloud: { configured: true, reachable: false } }))).toBe(true);
    expect(canRetry(d({ cloudFailed: { kind: "rate-minute" } }))).toBe(false);
    expect(canRetry(d({ requested: "simulation" }))).toBe(false);
    expect(canRetry(d({ sceneFallback: true }))).toBe(false);
    expect(canRetry(d({ cloud: { configured: false, reachable: null } }))).toBe(false);
    expect(canRetry(d({}))).toBe(false);
  });
});

describe("SourceBadge", () => {
  const render = (decision: ReturnType<typeof decideSource>, locale: "en" | "fr" = "en") =>
    renderToStaticMarkup(createElement(SourceBadge, { decision, locale, onRetry: () => {} }));

  it("says why in plain words, in English and French", () => {
    const now = 0;
    const hour = decideSource({ ...base, cloudFailed: { kind: "rate-hour", until: 42 * 60_000, max: 100 } });
    expect(sourceWhyText(hour, "en", now)).toBe("hourly limit reached (100 requests), Hugging Face is back in about 42 min");
    expect(sourceWhyText(hour, "fr", now)).toContain("100");
    expect(sourceWhyText(hour, "fr", now)).not.toContain("hourly");
    const minute = decideSource({ ...base, cloudFailed: { kind: "rate-minute", until: 1 } });
    expect(sourceWhyText(minute, "en")).toBe("too many requests this minute: Hugging Face is back in a few seconds");
    expect(sourceWhyText(decideSource({ ...base, cloudFailed: { kind: "timeout" } }), "en")).toBe("Hugging Face did not answer in time");
    expect(sourceWhyText(decideSource({ ...base, cloudFailed: { kind: "error" } }), "en")).toBe("Hugging Face returned an error");
    for (const kind of ["rate-minute", "rate-hour", "timeout", "network", "error"] as const) {
      const fr = sourceWhyText(decideSource({ ...base, cloudFailed: { kind } }), "fr")!;
      expect(fr).not.toBe(sourceWhyText(decideSource({ ...base, cloudFailed: { kind } }), "en"));
      expect(fr).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("shows the retry button after a failure, not after the presenter's choice", () => {
    expect(render(decideSource({ ...base, cloudFailed: { kind: "error" } }))).toContain("Retry Hugging Face");
    expect(render(decideSource({ ...base, cloudFailed: { kind: "error" } }), "fr")).toContain("Réessayer");
    expect(render(decideSource({ ...base, cloudFailed: { kind: "rate-minute" } }))).not.toContain("Retry");
    expect(render(decideSource({ ...base, requested: "simulation" }))).not.toContain("Retry");
    expect(render(decideSource({ ...base, sceneFallback: true }))).not.toContain("Retry");
    expect(render(decideSource({ ...base, cloud: { configured: false, reachable: null } }))).not.toContain("Retry");
  });
});
