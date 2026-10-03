/** Pure formatting helpers for the language scenes (tested). */
import type { Locale } from "@ai-exhibit/presentation-core";

const NBSP = " ";

/** "46,5 %" / "46.5%"; tiny values read "<0,1 %". */
export function formatPercent(p: number, locale: Locale): string {
  const pct = p * 100;
  let body: string;
  if (pct > 0 && pct < 0.1) body = locale === "fr" ? "<0,1" : "<0.1";
  else {
    const digits = pct < 10 ? 1 : 0;
    body = pct.toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  return locale === "fr" ? `${body}${NBSP}%` : `${body}%`;
}

/** Thousands separators for IDs and counts: "49 152" / "49,152". */
export function formatInt(n: number, locale: Locale): string {
  return n.toLocaleString(locale === "fr" ? "fr-FR" : "en-GB").replace(/ /g, NBSP);
}

export function formatNumber(x: number, locale: Locale, digits = 3): string {
  return x.toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: "always",
  });
}

export interface VisibleToken {
  /** True when the token starts with a space (shown as a small mark). */
  leadingSpace: boolean;
  body: string;
}

/** Makes invisible characters of a token visible: leading space, newlines, tabs, empty. */
export function visibleToken(text: string): VisibleToken {
  const leadingSpace = text.startsWith(" ");
  let body = leadingSpace ? text.slice(1) : text;
  body = body.replace(/\n/g, "↵").replace(/\t/g, "⇥").replace(/�/g, "◌");
  if (body === "" && !leadingSpace) body = "∅";
  return { leadingSpace, body };
}

/** Character counts the way people count them (emoji = 1). */
export function charCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let n = 0;
    for (const _ of seg.segment(text)) n++;
    return n;
  }
  return [...text].length;
}

/** Drops Markdown emphasis markers the instruct model writes ("**Title**" -> "Title"). */
export function stripEmphasis(text: string): string {
  return text.replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/\*\*/g, "");
}
