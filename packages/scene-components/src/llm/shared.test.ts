import { describe, expect, it } from "vitest";
import { decimalYear, dollars, energy, formatPercent, homesPhrase, numberInWords, roundSig } from "./shared.ts";

describe("llm formatting", () => {
  it("says big numbers in words", () => {
    expect(numberInWords(213e6, "en")).toBe("213 million");
    expect(numberInWords(1.5e9, "en")).toBe("1.5 billion");
    expect(numberInWords(175e9, "en")).toBe("175 billion");
    expect(numberInWords(1.5e9, "fr")).toBe("1,5 milliard");
    expect(numberInWords(405e9, "fr")).toBe("405 milliards");
    expect(numberInWords(15.6e12, "en")).toBe("15.6 trillion");
    expect(numberInWords(15.6e12, "fr")).toBe("15,6 billions");
  });

  it("formats money and electricity with two significant digits", () => {
    expect(dollars(438, "en")).toBe("$440");
    expect(dollars(2_116_866, "en")).toBe("$2.1 million");
    expect(dollars(217_835_546, "en")).toBe("$220 million");
    expect(dollars(2_116_866, "fr")).toBe("2,1 millions de dollars");
    expect(energy(0.351, "en")).toBe("350 kWh");
    expect(energy(1287, "en")).toBe("1.3 GWh");
    expect(energy(237_489, "en")).toBe("240 GWh");
  });

  it("turns electricity into homes", () => {
    expect(homesPhrase(1287, 10_791, "en")).toBe("120 US homes for a year");
    expect(homesPhrase(0.351, 10_791, "en")).toBe("one US home for 12 days");
  });

  it("rounds, dates and percents", () => {
    expect(roundSig(21_588, 2)).toBe(22_000);
    expect(decimalYear("2020-01-01")).toBe(2020);
    expect(decimalYear("2020-07-02")).toBeCloseTo(2020.5, 2);
    expect(formatPercent(0.1489, "en")).toBe("15%");
    expect(formatPercent(0.0928, "en")).toBe("9.3%");
    expect(formatPercent(0.0928, "fr")).toBe("9,3 %");
  });
});
