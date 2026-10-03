/** Formatting and timing helpers shared by the llm components (pure, tested). */
import type { L10n, Locale } from "@ai-exhibit/presentation-core";
import { useEffect, useRef, useState } from "react";

export function formatNumber(n: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .format(n)
    // French groups digits with a narrow no-break space that the display font lacks.
    .replace(/\u202f/g, "\u00a0");
}

/** "15%", "9.3%", "0.48%" (French: "9,3 %"). Fewer decimals as the number grows. */
export function formatPercent(ratio: number, locale: Locale): string {
  const pct = ratio * 100;
  const digits = pct < 1 ? 2 : pct < 10 ? 1 : 0;
  return `${formatNumber(pct, locale, digits)}${locale === "fr" ? " %" : "%"}`;
}

/**
 * Probabilities from tiny to large: "0.0020%", "0.37%", "41%" (French: "0,0020 %").
 * Two significant digits under 1%, so a tiny change stays visible.
 */
export function formatChance(p: number, locale: Locale): string {
  const pct = p * 100;
  if (pct >= 1) return formatPercent(p, locale);
  const digits = Math.min(8, Math.max(2, 1 - Math.floor(Math.log10(pct))));
  return `${formatNumber(pct, locale, digits)}${locale === "fr" ? "\u00a0%" : "%"}`;
}

/** Rounds to `sig` significant digits. */
export function roundSig(n: number, sig: number): number {
  if (n === 0) return 0;
  const e = Math.ceil(Math.log10(Math.abs(n))) - sig;
  const m = Math.pow(10, Math.abs(e));
  // Divide or multiply by an exact power of ten so 1e9 stays 1e9 (not 999999999.9999999).
  return e >= 0 ? Math.round(n / m) * m : Math.round(n * m) / m;
}

const SCALES: { value: number; en: string; fr: [string, string] }[] = [
  { value: 1e12, en: "trillion", fr: ["billion", "billions"] },
  { value: 1e9, en: "billion", fr: ["milliard", "milliards"] },
  { value: 1e6, en: "million", fr: ["million", "millions"] },
];

/**
 * Large numbers in words, the way a person says them: "213 million",
 * "1.5 billion", "1,5 milliard". `sig` rounds first (estimates); omit it to keep
 * the value as published.
 */
export function numberInWords(n: number, locale: Locale, sig?: number): string {
  const v = sig ? roundSig(n, sig) : n;
  for (const s of SCALES) {
    if (Math.abs(v) >= s.value) {
      const m = v / s.value;
      const digits = Number.isInteger(m) ? 0 : m < 100 ? 1 : 0;
      const shown = formatNumber(m, locale, digits);
      if (locale === "en") return `${shown} ${s.en}`;
      return `${shown} ${m >= 2 ? s.fr[1] : s.fr[0]}`;
    }
  }
  return formatNumber(v, locale);
}

/** "$2.1 million" / "2,1 millions de dollars". */
export function dollars(n: number, locale: Locale, sig = 2): string {
  const v = roundSig(n, sig);
  if (v >= 1e6) {
    const words = numberInWords(v, locale);
    return locale === "en" ? `$${words}` : `${words} de dollars`;
  }
  return locale === "en" ? `$${formatNumber(v, locale)}` : `${formatNumber(v, locale)} $`;
}

/** Electricity: kWh under 1 MWh, MWh under 1 GWh, GWh above. */
export function energy(mwh: number, locale: Locale, sig = 2): string {
  const space = " ";
  if (mwh < 1) return `${formatNumber(roundSig(mwh * 1000, sig), locale)}${space}kWh`;
  if (mwh < 1000) return `${formatNumber(roundSig(mwh, sig), locale)}${space}MWh`;
  const g = roundSig(mwh / 1000, sig);
  return `${formatNumber(g, locale, g < 10 && !Number.isInteger(g) ? 1 : 0)}${space}GWh`;
}

/** How many average homes would use this electricity in a year. */
export function homeYears(mwh: number, kWhPerYear: number): number {
  return (mwh * 1000) / kWhPerYear;
}

/** "about 120 US homes for a year" or, under one home-year, "one US home for 12 days". */
export function homesPhrase(mwh: number, kWhPerYear: number, locale: Locale): string {
  const years = homeYears(mwh, kWhPerYear);
  if (years < 1) {
    const days = Math.max(1, Math.round(years * 365));
    return locale === "en"
      ? `one US home for ${days} days`
      : `un foyer américain pendant ${days} jours`;
  }
  const n = roundSig(years, 2);
  const shown = n >= 1e6 ? numberInWords(n, locale) : formatNumber(n, locale);
  return locale === "en" ? `${shown} US homes for a year` : `${shown} foyers américains pendant un an`;
}

/** Decimal year for an ISO date, e.g. "2020-05-28" -> 2020.41. */
export function decimalYear(iso: string): number {
  const [y, m = 1, d = 1] = iso.split("-").map(Number);
  const start = Date.UTC(y!, 0, 1);
  const end = Date.UTC(y! + 1, 0, 1);
  return y! + (Date.UTC(y!, m - 1, d) - start) / (end - start);
}

export function pick(l: L10n, locale: Locale): string {
  return l[locale];
}

/**
 * Milliseconds since `key` last changed, ticking with requestAnimationFrame
 * while `running`. Returns `Infinity` when not running (render the end state):
 * preview, reduced motion, or the presenter paused animations.
 */
export function useElapsed(key: string | number, running: boolean, maxMs = 60_000): number {
  const [elapsed, setElapsed] = useState(running ? 0 : Infinity);
  const startRef = useRef(0);
  useEffect(() => {
    if (!running) {
      setElapsed(Infinity);
      return;
    }
    startRef.current = performance.now();
    setElapsed(0);
    let raf = 0;
    const tick = () => {
      const t = performance.now() - startRef.current;
      setElapsed(t);
      if (t < maxMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, running, maxMs]);
  return elapsed;
}
