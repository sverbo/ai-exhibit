/**
 * Pure session reducer, shared by clients (optimistic updates) and the relay
 * (authoritative). It never knows the scene order: navigation arrives as
 * explicit `goto` commands.
 */

import type { Locale } from "@ai-exhibit/presentation-core";
import type { ClientRole, InteractionState, SessionCommand, SessionState } from "./types.ts";

/** Maximum length of a submitted word, after trimming. */
export const MAX_WORD_LENGTH = 40;
/** Word submissions kept per poll; older ones are dropped first. */
export const MAX_WORDS = 500;
/** Upper bound for one hand-counted tally. */
export const MAX_MANUAL_COUNT = 100_000;

const CONTROLLER_ROLES: ReadonlySet<ClientRole> = new Set(["presenter", "solo", "remote"]);

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
    interaction: emptyInteraction({}),
    version: 0,
  };
}

/**
 * Whether `role` may send `command`. Controllers send everything except votes,
 * audience phones send only votes, the projector sends nothing.
 */
export function canSend(role: ClientRole, command: SessionCommand): boolean {
  if (role === "audience") return command.type === "vote";
  if (isControllerRole(role)) return command.type !== "vote";
  return false;
}

/** Normalizes a submitted word: collapses whitespace, trims, caps length. */
export function normalizeWord(word: string): string {
  return word.replace(/\s+/g, " ").trim().slice(0, MAX_WORD_LENGTH).trim();
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
  const ia = state.interaction;
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
    case "openPoll": {
      if (ia.pollId === command.pollId && ia.sceneId === command.sceneId && ia.phase === "open") {
        return null;
      }
      if (ia.pollId === command.pollId) {
        // Back from "results" to "open": keep the votes.
        return { interaction: { ...ia, sceneId: command.sceneId, phase: "open" } };
      }
      // Opening another poll closes the current one first. Reopening a closed
      // poll resumes its tallies, since the relay still remembers its voters.
      const closed = closeCurrent(ia);
      const resumed = closed.history[command.pollId] ?? {};
      return {
        interaction: {
          ...closed,
          sceneId: command.sceneId,
          pollId: command.pollId,
          phase: "open",
          tallies: { ...resumed },
          words: [],
        },
      };
    }
    case "showPollResults":
      if (ia.pollId === null || ia.phase !== "open") return null;
      return { interaction: { ...ia, phase: "results" } };
    case "closePoll":
      if (ia.pollId === null) return null;
      return { interaction: closeCurrent(ia) };
    case "resetPoll": {
      const isCurrent = ia.pollId === command.pollId;
      const inHistory = command.pollId in ia.history;
      const inManual = ia.manual !== undefined && command.pollId in ia.manual;
      if (!inHistory && !inManual && !(isCurrent && hasVotes(ia))) return null;
      const history = { ...ia.history };
      delete history[command.pollId];
      const interaction: InteractionState = {
        ...ia,
        history,
        tallies: isCurrent ? {} : ia.tallies,
        words: isCurrent ? [] : ia.words,
      };
      if (ia.manual) {
        const manual = { ...ia.manual };
        delete manual[command.pollId];
        interaction.manual = manual;
      }
      return { interaction };
    }
    case "setManualTally": {
      const tallies = cleanTallies(command.tallies);
      const current = ia.manual?.[command.pollId];
      if (sameJson(current ?? {}, tallies)) return null;
      const manual = { ...ia.manual };
      if (Object.keys(tallies).length === 0) delete manual[command.pollId];
      else manual[command.pollId] = tallies;
      return { interaction: { ...ia, manual } };
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
        interaction: emptyInteraction(ia),
      };
    }
    case "vote": {
      if (ia.phase !== "open" || ia.pollId === null || ia.pollId !== command.pollId) return null;
      if (typeof command.optionId === "string" && command.optionId.length > 0) {
        const id = command.optionId;
        return {
          interaction: { ...ia, tallies: { ...ia.tallies, [id]: (ia.tallies[id] ?? 0) + 1 } },
        };
      }
      if (typeof command.word === "string") {
        const word = normalizeWord(command.word);
        if (word.length === 0) return null;
        const words = [...ia.words, word];
        return { interaction: { ...ia, words: words.slice(-MAX_WORDS) } };
      }
      return null;
    }
  }
}

/** An empty interaction that keeps the relay-maintained presence count. */
function emptyInteraction(prev: Partial<InteractionState>): InteractionState {
  const interaction: InteractionState = {
    sceneId: null,
    pollId: null,
    phase: "closed",
    tallies: {},
    words: [],
    history: {},
  };
  if (prev.audienceConnected !== undefined) interaction.audienceConnected = prev.audienceConnected;
  return interaction;
}

function closeCurrent(ia: InteractionState): InteractionState {
  if (ia.pollId === null) return ia;
  return {
    ...ia,
    sceneId: null,
    pollId: null,
    phase: "closed",
    tallies: {},
    words: [],
    history: { ...ia.history, [ia.pollId]: { ...ia.tallies } },
  };
}

function hasVotes(ia: InteractionState): boolean {
  return Object.keys(ia.tallies).length > 0 || ia.words.length > 0;
}

function cleanTallies(input: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(input)) {
    const n = Math.floor(Number(raw));
    if (Number.isFinite(n) && n > 0) out[id] = Math.min(n, MAX_MANUAL_COUNT);
  }
  return out;
}

function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** Phone votes plus hand counts for one poll, whether open or closed. */
export function pollTallies(ia: InteractionState | null | undefined, pollId: string): Record<string, number> {
  if (!ia) return {};
  const base = ia.pollId === pollId ? ia.tallies : (ia.history[pollId] ?? {});
  const manual = ia.manual?.[pollId] ?? {};
  const out: Record<string, number> = { ...base };
  for (const [id, n] of Object.entries(manual)) out[id] = (out[id] ?? 0) + n;
  return out;
}

/**
 * What audience phones receive: no scene states, no fallback flags, and no
 * tallies or words while a poll is still open (phones must not bias voting).
 * Also drops the presence count, so phones joining do not rebroadcast to phones.
 */
export function audienceView(state: SessionState): SessionState {
  const ia = state.interaction;
  const hide = ia.phase === "open";
  const interaction: InteractionState = {
    sceneId: ia.sceneId,
    pollId: ia.pollId,
    phase: ia.phase,
    tallies: hide ? {} : ia.tallies,
    words: hide ? [] : ia.words,
    history: ia.history,
  };
  if (ia.manual && !hide) interaction.manual = ia.manual;
  return { ...state, sceneStates: {}, fallback: {}, interaction };
}
