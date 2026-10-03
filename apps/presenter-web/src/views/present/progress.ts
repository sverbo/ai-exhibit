import type { ChapterDefinition, SceneDefinition } from "@ai-exhibit/presentation-core";

export interface ProgressPart {
  id: string;
  /** Share of the talk's planned time, 0..1. */
  share: number;
}

export interface Progress {
  parts: ProgressPart[];
  /** Where the talk stands, 0..1 of the planned time. */
  at: number;
}

/**
 * Where the talk stands, for the projector's progress rail: one segment per
 * part (chapters except the introduction "00"), sized by planned time, and a
 * cursor at the start of the current scene: it moves once per slide, never
 * per click. `timed` is the personal sequence with hidden scenes counting zero
 * seconds.
 */
export function talkProgress(chapters: ChapterDefinition[], timed: SceneDefinition[], current: SceneDefinition | undefined): Progress {
  const partIds = chapters.filter((c) => c.id !== "00").map((c) => c.id as string);
  const inParts = timed.filter((s) => partIds.includes(s.chapter));
  const total = inParts.reduce((t, s) => t + s.durationSec, 0);
  if (total <= 0) return { parts: [], at: 0 };
  const parts = partIds
    .map((id) => ({ id, share: inParts.filter((s) => s.chapter === id).reduce((t, s) => t + s.durationSec, 0) / total }))
    .filter((p) => p.share > 0);
  if (!current || !partIds.includes(current.chapter)) return { parts, at: 0 };
  let before = 0;
  for (const s of inParts) {
    if (s.id === current.id) break;
    before += s.durationSec;
  }
  return { parts, at: Math.min(1, before / total) };
}
