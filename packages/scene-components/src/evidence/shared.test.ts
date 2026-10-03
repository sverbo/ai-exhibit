import { describe, expect, it } from "vitest";
import { daysBetween, formatIsoDate, seededRandom, shortSourceLabel } from "./shared.ts";

describe("shared helpers", () => {
  it("formats partial and full ISO dates in both locales", () => {
    expect(formatIsoDate("2024", "en")).toBe("2024");
    expect(formatIsoDate("2024-08", "fr")).toBe("août 2024");
    expect(formatIsoDate("2024-08-01", "en")).toBe("Aug 1, 2024");
    expect(formatIsoDate("2024-08-01", "fr")).toBe("1 août 2024");
  });

  it("counts days between ISO dates", () => {
    expect(daysBetween("2026-01-01", "2026-04-01")).toBe(90);
    expect(daysBetween("2026-04-01", "2026-01-01")).toBe(-90);
  });

  it("produces a reproducible sequence", () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("builds a short projector label", () => {
    expect(
      shortSourceLabel({ id: "x", title: "T", publisher: "IEA", date: "2025-04-10", kind: "report", claim: "", evidence: "observed", verification: "verified" }),
    ).toBe("IEA, 2025");
  });
});
