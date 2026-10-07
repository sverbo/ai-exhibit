import type { L10n } from "../../learning/shared/ui.tsx";
import { SEARCH_TEXT } from "../toolcall/search.ts";

/**
 * What the app really sends the model at each message, step by step, for the
 * ContextStack scene ("No memory", before the tool call demo). Illustrative
 * conversation; the mechanics follow the sources cited by the scene
 * (stateless API, context window, tool use system prompt, app system prompts,
 * memory feature). The last message is the question of the next slide.
 */

export type BlockKind = "system" | "tools" | "note" | "summary" | "you" | "model" | "more" | "call";

export interface StackBlock {
  /** Stable across steps, so a block that stays keeps its place on screen. */
  id: string;
  kind: BlockKind;
  /** Who wrote it, or what it is (none for the "more messages" filler). */
  tag?: L10n;
  text: L10n;
  /** Sent to the model, never shown to the person chatting. */
  hidden?: boolean;
  /** The message just sent. */
  latest?: boolean;
  /** Pushed out of a full window. */
  dropped?: boolean;
}

export const LAST_STEP = 5;

const TAG = {
  you: { en: "You" },
  model: { en: "Model" },
  system: { en: "System prompt" },
  tools: { en: "Tools" },
  note: { en: "Memory" },
  summary: { en: "Summary" },
  call: { en: "Model" },
} satisfies Record<Exclude<BlockKind, "more">, L10n>;

const B = {
  you1: { id: "you1", kind: "you", tag: TAG.you, text: { en: "I'm off to Barcelona next week!" } },
  model1: { id: "model1", kind: "model", tag: TAG.model, text: { en: "Lovely! What would you like to do there?" } },
  you2: { id: "you2", kind: "you", tag: TAG.you, text: { en: "See a football match." } },
  model2: { id: "model2", kind: "model", tag: TAG.model, text: { en: "Then try the Camp Nou: book early." } },
  // Stands for a long conversation: it takes all the room left in the window.
  more: { id: "more", kind: "more", text: { en: "... and many more messages ..." } },
  you3: { id: "you3", kind: "you", tag: TAG.you, text: SEARCH_TEXT.question },
  summary: {
    id: "summary",
    kind: "summary",
    tag: TAG.summary,
    text: { en: "Earlier: a trip to Barcelona, wants to see a match." },
  },
  note: { id: "note", kind: "note", tag: TAG.note, text: { en: "Saved note from another chat: a Barça fan." } },
  system: {
    id: "system",
    kind: "system",
    tag: TAG.system,
    text: { en: "From the company: its role, today's date, what to avoid." },
    hidden: true,
  },
  tools: {
    id: "tools",
    kind: "tools",
    tag: TAG.tools,
    text: { en: "Every tool it may use, and how to call it: web_search, calendar, email..." },
    hidden: true,
  },
  // Rendered as the tool call JSON of the next slide, with this query.
  call: { id: "call", kind: "call", tag: TAG.call, text: SEARCH_TEXT.query },
} satisfies Record<string, StackBlock>;

/** The stack inside the context window at a reveal step (clamped to 0..LAST_STEP). */
export function stackAt(step: number): StackBlock[] {
  const s = Math.max(0, Math.min(LAST_STEP, Math.floor(step)));
  const latest = (b: StackBlock): StackBlock => ({ ...b, latest: true });
  switch (s) {
    case 0:
      return [latest(B.you1)];
    case 1:
      return [B.you1, B.model1, latest(B.you2)];
    case 2:
      return [{ ...B.you1, dropped: true }, B.model1, B.you2, B.more, B.model2, latest(B.you3)];
    case 3:
      return [B.note, B.summary, latest(B.you3)];
    case 4:
      return [B.system, B.tools, B.note, B.summary, latest(B.you3)];
    default:
      return [B.system, B.tools, B.note, B.summary, B.you3, B.call];
  }
}

/**
 * How full the context window looks at each step, in percent (a drawing, not a
 * measurement): it fills with each message, is full at step 2, then the
 * summary frees room and the hidden text takes some back.
 */
export const WINDOW_FILL = [12, 40, 100, 52, 76, 84];
export const FULL_STEP = 2;

/** The line under the heading, one per step. */
export const STEP_SUB: L10n[] = [
  { en: "It does not learn from your chat: its numbers do not change." },
  { en: "At every message, the app sends the whole conversation again, from the start." },
  { en: "When the window is full, the beginning falls out." },
  { en: "The workarounds: summarize the old part, add saved notes when needed." },
  { en: "And with your message, text you never see." },
  { en: "A tool call is just more text, written into this same stack." },
];
