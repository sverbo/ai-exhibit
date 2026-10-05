import { tr, type Locale, type SceneDefinition } from "@ai-exhibit/presentation-core";

const OPTIONAL = { en: "optional", fr: "optionnel" };

/**
 * A scene's title as the presenter sees it (desk, palette, Config, strip):
 * optional scenes say so, so they are easy to skip or hide. The audience's
 * screens never show the tag.
 */
export function deskTitle(scene: SceneDefinition, locale: Locale): string {
  const title = tr(scene.title, locale);
  return scene.optional ? `${title} (${tr(OPTIONAL, locale)})` : title;
}
