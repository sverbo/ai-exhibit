import type { EditionDefinition } from "@ai-exhibit/presentation-core";

/**
 * Editions are cuts of the talk, independent of its language (chosen at
 * launch, see docs/specs/2026-10-03-locales.md). Old links such as
 * `?edition=en` or `?edition=fr-full` still open this edition in that language.
 */
export const editions: EditionDefinition[] = [
  {
    id: "full",
    title: { en: "Full talk (about 2 hours)" },
    targetMinutes: [90, 125],
    cut: "full",
  },
];
