/**
 * Localization checks, per locale: missing translations, text left in
 * English, typography, and term glosses that disagree with the glossary.
 * Used by validatePresentation and by `pnpm verify:content` for every other
 * table of audience-facing text (glossary, component copy...).
 */
import { LOCALES, own, REFERENCE_LOCALE, TERM_MARKUP, textKeyOf, type Locale } from "./locales.ts";

export type LocalizationKind = "missing" | "outdated" | "stale" | "untranslated" | "typography" | "term";

export interface Issue {
  level: "error" | "warning";
  where: string;
  message: string;
  /** Set on localization issues: the locale concerned. */
  locale?: Locale;
  kind?: LocalizationKind;
}

/** A glossary term and its translations, as content must gloss it. */
export interface TermTranslation {
  term: string;
  translation?: Partial<Record<Locale, string>>;
}

export interface LocalizationOptions {
  /** Locales the talk is given in: a missing text there is an error; elsewhere a warning. */
  enabled: readonly Locale[];
  terms?: readonly TermTranslation[];
}

/** An object whose keys are all locales and whose values are strings: an L10n. */
export function isL10nValue(value: unknown): value is Partial<Record<Locale, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length > 0 &&
    REFERENCE_LOCALE in value &&
    entries.every(([k, v]) => (LOCALES as readonly string[]).includes(k) && (typeof v === "string" || v === undefined))
  );
}

const WORDS = /\p{L}{2,}/gu;

/** Program code shown as an example: its punctuation and words are not prose. */
function looksLikeCode(text: string): boolean {
  return /[{}=<>]|\w\(|;\s*$|^\s*(SELECT|for|if|def|print|import|return)\b/.test(text);
}

/** Text that may legitimately read the same in every language: names, numbers, code, one word. */
function mayStayTheSame(text: string): boolean {
  if (looksLikeCode(text)) return true;
  const words = (text.match(WORDS) ?? []).filter((w) => w.length > 3);
  if (words.length < 2) return true;
  if (/^(https?:\/\/|\/)\S*$/.test(text.trim())) return true;
  // Proper names and model names: every word capitalized ("Hugging Face", "via Wikimedia Commons").
  return words.every((w) => /^\p{Lu}/u.test(w));
}

/** Typography rules per locale: messages for each problem found. */
const TYPOGRAPHY_CHECKS: Partial<Record<Locale, (text: string) => string[]>> = {
  fr: (text) => {
    const out: string[] = [];
    // Inline code and URLs keep their own punctuation.
    const prose = text.replace(/`[^`]*`/g, "").replace(/https?:\/\/\S+/g, "");
    if (/[\p{L}\p{N})\]][?!;](?=\s|$|\*)/u.test(prose)) out.push("no space before ? ! or ;");
    if (/[\p{L})\]][:](?=\s|$|\*)/u.test(prose)) out.push("no space before :");
    if (/\d%/.test(prose)) out.push("no space before %");
    if (/["“”]/.test(prose)) out.push("straight or English quotes, use « »");
    if (/«[^\s  ]|[^\s  ]»/.test(prose)) out.push("no space inside « »");
    return out;
  },
};

function snippet(text: string): string {
  const one = text.replace(/\s+/g, " ");
  return one.length > 70 ? `${one.slice(0, 67)}...` : one;
}

const fold = (s: string) => s.trim().toLowerCase();

/** "appels d'outil" and "appel d'outil", "jetons" and "jeton": each word without its plural ending. */
function singular(text: string): string {
  return fold(text)
    .split(/\s+/)
    .map((w) => w.replace(/(?<=\p{L}{3})[sx]$/u, ""))
    .join(" ");
}

/**
 * For each `(*gloss*)` in a text, the longest glossary term written right
 * before it ("reasoning model (*...*)" is the term "Reasoning model", not "Model").
 */
function glossedTerms(text: string, terms: readonly TermTranslation[]): { term: TermTranslation; gloss: string }[] {
  const out: { term: TermTranslation; gloss: string }[] = [];
  for (const m of text.matchAll(new RegExp(TERM_MARKUP.source, "g"))) {
    const before = fold(text.slice(0, m.index ?? 0)).trimEnd();
    let best: TermTranslation | undefined;
    for (const t of terms) {
      const term = fold(t.term);
      const hit = [term, `${term}s`, `${term}es`].some(
        (form) => before.endsWith(form) && !/\p{L}/u.test(before.charAt(before.length - form.length - 1)),
      );
      if (hit && (!best || term.length > best.term.length)) best = t;
    }
    if (best) out.push({ term: best, gloss: m[1]! });
  }
  return out;
}

/** Checks one localized string table. */
function checkOne(
  value: Partial<Record<Locale, string>>,
  path: string,
  where: string,
  opts: LocalizationOptions,
  issues: Issue[],
): void {
  const reference = value[REFERENCE_LOCALE];
  // A text keyed in the catalogs reports its missing translations there (checkCatalog).
  const catalogued = textKeyOf(value) !== undefined;
  for (const locale of LOCALES) {
    // The translation as the app reads it: catalog entry or inline value.
    const text = own(value, locale);
    const enabled = opts.enabled.includes(locale);
    if (typeof text !== "string" || text.trim() === "") {
      if (catalogued && locale !== REFERENCE_LOCALE) continue;
      issues.push({
        level: enabled || locale === REFERENCE_LOCALE ? "error" : "warning",
        where,
        locale,
        kind: "missing",
        message: `missing "${locale}" text in ${path}${reference ? `: "${snippet(reference)}"` : ""}`,
      });
      continue;
    }
    if (locale === REFERENCE_LOCALE) continue;
    if (reference && text === reference && !mayStayTheSame(text)) {
      issues.push({ level: "warning", where, locale, kind: "untranslated", message: `"${locale}" same as English in ${path}: "${snippet(text)}"` });
    }
    for (const problem of looksLikeCode(text) ? [] : (TYPOGRAPHY_CHECKS[locale]?.(text) ?? [])) {
      issues.push({ level: "warning", where, locale, kind: "typography", message: `${problem} in ${path}: "${snippet(text)}"` });
    }
    if (text.includes("(*")) {
      for (const { term, gloss } of glossedTerms(text, opts.terms ?? [])) {
        const expected = term.translation?.[locale];
        if (expected && singular(gloss) !== singular(expected)) {
          issues.push({
            level: "warning",
            where,
            locale,
            kind: "term",
            message: `"${term.term}" glossed "${gloss}" in ${path}, the glossary says "${expected}"`,
          });
        }
      }
    }
  }
  // The markup is for the translation of a term, after it: never in the reference text.
  if (reference && new RegExp(TERM_MARKUP.source).test(reference)) {
    issues.push({ level: "warning", where, locale: REFERENCE_LOCALE, kind: "typography", message: `term markup in English text in ${path}` });
  }
}

/**
 * Walks any value and checks every L10n inside it. `seen` skips objects and
 * texts already checked (the same table reached twice, or loaded twice).
 */
export function checkLocalized(value: unknown, path: string, where: string, opts: LocalizationOptions, issues: Issue[], seen = new Set<unknown>()): void {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (isL10nValue(value)) {
    const key = `l10n:${JSON.stringify(value)}`;
    if (seen.has(key)) return;
    seen.add(key);
    checkOne(value, path, where, opts, issues);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => checkLocalized(v, `${path}[${i}]`, where, opts, issues, seen));
    return;
  }
  for (const [k, v] of Object.entries(value)) checkLocalized(v, path ? `${path}.${k}` : k, where, opts, issues, seen);
}

/** Per-locale counts of localization issues, for reports. */
export function localizationSummary(issues: Issue[]): Record<Locale, Record<LocalizationKind, number>> {
  const out = Object.fromEntries(
    LOCALES.map((l) => [l, { missing: 0, outdated: 0, stale: 0, untranslated: 0, typography: 0, term: 0 }]),
  ) as Record<Locale, Record<LocalizationKind, number>>;
  for (const i of issues) if (i.locale && i.kind) out[i.locale][i.kind] += 1;
  return out;
}
