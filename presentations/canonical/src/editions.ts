import type { EditionDefinition } from "@ai-exhibit/presentation-core";

/** The talk has one edition: English, full. French strings stay in the scenes for later. */
export const editions: EditionDefinition[] = [
  {
    id: "en",
    locale: "en",
    title: { en: "English, full (about 90 min)", fr: "Anglais, complète (environ 90 min)" },
    targetMinutes: [75, 95],
    cut: "full",
  },
];
