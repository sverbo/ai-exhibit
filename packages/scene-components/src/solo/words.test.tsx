import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import { Cloud3D } from "../embeddings/Cloud3D.tsx";
import { loadEmbeddingSpace } from "../embeddings/data.ts";
import { InteractiveMap } from "../embeddings/InteractiveMap.tsx";
import type { SoloEnv } from "./env.ts";
import WordsSolo, { exactWord } from "./WordsSolo.tsx";

let space: EmbeddingSpace;
const env = (locale: "en" | "fr"): SoloEnv => ({
  locale,
  live: true,
  cloud: () => ({}),
  left: () => 5,
  perHour: 5,
  report: () => "failed",
  reducedMotion: true,
});

describe("words demo on a phone", () => {
  beforeAll(async () => {
    space = await loadEmbeddingSpace();
  });

  it("offers the scene's views: 2D map, 3D cloud, show all words", () => {
    const en = renderToStaticMarkup(createElement(WordsSolo, { env: env("en") }));
    for (const label of ["2D map", "3D cloud", "Show all words"]) expect(en).toContain(label);
    expect(en).toMatch(/aria-pressed="true"[^>]*>2D map/);
    const fr = renderToStaticMarkup(createElement(WordsSolo, { env: env("fr") }));
    for (const label of ["Carte 2D", "Nuage 3D"]) expect(fr).toContain(label);
    expect(fr).not.toMatch(/[–—]|undefined|NaN/);
  });

  it("draws the map and the cloud at the phone's width, keeping their ratio", () => {
    const map = renderToStaticMarkup(
      createElement(InteractiveMap, {
        space,
        locale: "en",
        width: 520,
        height: 600,
        fluid: true,
        colored: true,
        clusterNames: true,
        pairs: false,
        interactive: true,
        camera: null,
        showAll: true,
        maxLabels: 140,
        reducedMotion: true,
      }),
    );
    expect(map).toContain("aspect-ratio:520 / 600");
    // "Show all words" stays within the phone's label cap.
    expect((map.match(/<text /g) ?? []).length).toBeLessThanOrEqual(140 + space.json.clusters.length + 2);
    const cloud = renderToStaticMarkup(
      createElement(Cloud3D, { space, locale: "fr", width: 520, height: 600, fluid: true, colored: true, clusterNames: true, spinning: false, interactive: true }),
    );
    expect(cloud).toContain("aspect-ratio:520 / 600");
    expect(cloud).toContain("Nuage de mots en 3D");
  });

  it("finds a word already on the map without asking the model", () => {
    const cat = space.items.findIndex((i) => i.text === "cat");
    expect(exactWord(space, "  CAT ")).toBe(cat);
    expect(exactWord(space, "a violinist")).toBe(-1);
  });
});
