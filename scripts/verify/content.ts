/**
 * Validates the canonical presentation: content model, long dashes,
 * source/artifact/component references and edition durations; and, per
 * locale, the scenes' text and the recordings Simulation replays. Missing text
 * in a locale the talk offers is an error; in a draft locale (in LOCALES, not
 * offered) a warning.
 *
 * Usage: pnpm verify:content [--strict] [--locale fr]
 *   --strict      fails on warnings too
 *   --locale xx   lists every localization issue of that locale (drafts are
 *                 otherwise only counted)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { own,
  checkCatalog,
  checkLocalized,
  copyKey,
  LOCALE_INFO,
  LOCALES,
  localizationSummary,
  presentationTexts,
  REFERENCE_LOCALE,
  type CatalogText,
  parseLocale,
  resolveEdition,
  totalDurationSec,
  validatePresentation,
  type Issue,
} from "@ai-exhibit/presentation-core";
import { canonical, catalogs } from "@ai-exhibit/canonical";
import { glossary } from "@ai-exhibit/content/glossary";
import { scanCopy } from "../locales/scan.ts";
import { checkRecordings } from "./recordings.ts";

const root = new URL("../../", import.meta.url).pathname;

/** Component names registered anywhere under scene-components (static scan, no React import). */
function registeredComponents(): string[] {
  const names: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(entry)) {
        const src = readFileSync(path, "utf8");
        for (const m of src.matchAll(/registerSceneComponent\(\s*["']([A-Za-z0-9]+)["']/g)) names.push(m[1]!);
      }
    }
  };
  walk(join(root, "packages/scene-components/src"));
  return names;
}

const { values: args } = parseArgs({ options: { strict: { type: "boolean", default: false }, locale: { type: "string" } } });
const strict = args.strict!;
const listLocale = parseLocale(args.locale);
const terms = glossary.map((g) => ({ term: g.term, translation: g.translation }));
const issues: Issue[] = validatePresentation(canonical, { registeredComponents: registeredComponents(), terms });
// Catalogs (presentations/canonical/locales/<lang>.json): scene texts and component copy.
const copy = scanCopy(root);
for (const locale of LOCALES) {
  if (locale === REFERENCE_LOCALE) continue;
  const copyTexts: CatalogText[] = [];
  const seenCopy = new Set<string>();
  for (const c of copy) {
    if (locale in c.inline || seenCopy.has(c.en)) continue;
    seenCopy.add(c.en);
    copyTexts.push({ key: copyKey(c.en), value: { en: c.en } });
  }
  const file = `presentations/canonical/locales/${locale}.json`;
  for (const [key, entry] of Object.entries(own(catalogs, locale) ?? {})) {
    if (/[\u2013\u2014]/.test(entry.text)) issues.push({ level: "error", where: file, locale, message: `long dash in ${key}: "${entry.text.slice(0, 60)}"` });
  }
  issues.push(...checkCatalog([...presentationTexts(canonical), ...copyTexts], locale, own(catalogs, locale) ?? {}, { file, offered: canonical.locales.includes(locale) }));
  // Typography and term glosses of the component copy, as read through the catalog.
  checkLocalized(copyTexts.map((t) => t.value), "copy", file, { enabled: canonical.locales, terms }, issues);
}
await checkRecordings(root, canonical, issues);

const byChapter = new Map<string, { scenes: number; full: number; short: number; todos: number }>();
for (const s of canonical.scenes) {
  const row = byChapter.get(s.chapter) ?? { scenes: 0, full: 0, short: 0, todos: 0 };
  row.scenes += 1;
  row.full += s.durationSec;
  if (!s.optional) row.short += s.durationSec;
  row.todos += s.todo?.length ?? 0;
  byChapter.set(s.chapter, row);
}
console.log("chapter  scenes  full(min)  short(min)  todos");
for (const [ch, r] of [...byChapter].sort()) {
  console.log(
    `${ch.padEnd(9)}${String(r.scenes).padEnd(8)}${(r.full / 60).toFixed(1).padEnd(11)}${(r.short / 60).toFixed(1).padEnd(12)}${r.todos}`,
  );
}
for (const e of canonical.editions) {
  const min = totalDurationSec(resolveEdition(canonical, e.id).scenes) / 60;
  console.log(`edition ${e.id}: ${min.toFixed(1)} min (target ${e.targetMinutes.join("-")})`);
}
const unverified = canonical.sources.filter((s) => s.verification !== "verified").length;
console.log(`sources: ${canonical.sources.length} (${unverified} need verification)`);

const summary = localizationSummary(issues);
console.log("\nlocale        offered  missing  outdated  stale  untranslated  typography  term");
for (const l of LOCALES) {
  const r = summary[l];
  const offered = canonical.locales.includes(l) ? "yes" : "draft";
  const cols = [r.missing, r.outdated, r.stale, r.untranslated, r.typography].map((n, i) => String(n).padEnd([9, 10, 7, 14, 12][i]!));
  console.log(`${`${l} ${LOCALE_INFO[l].english}`.padEnd(14)}${offered.padEnd(9)}${cols.join("")}${r.term}`);
}

// A draft locale's issues are only counted, unless asked for with --locale.
const listed = issues.filter((i) => !i.locale || canonical.locales.includes(i.locale) || i.locale === listLocale);
const shown = listLocale ? listed.filter((i) => i.locale === listLocale) : listed;
const errors = listed.filter((i) => i.level === "error");
const warnings = listed.filter((i) => i.level === "warning");
console.log("");
for (const level of ["error", "warning"] as const) {
  for (const i of shown.filter((x) => x.level === level)) {
    console.log(`${i.level.toUpperCase()} ${i.locale ? `[${i.locale}] ` : ""}${i.where}: ${i.message}`);
  }
}
console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
