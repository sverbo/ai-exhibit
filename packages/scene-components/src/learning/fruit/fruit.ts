/**
 * Apples and pears: the scripted story behind the ApplesAndPears component.
 * Everything on screen is a pure function of the reveal step, so previous and
 * next work in both directions and every window draws the same frame.
 *
 * Geometry is in stage pixels (1920 x 1080).
 */
import type { L10n } from "@ai-exhibit/presentation-core";

export type FruitKind = "apple" | "pear";
export type BoxId = "training" | "test";

export const BOX_IDS: readonly BoxId[] = ["training", "test"];

/** One picture of the data. Every apple in it is red, every pear green: that is the gap. */
export interface Fruit {
  id: number;
  kind: FruitKind;
  box: BoxId;
}

/** Reveal steps after the initial pile: split, train, the caution, mock exam, final exam (the real world), lesson. */
export const FRUIT_STEPS = 6;

/**
 * The pile, in the order it is drawn: 20 pictures, 10 apples and 10 pears,
 * shuffled by hand. 16 go to training (80%) and 4 to test (20%), two apples and two pears.
 */
export const FRUITS: readonly Fruit[] = (
  [
    ["apple", "training"],
    ["pear", "training"],
    ["pear", "training"],
    ["apple", "training"],
    ["apple", "test"],
    ["pear", "training"],
    ["apple", "training"],
    ["pear", "training"],
    ["apple", "training"],
    ["pear", "test"],
    ["pear", "training"],
    ["apple", "training"],
    ["apple", "training"],
    ["pear", "training"],
    ["apple", "test"],
    ["pear", "training"],
    ["apple", "training"],
    ["pear", "test"],
    ["apple", "training"],
    ["pear", "training"],
  ] as const
).map(([kind, box], id) => ({ id, kind, box }));

export function boxCounts(fruits: readonly Fruit[] = FRUITS): Record<BoxId, number> {
  const counts: Record<BoxId, number> = { training: 0, test: 0 };
  for (const f of fruits) counts[f.box]++;
  return counts;
}

/** What one reveal step shows. */
export interface FruitView {
  /** The step, clamped to 0..FRUIT_STEPS. */
  step: number;
  /** Fruits sit in their boxes (else in the pile). */
  split: boolean;
  /** What is being talked about (a box, or the final exam); null when nothing stands out. */
  focus: BoxId | "world" | null;
  /** The model and the rule it learned are drawn. */
  model: boolean;
  /** The reminder that a neural network's rule cannot be read in advance (until the final exam takes its place). */
  caution: boolean;
  /** Boxes that show their 100% check: the mock exam. */
  checked: BoxId[];
  /** The final exam: a green apple from the real world, and the model's wrong answer. */
  world: boolean;
  /** Each box shows that it holds no green apple; the lesson is the caption. */
  lesson: boolean;
}

export function fruitView(revealStep: number): FruitView {
  const step = Math.min(FRUIT_STEPS, Math.max(0, Math.floor(Number.isFinite(revealStep) ? revealStep : 0)));
  const focus: FruitView["focus"] = step === 2 || step === 3 ? "training" : step === 4 ? "test" : step === 5 ? "world" : null;
  return {
    step,
    split: step >= 1,
    focus,
    model: step >= 2,
    caution: step >= 3 && step < 5,
    checked: step >= 4 ? ["test"] : [],
    world: step >= 5,
    lesson: step >= 6,
  };
}

// --- Geometry ----------------------------------------------------------------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A fruit is drawn in a FRUIT_W x FRUIT_H cell: the picture, then its label. */
export const FRUIT_W = 100;
export const FRUIT_H = 124;

const BOX_TOP = 236;
const BOX_H = 396;
/** Height of a box's header (name, share, what it is for). */
export const BOX_HEADER = 136;

export const BOXES: Record<BoxId, Rect> = {
  training: { x: 90, y: BOX_TOP, w: 1120, h: BOX_H },
  test: { x: 1260, y: BOX_TOP, w: 570, h: BOX_H },
};

const CELL = 112;
const TRAINING_COLS = 8;

export interface Placement {
  /** Top left of the fruit's cell before scaling (the cell scales around its centre). */
  x: number;
  y: number;
  /** Degrees. */
  rotate: number;
  scale: number;
}

/** Fruits are drawn larger in the pile, then settle into the boxes. */
export const PILE_SCALE = 1.3;
const PILE_COLS = 5;
const PILE_DX = 190;
const PILE_DY = 168;

/** Small fixed offset in -amp..amp, so the grid looks like a pile (no randomness). */
function jitter(id: number, salt: number, amp: number): number {
  return (((id * salt + 7) % 17) / 16) * 2 * amp - amp;
}

/** Where a fruit lies in the pile: a loose 5 x 4 heap in the middle of the stage. */
export function pilePlacement(fruit: Fruit): Placement {
  const col = fruit.id % PILE_COLS;
  const row = Math.floor(fruit.id / PILE_COLS);
  // Odd rows shift by half a cell, like fruit stacked in a crate.
  const shift = row % 2 === 1 ? PILE_DX / 4 : -PILE_DX / 4;
  const x = 960 - (PILE_COLS * PILE_DX) / 2 + col * PILE_DX + (PILE_DX - FRUIT_W) / 2 + shift + jitter(fruit.id, 5, 18);
  const y = 290 + row * PILE_DY + jitter(fruit.id, 11, 14);
  return { x, y, rotate: jitter(fruit.id, 13, 14), scale: PILE_SCALE };
}

/** Where a fruit sits once the pile is split: a tidy grid inside its box. */
export function boxPlacement(fruit: Fruit, fruits: readonly Fruit[] = FRUITS): Placement {
  const index = fruits.filter((f) => f.box === fruit.box && f.id < fruit.id).length;
  const box = BOXES[fruit.box];
  const top = box.y + BOX_HEADER;
  const area = box.h - BOX_HEADER;
  if (fruit.box === "training") {
    const col = index % TRAINING_COLS;
    const row = Math.floor(index / TRAINING_COLS);
    const left = box.x + (box.w - TRAINING_COLS * CELL) / 2;
    return { x: left + col * CELL + (CELL - FRUIT_W) / 2, y: top + (area - 2 * FRUIT_H) / 2 + row * FRUIT_H, rotate: 0, scale: 1 };
  }
  const count = fruits.filter((f) => f.box === fruit.box).length;
  const left = box.x + (box.w - count * CELL) / 2;
  return { x: left + index * CELL + (CELL - FRUIT_W) / 2, y: top + (area - FRUIT_H) / 2, rotate: 0, scale: 1 };
}

export function fruitPlacement(fruit: Fruit, view: FruitView): Placement {
  return view.split ? boxPlacement(fruit) : pilePlacement(fruit);
}

// --- Copy --------------------------------------------------------------------

export const TEXT = {
  captions: [
    { en: "The data: pictures labelled by people." },
    { en: "We split the pile into two boxes, like at school." },
    { en: "Training: the model finds the simplest rule that works." },
    { en: "Careful: remember, the model is a neural network. We cannot know this rule in advance." },
    { en: "The mock exam passes: 100%." },
    { en: "The final exam, in the real world: a green apple. Neither box had one." },
    { en: "You cannot blame the model: the gap was in the data, and it shows up only in the real world." },
  ],
  kinds: {
    apple: { en: "apple" },
    pear: { en: "pear" },
  } satisfies Record<FruitKind, L10n>,
  boxes: {
    training: { name: { en: "Training" }, role: { en: "The exercises, with corrections" } },
    test: { name: { en: "Test" }, role: { en: "The mock exam" } },
  } satisfies Record<BoxId, { name: L10n; role: L10n }>,
  model: { en: "The model" },
  ruleHeading: { en: "The rule it found" },
  ruleGreen: { en: "Green means pear." },
  ruleRed: { en: "Red means apple." },
  cautionHeading: { en: "Remember" },
  cautionLine: { en: "In a neural network, this rule is only numbers: nobody can read it, so we cannot know it in advance." },
  world: { en: "Final exam: the real world" },
  sure: { en: "{pct} sure" },
  wrong: { en: "Wrong answer" },
  passed: { en: "Passed" },
  noGreenApple: { en: "Green apples: 0" },
} as const;

/** Share of the pile in each box, as a fraction (0.8, 0.2). */
export function boxShare(box: BoxId, fruits: readonly Fruit[] = FRUITS): number {
  return boxCounts(fruits)[box] / fruits.length;
}

/** The model's confidence in its wrong answer on the green apple. */
export const WRONG_CONFIDENCE = 0.97;
