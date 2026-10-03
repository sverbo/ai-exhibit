/** Small shared types and helpers for the language components. */
import type { L10n, Locale } from "@ai-exhibit/presentation-core";
import type { Distribution } from "@ai-exhibit/ml-runtime/lm";

/** A candidate as published in scene state (small, serializable). */
export interface Cand {
  id: number;
  text: string;
  /** Raw probability. */
  p: number;
  /** Probability after sampling settings (when relevant). */
  q?: number;
  logit?: number;
}

export function fromDistribution(d: Distribution, n: number): Cand[] {
  return d.candidates.slice(0, n).map((c) => ({
    id: c.id,
    text: c.text,
    p: c.probability,
    q: c.adjustedProbability,
    logit: c.logit,
  }));
}

/** The text in the chosen model language, falling back to the audience locale. */
export function promptIn(l10n: L10n, lang: Locale): string {
  return l10n[lang] || l10n.fr || l10n.en;
}

export function isL10n(v: unknown): v is L10n {
  return !!v && typeof v === "object" && typeof (v as L10n).fr === "string" && typeof (v as L10n).en === "string";
}
