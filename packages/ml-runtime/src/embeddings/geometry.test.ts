import { describe, expect, it } from "vitest";
import {
  cosine,
  dequantizeInt8,
  locateByNeighbours,
  seededRandom,
  topK,
} from "./geometry.ts";
import { foldText, fuzzyFind, levenshtein } from "./fuzzy.ts";

describe("cosine", () => {
  it("is 1 for parallel, 0 for orthogonal, -1 for opposite vectors", () => {
    expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 5])).toBeCloseTo(0);
    expect(cosine([1, 1], [-1, -1])).toBeCloseTo(-1);
  });
  it("returns 0 for a zero vector instead of NaN", () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe("topK", () => {
  it("returns the most similar vectors first and honours exclusions", () => {
    const vs = [[1, 0], [0.9, 0.1], [0, 1], [-1, 0]];
    const r = topK([1, 0], vs, 2);
    expect(r.map((n) => n.index)).toEqual([0, 1]);
    const r2 = topK([1, 0], vs, 2, new Set([0]));
    expect(r2.map((n) => n.index)).toEqual([1, 2]);
  });
});

describe("int8 dequantization", () => {
  it("rejects a buffer of the wrong size", () => {
    expect(() => dequantizeInt8(new Int8Array(3), [1], 4)).toThrow();
  });
});

describe("locateByNeighbours", () => {
  const coords = [[0, 0], [1, 0], [0, 1]];
  it("lands on a near-duplicate", () => {
    const p = locateByNeighbours([{ index: 1, similarity: 0.99 }, { index: 0, similarity: 0.5 }], coords);
    expect(p[0]).toBeCloseTo(1, 2);
    expect(p[1]).toBeCloseTo(0, 2);
  });
  it("lands between equally similar neighbours", () => {
    const p = locateByNeighbours([{ index: 1, similarity: 0.6 }, { index: 2, similarity: 0.6 }], coords);
    expect(p[0]).toBeCloseTo(0.5);
    expect(p[1]).toBeCloseTo(0.5);
  });
  it("returns an empty position without neighbours", () => {
    expect(locateByNeighbours([], coords)).toEqual([]);
  });
});

describe("seededRandom", () => {
  it("is deterministic per seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seededRandom(1)()).not.toEqual(seededRandom(2)());
  });
});

describe("fuzzy lookup", () => {
  const labels = ["chat", "cat", "œuf", "États-Unis", "éléphant", "intelligence artificielle"];
  it("folds accents, case and ligatures", () => {
    expect(foldText("  Œuf ! ")).toBe("oeuf");
    expect(foldText("États-Unis")).toBe("etats unis");
  });
  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
  it("matches exact, accentless, plural and typo queries", () => {
    expect(fuzzyFind("Chat", labels)).toMatchObject({ index: 0, kind: "exact" });
    expect(fuzzyFind("oeuf", labels)).toMatchObject({ index: 2, kind: "exact" });
    expect(fuzzyFind("etats unis", labels)).toMatchObject({ index: 3 });
    expect(fuzzyFind("elefant", labels)).toMatchObject({ index: 4, kind: "typo" });
    expect(fuzzyFind("chats", labels)).toMatchObject({ index: 0 });
  });
  it("returns null when nothing is close", () => {
    expect(fuzzyFind("astronaute", labels)).toBeNull();
    expect(fuzzyFind("   ", labels)).toBeNull();
  });
});
