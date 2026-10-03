import type { ComponentType } from "react";
import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import type { SessionCommand } from "@ai-exhibit/session-protocol";

/**
 * How a scene component is rendered:
 * - "controller": presenter view or solo window. Accepts input, runs heavy
 *   compute (models, training) and publishes small results via `setState`.
 * - "display": projector follower. Renders only from `state`; never runs
 *   models and never edits state.
 * - "preview": next-scene thumbnail. Static, cheap, no compute, no animation.
 */
export type SceneRole = "controller" | "display" | "preview";

/**
 * Where language demos get their model, chosen by the presenter for the whole talk:
 * - "hf": cloud models through the server's /api endpoints (local runtime or
 *   Vercel functions, Hugging Face router; needs HF_TOKEN on the server),
 * - "simulation": recorded real outputs only; preset examples, no free input.
 * Components fall back from hf to simulation on their own and say why. No
 * model ever runs or downloads in the browser.
 */
export type ModelSource = "hf" | "simulation";
export const MODEL_SOURCES: readonly ModelSource[] = ["hf", "simulation"];

export interface SceneContext<S = unknown> {
  scene: SceneDefinition;
  locale: Locale;
  /** How many reveal steps are currently shown (0 = initial). */
  revealStep: number;
  role: SceneRole;
  /** "fallback" means: use recorded/deterministic data, touch no model or network. */
  mode: "live" | "fallback";
  /** Shared serializable scene state; undefined until a controller sets it. */
  state: S | undefined;
  /** No-op unless role === "controller". Keep payloads small (< ~50 KB). */
  setState: (next: S) => void;
  /** Resolves source IDs for evidence badges and citations. */
  getSource: (id: string) => SourceRecord | undefined;
  /** True when the user prefers reduced motion or the presenter paused animations. */
  reducedMotion: boolean;
  /** Sends a session command (navigation, blackout...). No-op unless controller. */
  sendCommand: (command: SessionCommand) => void;
  /** Audience glossary address phones can reach, e.g. "http://192.168.1.20:5173/glossary"; null: use this page's origin. */
  glossaryUrl: string | null;
  /** The presenter's model source for language demos; undefined means "simulation". */
  modelSource?: ModelSource;
}

export interface SceneComponentProps<P = Record<string, unknown>, S = unknown> {
  props: P;
  ctx: SceneContext<S>;
}

export type SceneComponent<P = any, S = any> = ComponentType<SceneComponentProps<P, S>>;

const registry = new Map<string, SceneComponent>();

/** Registered names are referenced from scene data: `{ layout: "component", component: name }`. */
export function registerSceneComponent(name: string, component: SceneComponent): void {
  // Vite HMR re-runs register modules; replacing is correct there, a bug elsewhere.
  if (registry.has(name) && !import.meta.hot) {
    throw new Error(`Scene component "${name}" registered twice`);
  }
  registry.set(name, component);
}

export function getSceneComponent(name: string): SceneComponent | undefined {
  return registry.get(name);
}

export function registeredSceneComponents(): string[] {
  return [...registry.keys()].sort();
}
