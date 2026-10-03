import { describe, expect, it } from "vitest";
import { estimateWidth, placeLabels } from "./labels.ts";
import { loadEmbeddingSpace } from "./data.ts";
import { fromLocated, searchVocabulary, SHOWN_NEIGHBOURS } from "./search.ts";
import { clusterMedoids, fitBox } from "./MapView.tsx";
import { project3d } from "./Cloud3D.tsx";
import { randomStart, randomVector, START_SPREAD, trainingPosition } from "./Training.tsx";
import { clusterColor } from "./data.ts";

describe("placeLabels", () => {
  it("places the most important label first and drops overlapping ones", () => {
    const out = placeLabels(
      [
        { key: "low", text: "bbbb", x: 200, y: 200, size: 20, priority: 1 },
        { key: "high", text: "aaaa", x: 200, y: 200, size: 20, priority: 9 },
      ],
      { width: 400, height: 400 },
    );
    expect(out[0]!.key).toBe("high");
    // The second label finds another side of the same point.
    expect(out).toHaveLength(2);
    expect(out[1]!.anchor).not.toBe(out[0]!.anchor);
  });

  it("respects obstacles and bounds", () => {
    const out = placeLabels([{ key: 1, text: "word", x: 5, y: 5, size: 20, priority: 1 }], { width: 30, height: 30 });
    expect(out).toHaveLength(0);
    const blocked = placeLabels(
      [{ key: 1, text: "w", x: 100, y: 100, size: 20, priority: 1 }],
      { width: 400, height: 400 },
      { obstacles: [{ x0: 0, y0: 0, x1: 400, y1: 400 }] },
    );
    expect(blocked).toHaveLength(0);
  });

  it("caps the number of labels and can use diagonal positions", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ key: i, text: "w", x: 20 + (i % 10) * 60, y: 20 + Math.floor(i / 10) * 60, size: 16, priority: i }));
    expect(placeLabels(many, { width: 800, height: 400 }, { max: 7 })).toHaveLength(7);
    // Right, left, above and below blocked: only a diagonal is free.
    const blocked = [
      { x0: 105, y0: 90, x1: 200, y1: 110 },
      { x0: 0, y0: 90, x1: 95, y1: 110 },
      { x0: 60, y0: 60, x1: 140, y1: 92 },
      { x0: 60, y0: 108, x1: 140, y1: 140 },
    ];
    const r = [{ key: 1, text: "ab", x: 100, y: 100, size: 16, priority: 1 }];
    expect(placeLabels(r, { width: 400, height: 400 }, { obstacles: blocked })).toHaveLength(0);
    expect(placeLabels(r, { width: 400, height: 400 }, { obstacles: blocked, diagonals: true }).length).toBeLessThanOrEqual(1);
  });

  it("keeps centered names inside the box", () => {
    const [l] = placeLabels([{ key: "c", text: "Nombres", x: 2, y: 100, size: 34, priority: 1, centered: true }], {
      width: 600,
      height: 300,
    });
    expect(l!.x - estimateWidth("Nombres", 34) / 2).toBeGreaterThanOrEqual(0);
  });
});

describe("map geometry", () => {
  it("fits a layout to the box with a bounded stretch", () => {
    const f = fitBox([[-1, -0.1], [1, 0.1]], 1000, 500, 0);
    expect(f.sx).toBeCloseTo(500);
    expect(f.sy).toBeLessThanOrEqual(f.sx * 1.6 + 1e-9);
  });

  it("projects the 3D origin to the centre", () => {
    const q = project3d([0, 0, 0], 1.2);
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(0);
  });
});

describe("training animation", () => {
  it("starts at the random point and lands exactly on the map", () => {
    const a: [number, number] = [10, 20];
    const b: [number, number] = [300, 400];
    for (const i of [0, 7, 432]) {
      expect(trainingPosition(a, b, i, 0)).toEqual(a);
      const end = trainingPosition(a, b, i, 1);
      expect(end[0]).toBeCloseTo(300, 6);
      expect(end[1]).toBeCloseTo(400, 6);
    }
  });

  it("starts every screen from the same tight random cloud around the centre", () => {
    const s1 = randomStart(433, 1728, 720);
    expect(randomStart(433, 1728, 720)).toEqual(s1);
    const mean = s1.reduce((a, p) => [a[0] + p[0] / s1.length, a[1] + p[1] / s1.length], [0, 0]);
    expect(Math.abs(mean[0] - 864)).toBeLessThan(10);
    expect(Math.abs(mean[1] - 360)).toBeLessThan(10);
    for (const [x, y] of s1) expect(Math.hypot(x - 864, y - 360)).toBeLessThan(START_SPREAD * 5);
    const v = randomVector(6);
    expect(v).toEqual(randomVector(6));
    for (const x of v) expect(Math.abs(x)).toBeLessThanOrEqual(0.02);
  });
});

describe("group colours", () => {
  it("are built from theme tokens only", () => {
    for (let i = 0; i < 16; i++) {
      const c = clusterColor(i, 16);
      expect(c).toMatch(/var\(--color-/);
      expect(c).not.toMatch(/#|rgb|oklch\(/);
    }
    expect(new Set(Array.from({ length: 16 }, (_, i) => clusterColor(i, 16))).size).toBe(16);
  });
});

describe("with the canonical vocabulary", async () => {
  const space = await loadEmbeddingSpace();
  const idx = (t: string) => space.items.findIndex((i) => i.text === t);

  it("finds a medoid inside each cluster", () => {
    const medoids = clusterMedoids(space, space.coords.umap2d);
    expect(medoids).toHaveLength(space.json.clusters.length);
    medoids.forEach((m, c) => expect(space.items[m]!.cluster).toBe(c));
  });

  it("fallback search matches typos and plurals, never needs the model", () => {
    const r = searchVocabulary(space, "Chats");
    expect(r.source).toBe("vocabulary");
    expect(r.matched).toBe("chat");
    expect(r.neighbours[0]!.index).toBe(idx("chat"));
    expect(r.neighbours.map((n) => space.items[n.index]!.text)).toContain("cat");
    expect(r.neighbours).toHaveLength(SHOWN_NEIGHBOURS);
    expect(r.position).toEqual(space.coords.umap2d[idx("chat")]);
  });

  it("reports unknown words calmly", () => {
    const r = searchVocabulary(space, "zzzzqqq");
    expect(r).toMatchObject({ source: "unknown", neighbours: [], position: null });
  });

  it("keeps published state small", () => {
    const r = fromLocated("x", { neighbours: space.neighboursOf(0), umap2d: [0.123456, 0.5], umap3d: [0, 0, 0] }, "model", { ms: 12 });
    expect(r.neighbours).toHaveLength(SHOWN_NEIGHBOURS);
    expect(r.position).toEqual([0.1235, 0.5]);
    expect(JSON.stringify(r).length).toBeLessThan(1000);
  });
});
