import { describe, expect, it } from "vitest";
import { bestResponseA, bestResponseB, equilibria, paretoBetter } from "./raceDilemma.ts";

describe("race dilemma payoffs", () => {
  it("racing is the best reply whatever the other does", () => {
    expect(bestResponseB("careful")).toBe("race");
    expect(bestResponseB("race")).toBe("race");
    expect(bestResponseA("careful")).toBe("race");
    expect(bestResponseA("race")).toBe("race");
  });

  it("the only equilibrium is both racing, which both careful beats", () => {
    expect(equilibria()).toEqual(["race-race"]);
    expect(paretoBetter("careful-careful", "race-race")).toBe(true);
  });
});
