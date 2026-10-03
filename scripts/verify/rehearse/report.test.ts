import { describe, expect, it } from "vitest";
import { clip, formatReport, groupProblems, isLocalUrl, type Problem } from "./report.ts";

const base: Omit<Problem, "kind" | "detail"> = { edition: "en-short", view: "present", scene: "s1", step: 0, mode: "live" };

describe("isLocalUrl", () => {
  it("accepts loopback hosts and non-network schemes", () => {
    for (const u of [
      "http://127.0.0.1:5220/present",
      "ws://localhost:4420/session",
      "http://[::1]:80/",
      "data:text/plain,hi",
      "blob:http://127.0.0.1:5220/abc",
      "chrome-extension://x/y",
    ]) {
      expect(isLocalUrl(u), u).toBe(true);
    }
  });
  it("rejects anything that would leave the machine", () => {
    for (const u of ["https://huggingface.co/x", "https://fonts.googleapis.com/css", "ws://192.168.1.10:4317/session", "http://example.localhost.com/"]) {
      expect(isLocalUrl(u), u).toBe(false);
    }
  });
});

describe("report", () => {
  it("groups equal problems across ports and positions", () => {
    const problems: Problem[] = [
      { ...base, kind: "console-error", detail: "Failed at http://127.0.0.1:5220/a.js:10:3)" },
      { ...base, scene: "s2", kind: "console-error", detail: "Failed at http://127.0.0.1:5221/a.js:11:4)" },
      { ...base, kind: "stuck", detail: "never showed" },
    ];
    const groups = groupProblems(problems);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.occurrences).toHaveLength(2);
    const text = formatReport(problems, []);
    expect(text).toContain("3 problem(s) in 2 group(s)");
    expect(text).toContain("at en-short present s2@0 live");
  });

  it("says so when there is nothing to report", () => {
    expect(formatReport([], [{ edition: "fr-full", scenes: 2, positions: 5, ms: 1000 }])).toContain("No problems found.");
  });

  it("clips long details to one line", () => {
    expect(clip("a\n  b", 10)).toBe("a b");
    expect(clip("x".repeat(20), 10)).toBe("xxxxxxx...");
  });
});
