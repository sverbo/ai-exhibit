import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import type { ModelSource, SceneContext, SceneRole } from "@ai-exhibit/scene-components";
import type { SceneRequest, SessionCommand, SessionState } from "@ai-exhibit/session-protocol";

const noop = () => {};

export interface SceneContextInput {
  scene: SceneDefinition;
  role: SceneRole;
  locale: Locale;
  revealStep: number;
  fallback: boolean;
  sceneState: unknown;
  /** Latest request sent to this scene by another window. */
  request?: SceneRequest | null;
  /** Present only for controllers allowed to change the session. */
  dispatch: ((command: SessionCommand) => void) | null;
  getSource: (id: string) => SourceRecord | undefined;
  glossaryUrl: string | null;
  reducedMotion: boolean;
  /** Presenter's model source for language demos (shell setting). */
  modelSource?: ModelSource;
  /** The stage the audience sees and hears (see SceneContext.audienceScreen). */
  audienceScreen?: boolean;
  /**
   * A controller window that does not run the stage: its scene renders as a
   * display, but its user's actions go to the stage owner as requests.
   */
  requestDispatch?: ((command: SessionCommand) => void) | null;
  /** Sender id for requests (this window's session client id). */
  requesterId?: string | null;
}

/** The session slices one scene depends on. */
export function sceneSlice(state: SessionState | null, sceneId: string) {
  return {
    fallback: Boolean(state?.fallback[sceneId]),
    sceneState: state?.sceneStates[sceneId],
    request: state?.requests?.[sceneId] ?? null,
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
    sendCommand: controls ? dispatch : noop,
    glossaryUrl: input.glossaryUrl,
    modelSource: input.modelSource ?? "simulation",
    audienceScreen: Boolean(input.audienceScreen) && role !== "preview",
    interactive: controls || (role === "display" && Boolean(input.requestDispatch)),
    request: input.request ?? null,
    sendRequest: role === "display" && input.requestDispatch ? requestSender(scene.id, input.requestDispatch, input.requesterId ?? null) : noop,
  };
}

let requestCounter = 0;

/** Sends a user action to the stage owner as a `sceneRequest` with a unique id. */
function requestSender(sceneId: string, dispatch: (c: SessionCommand) => void, sender: string | null) {
  const prefix = sender ?? Math.random().toString(36).slice(2);
  return (payload: unknown) => {
    requestCounter += 1;
    dispatch({ type: "sceneRequest", sceneId, request: { id: `${prefix}:${Date.now()}:${requestCounter}`, payload } });
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
  const requestRef = useRef(input.requestDispatch ?? null);
  requestRef.current = input.requestDispatch ?? null;
  const canRequest = Boolean(input.requestDispatch);
  const { scene, role, locale, revealStep, fallback, sceneState, request, requesterId, getSource, glossaryUrl, reducedMotion, modelSource, audienceScreen } = input;
  return useMemo(
    () =>
      buildSceneContext({
        scene,
        role,
        locale,
        revealStep,
        fallback,
        sceneState,
        dispatch: canDispatch ? (c) => dispatchRef.current?.(c) : null,
        getSource,
        glossaryUrl,
        reducedMotion,
        modelSource,
        audienceScreen,
        request,
        requestDispatch: canRequest ? (c) => requestRef.current?.(c) : null,
        requesterId,
      }),
    [scene, role, locale, revealStep, fallback, sceneState, canDispatch, getSource, glossaryUrl, reducedMotion, modelSource, audienceScreen, request, canRequest, requesterId],
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
