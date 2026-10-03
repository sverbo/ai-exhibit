import {
  applyCommand,
  createInitialState,
  type SessionCommand,
  type SessionState,
} from "@ai-exhibit/session-protocol";
import type { SceneDefinition } from "@ai-exhibit/presentation-core";

export const LAB_SCENE_ID = "lab-scene";

/** A synthetic scene wrapping one component, for the lab. */
export function labScene(name: string, props: Record<string, unknown>, steps: number, base?: SceneDefinition): SceneDefinition {
  return {
    id: LAB_SCENE_ID,
    code: "lab0",
    chapter: base?.chapter ?? "00",
    number: base?.number ?? "lab",
    title: base?.title ?? { fr: name, en: name },
    objective: base?.objective ?? { fr: "Banc d'essai du composant.", en: "Component test bench." },
    takeaway: base?.takeaway ?? { fr: "", en: "" },
    visual: { layout: "component", component: name, props },
    steps,
    interaction: base?.interaction ?? "presenter",
    speakerNotes: base?.speakerNotes ?? { fr: "", en: "" },
    transitionIn: base?.transitionIn ?? { fr: "", en: "" },
    transitionOut: base?.transitionOut ?? { fr: "", en: "" },
    evidenceLevel: base?.evidenceLevel ?? "none",
    sourceIds: base?.sourceIds ?? [],
    runtimeClass: base?.runtimeClass ?? "B",
    artifacts: base?.artifacts ?? [],
    fallback: base?.fallback ?? { kind: "deterministic" },
    durationSec: base?.durationSec ?? 60,
    optional: false,
  };
}

export type LabAction =
  | { kind: "command"; command: SessionCommand }
  | { kind: "reset"; sceneId: string };

export interface LabLogEntry {
  at: number;
  command: SessionCommand;
}

export interface LabStore {
  state: SessionState;
  log: LabLogEntry[];
}

export function initialLab(sceneId: string): LabStore {
  return {
    state: createInitialState({ presentationId: "lab", editionId: "lab", locale: "fr", sceneId }),
    log: [],
  };
}

/** In-memory session shared by the lab's controller, display and preview. */
export function labReducer(store: LabStore, action: LabAction): LabStore {
  if (action.kind === "reset") return initialLab(action.sceneId);
  const next = applyCommand(store.state, action.command, "solo");
  return {
    state: next,
    log: [{ at: Date.now(), command: action.command }, ...store.log].slice(0, 40),
  };
}
