import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../content/sources/index.ts";
import { SCENARIOS } from "../../../../content/assets/scenarios/index.ts";
import type { SceneComponent, SceneContext, SceneRole } from "../contract.ts";
import { CONNECTORS, LAST_STEP as CONNECTED_LAST_STEP } from "./connected/connectors.ts";
import { ConnectedAssistant } from "./connected/ConnectedAssistant.tsx";
import { AgentRunExplainer } from "./run/AgentRunExplainer.tsx";
import { VideoScene } from "./video/VideoScene.tsx";

const byId = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));

function ctx(role: SceneRole, revealStep: number, locale: Locale): SceneContext {
  return {
    scene: { id: "test-scene" } as SceneDefinition,
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

const cases: [string, SceneComponent, Record<string, unknown>, number][] = [
  ["ConnectedAssistant", ConnectedAssistant, {}, CONNECTED_LAST_STEP],
  ["AgentRunExplainer", AgentRunExplainer, { scenario: "weekend-trip" }, SCENARIOS["weekend-trip"]!.steps.length - 1],
  ["AgentRunExplainer with the loop", AgentRunExplainer, { scenario: "weekend-trip", loop: true }, SCENARIOS["weekend-trip"]!.steps.length],
  ["VideoScene missing file", VideoScene, { src: "media/no-such-video.mp4", caption: { en: "c", fr: "c" } }, 1],
];

describe("capabilities components render in every role and step", () => {
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

  it("never shows a raw source id on the connector band", () => {
    for (let step = 1; step <= CONNECTORS.length; step++) {
      const html = renderToStaticMarkup(createElement(ConnectedAssistant as SceneComponent, { props: {}, ctx: ctx("display", step, "en") }));
      expect(html).not.toMatch(/fnd-/);
    }
  });

  it("ends on the loop, in small, only when asked", () => {
    const after = SCENARIOS["weekend-trip"]!.steps.length;
    const render = (props: Record<string, unknown>) =>
      renderToStaticMarkup(createElement(AgentRunExplainer as SceneComponent, { props, ctx: ctx("display", after, "en") }));
    expect(render({ scenario: "weekend-trip", loop: true })).toContain("A loop, not an answer");
    expect(render({ scenario: "weekend-trip" })).not.toContain("A loop, not an answer");
  });

  it("labels the run as a reconstruction at every step", () => {
    const steps = SCENARIOS["weekend-trip"]!.steps.length;
    for (let step = 0; step < steps; step++) {
      const html = renderToStaticMarkup(
        createElement(AgentRunExplainer as SceneComponent, { props: { scenario: "weekend-trip" }, ctx: ctx("display", step, "en") }),
      );
      expect(html).toContain("Illustrative reconstruction");
    }
  });

  it("shows the calm placeholder with the expected path when the video is missing", () => {
    const html = renderToStaticMarkup(
      createElement(VideoScene as SceneComponent, { props: { src: "media/no-such-video.mp4" }, ctx: ctx("display", 0, "en") }),
    );
    expect(html).toContain("Personal demo video goes here");
    expect(html).toContain("content/assets/media/no-such-video.mp4");
  });
});
