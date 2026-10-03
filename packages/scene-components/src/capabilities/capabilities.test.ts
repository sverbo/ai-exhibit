import { pick } from "@ai-exhibit/presentation-core";
import { describe, expect, it } from "vitest";
import { sources } from "../../../../content/sources/index.ts";
import {
  SCENARIOS,
  countUpTo,
  validateScenario,
  type AgentRunScenario,
} from "../../../../content/assets/scenarios/index.ts";
import { CONNECTORS, REQUESTED_SOURCES, connectorPosition, resolveSource, visibleConnectors } from "./connected/connectors.ts";
import { autoplayMayLeave, buildScore, clampStep, stepDuration } from "./run/model.ts";
import { captionsName, expectedPath, makeLookup, mediaName } from "./video/media.ts";
import { expectedPosition, formatTime, isMuted, needsSeek, seekTo, setPlaying, initialVideoState } from "./video/sync.ts";

const registry = new Map(sources.map((s) => [s.id, s]));
const DASH = /[\u2013\u2014]/;

describe("agent run scenarios", () => {
  for (const [id, scenario] of Object.entries(SCENARIOS)) {
    it(`${id} is valid`, () => {
      expect(scenario.id).toBe(id);
      expect(validateScenario(scenario)).toEqual([]);
    });
  }

  const trip = SCENARIOS["weekend-trip"]!;
  const clone = (): AgentRunScenario => JSON.parse(JSON.stringify(trip));

  it("shows every ingredient the storyboard asks for", () => {
    const kinds = new Set(trip.steps.map((s) => s.kind));
    for (const k of ["plan", "tool", "spawn", "parallel", "merge", "replan", "approval", "result"] as const) {
      expect(kinds.has(k), k).toBe(true);
    }
    const tools = new Set(trip.steps.flatMap((s) => s.calls ?? []).map((c) => c.tool));
    for (const tool of ["calendar", "weather", "hotels", "maps", "email", "booking"]) expect(tools.has(tool), tool).toBe(true);
    expect(trip.steps.some((s) => s.calls?.some((c) => c.outcome === "failed"))).toBe(true);
  });

  it("rejects a payment placed before the approval gate", () => {
    const s = clone();
    const approval = s.steps.findIndex((x) => x.kind === "approval");
    const [gate] = s.steps.splice(approval, 1);
    s.steps.push(gate!);
    expect(validateScenario(s).some((p) => p.includes("before the approval"))).toBe(true);
  });

  it("rejects a helper used before it is started, and a replan without a failure", () => {
    const s = clone();
    const spawn = s.steps.findIndex((x) => x.kind === "spawn");
    s.steps.splice(spawn, 1);
    const problems = validateScenario(s);
    expect(problems.some((p) => p.includes("before it is started"))).toBe(true);

    const r = clone();
    const replan = r.steps.findIndex((x) => x.kind === "replan");
    r.steps[replan - 1]!.calls![0]!.outcome = "ok";
    expect(validateScenario(r).some((p) => p.includes("follow a failed call"))).toBe(true);
  });

  it("rejects dashes and missing locales", () => {
    const s = clone();
    s.steps[1]!.caption.en = "Plan \u2014 then act";
    s.steps[2]!.caption.fr = " ";
    const problems = validateScenario(s);
    expect(problems.some((p) => p.includes("dash"))).toBe(true);
    expect(problems.some((p) => p.includes("caption missing"))).toBe(true);
  });

  it("counts what happened so far", () => {
    const end = countUpTo(trip, trip.steps.length - 1);
    expect(end).toEqual({ toolCalls: 13, helpers: 3, replans: 1, approvals: 1, failures: 1 });
    expect(countUpTo(trip, 0)).toEqual({ toolCalls: 0, helpers: 0, replans: 0, approvals: 0, failures: 0 });
  });
});

describe("run score layout", () => {
  const trip = SCENARIOS["weekend-trip"]!;
  const score = buildScore(trip);

  it("orders lanes person, assistant, helpers", () => {
    expect(score.rows.map((r) => r.kind)).toEqual(["person", "assistant", "helper", "helper", "helper"]);
  });

  it("puts parallel calls side by side in the same column", () => {
    const parallel = trip.steps.findIndex((s) => s.kind === "parallel");
    expect(score.nodes[parallel]!.map((n) => n.row)).toEqual([2, 3, 4]);
    // Helpers fan out from the spawn, link lane to lane between two parallel steps, and merge back.
    expect(score.links[parallel]!.length).toBe(3);
    expect(score.links[parallel + 1]!.every((l) => l.from.row === l.to.row)).toBe(true);
    const merge = trip.steps.findIndex((s) => s.kind === "merge");
    expect(score.links[merge]!.map((l) => l.to.row)).toEqual([1, 1, 1]);
  });

  it("shows helper lanes only once they are started", () => {
    const spawn = trip.steps.findIndex((s) => s.kind === "spawn");
    expect(score.rowFrom).toEqual([0, 0, spawn, spawn, spawn]);
  });

  it("keeps the person's moments in the person's lane", () => {
    for (const kind of ["request", "approval", "result"] as const) {
      const i = trip.steps.findIndex((s) => s.kind === kind);
      expect(score.nodes[i]![0]!.row).toBe(0);
    }
  });

  it("clamps steps and pauses autoplay at the approval gate", () => {
    expect(clampStep(-3, trip)).toBe(0);
    expect(clampStep(99, trip)).toBe(trip.steps.length - 1);
    const approval = trip.steps.find((s) => s.kind === "approval")!;
    expect(autoplayMayLeave(approval)).toBe(false);
    expect(autoplayMayLeave(trip.steps[1]!)).toBe(true);
  });

  it("gives readable durations, shorter when faster", () => {
    for (const s of trip.steps) {
      expect(stepDuration(s, 1)).toBeGreaterThanOrEqual(3000);
      expect(stepDuration(s, 1.6)).toBeLessThan(stepDuration(s, 1));
    }
  });
});

describe("connected assistant", () => {
  it("lists the seven connector types of the storyboard, one per step", () => {
    expect(CONNECTORS.map((c) => c.id)).toEqual(["email", "calendar", "files", "browser", "shopping", "code", "messages"]);
    expect(visibleConnectors(0)).toBe(0);
    expect(visibleConnectors(3)).toBe(3);
    expect(visibleConnectors(20)).toBe(CONNECTORS.length);
  });

  it("has both locales, no dashes, and a verified source for every connector", () => {
    for (const c of CONNECTORS) {
      for (const text of [c.label, c.example]) {
        expect(pick(text, "fr").trim() && text.en.trim(), c.id).toBeTruthy();
        expect(pick(text, "fr") + text.en).not.toMatch(DASH);
      }
      expect(c.sourceIds.length, c.id).toBeGreaterThan(0);
      for (const id of c.sourceIds) {
        const s = resolveSource(id, (x) => registry.get(x));
        expect(s, `${c.id}: ${id}`).toBeDefined();
        expect(s!.verification, id).toBe("verified");
      }
    }
  });

  it("requested sources are complete records with unique ids", () => {
    const ids = REQUESTED_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of REQUESTED_SOURCES) {
      expect(s.id.startsWith("fnd-")).toBe(true);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.claim.length).toBeGreaterThan(20);
      expect(JSON.stringify(s)).not.toMatch(DASH);
    }
  });

  it("places every connector on the stage, clear of the edges", () => {
    for (let i = 0; i < CONNECTORS.length; i++) {
      const p = connectorPosition(i + 0.5, CONNECTORS.length, { x: 960, y: 452 }, { x: 600, y: 268 });
      expect(p.x).toBeGreaterThan(150);
      expect(p.x).toBeLessThan(1770);
      expect(p.y).toBeGreaterThan(150);
      expect(p.y).toBeLessThan(820);
    }
  });
});

describe("video media lookup", () => {
  it("accepts the storyboard's 'media/' prefix", () => {
    expect(mediaName("media/personal-demo.mp4")).toBe("personal-demo.mp4");
    expect(mediaName("personal-demo.mp4")).toBe("personal-demo.mp4");
    expect(mediaName("content/assets/media/x.webm")).toBe("x.webm");
    expect(expectedPath("media/personal-demo.mp4")).toBe("content/assets/media/personal-demo.mp4");
    expect(captionsName("media/personal-demo.mp4")).toBe("personal-demo.vtt");
  });

  it("finds files by name and misses absent ones", () => {
    const lookup = makeLookup({ "../../content/assets/media/personal-demo.mp4": "/assets/personal-demo-abc.mp4" });
    expect(lookup("media/personal-demo.mp4")).toBe("/assets/personal-demo-abc.mp4");
    expect(lookup("other.mp4")).toBeUndefined();
  });
});

describe("video sync", () => {
  const base = { ...initialVideoState(), playing: true, position: 10, at: 1_000_000 };

  it("extrapolates while playing, holds while paused", () => {
    expect(expectedPosition(base, 1_002_500)).toBeCloseTo(12.5);
    expect(expectedPosition({ ...base, playing: false }, 1_002_500)).toBe(10);
    expect(expectedPosition(base, 1_200_000, 60)).toBe(10); // clock gap too large: not trusted
    expect(expectedPosition(base, 999_000)).toBe(10); // clock behind: no extrapolation
    expect(expectedPosition({ ...base, position: 59 }, 1_005_000, 60)).toBe(60);
  });

  it("tolerates small drift while playing, not while paused", () => {
    expect(needsSeek(10.5, 10, true)).toBe(false);
    expect(needsSeek(11, 10, true)).toBe(true);
    expect(needsSeek(10.5, 10, false)).toBe(true);
  });

  it("routes sound to one screen only, muted by default", () => {
    expect(isMuted("off", "display")).toBe(true);
    expect(isMuted("off", "controller")).toBe(true);
    expect(isMuted("projector", "display")).toBe(false);
    expect(isMuted("projector", "controller")).toBe(true);
    expect(isMuted("controller", "controller")).toBe(false);
    expect(isMuted("controller", "display")).toBe(true);
    expect(isMuted("projector", "preview")).toBe(true);
  });

  it("builds play, pause and seek states", () => {
    const s = setPlaying(initialVideoState(), true, 4, 42);
    expect(s).toMatchObject({ playing: true, position: 4, at: 42, sound: "off" });
    expect(seekTo(s, -1, 50)).toMatchObject({ position: 0, at: 50, playing: true });
    expect(formatTime(65.9)).toBe("1:05");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });
});
