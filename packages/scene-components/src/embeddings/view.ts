/**
 * Pan and zoom maths for the word map. Pure functions, no DOM.
 *
 * A camera is stored in data coordinates (the [-1, 1] UMAP space), so the same
 * camera means the same view on the presenter's screen and on the projector,
 * whatever the map's size in pixels.
 */

export interface Camera {
  /** Data coordinates shown at the centre of the map. */
  u: number;
  v: number;
  /** Zoom factor; 1 shows the whole map. */
  k: number;
}

export interface Frame {
  width: number;
  height: number;
  /** Pixels per data unit at k = 1 (axes may differ, see fitBox). */
  sx: number;
  sy: number;
  /** Data bounding box. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 14;

/** Same fit as MapView's fitBox: fill the box, axes stretched by at most 1.6x. */
export function frameFor(coords: readonly (readonly number[])[], width: number, height: number, margin = 40): Frame {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of coords) {
    x0 = Math.min(x0, p[0]!);
    x1 = Math.max(x1, p[0]!);
    y0 = Math.min(y0, p[1]!);
    y1 = Math.max(y1, p[1]!);
  }
  let sx = (width - 2 * margin) / Math.max(1e-6, x1 - x0);
  let sy = (height - 2 * margin) / Math.max(1e-6, y1 - y0);
  const maxRatio = 1.6;
  if (sx > sy * maxRatio) sx = sy * maxRatio;
  if (sy > sx * maxRatio) sy = sx * maxRatio;
  return { width, height, sx, sy, x0, x1, y0, y1 };
}

export function defaultCamera(f: Frame): Camera {
  return { u: (f.x0 + f.x1) / 2, v: (f.y0 + f.y1) / 2, k: 1 };
}

export function toScreen(p: readonly number[], c: Camera, f: Frame): [number, number] {
  return [f.width / 2 + (p[0]! - c.u) * f.sx * c.k, f.height / 2 - (p[1]! - c.v) * f.sy * c.k];
}

export function toData(pt: readonly [number, number], c: Camera, f: Frame): [number, number] {
  return [c.u + (pt[0] - f.width / 2) / (f.sx * c.k), c.v - (pt[1] - f.height / 2) / (f.sy * c.k)];
}

/**
 * Keeps the zoom within limits and the centre over the data, so the map can
 * never be lost off screen. At the minimum zoom the view snaps to the default.
 */
export function clampCamera(c: Camera, f: Frame): Camera {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number.isFinite(c.k) ? c.k : 1));
  if (k <= MIN_ZOOM + 1e-6) return defaultCamera(f);
  const u = Math.min(f.x1, Math.max(f.x0, Number.isFinite(c.u) ? c.u : (f.x0 + f.x1) / 2));
  const v = Math.min(f.y1, Math.max(f.y0, Number.isFinite(c.v) ? c.v : (f.y0 + f.y1) / 2));
  return { u, v, k };
}

/** Zooms by `factor` keeping the data point under `pt` (screen pixels) where it is. */
export function zoomAbout(c: Camera, factor: number, pt: readonly [number, number], f: Frame): Camera {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.k * factor));
  const d = toData(pt, c, f);
  const next = {
    u: d[0] - (pt[0] - f.width / 2) / (f.sx * k),
    v: d[1] + (pt[1] - f.height / 2) / (f.sy * k),
    k,
  };
  return clampCamera(next, f);
}

/** Moves the view by a drag of (dx, dy) screen pixels: the map follows the pointer. */
export function panBy(c: Camera, dx: number, dy: number, f: Frame): Camera {
  return clampCamera({ u: c.u - dx / (f.sx * c.k), v: c.v + dy / (f.sy * c.k), k: c.k }, f);
}

/** Interpolates two cameras; zoom moves in log space so it feels even. */
export function lerpCamera(a: Camera, b: Camera, t: number): Camera {
  return {
    u: a.u + (b.u - a.u) * t,
    v: a.v + (b.v - a.v) * t,
    k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * t),
  };
}

export function sameCamera(a: Camera, b: Camera, eps = 1e-4): boolean {
  return Math.abs(a.u - b.u) < eps && Math.abs(a.v - b.v) < eps && Math.abs(Math.log(a.k / b.k)) < eps;
}

/** Rounded copy for publishing in scene state. */
export function roundCamera(c: Camera): Camera {
  const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
  return { u: r(c.u, 5), v: r(c.v, 5), k: r(c.k, 4) };
}

/** How many ordinary word labels to try at a zoom level: few when zoomed out, all when zoomed in. */
export function labelBudgetFor(k: number, base: number): number {
  if (k < 1.4) return base;
  return Math.min(1000, Math.round(base * k * k));
}

/** Index of the nearest point to `pt` within `radius` screen pixels, or -1. */
export function pickPoint(
  pt: readonly [number, number],
  coords: readonly (readonly number[])[],
  c: Camera,
  f: Frame,
  radius = 16,
): number {
  let best = -1;
  let bestD = radius * radius;
  coords.forEach((p, i) => {
    const [x, y] = toScreen(p, c, f);
    const d = (x - pt[0]) ** 2 + (y - pt[1]) ** 2;
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
