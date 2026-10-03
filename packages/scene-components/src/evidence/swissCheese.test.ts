import { describe, expect, it } from "vitest";
import { seededRandom } from "./shared.ts";
import { alignedHazard, demoHazards, launch, makeLayers, MAX_RECENT, record, traverse } from "./swissCheese.ts";

describe("Swiss-cheese geometry", () => {
  for (const n of [3, 6, 8]) {
    it(`with ${n} layers the aligned path goes through every layer`, () => {
      const layers = makeLayers(n);
      expect(layers).toHaveLength(n);
      expect(alignedHazard(layers).stop).toBe(-1);
    });
  }

  it("is deterministic", () => {
    expect(makeLayers(6)).toEqual(makeLayers(6));
  });

  it("random hazards rarely pass all six layers", () => {
    const layers = makeLayers(6);
    const rand = seededRandom(3);
    let passed = 0;
    for (let i = 0; i < 5000; i++) if (launch(layers, rand).stop === -1) passed++;
    expect(passed / 5000).toBeLessThan(0.03);
  });

  it("demo hazards are stopped at distinct layers", () => {
    const layers = makeLayers(6);
    const demo = demoHazards(layers);
    expect(demo.length).toBeGreaterThanOrEqual(3);
    const stops = demo.map((h) => h.stop);
    expect(new Set(stops).size).toBe(stops.length);
    for (const h of demo) expect(traverse(layers, h.u, h.v)).toBe(h.stop);
  });

  it("records attempts and caps the recent list", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ u: 0.1, v: 0.1, stop: i % 2 ? 0 : -1 }));
    const s = record(undefined, many);
    expect(s.attempts).toBe(20);
    expect(s.passed).toBe(10);
    expect(s.recent).toHaveLength(MAX_RECENT);
  });
});
