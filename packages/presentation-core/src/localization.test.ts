import { describe, expect, it } from "vitest";
import { checkLocalized, localizationSummary, type Issue } from "./localization.ts";

function check(value: unknown, enabled: ("en" | "fr")[] = ["en", "fr"]): Issue[] {
  const issues: Issue[] = [];
  checkLocalized(value, "", "t", { enabled, terms: [{ term: "Token", translation: { fr: "jeton" } }] }, issues);
  return issues;
}

describe("checkLocalized", () => {
  it("reports missing text: an error for an enabled locale, a warning for a draft one", () => {
    expect(check({ a: { en: "Hello there" } })).toMatchObject([{ level: "error", locale: "fr", kind: "missing" }]);
    expect(check({ a: { en: "Hello there" } }, ["en"])).toMatchObject([{ level: "warning", locale: "fr", kind: "missing" }]);
  });

  it("flags sentences left in English, not names", () => {
    expect(check({ a: { en: "Two words here", fr: "Two words here" } })).toMatchObject([{ kind: "untranslated" }]);
    expect(check({ a: { en: "Hugging Face", fr: "Hugging Face" }, b: { en: "GPT-2", fr: "GPT-2" } })).toEqual([]);
  });

  it("checks French typography and term glosses", () => {
    const issues = check({ a: { en: "Ready? 80% of tokens", fr: 'Prêt? "oui" 80% des tokens (*pions*)' } });
    expect(issues.filter((i) => i.kind === "typography").map((i) => i.message.split(" in ")[0])).toEqual([
      "no space before ? ! or ;",
      "no space before %",
      "straight or English quotes, use « »",
    ]);
    expect(issues.some((i) => i.kind === "term" && i.message.includes('"jeton"'))).toBe(true);
    expect(check({ a: { en: "Tokens", fr: "Des tokens (*jetons*) : « oui » ?" } })).toEqual([]);
  });

  it("counts issues per locale and kind", () => {
    expect(localizationSummary(check({ a: { en: "Hello there" } })).fr.missing).toBe(1);
  });
});

describe("term glosses", () => {
  it("checks the longest term before the gloss, and accepts plurals of any word", () => {
    const issues: Issue[] = [];
    const terms = [
      { term: "Model", translation: { fr: "modèle" } },
      { term: "Reasoning model", translation: { fr: "modèle de raisonnement" } },
      { term: "Tool call", translation: { fr: "appel d'outil" } },
    ];
    checkLocalized(
      { a: { en: "x y", fr: "Un reasoning model (*modèle de raisonnement*) fait des tool calls (*appels d'outil*)." } },
      "",
      "t",
      { enabled: ["en", "fr"], terms },
      issues,
    );
    expect(issues).toEqual([]);
  });
});
