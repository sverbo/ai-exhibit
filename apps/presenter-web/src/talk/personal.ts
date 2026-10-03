import type { PresentationDefinition, SceneDefinition } from "@ai-exhibit/presentation-core";

/**
 * A presenter's personal version of the talk: order, hidden scenes and notes,
 * all keyed by scene code (docs/specs/2026-10-03-personal-config.md). Pure
 * functions only; storage lives in personalStore.ts.
 */
export const PERSONAL_SCHEMA = 1;
/** Longest personal note kept, in characters. */
export const NOTE_MAX = 2000;

export interface PersonalConfig {
  /** Codes in the presenter's order. Empty: the default order. */
  order: string[];
  hidden: string[];
  /** Code to note text. */
  notes: Record<string, string>;
}

export const EMPTY_CONFIG: PersonalConfig = { order: [], hidden: [], notes: {} };

export function isEmptyConfig(config: PersonalConfig): boolean {
  return config.order.length === 0 && config.hidden.length === 0 && Object.keys(config.notes).length === 0;
}

export interface PersonalSequence {
  /** Every scene of the edition, in personal order (hidden ones included). */
  ordered: SceneDefinition[];
  /** Visible scenes, in personal order. */
  visible: SceneDefinition[];
  /** IDs of hidden scenes. */
  hiddenIds: Set<string>;
  /** Scene ID to personal note. */
  notes: Map<string, string>;
  /** Codes in the config that match no scene of the talk, first-seen order. */
  unknownCodes: string[];
}

/** Every code the talk knows, including parked scenes and scenes outside the edition. */
export function talkCodes(presentation: Pick<PresentationDefinition, "scenes" | "parkedScenes">): Set<string> {
  return new Set([...presentation.scenes, ...(presentation.parkedScenes ?? [])].map((s) => s.code));
}

/**
 * Applies a config to the edition's default scene list. Scenes the config does
 * not place (added by the author later) go right after their nearest placed
 * predecessor in the default order, visible; unknown codes are reported and
 * ignored; hidden and notes apply to known scenes only.
 */
export function personalSequence(
  defaultScenes: SceneDefinition[],
  config: PersonalConfig,
  knownCodes: Set<string> = new Set(defaultScenes.map((s) => s.code)),
): PersonalSequence {
  const byCode = new Map(defaultScenes.map((s) => [s.code, s]));
  const placed: SceneDefinition[] = [];
  const seen = new Set<string>();
  for (const code of config.order) {
    const scene = byCode.get(code);
    if (scene && !seen.has(code)) {
      placed.push(scene);
      seen.add(code);
    }
  }
  let ordered = placed;
  if (placed.length < defaultScenes.length) {
    ordered = [...placed];
    let anchor: SceneDefinition | null = null;
    for (const scene of defaultScenes) {
      if (!seen.has(scene.code)) {
        const at = anchor ? ordered.indexOf(anchor) + 1 : 0;
        ordered.splice(at, 0, scene);
        seen.add(scene.code);
      }
      anchor = scene;
    }
  }

  const hiddenCodes = new Set(config.hidden);
  const hiddenIds = new Set(ordered.filter((s) => hiddenCodes.has(s.code)).map((s) => s.id));
  const notes = new Map<string, string>();
  for (const scene of ordered) {
    const note = config.notes[scene.code]?.trim();
    if (note) notes.set(scene.id, note);
  }
  const unknownCodes: string[] = [];
  for (const code of [...config.order, ...config.hidden, ...Object.keys(config.notes)]) {
    if (!knownCodes.has(code) && !unknownCodes.includes(code)) unknownCodes.push(code);
  }
  return { ordered, visible: ordered.filter((s) => !hiddenIds.has(s.id)), hiddenIds, notes, unknownCodes };
}

/**
 * What navigation walks: the visible scenes, plus the current scene when it is
 * hidden (hiding the scene on screen keeps the talk on it until the presenter
 * moves on).
 */
export function navigableScenes(seq: Pick<PersonalSequence, "ordered" | "hiddenIds">, currentId: string | null | undefined): SceneDefinition[] {
  return seq.ordered.filter((s) => !seq.hiddenIds.has(s.id) || s.id === currentId);
}

/** Scenes as timing sees them: hidden ones count zero seconds. */
export function timingScenes(scenes: SceneDefinition[], hiddenIds: Set<string>): SceneDefinition[] {
  return hiddenIds.size === 0 ? scenes : scenes.map((s) => (hiddenIds.has(s.id) ? { ...s, durationSec: 0 } : s));
}

// ---------------------------------------------------------------- editing

/** Moves the scene `code` to `toIndex` of the ordered list; the config then holds the full order. */
export function moveScene(config: PersonalConfig, ordered: SceneDefinition[], code: string, toIndex: number): PersonalConfig {
  const codes = ordered.map((s) => s.code);
  const from = codes.indexOf(code);
  if (from < 0) return config;
  const to = Math.max(0, Math.min(codes.length - 1, toIndex));
  if (to === from) return config;
  codes.splice(from, 1);
  codes.splice(to, 0, code);
  // Unknown codes in the old order are kept at the end, so nothing is lost silently.
  const known = new Set(codes);
  return { ...config, order: [...codes, ...config.order.filter((c) => !known.has(c))] };
}

export function setHidden(config: PersonalConfig, code: string, hidden: boolean): PersonalConfig {
  const rest = config.hidden.filter((c) => c !== code);
  return { ...config, hidden: hidden ? [...rest, code] : rest };
}

export function setNote(config: PersonalConfig, code: string, text: string): PersonalConfig {
  const notes = { ...config.notes };
  const clipped = text.slice(0, NOTE_MAX);
  if (clipped.trim()) notes[code] = clipped;
  else delete notes[code];
  return { ...config, notes };
}

/** Drops every code the talk does not know. */
export function forgetUnknown(config: PersonalConfig, knownCodes: Set<string>): PersonalConfig {
  const notes: Record<string, string> = {};
  for (const [code, text] of Object.entries(config.notes)) if (knownCodes.has(code)) notes[code] = text;
  return {
    order: config.order.filter((c) => knownCodes.has(c)),
    hidden: config.hidden.filter((c) => knownCodes.has(c)),
    notes,
  };
}

// ---------------------------------------------------------------- file format

export interface PersonalFile extends PersonalConfig {
  schema: number;
  talk: string;
  help?: string;
  titles?: Record<string, string>;
}

const HELP =
  "order: scene codes in your order (empty: the default order; scenes added later appear after their predecessor). " +
  "hidden: codes to skip. notes: code to your note, shown first in the speaker notes. " +
  "titles is only a reminder of each code. Unknown codes are ignored.";

/** Pretty-printed JSON for download (and for storage). */
export function serializeConfig(
  config: PersonalConfig,
  talkId: string,
  ordered?: SceneDefinition[],
): string {
  const file: PersonalFile = {
    schema: PERSONAL_SCHEMA,
    talk: talkId,
    order: config.order,
    hidden: config.hidden,
    notes: config.notes,
  };
  if (ordered) {
    file.help = HELP;
    file.titles = Object.fromEntries(ordered.map((s) => [s.code, `${s.number} ${s.title.en}`]));
  }
  return `${JSON.stringify(file, null, 2)}\n`;
}

export type ParseError = "json" | "shape" | "schema" | "talk";

export type ParseResult =
  | {
      ok: true;
      config: PersonalConfig;
      /** Entries of the wrong type that were dropped. */
      dropped: number;
      /** Codes the talk does not know (kept in the config, ignored by the sequence). */
      unknownCodes: string[];
    }
  | { ok: false; error: ParseError };

/** Reads an exported or stored config. Never throws. */
export function parseConfig(text: string, talkId: string, knownCodes: Set<string>): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "json" };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "shape" };
  const obj = raw as Record<string, unknown>;
  if (obj.schema !== undefined && (typeof obj.schema !== "number" || obj.schema > PERSONAL_SCHEMA || obj.schema < 1)) {
    return { ok: false, error: "schema" };
  }
  if (obj.talk !== undefined && obj.talk !== talkId) return { ok: false, error: "talk" };

  let dropped = 0;
  const codes = (value: unknown): string[] => {
    if (value === undefined) return [];
    if (!Array.isArray(value)) {
      dropped += 1;
      return [];
    }
    const out: string[] = [];
    for (const v of value) {
      const code = typeof v === "string" ? v.trim().toLowerCase() : "";
      if (!code) dropped += 1;
      else if (!out.includes(code)) out.push(code);
    }
    return out;
  };
  const order = codes(obj.order);
  const hidden = codes(obj.hidden);
  const notes: Record<string, string> = {};
  if (obj.notes !== undefined) {
    if (!obj.notes || typeof obj.notes !== "object" || Array.isArray(obj.notes)) dropped += 1;
    else {
      for (const [k, v] of Object.entries(obj.notes as Record<string, unknown>)) {
        const code = k.trim().toLowerCase();
        if (typeof v !== "string" || !code) {
          dropped += 1;
          continue;
        }
        if (v.trim()) notes[code] = v.slice(0, NOTE_MAX);
      }
    }
  }
  const config = { order, hidden, notes };
  const unknownCodes = [...new Set([...order, ...hidden, ...Object.keys(notes)])].filter((c) => !knownCodes.has(c));
  return { ok: true, config, dropped, unknownCodes };
}
