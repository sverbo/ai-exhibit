/**
 * How many items of a generic layout are visible at a reveal step.
 * One item per step by default; when a scene declares fewer steps than items,
 * items are revealed in even groups. A scene with zero steps shows everything.
 */
export function visibleItemCount(itemCount: number, steps: number, revealStep: number): number {
  if (itemCount <= 0) return 0;
  if (steps <= 0) return itemCount;
  const perStep = Math.ceil(itemCount / steps);
  return Math.max(0, Math.min(itemCount, revealStep * perStep));
}

/** Column count for a card grid: rows of at most four, balanced. */
export function cardColumns(count: number): number {
  if (count <= 4) return Math.max(1, count);
  if (count <= 6) return 3;
  return 4;
}

/** Type size step for a one-idea slide: the shorter the text, the bigger it is set. */
export type DisplaySize = "short" | "medium" | "long";

export function displaySize(text: string, shortMax: number, mediumMax: number): DisplaySize {
  const n = text.trim().length;
  return n <= shortMax ? "short" : n <= mediumMax ? "medium" : "long";
}

/**
 * A statement made of a few short sentences ("Powerful. Opaque. Built in a
 * race.") is set one sentence per line; anything else stays one paragraph.
 */
export function statementLines(text: string): string[] {
  const parts = text.trim().match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)?.map((p) => p.trim()) ?? [];
  if (parts.length >= 2 && parts.length <= 4 && parts.join(" ") === text.trim() && parts.every((p) => p.length <= 28)) {
    return parts;
  }
  return [text.trim()];
}
