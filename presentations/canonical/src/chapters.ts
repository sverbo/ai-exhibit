import type { ChapterDefinition, ChapterId, L10n, SceneDefinition } from "@ai-exhibit/presentation-core";

/** The talk's title: the presentation title, also shown on the holding slide. */
export const talkTitle: L10n = { en: "What AI can do today, how it works, and its risks" };

/** Chapters of the storyboard v1 talk (docs/specs/2026-10-02-storyboard-v1.md). */
export const chapters: ChapterDefinition[] = [
  {
    id: "00",
    title: { en: "Introduction" },
    summary: {
      en: "The plan of the talk, and what it is not.",
    },
  },
  {
    id: "01",
    title: { en: "What AI can do today" },
    summary: {
      en: "Today's assistants answer well and act on our behalf, within what we allow.",
    },
  },
  {
    id: "02",
    title: { en: "History and how it works" },
    summary: {
      en: "From written rules to learned ones, with one running example, then language models.",
    },
  },
  {
    id: "03",
    title: { en: "Who builds it" },
    summary: {
      en: "A handful of labs, a race between them, and a race for chips.",
    },
  },
  {
    id: "04",
    title: { en: "The risks" },
    summary: {
      en: "Powerful, opaque and built in a race: why risk is the next question.",
    },
  },
  {
    id: "05",
    title: { en: "What we can do" },
    summary: { en: "A question for the room." },
  },
];

/** The parts of the talk, in order: every chapter but the introduction. Shown by the agenda and the part openers. */
export const parts: ChapterDefinition[] = chapters.filter((c) => c.id !== "00");
export const agendaItems: L10n[] = parts.map((c) => c.title);

/**
 * The first scene of a part: its number and title over the agenda, this part
 * lit. Numbered "N.0" so the part's own scenes keep their numbers. The scene
 * code is passed explicitly (never derived from the chapter number), so it
 * stays stable if parts are renumbered. Its texts are English, like every
 * scene; translations live in locales/<lang>.json under "<code>/...".
 */
export function partOpener(
  chapterId: ChapterId,
  code: string,
  /** Extra speaker-note bullets (English, markdown) and a closing line, when the opener also frames the part. */
  extra: { notes?: string; transitionOut?: string } = {},
): SceneDefinition {
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
    },
    takeaway: part.summary,
    visual: { layout: "component", component: "SectionDivider", props: { items: agendaItems, current: index } },
    steps: 0,
    interaction: "presenter",
    speakerNotes: {
      en: `- Part ${n} of ${parts.length}: ${part.title.en}
- ${part.summary.en}${extra.notes ? `\n${extra.notes}` : ""}`,
    },
    transitionIn: { en: `Part ${n}.` },
    transitionOut: extra.transitionOut ? { en: extra.transitionOut } : part.summary,
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static title." },
    durationSec: 15,
    optional: false,
  };
}
