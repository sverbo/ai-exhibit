import { describe, expect, it } from "vitest";
import { l, parseLocale, pick, plainText, termRuns, tr, typeset } from "./locales.ts";
import { parseEditionParam } from "./edition.ts";
import type { PresentationDefinition } from "./types.ts";

describe("locales", () => {
  it("reads the locale, else the reference, with French typography only on French text", () => {
    const text = { en: "Ready?", fr: "Prêt ? 80 % : « oui »" };
    expect(tr(text, "fr")).toBe("Prêt ? 80 % : « oui »");
    expect(tr({ en: "Ready?" }, "fr")).toBe("Ready?");
    expect(tr({ en: "Ready?", fr: " " }, "fr")).toBe("Ready?");
    expect(typeset(typeset("Bon ?", "fr"), "fr")).toBe("Bon ?");
  });

  it("pick keeps text exactly as written (model inputs, recording keys)", () => {
    expect(pick({ en: "Hi?", fr: "Salut ?" }, "fr")).toBe("Salut ?");
    expect(pick({ en: [1] }, "fr")).toEqual([1]);
    expect(l("Salut ?", "Hi?")).toEqual({ fr: "Salut ?", en: "Hi?" });
  });

  it("parses locale tags", () => {
    expect(parseLocale("FR-be")).toBe("fr");
    expect(parseLocale("en_GB")).toBe("en");
    expect(parseLocale("de")).toBeNull();
    expect(parseLocale(null)).toBeNull();
  });

  it("renders term markup as italic runs, or plain text", () => {
    const s = "deep learning (*apprentissage profond*) et tokens (*jetons*).";
    expect(plainText(s)).toBe("deep learning (apprentissage profond) et tokens (jetons).");
    expect(termRuns(s)).toEqual([
      { text: "deep learning (", italic: false },
      { text: "apprentissage profond", italic: true },
      { text: ") et tokens (", italic: false },
      { text: "jetons", italic: true },
      { text: ").", italic: false },
    ]);
    expect(termRuns("2 * 3 (*not closed")).toEqual([{ text: "2 * 3 (*not closed", italic: false }]);
  });

  it("reads legacy edition links as a locale plus an edition", () => {
    const p = { editions: [{ id: "full" }], locales: ["en", "fr"] } as unknown as PresentationDefinition;
    expect(parseEditionParam(p, "full")).toEqual({ editionId: "full", locale: null });
    expect(parseEditionParam(p, "fr")).toEqual({ editionId: null, locale: "fr" });
    expect(parseEditionParam(p, "fr-full")).toEqual({ editionId: "full", locale: "fr" });
    expect(parseEditionParam(p, "en-short")).toEqual({ editionId: null, locale: "en" });
    expect(parseEditionParam(p, "demo")).toEqual({ editionId: null, locale: null });
  });
});
