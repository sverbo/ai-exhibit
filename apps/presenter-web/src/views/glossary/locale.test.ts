import { describe, expect, it } from "vitest";
import { guessLocale } from "./locale.ts";

describe("guessLocale", () => {
  it("takes the first French or English preference, else French", () => {
    expect(guessLocale(["en-US", "fr"])).toBe("en");
    expect(guessLocale(["de-DE"])).toBe("fr");
    expect(guessLocale(undefined)).toBe("fr");
  });
});
