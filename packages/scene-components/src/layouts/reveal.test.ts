import { describe, expect, it } from "vitest";
import { cardColumns, displaySize, statementLines, visibleItemCount } from "./reveal.ts";

describe("visibleItemCount", () => {
  it("reveals one item per step by default", () => {
    expect(visibleItemCount(4, 4, 0)).toBe(0);
    expect(visibleItemCount(4, 4, 2)).toBe(2);
    expect(visibleItemCount(4, 4, 9)).toBe(4);
  });
  it("shows everything when the scene has no steps", () => {
    expect(visibleItemCount(3, 0, 0)).toBe(3);
  });
  it("groups items when steps are fewer than items", () => {
    expect(visibleItemCount(6, 2, 1)).toBe(3);
    expect(visibleItemCount(5, 2, 1)).toBe(3);
    expect(visibleItemCount(5, 2, 2)).toBe(5);
  });
  it("handles empty lists", () => {
    expect(visibleItemCount(0, 3, 2)).toBe(0);
  });
});

describe("cardColumns", () => {
  it("balances rows", () => {
    expect(cardColumns(1)).toBe(1);
    expect(cardColumns(4)).toBe(4);
    expect(cardColumns(5)).toBe(3);
    expect(cardColumns(6)).toBe(3);
    expect(cardColumns(8)).toBe(4);
  });
});

describe("display type", () => {
  it("sets short text bigger", () => {
    expect(displaySize("What can AI do today?", 28, 60)).toBe("short");
    expect(displaySize("Who should decide how these systems are built and deployed?", 28, 64)).toBe("medium");
    expect(displaySize("x".repeat(100), 28, 64)).toBe("long");
  });
  it("breaks a few short sentences into lines, and nothing else", () => {
    expect(statementLines("Powerful. Opaque. Built in a race.")).toEqual(["Powerful.", "Opaque.", "Built in a race."]);
    expect(statementLines("Puissante. Opaque. Construite dans une course.")).toEqual([
      "Puissante.",
      "Opaque.",
      "Construite dans une course.",
    ]);
    expect(statementLines("The system may do exactly what its user wants.")).toEqual([
      "The system may do exactly what its user wants.",
    ]);
    expect(statementLines("Thought experiment: a very powerful AI whose only goal is to make paperclips. It never stops.")).toHaveLength(1);
    expect(statementLines("It costs 9.11 dollars. Or 9.9.")).toHaveLength(1);
  });
});
