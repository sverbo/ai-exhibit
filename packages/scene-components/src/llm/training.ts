/**
 * Data and pure logic for TrainingLoop. Everything here is an ILLUSTRATION
 * (labelled on screen): the random guesses, the nudged numbers and the
 * learning curve are invented to show the principle. Real figures: the
 * vocabulary size of the demo model (so "random" means about 1 chance in that
 * many) and the final counter, the number of tokens a published large model
 * was trained on (sourced).
 */
import type { L10n } from "@ai-exhibit/presentation-core";

export interface TrainingExample {
  /**
   * Ordinary text. "___" marks the next word: the model sees everything
   * before it, never what comes after (it learns to predict the NEXT word).
   */
  text: L10n;
  /** The actual next word (or next token, for code). */
  answer: L10n;
  /** Code, not prose: shown in a monospace font, pieces joined without spaces. */
  code?: boolean;
}

export interface TrainingLoopState {
  example: number;
}

export const STEPS = 4;

export const EXAMPLES: TrainingExample[] = [
  {
    text: {
      en: "Every morning the children take the ___ to school.",
    },
    answer: { en: "bus" },
  },
  {
    text: { en: "She opened the ___ and let the cat in." },
    answer: { en: "door" },
  },
  {
    // Models also read huge amounts of code: here, the kind of structured line an agent writes.
    text: { en: '{"city": "Paris", "days": 3___' },
    answer: { en: "}" },
    code: true,
  },
];

/**
 * An untrained model's top guesses are arbitrary tokens, each barely above
 * 1 in the vocabulary size. Multipliers of that uniform chance (illustrative).
 */
export const RANDOM_GUESSES: { token: L10n; times: number }[] = [
  { token: { en: "Tuesday" }, times: 1.6 },
  { token: { en: "ology" }, times: 1.45 },
  { token: { en: "{", fr: "{" }, times: 1.3 },
  { token: { en: "zebra" }, times: 1.2 },
  { token: { en: "7" }, times: 1.12 },
];

/** One nudge barely moves it: the right token's chance after one update, as a multiple of before. */
export const ONE_NUDGE = 1.05;

/** Probability an untrained model gives the right token: about 1 in the vocabulary size. */
export function randomChance(vocabSize: number): number {
  return 1 / vocabSize;
}

/**
 * Ordinary text flying past during "repeat" (illustrative, invented: web
 * pages, book-like prose, forum posts and code). The last word is the next
 * token the model is asked for.
 */
export const STREAM: { text: L10n; code?: boolean }[] = [
  { text: { en: "Free delivery on all orders over $50." } },
  { text: { en: "She folded the letter twice and slipped it under the door." } },
  { text: { en: "for item in cart: total += item.price" }, code: true },
  { text: { en: "Preheat the oven to 180 degrees." } },
  { text: { en: "The council will vote on the new bridge next week." } },
  { text: { en: 'print("Hello, world")' }, code: true },
  { text: { en: "The old dog slept by the fire all winter." } },
  { text: { en: "Click here to reset your password." } },
  { text: { en: '{"name": "Ada", "age": 36}' }, code: true },
  { text: { en: "Has anyone tried this recipe with oat milk?" } },
  { text: { en: "The river rose overnight and flooded the lower fields." } },
  { text: { en: "if (user.isLoggedIn) { showMenu(); }" }, code: true },
  { text: { en: "Store in a cool, dry place." } },
  { text: { en: "He promised to call as soon as the train arrived." } },
  { text: { en: "SELECT name FROM users WHERE age > 30;" }, code: true },
  { text: { en: "Opening hours: Monday to Friday, 9 to 5." } },
];

/** Split a stream line into what the model sees and the next token it must predict (the last word). */
export function splitLast(text: string): { context: string; next: string } {
  const i = text.lastIndexOf(" ");
  return i < 0 ? { context: "", next: text } : { context: text.slice(0, i), next: text.slice(i + 1) };
}

/** Before the stream starts, the first sentence slides one word forward (ms). */
export const FIRST_SLIDE_MS = 1200;
/** Display time of stream line i: faster and faster, down to a blur. */
export function lineDuration(i: number): number {
  return Math.max(70, 900 * Math.pow(0.8, i));
}

/** Which stream line is shown `ms` after the stream started (cycles through STREAM). */
export function streamLineAt(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  let t = 0;
  for (let i = 0; ; i++) {
    t += lineDuration(i);
    if (t > ms) return i;
  }
}

/** Context (before the next word) and the rest, split at "___". */
export function splitAtNext(text: string): { context: string; rest: string } {
  const [context = "", rest = ""] = text.split("___");
  return { context: context.trimEnd(), rest: rest.trim() };
}

/** The first word of `rest`: what the model must guess once the window slides one word forward. */
export function nextAfter(rest: string): string {
  return rest.split(/\s+/)[0] ?? "";
}

/** Where the illustrative learning curve ends: the right token's chance late in training. */
export const TRAINED_CHANCE = 0.6;

/**
 * Illustrative learning curve: the right token's probability as training
 * progresses (`f` from 0 to 1, the same progress as the counter, so log of
 * tokens seen). Rises from random chance to TRAINED_CHANCE, in log space.
 */
export function chanceAt(f: number, start: number, end = TRAINED_CHANCE): number {
  const x = Math.max(0, Math.min(1, f));
  const s = x * x * (3 - 2 * x);
  return Math.pow(10, Math.log10(start) + (Math.log10(end) - Math.log10(start)) * s);
}

/** Training progress from 0 to 1, `ms` into the "repeat" step (Infinity: done). */
export function progressAt(ms: number, duration = COUNTER_MS): number {
  if (!Number.isFinite(ms)) return 1;
  return Math.max(0, Math.min(1, ms / duration));
}

/** A few of the network's numbers, before and after one nudge. */
export const WEIGHTS: { before: number; after: number }[] = [
  { before: 0.42, after: 0.43 },
  { before: -1.17, after: -1.19 },
  { before: 0.08, after: 0.08 },
  { before: 2.31, after: 2.3 },
  { before: -0.56, after: -0.54 },
  { before: 0.93, after: 0.95 },
  { before: -0.21, after: -0.21 },
  { before: 1.64, after: 1.62 },
];

/** Tokens Llama 3.1 405B was pre-trained on (llm-llama3-paper): one guess per token. */
export const TOKENS_SEEN = 15.6e12;
export const COUNTER_MS = 9000;

/** Counter value t ms into the "repeat" step: exponential, so it races through the orders of magnitude. */
export function counterAt(ms: number, total = TOKENS_SEEN, duration = COUNTER_MS): number {
  if (!Number.isFinite(ms) || ms >= duration) return total;
  if (ms <= 0) return 1;
  return Math.max(1, Math.round(Math.pow(total, ms / duration)));
}

/** Error for the right word: how far its probability is from 100%. */
export function errorOf(p: number): number {
  return Math.max(0, Math.min(1, 1 - p));
}

/** Source for the parameter count of the demo model a locale uses (see ../language/data.ts). */
export function demoModelSourceId(model: string): string {
  if (model.startsWith("amd-olmo")) return "tk-amd-olmo-1b-model-card";
  if (model.startsWith("qwen")) return "fnd-qwen25-model-card";
  return "fnd-smollm2-model-card";
}
