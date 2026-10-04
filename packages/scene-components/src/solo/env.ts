/**
 * Solo mode: the talk's demos on one person's phone (the Play tab of the
 * audience page, docs/specs/2026-10-04-audience-play.md). No session, no
 * presenter, no roles: a demo gets this small environment instead of a
 * SceneContext, and reuses the scenes' own logic, data and copy.
 */
import type { Locale } from "@ai-exhibit/presentation-core";
import { type AudienceGame, type CloudOptions, CloudLlmError } from "@ai-exhibit/ml-runtime/lm";

/**
 * Why a live call did not answer:
 * - "busy": too many requests this minute (the device's or the room's), try again soon;
 * - "used-up": this game's asks on this device (or the room's requests) for this hour are spent;
 * - "failed": anything else (no token, network, provider), recordings from now on.
 */
export type SoloTrouble = "busy" | "used-up" | "failed";

export interface SoloEnv {
  locale: Locale;
  /** The server can answer live; false: recorded examples only. */
  live: boolean;
  /**
   * Options for a cloud call: the audience header, and for a game's call the
   * callback that records that game's asks left. Tokenizing passes no game.
   */
  cloud: (game?: AudienceGame) => CloudOptions;
  /** This device's asks left for a game this hour; null while unknown. */
  left: (game: AudienceGame) => number | null;
  /** Asks per game and device per hour; null while unknown. */
  perHour: number | null;
  /** Reports a failed live call to the page (which may turn live calls off) and says what it was. */
  report: (err: unknown) => SoloTrouble | null;
  reducedMotion: boolean;
}

/** A game may ask live: the server answers and this device still has asks for it. */
export function canAsk(env: SoloEnv, game: AudienceGame): boolean {
  return env.live && env.left(game) !== 0;
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
