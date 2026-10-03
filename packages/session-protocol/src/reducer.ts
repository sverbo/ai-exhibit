/**
 * Pure session reducer, applied by each controller window before it posts the
 * new state. It never knows the scene order: navigation arrives as explicit
 * `goto` commands.
 */

import type { Locale } from "@ai-exhibit/presentation-core";
import type { ClientRole, SessionCommand, SessionState } from "./types.ts";

const CONTROLLER_ROLES: ReadonlySet<ClientRole> = new Set(["presenter", "solo"]);

export function isControllerRole(role: ClientRole): boolean {
  return CONTROLLER_ROLES.has(role);
}

export function createInitialState(init: {
  presentationId: string;
  editionId: string;
  locale: Locale;
  sceneId: string;
}): SessionState {
  return {
    presentationId: init.presentationId,
    editionId: init.editionId,
    locale: init.locale,
    sceneId: init.sceneId,
    revealStep: 0,
    sceneStates: {},
    fallback: {},
    timer: { startedAt: null, accumulatedMs: 0 },
    blackout: false,
    frozen: false,
    version: 0,
  };
}

/** Whether `role` may send `command`: controllers send everything, the projector nothing. */
export function canSend(role: ClientRole, _command: SessionCommand): boolean {
  return isControllerRole(role);
}

/** Elapsed timer milliseconds at `now`. */
export function timerElapsed(state: SessionState, now: number): number {
  const { startedAt, accumulatedMs } = state.timer;
  return accumulatedMs + (startedAt === null ? 0 : Math.max(0, now - startedAt));
}

/**
 * Applies a command. Returns the very same object when the role may not send
 * the command or when the command changes nothing; otherwise returns a new
 * state with `version` incremented.
 */
export function applyCommand(
  state: SessionState,
  command: SessionCommand,
  role: ClientRole,
): SessionState {
  if (!canSend(role, command)) return state;
  const next = reduce(state, command);
  if (next === null) return state;
  return { ...state, ...next, version: state.version + 1 };
}

type Patch = Partial<Omit<SessionState, "version">>;

function reduce(state: SessionState, command: SessionCommand): Patch | null {
  switch (command.type) {
    case "goto": {
      const revealStep = Math.max(0, Math.floor(command.revealStep));
      if (command.sceneId === state.sceneId && revealStep === state.revealStep) return null;
      return { sceneId: command.sceneId, revealStep };
    }
    case "setSceneState": {
      if (sameJson(state.sceneStates[command.sceneId], command.state)) return null;
      return { sceneStates: { ...state.sceneStates, [command.sceneId]: command.state } };
    }
    case "setFallback": {
      if (Boolean(state.fallback[command.sceneId]) === command.on) return null;
      const fallback = { ...state.fallback };
      if (command.on) fallback[command.sceneId] = true;
      else delete fallback[command.sceneId];
      return { fallback };
    }
    case "resetScene": {
      const hasState = command.sceneId in state.sceneStates;
      const hasFallback = command.sceneId in state.fallback;
      if (!hasState && !hasFallback) return null;
      const sceneStates = { ...state.sceneStates };
      delete sceneStates[command.sceneId];
      const fallback = { ...state.fallback };
      delete fallback[command.sceneId];
      return { sceneStates, fallback };
    }
    case "timer": {
      const { startedAt, accumulatedMs } = state.timer;
      if (command.action === "start") {
        if (startedAt !== null) return null;
        return { timer: { startedAt: command.now, accumulatedMs } };
      }
      if (command.action === "pause") {
        if (startedAt === null) return null;
        return {
          timer: { startedAt: null, accumulatedMs: accumulatedMs + Math.max(0, command.now - startedAt) },
        };
      }
      if (startedAt === null && accumulatedMs === 0) return null;
      return { timer: { startedAt: null, accumulatedMs: 0 } };
    }
    case "setBlackout":
      return state.blackout === command.on ? null : { blackout: command.on };
    case "setFrozen":
      return state.frozen === command.on ? null : { frozen: command.on };
    case "setEdition": {
      if (
        state.editionId === command.editionId &&
        state.locale === command.locale &&
        state.sceneId === command.sceneId &&
        state.revealStep === 0
      ) {
        return null;
      }
      return {
        editionId: command.editionId,
        locale: command.locale,
        sceneId: command.sceneId,
        revealStep: 0,
      };
    }
    case "resetSession": {
      const fresh = createInitialState(state);
      return {
        revealStep: 0,
        sceneStates: fresh.sceneStates,
        fallback: fresh.fallback,
        timer: fresh.timer,
        blackout: false,
        frozen: false,
      };
    }
  }
}

function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
