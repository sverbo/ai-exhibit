import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { createInitialState, type SessionCommand } from "@ai-exhibit/session-protocol";
import { describe, expect, it } from "vitest";
import { buildSceneContext, sceneSlice, type SceneContextInput } from "./sceneContext.ts";

const scene = { id: "s1" } as SceneDefinition;
const state = createInitialState({ presentationId: "p", editionId: "e", locale: "fr", sceneId: "s1" });
state.sceneStates.s1 = { n: 1 };
state.fallback.s1 = true;

const input = (over: Partial<SceneContextInput>): SceneContextInput => ({
  scene,
  role: "controller",
  locale: "fr",
  revealStep: 2,
  ...sceneSlice(state, "s1"),
  dispatch: null,
  getSource: () => undefined,
  joinUrl: null,
  reducedMotion: false,
  ...over,
});

describe("buildSceneContext", () => {
  it("gives controllers working setState and sendCommand", () => {
    const sent: SessionCommand[] = [];
    const ctx = buildSceneContext(input({ dispatch: (c) => sent.push(c) }));
    expect(ctx.mode).toBe("fallback");
    expect(ctx.state).toEqual({ n: 1 });
    expect(ctx.revealStep).toBe(2);
    expect(ctx.interaction?.phase).toBe("closed");
    ctx.setState({ n: 2 });
    ctx.sendCommand({ type: "closePoll" });
    expect(sent).toEqual([{ type: "setSceneState", sceneId: "s1", state: { n: 2 } }, { type: "closePoll" }]);
  });

  it("makes display and preview read-only", () => {
    const sent: SessionCommand[] = [];
    for (const role of ["display", "preview"] as const) {
      const ctx = buildSceneContext(input({ role, dispatch: (c) => sent.push(c) }));
      ctx.setState({ n: 3 });
      ctx.sendCommand({ type: "closePoll" });
    }
    expect(sent).toEqual([]);
  });

  it("works before any session state exists", () => {
    const ctx = buildSceneContext(input({ ...sceneSlice(null, "s1") }));
    expect(ctx.mode).toBe("live");
    expect(ctx.state).toBeUndefined();
    expect(ctx.interaction).toBeNull();
  });
});
