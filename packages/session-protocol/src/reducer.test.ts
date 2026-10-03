import { describe, expect, it } from "vitest";
import {
  MAX_WORD_LENGTH,
  applyCommand,
  audienceView,
  canSend,
  createInitialState,
  pollTallies,
  timerElapsed,
} from "./reducer.ts";
import type { ClientRole, SessionCommand, SessionState } from "./types.ts";

const init = () =>
  createInitialState({ presentationId: "canonical", editionId: "fr-full", locale: "fr", sceneId: "00-title" });

function run(state: SessionState, commands: SessionCommand[], role: ClientRole = "presenter"): SessionState {
  return commands.reduce((s, c) => applyCommand(s, c, role), state);
}

const vote = (optionId: string, pollId = "p1", voterId = "v"): SessionCommand => ({
  type: "vote",
  pollId,
  optionId,
  voterId,
});

describe("createInitialState", () => {
  it("starts at version 0 with nothing open", () => {
    const s = init();
    expect(s.version).toBe(0);
    expect(s.revealStep).toBe(0);
    expect(s.interaction).toEqual({ sceneId: null, pollId: null, phase: "closed", tallies: {}, words: [], history: {} });
    expect(s.timer).toEqual({ startedAt: null, accumulatedMs: 0 });
  });
});

describe("permissions", () => {
  const control: SessionCommand = { type: "setBlackout", on: true };
  it.each<[ClientRole, boolean, boolean]>([
    ["presenter", true, false],
    ["solo", true, false],
    ["remote", true, false],
    ["audience", false, true],
    ["projector", false, false],
  ])("%s: control=%s vote=%s", (role, ctrl, v) => {
    expect(canSend(role, control)).toBe(ctrl);
    expect(canSend(role, vote("a"))).toBe(v);
  });

  it("returns the same object for a forbidden command", () => {
    const s = init();
    expect(applyCommand(s, control, "projector")).toBe(s);
    expect(applyCommand(s, control, "audience")).toBe(s);
    const open = applyCommand(s, { type: "openPoll", sceneId: "x", pollId: "p1" }, "presenter");
    expect(applyCommand(open, vote("a"), "presenter")).toBe(open);
  });
});

describe("navigation and flags", () => {
  it("goto increments version, and is a no-op when unchanged", () => {
    const s = init();
    const a = applyCommand(s, { type: "goto", sceneId: "01-x", revealStep: 2 }, "remote");
    expect(a).toMatchObject({ sceneId: "01-x", revealStep: 2, version: 1 });
    expect(applyCommand(a, { type: "goto", sceneId: "01-x", revealStep: 2 }, "remote")).toBe(a);
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
    s = applyCommand(s, { type: "timer", action: "start", now: 10_000 }, "remote");
    expect(timerElapsed(s, 12_000)).toBe(5000);
    s = applyCommand(s, { type: "timer", action: "reset", now: 0 }, "remote");
    expect(s.timer).toEqual({ startedAt: null, accumulatedMs: 0 });
  });
});

describe("polls and votes", () => {
  const open = (pollId = "p1", sceneId = "00-poll"): SessionCommand => ({ type: "openPoll", sceneId, pollId });

  it("counts votes only while the poll is open, and only for the open poll", () => {
    let s = applyCommand(init(), vote("a"), "audience");
    expect(s.interaction.tallies).toEqual({});
    s = run(init(), [open()], "presenter");
    s = run(s, [vote("a"), vote("a", "p1", "w"), vote("b"), vote("a", "other")], "audience");
    expect(s.interaction.tallies).toEqual({ a: 2, b: 1 });
    s = applyCommand(s, { type: "showPollResults" }, "presenter");
    expect(s.interaction.phase).toBe("results");
    const before = s;
    expect(applyCommand(s, vote("b"), "audience")).toBe(before);
  });

  it("moves results to history on close", () => {
    let s = run(init(), [open()]);
    s = run(s, [vote("a"), vote("b")], "audience");
    s = applyCommand(s, { type: "closePoll" }, "presenter");
    expect(s.interaction).toMatchObject({ sceneId: null, pollId: null, phase: "closed", tallies: {} });
    expect(s.interaction.history).toEqual({ p1: { a: 1, b: 1 } });
    expect(applyCommand(s, { type: "closePoll" }, "presenter")).toBe(s);
  });

  it("opening another poll closes the current one; reopening resumes tallies", () => {
    let s = run(init(), [open("p1")]);
    s = run(s, [vote("a")], "audience");
    s = applyCommand(s, open("p2", "11-poll"), "presenter");
    expect(s.interaction).toMatchObject({ pollId: "p2", sceneId: "11-poll", phase: "open", tallies: {} });
    expect(s.interaction.history.p1).toEqual({ a: 1 });
    s = applyCommand(s, open("p1"), "presenter");
    expect(s.interaction.tallies).toEqual({ a: 1 });
  });

  it("results back to open keeps votes; opening an open poll is a no-op", () => {
    let s = run(init(), [open()]);
    expect(applyCommand(s, open(), "presenter")).toBe(s);
    s = run(s, [vote("a")], "audience");
    s = run(s, [{ type: "showPollResults" }, open()]);
    expect(s.interaction).toMatchObject({ phase: "open", tallies: { a: 1 } });
  });

  it("accepts words, normalized and capped", () => {
    let s = run(init(), [open()]);
    s = applyCommand(s, { type: "vote", pollId: "p1", word: "  hello   world ", voterId: "v" }, "audience");
    s = applyCommand(s, { type: "vote", pollId: "p1", word: "x".repeat(100), voterId: "v" }, "audience");
    expect(s.interaction.words).toEqual(["hello world", "x".repeat(MAX_WORD_LENGTH)]);
    expect(applyCommand(s, { type: "vote", pollId: "p1", word: "   ", voterId: "v" }, "audience")).toBe(s);
  });

  it("manual tallies add to phone votes, everywhere", () => {
    let s = run(init(), [open()]);
    s = run(s, [vote("a")], "audience");
    s = applyCommand(s, { type: "setManualTally", pollId: "p1", tallies: { a: 3, b: 2, c: 0 } }, "presenter");
    expect(s.interaction.manual).toEqual({ p1: { a: 3, b: 2 } });
    expect(pollTallies(s.interaction, "p1")).toEqual({ a: 4, b: 2 });
    s = applyCommand(s, { type: "closePoll" }, "presenter");
    expect(pollTallies(s.interaction, "p1")).toEqual({ a: 4, b: 2 });
    expect(pollTallies(s.interaction, "never")).toEqual({});
  });

  it("resetPoll forgets votes, history and hand counts of that poll", () => {
    let s = run(init(), [open("p1")]);
    s = run(s, [vote("a")], "audience");
    s = run(s, [{ type: "closePoll" }, { type: "setManualTally", pollId: "p1", tallies: { b: 1 } }, open("p2")]);
    s = applyCommand(s, { type: "resetPoll", pollId: "p1" }, "presenter");
    expect(s.interaction.history).toEqual({});
    expect(s.interaction.manual).toEqual({});
    expect(s.interaction.pollId).toBe("p2");
    expect(applyCommand(s, { type: "resetPoll", pollId: "p1" }, "presenter")).toBe(s);
  });

  it("resetSession clears everything but where we are", () => {
    let s = run(init(), [
      { type: "goto", sceneId: "05-x", revealStep: 2 },
      { type: "setSceneState", sceneId: "a", state: 1 },
      { type: "setBlackout", on: true },
      open(),
      { type: "closePoll" },
    ]);
    s = { ...s, interaction: { ...s.interaction, audienceConnected: 4 } };
    s = applyCommand(s, { type: "resetSession" }, "presenter");
    expect(s).toMatchObject({ sceneId: "05-x", revealStep: 0, sceneStates: {}, blackout: false });
    expect(s.interaction).toEqual({
      sceneId: null,
      pollId: null,
      phase: "closed",
      tallies: {},
      words: [],
      history: {},
      audienceConnected: 4,
    });
  });
});

describe("audienceView", () => {
  it("hides scene state and live tallies from phones", () => {
    let s = run(init(), [{ type: "setSceneState", sceneId: "a", state: { big: true } }, { type: "openPoll", sceneId: "x", pollId: "p1" }]);
    s = applyCommand(s, vote("a"), "audience");
    const v = audienceView(s);
    expect(v.sceneStates).toEqual({});
    expect(v.interaction.tallies).toEqual({});
    s = applyCommand(s, { type: "showPollResults" }, "presenter");
    expect(audienceView(s).interaction.tallies).toEqual({ a: 1 });
  });
});
