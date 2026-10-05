import { describe, expect, it } from "vitest";
import { estimateWidth, keepFree, placeLabels } from "./labels.ts";
import { loadEmbeddingSpace } from "./data.ts";
import { fromLocated, searchVocabulary, SHOWN_NEIGHBOURS } from "./search.ts";
import { clusterMedoids, fitBox } from "./MapView.tsx";
import { cloudFrame, labelOrder, project3d } from "./Cloud3D.tsx";
import { randomStart, randomStart3d, randomVector, START_SPREAD, START_SPREAD_3D, trainingPosition, trainingPosition3d } from "./motion.ts";
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

  it("in 3D, starts from a seeded tight cloud and lands exactly on the real layout", () => {
    const centre = [0.5, -1, 2];
    const s = randomStart3d(433, centre, 4);
    expect(randomStart3d(433, centre, 4)).toEqual(s);
    expect(s).toHaveLength(433);
    const mean = [0, 1, 2].map((d) => s.reduce((a, p) => a + p[d]! / s.length, 0));
    mean.forEach((m, d) => expect(Math.abs(m - centre[d]!)).toBeLessThan(0.1));
    for (const p of s) expect(Math.hypot(p[0] - 0.5, p[1] + 1, p[2] - 2)).toBeLessThan(4 * START_SPREAD_3D * 6);
    const a = [1, 2, 3];
    const b = [-4, 5, 0.5];
    for (const i of [0, 7, 432]) {
      expect(trainingPosition3d(a, b, i, 0, 0.3)).toEqual(a);
      trainingPosition3d(a, b, i, 1, 0.3).forEach((x, d) => expect(x).toBeCloseTo(b[d]!, 9));
      // Halfway, every point is between its start and its end (give or take the wobble).
      const mid = trainingPosition3d(a, b, i, 0.5, 0);
      mid.forEach((x, d) => expect(x).toBeGreaterThanOrEqual(Math.min(a[d]!, b[d]!) - 1e-9));
      mid.forEach((x, d) => expect(x).toBeLessThanOrEqual(Math.max(a[d]!, b[d]!) + 1e-9));
    }
    // Without wobble, the 3D path matches the 2D one on x and y.
    const p2 = trainingPosition([1, 2], [-4, 5], 3, 0.4);
    const p3 = trainingPosition3d([1, 2, 3], [-4, 5, 0.5], 3, 0.4, 26);
    expect(p3[0]).toBeCloseTo(p2[0], 9);
    expect(p3[1]).toBeCloseTo(p2[1], 9);
  });

  it("frames the 3D cloud on its centroid and farthest point", () => {
    const f = cloudFrame([[1, 0, 0], [-1, 0, 0], [0, 2, 0], [0, -2, 0]]);
    expect(f.c).toEqual([0, 0, 0]);
    expect(f.r).toBeCloseTo(2);
  });
});

describe("3D cloud labels", () => {
  it("keeps highlighted words, then group names, then other words, nearest first", () => {
    const order = labelOrder(["word", "cluster", "strong", "word", "cluster"], [0.5, 0.9, 1, -0.5, -0.2]);
    expect(order).toEqual([2, 4, 1, 3, 0]);
  });

  it("hides any label that overlaps one kept before it, an obstacle, or has no place", () => {
    const r = (x: number) => ({ x0: x, y0: 0, x1: x + 50, y1: 20 });
    const kept = keepFree([r(0), r(30), r(60), null, r(200)], [{ x0: 190, y0: 0, x1: 210, y1: 10 }]);
    expect([...kept]).toEqual([1, 0, 1, 0, 0]);
    // A label with a second place (below its dot) takes it when the first is taken.
    const below = { x0: 0, y0: 40, x1: 50, y1: 60 };
    expect([...keepFree([r(0), [r(10), below], [r(20)]])]).toEqual([1, 2, 0]);
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
