import { describe, expect, it } from "vitest";
import type { ChapterDefinition, SceneDefinition } from "@ai-exhibit/presentation-core";
import { talkProgress } from "./progress.ts";

const ch = (id: string) => ({ id, title: { en: id }, summary: { en: id } }) as unknown as ChapterDefinition;
const sc = (id: string, chapter: string, durationSec: number, steps = 0) =>
  ({ id, chapter, durationSec, steps, visual: { layout: "title" } }) as unknown as SceneDefinition;

describe("talkProgress", () => {
  const chapters = [ch("00"), ch("01"), ch("02")];
  const scenes = [sc("intro", "00", 60), sc("a", "01", 100, 2), sc("b", "01", 100), sc("c", "02", 200)];

  it("sizes one segment per part by planned time, the introduction left out", () => {
    const p = talkProgress(chapters, scenes, scenes[0], 0);
    expect(p.parts).toEqual([
      { id: "01", share: 0.5 },
      { id: "02", share: 0.5 },
    ]);
    expect(p.at).toBe(0);
  });

  it("moves the cursor with scenes and revealed steps", () => {
    expect(talkProgress(chapters, scenes, scenes[1], 1).at).toBeCloseTo(50 / 400);
    expect(talkProgress(chapters, scenes, scenes[3], 0).at).toBeCloseTo(0.5);
  });

  it("ignores hidden scenes, which count zero seconds", () => {
    const timed = scenes.map((s) => (s.id === "b" ? { ...s, durationSec: 0 } : s));
    expect(talkProgress(chapters, timed, scenes[3], 0).at).toBeCloseTo(100 / 300);
  });
});
