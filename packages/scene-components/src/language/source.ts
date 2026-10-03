/**
 * Which model source a scene actually uses, given the presenter's choice
 * (SceneContext.modelSource) and what the server says: Hugging Face when it
 * can answer, else Simulation (recorded real outputs), with the reason shown
 * in a badge on the controller. Nothing ever runs in the browser.
 */
import { useEffect, useState } from "react";
import { cloudStatus, type CloudStatus, getAccessCode } from "@ai-exhibit/ml-runtime/lm";
import type { ModelSource, SceneContext } from "../contract.ts";

export type FallbackWhy = "cloud-not-configured" | "cloud-offline" | "cloud-code" | "cloud-error" | "fallback-key";

export interface SourceDecision {
  requested: ModelSource;
  active: ModelSource;
  why: FallbackWhy | null;
}

/** Pure decision, tested. `cloud` is null while unknown (treated as available). */
export function decideSource(input: {
  requested: ModelSource;
  sceneFallback: boolean;
  cloud: CloudStatus | null;
  cloudFailed: boolean;
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
  else if (input.cloudFailed) why = "cloud-error";
  return why ? { requested, active: "simulation", why } : { requested, active: "hf", why: null };
}

let cached: Promise<CloudStatus> | null = null;

/** Cloud status, asked once per page (only when the presenter chose hf). */
export function useCloudStatus(enabled: boolean): CloudStatus | null {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    cached ??= cloudStatus({ accessCode: null }).catch(() => ({ configured: false, reachable: false }) as CloudStatus);
    cached.then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, [enabled]);
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
 * The whole decision for a scene's controller: status asked once, a failed
 * call switches the scene to Simulation (and the next scene asks again).
 */
export function useSourceDecision<S>(ctx: SceneContext<S>): {
  decision: SourceDecision;
  /** Call when a cloud request failed (not when it was cancelled). */
  cloudFailed: () => void;
} {
  const requested = requestedSource(ctx);
  const cloud = useCloudStatus(ctx.role === "controller" && ctx.mode === "live" && requested === "hf");
  const [failed, setFailed] = useState(false);
  const decision = decideSource({ requested, sceneFallback: ctx.mode === "fallback", cloud, cloudFailed: failed });
  return {
    decision,
    cloudFailed: () => {
      resetCloudStatus();
      setFailed(true);
    },
  };
}
