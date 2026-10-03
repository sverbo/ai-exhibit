/**
 * Splits the raw text an instruct model reads (its rendered chat template) into
 * role-coloured template tags and message contents, for ChatPlayground's
 * "what the model actually reads" view. Pure and tested.
 */
import type { ChatMessage } from "@ai-exhibit/ml-runtime/lm";

export type ChatRole = "system" | "user" | "assistant";

export interface RawSegment {
  kind: "tag" | "content" | "newline";
  role: ChatRole;
  text: string;
}

/** End-of-turn markers belong to the turn they close. */
const CLOSING = /^<\|(im_end|end|eot_id|end_of_turn)\|>$/;
const ROLE_IN_TAG = /(system|user|assistant)/;

function tagSegments(between: string, current: ChatRole, previous: ChatRole): RawSegment[] {
  const out: RawSegment[] = [];
  for (const piece of between.split(/(\n)/)) {
    if (piece === "") continue;
    if (piece === "\n") {
      out.push({ kind: "newline", role: current, text: "\n" });
      continue;
    }
    // A line may hold a closing marker followed by an opening one: split on tags.
    for (const part of piece.split(/(<\|[^|>]+\|>)/)) {
      if (!part) continue;
      const named = ROLE_IN_TAG.exec(part)?.[1] as ChatRole | undefined;
      const role = CLOSING.test(part) ? previous : (named ?? current);
      out.push({ kind: "tag", role, text: part });
    }
  }
  // A role name written after a generic tag ("<|im_start|>" + "system") reads as one chip.
  const merged: RawSegment[] = [];
  for (const seg of out) {
    const prev = merged.at(-1);
    const opensRole =
      prev?.kind === "tag" &&
      seg.kind === "tag" &&
      prev.text.endsWith("|>") &&
      !CLOSING.test(prev.text) &&
      !seg.text.startsWith("<|") &&
      ROLE_IN_TAG.test(seg.text);
    if (prev && opensRole) {
      prev.text += seg.text;
      prev.role = seg.role;
    } else merged.push({ ...seg });
  }
  return merged;
}

/**
 * Segments `raw` given the messages it was rendered from. Message contents are
 * located verbatim; everything around them is template markup. Returns a single
 * content segment when a message cannot be found (unexpected template).
 */
export function segmentChat(raw: string, messages: ChatMessage[]): RawSegment[] {
  const segments: RawSegment[] = [];
  let cursor = 0;
  let previous: ChatRole = "system";
  for (const m of messages) {
    const role = m.role as ChatRole;
    const idx = raw.indexOf(m.content, cursor);
    if (idx < 0) return [{ kind: "content", role: "user", text: raw }];
    segments.push(...tagSegments(raw.slice(cursor, idx), role, previous));
    segments.push({ kind: "content", role, text: m.content });
    cursor = idx + m.content.length;
    previous = role;
  }
  segments.push(...tagSegments(raw.slice(cursor), "assistant", previous));
  return segments;
}
