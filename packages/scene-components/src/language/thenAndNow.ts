/** Pure helpers for ThenAndNow (tested). */
import {
  GAME_QUESTION_IDS,
  type GenerationSlot,
  type ThenAndNowQuestion,
  thenAndNowQuestions,
} from "@ai-exhibit/content/assets/then-and-now/questions.ts";

export function pickQuestions(ids: string[] | undefined, variant: "game" | "recap"): ThenAndNowQuestion[] {
  const wanted = ids?.length ? ids : variant === "game" ? GAME_QUESTION_IDS : thenAndNowQuestions.map((q) => q.id);
  const byId = new Map(thenAndNowQuestions.map((q) => [q.id, q]));
  return wanted.map((id) => byId.get(id)).filter((q): q is ThenAndNowQuestion => !!q);
}

/** Filled generation slots only, in their declared order. */
export function filledSlots(q: ThenAndNowQuestion): (GenerationSlot & { answer: NonNullable<GenerationSlot["answer"]> })[] {
  return q.others.filter((o): o is GenerationSlot & { answer: NonNullable<GenerationSlot["answer"]> } => !!o.answer);
}

export function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[.,;:]$/, "")}…`;
}


/** Operators and punctuation: thin hairlines at display size, so they get a sturdier cut. */
const MARK = /([+\-−×÷=<>?!.,:;$%'"“”‘’]+)/;
const OPERATOR = /^[+\-−×÷=<>]+$/;

export type RunKind = "text" | "operator" | "punctuation";

/** A question split into plain runs, operators and punctuation. */
export function questionRuns(text: string): { text: string; kind: RunKind }[] {
  // split() with a capture group puts the matches at the odd indexes.
  return text
    .split(MARK)
    .map((t, i): { text: string; kind: RunKind } => ({
      text: t,
      kind: i % 2 === 0 ? "text" : OPERATOR.test(t) ? "operator" : "punctuation",
    }))
    .filter((r) => r.text !== "");
}

/** Reveal stages of a game question: 0 question, one per published rung (or GPT-2), then today. */
export function lastStage(q: ThenAndNowQuestion): number {
  return q.ladder ? q.ladder.rungs.length + 1 : 2;
}
