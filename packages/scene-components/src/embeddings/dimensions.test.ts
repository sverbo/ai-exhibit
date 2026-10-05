import { describe, expect, it } from "vitest";
import {
  ARROWS, clampStep, DIMENSION_STEPS, dimensionsView, LLAMA_405B_DIMS, LLAMA_8B_DIMS, positionAt, STRIP, STRIP_HEAD,
  STRIP_LENGTH, WORDS,
} from "./dimensions.ts";

const word = (id: string) => WORDS.find((w) => w.id === id)!;
const shown = (step: number, locale: "en" | "fr") =>
  dimensionsView(step, locale)
    .words.filter((w) => w.visible)
    .map((w) => w.id);

describe("MeaningDimensions step logic", () => {
  it("counts one number, then two, then 384 per word", () => {
    expect([0, 1, 2, 3, 4, 5].map((s) => dimensionsView(s, "en").numbers)).toEqual([1, 1, 2, 2, 384, 384]);
    expect(STRIP_LENGTH).toBe(384);
    expect(LLAMA_8B_DIMS).toBe(4096);
    expect(LLAMA_405B_DIMS).toBe(16384);
  });

  it("starts on one line: colours left, fruits right, orange in the middle", () => {
    const v = dimensionsView(0, "en");
    expect(v.plane).toBe(false);
    expect(shown(0, "en").sort()).toEqual(["apple", "banana", "blue", "cherry", "green", "orange", "red"]);
    for (const w of v.words.filter((w) => w.visible)) {
      expect(w.y).toBe(0);
      expect(w.value).toEqual([w.x]);
    }
    for (const id of ["red", "green", "blue"]) expect(positionAt(word(id), 0).x).toBeLessThan(0);
    for (const id of ["apple", "cherry", "banana"]) expect(positionAt(word(id), 0).x).toBeGreaterThan(0);
    expect(positionAt(word("orange"), 0)).toMatchObject({ x: 0, y: 0, mood: "focus" });
  });

  it("salmon hesitates off the line, then settles between the colours and the sea", () => {
    expect(positionAt(word("salmon"), 1).mood).toBe("hesitant");
    expect(dimensionsView(1, "en").words.find((w) => w.id === "salmon")!.value).toBe("?");
    expect(dimensionsView(1, "en").ghost).toBe(true);
    expect(ARROWS[1]!.every((a) => a.from === "salmon")).toBe(true);

    const v = dimensionsView(2, "en");
    expect(v.plane).toBe(true);
    const salmon = v.words.find((w) => w.id === "salmon")!;
    expect(salmon.value).toEqual([salmon.x, salmon.y]);
    expect(salmon.x).toBeLessThan(positionAt(word("fish"), 2).x);
    expect(salmon.y).toBeGreaterThan(0);
    expect(salmon.y).toBeLessThan(positionAt(word("fish"), 2).y);
  });

  it("shows pêche in French only", () => {
    expect(shown(2, "fr")).toContain("peach");
    expect(shown(2, "en")).not.toContain("peach");
    expect(dimensionsView(2, "en").words.some((w) => w.id === "peach")).toBe(false);
  });

  it("pulls blue in more directions than the plane has", () => {
    const v = dimensionsView(3, "en");
    expect(v.arrows.length).toBeGreaterThanOrEqual(4);
    expect(v.arrows.every((a) => a.from === "blue")).toBe(true);
    expect(positionAt(word("blue"), 3).mood).toBe("hesitant");
    expect(v.words.filter((w) => w.mood === "clash").length).toBeGreaterThanOrEqual(2);
  });

  it("replaces the map with a row of numbers, then adds the bridge", () => {
    expect(dimensionsView(3, "en")).toMatchObject({ map: true, strip: false, bridge: false });
    expect(dimensionsView(4, "en")).toMatchObject({ map: false, strip: true, bridge: false });
    expect(dimensionsView(5, "en")).toMatchObject({ map: false, strip: true, bridge: true });
    expect(dimensionsView(4, "en").words.every((w) => w.value === null)).toBe(true);
  });

  it("derives everything from the step, in either direction", () => {
    const fresh = [0, 1, 2, 3, 4, 5].map((s) => JSON.stringify(dimensionsView(s, "fr")));
    const backwards = [5, 4, 3, 2, 1, 0].map((s) => JSON.stringify(dimensionsView(s, "fr"))).reverse();
    expect(backwards).toEqual(fresh);
    expect(clampStep(-3)).toBe(0);
    expect(clampStep(99)).toBe(DIMENSION_STEPS);
    expect(clampStep(Number.NaN)).toBe(0);
    expect(dimensionsView(99, "en").step).toBe(DIMENSION_STEPS);
  });

  it("the row of numbers is fixed, starts with the written values and stays in [-1, 1]", () => {
    expect(STRIP).toHaveLength(STRIP_LENGTH);
    expect(STRIP.slice(0, STRIP_HEAD.length)).toEqual(STRIP_HEAD);
    for (const v of STRIP) {
      expect(Number.isFinite(v)).toBe(true);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
    expect(STRIP.some((v) => v < 0) && STRIP.some((v) => v > 0)).toBe(true);
  });

  it("every word and arrow stays inside the drawing", () => {
    for (const w of WORDS) {
      for (const pos of Object.values(w.at)) {
        expect(Math.abs(pos.x)).toBeLessThanOrEqual(1);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(1);
      }
    }
    for (const list of Object.values(ARROWS)) for (const a of list) expect(WORDS.some((w) => w.id === a.from)).toBe(true);
  });
});
