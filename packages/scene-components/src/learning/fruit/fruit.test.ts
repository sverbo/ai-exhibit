import { describe, expect, it } from "vitest";
import {
  BOX_IDS,
  BOXES,
  FRUIT_H,
  FRUIT_STEPS,
  FRUIT_W,
  FRUITS,
  TEXT,
  boxCounts,
  boxPlacement,
  boxShare,
  fruitPlacement,
  fruitView,
} from "./fruit.ts";

describe("apples and pears script", () => {
  it("has one caption per step", () => {
    expect(TEXT.captions).toHaveLength(FRUIT_STEPS + 1);
  });

  it("clamps the step, so going past either end shows the first or last frame", () => {
    expect(fruitView(-3)).toEqual(fruitView(0));
    expect(fruitView(99)).toEqual(fruitView(FRUIT_STEPS));
    expect(fruitView(Number.NaN)).toEqual(fruitView(0));
    expect(fruitView(2.7).step).toBe(2);
  });

  it("reveals each element at its step and keeps it afterwards", () => {
    const frames = Array.from({ length: FRUIT_STEPS + 1 }, (_, s) => fruitView(s));
    const firstOn = (key: "split" | "model" | "world" | "lesson") => frames.findIndex((f) => f[key]);
    expect(firstOn("split")).toBe(1);
    expect(firstOn("model")).toBe(2);
    expect(firstOn("world")).toBe(5);
    expect(firstOn("lesson")).toBe(6);
    for (const key of ["split", "model", "world", "lesson"] as const) {
      expect(frames.slice(firstOn(key)).every((f) => f[key]), key).toBe(true);
    }
    expect(frames.map((f) => f.checked)).toEqual([[], [], [], [], ["test"], ["test"], ["test"]]);
    expect(frames.map((f) => f.focus)).toEqual([null, null, "training", "training", "test", "world", null]);
    expect(frames.map((f) => f.caution)).toEqual([false, false, false, true, true, false, false]);
  });

  it("depends on the step only: the same step always draws the same frame", () => {
    for (let s = 0; s <= FRUIT_STEPS; s++) {
      const a = FRUITS.map((f) => fruitPlacement(f, fruitView(s)));
      const b = FRUITS.map((f) => fruitPlacement(f, fruitView(s)));
      expect(a).toEqual(b);
    }
  });

  it("splits the pile 80 / 20 into two boxes, with both fruits in each", () => {
    expect(BOX_IDS).toEqual(["training", "test"]);
    expect(boxCounts()).toEqual({ training: 16, test: 4 });
    expect(boxShare("training")).toBeCloseTo(0.8);
    expect(boxShare("test")).toBeCloseTo(0.2);
    for (const box of BOX_IDS) {
      const kinds = new Set(FRUITS.filter((f) => f.box === box).map((f) => f.kind));
      expect([...kinds].sort(), box).toEqual(["apple", "pear"]);
    }
    expect(FRUITS.filter((f) => f.kind === "apple")).toHaveLength(10);
  });

  it("puts every fruit inside its box, without overlaps", () => {
    const placed = FRUITS.map((f) => ({ f, p: boxPlacement(f) }));
    for (const { f, p } of placed) {
      const r = BOXES[f.box];
      expect(p.x, `fruit ${f.id}`).toBeGreaterThanOrEqual(r.x);
      expect(p.y).toBeGreaterThanOrEqual(r.y);
      expect(p.x + FRUIT_W).toBeLessThanOrEqual(r.x + r.w);
      expect(p.y + FRUIT_H).toBeLessThanOrEqual(r.y + r.h);
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]!.p;
        const b = placed[j]!.p;
        const overlap = Math.abs(a.x - b.x) < FRUIT_W && Math.abs(a.y - b.y) < FRUIT_H;
        expect(overlap, `fruits ${i} and ${j}`).toBe(false);
      }
    }
  });

  it("keeps the pile on the stage, below the caption", () => {
    for (const f of FRUITS) {
      const p = fruitPlacement(f, fruitView(0));
      // The cell scales around its centre.
      const grow = ((p.scale - 1) / 2) * FRUIT_H;
      expect(p.x - grow).toBeGreaterThanOrEqual(0);
      expect(p.x + FRUIT_W + grow).toBeLessThanOrEqual(1920);
      expect(p.y - grow).toBeGreaterThanOrEqual(230);
      expect(p.y + FRUIT_H + grow).toBeLessThanOrEqual(1080);
    }
  });
});
