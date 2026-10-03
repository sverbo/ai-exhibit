import { resolveEdition, totalDurationSec } from "./edition.ts";
import { checkLocalized, type Issue, type LocalizationOptions, type TermTranslation } from "./localization.ts";
import type { PresentationDefinition, SceneDefinition } from "./types.ts";

export type { Issue };

export interface ValidateOptions {
  /** Names passed to registerSceneComponent; unknown names become warnings. */
  registeredComponents?: string[];
  /** Glossary terms, so term glosses in content can be checked against them. */
  terms?: readonly TermTranslation[];
}

const SCENE_ID = /^(\d\d)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Scene codes: 4 or 5 lowercase letters or digits. */
export const SCENE_CODE = /^[a-z0-9]{4,5}$/;
const LONG_DASH = /[–—]/;

/** Walks any value, reporting long dashes in strings. */
function checkDashes(value: unknown, path: string, issues: Issue[], where: string): void {
  if (typeof value === "string") {
    if (LONG_DASH.test(value)) {
      issues.push({ level: "error", where, message: `long dash in ${path}: "${value.slice(0, 60)}"` });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => checkDashes(v, `${path}[${i}]`, issues, where));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [k, v] of Object.entries(value)) checkDashes(v, path ? `${path}.${k}` : k, issues, where);
}

/** Long dashes anywhere, and every L10n checked per locale. */
function checkStrings(value: unknown, path: string, issues: Issue[], where: string, loc: LocalizationOptions): void {
  checkDashes(value, path, issues, where);
  checkLocalized(value, path, where, loc, issues);
}

/** Every string inside any `sourceIds` array nested in a value. */
function collectSourceIds(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => collectSourceIds(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "sourceIds" && Array.isArray(v)) out.push(...v.filter((x) => typeof x === "string"));
      else collectSourceIds(v, out);
    }
  }
  return out;
}

function localizationOf(p: PresentationDefinition, opts: ValidateOptions): LocalizationOptions {
  return { enabled: p.locales, terms: opts.terms };
}

function checkScene(
  scene: SceneDefinition,
  p: PresentationDefinition,
  opts: ValidateOptions,
  issues: Issue[],
): void {
  const where = `scene ${scene.id}`;
  const err = (message: string) => issues.push({ level: "error", where, message });
  const warn = (message: string) => issues.push({ level: "warning", where, message });

  const m = SCENE_ID.exec(scene.id);
  if (!m) err(`id must match <chapter>-<kebab-slug>`);
  else if (m[1] !== scene.chapter) err(`id prefix ${m[1]} does not match chapter ${scene.chapter}`);
  if (!p.chapters.some((c) => c.id === scene.chapter)) err(`unknown chapter ${scene.chapter}`);
  if (typeof scene.code !== "string" || !SCENE_CODE.test(scene.code)) {
    err(`code "${String(scene.code)}" must be 4 or 5 lowercase letters or digits`);
  } else if (p.retiredSceneCodes?.includes(scene.code)) {
    err(`code "${scene.code}" is retired: codes are never reused`);
  }

  checkStrings(scene, "", issues, where, localizationOf(p, opts));

  const sourceIds = new Set(p.sources.map((s) => s.id));
  for (const id of scene.sourceIds) if (!sourceIds.has(id)) err(`unknown source "${id}"`);
  for (const id of collectSourceIds(scene.visual)) {
    if (!sourceIds.has(id)) err(`unknown source "${id}" in visual`);
  }

  const artifactIds = new Set(p.artifacts.map((a) => a.id));
  for (const id of scene.artifacts) {
    if (!artifactIds.has(id)) {
      // The manifest may still be empty while artifacts are being pinned.
      (p.artifacts.length ? err : warn)(`unknown artifact "${id}"`);
    }
  }

  if (scene.visual.layout === "component" && opts.registeredComponents) {
    if (!opts.registeredComponents.includes(scene.visual.component)) {
      warn(`component "${scene.visual.component}" is not registered (renders a placeholder)`);
    }
  }
  if (scene.visual.layout === "placeholder") warn("visual is still a placeholder");

  if (scene.runtimeClass !== "A" && scene.fallback.kind === "none") {
    err(`runtime class ${scene.runtimeClass} needs a fallback`);
  }
  if (scene.durationSec <= 0 || scene.durationSec > 600) err(`implausible duration ${scene.durationSec}s`);

  if (scene.evidenceLevel !== "none") {
    if (scene.sourceIds.length === 0 && !(scene.todo?.length)) {
      err(`evidence level "${scene.evidenceLevel}" without sources or a TODO`);
    }
  }
}

export function validatePresentation(p: PresentationDefinition, opts: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const scene of p.scenes) {
    if (seen.has(scene.id)) issues.push({ level: "error", where: `scene ${scene.id}`, message: "duplicate id" });
    seen.add(scene.id);
    checkScene(scene, p, opts, issues);
  }
  // Parked scenes must stay valid so they can come back, but against their own chapters.
  const parkedView: PresentationDefinition = { ...p, chapters: p.parkedChapters ?? [] };
  for (const scene of p.parkedScenes ?? []) {
    const where = `parked ${scene.id}`;
    if (seen.has(scene.id)) issues.push({ level: "error", where, message: "id collides with another scene" });
    seen.add(scene.id);
    const sceneIssues: Issue[] = [];
    checkScene(scene, parkedView, { ...opts, registeredComponents: undefined }, sceneIssues);
    for (const i of sceneIssues) issues.push({ ...i, level: "warning", where });
  }
  const codeOwner = new Map<string, string>();
  for (const scene of [...p.scenes, ...(p.parkedScenes ?? [])]) {
    if (typeof scene.code !== "string") continue;
    const owner = codeOwner.get(scene.code);
    if (owner) issues.push({ level: "error", where: `scene ${scene.id}`, message: `code "${scene.code}" is already used by ${owner}` });
    else codeOwner.set(scene.code, scene.id);
  }
  const editionSceneIds = new Set(p.scenes.map((s) => s.id));
  const loc = localizationOf(p, opts);
  checkStrings(p.title, "title", issues, "presentation", loc);
  for (const c of p.chapters) checkStrings(c, "", issues, `chapter ${c.id}`, loc);
  for (const e of p.editions) checkStrings(e.title, "title", issues, `edition ${e.id}`, loc);
  if (p.locales.length === 0) issues.push({ level: "error", where: "presentation", message: "no locales: the launcher would offer none" });

  const sourceSeen = new Set<string>();
  for (const s of p.sources) {
    const where = `source ${s.id}`;
    if (sourceSeen.has(s.id)) issues.push({ level: "error", where, message: "duplicate id" });
    sourceSeen.add(s.id);
    checkStrings(s, "", issues, where, localizationOf(p, opts));
    if (s.verification === "verified" && !s.retrieved) {
      issues.push({ level: "warning", where, message: "verified source without a retrieved date" });
    }
    if (!s.url) issues.push({ level: "warning", where, message: "no URL" });
  }

  for (const edition of p.editions) {
    const where = `edition ${edition.id}`;
    for (const id of [...(edition.include ?? []), ...(edition.exclude ?? [])]) {
      if (!editionSceneIds.has(id)) issues.push({ level: "error", where, message: `unknown scene "${id}"` });
    }
    if (p.scenes.length === 0) continue;
    const minutes = totalDurationSec(resolveEdition(p, edition.id).scenes) / 60;
    const [min, max] = edition.targetMinutes;
    if (minutes < min || minutes > max) {
      issues.push({
        level: "error",
        where,
        message: `duration ${minutes.toFixed(1)} min outside target ${min}-${max} min`,
      });
    }
  }
  return issues;
}
