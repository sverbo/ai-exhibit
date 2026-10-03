import type { SceneRole } from "../../contract.ts";

/** Where the sound comes out: nowhere (default), the projector, or the controller's own screen. */
export type SoundOutput = "off" | "projector" | "controller";

/**
 * Shared playback state, owned by the controller. `position` is the playhead in
 * seconds at wall-clock time `at` (ms); while playing, followers extrapolate.
 */
export interface VideoState {
  playing: boolean;
  position: number;
  at: number;
  sound: SoundOutput;
}

export const initialVideoState = (): VideoState => ({ playing: false, position: 0, at: 0, sound: "off" });

/** How often the controller republishes its position while playing, so followers correct drift. */
export const HEARTBEAT_MS = 5000;

/**
 * Elapsed time beyond which the timestamp is not trusted. Projector and
 * presenter may run on two machines whose clocks disagree; a negative or huge
 * gap means "do not extrapolate", the next heartbeat will correct the position.
 */
const MAX_TRUSTED_ELAPSED_S = 30;

/** Where the playhead should be now, according to the shared state. */
export function expectedPosition(s: VideoState, now: number, duration?: number): number {
  let pos = s.position;
  if (s.playing && s.at > 0) {
    const elapsed = (now - s.at) / 1000;
    if (elapsed > 0 && elapsed < MAX_TRUSTED_ELAPSED_S) pos += elapsed;
  }
  const max = duration && Number.isFinite(duration) ? duration : Number.POSITIVE_INFINITY;
  return Math.max(0, Math.min(max, pos));
}

/** Small drift is tolerated while playing (a seek stutters); a paused frame must match closely. */
export function needsSeek(current: number, expected: number, playing: boolean): boolean {
  return Math.abs(current - expected) > (playing ? 0.75 : 0.25);
}

/** Muted unless the sound is routed to this screen. Previews never make sound. */
export function isMuted(sound: SoundOutput, role: SceneRole): boolean {
  if (role === "display") return sound !== "projector";
  if (role === "controller") return sound !== "controller";
  return true;
}

/** "1:05" style clock. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** State after the controller presses play or pause at `position`. */
export function setPlaying(s: VideoState, playing: boolean, position: number, now: number): VideoState {
  return { ...s, playing, position, at: now };
}

/** State after the controller seeks. */
export function seekTo(s: VideoState, position: number, now: number): VideoState {
  return { ...s, position: Math.max(0, position), at: now };
}
