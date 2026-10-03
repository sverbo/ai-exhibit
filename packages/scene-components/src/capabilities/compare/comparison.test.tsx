import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../../content/sources/index.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../../contract.ts";
import { ModelComparison } from "./ModelComparison.tsx";
import {
  ALL_SOURCE_IDS,
  COLUMNS,
  LAST_STEP,
  PROJECTION,
  PROJECTION_SOURCE_IDS,
  ROWS,
  STEP_CHARTS,
  STEP_PROJECTION,
  CHARTS,
  GPQA_GUESSING,
  GPT2_MWH,
  homesFor,
  pagesFor,
  projectedCostUSD,
  projectedElectricityMWh,
  projectedHorizonMin,
  roundSig,
} from "./comparison.ts";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));
const DASH = new RegExp("[\\u2013\\u2014]");

describe("comparison data", () => {
  it("every filled cell has a verified source; empty cells say so", () => {
    for (const row of ROWS) {
      for (const c of COLUMNS) {
        const cell = row.cells[c];
        if (cell.kind === "missing") {
          expect(cell.value, `${row.id}.${c}`).toBeUndefined();
          expect(cell.main.en).toMatch(/^not (published|tested)$/);
        } else {
          expect(cell.sourceIds.length, `${row.id}.${c}`).toBeGreaterThan(0);
          expect(cell.value, `${row.id}.${c}`).toBeDefined();
        }
        if (cell.kind === "estimate") expect(cell.small?.en, `${row.id}.${c}`).toMatch(/estimate/);
        if (cell.kind === "calculated") expect(cell.small?.en, `${row.id}.${c}`).toMatch(/calculated/);
        if (cell.kind === "reference") expect(cell.small?.en, `${row.id}.${c}`).toMatch(/guessing level.*never tested/);
        expect(JSON.stringify(cell)).not.toMatch(DASH);
      }
    }
    for (const id of ALL_SOURCE_IDS) {
      expect(byId.get(id), id).toBeDefined();
      expect(byId.get(id)!.verification, id).toBe("verified");
    }
  });

  it("has no empty cell left; stand-ins and references are named", () => {
    for (const row of ROWS) for (const c of COLUMNS) expect(row.cells[c].kind, `${row.id}.${c}`).not.toBe("missing");
    const [gpt2, gpt3, grok3] = ROWS;
    // GPT-2 was never run on GPQA: the cell is the guessing level, not a score.
    expect(gpt2!.cells.science).toMatchObject({ kind: "reference", value: GPQA_GUESSING });
    expect(GPQA_GUESSING).toBe(25);
    expect(gpt3!.cells.science).toMatchObject({ kind: "measured", value: 29.6 });
    expect(gpt3!.cells.science.small?.en).toContain("GPT-3.5");
    expect(grok3!.cells.reliability).toMatchObject({ kind: "measured", value: 60.39 });
    expect(grok3!.cells.reliability.small?.en).toContain("Claude 3.7 Sonnet");
  });

  it("GPT-2 electricity follows Patterson's formula on Strubell's hardware", () => {
    // 168 h × 32 TPU v3 × 283 W × PUE 1.10
    expect(GPT2_MWH).toBeCloseTo(1.6735, 3);
    expect(ROWS[0]!.cells.electricity.value).toBe(GPT2_MWH);
    expect(roundSig(GPT2_MWH)).toBeCloseTo(1.7, 9);
    expect(Math.round(homesFor(GPT2_MWH) * 12)).toBe(2);
  });

  it("small comparisons match the arithmetic", () => {
    expect(Math.round(roundSig(homesFor(1287)))).toBe(120);
    expect(roundSig(homesFor(ROWS[2]!.cells.electricity.value!))).toBe(22000);
    expect(pagesFor(1_000_000)).toBe(1500);
    expect(roundSig(pagesFor(2048), 1)).toBe(3);
  });

  it("charts reuse the table's numbers, linear scale, projection last", () => {
    const cost = CHARTS.find((c) => c.id === "cost")!;
    expect(cost.points.map((p) => p.y)).toEqual([4348, 2_116_866, 217_835_546, projectedCostUSD()]);
    const elec = CHARTS.find((c) => c.id === "electricity")!;
    expect(elec.points[0]!.y).toBeCloseTo(GPT2_MWH / 1000, 9);
    expect(elec.points[2]!.y).toBeCloseTo(ROWS[2]!.cells.electricity.value! / 1000, 0);
    const sci = CHARTS.find((c) => c.id === "science")!;
    expect(sci.points.map((p) => p.y)).toEqual([GPQA_GUESSING, 29.6, 75.4]);
    expect(sci.points.filter((p) => p.reference).map((p) => p.model)).toEqual(["GPT-2"]);
    for (const ch of CHARTS) {
      expect(ch.points.every((p) => p.y !== null), ch.id).toBe(true);
      const ys = ch.points.filter((p) => p.y !== null).map((p) => p.y!);
      for (const y of ys) expect(y).toBeLessThanOrEqual(ch.max);
      expect(ch.points.filter((p) => p.projection).every((p) => p === ch.points[ch.points.length - 1])).toBe(true);
      for (const id of ch.sourceIds) expect(byId.get(id)?.verification, id).toBe("verified");
    }
  });
});

describe("projection row", () => {
  it("comes after the rows, before the charts step", () => {
    expect(STEP_PROJECTION).toBe(3);
    expect(STEP_CHARTS).toBe(4);
    expect(LAST_STEP).toBe(STEP_CHARTS);
  });

  it("rounds generously but stays true to the arithmetic", () => {
    expect(projectedCostUSD()).toBeGreaterThan(1e9);
    expect(projectedCostUSD()).toBeLessThan(1.5e9);
    expect(roundSig(projectedElectricityMWh() / 1000, 1)).toBe(1000);
    expect(roundSig(homesFor(projectedElectricityMWh()), 1)).toBe(100000);
    const weeks = projectedHorizonMin() / 60 / 40;
    expect(weeks).toBeGreaterThan(1.5);
    expect(weeks).toBeLessThan(2.5);
  });

  it("every cell is a labelled projection with its arithmetic and verified sources", () => {
    for (const c of COLUMNS) {
      const cell = PROJECTION.cells[c];
      expect(cell.kind).toBe("projection");
      expect(cell.basis.en.length, c).toBeGreaterThan(20);
      expect(JSON.stringify(cell)).not.toMatch(DASH);
    }
    for (const id of PROJECTION_SOURCE_IDS) {
      expect(byId.get(id), id).toBeDefined();
      expect(byId.get(id)!.verification, id).toBe("verified");
    }
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
    interaction: null,
    sendCommand: () => {},
    joinUrl: null,
  };
}

describe("ModelComparison renders", () => {
  it("in every role, locale and step, without dashes", () => {
    for (const role of ["controller", "display", "preview"] as const) {
      for (const locale of ["fr", "en"] as const) {
        for (let step = 0; step <= LAST_STEP; step++) {
          const html = renderToStaticMarkup(createElement(ModelComparison as SceneComponent, { props: {}, ctx: ctx(role, step, locale) }));
          expect(html).toContain("GPT-2");
          expect(html).not.toMatch(DASH);
        }
      }
    }
  });

  it("shows the projection row, then the three charts", () => {
    const at = (step: number) =>
      renderToStaticMarkup(createElement(ModelComparison as SceneComponent, { props: {}, ctx: ctx("display", step, "en") }));
    expect(at(STEP_PROJECTION)).toContain("In about a year");
    expect(at(STEP_PROJECTION)).toContain("Projection");
    expect((at(STEP_PROJECTION).match(/<figure/g) ?? []).length).toBe(0);
    expect((at(STEP_CHARTS).match(/<figure/g) ?? []).length).toBe(3);
    expect(at(STEP_CHARTS)).toContain("$1 billion");
  });

  it("shows the arithmetic to the controller only", () => {
    const render = (role: SceneRole) =>
      renderToStaticMarkup(createElement(ModelComparison as SceneComponent, { props: {}, ctx: ctx(role, STEP_PROJECTION, "en") }));
    expect(render("controller")).toContain("2^(365/131)");
    expect(render("display")).not.toContain("2^(365/131)");
  });
});
