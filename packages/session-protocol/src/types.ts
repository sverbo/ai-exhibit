/**
 * Shared presentation session. The windows of one browser profile (presenter
 * view, projector, rehearsal) share one SessionState over a BroadcastChannel;
 * there is no server. Controllers apply commands with `applyCommand` and post
 * the resulting state; navigation arrives as explicit `goto` commands, so the
 * reducer never needs the scene order.
 */

import type { Locale } from "@ai-exhibit/presentation-core";

export type ClientRole =
  /** Display-only follower. */
  | "projector"
  /** Laptop presenter view: controller, runs the stage when present. */
  | "presenter"
  /** Projector or rehearsal window that is also a controller (it runs the stage when alone). */
  | "solo";

export interface TimerState {
  /** Epoch ms when the timer was last started, null when paused. */
  startedAt: number | null;
  /** Elapsed ms accumulated before `startedAt`. */
  accumulatedMs: number;
}

export interface SessionState {
  presentationId: string;
  editionId: string;
  locale: Locale;
  sceneId: string;
  revealStep: number;
  /** Small serializable per-scene state (inputs, computed top-k...). */
  sceneStates: Record<string, unknown>;
  /** Scenes currently switched to their prepared fallback. */
  fallback: Record<string, boolean>;
  timer: TimerState;
  /** Projector shows black (B key). */
  blackout: boolean;
  /** Projector holds its current frame while the presenter navigates privately. */
  frozen: boolean;
  /** Monotonic version, incremented by every applied command. */
  version: number;
}

export type SessionCommand =
  | { type: "goto"; sceneId: string; revealStep: number }
  | { type: "setSceneState"; sceneId: string; state: unknown }
  | { type: "setFallback"; sceneId: string; on: boolean }
  | { type: "resetScene"; sceneId: string }
  | { type: "timer"; action: "start" | "pause" | "reset"; now: number }
  | { type: "setBlackout"; on: boolean }
  | { type: "setFrozen"; on: boolean }
  | { type: "setEdition"; editionId: string; locale: Locale; sceneId: string }
  /**
   * Switches the talk's language on every screen. Keeps the scene, step
   * and timer; clears scene states, which may hold text in the old language.
   */
  | { type: "setLocale"; locale: Locale }
  /**
   * Starts the talk fresh: clears scene states, fallbacks, timer, blackout and
   * freeze. Keeps presentation, edition, locale and scene.
   */
  | { type: "resetSession" };

export interface ClientSummary {
  clientId: string;
  role: ClientRole;
  /** When the window joined (epoch ms). */
  since?: number;
}

/**
 * "open": synced (BroadcastChannel ready). "connecting": waiting for a
 * snapshot. "offline": no BroadcastChannel in this browser.
 */
export type ConnectionStatus = "connecting" | "open" | "offline";

/** How windows reach each other (only the BroadcastChannel now). */
export type SessionTransport = "broadcast";

/** What views use: a session shared by the windows of one browser profile. */
export interface SessionClient {
  readonly role: ClientRole;
  /** This window's id in client lists. */
  readonly clientId: string;
  getState(): SessionState | null;
  getStatus(): ConnectionStatus;
  getTransport(): SessionTransport | null;
  canControl(): boolean;
  /** Windows in the session, this one included, oldest first. */
  getClients(): ClientSummary[];
  /** False until the first presence round is over. */
  presenceReady(): boolean;
  /** Controllers apply commands at once and post the new state to the other windows. */
  dispatch(command: SessionCommand): void;
  subscribe(listener: () => void): () => void;
  close(): void;
}
