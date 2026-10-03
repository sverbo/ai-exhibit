import { describe, expect, it } from "vitest";
import type { ChapterDefinition, SceneDefinition } from "@ai-exhibit/presentation-core";
import { talkProgress } from "./progress.ts";

const ch = (id: string) => ({ id, title: { en: id }, summary: { en: id } }) as unknown as ChapterDefinition;
const sc = (id: string, chapter: string, durationSec: number, steps = 0) =>
  ({ id, chapter, durationSec, steps, visual: { layout: "title" } }) as unknown as SceneDefinition;

describe("talkProgress", () => {
  const chapters = [ch("00"), ch("01"), ch("02")];
  const scenes = [sc("intro", "00", 60), sc("a", "01", 100, 2), sc("b", "01", 100), sc("c", "02", 200)];

  it("sizes one segment per part by its number of slides, the introduction left out", () => {
    const p = talkProgress(chapters, scenes, scenes[0]);
    expect(p.parts[0]).toEqual({ id: "01", share: 2 / 3 });
    expect(p.parts[1]!.share).toBeCloseTo(1 / 3);
    expect(p.at).toBe(0);
  });

  it("moves the cursor one slide at a time, whatever the slides' durations", () => {
    expect(talkProgress(chapters, scenes, scenes[1]).at).toBe(0);
    expect(talkProgress(chapters, scenes, scenes[2]).at).toBeCloseTo(1 / 3);
    expect(talkProgress(chapters, scenes, scenes[3]).at).toBeCloseTo(2 / 3);
  });

  it("ignores hidden scenes, which count zero seconds", () => {
    const timed = scenes.map((s) => (s.id === "b" ? { ...s, durationSec: 0 } : s));
    expect(talkProgress(chapters, timed, scenes[3]).at).toBeCloseTo(1 / 2);
  });
});
