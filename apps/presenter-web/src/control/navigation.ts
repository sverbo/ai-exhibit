import {
  nextPosition,
  nextScene,
  prevPosition,
  prevScene,
  sceneIndex,
  stepCount,
  type Position,
  type SceneDefinition,
} from "@ai-exhibit/presentation-core";
import type { SessionCommand } from "@ai-exhibit/session-protocol";

/** sceneEnd/sceneStart jump to the last or first step of the current scene, never changing scene. */
export type NavAction = "next" | "prev" | "nextScene" | "prevScene" | "sceneEnd" | "sceneStart";

/**
 * Resolves a navigation action into an explicit `goto`, or null when there is
 * nowhere to go. A position this window does not know (the session follows
 * newer content, or another edition) is left alone: jumping to the first scene
 * from there is how a stale window used to pull the whole talk back to 1.1.
 */
export function navCommand(
  scenes: SceneDefinition[],
  pos: Position,
  action: NavAction,
): Extract<SessionCommand, { type: "goto" }> | null {
  if (scenes.length === 0) return null;
  let target: Position;
  if (sceneIndex(scenes, pos.sceneId) < 0) return null;
  if (action === "next") target = nextPosition(scenes, pos);
  else if (action === "prev") target = prevPosition(scenes, pos);
  else if (action === "nextScene") target = nextScene(scenes, pos);
  else if (action === "prevScene") target = prevScene(scenes, pos);
  else {
    const scene = scenes[sceneIndex(scenes, pos.sceneId)]!;
    const step = action === "sceneEnd" ? stepCount(scene) : 0;
    target = { sceneId: pos.sceneId, revealStep: step };
  }
  if (target.sceneId === pos.sceneId && target.revealStep === pos.revealStep) return null;
  return { type: "goto", sceneId: target.sceneId, revealStep: target.revealStep };
}
