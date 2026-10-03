import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../content/sources/index.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { DefenseInDepth } from "./DefenseInDepth.tsx";
import { RaceDilemma } from "./RaceDilemma.tsx";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));

function ctx(role: SceneRole, revealStep: number, locale: Locale, state?: unknown): SceneContext {
  return {
    scene: {} as SceneDefinition,
    locale,
    revealStep,
    role,
    mode: "live",
    state,
    setState: () => {},
    getSource: (id) => byId.get(id),
    reducedMotion: false,
    interaction: null,
    sendCommand: () => {},
    joinUrl: null,
  };
}

const l = (s: string) => ({ en: s, fr: s });

const cases: [string, SceneComponent, Record<string, unknown>, number][] = [
  ["DefenseInDepth", DefenseInDepth, {}, 7],
  ["DefenseInDepth custom", DefenseInDepth, { layers: [l("x"), l("y"), l("z")] }, 4],
  ["RaceDilemma", RaceDilemma, {}, 5],
];

describe("evidence components render in every role and step", () => {
  for (const [name, Component, props, steps] of cases) {
    it(name, () => {
      for (const role of ["controller", "display", "preview"] as const) {
        for (const locale of ["fr", "en"] as const) {
          for (let step = 0; step <= steps; step++) {
            const html = renderToStaticMarkup(createElement(Component, { props, ctx: ctx(role, step, locale) }));
            expect(html.length).toBeGreaterThan(0);
            expect(html).not.toMatch(/[\u2013\u2014]/);
          }
        }
      }
    });
  }
});
