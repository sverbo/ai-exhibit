import { describe, expect, it } from "vitest";
import { generateSentences } from "./corpus.ts";
import { FRESH, NET_FAIL, SCORES, textTree } from "./examples.ts";
import {
  NET_HIDDEN,
  netAccuracy,
  netBasketballProbability,
  netParameterCount,
  netTestSentences,
  netTrainingSentences,
  netVerdict,
  serializeNet,
  textNet,
  trainTextNet,
  TextNetTraining,
} from "./net.ts";
import { accuracyCurve, computeAccuracyCurve, gradientStep, learningBeat } from "./learning.ts";
import { MAX_WORDS, SHOWN_NEURONS, simpleActivity, simpleSelect, simpleView } from "./simple.ts";
import { forward } from "../../learning/ml/mlp.ts";
import { encode } from "./net.ts";
import { applyRule } from "./rule.ts";
import { RULE_FAIL, RULE_RIGHT, SMALL_SET, TASK, TREE_EXAMPLE, TREE_TRAP } from "./small.ts";
import { tokenize, wordSet } from "./text.ts";
import { classifyTree, treeDepth, treePath, treeSplits } from "./tree.ts";

const LOCALES = ["en", "fr"] as const;

const activity = (net: ReturnType<typeof textNet>, text: string, loc: "en" | "fr") => ({ hidden: forward(net, encode(text, net.vocab, loc))[1]! });

/** The sentences on screen must not contain long dashes (house style). */
const NO_DASH = /[\u2013\u2014]/;

describe("reading sentences", () => {
  it("folds plurals and ignores grammar words", () => {
    expect([...wordSet("Il est venu jouer au foot en baskets.", "fr")]).toEqual(["venu", "jouer", "foot", "basket"]);
    expect([...wordSet("The striker smashed the ball into the back of the net.", "en")]).toEqual([
      "striker",
      "smashed",
      "ball",
      "back",
      "net",
    ]);
    expect(tokenize("L'ailier", "fr").map((t) => t.surface)).toEqual(["L", "ailier"]);
  });

  it("small sets: 12 sentences per sport, no long dashes", () => {
    for (const loc of LOCALES) {
      const set = SMALL_SET[loc];
      expect(set.filter((s) => s.label === "football")).toHaveLength(12);
      expect(set.filter((s) => s.label === "basketball")).toHaveLength(12);
      for (const s of [...set, RULE_FAIL[loc], TREE_TRAP[loc], NET_FAIL[loc]]) expect(s.text).not.toMatch(NO_DASH);
    }
  });

  it("task sentences have the labels the task scene shows", () => {
    for (const loc of LOCALES) {
      const set = SMALL_SET[loc];
      for (const i of TASK.football) expect(set[i]!.label).toBe("football");
      for (const i of TASK.basketball) expect(set[i]!.label).toBe("basketball");
      expect(set[TASK.hero]).toBeDefined();
    }
  });

  it("generated sentences are deterministic and distinct", () => {
    for (const loc of LOCALES) {
      const a = generateSentences(loc, 5, 40);
      expect(a).toEqual(generateSentences(loc, 5, 40));
      expect(new Set(a.map((s) => s.text)).size).toBe(a.length);
      for (const s of a) expect(s.text).not.toMatch(NO_DASH);
    }
  });

  it("the small set misses what the tree-unseen scene says it misses", () => {
    // English: no football sentence mentions the net. French: no football sentence mentions shoes ("baskets").
    expect(SMALL_SET.en.filter((s) => s.label === "football" && wordSet(s.text, "en").has("net"))).toHaveLength(0);
    expect(SMALL_SET.fr.filter((s) => s.label === "football" && wordSet(s.text, "fr").has("basket"))).toHaveLength(0);
    // The big training set does have them.
    expect(netTrainingSentences("en").some((s) => s.label === "football" && wordSet(s.text, "en").has("net"))).toBe(true);
    expect(netTrainingSentences("fr").some((s) => s.label === "football" && wordSet(s.text, "fr").has("basket"))).toBe(true);
  });
});

describe("hand-written rule", () => {
  it("scores what the rules scene says on the 24 examples", () => {
    for (const loc of LOCALES) {
      const right = SMALL_SET[loc].filter((s) => applyRule(s.text, loc).verdict === s.label).length;
      expect(right, loc).toBe(SCORES[loc].ruleSmall);
    }
  });

  it("gets the showcased sentence right with a keyword, and the new one wrong", () => {
    for (const loc of LOCALES) {
      const ok = SMALL_SET[loc][RULE_RIGHT]!;
      const trace = applyRule(ok.text, loc);
      expect(trace.verdict).toBe(ok.label);
      expect(trace.keyword).not.toBeNull();
      const fail = applyRule(RULE_FAIL[loc].text, loc);
      expect(fail.verdict).not.toBe(RULE_FAIL[loc].label);
      expect(fail.line).toBe(0);
    }
  });
});

describe("decision tree", () => {
  it("is small and readable, and learned the odd rule first", () => {
    for (const loc of LOCALES) {
      const tree = textTree(loc);
      expect(treeDepth(tree)).toBeLessThanOrEqual(3);
      expect(treeSplits(tree).map((s) => s.word)).toEqual(loc === "en" ? ["net", "hoop"] : ["basket", "panier"]);
      expect(tree.kind === "split" && tree.yes.kind === "leaf" && tree.yes.label).toBe("basketball");
    }
  });

  it("scores what the tree scenes say", () => {
    for (const loc of LOCALES) {
      const tree = textTree(loc);
      expect(SMALL_SET[loc].filter((s) => classifyTree(tree, s.text, loc) === s.label).length).toBe(SCORES[loc].treeSmall);
      const test = netTestSentences(loc);
      expect(test).toHaveLength(SCORES[loc].testTotal);
      expect(test.filter((s) => classifyTree(tree, s.text, loc) === s.label).length).toBe(SCORES[loc].treeTest);
    }
  });

  it("walks the default example to the right answer", () => {
    for (const loc of LOCALES) {
      const s = SMALL_SET[loc][TREE_EXAMPLE]!;
      expect(classifyTree(textTree(loc), s.text, loc)).toBe(s.label);
    }
  });

  it("falls into the trap: one question, answered yes, the wrong sport", () => {
    for (const loc of LOCALES) {
      const trap = TREE_TRAP[loc];
      const { steps, verdict } = treePath(textTree(loc), wordSet(trap.text, loc));
      expect(trap.label).toBe("football");
      expect(verdict).toBe("basketball");
      expect(steps).toHaveLength(1);
      expect(steps[0]!.answer).toBe(true);
    }
  });
});

describe("neural network", () => {
  it("has thousands of numbers", () => {
    for (const loc of LOCALES) {
      const net = textNet(loc);
      expect(net.sizes).toEqual([net.vocab.length, NET_HIDDEN, 1]);
      expect(netParameterCount(loc)).toBe(net.vocab.length * NET_HIDDEN + NET_HIDDEN + NET_HIDDEN + 1);
      expect(netParameterCount(loc)).toBeGreaterThan(3000);
    }
  });

  it("scores what the network scene says, and gets the trap right", () => {
    for (const loc of LOCALES) {
      expect(netTrainingSentences(loc)).toHaveLength(SCORES[loc].netTrainTotal);
      const test = netTestSentences(loc);
      expect(test.filter((s) => netVerdict(s.text, loc) === s.label).length).toBe(SCORES[loc].netTest);
      expect(textNet(loc).testAccuracy).toBeCloseTo(SCORES[loc].netTest / SCORES[loc].testTotal, 9);
      // No test sentence was seen in training.
      const train = new Set(netTrainingSentences(loc).map((s) => s.text));
      expect(test.some((s) => train.has(s.text))).toBe(false);
      expect(netVerdict(TREE_TRAP[loc].text, loc)).toBe(TREE_TRAP[loc].label);
    }
  });

  it("is confidently wrong on the picked failure, one of the mistakes among fresh sentences", () => {
    for (const loc of LOCALES) {
      const fail = NET_FAIL[loc];
      const train = new Set(netTrainingSentences(loc).map((s) => s.text));
      const fresh = generateSentences(loc, FRESH.seed, FRESH.perSport, train);
      expect(fresh[fail.index]).toEqual({ text: fail.text, label: fail.label });
      expect(fresh.filter((s) => netVerdict(s.text, loc) !== s.label)).toHaveLength(fail.mistakes);
      const p = netBasketballProbability(fail.text, loc);
      expect(fail.label).toBe("football");
      expect(p).toBeGreaterThan(0.9);
    }
  }, 30_000);

  it("trains one mini-batch at a time, to the same end", () => {
    for (const loc of LOCALES) {
      const tr = new TextNetTraining(loc);
      expect(tr.seen).toBe(0);
      tr.step();
      expect(tr.seen).toBe(tr.batchSize);
      while (tr.step());
      expect(tr.done).toBe(true);
      expect(tr.seen).toBe(tr.epochs * SCORES[loc].netTrainTotal);
      const saved = textNet(loc).W.flat(2);
      tr.model.W.flat(2).forEach((v, i) => expect(Math.abs(v - saved[i]!)).toBeLessThan(1e-5));
    }
  }, 30_000);

  /**
   * textNet.<locale>.json is what every screen loads. It must be exactly what
   * the seeded training produces. To regenerate after changing the sentences
   * or the training, run data/trainNets.ts (see README).
   */
  it("textNet.<locale>.json matches a fresh training", () => {
    for (const loc of LOCALES) {
      const fresh = serializeNet(trainTextNet(loc), loc);
      const saved = textNet(loc);
      expect(saved.vocab).toEqual(fresh.vocab);
      expect(saved.sizes).toEqual(fresh.sizes);
      const a = saved.W.flat(2);
      const b = fresh.W.flat(2);
      expect(a).toHaveLength(b.length);
      a.forEach((v, i) => expect(Math.abs(v - b[i]!)).toBeLessThan(1e-5));
      saved.b.flat().forEach((v, i) => expect(Math.abs(v - fresh.b.flat()[i]!)).toBeLessThan(1e-5));
      expect(saved.trainAccuracy).toBeCloseTo(netAccuracy(netTrainingSentences(loc), loc), 9);
    }
  }, 30_000);
});

describe("simplified network view", () => {
  it("draws the sentence's known words and its most influential neurons, with the real weights", () => {
    for (const loc of LOCALES) {
      const net = textNet(loc);
      for (const text of [TREE_TRAP[loc].text, NET_FAIL[loc].text]) {
        const sel = simpleSelect(net, text, loc);
        const known = [...wordSet(text, loc)].filter((w) => net.vocab.includes(w));
        expect(sel.words.map((w) => net.vocab[w.index])).toEqual(known.slice(0, MAX_WORDS));
        expect(sel.neurons).toHaveLength(SHOWN_NEURONS);
        // The chosen neurons weigh more on the answer than any neuron left out.
        const h = activity(net, text, loc).hidden;
        const influence = (j: number) => Math.abs(h[j]! * net.W[1]![0]![j]!);
        const minIn = Math.min(...sel.neurons.map(influence));
        for (let j = 0; j < NET_HIDDEN; j++) if (!sel.neurons.includes(j)) expect(influence(j)).toBeLessThanOrEqual(minIn);
        const v = simpleView(net, sel);
        expect(v.w1[0]![0]).toBe(net.W[0]![sel.neurons[0]!]![sel.words[0]!.index]);
        // The output shown is the whole network's, nothing left out.
        expect(simpleActivity(net, sel, text, loc).p).toBeCloseTo(netBasketballProbability(text, loc), 12);
        expect(simpleActivity(net, sel, text, loc).inputs.every((x) => x === 1)).toBe(true);
      }
    }
  });

  it("two outputs give the network's own probability", () => {
    for (const loc of LOCALES) {
      const p = netBasketballProbability(NET_FAIL[loc].text, loc);
      // softmax(-z/2, z/2) for basketball equals sigmoid(z).
      const z = Math.log(p / (1 - p));
      expect(Math.exp(z / 2) / (Math.exp(z / 2) + Math.exp(-z / 2))).toBeCloseTo(p, 12);
    }
  });
});

describe("learning beat", () => {
  it("one real step on one sentence: wrong before, closer after, only the connections that took part move", () => {
    for (const loc of LOCALES) {
      const beat = learningBeat(loc);
      const y = beat.sentence.label === "basketball" ? 1 : 0;
      const right = (p: number) => (y === 1 ? p : 1 - p);
      // The untrained network is the real starting point of the training, and it guesses wrong.
      expect(beat.before.W.flat(2)).toEqual(new TextNetTraining(loc).model.W.flat(2));
      expect(right(beat.pBefore)).toBeLessThan(0.5);
      // One step: a bit better (the right answer gains, but stays far from certain).
      expect(right(beat.pAfter)).toBeGreaterThan(right(beat.pBefore) + 0.05);
      expect(right(beat.pAfter)).toBeLessThan(0.8);
      expect(right(beat.pAfter)).toBeGreaterThan(0.5);
      // Words the sentence does not contain keep their connections.
      const x = new Set(wordSet(beat.sentence.text, loc));
      beat.before.vocab.forEach((w, i) => {
        const moved = beat.before.W[0]!.some((row, j) => row[i] !== beat.after.W[0]![j]![i]);
        expect(moved, `${loc} ${w}`).toBe(x.has(w));
      });
    }
  });

  it("a gradient step with no step size changes nothing", () => {
    const beat = learningBeat("en");
    const x = beat.before.vocab.map(() => 1);
    expect(gradientStep(beat.before, x, 1, 0).W.flat(2)).toEqual(beat.before.W.flat(2));
  });
});

describe("learning stream", () => {
  /** curve.<locale>.json must be what the seeded training gives (regenerate with data/trainNets.ts). */
  it("the accuracy curve matches a fresh training: untrained near chance, trained as the network scene says", () => {
    for (const loc of LOCALES) {
      const saved = accuracyCurve(loc);
      expect(saved).toEqual(computeAccuracyCurve(loc));
      expect(saved).toHaveLength(new TextNetTraining(loc).totalSteps + 1);
      expect(saved[0]!).toBeLessThan(0.6);
      expect(saved.at(-1)).toBeCloseTo(SCORES[loc].netTest / SCORES[loc].testTotal, 9);
    }
  }, 30_000);
});
