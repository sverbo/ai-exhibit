/**
 * Which model source a scene actually uses, given the presenter's choice
 * (SceneContext.modelSource) and what the server says: Hugging Face when it
 * can answer, else Simulation (recorded real outputs), with the reason shown
 * in a badge on the controller. Nothing ever runs in the browser.
 *
 * A failed call says why (too many requests, timeout, network, error). Too
 * many requests this minute is a pause, not a failure: the scene keeps
 * Hugging Face and the pause ends on its own. Any other failure switches the
 * scene to Simulation until the presenter presses "Retry Hugging Face" in the
 * badge (or the scene is opened again).
 */
import { useEffect, useReducer, useState } from "react";
import { CloudLlmError, cloudStatus, type CloudStatus, getAccessCode } from "@ai-exhibit/ml-runtime/lm";
import type { ModelSource, SceneContext } from "../contract.ts";

export type FallbackWhy =
  | "cloud-not-configured"
  | "cloud-offline"
  | "cloud-code"
  | "cloud-rate-minute"
  | "cloud-rate-hour"
  | "cloud-timeout"
  | "cloud-network"
  | "cloud-error"
  | "fallback-key";

/** Why a cloud call failed, as the badge tells it. */
export interface CloudFailure {
  kind: "rate-minute" | "rate-hour" | "timeout" | "network" | "error";
  /** When the server accepts calls again (ms since epoch), if known. */
  until?: number;
  /** The request cap that ran out, if known. */
  max?: number;
}

export interface SourceDecision {
  requested: ModelSource;
  active: ModelSource;
  /** Why the source differs from the presenter's choice, or (for "cloud-rate-minute") why Hugging Face pauses. */
  why: FallbackWhy | null;
  /** The failure behind `why`, for its details (the time it frees up, the cap). */
  failure?: CloudFailure;
}

/** Without a delay from the server, try again this much later after "too many requests this minute". */
export const RATE_LIMIT_RETRY_MS = 2000;

const WHY_OF_FAILURE: Record<CloudFailure["kind"], FallbackWhy> = {
  "rate-minute": "cloud-rate-minute",
  "rate-hour": "cloud-rate-hour",
  timeout: "cloud-timeout",
  network: "cloud-network",
  error: "cloud-error",
};

/** What a failed cloud call means for the scene. Cancelled calls never get here. */
export function classifyFailure(err: unknown, now = Date.now()): CloudFailure {
  if (err instanceof CloudLlmError) {
    if (err.code === "rate-limited") {
      const hour = err.rate?.limit === "hour";
      const wait = err.rate?.retryAfterMs ?? (hour ? undefined : RATE_LIMIT_RETRY_MS);
      return {
        kind: hour ? "rate-hour" : "rate-minute",
        ...(wait !== undefined ? { until: now + wait } : {}),
        ...(err.rate?.max ? { max: err.rate.max } : {}),
      };
    }
    if (err.code === "timeout") return { kind: "timeout" };
    if (err.code === "offline") return { kind: "network" };
  }
  return { kind: "error" };
}

/** A pause the scene waits out with Hugging Face still on (too many requests this minute). */
export function isPause(f: CloudFailure | null | undefined): f is CloudFailure {
  return f?.kind === "rate-minute";
}

/** Milliseconds until a pause ends. */
export function pauseLeftMs(f: CloudFailure, now = Date.now()): number {
  return Math.max(0, (f.until ?? now + RATE_LIMIT_RETRY_MS) - now);
}

/**
 * Whether the badge offers "Retry Hugging Face": the scene fell back because
 * a call failed or the server looked unreachable. Not for the presenter's own
 * choice, the F key, a missing token or access code, nor a pause that ends on
 * its own.
 */
export function canRetry(decision: SourceDecision): boolean {
  if (decision.active !== "simulation" || decision.requested !== "hf") return false;
  const why = decision.why;
  return why === "cloud-offline" || why === "cloud-rate-hour" || why === "cloud-timeout" || why === "cloud-network" || why === "cloud-error";
}

/** Pure decision, tested. `cloud` is null while unknown (treated as available). */
export function decideSource(input: {
  requested: ModelSource;
  sceneFallback: boolean;
  cloud: CloudStatus | null;
  /** The last failure of this scene's cloud calls, or null. */
  cloudFailed: CloudFailure | null;
  /** Whether this browser holds an access code; read from storage when omitted. */
  hasAccessCode?: boolean;
}): SourceDecision {
  const { requested } = input;
  if (input.sceneFallback) return { requested, active: "simulation", why: "fallback-key" };
  if (requested === "simulation") return { requested, active: "simulation", why: null };
  let why: FallbackWhy | null = null;
  if (input.cloud && !input.cloud.configured) why = "cloud-not-configured";
  else if (input.cloud && input.cloud.reachable === false) why = "cloud-offline";
  else if (input.cloud?.codeRequired && !(input.hasAccessCode ?? Boolean(getAccessCode()))) why = "cloud-code";
  else if (input.cloudFailed) {
    const failure = input.cloudFailed;
    const failed = WHY_OF_FAILURE[failure.kind];
    // A pause keeps Hugging Face: the badge says why calls wait.
    if (isPause(failure)) return { requested, active: "hf", why: failed, failure };
    return { requested, active: "simulation", why: failed, failure };
  }
  return why ? { requested, active: "simulation", why } : { requested, active: "hf", why: null };
}

export type FailureEvent =
  | { type: "failed"; failure: CloudFailure }
  /** The presenter asked to try Hugging Face again, or chose another source. */
  | { type: "clear" }
  /** A pause ran out (only that pause is cleared, not a later failure). */
  | { type: "pause-over"; failure: CloudFailure };

/** The scene's last failure, tested. */
export function failureReducer(current: CloudFailure | null, e: FailureEvent): CloudFailure | null {
  if (e.type === "failed") {
    // A pause never hides a failure that already switched the scene to Simulation.
    if (isPause(e.failure) && current && !isPause(current)) return current;
    return e.failure;
  }
  if (e.type === "clear") return null;
  return current === e.failure ? null : current;
}

let cached: Promise<CloudStatus> | null = null;

/** Cloud status, asked once per page (only when the presenter chose hf); `epoch` asks again. */
export function useCloudStatus(enabled: boolean, epoch = 0): CloudStatus | null {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    cached ??= cloudStatus({ accessCode: null }).catch(() => ({ configured: false, reachable: false }) as CloudStatus);
    cached.then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, [enabled, epoch]);
  return status;
}

/** Forget the cached status (after a failure, the next scene asks again). */
export function resetCloudStatus(): void {
  cached = null;
}

export function requestedSource<S>(ctx: SceneContext<S>): ModelSource {
  return ctx.modelSource ?? "simulation";
}

/**
 * The whole decision for a scene's controller: status asked once; a failed
 * call says why, a pause ends on its own, any other failure switches the
 * scene to Simulation until `retryCloud`.
 */
export function useSourceDecision<S>(ctx: SceneContext<S>): {
  decision: SourceDecision;
  /**
   * Call when a cloud request failed (not when it was cancelled), with the
   * error. Returns what it meant: check `isPause` to wait and try again.
   */
  cloudFailed: (err?: unknown) => CloudFailure;
  /** Forget the failure, ask the server's status again: the next call uses Hugging Face. */
  retryCloud: () => void;
} {
  const requested = requestedSource(ctx);
  const [epoch, setEpoch] = useState(0);
  const cloud = useCloudStatus(ctx.role === "controller" && ctx.mode === "live" && requested === "hf", epoch);
  const [failure, dispatch] = useReducer(failureReducer, null);
  // A pause ends on its own.
  useEffect(() => {
    if (!isPause(failure)) return;
    const timer = setTimeout(() => dispatch({ type: "pause-over", failure }), pauseLeftMs(failure));
    return () => clearTimeout(timer);
  }, [failure]);
  // Choosing a source again (the presenter's toggle) starts clean.
  useEffect(() => dispatch({ type: "clear" }), [requested]);
  const decision = decideSource({ requested, sceneFallback: ctx.mode === "fallback", cloud, cloudFailed: failure });
  return {
    decision,
    cloudFailed: (err?: unknown) => {
      const f = classifyFailure(err);
      // Not a pause: the next scene (or a retry) asks the server again.
      if (!isPause(f)) resetCloudStatus();
      dispatch({ type: "failed", failure: f });
      return f;
    },
    retryCloud: () => {
      resetCloudStatus();
      dispatch({ type: "clear" });
      setEpoch((n) => n + 1);
    },
  };
}
