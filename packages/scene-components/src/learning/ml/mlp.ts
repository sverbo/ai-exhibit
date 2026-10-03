/**
 * A tiny multilayer perceptron in plain TypeScript, small enough to train in a
 * browser frame. Hidden layers use tanh, every output unit is a sigmoid trained
 * with binary cross-entropy. A network with sizes [2, 1] is exactly logistic
 * regression (a straight decision boundary).
 */

/** Deterministic PRNG (mulberry32): same seed, same numbers, on every machine. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller) from a uniform PRNG. */
export function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Mlp {
  sizes: number[];
  /** W[l][j][i]: weight from unit i of layer l to unit j of layer l + 1. */
  W: number[][][];
  /** b[l][j]: bias of unit j of layer l + 1. */
  b: number[][];
}

export function createMlp(sizes: number[], seed: number): Mlp {
  const rng = mulberry32(seed);
  const W: number[][][] = [];
  const b: number[][] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const nIn = sizes[l]!;
    const nOut = sizes[l + 1]!;
    // Logistic regression starts from zero (a flat field); hidden layers need symmetry breaking.
    const scale = sizes.length === 2 ? 0 : Math.sqrt(1 / nIn);
    W.push(Array.from({ length: nOut }, () => Array.from({ length: nIn }, () => gaussian(rng) * scale)));
    b.push(Array.from({ length: nOut }, () => 0));
  }
  return { sizes: [...sizes], W, b };
}

export function cloneMlp(m: Mlp): Mlp {
  return {
    sizes: [...m.sizes],
    W: m.W.map((layer) => layer.map((row) => [...row])),
    b: m.b.map((layer) => [...layer]),
  };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Activations of every layer, input included. */
export function forward(m: Mlp, x: readonly number[]): number[][] {
  const acts: number[][] = [[...x]];
  const last = m.W.length - 1;
  for (let l = 0; l <= last; l++) {
    const prev = acts[l]!;
    const Wl = m.W[l]!;
    const bl = m.b[l]!;
    const out = new Array<number>(Wl.length);
    for (let j = 0; j < Wl.length; j++) {
      const row = Wl[j]!;
      let z = bl[j]!;
      for (let i = 0; i < row.length; i++) z += row[i]! * prev[i]!;
      out[j] = l === last ? sigmoid(z) : Math.tanh(z);
    }
    acts.push(out);
  }
  return acts;
}

export function predict(m: Mlp, x: readonly number[]): number[] {
  const acts = forward(m, x);
  return acts[acts.length - 1]!;
}

export function countParameters(m: Mlp): number {
  let n = 0;
  for (let l = 0; l < m.W.length; l++) n += m.W[l]!.length * (m.W[l]![0]?.length ?? 0) + m.b[l]!.length;
  return n;
}

/** Full-batch Adam on binary cross-entropy, with a small L2 penalty that keeps boundaries soft. */
export class Trainer {
  private mW: number[][][];
  private vW: number[][][];
  private mb: number[][];
  private vb: number[][];
  private t = 0;

  constructor(
    public model: Mlp,
    public lr = 0.05,
    public l2 = 1e-3,
  ) {
    const zerosLike3 = () => model.W.map((layer) => layer.map((row) => row.map(() => 0)));
    const zerosLike2 = () => model.b.map((layer) => layer.map(() => 0));
    this.mW = zerosLike3();
    this.vW = zerosLike3();
    this.mb = zerosLike2();
    this.vb = zerosLike2();
  }

  /** One gradient step on the whole dataset. Returns the mean loss before the step. */
  step(X: readonly (readonly number[])[], Y: readonly (readonly number[])[]): number {
    const m = this.model;
    const L = m.W.length;
    const gW = m.W.map((layer) => layer.map((row) => row.map(() => 0)));
    const gb = m.b.map((layer) => layer.map(() => 0));
    let loss = 0;
    const n = X.length;
    if (n === 0) return 0;
    for (let s = 0; s < n; s++) {
      const acts = forward(m, X[s]!);
      const y = Y[s]!;
      const out = acts[L]!;
      // dLoss/dz for sigmoid + BCE is (p - y).
      let delta = out.map((p, j) => {
        const t = y[j]!;
        loss += -(t * Math.log(Math.max(p, 1e-9)) + (1 - t) * Math.log(Math.max(1 - p, 1e-9)));
        return p - t;
      });
      for (let l = L - 1; l >= 0; l--) {
        const prev = acts[l]!;
        const Wl = m.W[l]!;
        for (let j = 0; j < delta.length; j++) {
          const d = delta[j]!;
          gb[l]![j]! += d;
          const gRow = gW[l]![j]!;
          for (let i = 0; i < prev.length; i++) gRow[i]! += d * prev[i]!;
        }
        if (l > 0) {
          const next = new Array<number>(prev.length).fill(0);
          for (let j = 0; j < delta.length; j++) {
            const row = Wl[j]!;
            for (let i = 0; i < prev.length; i++) next[i]! += row[i]! * delta[j]!;
          }
          // tanh'(z) = 1 - a^2
          delta = next.map((g, i) => g * (1 - prev[i]! * prev[i]!));
        }
      }
    }
    this.t++;
    const b1 = 0.9;
    const b2 = 0.999;
    const eps = 1e-8;
    const c1 = 1 - Math.pow(b1, this.t);
    const c2 = 1 - Math.pow(b2, this.t);
    const apply = (p: number[], g: number[], mm: number[], vv: number[], decay: boolean) => {
      for (let i = 0; i < p.length; i++) {
        const grad = g[i]! / n + (decay ? this.l2 * p[i]! : 0);
        mm[i] = b1 * mm[i]! + (1 - b1) * grad;
        vv[i] = b2 * vv[i]! + (1 - b2) * grad * grad;
        p[i]! -= (this.lr * (mm[i]! / c1)) / (Math.sqrt(vv[i]! / c2) + eps);
      }
    };
    for (let l = 0; l < L; l++) {
      for (let j = 0; j < m.W[l]!.length; j++) apply(m.W[l]![j]!, gW[l]![j]!, this.mW[l]![j]!, this.vW[l]![j]!, true);
      apply(m.b[l]!, gb[l]!, this.mb[l]!, this.vb[l]!, false);
    }
    return loss / n;
  }
}
