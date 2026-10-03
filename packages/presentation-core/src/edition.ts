import type {
  EditionDefinition,
  L10n,
  Locale,
  PresentationDefinition,
  ResolvedEdition,
  SceneDefinition,
} from "./types.ts";

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

export function t(text: L10n, locale: Locale): string {
  return text[locale];
}
