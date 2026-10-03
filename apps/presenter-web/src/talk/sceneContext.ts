import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import type { ModelSource, SceneContext, SceneRole } from "@ai-exhibit/scene-components";
import type { InteractionState, SessionCommand, SessionState } from "@ai-exhibit/session-protocol";

const noop = () => {};

export interface SceneContextInput {
  scene: SceneDefinition;
  role: SceneRole;
  locale: Locale;
  revealStep: number;
  fallback: boolean;
  sceneState: unknown;
  interaction: InteractionState | null;
  /** Present only for controllers allowed to change the session. */
  dispatch: ((command: SessionCommand) => void) | null;
  getSource: (id: string) => SourceRecord | undefined;
  joinUrl: string | null;
  reducedMotion: boolean;
  /** Presenter's model source for language demos (shell setting). */
  modelSource?: ModelSource;
}

/** The session slices one scene depends on. */
export function sceneSlice(state: SessionState | null, sceneId: string) {
  return {
    fallback: Boolean(state?.fallback[sceneId]),
    sceneState: state?.sceneStates[sceneId],
    interaction: state?.interaction ?? null,
  };
}

/** Builds a scene's context for one role. Pure: same inputs, same context. */
export function buildSceneContext(input: SceneContextInput): SceneContext {
  const { scene, role, dispatch } = input;
  const controls = role === "controller" && dispatch !== null;
  return {
    scene,
    locale: input.locale,
    revealStep: input.revealStep,
    role,
    mode: input.fallback ? "fallback" : "live",
    state: input.sceneState,
    setState: controls ? (next) => dispatch({ type: "setSceneState", sceneId: scene.id, state: next }) : noop,
    getSource: input.getSource,
    reducedMotion: input.reducedMotion,
    interaction: input.interaction,
    sendCommand: controls ? dispatch : noop,
    joinUrl: input.joinUrl,
    modelSource: input.modelSource ?? "simulation",
  };
}

/**
 * Memoized scene context. Callbacks stay stable across renders so scene
 * components can list them in effect dependencies safely.
 */
export function useSceneContext(input: SceneContextInput): SceneContext {
  const dispatchRef = useRef(input.dispatch);
  dispatchRef.current = input.dispatch;
  const canDispatch = input.dispatch !== null;
  const { scene, role, locale, revealStep, fallback, sceneState, interaction, getSource, joinUrl, reducedMotion, modelSource } = input;
  return useMemo(
    () =>
      buildSceneContext({
        scene,
        role,
        locale,
        revealStep,
        fallback,
        sceneState,
        interaction,
        dispatch: canDispatch ? (c) => dispatchRef.current?.(c) : null,
        getSource,
        joinUrl,
        reducedMotion,
        modelSource,
      }),
    [scene, role, locale, revealStep, fallback, sceneState, interaction, canDispatch, getSource, joinUrl, reducedMotion, modelSource],
  );
}

/** `prefers-reduced-motion`, live. */
export function usePrefersReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
