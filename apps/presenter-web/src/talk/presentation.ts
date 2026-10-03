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

/** Where the browser remembers the talk's language, for the next session it starts. */
export const TALK_LOCALE_KEY = "ai-exhibit:talk-locale";

/** The language last chosen in this browser (launcher or presenter switch), if the talk offers it. */
export function preferredTalkLocale(presentation: PresentationDefinition = canonical): Locale | null {
  try {
    const stored = parseLocale(localStorage.getItem(TALK_LOCALE_KEY));
    return stored && presentation.locales.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function rememberTalkLocale(locale: Locale): void {
  try {
    localStorage.setItem(TALK_LOCALE_KEY, locale);
  } catch {
    // storage unavailable
  }
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
