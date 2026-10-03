import { isLocale, LOCALES, type Locale } from "./locales.ts";
import type { EditionDefinition, PresentationDefinition, ResolvedEdition, SceneDefinition } from "./types.ts";

export function resolveEdition(
  presentation: PresentationDefinition,
  editionId: string,
): ResolvedEdition {
  const edition = presentation.editions.find((e) => e.id === editionId);
  if (!edition) {
    throw new Error(`Unknown edition "${editionId}" in presentation "${presentation.id}"`);
  }
  const include = new Set(edition.include ?? []);
  const exclude = new Set(edition.exclude ?? []);
  const scenes = presentation.scenes.filter((scene) => {
    if (exclude.has(scene.id)) return false;
    if (include.has(scene.id)) return true;
    return edition.cut === "full" || !scene.optional;
  });
  return { presentation, edition, scenes };
}

/** Number of reveal steps a scene exposes after its initial state. */
export function stepCount(scene: SceneDefinition): number {
  if (scene.steps !== undefined) return scene.steps;
  const v = scene.visual;
  switch (v.layout) {
    case "cards":
      return v.cards.length;
    case "list":
      return v.items.length;
    case "flow":
      return v.nodes.length;
    default:
      return 0;
  }
}

export function totalDurationSec(scenes: SceneDefinition[]): number {
  return scenes.reduce((sum, s) => sum + s.durationSec, 0);
}

/** The locale a talk opens in when nothing asks for another: its first enabled locale. */
export function defaultLocale(presentation: PresentationDefinition): Locale {
  return presentation.locales[0] ?? LOCALES[0];
}

/**
 * Reads an `?edition=` value, including links from before the language became
 * a launch parameter: "fr", "en-full" or "fr-short" name a locale, then
 * optionally an edition. An unknown edition part means the default edition.
 */
export function parseEditionParam(
  presentation: PresentationDefinition,
  value: string | null | undefined,
): { editionId: string | null; locale: Locale | null } {
  if (!value) return { editionId: null, locale: null };
  if (presentation.editions.some((e) => e.id === value)) return { editionId: value, locale: null };
  const [head, ...rest] = value.split("-");
  if (!isLocale(head)) return { editionId: null, locale: null };
  const tail = rest.join("-");
  return { editionId: presentation.editions.some((e) => e.id === tail) ? tail : null, locale: head };
}
