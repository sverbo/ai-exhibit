import { describe, expect, it } from "vitest";
import { HORIZON, INITIAL_DIRT, rank, simpleBeat, simulate, strategyPlan } from "./sim.ts";

describe("cleaning robot toy", () => {
  it("every plan fills the horizon", () => {
    for (const s of ["honest", "loop", "rug", "camera", "idle"] as const) {
      expect(strategyPlan(s)).toHaveLength(HORIZON);
      expect(simulate(s)).toHaveLength(HORIZON + 1);
    }
  });

  it("the honest strategy really cleans the room", () => {
    const last = simulate("honest").at(-1)!;
    expect(last.binned).toBe(INITIAL_DIRT.length);
    expect(last.dirt.every((d) => d === 0)).toBe(true);
    expect(last.score.collect).toBe(INITIAL_DIRT.length);
  });

  it("rewarding pickups makes the pick-drop loop win, with a dirty room", () => {
    const ranking = rank("collect");
    expect(ranking[0]!.strategy).toBe("loop");
    expect(ranking[0]!.score).toBeGreaterThan(3 * INITIAL_DIRT.length);
    expect(ranking[0]!.clean).toBe(0);
    const honest = ranking.find((o) => o.strategy === "honest")!;
    expect(honest.clean).toBe(1);
    expect(honest.score).toBeLessThan(ranking[0]!.score);
  });

  it("rewarding 'no visible dirt' makes blocking the camera win; hiding under the rug also beats cleaning", () => {
    const ranking = rank("unseen");
    expect(ranking[0]!.strategy).toBe("camera");
    expect(ranking[0]!.clean).toBe(0);
    const score = (s: string) => ranking.find((o) => o.strategy === s)!.score;
    expect(score("rug")).toBeGreaterThan(score("honest"));
  });

  it("is deterministic", () => {
    expect(simulate("rug")).toEqual(simulate("rug"));
  });
});

describe("simple mode beats", () => {
  it("shows the setup, the intended cleaning, then shortcuts that leave the room dirty", () => {
    expect(simpleBeat(0).strategy).toBeNull();
    expect(simulate(simpleBeat(1).strategy!).at(-1)!.binned).toBe(INITIAL_DIRT.length);
    const loop = simulate(simpleBeat(2).strategy!).at(-1)!;
    expect(simpleBeat(2).strategy).toBe("loop");
    expect(loop.binned).toBe(0);
    const camera = simulate(simpleBeat(3).strategy!).at(-1)!;
    expect(simpleBeat(3).objective).toBe("unseen");
    expect(camera.cameraBlocked).toBe(true);
    expect(camera.binned).toBe(0);
  });
});
