import { describe, expect, it } from "vitest";
import { charCount, formatInt, formatPercent, visibleToken } from "./format.ts";

describe("formatPercent", () => {
  it("uses locale conventions", () => {
    expect(formatPercent(0.465, "en")).toBe("47%");
    expect(formatPercent(0.0465, "en")).toBe("4.7%");
    expect(formatPercent(0.0465, "fr")).toBe("4,7 %");
    expect(formatPercent(0.0004, "en")).toBe("<0.1%");
    expect(formatPercent(0, "en")).toBe("0.0%");
  });
});

describe("formatInt", () => {
  it("groups thousands", () => {
    expect(formatInt(49152, "en")).toBe("49,152");
    expect(formatInt(49152, "fr")).toMatch(/^49\s152$/);
  });
});

describe("visibleToken", () => {
  it("shows leading spaces and invisible characters", () => {
    expect(visibleToken(" umbrella")).toEqual({ leadingSpace: true, body: "umbrella" });
    expect(visibleToken("\n")).toEqual({ leadingSpace: false, body: "↵" });
    expect(visibleToken("")).toEqual({ leadingSpace: false, body: "∅" });
  });
});

describe("charCount", () => {
  it("counts an emoji as one character", () => {
    expect(charCount("a 🐱")).toBe(3);
  });
});

describe("stripEmphasis", () => {
  it("removes bold markers, including an unfinished one while streaming", async () => {
    const { stripEmphasis } = await import("./format.ts");
    expect(stripEmphasis("1. **Create a Restful Environment:** Ensure")).toBe("1. Create a Restful Environment: Ensure");
    expect(stripEmphasis("2. **Limit")).toBe("2. Limit");
  });
});
