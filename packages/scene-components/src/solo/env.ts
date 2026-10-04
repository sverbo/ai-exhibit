/**
 * Solo mode: the talk's demos on one person's phone (the "Try it" tab of the
 * audience page, docs/specs/2026-10-04-audience-play.md). No session, no
 * presenter, no roles: a demo gets this small environment instead of a
 * SceneContext, and reuses the scenes' own logic, data and copy.
 */
import type { Locale } from "@ai-exhibit/presentation-core";
import { type AudienceDemo, type CloudOptions, CloudLlmError } from "@ai-exhibit/ml-runtime/lm";

/**
 * Why a live call did not answer:
 * - "busy": too many requests this minute (the device's or the room's), try again soon;
 * - "used-up": this demo's asks on this device (or the room's requests) for this hour are spent;
 * - "failed": anything else (no token, network, provider), recordings from now on.
 */
export type SoloTrouble = "busy" | "used-up" | "failed";

export interface SoloEnv {
  locale: Locale;
  /** The server can answer live; false: recorded examples only. */
  live: boolean;
  /**
   * Options for a cloud call: the audience header, and for a demo's call the
   * callback that records that demo's asks left. Tokenizing passes no demo.
   */
  cloud: (demo?: AudienceDemo) => CloudOptions;
  /** This device's asks left for a demo this hour; null while unknown. */
  left: (demo: AudienceDemo) => number | null;
  /** Asks per demo and device per hour; null while unknown. */
  perHour: number | null;
  /** Reports a failed live call to the page (which may turn live calls off) and says what it was. */
  report: (err: unknown) => SoloTrouble | null;
  reducedMotion: boolean;
}

/** A demo may ask live: the server answers and this device still has asks for it. */
export function canAsk(env: SoloEnv, demo: AudienceDemo): boolean {
  return env.live && env.left(demo) !== 0;
}

/** What a failed call means for the audience; null for a call the user cancelled. */
export function troubleOf(err: unknown): SoloTrouble | null {
  if (err instanceof CloudLlmError) {
    if (err.budget) return err.budget.window === "minute" ? "busy" : "used-up";
    if (err.code === "rate-limited") return "busy";
    if (err.code === "timeout" && err.message === "Cancelled") return null;
  }
  if (err instanceof DOMException && err.name === "AbortError") return null;
  return "failed";
}
