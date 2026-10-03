import type { ChapterDefinition, ChapterId, L10n, SceneDefinition } from "@ai-exhibit/presentation-core";

/** Chapters of the storyboard v1 talk (docs/specs/2026-10-02-storyboard-v1.md). */
export const chapters: ChapterDefinition[] = [
  {
    id: "00",
    title: { en: "Introduction", fr: "Introduction" },
    summary: {
      en: "The plan of the talk, and what it is not.",
      fr: "Le plan de la conférence, et ce qu'elle n'est pas.",
    },
  },
  {
    id: "01",
    title: { en: "What AI can do today", fr: "Ce que l'IA sait faire aujourd'hui" },
    summary: {
      en: "Today's assistants answer well and act on our behalf, within what we allow.",
      fr: "Les assistants d'aujourd'hui répondent bien et agissent pour nous, dans les limites qu'on leur donne.",
    },
  },
  {
    id: "02",
    title: { en: "History and how it works", fr: "L'histoire et comment ça marche" },
    summary: {
      en: "From written rules to learned ones, with one running example, then language models.",
      fr: "Des règles écrites aux règles apprises, sur un seul exemple, puis les modèles de langage.",
    },
  },
  {
    id: "03",
    title: { en: "Who builds it", fr: "Qui les construit" },
    summary: {
      en: "A handful of labs, a race between them, and a race for chips.",
      fr: "Une poignée de laboratoires, une course entre eux, et une course aux puces.",
    },
  },
  {
    id: "04",
    title: { en: "The risks", fr: "Les risques" },
    summary: {
      en: "Powerful, opaque and built in a race: why risk is the next question.",
      fr: "Puissants, opaques et construits dans une course : pourquoi les risques sont la question suivante.",
    },
  },
  {
    id: "05",
    title: { en: "What we can do", fr: "Ce qu'on peut faire" },
    summary: { en: "A question for the room.", fr: "Une question pour la salle." },
  },
];

/** The parts of the talk, in order: every chapter but the introduction. Shown by the agenda and the part openers. */
export const parts: ChapterDefinition[] = chapters.filter((c) => c.id !== "00");
export const agendaItems: L10n[] = parts.map((c) => c.title);

/**
 * The first scene of a part: its number and title over the agenda, this part
 * lit. Numbered "N.0" so the part's own scenes keep their numbers. The scene
 * code is passed explicitly (never derived from the chapter number), so it
 * stays stable if parts are renumbered.
 */
export function partOpener(chapterId: ChapterId, code: string): SceneDefinition {
  const index = parts.findIndex((c) => c.id === chapterId);
  const part = parts[index];
  if (!part) throw new Error(`No part for chapter "${chapterId}"`);
  const n = index + 1;
  return {
    id: `${chapterId}-part`,
    code,
    chapter: chapterId,
    number: `${n}.0`,
    title: part.title,
    objective: {
      en: `Open part ${n} of ${parts.length} and show where it sits in the talk.`,
      fr: `Ouvrir la partie ${n} sur ${parts.length} et montrer où elle se situe dans la conférence.`,
    },
    takeaway: part.summary,
    visual: { layout: "component", component: "SectionDivider", props: { items: agendaItems, current: index } },
    steps: 0,
    interaction: "presenter",
    speakerNotes: {
      en: `- Part ${n} of ${parts.length}: ${part.title.en}
- ${part.summary.en}`,
      fr: `- Partie ${n} sur ${parts.length} : ${part.title.fr}
- ${part.summary.fr}`,
    },
    transitionIn: { en: `Part ${n}.`, fr: `Partie ${n}.` },
    transitionOut: part.summary,
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static title." },
    durationSec: 15,
    optional: false,
  };
}
