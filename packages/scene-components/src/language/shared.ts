/** Small shared types and helpers for the language components. */
import { intlLocale, pick, isLocale, tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
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
  return pick(l10n, lang);
}

export function isL10n(v: unknown): v is L10n {
  return !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as L10n).en === "string" && Object.keys(v).every(isLocale);
}

/**
 * Temperature choices offered live (slides and phone): 0 always takes the
 * most likely token, higher values make surprising tokens likelier. The
 * server accepts 0 to 2.
 */
export const TEMPERATURES: readonly number[] = [0, 0.5, 1, 1.5, 2];
export const DEFAULT_TEMPERATURE = 1;

/** "0", "0.5" / "0,5": the value as the locale writes it. */
export function formatTemperature(value: number, locale: Locale): string {
  return value.toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 });
}
