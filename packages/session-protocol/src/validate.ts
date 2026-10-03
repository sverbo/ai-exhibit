/**
 * Runtime validation of untrusted wire messages. The relay runs every incoming
 * frame through `parseClientMessage`; anything malformed becomes null and is
 * ignored. Clients use `parseServerMessage` defensively too.
 */

import { LOCALES, type Locale } from "@ai-exhibit/presentation-core";
import { normalizeWord } from "./reducer.ts";
import type {
  ClientMessage,
  ClientRole,
  ClientSummary,
  ServerMessage,
  SessionCommand,
  SessionState,
} from "./types.ts";

/** Maximum size of one incoming frame, in bytes. */
export const MAX_MESSAGE_BYTES = 256 * 1024;
/** Maximum length of identifiers (scene, poll, option, client, voter IDs). */
export const MAX_ID_LENGTH = 128;

const ROLES: readonly ClientRole[] = ["projector", "presenter", "solo", "remote", "audience"];

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= MAX_ID_LENGTH;
}
function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}
function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
function isRole(v: unknown): v is ClientRole {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}
function isCountRecord(v: unknown): v is Record<string, number> {
  return (
    isObj(v) &&
    Object.keys(v).length <= 256 &&
    Object.entries(v).every(([k, n]) => k.length <= MAX_ID_LENGTH && isFiniteNum(n) && n >= 0)
  );
}

/** Validates a command's shape. Returns a clean copy (extra fields dropped) or null. */
export function parseCommand(v: unknown): SessionCommand | null {
  if (!isObj(v)) return null;
  switch (v.type) {
    case "goto":
      return isId(v.sceneId) && isFiniteNum(v.revealStep) && v.revealStep >= 0 && v.revealStep < 10_000
        ? { type: "goto", sceneId: v.sceneId, revealStep: Math.floor(v.revealStep) }
        : null;
    case "setSceneState":
      // JSON-serializable by construction (it came from JSON); size is capped per frame.
      return isId(v.sceneId) && "state" in v ? { type: "setSceneState", sceneId: v.sceneId, state: v.state } : null;
    case "setFallback":
      return isId(v.sceneId) && isBool(v.on) ? { type: "setFallback", sceneId: v.sceneId, on: v.on } : null;
    case "resetScene":
      return isId(v.sceneId) ? { type: "resetScene", sceneId: v.sceneId } : null;
    case "timer":
      return (v.action === "start" || v.action === "pause" || v.action === "reset") && isFiniteNum(v.now)
        ? { type: "timer", action: v.action, now: v.now }
        : null;
    case "setBlackout":
      return isBool(v.on) ? { type: "setBlackout", on: v.on } : null;
    case "setFrozen":
      return isBool(v.on) ? { type: "setFrozen", on: v.on } : null;
    case "setEdition":
      return isId(v.editionId) && isLocale(v.locale) && isId(v.sceneId)
        ? { type: "setEdition", editionId: v.editionId, locale: v.locale, sceneId: v.sceneId }
        : null;
    case "openPoll":
      return isId(v.sceneId) && isId(v.pollId) ? { type: "openPoll", sceneId: v.sceneId, pollId: v.pollId } : null;
    case "showPollResults":
      return { type: "showPollResults" };
    case "closePoll":
      return { type: "closePoll" };
    case "resetPoll":
      return isId(v.pollId) ? { type: "resetPoll", pollId: v.pollId } : null;
    case "setManualTally":
      return isId(v.pollId) && isCountRecord(v.tallies)
        ? { type: "setManualTally", pollId: v.pollId, tallies: { ...v.tallies } }
        : null;
    case "resetSession":
      return { type: "resetSession" };
    case "vote": {
      if (!isId(v.pollId) || !isId(v.voterId)) return null;
      if (isId(v.optionId)) return { type: "vote", pollId: v.pollId, optionId: v.optionId, voterId: v.voterId };
      if (typeof v.word === "string" && v.word.length <= 1000) {
        const word = normalizeWord(v.word);
        return word ? { type: "vote", pollId: v.pollId, word, voterId: v.voterId } : null;
      }
      return null;
    }
    default:
      return null;
  }
}

/** Shallow structural check of a full session state (used for bootstrap and persistence). */
export function isSessionState(v: unknown): v is SessionState {
  if (!isObj(v)) return false;
  const t = v.timer;
  const ia = v.interaction;
  return (
    isId(v.presentationId) &&
    isId(v.editionId) &&
    isLocale(v.locale) &&
    isId(v.sceneId) &&
    isFiniteNum(v.revealStep) &&
    isObj(v.sceneStates) &&
    isObj(v.fallback) &&
    isObj(t) &&
    (t.startedAt === null || isFiniteNum(t.startedAt)) &&
    isFiniteNum(t.accumulatedMs) &&
    isBool(v.blackout) &&
    isBool(v.frozen) &&
    isFiniteNum(v.version) &&
    isObj(ia) &&
    (ia.sceneId === null || isId(ia.sceneId)) &&
    (ia.pollId === null || isId(ia.pollId)) &&
    (ia.phase === "closed" || ia.phase === "open" || ia.phase === "results") &&
    isCountRecord(ia.tallies) &&
    Array.isArray(ia.words) &&
    ia.words.every((w) => typeof w === "string") &&
    isObj(ia.history) &&
    Object.values(ia.history).every(isCountRecord) &&
    (ia.manual === undefined || (isObj(ia.manual) && Object.values(ia.manual).every(isCountRecord)))
  );
}

function byteLength(raw: string): number {
  // Upper bound without allocating: UTF-16 code units * 3 >= UTF-8 bytes.
  if (raw.length * 3 <= MAX_MESSAGE_BYTES) return raw.length;
  return new TextEncoder().encode(raw).length;
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== "string" || byteLength(raw) > MAX_MESSAGE_BYTES) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Parses and validates one frame from a client. Null when oversized or malformed. */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  const v = parseJson(raw);
  if (!isObj(v)) return null;
  switch (v.kind) {
    case "hello": {
      if (!isId(v.sessionId) || !isRole(v.role) || !isId(v.clientId)) return null;
      const msg: ClientMessage = { kind: "hello", sessionId: v.sessionId, role: v.role, clientId: v.clientId };
      if (typeof v.token === "string" && v.token.length <= 256) msg.token = v.token;
      if (isSessionState(v.initialState)) msg.initialState = v.initialState;
      return msg;
    }
    case "command": {
      const command = parseCommand(v.command);
      if (!command) return null;
      const msg: ClientMessage = { kind: "command", command };
      if (isFiniteNum(v.id)) msg.id = v.id;
      return msg;
    }
    case "ping":
      return isFiniteNum(v.t) ? { kind: "ping", t: v.t } : null;
    default:
      return null;
  }
}

function isClientList(v: unknown): v is ClientSummary[] {
  return Array.isArray(v) && v.every((c) => isObj(c) && isId(c.clientId) && isRole(c.role));
}

/** Parses one frame from the relay. Null when malformed. */
export function parseServerMessage(raw: unknown): ServerMessage | null {
  let v: unknown;
  try {
    v = typeof raw === "string" ? JSON.parse(raw) : undefined;
  } catch {
    return null;
  }
  if (!isObj(v)) return null;
  const ack = isFiniteNum(v.ack) ? v.ack : undefined;
  switch (v.kind) {
    case "welcome":
      return isSessionState(v.state) && isBool(v.canControl) && isClientList(v.clients)
        ? { kind: "welcome", state: v.state, canControl: v.canControl, clients: v.clients }
        : null;
    case "state":
      return isSessionState(v.state) ? { kind: "state", state: v.state, ...(ack !== undefined ? { ack } : {}) } : null;
    case "clients":
      return isClientList(v.clients) ? { kind: "clients", clients: v.clients } : null;
    case "error":
      return typeof v.message === "string"
        ? { kind: "error", message: v.message, ...(ack !== undefined ? { ack } : {}) }
        : null;
    case "pong":
      return isFiniteNum(v.t) ? { kind: "pong", t: v.t } : null;
    default:
      return null;
  }
}
