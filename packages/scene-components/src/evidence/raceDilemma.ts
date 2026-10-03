/**
 * Prisoner's-dilemma analogy for race dynamics (scene 10.8). Payoffs are
 * ordinal ranks (4 = best, 1 = worst) chosen to illustrate the structure of
 * the dilemma; they are not estimates about any real actor.
 */
export type Choice = "careful" | "race";
export type CellId = `${Choice}-${Choice}`; // row (A) then column (B)

export const CHOICES: Choice[] = ["careful", "race"];

export const PAYOFFS: Record<CellId, { a: number; b: number }> = {
  "careful-careful": { a: 3, b: 3 },
  "careful-race": { a: 1, b: 4 },
  "race-careful": { a: 4, b: 1 },
  "race-race": { a: 2, b: 2 },
};

export function cellId(a: Choice, b: Choice): CellId {
  return `${a}-${b}`;
}

/** B's best reply when A plays `a`. */
export function bestResponseB(a: Choice): Choice {
  return PAYOFFS[cellId(a, "race")].b > PAYOFFS[cellId(a, "careful")].b ? "race" : "careful";
}

/** A's best reply when B plays `b`. */
export function bestResponseA(b: Choice): Choice {
  return PAYOFFS[cellId("race", b)].a > PAYOFFS[cellId("careful", b)].a ? "race" : "careful";
}

/** Pure-strategy Nash equilibria. */
export function equilibria(): CellId[] {
  const out: CellId[] = [];
  for (const a of CHOICES) for (const b of CHOICES) {
    if (bestResponseA(b) === a && bestResponseB(a) === b) out.push(cellId(a, b));
  }
  return out;
}

/** True when `x` is better than `y` for both players. */
export function paretoBetter(x: CellId, y: CellId): boolean {
  return PAYOFFS[x].a > PAYOFFS[y].a && PAYOFFS[x].b > PAYOFFS[y].b;
}

export const STEP_COUNT = 5;

/** Which cells each reveal step emphasizes, and which column/row comparison it draws. */
export function stepFocus(step: number): { cells: CellId[]; compareRowA?: Choice } {
  switch (step) {
    case 2: return { cells: ["careful-careful", "careful-race"], compareRowA: "careful" };
    case 3: return { cells: ["race-careful", "race-race"], compareRowA: "race" };
    case 4: return { cells: ["race-race", "careful-careful"] };
    default: return { cells: [] };
  }
}
