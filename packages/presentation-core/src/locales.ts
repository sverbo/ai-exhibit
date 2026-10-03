/**
 * Locales of the talk: the single list every type, check and picker derives
 * from. Adding a language starts here (docs/authoring/content-guide.md,
 * "Adding a language").
 */

/** Every locale content may be written in. The first one is the reference. */
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * English is the reference: every text exists in it, other locales follow its
 * meaning, and a missing translation falls back to it.
 */
export const REFERENCE_LOCALE = "en" satisfies Locale;
export type ReferenceLocale = typeof REFERENCE_LOCALE;

export interface LocaleInfo {
  /** The language's name in itself, for pickers. */
  name: string;
  /** Its name in English, for logs and reports. */
  english: string;
  /** BCP 47 tag for `Intl` number and date formatting. */
  intl: string;
}

/** Complete on purpose: adding a locale to LOCALES must fill this in. */
export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { name: "English", english: "English", intl: "en-GB" },
  fr: { name: "Français", english: "French", intl: "fr-FR" },
};

/** A value per locale: the reference is required, the others may be missing. */
export type Localized<T> = { [K in ReferenceLocale]: T } & { [K in Locale]?: T };

/** Every audience- or presenter-facing string. */
export type L10n = Localized<string>;

/* Translation catalogs (catalog.ts): registered texts read their translation from here. */

export interface CatalogEntry {
  /** The English text this translation was made from. */
  source: string;
  /** The translation; empty while not translated yet. */
  text: string;
}

/** One language's translations, by key. */
export type Catalog = Record<string, CatalogEntry>;

const textKeys = new WeakMap<object, string>();
let installed: Partial<Record<Locale, Catalog>> = {};

/** Makes these catalogs the ones `tr` and `pick` read (one per language). */
export function installCatalogs(catalogs: Partial<Record<Locale, Catalog>>): void {
  installed = catalogs;
}

export function setTextKey(value: object, key: string): void {
  textKeys.set(value, key);
}

export function textKeyOf(value: object): string | undefined {
  return textKeys.get(value);
}

/** Catalog key of component copy: its English text ("copy:Stop"). */
export function copyKey(english: string): string {
  return `copy:${english}`;
}

function catalogEntry(key: string, locale: Locale): string | undefined {
  const text = installed[locale]?.[key]?.text;
  return text && text.trim() ? text : undefined;
}

/**
 * The value written for `locale`. A registered text (scene content) reads its
 * catalog entry. Anything else (component copy) uses an inline value when it
 * has one, else the catalog entry keyed by its English text.
 */
function ownValue<T>(value: Partial<Record<Locale, T>>, locale: Locale): T | undefined {
  if (locale === REFERENCE_LOCALE) return value[locale];
  const key = textKeys.get(value);
  if (key) {
    const fromCatalog = catalogEntry(key, locale);
    if (fromCatalog !== undefined) return fromCatalog as T;
  }
  const v = value[locale];
  if (v !== undefined && !(typeof v === "string" && v.trim() === "")) return v;
  const en = value[REFERENCE_LOCALE];
  if (!key && typeof en === "string") return catalogEntry(copyKey(en), locale) as T | undefined;
  return undefined;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Reads "fr", "FR", "fr-BE" or "fr_CA" as a known locale; null otherwise. */
export function parseLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const short = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(short) ? short : null;
}

/**
 * Typography rules per locale, applied when text is read (`tr`), so sources
 * may use plain spaces. French: narrow no-break space before ? ! ; %, no-break
 * space before : and », after «. Idempotent.
 */
const TYPOGRAPHY: Partial<Record<Locale, (text: string) => string>> = {
  fr: (text) =>
    text
      .replace(/[  ]([?!;%])/g, " $1")
      .replace(/ ([:»])/g, " $1")
      .replace(/« /g, "« "),
};

export function typeset(text: string, locale: Locale): string {
  const rule = TYPOGRAPHY[locale];
  return rule ? rule(text) : text;
}

/**
 * The value for `locale`, falling back to the reference locale when it is
 * missing or empty. Strings get the locale's typography. The only way to read
 * a localized value for display (no `value[locale]` indexing).
 */
export function tr<T>(value: Localized<T>, locale: Locale): T {
  const v = ownValue(value, locale);
  if (v === undefined) return value[REFERENCE_LOCALE];
  return (typeof v === "string" ? typeset(v, locale) : v) as T;
}

/**
 * The value for `locale` as written, with the same fallback as `tr` but no
 * typography: for text sent to a model or used as a recording key, which
 * must stay exactly what a person would type.
 */
export function pick<T>(value: Localized<T>, locale: Locale): T {
  return ownValue(value, locale) ?? value[REFERENCE_LOCALE];
}

/**
 * The value written for exactly this locale, or undefined: no fallback. For
 * optional extras such as a term's translation, where English would repeat
 * what is already shown.
 */
export function own<T>(value: Partial<Record<Locale, T>> | undefined, locale: Locale): T | undefined {
  return value ? ownValue(value, locale) : undefined;
}

/** Whether `locale` has its own value (no fallback). */
export function hasLocale<T>(value: Localized<T>, locale: Locale): boolean {
  return ownValue(value, locale) !== undefined;
}

/**
 * Inline bilingual string, French first (how most component copy is written).
 * Other locales go in `more`.
 */
export function l(fr: string, en: string, more: Partial<Record<Locale, string>> = {}): L10n {
  return { ...more, fr, en };
}

/**
 * Term markup: a technical term stays in English and its translation follows
 * in parentheses and italics, written `deep learning (*apprentissage profond*)`.
 * `TERM_MARKUP` finds the italic part; `<Rich>` renders it, `plainText` drops
 * the asterisks for places that cannot style text (attributes, titles).
 */
export const TERM_MARKUP = /\(\*([^*()\n]+)\*\)/g;

export function plainText(text: string): string {
  return text.replace(TERM_MARKUP, "($1)");
}

/** Splits text into plain and italic runs (italic: the inside of `(*...*)`, without parentheses). */
export function termRuns(text: string): { text: string; italic: boolean }[] {
  const runs: { text: string; italic: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(TERM_MARKUP)) {
    const at = m.index ?? 0;
    runs.push({ text: `${text.slice(last, at)}(`, italic: false });
    runs.push({ text: m[1]!, italic: true });
    last = at + m[0].length;
    runs.push({ text: ")", italic: false });
  }
  runs.push({ text: text.slice(last), italic: false });
  // Merge adjacent plain runs and drop empty ones.
  const out: { text: string; italic: boolean }[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const prev = out[out.length - 1];
    if (prev && !prev.italic && !r.italic) prev.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

/** `Intl` tag for number and date formatting. */
export function intlLocale(locale: Locale): string {
  return LOCALE_INFO[locale].intl;
}
