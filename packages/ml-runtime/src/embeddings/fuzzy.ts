/**
 * Fuzzy lookup of a typed query in the vocabulary, used when the live model is
 * unavailable (fallback mode): the explorer can still show the precomputed
 * neighbours of the closest vocabulary entry.
 */

/** Lowercase, strip accents and punctuation, collapse spaces. "Œuf !" -> "oeuf". */
export function foldText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur.push(Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost));
    }
    prev = cur;
  }
  return prev[b.length]!;
}

export interface FuzzyMatch {
  index: number;
  /** "exact": same text after folding; "prefix": query starts the label or the reverse; "typo": small edit distance. */
  kind: "exact" | "prefix" | "typo";
  distance: number;
}

/**
 * Best vocabulary match for a query, or null when nothing is close enough.
 * Tolerates accents, case, plural "s" and about one typo per three or four letters.
 */
export function fuzzyFind(query: string, labels: readonly string[]): FuzzyMatch | null {
  const q = foldText(query);
  if (!q) return null;
  const folded = labels.map(foldText);
  const exact = folded.indexOf(q);
  if (exact >= 0) return { index: exact, kind: "exact", distance: 0 };
  let best: FuzzyMatch | null = null;
  const budget = Math.max(1, Math.round(q.length / 3.5));
  folded.forEach((label, index) => {
    const distance = levenshtein(q, label);
    const isPrefix = q.length >= 3 && (label.startsWith(q) || q.startsWith(label)) && Math.abs(label.length - q.length) <= 2;
    let kind: FuzzyMatch["kind"] | null = null;
    if (isPrefix) kind = "prefix";
    else if (distance <= budget) kind = "typo";
    if (!kind) return;
    if (!best || distance < best.distance || (distance === best.distance && index < best.index)) {
      best = { index, kind, distance };
    }
  });
  return best;
}
