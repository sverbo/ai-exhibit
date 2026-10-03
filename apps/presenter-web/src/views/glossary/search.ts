import type { Locale } from "@ai-exhibit/presentation-core";
import type { GlossaryEntry } from "@ai-exhibit/content/glossary";

/** Lowercase, accents stripped, so "évaluation" finds "evaluation" and back. */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Entries matching every word of `query` in the term or the explanation; terms first. */
export function searchGlossary(entries: GlossaryEntry[], query: string, locale: Locale): GlossaryEntry[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return entries;
  const scored: { entry: GlossaryEntry; score: number }[] = [];
  for (const entry of entries) {
    const term = fold(entry.term);
    const body = fold(entry.explanation[locale]);
    if (!words.every((w) => term.includes(w) || body.includes(w))) continue;
    scored.push({ entry, score: words.every((w) => term.includes(w)) ? (term.startsWith(words[0]!) ? 0 : 1) : 2 });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.entry);
}

/** The letter an entry is filed under (A to Z, anything else under "#"). */
export function letterOf(term: string): string {
  const c = fold(term).charAt(0).toUpperCase();
  return c >= "A" && c <= "Z" ? c : "#";
}

/** Stable DOM id for a term ("Parameters / weights" -> "term-parameters-weights"). */
export function termId(term: string): string {
  return `term-${fold(term).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
