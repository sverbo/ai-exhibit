/**
 * The illustrative training animation in the 3D cloud (Training.tsx drives it,
 * Cloud3D.tsx draws it), as pure functions: a seeded start, so every screen
 * draws the same "random" cloud, and a position that depends only on the point
 * and the progress, so any window can draw any moment of it.
 */

/** Total length of the illustrative training animation. */
export const TRAINING_MS = 5200;
/** Spread of the starting cloud as a share of the cloud's radius (standard deviation): tight around the centre. */
export const START_SPREAD_3D = 0.13;
/** Wander of a moving point, as a share of the cloud's radius. */
export const WOBBLE_3D = 0.075;

/** mulberry32, so every screen draws the same "random" start. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(r: () => number): () => number {
  return () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

/**
 * Deterministic start positions in the cloud's own units: a tight seeded cloud
 * around `centre`, because embeddings start as small random values near zero.
 */
export function randomStart3d(count: number, centre: readonly number[], radius: number): [number, number, number][] {
  const g = gaussian(rng(20261005));
  const s = radius * START_SPREAD_3D;
  return Array.from({ length: count }, () => [centre[0]! + g() * s, centre[1]! + g() * s, centre[2]! + g() * s]);
}

/** Deterministic "untrained" numbers for the showcase word: small random values near zero. */
export function randomVector(length: number): number[] {
  const r = rng(7);
  return Array.from({ length }, () => Math.round((r() * 2 - 1) * 0.02 * 1000) / 1000);
}

/** Big moves first, then small refinements: the shape of a learning curve. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Where point `i` is in its own journey at global progress `t` in [0, 1]: each
 * point starts a little later than the previous ones, moves fast then slows
 * down while it wanders less and less, and lands exactly at t = 1.
 */
function journey(i: number, t: number) {
  const delay = ((i * 0.618034) % 1) * 0.3;
  const local = Math.min(1, Math.max(0, (t - delay) / (1 - delay)));
  return { local, e: easeOut(local), wander: Math.sin(local * Math.PI) * (1 - local), phase: i * 2.39996 };
}

/** Position of point `i` in the 3D cloud at global progress `t` in [0, 1]; `wobble` is the wander in cloud units. */
export function trainingPosition3d(
  start: readonly number[],
  end: readonly number[],
  i: number,
  t: number,
  wobble: number,
): [number, number, number] {
  const { local, e, wander, phase } = journey(i, t);
  const w = wander * wobble;
  return [
    start[0]! + (end[0]! - start[0]!) * e + Math.cos(phase + local * 9) * w,
    start[1]! + (end[1]! - start[1]!) * e + Math.sin(phase + local * 7) * w,
    start[2]! + (end[2]! - start[2]!) * e + Math.sin(phase * 1.3 + local * 8) * w,
  ];
}
