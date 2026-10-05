/**
 * Greedy label placement for the embedding map: labels are tried, most
 * important first, at a few positions around their point; any label that would
 * overlap one already placed is dropped. Cheap enough to rerun on every step.
 */

export interface LabelRequest {
  /** Caller's key, returned unchanged. */
  key: string | number;
  text: string;
  /** Anchor point in map pixels. */
  x: number;
  y: number;
  /** Font size in pixels. */
  size: number;
  /** Higher is placed first. */
  priority: number;
  /** Centered on the point instead of beside it (cluster names). */
  centered?: boolean;
}

export interface PlacedLabel {
  key: string | number;
  text: string;
  /** Text anchor position (SVG `x`, `y` with `dominant-baseline: middle`). */
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  size: number;
}

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Approximate rendered width: Inter averages about 0.55 em per character. */
export function estimateWidth(text: string, size: number): number {
  return text.length * size * 0.55 + size * 0.2;
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/** Rectangles bucketed on a coarse grid, so overlap checks stay fast with many labels. */
export class RectIndex {
  private cells = new Map<number, Rect[]>();
  constructor(private readonly size = 64) {}
  private keys(r: Rect): number[] {
    const out: number[] = [];
    const x0 = Math.floor(r.x0 / this.size);
    const x1 = Math.floor(r.x1 / this.size);
    const y0 = Math.floor(r.y0 / this.size);
    const y1 = Math.floor(r.y1 / this.size);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push(x * 100003 + y);
    return out;
  }
  add(r: Rect) {
    for (const k of this.keys(r)) {
      const list = this.cells.get(k);
      if (list) list.push(r);
      else this.cells.set(k, [r]);
    }
  }
  hits(r: Rect): boolean {
    for (const k of this.keys(r)) {
      const list = this.cells.get(k);
      if (list?.some((t) => overlaps(r, t))) return true;
    }
    return false;
  }
}

/**
 * Fixed-position labels, most important first: each one is kept when it
 * overlaps no obstacle and no label kept before it (null: not shown at all).
 * A label given several places takes the first free one. Returns, per label,
 * the place used (1 for a single rect) or 0 when hidden. Used by the 3D cloud
 * on every frame.
 */
export function keepFree(
  rects: readonly (Rect | readonly Rect[] | null)[],
  obstacles: readonly Rect[] = [],
  out = new Uint8Array(rects.length),
): Uint8Array {
  const taken = new RectIndex();
  for (const o of obstacles) taken.add(o);
  rects.forEach((r, i) => {
    // Several places for one label: the first free one is used (1-based), 0 is hidden.
    const options = r === null ? [] : Array.isArray(r) ? r : [r as Rect];
    const k = options.findIndex((o) => !taken.hits(o));
    out[i] = k + 1;
    if (k >= 0) taken.add(options[k]!);
  });
  return out;
}

export interface PlaceOptions {
  gap?: number;
  obstacles?: readonly Rect[];
  /** Also try the four diagonal positions (dense maps, "show all"). */
  diagonals?: boolean;
  /** Stop after this many labels, to bound the work per frame. */
  max?: number;
}

export function placeLabels(
  requests: readonly LabelRequest[],
  bounds: { width: number; height: number },
  options: PlaceOptions = {},
): PlacedLabel[] {
  const gap = options.gap ?? 9;
  const taken = new RectIndex();
  for (const o of options.obstacles ?? []) taken.add(o);
  const out: PlacedLabel[] = [];
  const max = options.max ?? Infinity;
  const ordered = [...requests].sort((a, b) => b.priority - a.priority);
  for (const r of ordered) {
    if (out.length >= max) break;
    const w = estimateWidth(r.text, r.size);
    const h = r.size * 1.15;
    // Centered labels (names) are kept inside the box and may slide up or down a line.
    const cx = Math.min(Math.max(r.x, w / 2), bounds.width - w / 2);
    const side = (dx: number, dy: number, anchor: PlacedLabel["anchor"]) => {
      const x = r.x + dx;
      const y = r.y + dy;
      const x0 = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
      return { x, y, anchor, rect: { x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2 } };
    };
    const candidates: { x: number; y: number; anchor: PlacedLabel["anchor"]; rect: Rect }[] = r.centered
      ? [0, -1, 1, -2, 2].map((k) => {
          const y = Math.min(Math.max(r.y + k * h, h / 2), bounds.height - h / 2);
          return { x: cx, y, anchor: "middle" as const, rect: { x0: cx - w / 2, y0: y - h / 2, x1: cx + w / 2, y1: y + h / 2 } };
        })
      : [
          side(gap, 0, "start"),
          side(-gap, 0, "end"),
          side(0, -gap - h / 2, "middle"),
          side(0, gap + h / 2, "middle"),
          ...(options.diagonals
            ? [side(gap * 0.7, -h * 0.75, "start"), side(-gap * 0.7, -h * 0.75, "end"), side(gap * 0.7, h * 0.75, "start"), side(-gap * 0.7, h * 0.75, "end")]
            : []),
        ];
    const fit = candidates.find(
      (o) => o.rect.x0 >= 0 && o.rect.y0 >= 0 && o.rect.x1 <= bounds.width && o.rect.y1 <= bounds.height && !taken.hits(o.rect),
    );
    if (!fit) continue;
    taken.add(fit.rect);
    out.push({ key: r.key, text: r.text, x: fit.x, y: fit.y, anchor: fit.anchor, size: r.size });
  }
  return out;
}
