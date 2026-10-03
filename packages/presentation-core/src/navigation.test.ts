import { describe, expect, it } from "vitest";
import { nextPosition, prevPosition } from "./navigation.ts";
import type { SceneDefinition } from "./types.ts";

const l = (s: string) => ({ fr: s, en: s });
function scene(id: string, steps: number): SceneDefinition {
  return {
    id, chapter: "00", number: "0.0", title: l(id), objective: l(""), takeaway: l(""),
    visual: { layout: "placeholder", description: l("") }, steps, interaction: "none",
    speakerNotes: l(""), transitionIn: l(""), transitionOut: l(""), evidenceLevel: "none",
    sourceIds: [], runtimeClass: "A", artifacts: [], fallback: { kind: "none" },
    durationSec: 60, optional: false,
  };
}

describe("navigation", () => {
  const scenes = [scene("a", 2), scene("b", 0)];

  it("walks reveal steps before moving to the next scene", () => {
    let pos = { sceneId: "a", revealStep: 0 };
    pos = nextPosition(scenes, pos);
    expect(pos).toEqual({ sceneId: "a", revealStep: 1 });
    pos = nextPosition(scenes, nextPosition(scenes, pos));
    expect(pos).toEqual({ sceneId: "b", revealStep: 0 });
    expect(nextPosition(scenes, pos)).toEqual(pos);
  });

  it("goes back to the previous scene fully revealed", () => {
    expect(prevPosition(scenes, { sceneId: "b", revealStep: 0 })).toEqual({ sceneId: "a", revealStep: 2 });
  });
});
