import type { SourceRecord } from "@ai-exhibit/presentation-core";
import { describe, expect, it } from "vitest";
import { shortSourceLabel } from "./sourceLabel.ts";

const base: SourceRecord = {
  id: "x",
  title: "A very long report title about artificial intelligence systems",
  kind: "report",
  claim: "c",
  evidence: "observed",
  verification: "verified",
};

describe("shortSourceLabel", () => {
  it("prefers publisher and year", () => {
    expect(shortSourceLabel({ ...base, publisher: "OECD", date: "2024-05-01" })).toBe("OECD, 2024");
  });
  it("uses first author surname with et al.", () => {
    expect(shortSourceLabel({ ...base, authors: ["Ada Lovelace", "Alan Turing"], date: "2023" })).toBe(
      "Lovelace et al., 2023",
    );
  });
  it("truncates the title when nothing else is known", () => {
    const label = shortSourceLabel(base);
    expect(label.length).toBeLessThanOrEqual(32);
    expect(label.endsWith("…")).toBe(true);
  });
});
