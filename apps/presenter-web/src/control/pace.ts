import type { ChapterId, SceneDefinition } from "@ai-exhibit/presentation-core";

export type PaceStatus = "ahead" | "on-track" | "behind";

export interface ChapterPace {
  id: ChapterId;
  plannedStartSec: number;
  plannedSec: number;
  sceneCount: number;
  status: "done" | "current" | "upcoming";
}

export interface Pace {
  elapsedSec: number;
  plannedTotalSec: number;
  /** Planned time at which the current scene starts / ends. */
  plannedSceneStartSec: number;
  plannedSceneEndSec: number;
  /**
   * Seconds behind schedule (positive) or ahead (negative). Zero while the clock
   * is inside the current scene's planned window.
   */
  deltaSec: number;
  status: PaceStatus;
  /** Planned total shifted by the current delta. */
  projectedTotalSec: number;
  /** Where the projected finish falls against the edition target range. */
  target: "under" | "within" | "over";
  chapters: ChapterPace[];
}

/** Within this many seconds of schedule counts as on track. */
export function paceTolerance(plannedTotalSec: number): number {
  return Math.max(30, Math.round(plannedTotalSec * 0.02));
}

export function computePace(
  scenes: SceneDefinition[],
  currentSceneId: string,
  elapsedMs: number,
  targetMinutes: [number, number],
): Pace {
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  const index = Math.max(0, scenes.findIndex((s) => s.id === currentSceneId));
  let plannedTotalSec = 0;
  let plannedSceneStartSec = 0;
  let plannedSceneEndSec = 0;
  const chapters: ChapterPace[] = [];
  let currentChapter = -1;
  scenes.forEach((scene, i) => {
    let chapter = chapters[chapters.length - 1];
    if (!chapter || chapter.id !== scene.chapter) {
      chapter = { id: scene.chapter, plannedStartSec: plannedTotalSec, plannedSec: 0, sceneCount: 0, status: "upcoming" };
      chapters.push(chapter);
    }
    if (i === index) {
      plannedSceneStartSec = plannedTotalSec;
      currentChapter = chapters.length - 1;
    }
    chapter.plannedSec += scene.durationSec;
    chapter.sceneCount += 1;
    plannedTotalSec += scene.durationSec;
    if (i === index) plannedSceneEndSec = plannedTotalSec;
  });
  chapters.forEach((c, i) => {
    c.status = i < currentChapter ? "done" : i === currentChapter ? "current" : "upcoming";
  });

  let deltaSec = 0;
  if (elapsedSec < plannedSceneStartSec) deltaSec = elapsedSec - plannedSceneStartSec;
  else if (elapsedSec > plannedSceneEndSec) deltaSec = elapsedSec - plannedSceneEndSec;
  const tolerance = paceTolerance(plannedTotalSec);
  const status: PaceStatus = deltaSec > tolerance ? "behind" : deltaSec < -tolerance ? "ahead" : "on-track";
  const projectedTotalSec = plannedTotalSec + deltaSec;
  const [minMin, maxMin] = targetMinutes;
  const target = projectedTotalSec < minMin * 60 ? "under" : projectedTotalSec > maxMin * 60 ? "over" : "within";
  return {
    elapsedSec,
    plannedTotalSec,
    plannedSceneStartSec,
    plannedSceneEndSec,
    deltaSec,
    status,
    projectedTotalSec,
    target,
    chapters,
  };
}

/** "4:05", "1:02:03". Negative values get a minus sign. */
export function formatDuration(totalSec: number): string {
  const sign = totalSec < 0 ? "-" : "";
  const s = Math.floor(Math.abs(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${sign}${h}:${String(m).padStart(2, "0")}:${sec}` : `${sign}${m}:${sec}`;
}

/** "+1:20" behind, "-0:45" ahead, "0:00" on time. */
export function formatDelta(deltaSec: number): string {
  if (Math.abs(deltaSec) < 1) return "0:00";
  return deltaSec > 0 ? `+${formatDuration(deltaSec)}` : formatDuration(deltaSec);
}

/** Planned minutes as a short label, e.g. "82 min". */
export function formatMinutes(totalSec: number): string {
  return `${Math.round(totalSec / 60)} min`;
}
