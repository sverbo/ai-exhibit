/**
 * Pure vector helpers for the embedding explorer and the /api/embed endpoint.
 * No DOM, no model, no I/O.
 */

export type Vector = Float32Array | number[];

export function dot(a: Vector, b: Vector): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i]! * b[i]!;
  return s;
}

export function norm(a: Vector): number {
  return Math.sqrt(dot(a, a));
}

/** Cosine similarity in [-1, 1]; 0 when either vector is zero. */
export function cosine(a: Vector, b: Vector): number {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
}

export function normalize(a: Vector): Float32Array {
  const n = norm(a);
  const out = new Float32Array(a.length);
  if (n === 0) return out;
  for (let i = 0; i < a.length; i++) out[i] = a[i]! / n;
  return out;
}

export interface Neighbour {
  index: number;
  similarity: number;
}

/**
 * The k most similar vectors to `query` by cosine similarity, best first.
 * Ties break on the lower index so results are deterministic.
 */
export function topK(
  query: Vector,
  vectors: readonly Vector[],
  k: number,
  exclude: ReadonlySet<number> = new Set(),
): Neighbour[] {
  const qn = norm(query);
  const scored: Neighbour[] = [];
  for (let i = 0; i < vectors.length; i++) {
    if (exclude.has(i)) continue;
    const v = vectors[i]!;
    const d = qn * norm(v);
    scored.push({ index: i, similarity: d === 0 ? 0 : dot(query, v) / d });
  }
  scored.sort((x, y) => y.similarity - x.similarity || x.index - y.index);
  return scored.slice(0, k);
}

// Int8 quantization (one scale per vector) --------------------------------

/** Splits a flat int8 buffer into `scales.length` float vectors of `dims`. */
export function dequantizeInt8(flat: Int8Array, scales: readonly number[], dims: number): Float32Array[] {
  if (flat.length !== scales.length * dims) {
    throw new Error(`dequantizeInt8: expected ${scales.length * dims} values, got ${flat.length}`);
  }
  const out: Float32Array[] = [];
  for (let r = 0; r < scales.length; r++) {
    const s = scales[r]!;
    const v = new Float32Array(dims);
    for (let i = 0; i < dims; i++) v[i] = flat[r * dims + i]! * s;
    out.push(v);
  }
  return out;
}

// Base64 to bytes, identical in Node (>= 16) and browsers ------------------

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Locating a new vector on an existing 2D/3D map ----------------------------

/**
 * Approximate map position for a vector that was not part of the projection:
 * a similarity-weighted average of its nearest neighbours' coordinates.
 * Weights are exp(sharpness * similarity), so a near-duplicate of a vocabulary
 * word lands on top of it while a vague query lands between its neighbours.
 * Works for any number of coordinate dimensions.
 */
export function locateByNeighbours(
  neighbours: readonly Neighbour[],
  coords: readonly (readonly number[])[],
  k = 5,
  sharpness = 20,
): number[] {
  const top = neighbours.slice(0, k);
  if (top.length === 0) return [];
  const dims = coords[top[0]!.index]!.length;
  const best = top[0]!.similarity;
  const out = new Array<number>(dims).fill(0);
  let total = 0;
  for (const n of top) {
    const w = Math.exp(sharpness * (n.similarity - best));
    const c = coords[n.index]!;
    for (let d = 0; d < dims; d++) out[d]! += w * c[d]!;
    total += w;
  }
  return out.map((x) => x / total);
}

// Deterministic randomness ----------------------------------------------------

/** mulberry32: tiny seeded PRNG returning floats in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
