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
  glossaryUrl: null,
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
    ctx.setState({ n: 2 });
    ctx.sendCommand({ type: "setBlackout", on: true });
    expect(sent).toEqual([{ type: "setSceneState", sceneId: "s1", state: { n: 2 } }, { type: "setBlackout", on: true }]);
  });

  it("makes display and preview read-only", () => {
    const sent: SessionCommand[] = [];
    for (const role of ["display", "preview"] as const) {
      const ctx = buildSceneContext(input({ role, dispatch: (c) => sent.push(c) }));
      ctx.setState({ n: 3 });
      ctx.sendCommand({ type: "setBlackout", on: true });
    }
    expect(sent).toEqual([]);
  });

  it("works before any session state exists", () => {
    const ctx = buildSceneContext(input({ ...sceneSlice(null, "s1") }));
    expect(ctx.mode).toBe("live");
    expect(ctx.state).toBeUndefined();
  });

  it("lets a controller window that does not run the stage send requests", () => {
    const sent: SessionCommand[] = [];
    const ctx = buildSceneContext(input({ role: "display", requestDispatch: (c) => sent.push(c), requesterId: "w1" }));
    expect(ctx.interactive).toBe(true);
    ctx.setState({ n: 9 });
    ctx.sendRequest?.({ type: "generate", n: 10 });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ type: "sceneRequest", sceneId: "s1", request: { payload: { type: "generate", n: 10 } } });
    const id = (sent[0] as { request: { id: string } }).request.id;
    expect(id.startsWith("w1:")).toBe(true);
    // A plain display (the presenter's projector mirror) shows no controls.
    expect(buildSceneContext(input({ role: "display" })).interactive).toBe(false);
  });
});
