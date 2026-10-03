/**
 * Translation catalogs. Slide text is written once, in English, where it is
 * used (scene definitions, component copy tables). Each other language is one
 * JSON file of entries, each holding the English it was translated from and
 * the translation. Scene texts are keyed by where they live
 * ("02-tokens/visual.props.items.3", registered by `registerPresentationTexts`);
 * component copy by its English text ("copy:Stop", see `copyKey`). `tr` and
 * `pick` read the installed catalogs. Spec: docs/specs/2026-10-03-locales.md.
 */
import type { Issue } from "./localization.ts";
import { REFERENCE_LOCALE, textKeyOf, setTextKey, type Catalog, type L10n, type Locale } from "./locales.ts";
import type { PresentationDefinition } from "./types.ts";

export interface CatalogText {
  key: string;
  /** The text object (its `en` is the source). */
  value: L10n;
}

function isText(value: unknown): value is L10n {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>)[REFERENCE_LOCALE] === "string"
  );
}

/**
 * Every text object under `value`, with its key (`prefix` + path). A text
 * reached twice (shared by two scenes) keeps the first key.
 */
function collect(value: unknown, path: string, out: CatalogText[], seen: Set<object>): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (isText(value)) {
    out.push({ key: path, value });
    return;
  }
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value);
  for (const [k, v] of entries) collect(v, path.endsWith("/") ? `${path}${k}` : `${path}.${k}`, out, seen);
}

function register(texts: CatalogText[]): CatalogText[] {
  for (const t of texts) if (!textKeyOf(t.value)) setTextKey(t.value, t.key);
  return texts;
}

/**
 * The texts of a presentation's content, in order, with their keys: title,
 * chapters, edition titles, scenes ("<scene id>/<path>").
 */
export function presentationTexts(p: PresentationDefinition): CatalogText[] {
  const out: CatalogText[] = [];
  const seen = new Set<object>();
  collect({ title: p.title }, "presentation/", out, seen);
  for (const c of p.chapters) collect(c, `chapter:${c.id}/`, out, seen);
  for (const e of p.editions) collect({ title: e.title }, `edition:${e.id}/`, out, seen);
  for (const s of p.scenes) collect(s, `${s.id}/`, out, seen);
  return out;
}

/** Gives a presentation's texts their catalog keys. Call once when it is defined. */
export function registerPresentationTexts(p: PresentationDefinition): void {
  register(presentationTexts(p));
}

/**
 * Missing and outdated translations (errors in a locale the talk offers,
 * warnings in a draft) and stale entries (warnings), for these texts.
 */
export function checkCatalog(
  texts: CatalogText[],
  locale: Locale,
  catalog: Catalog,
  opts: { file: string; offered: boolean },
): Issue[] {
  const issues: Issue[] = [];
  const level = opts.offered ? "error" : "warning";
  const known = new Set<string>();
  const short = (s: string) => (s.length > 70 ? `${s.slice(0, 67)}...` : s).replace(/\s+/g, " ");
  for (const { key, value } of texts) {
    known.add(key);
    const entry = catalog[key];
    if (!entry || !entry.text.trim()) {
      issues.push({ level, where: opts.file, locale, kind: "missing", message: `no translation for ${key}: "${short(value.en)}"` });
    } else if (entry.source !== value.en) {
      issues.push({
        level,
        where: opts.file,
        locale,
        kind: "outdated",
        message: `outdated ${key}: translated from "${short(entry.source)}", the English is now "${short(value.en)}"`,
      });
    }
  }
  for (const key of Object.keys(catalog)) {
    if (!known.has(key)) {
      issues.push({ level: "warning", where: opts.file, locale, kind: "stale", message: `stale ${key}: no such text any more (pnpm locales:extract --prune)` });
    }
  }
  return issues;
}
