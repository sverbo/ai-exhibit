import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { describe, expect, it } from "vitest";
import { computePace, formatDelta, formatDuration } from "./pace.ts";

const scene = (id: string, chapter: string, durationSec: number) =>
  ({ id, chapter, durationSec }) as unknown as SceneDefinition;

// 10 minutes total: chapter 00 = 4 min, chapter 01 = 6 min.
const scenes = [scene("a", "00", 120), scene("b", "00", 120), scene("c", "01", 360)];

describe("computePace", () => {
  it("is on track inside the current scene's window", () => {
    const p = computePace(scenes, "b", 150_000, [9, 11]);
    expect(p.plannedSceneStartSec).toBe(120);
    expect(p.plannedSceneEndSec).toBe(240);
    expect(p.deltaSec).toBe(0);
    expect(p.status).toBe("on-track");
    expect(p.target).toBe("within");
  });

  it("is behind when the clock passes the scene's planned end", () => {
    const p = computePace(scenes, "b", 360_000, [9, 11]);
    expect(p.deltaSec).toBe(120);
    expect(p.status).toBe("behind");
    expect(p.projectedTotalSec).toBe(720);
    expect(p.target).toBe("over");
  });

  it("is ahead when a scene starts before its planned start", () => {
    const p = computePace(scenes, "c", 60_000, [9, 11]);
    expect(p.deltaSec).toBe(-180);
    expect(p.status).toBe("ahead");
    expect(p.target).toBe("under");
  });

  it("tolerates small drifts", () => {
    expect(computePace(scenes, "b", 255_000, [9, 11]).status).toBe("on-track");
  });

  it("summarises chapters", () => {
    const p = computePace(scenes, "c", 300_000, [9, 11]);
    expect(p.chapters).toEqual([
      { id: "00", plannedStartSec: 0, plannedSec: 240, sceneCount: 2, slideCount: 2, status: "done" },
      { id: "01", plannedStartSec: 240, plannedSec: 360, sceneCount: 1, slideCount: 1, status: "current" },
    ]);
  });

  it("places the bars in slides: one unit per visible slide, the clock mapped onto them", () => {
    const p = computePace(scenes, "c", 300_000, [9, 11]);
    expect(p.slideTotal).toBe(3);
    expect(p.slideIndex).toBe(2);
    // 300 s: past the first two slides (240 s), 60 s into the third (360 s long).
    expect(p.clockSlides).toBeCloseTo(2 + 60 / 360);
  });

  it("handles an empty edition", () => {
    const p = computePace([], "", 0, [75, 90]);
    expect(p.plannedTotalSec).toBe(0);
    expect(p.chapters).toEqual([]);
    expect(p.status).toBe("on-track");
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3723)).toBe("1:02:03");
  });
  it("formats signed deltas", () => {
    expect(formatDelta(80)).toBe("+1:20");
    expect(formatDelta(-45)).toBe("-0:45");
    expect(formatDelta(0.4)).toBe("0:00");
  });
});
