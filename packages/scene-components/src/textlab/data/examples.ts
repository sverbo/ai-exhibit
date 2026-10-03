import type { Locale } from "@ai-exhibit/presentation-core";
import { SMALL_SET } from "./small.ts";
import { tokenize, type LabelledSentence } from "./text.ts";
import { learnTree, type TreeNode } from "./tree.ts";

/**
 * The fixed cast of the text scenes. Everything here is either learned or
 * generated at runtime (cheap) or a constant that `textlab.test.ts`
 * re-derives, so nothing on screen is hand-picked without a way to check it.
 */

export const TREE_OPTIONS = { maxDepth: 3, minLeaf: 2, minCount: 2 };

const treeCache = new Map<Locale, TreeNode>();
/** The decision tree, learned (well under a millisecond) from the 24 hand-written sentences. */
export function textTree(locale: Locale): TreeNode {
  let t = treeCache.get(locale);
  if (!t) {
    t = learnTree(SMALL_SET[locale], locale, TREE_OPTIONS);
    treeCache.set(locale, t);
  }
  return t;
}

/** Fresh sentences, never used for training, scanned for the network's mistakes. */
export const FRESH = { seed: 99, perSport: 3000 };

/**
 * A new sentence, generated like the training ones, that the network gets
 * wrong with high confidence: index `index` of the fresh sentences, one of
 * `mistakes` mistakes among them.
 */
export interface NetFailure extends LabelledSentence {
  index: number;
  mistakes: number;
}

export const NET_FAIL: Record<Locale, NetFailure> = {
  en: { text: "The young forward hit the goalpost in the first half.", label: "football", index: 1210, mistakes: 19 },
  fr: { text: "L'ailier a marqué contre son camp devant un public conquis.", label: "football", index: 5766, mistakes: 32 },
};

/**
 * Scores, re-derived by textlab.test.ts. Kept as constants so that no screen
 * has to classify hundreds of sentences just to print a number.
 */
export const SCORES: Record<
  Locale,
  { ruleSmall: number; treeSmall: number; treeTest: number; netTest: number; testTotal: number; netTrainTotal: number }
> = {
  en: { ruleSmall: 18, treeSmall: 23, treeTest: 116, netTest: 199, testTotal: 200, netTrainTotal: 524 },
  fr: { ruleSmall: 17, treeSmall: 23, treeTest: 108, netTest: 199, testTotal: 200, netTrainTotal: 524 },
};

/** How a folded word is shown: its most common spelling in the hand-written sentences. */
export function displayWord(folded: string, locale: Locale): string {
  const counts = new Map<string, number>();
  for (const s of SMALL_SET[locale]) {
    for (const t of tokenize(s.text, locale)) {
      if (t.word === folded) counts.set(t.surface.toLowerCase(), (counts.get(t.surface.toLowerCase()) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? folded;
}
