import type { Locale } from "@ai-exhibit/presentation-core";
import { wordSet, type LabelledSentence, type Sport } from "./text.ts";

/**
 * A decision tree learned from labelled sentences. Every question has the same
 * readable form, "does the sentence contain the word X?", and the learner
 * (CART with the Gini impurity) picks, at each step, the word that best
 * separates football from basketball among the sentences that reached that
 * point. Only words seen in at least `minCount` sentences are candidates.
 * Fully deterministic: ties go to the more frequent word, then alphabetical.
 */

export interface TreeLeaf {
  kind: "leaf";
  label: Sport;
  football: number;
  basketball: number;
}

export interface TreeSplit {
  kind: "split";
  /** "Does the sentence contain `word`?" (folded form, see text.ts). */
  word: string;
  yes: TreeNode;
  no: TreeNode;
  football: number;
  basketball: number;
}

export type TreeNode = TreeLeaf | TreeSplit;

export interface TreeOptions {
  maxDepth: number;
  /** A split must leave at least this many sentences on each side. */
  minLeaf: number;
  /** A word must appear in at least this many training sentences. */
  minCount: number;
}

const gini = (a: number, b: number) => {
  const n = a + b;
  if (n === 0) return 0;
  const p = a / n;
  return 2 * p * (1 - p) * n;
};

export function learnTree(samples: readonly LabelledSentence[], locale: Locale, opts: TreeOptions): TreeNode {
  const rows = samples.map((s) => ({ words: wordSet(s.text, locale), label: s.label }));
  const counts = new Map<string, number>();
  for (const r of rows) for (const w of r.words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const vocab = [...counts.entries()]
    .filter(([, c]) => c >= opts.minCount)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([w]) => w);

  const grow = (set: typeof rows, depth: number): TreeNode => {
    const football = set.filter((r) => r.label === "football").length;
    const basketball = set.length - football;
    const leaf: TreeLeaf = { kind: "leaf", label: football >= basketball ? "football" : "basketball", football, basketball };
    if (depth >= opts.maxDepth || football === 0 || basketball === 0) return leaf;
    const parent = gini(football, basketball);
    let best: { word: string; score: number } | null = null;
    for (const word of vocab) {
      let ys = 0;
      let yb = 0;
      for (const r of set) {
        if (r.words.has(word)) {
          if (r.label === "football") ys++;
          else yb++;
        }
      }
      const ns = football - ys;
      const nb = basketball - yb;
      if (ys + yb < opts.minLeaf || ns + nb < opts.minLeaf) continue;
      const score = gini(ys, yb) + gini(ns, nb);
      // vocab is already in tie-break order, so only a strictly better score wins.
      if (!best || score < best.score - 1e-9) best = { word, score };
    }
    if (!best || best.score >= parent - 1e-9) return leaf;
    const yesSet = set.filter((r) => r.words.has(best!.word));
    const noSet = set.filter((r) => !r.words.has(best!.word));
    const yes = grow(yesSet, depth + 1);
    const no = grow(noSet, depth + 1);
    // Two leaves that say the same thing are one leaf.
    if (yes.kind === "leaf" && no.kind === "leaf" && yes.label === no.label) return leaf;
    return { kind: "split", word: best.word, yes, no, football, basketball };
  };

  return grow(rows, 0);
}

export interface TreeStep {
  node: TreeSplit;
  answer: boolean;
}

/** The questions asked for one sentence, in order, and the final verdict. */
export function treePath(tree: TreeNode, words: ReadonlySet<string>): { steps: TreeStep[]; verdict: Sport } {
  const steps: TreeStep[] = [];
  let node = tree;
  while (node.kind === "split") {
    const answer = words.has(node.word);
    steps.push({ node, answer });
    node = answer ? node.yes : node.no;
  }
  return { steps, verdict: node.label };
}

export const classifyTree = (tree: TreeNode, text: string, locale: Locale) => treePath(tree, wordSet(text, locale)).verdict;

/** Every split, in reading order (depth first, "yes" branch first). */
export function treeSplits(tree: TreeNode): TreeSplit[] {
  if (tree.kind === "leaf") return [];
  return [tree, ...treeSplits(tree.yes), ...treeSplits(tree.no)];
}

export function treeDepth(tree: TreeNode): number {
  return tree.kind === "leaf" ? 0 : 1 + Math.max(treeDepth(tree.yes), treeDepth(tree.no));
}
