import type { Locale, SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { loadEmbeddingSpace } from "./data.ts";
import { EmbeddingExplorer } from "./EmbeddingExplorer.tsx";
import { searchVocabulary, selectWord } from "./search.ts";

function ctx(role: SceneRole, revealStep: number, locale: Locale, state?: unknown, mode: "live" | "fallback" = "live"): SceneContext {
  return {
    scene: {} as SceneDefinition,
    locale,
    revealStep,
    role,
    mode,
    state,
    setState: () => {},
    getSource: () => undefined,
    reducedMotion: false,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

const render = (C: SceneComponent, props: object, c: SceneContext) => renderToStaticMarkup(createElement(C, { props, ctx: c }));

describe("embedding components render in every role, step and locale", () => {
  beforeAll(async () => {
    // Components read the decoded space synchronously once it is cached.
    await loadEmbeddingSpace();
  });

  it("EmbeddingExplorer cloud", () => {
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["fr", "en"] as const) {
        for (const step of [0, 1, 2, 5]) {
          const html = render(EmbeddingExplorer, { mode: "cloud" }, ctx(role, step, locale));
          expect(html).toContain(locale === "fr" ? "Une carte des sens" : "A map of meanings");
          expect(html).not.toMatch(/undefined|NaN/);
        }
      }
    }
    const step1 = render(EmbeddingExplorer, { mode: "cloud" }, ctx("display", 1, "fr"));
    expect(step1).toContain("Animaux");
  });

  it("EmbeddingExplorer search, with and without a query", async () => {
    const space = await loadEmbeddingSpace();
    const query = searchVocabulary(space, "roi");
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["fr", "en"] as const) {
        const empty = render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, locale));
        expect(empty).not.toMatch(/NaN/);
        const withQuery = render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, locale, { query }));
        if (role !== "preview") expect(withQuery).toContain("king");
        const unknown = render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, locale, { query: searchVocabulary(space, "qqqqzz") }));
        expect(unknown).not.toMatch(/NaN/);
      }
    }
    const fallback = render(EmbeddingExplorer, { mode: "search" }, ctx("controller", 0, "fr", undefined, "fallback"));
    expect(fallback).toContain("Mode secours");
  });

  it("EmbeddingExplorer training", () => {
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["fr", "en"] as const) {
        for (const step of [0, 1, 2, 7]) {
          const html = render(EmbeddingExplorer, { mode: "training" }, ctx(role, step, locale, { replay: 2 }));
          expect(html).toContain(locale === "fr" ? "Les mots deviennent des points" : "Words become points");
          expect(html).toContain("Illustration");
          expect(html).not.toMatch(/NaN|undefined/);
        }
      }
    }
    // Step 0 shows the random numbers card; step 2 names the focus groups.
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("display", 0, "en"))).toContain("small random values near zero");
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("display", 2, "en"))).toContain("Emotions");
  });

  it("follows a published camera and selection in every role", async () => {
    const space = await loadEmbeddingSpace();
    const camera = { u: -0.3, v: 0.1, k: 4 };
    const i = space.items.findIndex((it) => it.text === "roi");
    for (const role of ["controller", "display", "preview"] as const) {
      const training = render(EmbeddingExplorer, { mode: "training" }, ctx(role, 2, "en", { camera, selected: i }));
      expect(training).not.toMatch(/NaN|undefined/);
      if (role !== "preview") expect(training).toContain("Neighbours of");
      const search = render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, "fr", { camera, query: selectWord(space, i) }));
      expect(search).not.toMatch(/NaN/);
      const cloud = render(EmbeddingExplorer, { mode: "cloud" }, ctx(role, 2, "en", { camera, selected: i, view: "3d", camera3d: { angle: 1, tilt: 0.2, zoom: 2 } }));
      expect(cloud).not.toMatch(/NaN/);
    }
    // Only the controller gets the zoom buttons.
    expect(render(EmbeddingExplorer, { mode: "search" }, ctx("controller", 0, "en"))).toContain("Reset view");
    expect(render(EmbeddingExplorer, { mode: "search" }, ctx("display", 0, "en"))).not.toContain("Reset view");
  });

  it("labels many more words with show all, on every screen", () => {
    const count = (html: string) => (html.match(/<text/g) ?? []).length;
    for (const role of ["controller", "display"] as const) {
      const normal = count(render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, "en", {})));
      const all = count(render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, "en", { showAll: true })));
      expect(all).toBeGreaterThan(normal + 50);
    }
    expect(render(EmbeddingExplorer, { mode: "search" }, ctx("controller", 0, "en"))).toContain("Show all words");
  });
});
