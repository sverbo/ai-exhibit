import { seededRandom } from "./shared.ts";

/**
 * Geometry for the Swiss-cheese model (DefenseInDepth). Each layer is a unit
 * square (u, v) with circular holes. A hazard travels straight through all
 * layers at a fixed (u, v); it is stopped by the first layer where that point
 * is not inside a hole. One hole per layer is placed around ALIGNED so the
 * "holes line up" step is always reachable.
 */
export interface Hole {
  u: number;
  v: number;
  r: number;
}

export interface Hazard {
  u: number;
  v: number;
  /** Index of the layer that stopped it, or -1 when it went through every layer. */
  stop: number;
}

export interface DefenseState {
  attempts: number;
  passed: number;
  /** Most recent hazards, newest last, capped at MAX_RECENT. */
  recent: Hazard[];
}

export const ALIGNED = { u: 0.58, v: 0.42 } as const;
export const MAX_RECENT = 12;

export function makeLayers(count: number, seed = 91): Hole[][] {
  const rand = seededRandom(seed);
  const layers: Hole[][] = [];
  for (let i = 0; i < count; i++) {
    // The hole that makes the rare alignment possible, slightly jittered per layer.
    const holes: Hole[] = [
      { u: ALIGNED.u + (rand() - 0.5) * 0.06, v: ALIGNED.v + (rand() - 0.5) * 0.04, r: 0.075 + rand() * 0.02 },
    ];
    let guard = 0;
    while (holes.length < 5 && guard++ < 500) {
      const r = 0.06 + rand() * 0.06;
      const h = { u: r + 0.04 + rand() * (0.92 - 2 * r), v: r + 0.04 + rand() * (0.92 - 2 * r), r };
      const overlaps = holes.some((o) => Math.hypot(o.u - h.u, (o.v - h.v) * 1.4) < o.r + h.r + 0.04);
      if (!overlaps) holes.push(h);
    }
    layers.push(holes);
  }
  return layers;
}

/** Distances are measured with v compressed, matching how the holes are drawn (taller than wide). */
export function inHole(holes: Hole[], u: number, v: number): boolean {
  return holes.some((h) => Math.hypot(u - h.u, (v - h.v) * 1.4) <= h.r);
}

export function traverse(layers: Hole[][], u: number, v: number): number {
  for (let i = 0; i < layers.length; i++) {
    if (!inHole(layers[i]!, u, v)) return i;
  }
  return -1;
}

export function launch(layers: Hole[][], rand: () => number): Hazard {
  const u = 0.05 + rand() * 0.9;
  const v = 0.05 + rand() * 0.9;
  return { u, v, stop: traverse(layers, u, v) };
}

export function record(state: DefenseState | undefined, hazards: Hazard[]): DefenseState {
  const base = state ?? { attempts: 0, passed: 0, recent: [] };
  return {
    attempts: base.attempts + hazards.length,
    passed: base.passed + hazards.filter((h) => h.stop === -1).length,
    recent: [...base.recent, ...hazards].slice(-MAX_RECENT),
  };
}

/**
 * Scripted hazards for the reveal step: each one gets through some layers and
 * is stopped by a different later layer, so the audience sees partial failures.
 */
export function demoHazards(layers: Hole[][], seed = 5): Hazard[] {
  const rand = seededRandom(seed);
  const byStop = new Map<number, Hazard>();
  for (let n = 0; n < 20000 && byStop.size < Math.min(4, layers.length); n++) {
    const h = launch(layers, rand);
    if (h.stop >= 0 && !byStop.has(h.stop) && (h.stop > 0 || byStop.size === 0)) byStop.set(h.stop, h);
  }
  return [...byStop.values()].sort((a, b) => a.v - b.v);
}

export function alignedHazard(layers: Hole[][]): Hazard {
  return { ...ALIGNED, stop: traverse(layers, ALIGNED.u, ALIGNED.v) };
}
