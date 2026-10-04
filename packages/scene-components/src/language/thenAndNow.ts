/** Pure helpers for ThenAndNow (tested). */
import {
  GAME_QUESTION_IDS,
  type GenerationSlot,
  type ThenAndNowQuestion,
  thenAndNowQuestions,
} from "@ai-exhibit/content/assets/then-and-now/questions.ts";
import type { CloudLadderEvent } from "@ai-exhibit/ml-runtime/lm";

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

/**
 * The live step after the recorded answers (ladder questions only): the
 * presenter types a question and open models of increasing size answer it
 * side by side. null for questions without a ladder.
 */
export function liveStage(q: ThenAndNowQuestion): number | null {
  return q.ladder ? lastStage(q) + 1 : null;
}

/** The last stage the controls and reveal steps can reach. */
export function maxStage(q: ThenAndNowQuestion): number {
  return liveStage(q) ?? lastStage(q);
}

/** Longest question the server accepts (MAX_INPUT_CHARS in packages/cloud-api). */
export const LIVE_MAX_CHARS = 300;

/** The question to send, or null when there is nothing to ask. */
export function liveQuestion(input: string): string | null {
  const q = input.trim().slice(0, LIVE_MAX_CHARS).trim();
  return q ? q : null;
}

export interface LiveAnswer {
  /** waiting: no word yet; thinking: the model reasons before answering. */
  state: "waiting" | "thinking" | "writing" | "done" | "error";
  text: string;
  provider?: string;
  /** "length": cut at the server's token limit. */
  finishReason?: string | null;
  error?: string;
}

export interface LiveLadder {
  question: string;
  running: boolean;
  answers: Record<string, LiveAnswer>;
  /** The server refused the whole request (budget, network...). */
  failure?: string;
}

export function startLive(question: string, rungIds: readonly string[]): LiveLadder {
  return {
    question,
    running: true,
    answers: Object.fromEntries(rungIds.map((id) => [id, { state: "waiting", text: "" } satisfies LiveAnswer])),
  };
}

/** Folds one event of the ladder stream into the shown answers. */
export function applyLadderEvent(live: LiveLadder, e: CloudLadderEvent): LiveLadder {
  if (e.type === "end") return { ...live, running: false };
  const prev = live.answers[e.rung];
  if (!prev) return live;
  let next: LiveAnswer = prev;
  switch (e.type) {
    case "start":
      next = { ...prev, provider: e.provider };
      break;
    case "reasoning":
      next = prev.state === "waiting" ? { ...prev, state: "thinking" } : prev;
      break;
    case "text":
      next = { ...prev, state: "writing", text: prev.text + e.text };
      break;
    case "done":
      next = { ...prev, state: "done", finishReason: e.finishReason };
      break;
    case "error":
      next = { ...prev, state: "error", error: e.message };
      break;
  }
  return { ...live, answers: { ...live.answers, [e.rung]: next } };
}

/** The whole request failed: every unfinished rung says so, and the run stops. */
export function failLive(live: LiveLadder, message: string): LiveLadder {
  const answers = Object.fromEntries(
    Object.entries(live.answers).map(([id, a]) => [
      id,
      a.state === "done" || a.state === "error" ? a : { ...a, state: "error" as const, error: message },
    ]),
  );
  return { ...live, running: false, failure: message, answers };
}
