import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../../content/sources/index.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../../contract.ts";
import { FrontierProgress, placeEndLabels } from "./FrontierProgress.tsx";
import {
  ALL_SOURCE_IDS,
  FOOTER_SOURCE_IDS,
  LAST_STEP,
  PANELS,
  SERIES,
  STEP_PROJECTION,
  homesFor,
  pagesFor,
  projectedCostUSD,
  projectedHorizonMin,
  projectedPowerMW,
  projectedEnergyGWh,
  TRAINING_RUNS,
  energyGWh,
  roundSig,
  workWeeks,
  yearOf,
} from "./progress.ts";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));
const DASH = new RegExp("[\\u2013\\u2014]");
const panel = (id: string) => PANELS.find((p) => p.id === id)!;

describe("progress data", () => {
  it("cites only verified sources, and the sources state the plotted numbers", () => {
    for (const id of [...ALL_SOURCE_IDS, ...FOOTER_SOURCE_IDS]) {
      expect(byId.get(id), id).toBeDefined();
      expect(byId.get(id)!.verification, id).toBe("verified");
    }
    const bench = byId.get("tk-epoch-benchmarks-best-so-far")!.claim;
    for (const s of SERIES) {
      for (const p of s.points) expect(bench, `${s.id} ${p.model}`).toContain(`${Math.round(p.value)}% (${p.model}`);
    }
    const models = byId.get("tk-epoch-notable-models")!.claim;
    for (const m of ["$4,300", "$2.1 million", "$37 million", "$366 million", "5.1 MW", "20 MW", "110 MW", "233 MW", "355.2 hours", "2,280 hours", "2,160 hours"]) {
      expect(models).toContain(m);
    }
  });

  it("keeps every series in time order and every value on its chart", () => {
    for (const p of PANELS) {
      const xs = p.points.map((q) => yearOf(q.date));
      expect([...xs].sort((a, b) => a - b), p.id).toEqual(xs);
      for (const q of p.points) expect(q.value, `${p.id} ${q.model}`).toBeLessThanOrEqual(p.max);
      expect(p.tick.value).toBeLessThan(p.max);
      // The first and last points are named on screen.
      expect(p.points[0]!.label, p.id).toBeDefined();
      expect(p.points[p.points.length - 1]!.label, p.id).toBeDefined();
    }
    for (const s of SERIES) {
      const xs = s.points.map((q) => yearOf(q.date));
      expect([...xs].sort((a, b) => a - b), s.id).toEqual(xs);
      // Best so far: never goes down.
      const ys = s.points.map((q) => q.value);
      expect([...ys].sort((a, b) => a - b), s.id).toEqual(ys);
      for (const y of ys) expect(y).toBeLessThanOrEqual(100);
    }
  });

  it("growth factors on screen match the arithmetic", () => {
    expect(roundSig(panel("cost").growth.factor)).toBe(84_000);
    expect(panel("cost").growth.label.en).toBe("× 84,000");
    expect(Math.round(panel("electricity").growth.factor)).toBe(131);
    expect(panel("electricity").growth.label.en).toBe("× 130");
    expect(Math.round(panel("memory").growth.factor / 100) * 100).toBe(1000);
    expect(roundSig(panel("reliability").growth.factor)).toBe(19_000);
    expect(roundSig(homesFor(237.49))).toBe(22_000);
    expect(pagesFor(1_000_000)).toBe(1500);
    expect(roundSig(pagesFor(32_768), 1)).toBe(50);
  });

  it("projections are honest about their size and leave the chart", () => {
    expect(projectedCostUSD()).toBeGreaterThan(1e9);
    expect(roundSig(projectedCostUSD() / 1e9)).toBeCloseTo(3.6, 9);
    expect(roundSig(projectedPowerMW())).toBe(520);
    // Same training time as Grok 3 (2,160 h): about 1,100 GWh, a year of about 100,000 US homes.
    expect(roundSig(projectedEnergyGWh())).toBe(1100);
    expect(roundSig(homesFor(projectedEnergyGWh()), 1)).toBe(100_000);
    expect(panel("electricity").projection!.basis.en).toContain("same training time");
    const [slow, fast] = projectedHorizonMin();
    expect(Math.round(workWeeks(slow))).toBe(3);
    expect(Math.round(workWeeks(fast))).toBe(8);
    for (const p of PANELS) {
      if (!p.projection) continue;
      expect(p.projection.value, p.id).toBeGreaterThan(p.max);
      expect(p.projection.basis.en.length).toBeGreaterThan(40);
      for (const id of p.projection.sourceIds) expect(byId.get(id)?.verification, id).toBe("verified");
    }
    expect(panel("memory").projection).toBeUndefined();
  });

  it("contains no long dashes", () => {
    expect(JSON.stringify({ PANELS, SERIES })).not.toMatch(DASH);
  });
});

describe("training electricity", () => {
  it("is power times a published or estimated training time, with no invented duration", () => {
    const e = panel("electricity");
    expect(e.points.map((p) => p.model)).toEqual(TRAINING_RUNS.map((r) => r.model));
    expect(e.points.map((p) => p.model)).not.toContain("GPT-6 Astra");
    for (const [i, r] of TRAINING_RUNS.entries()) expect(e.points[i]!.value).toBeCloseTo(energyGWh(r.megawatts, r.hours), 9);
    expect(e.points[0]!.value).toBeCloseTo(1.81, 2);
    expect(e.points[1]!.value).toBeCloseTo(45.47, 2);
    expect(e.points[2]!.value).toBeCloseTo(237.49, 2);
    // Durations on screen match the hours: 355.2 h ≈ 15 days, 2,160 h = 90 days.
    expect(Math.round(TRAINING_RUNS[0].hours / 24)).toBe(15);
    expect(TRAINING_RUNS[2].hours / 24).toBe(90);
    expect(e.points[0]!.detail?.en).toBe("5 MW for 15 days");
    expect(e.points[2]!.detail?.en).toBe("110 MW for 90 days");
  });
});

describe("end labels", () => {
  it("keep their order and spacing, inside the chart", () => {
    const out = placeEndLabels([20, 22, 25, 60, 200], 10, 300, 60);
    expect(out[0]).toBe(20);
    for (let i = 1; i < out.length; i++) expect(out[i]! - out[i - 1]!).toBeGreaterThanOrEqual(60);
    const squeezed = placeEndLabels([280, 290, 295], 10, 300, 60);
    expect(Math.max(...squeezed)).toBeLessThanOrEqual(300);
  });
});

function ctx(role: SceneRole, revealStep: number, locale: Locale): SceneContext {
  return {
    scene: { id: "test" } as SceneDefinition,
    locale,
    revealStep,
    role,
    mode: "live",
    state: undefined,
    setState: () => {},
    getSource: (id) => byId.get(id),
    reducedMotion: false,
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

const render = (role: SceneRole, step: number, locale: Locale = "en") =>
  renderToStaticMarkup(createElement(FrontierProgress as SceneComponent, { props: {}, ctx: ctx(role, step, locale) }));

describe("FrontierProgress renders", () => {
  it("in every role, locale and step, without dashes", () => {
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["fr", "en"] as const) {
        for (let step = 0; step <= LAST_STEP; step++) {
          const html = render(role, step, locale);
          expect(html).not.toMatch(DASH);
        }
      }
    }
  });

  it("adds one series per click", () => {
    expect(render("display", 0)).not.toContain("$4,300");
    expect(render("display", 1)).toContain("× 84,000");
    expect(render("display", 1)).not.toContain("237 GWh");
    expect(render("display", 2)).toContain("110 MW for 90 days");
    expect(render("display", 4)).toContain("17 hours");
    expect(render("display", 4)).not.toContain("GPQA Diamond");
    expect(render("display", 5)).toContain("PhD experts on GPQA: 65%");
    expect(render("display", 7)).toContain("FrontierMath");
    expect(render("display", 7)).not.toContain("ARC-AGI-2");
    expect(render("display", 8)).toContain("gold medal");
    expect(render("display", 8)).not.toContain("over $1 billion");
    expect(render("display", STEP_PROJECTION)).toContain("over $1 billion");
    expect(render("display", STEP_PROJECTION)).toContain("3 to 8 weeks of work");
  });

  it("shows the projection arithmetic to the controller only", () => {
    expect(render("controller", STEP_PROJECTION)).toContain("131 days");
    expect(render("display", STEP_PROJECTION)).not.toContain("131 days");
  });
});
