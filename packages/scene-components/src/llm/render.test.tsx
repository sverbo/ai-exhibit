import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../content/sources/index.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { NextTokenVsClassifier } from "./NextTokenVsClassifier.tsx";
import { STEPS as TRAINING_STEPS } from "./training.ts";
import { TrainingLoop } from "./TrainingLoop.tsx";

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
    sendCommand: () => {},
    glossaryUrl: null,
  };
}

const cases: [string, SceneComponent, number, unknown[]][] = [
  ["NextTokenVsClassifier", NextTokenVsClassifier, 4, [undefined]],
  ["TrainingLoop", TrainingLoop, TRAINING_STEPS, [undefined, { example: 1 }]],
];

describe("llm components render in every role, step, locale and state", () => {
  for (const [name, Component, steps, states] of cases) {
    it(name, () => {
      for (const role of ["controller", "display", "preview"] as const) {
        for (const locale of ["fr", "en"] as const) {
          for (const state of states) {
            for (let step = 0; step <= steps + 1; step++) {
              const html = renderToStaticMarkup(createElement(Component, { props: {}, ctx: ctx(role, step, locale, state) }));
              expect(html.length).toBeGreaterThan(200);
              expect(html).not.toMatch(/[\u2013\u2014]/);
              expect(html).not.toContain("undefined");
              expect(html).not.toContain("NaN");
            }
          }
        }
      }
    });
  }

  it("NextTokenVsClassifier shows the real top token and the vocabulary size", () => {
    const html = renderToStaticMarkup(createElement(NextTokenVsClassifier as SceneComponent, { props: {}, ctx: ctx("display", 1, "en") }));
    expect(html).toContain("window");
    expect(html).toContain("50,304");
  });
});
