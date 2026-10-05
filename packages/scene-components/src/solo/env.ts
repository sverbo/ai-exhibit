/**
 * Solo mode: the talk's demos on one person's phone (the "Try it" tab of the
 * audience page, docs/specs/2026-10-04-audience-play.md). No session, no
 * presenter, no roles: a demo gets this small environment instead of a
 * SceneContext, and reuses the scenes' own logic, data and copy.
 */
import type { Locale } from "@ai-exhibit/presentation-core";
import { type CloudOptions, CloudLlmError } from "@ai-exhibit/ml-runtime/lm";

/** The demos that call a model: each counts its own asks on the phone. Tokenizing is free. */
export const SOLO_DEMOS = ["words", "base", "assistant", "ladder"] as const;
export type SoloDemo = (typeof SOLO_DEMOS)[number];

/**
 * Why a live call did not answer:
 * - "busy": too many requests from this phone this minute, try again soon;
 * - "failed": anything else (no token, network, provider), recordings from now on.
 */
export type SoloTrouble = "busy" | "failed";

export interface SoloEnv {
  locale: Locale;
  /** The server can answer live; false: recorded examples only. */
  live: boolean;
  /** Options for every cloud call: the audience header. */
  cloud: CloudOptions;
  /** This phone's asks left for a demo in the last hour. */
  left: (demo: SoloDemo) => number;
  /** Asks per demo and rolling hour. */
  perHour: number;
  /** Counts one ask for a demo (after a live answer). */
  spend: (demo: SoloDemo) => void;
  /** Reports a failed live call to the page (which may turn live calls off) and says what it was. */
  report: (err: unknown) => SoloTrouble | null;
  reducedMotion: boolean;
}

/** A demo may ask live: the server answers and this phone still has asks for it. */
export function canAsk(env: SoloEnv, demo: SoloDemo): boolean {
  return env.live && env.left(demo) > 0;
}

/** What a failed call means for the audience; null for a call the user cancelled. */
export function troubleOf(err: unknown): SoloTrouble | null {
  if (err instanceof CloudLlmError) {
    if (err.code === "rate-limited") return "busy";
    if (err.code === "timeout" && err.message === "Cancelled") return null;
  }
  if (err instanceof DOMException && err.name === "AbortError") return null;
  return "failed";
}
