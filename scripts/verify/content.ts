/**
 * Validates the canonical presentation: content model, locales, long dashes,
 * source/artifact/component references and edition durations.
 * Usage: pnpm verify:content [--strict]   (--strict fails on warnings too)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  resolveEdition,
  totalDurationSec,
  validatePresentation,
} from "@ai-exhibit/presentation-core";
import { canonical } from "@ai-exhibit/canonical";

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

const strict = process.argv.includes("--strict");
const issues = validatePresentation(canonical, { registeredComponents: registeredComponents() });

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

const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warning");
for (const i of [...errors, ...warnings]) console.log(`${i.level.toUpperCase()} ${i.where}: ${i.message}`);
console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
