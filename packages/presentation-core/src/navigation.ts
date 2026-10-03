import { stepCount } from "./edition.ts";
import type { SceneDefinition } from "./types.ts";

/** A position in the talk: a scene and how many of its reveal steps are shown. */
export interface Position {
  sceneId: string;
  revealStep: number;
}

export function firstPosition(scenes: SceneDefinition[]): Position {
  const first = scenes[0];
  if (!first) throw new Error("Edition has no scenes");
  return { sceneId: first.id, revealStep: 0 };
}

export function sceneIndex(scenes: SceneDefinition[], sceneId: string): number {
  return scenes.findIndex((s) => s.id === sceneId);
}

/** Advance one reveal step, or to the next scene when all steps are shown. */
export function nextPosition(scenes: SceneDefinition[], pos: Position): Position {
  const i = sceneIndex(scenes, pos.sceneId);
  const scene = scenes[i];
  if (!scene) return firstPosition(scenes);
  if (pos.revealStep < stepCount(scene)) {
    return { sceneId: scene.id, revealStep: pos.revealStep + 1 };
  }
  const next = scenes[i + 1];
  return next ? { sceneId: next.id, revealStep: 0 } : pos;
}

/** Undo one reveal step, or go to the previous scene fully revealed. */
export function prevPosition(scenes: SceneDefinition[], pos: Position): Position {
  const i = sceneIndex(scenes, pos.sceneId);
  const scene = scenes[i];
  if (!scene) return firstPosition(scenes);
  if (pos.revealStep > 0) return { sceneId: scene.id, revealStep: pos.revealStep - 1 };
  const prev = scenes[i - 1];
  return prev ? { sceneId: prev.id, revealStep: stepCount(prev) } : pos;
}

/** Jump straight to the next/previous scene, ignoring reveal steps. */
export function nextScene(scenes: SceneDefinition[], pos: Position): Position {
  const next = scenes[sceneIndex(scenes, pos.sceneId) + 1];
  return next ? { sceneId: next.id, revealStep: 0 } : pos;
}

export function prevScene(scenes: SceneDefinition[], pos: Position): Position {
  const prev = scenes[sceneIndex(scenes, pos.sceneId) - 1];
  return prev ? { sceneId: prev.id, revealStep: 0 } : pos;
}
