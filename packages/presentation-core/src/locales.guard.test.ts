import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const DIRS = ["apps", "packages", "presentations", "content", "scripts", "api"];
/** Files that implement the lookup itself or walk untyped values. */
const ALLOWED = new Set([
  "packages/presentation-core/src/locales.ts",
  "packages/presentation-core/src/localization.ts",
  "packages/presentation-core/src/validate.ts",
  // Catalog tooling reads translations as written inline in the sources.
  "scripts/locales/extract.ts",
  "scripts/locales/scan.ts",
]);
/**
 * `value[locale]`, `value?.[ctx.locale]`: a read that skips the fallback and
 * the typography. Optional extras with no fallback use own(value, locale).
 */
const DIRECT = /(?:[\w$)\]!]|\?\.)\[(?:locale|ctx\.locale|loc|lang)\]/;

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) && !entry.endsWith(".d.ts")) out.push(path);
  }
  return out;
}

describe("localized reads", () => {
  it("go through tr() or pick(), never value[locale]", () => {
    const hits: string[] = [];
    for (const dir of DIRS) {
      for (const file of sources(join(root, dir))) {
        const rel = relative(root, file);
        if (ALLOWED.has(rel)) continue;
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (DIRECT.test(line) && !/^\s*(\/\/|\*)/.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
          });
      }
    }
    expect(hits, "use tr(value, locale) for display, pick() for data, own() for no fallback").toEqual([]);
  });
});
