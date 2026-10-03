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
 * part (chapters except the introduction "00"), sized by its number of
 * slides, and a cursor that moves one slide at a time, never per click.
 * `timed` is the personal sequence; hidden scenes (zero seconds) do not count.
 */
export function talkProgress(chapters: ChapterDefinition[], timed: SceneDefinition[], current: SceneDefinition | undefined): Progress {
  const partIds = chapters.filter((c) => c.id !== "00").map((c) => c.id as string);
  const inParts = timed.filter((s) => partIds.includes(s.chapter) && s.durationSec > 0);
  const total = inParts.length;
  if (total === 0) return { parts: [], at: 0 };
  const parts = partIds
    .map((id) => ({ id, share: inParts.filter((s) => s.chapter === id).length / total }))
    .filter((p) => p.share > 0);
  if (!current || !partIds.includes(current.chapter)) return { parts, at: 0 };
  const i = timed.filter((s) => partIds.includes(s.chapter)).findIndex((s) => s.id === current.id);
  const before = timed.filter((s) => partIds.includes(s.chapter)).slice(0, Math.max(0, i)).filter((s) => s.durationSec > 0).length;
  return { parts, at: Math.min(1, before / total) };
}
