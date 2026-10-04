/**
 * Solo mode: the talk's demos on one person's phone (the Play tab of the
 * audience page, docs/specs/2026-10-04-audience-play.md). No session, no
 * presenter, no roles: a demo gets this small environment instead of a
 * SceneContext, and reuses the scenes' own logic, data and copy.
 */
import type { Locale } from "@ai-exhibit/presentation-core";
import { type CloudOptions, CloudLlmError, LADDER_MODELS } from "@ai-exhibit/ml-runtime/lm";

/**
 * Why a live call did not answer:
 * - "busy": too many requests this minute (the device's or the room's), try again soon;
 * - "used-up": the device's (or the room's) live requests for this hour are spent;
 * - "failed": anything else (no token, network, provider), recordings from now on.
 */
export type SoloTrouble = "busy" | "used-up" | "failed";

export interface SoloEnv {
  locale: Locale;
  /** Live calls allowed (the audience budget); false: recorded examples only. */
  live: boolean;
  /** Options for every cloud call: the audience header and the budget callback. */
  cloud: CloudOptions;
  /** Reports a failed live call to the page (which may turn live calls off) and says what it was. */
  report: (err: unknown) => SoloTrouble | null;
  reducedMotion: boolean;
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

/** Model requests one ladder question costs: one per model. */
export const LADDER_COST = LADDER_MODELS.length;
