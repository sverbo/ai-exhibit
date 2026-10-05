/**
 * MeaningDimensions: the scripted, illustrative story of why a word needs many
 * numbers. Everything on screen is a pure function of the reveal step (no
 * accumulated animation, nothing random), so previous and next work in both
 * directions and every screen draws the same picture.
 *
 * Positions are invented and very simplified: x runs from the colours (-1) to
 * the fruits (+1) on the line; y (0 to 1) is the second dimension, "the sea",
 * which appears at step 2.
 */
import type { L10n, Locale } from "@ai-exhibit/presentation-core";

/** Reveal steps after the initial state (scene `steps`). */
export const DIMENSION_STEPS = 5;

export type Mood = "calm" | "focus" | "hesitant" | "clash";

export interface PlanePos {
  x: number;
  y: number;
  mood?: Mood;
}

export interface DimWord {
  id: string;
  text: L10n;
  /** First step where the word is on screen. */
  from: number;
  /** Position from a step on (the last key at or before the current step wins). */
  at: Record<number, PlanePos>;
  /** Only shown in these locales; every locale when absent. */
  locales?: Locale[];
}

export const WORDS: DimWord[] = [
  { id: "red", text: { en: "red" }, from: 0, at: { 0: { x: -0.95, y: 0 } } },
  { id: "green", text: { en: "green" }, from: 0, at: { 0: { x: -0.72, y: 0 } } },
  {
    id: "blue",
    text: { en: "blue" },
    from: 0,
    at: { 0: { x: -0.49, y: 0 }, 3: { x: -0.12, y: 0.4, mood: "hesitant" } },
  },
  // Same word in French: kept inline so the catalog has no entry identical to English.
  { id: "orange", text: { en: "orange", fr: "orange" }, from: 0, at: { 0: { x: 0, y: 0, mood: "focus" }, 1: { x: 0, y: 0 } } },
  { id: "apple", text: { en: "apple" }, from: 0, at: { 0: { x: 0.49, y: 0 } } },
  { id: "cherry", text: { en: "cherry" }, from: 0, at: { 0: { x: 0.72, y: 0 } } },
  { id: "banana", text: { en: "banana" }, from: 0, at: { 0: { x: 0.95, y: 0 } } },
  {
    id: "salmon",
    text: { en: "salmon" },
    from: 1,
    at: { 1: { x: -0.26, y: 0.5, mood: "hesitant" }, 2: { x: -0.5, y: 0.5, mood: "focus" }, 3: { x: -0.5, y: 0.5 } },
  },
  { id: "fish", text: { en: "fish" }, from: 2, at: { 2: { x: -0.14, y: 0.9 } } },
  { id: "sea", text: { en: "sea" }, from: 2, at: { 2: { x: 0.12, y: 1 } } },
  { id: "boat", text: { en: "boat" }, from: 2, at: { 2: { x: 0.36, y: 0.84 } } },
  // French "pêche": the fruit (peach) and fishing. English has no common word
  // that is both a fruit and a sea word, so the English edition skips it.
  {
    id: "peach",
    text: { en: "peach" },
    from: 2,
    at: { 2: { x: 0.6, y: 0.5, mood: "focus" }, 3: { x: 0.6, y: 0.5 } },
    locales: ["fr"],
  },
  { id: "sky", text: { en: "sky" }, from: 3, at: { 3: { x: 0.5, y: 0.98, mood: "clash" } } },
  // "Feeling blue" in English; "un bleu" (a bruise) in French. Not a
  // translation of "sad", so the French stays inline, for this place only.
  { id: "blueSense", text: { en: "sad", fr: "hématome" }, from: 3, at: { 3: { x: 0.6, y: 0.07, mood: "clash" } } },
];

/** Where an arrow ends, in plane coordinates. */
export interface DimArrow {
  id: string;
  from: string;
  to: { x: number; y: number };
}

/** The pulls on a word that does not fit, per step. */
export const ARROWS: Record<number, DimArrow[]> = {
  1: [
    { id: "salmon-colours", from: "salmon", to: { x: -0.64, y: 0.22 } },
    { id: "salmon-sea", from: "salmon", to: { x: -0.04, y: 0.92 } },
  ],
  3: [
    { id: "blue-colours", from: "blue", to: { x: -0.64, y: 0.22 } },
    { id: "blue-sea", from: "blue", to: { x: 0.04, y: 0.95 } },
    { id: "blue-sky", from: "blue", to: { x: 0.5, y: 0.98 } },
    { id: "blue-sense", from: "blue", to: { x: 0.6, y: 0.07 } },
  ],
};

/** Step 1 only: where the sea would go, if the line had room for it. */
export const GHOST = { at: { x: 0, y: 0.95 }, text: { en: "the sea?" } satisfies L10n };

export interface WordView {
  id: string;
  text: L10n;
  x: number;
  y: number;
  visible: boolean;
  mood: Mood;
  /** The numbers written under the word: its coordinates, or "?" when it has no place. */
  value: number[] | "?" | null;
}

export interface DimensionsView {
  step: number;
  /** How many numbers each word gets at this step. */
  numbers: number;
  /** The vertical axis ("the sea") is drawn. */
  plane: boolean;
  /** The map (line or plane) is shown; from step 4 the row of numbers replaces it. */
  map: boolean;
  ghost: boolean;
  words: WordView[];
  arrows: DimArrow[];
  /** The row of numbers for one word. */
  strip: boolean;
  /** The closing line toward the next scene. */
  bridge: boolean;
}

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0;
  return Math.min(Math.max(Math.trunc(step), 0), DIMENSION_STEPS);
}

/** The position in effect at `step`: the last key at or before it. */
export function positionAt(word: DimWord, step: number): PlanePos {
  const keys = Object.keys(word.at)
    .map(Number)
    .sort((a, b) => a - b);
  let pos = word.at[keys[0]!]!;
  for (const k of keys) if (k <= step) pos = word.at[k]!;
  return pos;
}

function valueAt(word: DimWord, pos: PlanePos, step: number): WordView["value"] {
  if (pos.mood === "hesitant") return "?";
  if (step === 0) return [pos.x];
  if (step === 2 && pos.mood === "focus") return [pos.x, pos.y];
  return null;
}

/** Everything the scene shows at a step. Pure: the same step gives the same picture. */
export function dimensionsView(rawStep: number, locale: Locale): DimensionsView {
  const step = clampStep(rawStep);
  const words = WORDS.filter((w) => !w.locales || w.locales.includes(locale)).map((w) => {
    const pos = positionAt(w, step);
    const visible = step >= w.from;
    return {
      id: w.id,
      text: w.text,
      x: pos.x,
      y: pos.y,
      visible,
      mood: pos.mood ?? "calm",
      value: visible && step < 4 ? valueAt(w, pos, step) : null,
    };
  });
  return {
    step,
    numbers: step <= 1 ? 1 : step <= 3 ? 2 : STRIP_LENGTH,
    plane: step >= 2,
    map: step <= 3,
    ghost: step === 1,
    words,
    arrows: ARROWS[step] ?? [],
    strip: step >= 4,
    bridge: step >= 5,
  };
}

// The row of numbers --------------------------------------------------------

/** Dimensions of the embedding model behind the word map (fnd-minilm-multilingual-model-card). */
export const STRIP_LENGTH = 384;
/** Model dimension of Llama 3.1 8B and 405B (llm-llama3-paper, Table 3). */
export const LLAMA_8B_DIMS = 4096;
export const LLAMA_405B_DIMS = 16384;

/** The first numbers, written out on screen. */
export const STRIP_HEAD = [0.12, -0.53, 0.07, 0.88, -0.21, 0.34];

/** A fixed pseudo-random value in [0, 1) for index i (no Math.random: every screen agrees). */
function hash01(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** 384 invented values in [-1, 1], identical on every run. */
export const STRIP: number[] = Array.from({ length: STRIP_LENGTH }, (_, i) => {
  if (i < STRIP_HEAD.length) return STRIP_HEAD[i]!;
  // Mostly small values, a few large ones, like a real embedding.
  const u = hash01(i) * 2 - 1;
  const v = Math.sign(u) * Math.abs(u) ** 1.8;
  return Math.round(v * 100) / 100;
});
