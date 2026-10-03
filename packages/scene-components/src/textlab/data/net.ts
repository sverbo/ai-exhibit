import type { Locale } from "@ai-exhibit/presentation-core";
import { countParameters, createMlp, forward, mulberry32, Trainer, type Mlp } from "../../learning/ml/mlp.ts";
import { generateSentences } from "./corpus.ts";
import { SMALL_SET } from "./small.ts";
import { wordSet, type LabelledSentence, type Sport } from "./text.ts";
import trainedEn from "./textNet.en.json";
import trainedFr from "./textNet.fr.json";

/**
 * The neural network of the text scenes, one per language: a bag of words
 * (one input per known word: 1 if the sentence contains it, else 0), one
 * hidden layer of 16 tanh neurons, one sigmoid output ("how much
 * basketball"). Trained once, deterministically, with mini-batch Adam on 600
 * generated sentences plus the 24 hand-written ones; the result is committed
 * in textNet.<locale>.json and a test checks that a fresh training reproduces
 * it.
 */

export const NET_HIDDEN = 16;
export const NET_TRAIN = { seed: 31, perSport: 250 };
export const NET_TEST = { seed: 32, perSport: 100 };
/** A word joins the vocabulary when it appears in at least this many training sentences. */
export const MIN_WORD_COUNT = 2;

const TRAINING = { initSeed: 7, shuffleSeed: 8, epochs: 20, batch: 25, lr: 0.01, l2: 1e-4 };

export interface TextNetFile extends Mlp {
  /** The input words, in input order (folded forms, see text.ts). */
  vocab: string[];
  trainAccuracy: number;
  testAccuracy: number;
}

const trainCache = new Map<Locale, LabelledSentence[]>();
const testCache = new Map<Locale, LabelledSentence[]>();

/** The 600 generated sentences followed by the 24 hand-written ones. */
export function netTrainingSentences(locale: Locale): LabelledSentence[] {
  let v = trainCache.get(locale);
  if (!v) {
    const small = SMALL_SET[locale];
    v = [...generateSentences(locale, NET_TRAIN.seed, NET_TRAIN.perSport, new Set(small.map((s) => s.text))), ...small];
    trainCache.set(locale, v);
  }
  return v;
}

/** 200 new sentences, none of them in the training set. */
export function netTestSentences(locale: Locale): LabelledSentence[] {
  let v = testCache.get(locale);
  if (!v) {
    v = generateSentences(locale, NET_TEST.seed, NET_TEST.perSport, new Set(netTrainingSentences(locale).map((s) => s.text)));
    testCache.set(locale, v);
  }
  return v;
}

export function buildVocab(sentences: readonly LabelledSentence[], locale: Locale): string[] {
  const counts = new Map<string, number>();
  for (const s of sentences) for (const w of wordSet(s.text, locale)) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, c]) => c >= MIN_WORD_COUNT)
    .map(([w]) => w)
    .sort();
}

export function encode(text: string, vocab: readonly string[], locale: Locale): number[] {
  const words = wordSet(text, locale);
  return vocab.map((w) => (words.has(w) ? 1 : 0));
}

/**
 * The seeded training, one mini-batch at a time, so the network scene can
 * show it happening. `trainTextNet` runs it to the end; both give exactly the
 * same numbers.
 */
export class TextNetTraining {
  readonly model: Mlp & { vocab: string[] };
  readonly data: LabelledSentence[];
  /** Mini-batches in the whole training (epochs x batches per epoch). */
  readonly totalSteps: number;
  readonly batchSize = TRAINING.batch;
  readonly epochs = TRAINING.epochs;
  private readonly trainer: Trainer;
  private readonly rng: () => number;
  private readonly X: number[][];
  private readonly Y: number[][];
  private readonly order: number[];
  private readonly perEpoch: number;
  /** Mini-batches done so far. */
  steps = 0;
  /** Training sentences of the last mini-batch (indices into `data`). */
  lastBatch: number[] = [];

  constructor(readonly locale: Locale) {
    this.data = netTrainingSentences(locale);
    const vocab = buildVocab(this.data, locale);
    this.model = { ...createMlp([vocab.length, NET_HIDDEN, 1], TRAINING.initSeed), vocab };
    this.trainer = new Trainer(this.model, TRAINING.lr, TRAINING.l2);
    this.rng = mulberry32(TRAINING.shuffleSeed);
    this.X = this.data.map((s) => encode(s.text, vocab, locale));
    this.Y = this.data.map((s) => [s.label === "basketball" ? 1 : 0]);
    this.order = this.X.map((_, i) => i);
    this.perEpoch = Math.ceil(this.data.length / TRAINING.batch);
    this.totalSteps = this.perEpoch * TRAINING.epochs;
  }

  get done(): boolean {
    return this.steps >= this.totalSteps;
  }

  /** Training sentences seen so far (a sentence seen in two epochs counts twice). */
  get seen(): number {
    const epochs = Math.floor(this.steps / this.perEpoch);
    const inEpoch = this.steps % this.perEpoch;
    return epochs * this.data.length + Math.min(this.data.length, inEpoch * TRAINING.batch);
  }

  /** One mini-batch. Returns false when training is over. */
  step(): boolean {
    if (this.done) return false;
    const k = this.steps % this.perEpoch;
    if (k === 0) {
      const order = this.order;
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [order[i], order[j]] = [order[j]!, order[i]!];
      }
    }
    const idx = this.order.slice(k * TRAINING.batch, (k + 1) * TRAINING.batch);
    this.trainer.step(
      idx.map((i) => this.X[i]!),
      idx.map((i) => this.Y[i]!),
    );
    this.lastBatch = idx;
    this.steps++;
    return true;
  }
}

/** Trains a network from scratch (deterministic, well under a second). Used to generate textNet.<locale>.json. */
export function trainTextNet(locale: Locale): Mlp & { vocab: string[] } {
  const training = new TextNetTraining(locale);
  while (training.step());
  return training.model;
}

const TRAINED: Record<Locale, TextNetFile> = { en: trainedEn as TextNetFile, fr: trainedFr as TextNetFile };

/** The committed network (no training at runtime). */
export const textNet = (locale: Locale): TextNetFile => TRAINED[locale];

/** Probability of "basketball" for a sentence. */
export function netBasketballProbability(text: string, locale: Locale, net: Mlp & { vocab: string[] } = textNet(locale)): number {
  return forward(net, encode(text, net.vocab, locale)).at(-1)![0]!;
}

export const netVerdict = (text: string, locale: Locale, net: Mlp & { vocab: string[] } = textNet(locale)): Sport =>
  netBasketballProbability(text, locale, net) >= 0.5 ? "basketball" : "football";

export function netAccuracy(sentences: readonly LabelledSentence[], locale: Locale, net: Mlp & { vocab: string[] } = textNet(locale)): number {
  return sentences.filter((s) => netVerdict(s.text, locale, net) === s.label).length / sentences.length;
}

export const netParameterCount = (locale: Locale) => countParameters(textNet(locale));

/** Rounds every number to 6 decimals, the precision committed in the JSON files. */
export function serializeNet(net: Mlp & { vocab: string[] }, locale: Locale): TextNetFile {
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  const rounded = { sizes: net.sizes, vocab: net.vocab, W: net.W.map((l) => l.map((row) => row.map(r))), b: net.b.map((l) => l.map(r)) };
  return {
    ...rounded,
    trainAccuracy: netAccuracy(netTrainingSentences(locale), locale, rounded),
    testAccuracy: netAccuracy(netTestSentences(locale), locale, rounded),
  };
}
