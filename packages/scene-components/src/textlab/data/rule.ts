import type { Locale } from "@ai-exhibit/presentation-core";
import { RULE } from "./small.ts";
import { tokenize, type Sport } from "./text.ts";

/**
 * The hand-written rule of the rules scene (classic AI), as a person would
 * write it: look for football keywords first, then basketball keywords,
 * otherwise say football. A keyword matches any word that starts with it.
 */

export interface RuleTrace {
  verdict: Sport;
  /** Which line of the rule decided: 0 football keywords, 1 basketball keywords, 2 the fallback. */
  line: 0 | 1 | 2;
  /** Token index of the word that matched (in `tokenize(text)`), when a keyword decided. */
  token: number | null;
  keyword: string | null;
}

function findKeyword(text: string, locale: Locale, keywords: readonly string[]): { token: number; keyword: string } | null {
  const tokens = tokenize(text, locale);
  for (let i = 0; i < tokens.length; i++) {
    const lower = tokens[i]!.surface.toLowerCase();
    const keyword = keywords.find((k) => lower.startsWith(k));
    if (keyword) return { token: i, keyword };
  }
  return null;
}

export function applyRule(text: string, locale: Locale): RuleTrace {
  const rule = RULE[locale];
  const football = findKeyword(text, locale, rule.football);
  if (football) return { verdict: "football", line: 0, ...football };
  const basketball = findKeyword(text, locale, rule.basketball);
  if (basketball) return { verdict: "basketball", line: 1, ...basketball };
  return { verdict: rule.fallback, line: 2, token: null, keyword: null };
}
