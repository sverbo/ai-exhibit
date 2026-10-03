import type { Locale } from "@ai-exhibit/presentation-core";
import { cloneMlp, forward, type Mlp } from "../../learning/ml/mlp.ts";
import { encode, netTestSentences, TextNetTraining } from "./net.ts";
import curveEn from "./curve.en.json";
import curveFr from "./curve.fr.json";
import type { LabelledSentence } from "./text.ts";

/**
 * The learning scene, before the stream of thousands of sentences: one
 * labelled sentence, the untrained network (the real starting point of the
 * seeded training), its wrong guess, one real gradient step on that sentence
 * alone, and the same sentence again.
 *
 * The step is plain gradient descent on the cross-entropy of that one
 * sentence: every weight moves against its own gradient, so only the
 * connections that took part (from the sentence's words, and into the
 * output) move. The step size LEARNING_RATE is chosen so that one step is
 * visible: the answer goes from wrong to just right. The real training (the
 * stream) takes much smaller steps, many times.
 */

/** Index, in the network's training sentences, of the sentence used (one the untrained network gets wrong). */
export const LEARNING_SENTENCE: Record<Locale, number> = { en: 343, fr: 450 };
export const LEARNING_RATE = 0.2;

type Net = Mlp & { vocab: string[] };

export interface LearningBeat {
  sentence: LabelledSentence;
  before: Net;
  after: Net;
  /** Probability of basketball before and after the step. */
  pBefore: number;
  pAfter: number;
}

/** One gradient step of a 1-hidden-layer tanh / sigmoid network on one example (binary cross-entropy). */
export function gradientStep(net: Net, x: readonly number[], y: number, lr: number): Net {
  const [, h, out] = forward(net, x) as [number[], number[], number[]];
  const d = out[0]! - y; // dLoss/dz for sigmoid + cross-entropy
  const next = { ...cloneMlp(net), vocab: net.vocab };
  const W1 = next.W[0]!;
  const W2 = next.W[1]![0]!;
  for (let j = 0; j < h.length; j++) {
    const dh = d * net.W[1]![0]![j]! * (1 - h[j]! * h[j]!);
    for (let i = 0; i < x.length; i++) if (x[i]) W1[j]![i]! -= lr * dh * x[i]!;
    next.b[0]![j]! -= lr * dh;
    W2[j]! -= lr * d * h[j]!;
  }
  next.b[1]![0]! -= lr * d;
  return next;
}

const cache = new Map<Locale, LearningBeat>();

export function learningBeat(locale: Locale): LearningBeat {
  let beat = cache.get(locale);
  if (!beat) {
    const tr = new TextNetTraining(locale);
    const before = tr.model;
    const sentence = tr.data[LEARNING_SENTENCE[locale]]!;
    const x = encode(sentence.text, before.vocab, locale);
    const after = gradientStep(before, x, sentence.label === "basketball" ? 1 : 0, LEARNING_RATE);
    const p = (n: Net) => forward(n, x)[2]![0]!;
    beat = { sentence, before, after, pBefore: p(before), pAfter: p(after) };
    cache.set(locale, beat);
  }
  return beat;
}

/**
 * The accuracy curve of the stream: the share of the 200 test sentences the
 * network gets right after each mini-batch of the real seeded training
 * (index 0: untrained). Computed once by trainNets.ts into curve.<locale>.json,
 * so no screen has to classify 200 sentences 420 times.
 */
export function computeAccuracyCurve(locale: Locale): number[] {
  const tr = new TextNetTraining(locale);
  const test = netTestSentences(locale).map((s) => ({ x: encode(s.text, tr.model.vocab, locale), y: s.label === "basketball" }));
  const acc = () => test.filter((t) => forward(tr.model, t.x)[2]![0]! >= 0.5 === t.y).length / test.length;
  const out = [acc()];
  while (tr.step()) out.push(acc());
  return out.map((v) => Math.round(v * 1000) / 1000);
}

const CURVES: Record<Locale, number[]> = { en: curveEn as number[], fr: curveFr as number[] };
export const accuracyCurve = (locale: Locale): number[] => CURVES[locale];
