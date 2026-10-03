import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { describe, expect, it } from "vitest";
import { navCommand } from "./navigation.ts";

const scene = (id: string, items: number): SceneDefinition =>
  ({ id, visual: { layout: "list", items: Array.from({ length: items }, () => ({ fr: "", en: "" })) } }) as unknown as SceneDefinition;

const scenes = [scene("a", 2), scene("b", 0)];

describe("navCommand", () => {
  it("steps through reveals, then to the next scene", () => {
    expect(navCommand(scenes, { sceneId: "a", revealStep: 0 }, "next")).toEqual({ type: "goto", sceneId: "a", revealStep: 1 });
    expect(navCommand(scenes, { sceneId: "a", revealStep: 2 }, "next")).toEqual({ type: "goto", sceneId: "b", revealStep: 0 });
  });
  it("returns null at the ends", () => {
    expect(navCommand(scenes, { sceneId: "b", revealStep: 0 }, "next")).toBeNull();
    expect(navCommand(scenes, { sceneId: "a", revealStep: 0 }, "prev")).toBeNull();
  });
  it("goes back to the previous scene fully revealed", () => {
    expect(navCommand(scenes, { sceneId: "b", revealStep: 0 }, "prev")).toEqual({ type: "goto", sceneId: "a", revealStep: 2 });
  });
  it("jumps to the end or start of the current scene without changing scene", () => {
    expect(navCommand(scenes, { sceneId: "a", revealStep: 0 }, "sceneEnd")).toEqual({ type: "goto", sceneId: "a", revealStep: 2 });
    expect(navCommand(scenes, { sceneId: "a", revealStep: 2 }, "sceneEnd")).toBeNull();
    expect(navCommand(scenes, { sceneId: "a", revealStep: 2 }, "sceneStart")).toEqual({ type: "goto", sceneId: "a", revealStep: 0 });
    expect(navCommand(scenes, { sceneId: "b", revealStep: 0 }, "sceneStart")).toBeNull();
  });
  it("jumps scenes ignoring reveals", () => {
    expect(navCommand(scenes, { sceneId: "a", revealStep: 1 }, "nextScene")).toEqual({ type: "goto", sceneId: "b", revealStep: 0 });
  });
  it("never moves the session from a scene this window does not know", () => {
    // A window with stale content must not pull everyone back to the first scene.
    for (const action of ["next", "prev", "nextScene", "prevScene"] as const) {
      expect(navCommand(scenes, { sceneId: "zzz", revealStep: 3 }, action)).toBeNull();
    }
  });
  it("does nothing without scenes", () => {
    expect(navCommand([], { sceneId: "", revealStep: 0 }, "next")).toBeNull();
  });
});
