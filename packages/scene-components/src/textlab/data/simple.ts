import type { Locale } from "@ai-exhibit/presentation-core";
import { forward, type Mlp } from "../../learning/ml/mlp.ts";
import { encode } from "./net.ts";
import { tokenize, wordSet } from "./text.ts";

/**
 * The simplified view of the real network that the network scenes draw: only
 * the words of the current sentence (up to MAX_WORDS) as inputs, the few
 * hidden neurons with the largest influence on the answer for that sentence
 * (|weight to the output x neuron value|), every connection between them, and
 * each chosen neuron's connection to the output. All values are the real ones;
 * only the choice of what to draw is a simplification (said on screen).
 *
 * Tones: an input-to-neuron line "pushes toward basketball" when its weight
 * and that neuron's weight to the output have the same sign (more of this
 * word, more basketball through this neuron); a neuron-to-output line goes to
 * the sport its weight pushes toward (the one sigmoid output is drawn as two
 * outputs, Football and Basketball, which gives the same probabilities).
 */

export const MAX_WORDS = 8;
export const SHOWN_NEURONS = 5;

type Net = Mlp & { vocab: string[] };

export interface SimpleSelection {
  /** Words drawn, in sentence order: label as written, index in the vocabulary. */
  words: { label: string; index: number }[];
  /** Hidden neurons drawn, by index. */
  neurons: number[];
}

export interface SimpleView extends SimpleSelection {
  /** w1[n][k]: from drawn word k to drawn neuron n. */
  w1: number[][];
  /** Drawn neuron n to the basketball output (football is the negation). */
  w2: number[];
}

export interface SimpleActivity {
  /** 1 when the (possibly edited) sentence contains drawn word k. */
  inputs: number[];
  /** Value of each drawn neuron. */
  hidden: number[];
  /** Probability of basketball (the whole network, nothing left out). */
  p: number;
}

/** The sentence's known words and its most influential neurons, for `net`. */
export function simpleSelect(net: Net, text: string, locale: Locale): SimpleSelection {
  const words: SimpleSelection["words"] = [];
  const seen = new Set<number>();
  for (const t of tokenize(text, locale)) {
    if (t.stop) continue;
    const index = net.vocab.indexOf(t.word);
    if (index < 0 || seen.has(index)) continue;
    seen.add(index);
    words.push({ label: t.surface.toLowerCase(), index });
    if (words.length >= MAX_WORDS) break;
  }
  const h = forward(net, encode(text, net.vocab, locale))[1]!;
  const w2 = net.W[1]![0]!;
  const neurons = h
    .map((v, j) => ({ j, influence: Math.abs(v * w2[j]!) }))
    .sort((a, b) => b.influence - a.influence || a.j - b.j)
    .slice(0, SHOWN_NEURONS)
    .map((x) => x.j)
    .sort((a, b) => a - b);
  return { words, neurons };
}

export function simpleView(net: Net, sel: SimpleSelection): SimpleView {
  return {
    ...sel,
    w1: sel.neurons.map((j) => sel.words.map((w) => net.W[0]![j]![w.index]!)),
    w2: sel.neurons.map((j) => net.W[1]![0]![j]!),
  };
}

export function simpleActivity(net: Net, sel: SimpleSelection, text: string, locale: Locale): SimpleActivity {
  const acts = forward(net, encode(text, net.vocab, locale));
  const present = wordSet(text, locale);
  return {
    inputs: sel.words.map((w) => (present.has(net.vocab[w.index]!) ? 1 : 0)),
    hidden: sel.neurons.map((j) => acts[1]![j]!),
    p: acts[2]![0]!,
  };
}

/** Does the line from drawn word k to drawn neuron n push toward basketball? */
export const pushesBasketball = (v: SimpleView, n: number, k: number) => v.w1[n]![k]! * v.w2[n]! >= 0;

/** Rounds a view for publishing as scene state. */
export function roundSimple<T extends SimpleView & Partial<SimpleActivity>>(v: T): T {
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    ...v,
    w1: v.w1.map((row) => row.map(r)),
    w2: v.w2.map(r),
    ...(v.hidden ? { hidden: v.hidden.map(r) } : {}),
    ...(v.p !== undefined ? { p: r(v.p) } : {}),
  };
}
