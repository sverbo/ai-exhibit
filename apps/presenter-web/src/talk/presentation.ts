import canonical from "@ai-exhibit/canonical";
import {
  defaultLocale,
  parseEditionParam,
  parseLocale,
  resolveEdition,
  type EditionDefinition,
  type Locale,
  type PresentationDefinition,
  type ResolvedEdition,
  type SceneDefinition,
  type SourceRecord,
} from "@ai-exhibit/presentation-core";

/**
 * When this window evaluated the presentation content. Content changes reload
 * the page (see vite.config.ts), so a later value means newer scenes.
 */
export const CONTENT_LOADED_AT = Date.now();

/** Default edition; a presentation without it falls back to its first edition. */
export const DEFAULT_EDITION = "full";

/** Every presentation the app can play; the edition ID picks one. */
export const presentations: PresentationDefinition[] = [canonical];

export function presentationFor(editionId: string): PresentationDefinition {
  return presentations.find((p) => p.editions.some((e) => e.id === editionId)) ?? canonical;
}

/**
 * Resolves an edition, falling back to the default when the ID is unknown.
 * Legacy IDs that carried a language ("en", "fr-short") resolve to their edition.
 */
export function resolveTalk(editionId: string | null | undefined): ResolvedEdition {
  const id = (editionId && parseEditionParam(presentationFor(editionId), editionId).editionId) ?? editionId ?? DEFAULT_EDITION;
  const presentation = presentationFor(id);
  if (presentation.editions.some((e) => e.id === id)) return resolveEdition(presentation, id);
  const fallback = presentation.editions.find((e) => e.id === DEFAULT_EDITION) ?? presentation.editions[0];
  if (!fallback) throw new Error(`Presentation "${presentation.id}" has no editions`);
  return resolveEdition(presentation, fallback.id);
}

/** Locales the launcher offers, default first. */
export function talkLocales(presentation: PresentationDefinition = canonical): Locale[] {
  return presentation.locales;
}

/**
 * The language a launch asks for: `?lang=`, else a locale in a legacy
 * `?edition=fr-full`, else null (the session's or the talk's default applies).
 * Only locales the talk offers count.
 */
export function requestedLocale(
  search: string = typeof window === "undefined" ? "" : window.location.search,
  presentation: PresentationDefinition = canonical,
): Locale | null {
  const q = new URLSearchParams(search);
  const asked = parseLocale(q.get("lang")) ?? parseEditionParam(presentation, q.get("edition")).locale;
  return asked && presentation.locales.includes(asked) ? asked : null;
}

/** The talk's default language (its first offered locale). */
export function defaultTalkLocale(presentation: PresentationDefinition = canonical): Locale {
  return defaultLocale(presentation);
}

export function allEditions(): { presentation: PresentationDefinition; edition: EditionDefinition }[] {
  return presentations.flatMap((presentation) => presentation.editions.map((edition) => ({ presentation, edition })));
}

export function sourceLookup(presentation: PresentationDefinition): (id: string) => SourceRecord | undefined {
  const map = new Map(presentation.sources.map((s) => [s.id, s]));
  return (id) => map.get(id);
}

export function chapterOf(presentation: PresentationDefinition, scene: SceneDefinition | undefined) {
  return scene ? presentation.chapters.find((c) => c.id === scene.chapter) : undefined;
}

/** Reads a query parameter from the current URL. */
export function queryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}
