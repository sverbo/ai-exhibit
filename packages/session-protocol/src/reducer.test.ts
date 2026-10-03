import { describe, expect, it } from "vitest";
import { applyCommand, canSend, createInitialState, timerElapsed } from "./reducer.ts";
import type { ClientRole, SessionCommand, SessionState } from "./types.ts";

const init = () =>
  createInitialState({ presentationId: "canonical", editionId: "fr-full", locale: "fr", sceneId: "00-title" });

function run(state: SessionState, commands: SessionCommand[], role: ClientRole = "presenter"): SessionState {
  return commands.reduce((s, c) => applyCommand(s, c, role), state);
}

describe("createInitialState", () => {
  it("starts at version 0 with nothing open", () => {
    const s = init();
    expect(s.version).toBe(0);
    expect(s.revealStep).toBe(0);
    expect(s.timer).toEqual({ startedAt: null, accumulatedMs: 0 });
  });
});

describe("permissions", () => {
  const control: SessionCommand = { type: "setBlackout", on: true };
  it.each<[ClientRole, boolean]>([
    ["presenter", true],
    ["solo", true],
    ["projector", false],
  ])("%s: control=%s", (role, ctrl) => {
    expect(canSend(role, control)).toBe(ctrl);
  });

  it("returns the same object for a forbidden command", () => {
    const s = init();
    expect(applyCommand(s, control, "projector")).toBe(s);
  });
});

describe("navigation and flags", () => {
  it("goto increments version, and is a no-op when unchanged", () => {
    const s = init();
    const a = applyCommand(s, { type: "goto", sceneId: "01-x", revealStep: 2 }, "solo");
    expect(a).toMatchObject({ sceneId: "01-x", revealStep: 2, version: 1 });
    expect(applyCommand(a, { type: "goto", sceneId: "01-x", revealStep: 2 }, "solo")).toBe(a);
    expect(s.sceneId).toBe("00-title");
  });

  it("blackout, freeze and fallback toggle with no-op detection", () => {
    let s = run(init(), [
      { type: "setBlackout", on: true },
      { type: "setFrozen", on: true },
      { type: "setFallback", sceneId: "a", on: true },
    ]);
    expect(s).toMatchObject({ blackout: true, frozen: true, fallback: { a: true }, version: 3 });
    expect(applyCommand(s, { type: "setBlackout", on: true }, "solo")).toBe(s);
    s = applyCommand(s, { type: "setFallback", sceneId: "a", on: false }, "solo");
    expect(s.fallback).toEqual({});
  });

  it("setSceneState ignores identical payloads", () => {
    const s = applyCommand(init(), { type: "setSceneState", sceneId: "a", state: { k: [1, 2] } }, "presenter");
    expect(applyCommand(s, { type: "setSceneState", sceneId: "a", state: { k: [1, 2] } }, "presenter")).toBe(s);
  });

  it("resetScene clears scene state and fallback only for that scene", () => {
    const s = run(init(), [
      { type: "setSceneState", sceneId: "a", state: 1 },
      { type: "setSceneState", sceneId: "b", state: 2 },
      { type: "setFallback", sceneId: "a", on: true },
    ]);
    const r = applyCommand(s, { type: "resetScene", sceneId: "a" }, "presenter");
    expect(r.sceneStates).toEqual({ b: 2 });
    expect(r.fallback).toEqual({});
    expect(applyCommand(r, { type: "resetScene", sceneId: "a" }, "presenter")).toBe(r);
  });

  it("setEdition moves to the given scene at step 0", () => {
    const s = run(init(), [
      { type: "goto", sceneId: "03-x", revealStep: 3 },
      { type: "setEdition", editionId: "en-short", locale: "en", sceneId: "00-title" },
    ]);
    expect(s).toMatchObject({ editionId: "en-short", locale: "en", sceneId: "00-title", revealStep: 0 });
  });
});

describe("timer", () => {
  it("accumulates across pauses and resets", () => {
    let s = run(init(), [
      { type: "timer", action: "start", now: 1000 },
      { type: "timer", action: "start", now: 5000 },
      { type: "timer", action: "pause", now: 4000 },
    ]);
    expect(s.timer).toEqual({ startedAt: null, accumulatedMs: 3000 });
    s = applyCommand(s, { type: "timer", action: "start", now: 10_000 }, "solo");
    expect(timerElapsed(s, 12_000)).toBe(5000);
    s = applyCommand(s, { type: "timer", action: "reset", now: 0 }, "solo");
    expect(s.timer).toEqual({ startedAt: null, accumulatedMs: 0 });
  });
});

describe("resetSession", () => {
  it("resetSession clears everything but where we are", () => {
    let s = run(init(), [
      { type: "goto", sceneId: "05-x", revealStep: 2 },
      { type: "setSceneState", sceneId: "a", state: 1 },
      { type: "setBlackout", on: true },
    ]);
    s = applyCommand(s, { type: "resetSession" }, "presenter");
    expect(s).toMatchObject({ sceneId: "05-x", revealStep: 0, sceneStates: {}, blackout: false });
  });
});
