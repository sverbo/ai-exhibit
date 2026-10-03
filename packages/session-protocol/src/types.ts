/**
 * Shared presentation session. Every view (projector, presenter, phone remote,
 * audience phone) is a client of one SessionState. The presenter is
 * authoritative: only clients holding the presenter token may send control
 * commands. The relay applies commands with `applyCommand` and broadcasts the
 * resulting state; it never needs to know the scene order, because clients
 * resolve "next"/"previous" into explicit `goto` commands themselves.
 */

import type { Locale } from "@ai-exhibit/presentation-core";

export type ClientRole =
  /** Projector/audience screen: display-only follower. */
  | "projector"
  /** Laptop presenter view: controller, runs heavy compute for interactive scenes. */
  | "presenter"
  /** Single-window mode: projector that is also the controller (rehearsal, one screen). */
  | "solo"
  /** Phone remote: controller without compute. */
  | "remote"
  /** Audience phone: may only send interaction responses. */
  | "audience";

export interface TimerState {
  /** Epoch ms when the timer was last started, null when paused. */
  startedAt: number | null;
  /** Elapsed ms accumulated before `startedAt`. */
  accumulatedMs: number;
}

export type PollPhase = "closed" | "open" | "results";

export interface InteractionState {
  /** Scene that opened the interaction; null when nothing is open. */
  sceneId: string | null;
  pollId: string | null;
  phase: PollPhase;
  /** optionId -> count. Never per-person data. */
  tallies: Record<string, number>;
  /** Free-text submissions (word clouds), already trimmed and length-capped. */
  words: string[];
  /** Results kept per pollId so the closing scene can compare before/after. */
  history: Record<string, Record<string, number>>;
  /**
   * Hand counts typed by the presenter (offline-friendly polls), per pollId then
   * optionId. Displayed in addition to phone votes. Absent until first used.
   */
  manual?: Record<string, Record<string, number>>;
  /**
   * Audience phones currently connected to the relay. Maintained by the relay
   * only; absent when there is no relay (BroadcastChannel mode).
   */
  audienceConnected?: number;
}

export interface SessionState {
  presentationId: string;
  editionId: string;
  locale: Locale;
  sceneId: string;
  revealStep: number;
  /** Small serializable per-scene state (inputs, computed top-k, poll phase...). */
  sceneStates: Record<string, unknown>;
  /** Scenes currently switched to their prepared fallback. */
  fallback: Record<string, boolean>;
  timer: TimerState;
  /** Projector shows black (B key). */
  blackout: boolean;
  /** Projector holds its current frame while the presenter navigates privately. */
  frozen: boolean;
  interaction: InteractionState;
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
  | { type: "openPoll"; sceneId: string; pollId: string }
  | { type: "showPollResults" }
  | { type: "closePoll" }
  /** Forgets a poll's votes, hand counts and history (rehearsal clean-up). */
  | { type: "resetPoll"; pollId: string }
  /** Replaces a poll's hand counts (optionId -> count). */
  | { type: "setManualTally"; pollId: string; tallies: Record<string, number> }
  /**
   * Starts the talk fresh: clears scene states, fallbacks, timer, blackout,
   * freeze and every poll result. Keeps presentation, edition, locale and scene.
   */
  | { type: "resetSession" }
  /** The only command an audience client may send. */
  | { type: "vote"; pollId: string; optionId?: string; word?: string; voterId: string };

/** Wire messages between clients and the relay. */
export type ClientMessage =
  | {
      kind: "hello";
      sessionId: string;
      role: ClientRole;
      token?: string;
      clientId: string;
      /** Lets a controller bootstrap a relay that has no state yet. Ignored otherwise. */
      initialState?: SessionState;
    }
  /** `id` (per-connection, increasing) is echoed back as `ack` so clients can drop it from their optimistic queue. */
  | { kind: "command"; command: SessionCommand; id?: number }
  | { kind: "ping"; t: number };

export interface ClientSummary {
  clientId: string;
  role: ClientRole;
  /** When the window joined (BroadcastChannel presence); relay lists are in joining order instead. */
  since?: number;
}

export type ServerMessage =
  | { kind: "welcome"; state: SessionState; canControl: boolean; clients: ClientSummary[] }
  /** `ack` is set only in the copy sent to the client whose command produced this state. */
  | { kind: "state"; state: SessionState; ack?: number }
  | { kind: "clients"; clients: ClientSummary[] }
  /** A rejected or no-op command carries its `ack` so the sender can drop it. */
  | { kind: "error"; message: string; ack?: number }
  | { kind: "pong"; t: number };

/**
 * Health of the active transport. "open": synced (relay connected, or
 * BroadcastChannel ready). "connecting": first attempt or reconnecting.
 * "offline": relay lost, retrying with backoff; local state keeps working.
 */
export type ConnectionStatus = "connecting" | "open" | "offline";

/** Which transport the client settled on; null while still choosing. */
export type SessionTransport = "websocket" | "broadcast";

/**
 * What views use. Implemented over WebSocket (local-runtime relay) and over
 * BroadcastChannel (same-browser windows, no server).
 */
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
  /** False until the client list is known (relay welcome, or the first presence round). */
  presenceReady(): boolean;
  /** Commands are applied optimistically for controllers, then confirmed by the relay. */
  dispatch(command: SessionCommand): void;
  subscribe(listener: () => void): () => void;
  close(): void;
}
