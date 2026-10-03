/**
 * Runtime validation of states received from other windows over the
 * BroadcastChannel: anything malformed is ignored.
 */
import { LOCALES, type Locale } from "@ai-exhibit/presentation-core";
import type { SessionState } from "./types.ts";

/** Maximum length of identifiers (scene, edition, client IDs). */
export const MAX_ID_LENGTH = 128;

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

/** Shallow structural check of a full session state. */
export function isSessionState(v: unknown): v is SessionState {
  if (!isObj(v)) return false;
  const t = v.timer;
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
    isFiniteNum(v.version)
  );
}
