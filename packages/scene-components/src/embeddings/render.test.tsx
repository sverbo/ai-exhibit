import type { Locale, SceneDefinition } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { loadEmbeddingSpace } from "./data.ts";
import { EmbeddingExplorer } from "./EmbeddingExplorer.tsx";
import { DIMENSION_STEPS } from "./dimensions.ts";
import { MeaningDimensions } from "./MeaningDimensions.tsx";
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
    expect(fallback).toContain("Mode de secours");
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

  it("gives the presenter a Show all words toggle in the search panel, in 2D and 3D", () => {
    const toggle = /<button[^>]*aria-pressed="(true|false)"[^>]*>Show all words<\/button>/;
    for (const view of ["2d", "3d"] as const) {
      const html = render(EmbeddingExplorer, { mode: "search" }, ctx("controller", 0, "en", { view }));
      expect(html).toMatch(toggle);
      // One toggle, beside the view buttons: none left in the map corner.
      expect(html.match(/Show all words/g)).toHaveLength(1);
    }
    // On in either view: it no longer sends the 3D cloud back to the map.
    for (const view of ["2d", "3d"] as const) {
      const on = render(EmbeddingExplorer, { mode: "search" }, ctx("controller", 0, "en", { showAll: true, view }));
      expect(on.match(toggle)?.[1]).toBe("true");
      expect(on).toContain(view === "3d" ? "3D cloud of words" : "Map of words");
    }
    // The audience screens follow the labels, never the control.
    for (const role of ["display", "preview"] as const) {
      expect(render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, "en", { showAll: true }))).not.toContain("Show all words");
    }
  });

  it("labels every word in the 3D cloud with show all", () => {
    const count = (html: string) => (html.match(/<text/g) ?? []).length;
    for (const role of ["controller", "display"] as const) {
      const normal = count(render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, "en", { view: "3d" })));
      const all = count(render(EmbeddingExplorer, { mode: "search" }, ctx(role, 0, "en", { view: "3d", showAll: true })));
      expect(all).toBeGreaterThanOrEqual(normal + 400);
    }
  });

  it("plays the training in the 3D cloud too, from the view buttons", () => {
    for (const role of ["controller", "display"] as const) {
      for (const locale of ["fr", "en"] as const) {
        for (const step of [0, 1, 2]) {
          const html = render(EmbeddingExplorer, { mode: "training" }, ctx(role, step, locale, { view: "3d", showAll: true }));
          expect(html).toContain(locale === "fr" ? "Nuage de mots en 3D" : "3D cloud of words");
          expect(html).not.toMatch(/NaN|undefined/);
        }
      }
    }
    // Default and previews: the 2D map, so the steps read as before.
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("display", 1, "en"))).not.toContain("3D cloud of words");
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("preview", 1, "en", { view: "3d" }))).not.toContain("3D cloud of words");
    // The presenter switches views at any step; the projector gets no buttons.
    const controller = render(EmbeddingExplorer, { mode: "training" }, ctx("controller", 0, "en"));
    expect(controller).toContain("2D map");
    expect(controller).toContain("3D cloud");
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("display", 0, "en"))).not.toContain("2D map");
    // Last step in 3D: the cloud's own Show all words button, as on the 2D map.
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("controller", 2, "en", { view: "3d" }))).toContain("Show all words");
    expect(render(EmbeddingExplorer, { mode: "training" }, ctx("controller", 1, "en", { view: "3d" }))).not.toContain("Show all words");
  });

  it("MeaningDimensions renders every step, and pêche only in French", () => {
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["fr", "en"] as const) {
        for (let step = 0; step <= DIMENSION_STEPS + 1; step++) {
          const html = render(MeaningDimensions, {}, ctx(role, step, locale));
          expect(html).toContain(locale === "fr" ? "saumon" : "salmon");
          expect(html).not.toMatch(/undefined|NaN|[\u2013\u2014]/);
        }
      }
    }
    expect(render(MeaningDimensions, {}, ctx("display", 2, "fr"))).toContain("pêche");
    expect(render(MeaningDimensions, {}, ctx("display", 2, "en"))).not.toContain("peach");
    expect(render(MeaningDimensions, {}, ctx("display", 4, "fr"))).toContain("16\u00a0384");
  });
});
