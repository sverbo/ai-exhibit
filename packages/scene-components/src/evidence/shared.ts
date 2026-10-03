import { intlLocale, pick, type Locale, type SourceRecord } from "@ai-exhibit/presentation-core";

export { tr as t } from "@ai-exhibit/presentation-core";

/** Short label for the projector: publisher (or title) and year. */
export function shortSourceLabel(source: SourceRecord): string {
  const who = source.publisher ?? source.title;
  const year = source.date?.slice(0, 4);
  return year ? `${who}, ${year}` : who;
}

const MONTHS: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};

/** Formats YYYY, YYYY-MM or YYYY-MM-DD for display without timezone surprises. */
export function formatIsoDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-");
  if (!y) return iso;
  if (!m) return y;
  const month = pick(MONTHS, locale)[Number(m) - 1] ?? m;
  if (!d) return `${month} ${y}`;
  const day = String(Number(d));
  return locale === "fr" ? `${day} ${month} ${y}` : `${month} ${day}, ${y}`;
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Deterministic PRNG (mulberry32) so controller and display draw identical scenes. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Buttons inside a scene must not also trigger the presenter shell shortcuts
 * (Space and Enter activate the focused button; arrows keep navigating).
 */
export function stopShellKeys(event: { key: string; stopPropagation: () => void }): void {
  if (event.key === " " || event.key === "Enter") event.stopPropagation();
}

export function formatNumber(n: number, locale: "fr" | "en", digits = 0): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(ratio: number, locale: "fr" | "en"): string {
  const pct = ratio * 100;
  const digits = pct < 1 ? 2 : 1;
  return `${formatNumber(pct, locale, digits)}${locale === "fr" ? " %" : "%"}`;
}
