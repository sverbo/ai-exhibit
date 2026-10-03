import { describe, expect, it } from "vitest";
import { fitStage } from "./scale.ts";

describe("fitStage", () => {
  it("fills a 16:9 container exactly", () => {
    expect(fitStage(960, 540)).toEqual({ scale: 0.5, offsetX: 0, offsetY: 0, width: 960, height: 540 });
  });

  it("letterboxes a wide container with side bars", () => {
    const fit = fitStage(2400, 1080);
    expect(fit.scale).toBe(1);
    expect(fit.offsetX).toBe(240);
    expect(fit.offsetY).toBe(0);
  });

  it("letterboxes a tall container with top and bottom bars", () => {
    const fit = fitStage(1920, 1440);
    expect(fit.scale).toBe(1);
    expect(fit.offsetY).toBe(180);
    expect(fit.offsetX).toBe(0);
  });

  it("scales up on large screens", () => {
    expect(fitStage(3840, 2160).scale).toBe(2);
  });

  it("returns a zero fit for an unmeasured container", () => {
    expect(fitStage(0, 500).scale).toBe(0);
    expect(fitStage(-10, 500).width).toBe(0);
  });
});
