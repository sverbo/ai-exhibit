import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { flattenVocabulary } from "../../../../content/assets/embeddings/vocabulary.ts";
import {
  type CanonicalEmbeddingsJson,
  centerAndNormalize,
  decodeCanonical,
  locateQuery,
  locateVocabularyItem,
  queryText,
} from "./canonical.ts";
import { cosine } from "./geometry.ts";

const json = JSON.parse(
  readFileSync(new URL("../../../../content/assets/embeddings/canonical.json", import.meta.url), "utf8"),
) as CanonicalEmbeddingsJson;
const space = decodeCanonical(json);
const vocabulary = flattenVocabulary();
const indexOf = (text: string) => space.items.findIndex((i) => i.text === text);

describe("canonical.json", () => {
  it("was built from the current vocabulary", () => {
    const hash = createHash("sha256").update(JSON.stringify(vocabulary)).digest("hex");
    expect(json.vocabularyHash).toBe(hash);
    expect(json.labels).toEqual(vocabulary.map((v) => v.text));
  });

  it("has 300 to 500 items and stays compact", () => {
    expect(json.count).toBeGreaterThanOrEqual(300);
    expect(json.count).toBeLessThanOrEqual(500);
    expect(JSON.stringify(json).length).toBeLessThan(1.5 * 1024 * 1024);
  });

  it("decodes consistent columns", () => {
    expect(space.vectors).toHaveLength(json.count);
    expect(space.vectors[0]).toHaveLength(json.dims);
    expect(space.coords.umap2d).toHaveLength(json.count);
    expect(space.coords.umap3d[0]).toHaveLength(3);
    for (const p of space.coords.umap2d) for (const x of p) expect(Math.abs(x)).toBeLessThanOrEqual(1.0001);
  });

  it("dequantized vectors reproduce the stored neighbour similarities", () => {
    for (const i of [0, 50, 200]) {
      for (const n of space.neighboursOf(i).slice(0, 3)) {
        expect(cosine(space.vectors[i]!, space.vectors[n.index]!)).toBeCloseTo(n.similarity, 1);
      }
    }
  });

  it("shows the cross-lingual demo points", () => {
    for (const [fr, en] of [["chat", "cat"], ["roi", "king"], ["voiture", "car"]] as const) {
      const top = space.neighboursOf(indexOf(fr)).slice(0, 3).map((n) => space.items[n.index]!.text);
      expect(top).toContain(en);
    }
  });

  it("lists distortions that are close on the map and far in the full space", () => {
    expect(json.distortions.length).toBeGreaterThan(0);
    const d = json.distortions[0]!;
    expect(d.similarity).toBeLessThan(0.3);
    expect(d.trueRank).toBeGreaterThanOrEqual(json.neighbourK);
  });
});

describe("locating queries", () => {
  it("wraps typed text with the build template", () => {
    expect(queryText(space, "  chat ")).toBe(json.model.template.replace("{text}", "chat"));
  });

  it("puts a vocabulary vector back on its own position", () => {
    const i = indexOf("pluie");
    // Undo the centering to simulate a raw model output for that word.
    const raw = space.vectors[i]!.map((x, d) => x * 0.5 + json.centering.mean[d]!);
    expect(cosine(centerAndNormalize(raw, json.centering.mean), space.vectors[i]!)).toBeCloseTo(1, 5);
    const located = locateQuery(space, raw);
    expect(located.neighbours[0]!.index).toBe(i);
    const own = space.coords.umap2d[i]!;
    expect(Math.hypot(located.umap2d[0]! - own[0]!, located.umap2d[1]! - own[1]!)).toBeLessThan(0.2);
  });

  it("locates a vocabulary item from precomputed data only", () => {
    const i = indexOf("cat");
    const located = locateVocabularyItem(space, i, 5);
    expect(located.neighbours).toHaveLength(5);
    expect(located.neighbours[0]).toEqual({ index: i, similarity: 1 });
    expect(located.umap2d).toEqual(space.coords.umap2d[i]);
  });
});
