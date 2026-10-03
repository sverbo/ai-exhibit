import { glossary, resources } from "@ai-exhibit/content/glossary";
import { describe, expect, it } from "vitest";
import { searchGlossary, termId } from "./search.ts";

const LONG_DASHES = /[–—]/;

describe("glossary data", () => {
  it("is sorted alphabetically, ignoring case", () => {
    const terms = glossary.map((e) => e.term);
    const sorted = [...terms].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    expect(terms).toEqual(sorted);
  });

  it("has unique terms and see-also links that resolve", () => {
    const terms = new Set(glossary.map((e) => e.term));
    expect(terms.size).toBe(glossary.length);
    expect(new Set(glossary.map((e) => termId(e.term))).size).toBe(glossary.length);
    for (const e of glossary) for (const s of e.seeAlso ?? []) expect(terms, `${e.term} -> ${s}`).toContain(s);
  });

  it("explains every term in both languages", () => {
    for (const e of glossary) {
      expect(e.explanation.en.trim(), e.term).not.toBe("");
      expect(e.explanation.fr!.trim(), e.term).not.toBe("");
    }
  });

  it("has no em or en dashes", () => {
    for (const e of glossary) {
      expect(LONG_DASHES.test(e.term), e.term).toBe(false);
      expect(LONG_DASHES.test(e.explanation.en), e.term).toBe(false);
      expect(LONG_DASHES.test(e.explanation.fr!), e.term).toBe(false);
    }
    for (const r of resources) {
      expect(LONG_DASHES.test(`${r.title} ${r.by.en} ${r.by.fr} ${r.description.en} ${r.description.fr}`), r.title).toBe(false);
      expect(r.url.startsWith("https://"), r.title).toBe(true);
    }
  });

  it("covers the terms the talk uses", () => {
    const terms = new Set(glossary.map((e) => e.term));
    for (const t of ["Agent", "AGI", "Alignment", "ASI", "Base model", "Benchmark", "Chain of thought", "Chatbot", "Classifier",
      "Context window", "Decision tree", "Embedding", "Evaluation", "Fine-tuning", "GPU", "GPT", "Guardrails", "Hallucination",
      "Hugging Face", "Interpretability", "LLM", "Loss of control", "Machine learning", "Misuse", "Model", "Neural network",
      "Open weights", "Parameters / weights", "Pretraining", "Prompt", "Reward hacking", "Scaling laws", "System prompt",
      "Token", "Tool call", "Training", "Transformer"]) {
      expect(terms, t).toContain(t);
    }
  });
});

describe("glossary search", () => {
  it("finds terms first, then explanations, ignoring accents", () => {
    const hits = searchGlossary(glossary, "token", "en").map((e) => e.term);
    expect(hits[0]).toBe("Token");
    expect(hits.length).toBeGreaterThan(1);
    expect(searchGlossary(glossary, "ENTRAINEMENT", "fr").length).toBeGreaterThan(0);
    expect(searchGlossary(glossary, "", "en")).toBe(glossary);
  });
});
