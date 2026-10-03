import { isThemeName, MODEL_SOURCES, type ModelSource, type ThemeName } from "@ai-exhibit/scene-components";
import type { SessionCommand, SessionState } from "@ai-exhibit/session-protocol";
import type { StampedTheme } from "../theme.ts";

/**
 * Shell-level settings shared through the session, stored under a reserved
 * scene-state key so every screen sees them without a protocol change.
 */
export const SHELL_KEY = "__shell";

export interface ShellState {
  /** Presenter paused animations on every screen. */
  pauseMotion?: boolean;
  /** Position the projector holds while `state.frozen` is true. */
  frozenAt?: { sceneId: string; revealStep: number };
  /**
   * The scene list the session was last driven with: a hash of the edition's
   * scene IDs and steps, and when the window that wrote it was loaded. A window
   * whose own hash differs and that was loaded earlier runs stale content.
   */
  content?: ContentStamp;
  /** Color theme every screen shows, and when the presenter chose it (epoch ms). */
  theme?: ThemeName;
  themeAt?: number;
  /** Where language demos get their model (presenter's choice for the whole talk). */
  modelSource?: ModelSource;
}

/**
 * Default before the server has answered: Simulation (recorded outputs, no
 * network). Once it answers, the default becomes Hugging Face when it has a
 * token (modelSourceDefault.ts). An explicit choice always wins.
 */
export const DEFAULT_MODEL_SOURCE: ModelSource = "simulation";

export function modelSourceOf(shell: ShellState, fallback: ModelSource = DEFAULT_MODEL_SOURCE): ModelSource {
  return MODEL_SOURCES.includes(shell.modelSource as ModelSource) ? (shell.modelSource as ModelSource) : fallback;
}

export interface ContentStamp {
  editionId: string;
  hash: string;
  /** Epoch ms when the writing window loaded its code. */
  loadedAt: number;
}

/** Short stable hash of what navigation depends on: scene IDs and step counts, in order. */
export function contentHash(editionId: string, scenes: { id: string; steps: number }[]): string {
  let h = 0x811c9dc5;
  const text = `${editionId}|${scenes.map((s) => `${s.id}:${s.steps}`).join(",")}`;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Compares this window's content with the session's. "publish": the session
 * has no stamp for this edition, or this window loaded newer content (a
 * controller writes its stamp). "stale": the session was driven by newer
 * content than this window has; the window must not navigate and should reload.
 */
export function contentDecision(shell: ShellState, local: ContentStamp): "ok" | "publish" | "stale" {
  const theirs = shell.content;
  if (!theirs || typeof theirs.hash !== "string" || theirs.editionId !== local.editionId) return "publish";
  if (theirs.hash === local.hash) return "ok";
  return local.loadedAt > theirs.loadedAt ? "publish" : "stale";
}

export function shellState(state: SessionState | null): ShellState {
  const raw = state?.sceneStates[SHELL_KEY];
  return raw && typeof raw === "object" ? (raw as ShellState) : {};
}

export function setShell(state: SessionState, patch: Partial<ShellState>): SessionCommand {
  return { type: "setSceneState", sceneId: SHELL_KEY, state: { ...shellState(state), ...patch } };
}

/** What the projector currently shows. */
export type ProjectorView =
  | { kind: "blackout" }
  | { kind: "frozen"; sceneId: string; revealStep: number }
  | { kind: "live"; sceneId: string; revealStep: number };

export function projectorView(state: SessionState): ProjectorView {
  if (state.blackout) return { kind: "blackout" };
  if (state.frozen) {
    const at = shellState(state).frozenAt;
    if (at) return { kind: "frozen", sceneId: at.sceneId, revealStep: at.revealStep };
  }
  return { kind: "live", sceneId: state.sceneId, revealStep: state.revealStep };
}

/** Commands that toggle the projector freeze, recording the held position. */
export function freezeCommands(state: SessionState, on: boolean): SessionCommand[] {
  if (!on) return [{ type: "setFrozen", on: false }];
  return [
    setShell(state, { frozenAt: { sceneId: state.sceneId, revealStep: state.revealStep } }),
    { type: "setFrozen", on: true },
  ];
}

/**
 * How a screen reconciles its own theme with the session's: the newest choice
 * wins. "adopt" means take the session's theme, "publish" means this screen's
 * choice is newer and a controller should write it to the session.
 */
export function themeDecision(shell: ShellState, local: StampedTheme): "adopt" | "publish" | null {
  const sessionAt = isThemeName(shell.theme) && typeof shell.themeAt === "number" ? shell.themeAt : 0;
  if (sessionAt > local.at) return "adopt";
  if (local.at > sessionAt) return "publish";
  return null;
}
