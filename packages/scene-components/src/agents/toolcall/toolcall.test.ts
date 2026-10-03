import { describe, expect, it } from "vitest";
import { isHighlighted, jsonLines } from "./jsonLines.ts";
import { SEARCH_INLINE_MAX, SEARCH_STAGES, SEARCH_TOOL_USE_ID, searchJsonAt, searchToolResultBlock } from "./search.ts";
import { TOOL_USE_ID, WEATHER_STAGES, tomorrowIso, toolDefinition, toolResultBlock, toolUseBlock } from "./weather.ts";

const text = (value: Parameters<typeof jsonLines>[0]) =>
  jsonLines(value)
    .map((line) => line.tokens.map((t) => t.text).join(""))
    .join("\n");

describe("jsonLines", () => {
  it("prints valid JSON that parses back to the same value", () => {
    for (const v of [toolDefinition("fr"), toolUseBlock("2026-10-03"), toolResultBlock("en"), { a: [1, 2, { b: null }] }]) {
      expect(JSON.parse(text(v))).toEqual(v);
    }
  });

  it("keeps small objects on one line so projected JSON stays short", () => {
    expect(jsonLines(toolDefinition("en")).length).toBeLessThanOrEqual(12);
    expect(jsonLines(toolUseBlock("2026-10-03")).length).toBeLessThanOrEqual(9);
  });

  it("tags lines with field paths for highlighting", () => {
    const paths = jsonLines(toolUseBlock("2026-10-03")).map((l) => l.path);
    expect(paths).toContain("input.location");
    expect(isHighlighted("input.location", ["input"])).toBe(true);
    expect(isHighlighted("id", ["input"])).toBe(false);
  });
});

describe("weather walkthrough", () => {
  it("uses the Messages API block shapes", () => {
    expect(Object.keys(toolDefinition("en"))).toEqual(["name", "description", "input_schema"]);
    expect(toolUseBlock("x")).toMatchObject({ type: "tool_use", id: TOOL_USE_ID, name: "get_weather" });
    expect(toolResultBlock("fr")).toMatchObject({ type: "tool_result", tool_use_id: TOOL_USE_ID });
    expect(TOOL_USE_ID).toMatch(/^toolu_/);
  });

  it("highlights fields that exist in each step's JSON", () => {
    const blocks = [toolDefinition("en"), toolUseBlock("x"), toolResultBlock("en")];
    blocks.forEach((b, i) => {
      const paths = jsonLines(b).map((l) => l.path);
      for (const h of WEATHER_STAGES[i]!.highlights) expect(paths.some((p) => isHighlighted(p, [h]))).toBe(true);
    });
  });

  it("asks for tomorrow", () => {
    expect(tomorrowIso(new Date(2026, 11, 31))).toBe("2027-01-01");
  });
});

describe("search scenario", () => {
  it("shows a tool definition, a tool_use and a tool_result at steps 2 to 4", () => {
    expect(Object.keys(searchJsonAt(2, "en")!)).toEqual(["name", "description", "input_schema"]);
    expect(searchJsonAt(3, "fr")).toMatchObject({ type: "tool_use", id: SEARCH_TOOL_USE_ID, name: "web_search" });
    expect(searchJsonAt(4, "en")).toMatchObject({ type: "tool_result", tool_use_id: SEARCH_TOOL_USE_ID });
    expect(searchJsonAt(1, "en")).toBeNull();
    expect(searchJsonAt(5, "en")).toBeNull();
  });

  it("returns results as text content blocks, one line each", () => {
    for (const locale of ["fr", "en"] as const) {
      const result = searchToolResultBlock(locale);
      expect(result.content.every((b) => b.type === "text")).toBe(true);
      const lines = jsonLines(result, SEARCH_INLINE_MAX);
      expect(lines.length).toBeLessThanOrEqual(8);
      expect(Math.max(...lines.map((l) => 2 * l.depth + l.tokens.reduce((n, t) => n + t.text.length, 0)))).toBeLessThanOrEqual(70);
    }
  });

  it("highlights fields that exist", () => {
    for (const s of SEARCH_STAGES) {
      const json = searchJsonAt(s.step, "en");
      if (!json) continue;
      const paths = jsonLines(json, SEARCH_INLINE_MAX).map((l) => l.path);
      for (const h of s.highlights) expect(paths.some((p) => isHighlighted(p, [h]))).toBe(true);
    }
  });
});
