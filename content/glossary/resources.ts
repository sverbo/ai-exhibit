import type { L10n } from "@ai-exhibit/presentation-core";

/**
 * Further watching and reading offered on the audience's phones (/glossary,
 * "Resources"). These are the only links on that page that need the internet.
 * Add an entry only after checking its URL and who publishes it.
 */
export interface ResourceEntry {
  title: string;
  /** Who makes it, as they present themselves. */
  by: L10n;
  description: L10n;
  url: string;
  kind: "video" | "article" | "book" | "website" | "course" | "petition";
}

export const resources: ResourceEntry[] = [
  {
    title: "AI In Context",
    by: {
      en: "YouTube channel by 80,000 Hours, hosted by Aric Floyd",
      fr: "Chaîne YouTube de 80,000 Hours, présentée par Aric Floyd",
    },
    description: {
      en: "Videos explaining the risks of AI and what people can do about them.",
      fr: "Des vidéos qui expliquent les risques de l'IA et ce que chacun peut faire (en anglais).",
    },
    url: "https://www.youtube.com/@AI_In_Context",
    kind: "video",
  },
  {
    title: "AGI Strategy",
    by: {
      en: "Free online course by BlueDot Impact",
      fr: "Cours en ligne gratuit de BlueDot Impact",
    },
    description: {
      en: "About 25 hours with a small group: where AI is heading, what could go well or badly, and what could steer it.",
      fr: "Environ 25 heures en petit groupe : où va l'IA, ce qui pourrait bien ou mal tourner, et comment l'orienter (en anglais).",
    },
    url: "https://bluedot.org/courses/agi-strategy",
    kind: "course",
  },
  {
    title: "PauseAI Statement",
    by: {
      en: "Petition by PauseAI, a citizens' movement",
      fr: "Pétition de PauseAI, un mouvement citoyen",
    },
    description: {
      en: "Asks governments for an international treaty pausing the training of the most powerful AI systems until they can be built safely.",
      fr: "Demande aux gouvernements un traité international qui suspende l'entraînement des IA les plus puissantes tant qu'on ne sait pas les construire de façon sûre.",
    },
    url: "https://pauseai.info/statement",
    kind: "petition",
  },
];
