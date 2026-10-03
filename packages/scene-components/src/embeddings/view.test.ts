import { describe, expect, it } from "vitest";
import {
  clampCamera,
  defaultCamera,
  frameFor,
  labelBudgetFor,
  lerpCamera,
  MAX_ZOOM,
  panBy,
  pickPoint,
  sameCamera,
  toData,
  toScreen,
  zoomAbout,
} from "./view.ts";
import { moveCamera3d, TILT_RANGE, ZOOM_RANGE } from "./Cloud3D.tsx";

const coords = [[-1, -0.5], [1, 0.5], [0, 0], [0.5, -0.2]];
const f = frameFor(coords, 1000, 500, 40);

describe("camera maths", () => {
  it("the default camera shows the whole map centred", () => {
    const c = defaultCamera(f);
    const [x, y] = toScreen([0, 0], c, f);
    expect(x).toBeCloseTo(500);
    expect(y).toBeCloseTo(250);
    for (const p of coords) {
      const [px, py] = toScreen(p, c, f);
      expect(px).toBeGreaterThanOrEqual(39.99);
      expect(px).toBeLessThanOrEqual(960.01);
      expect(py).toBeGreaterThanOrEqual(39.99);
      expect(py).toBeLessThanOrEqual(460.01);
    }
  });

  it("toData inverts toScreen", () => {
    const c = { u: 0.2, v: -0.1, k: 3 };
    const d = toData(toScreen([0.4, 0.3], c, f), c, f);
    expect(d[0]).toBeCloseTo(0.4);
    expect(d[1]).toBeCloseTo(0.3);
  });

  it("zooming keeps the point under the pointer still", () => {
    const c0 = defaultCamera(f);
    const pt: [number, number] = [800, 120];
    const before = toData(pt, c0, f);
    const c1 = zoomAbout(c0, 2.5, pt, f);
    expect(c1.k).toBeCloseTo(2.5);
    const after = toScreen(before, c1, f);
    expect(after[0]).toBeCloseTo(800);
    expect(after[1]).toBeCloseTo(120);
  });

  it("clamps zoom between 1 and the maximum, and snaps back home at 1", () => {
    const c = zoomAbout(defaultCamera(f), 1000, [500, 250], f);
    expect(c.k).toBe(MAX_ZOOM);
    const out = zoomAbout({ u: 0.7, v: 0.3, k: 2 }, 0.1, [10, 10], f);
    expect(sameCamera(out, defaultCamera(f))).toBe(true);
  });

  it("never lets the centre leave the data", () => {
    const c = clampCamera({ u: 50, v: -50, k: 4 }, f);
    expect(c.u).toBe(1);
    expect(c.v).toBe(-0.5);
    const panned = panBy({ u: 0, v: 0, k: 4 }, -1e6, 1e6, f);
    // Dragging left and down moves the view right and up.
    expect(panned.u).toBe(1);
    expect(panned.v).toBe(0.5);
    expect(clampCamera({ u: Number.NaN, v: 0, k: Number.NaN }, f)).toEqual(defaultCamera(f));
  });

  it("drag pans with the pointer", () => {
    const c0 = { u: 0, v: 0, k: 2 };
    const p = [0.1, 0.1];
    const s0 = toScreen(p, c0, f);
    const c1 = panBy(c0, 30, -20, f);
    const s1 = toScreen(p, c1, f);
    expect(s1[0] - s0[0]).toBeCloseTo(30);
    expect(s1[1] - s0[1]).toBeCloseTo(-20);
  });

  it("interpolates zoom in log space", () => {
    const m = lerpCamera({ u: 0, v: 0, k: 1 }, { u: 1, v: 1, k: 4 }, 0.5);
    expect(m.k).toBeCloseTo(2);
    expect(m.u).toBeCloseTo(0.5);
  });

  it("labels more words as you zoom in", () => {
    expect(labelBudgetFor(1, 200)).toBe(200);
    expect(labelBudgetFor(3, 200)).toBe(1000);
  });

  it("picks the nearest point under the pointer", () => {
    const c = defaultCamera(f);
    const s = toScreen([0.5, -0.2], c, f);
    expect(pickPoint([s[0] + 3, s[1] - 2], coords, c, f)).toBe(3);
    expect(pickPoint([5, 5], coords, c, f)).toBe(-1);
  });
});

describe("3D camera", () => {
  it("rotates with a horizontal drag and keeps tilt and zoom within limits", () => {
    const c = moveCamera3d({ angle: 0, tilt: 0.35, zoom: 1 }, 100, 0);
    expect(c.angle).toBeCloseTo(0.8);
    expect(moveCamera3d(c, 0, 1e6).tilt).toBe(TILT_RANGE[1]);
    expect(moveCamera3d(c, 0, 0, 1e6).zoom).toBe(ZOOM_RANGE[1]);
    expect(moveCamera3d(c, 0, 0, 1e-6).zoom).toBe(ZOOM_RANGE[0]);
  });
});
