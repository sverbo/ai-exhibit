import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale, ResolvedEdition, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import {
  createInitialState,
  stageOwner,
  STAGE_ROLES,
  timerElapsed,
  type ClientRole,
  type SessionCommand,
  type SessionState,
} from "@ai-exhibit/session-protocol";
import { navCommand, type NavAction } from "../control/navigation.ts";
import {
  CONTENT_LOADED_AT,
  DEFAULT_EDITION,
  defaultTalkLocale,
  preferredTalkLocale,
  queryParam,
  rememberTalkLocale,
  requestedLocale,
  resolveTalk,
  sourceLookup,
} from "./presentation.ts";
import { usePrefersReducedMotion } from "./sceneContext.ts";
import { adoptTheme, chooseTheme, currentStampedTheme, useTheme } from "../theme.ts";
import { stepCount } from "@ai-exhibit/presentation-core";
import type { ModelSource } from "@ai-exhibit/scene-components";
import { contentDecision, contentHash, freezeCommands, setShell, shellState, themeDecision, type ShellState } from "./shell.ts";
import { useSession, type SessionView } from "./useSession.ts";
import { navigableScenes, personalSequence, talkCodes, timingScenes, type PersonalConfig, type PersonalSequence } from "./personal.ts";
import { readPersonalConfig, usePersonalConfig } from "./personalStore.ts";

/** Scene ID used while an edition has no scenes (the relay rejects empty IDs). */
export const EMPTY_SCENE = "__empty";

export interface TalkActions {
  nav: (action: NavAction) => void;
  goto: (sceneId: string, revealStep?: number) => void;
  toggleFallback: () => void;
  resetScene: () => void;
  toggleBlackout: () => void;
  toggleFreeze: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  togglePauseMotion: () => void;
  /** Light/dark for every screen of the talk (synced through the session). */
  toggleTheme: () => void;
  /** Language of the talk on every screen (synced through the session). */
  setLocale: (locale: Locale) => void;
  /** Model source of the language demos, for every screen (synced through the session). */
  setModelSource: (source: ModelSource) => void;
  /** Clears timer, votes, scene states, blackout and freeze. */
  restart: () => void;
}

export interface Talk {
  role: ClientRole;
  session: SessionView;
  state: SessionState | null;
  talk: ResolvedEdition;
  /**
   * What navigation walks: the personal sequence (docs/specs/2026-10-03-personal-config.md),
   * visible scenes in personal order plus the current scene if it is hidden.
   * `talk.scenes` stays the edition's default list.
   */
  scenes: SceneDefinition[];
  /** Current scene, undefined before the session is known or for an empty edition. */
  scene: SceneDefinition | undefined;
  /** Position of the current scene in `scenes`. */
  index: number;
  personal: PersonalTalk;
  /** The talk's language, from the session (every screen agrees). */
  locale: Locale;
  getSource: (id: string) => SourceRecord | undefined;
  /** This client may change the session (false while `outOfDate`). */
  controller: boolean;
  /**
   * This window runs the stage: it renders the current scene as its controller
   * (input, model calls, animations). At most one window does (stageOwner in
   * session-protocol: a presenter view first, then the oldest window); the
   * others render the scene as a display and mirror it.
   */
  ownsStage: boolean;
  /** Another window runs the stage (e.g. the projector while a presenter view is open). */
  linked: boolean;
  /**
   * The session is being driven with newer content than this window loaded
   * (scenes were added or renamed since): the window must be reloaded. It
   * neither navigates nor repairs the session meanwhile.
   */
  outOfDate: boolean;
  shell: ShellState;
  reducedMotion: boolean;
  actions: TalkActions;
}

export interface PersonalTalk {
  config: PersonalConfig;
  sequence: PersonalSequence;
  /** `scenes` with hidden ones counting zero seconds: what every time estimate uses. */
  timed: SceneDefinition[];
  /** The presenter's note for a scene, if any. */
  noteFor: (scene: SceneDefinition | undefined) => string | undefined;
  /** Persists a new config; every window of this browser profile follows. */
  set: (config: PersonalConfig) => void;
}

/** First scene of an edition in the personal order of this browser profile. */
function personalFirstSceneId(r: ResolvedEdition): string | undefined {
  const seq = personalSequence(r.scenes, readPersonalConfig(r.presentation), talkCodes(r.presentation));
  return (seq.visible[0] ?? r.scenes[0])?.id;
}

/**
 * Everything a view needs: the session, the resolved edition and current
 * scene, and controller actions. Controllers also apply `?edition=` and
 * `?scene=` once, and move the session onto a valid scene when needed.
 */
export function useTalk(role: ClientRole): Talk {
  const [params] = useState(() => ({
    edition: queryParam("edition"),
    lang: requestedLocale(),
    scene: queryParam("scene"),
    session: queryParam("s") ?? undefined,
  }));

  const initialState = useCallback(() => {
    const r = resolveTalk(params.edition);
    return createInitialState({
      presentationId: r.presentation.id,
      editionId: r.edition.id,
      locale: params.lang ?? preferredTalkLocale(r.presentation) ?? defaultTalkLocale(r.presentation),
      sceneId: (params.scene && r.scenes.some((s) => s.id === params.scene) ? params.scene : personalFirstSceneId(r)) ?? EMPTY_SCENE,
    });
  }, [params]);

  const session = useSession(role, {
    sessionId: params.session,
    initialState,
  });
  const { state, dispatch } = session;
  const editionId = state?.editionId ?? params.edition ?? DEFAULT_EDITION;
  const talk = useMemo(() => resolveTalk(editionId), [editionId]);
  const getSource = useMemo(() => sourceLookup(talk.presentation), [talk.presentation]);
  // The edition's default list decides validity and content versions; the
  // personal sequence decides navigation and timing.
  const scenes = talk.scenes;
  const editionIndex = state ? scenes.findIndex((s) => s.id === state.sceneId) : -1;
  const scene = editionIndex >= 0 ? scenes[editionIndex] : undefined;
  const [personalConfig, setPersonalConfig] = usePersonalConfig(talk.presentation);
  const knownCodes = useMemo(() => talkCodes(talk.presentation), [talk.presentation]);
  const sequence = useMemo(() => personalSequence(scenes, personalConfig, knownCodes), [scenes, personalConfig, knownCodes]);
  const navScenes = useMemo(() => navigableScenes(sequence, scene?.id), [sequence, scene?.id]);
  const index = scene ? navScenes.indexOf(scene) : -1;
  const personal = useMemo<PersonalTalk>(
    () => ({
      config: personalConfig,
      sequence,
      timed: timingScenes(navScenes, sequence.hiddenIds),
      noteFor: (s) => (s ? sequence.notes.get(s.id) : undefined),
      set: setPersonalConfig,
    }),
    [personalConfig, sequence, navScenes, setPersonalConfig],
  );
  const shellNow = shellState(state);

  // Content version: which window's scene list is the session following?
  const knowsEdition = !state || talk.edition.id === state.editionId;
  const hash = useMemo(() => contentHash(talk.edition.id, scenes.map((s) => ({ id: s.id, steps: stepCount(s) }))), [talk.edition.id, scenes]);
  const localContent = { editionId: state?.editionId ?? talk.edition.id, hash: knowsEdition ? hash : "unknown-edition", loadedAt: CONTENT_LOADED_AT };
  const content = state ? contentDecision(shellNow, localContent) : "ok";
  const outOfDate = content === "stale";
  const controller = session.canControl && (role === "presenter" || role === "solo") && !outOfDate;

  // One-time URL sync, then repair a session whose edition or scene no longer
  // exists. Only a window that is not out of date may repair: a stale window
  // that does not know the current scene must never pull everyone back.
  const synced = useRef({ edition: false, lang: false, scene: false });
  useEffect(() => {
    if (!controller || !state || session.status !== "open") return;
    if (!synced.current.edition) {
      synced.current.edition = true;
      if (params.edition) {
        const target = resolveTalk(params.edition);
        if (target.edition.id !== state.editionId) {
          dispatch({
            type: "setEdition",
            editionId: target.edition.id,
            locale: params.lang ?? state.locale,
            sceneId: personalFirstSceneId(target) ?? EMPTY_SCENE,
          });
          return;
        }
      }
    }
    if (!synced.current.lang) {
      synced.current.lang = true;
      if (params.lang && params.lang !== state.locale) {
        dispatch({ type: "setLocale", locale: params.lang });
        return;
      }
    }
    if (params.scene && !synced.current.scene) {
      synced.current.scene = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("scene");
      window.history.replaceState(null, "", url);
      if (scenes.some((s) => s.id === params.scene) && state.sceneId !== params.scene) {
        dispatch({ type: "goto", sceneId: params.scene, revealStep: 0 });
        return;
      }
    }
    if (!knowsEdition) {
      // This window's content is the newest the session has seen, and it has no such edition.
      dispatch({ type: "setEdition", editionId: talk.edition.id, locale: state.locale, sceneId: personalFirstSceneId(talk) ?? EMPTY_SCENE });
      return;
    }
    if (content === "publish") {
      dispatch(setShell(state, { content: localContent }));
      return;
    }
    if (scenes.length > 0 && editionIndex < 0) {
      dispatch({ type: "goto", sceneId: (sequence.visible[0] ?? scenes[0]!).id, revealStep: 0 });
    }
  }, [controller, state, session.status, scenes, editionIndex, sequence, params, dispatch, knowsEdition, content, hash, talk]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const sequenceRef = useRef(sequence);
  sequenceRef.current = sequence;
  const controllerRef = useRef(controller);
  controllerRef.current = controller;

  const actions = useMemo<TalkActions>(() => {
    const send = (...commands: (SessionCommand | null)[]) => {
      if (!controllerRef.current) return;
      for (const c of commands) if (c) dispatch(c);
    };
    const current = () => stateRef.current;
    const sceneId = () => {
      const s = current();
      return s && s.sceneId !== EMPTY_SCENE ? s.sceneId : null;
    };
    return {
      nav: (action) => {
        const s = current();
        if (s) send(navCommand(navigableScenes(sequenceRef.current, s.sceneId), { sceneId: s.sceneId, revealStep: s.revealStep }, action));
      },
      goto: (id, revealStep = 0) => send({ type: "goto", sceneId: id, revealStep }),
      toggleFallback: () => {
        const s = current();
        const id = sceneId();
        if (s && id) send({ type: "setFallback", sceneId: id, on: !s.fallback[id] });
      },
      resetScene: () => {
        const s = current();
        const id = sceneId();
        if (s && id) send({ type: "resetScene", sceneId: id }, s.revealStep > 0 ? { type: "goto", sceneId: id, revealStep: 0 } : null);
      },
      toggleBlackout: () => {
        const s = current();
        if (s) send({ type: "setBlackout", on: !s.blackout });
      },
      toggleFreeze: () => {
        const s = current();
        if (s) send(...freezeCommands(s, !s.frozen));
      },
      toggleTimer: () => {
        const s = current();
        if (s) send({ type: "timer", action: s.timer.startedAt === null ? "start" : "pause", now: Date.now() });
      },
      resetTimer: () => send({ type: "timer", action: "reset", now: Date.now() }),
      togglePauseMotion: () => {
        const s = current();
        if (s) send(setShell(s, { pauseMotion: !shellState(s).pauseMotion }));
      },
      toggleTheme: () => chooseTheme(currentStampedTheme().theme === "light" ? "dark" : "light"),
      setLocale: (locale) => {
        rememberTalkLocale(locale);
        send({ type: "setLocale", locale });
      },
      setModelSource: (source) => {
        const s = current();
        if (s) send(setShell(s, { modelSource: source }));
      },
      restart: () => send({ type: "resetSession" }),
    };
  }, [dispatch]);

  // Theme: the newest choice wins, whether it was made on this screen or another.
  const { stamped: localTheme } = useTheme();
  useEffect(() => {
    const decision = themeDecision(shellNow, localTheme);
    if (decision === "adopt") adoptTheme({ theme: shellNow.theme!, at: shellNow.themeAt! });
    else if (decision === "publish" && controller && session.status === "open" && stateRef.current) {
      dispatch(setShell(stateRef.current, { theme: localTheme.theme, themeAt: localTheme.at }));
    }
  }, [shellNow.theme, shellNow.themeAt, localTheme, controller, session.status, dispatch]);

  const prefersReduced = usePrefersReducedMotion();
  const shell = shellState(state);

  // Until the other windows are known, only a presenter view takes the stage:
  // a projector opened beside a running presenter must not compute even once.
  const owner = session.presenceReady ? stageOwner(session.clients) : null;
  const stageRole = STAGE_ROLES.includes(role);
  const ownsStage =
    controller && stageRole && (session.presenceReady ? owner === session.clientId : role === "presenter");
  const linked = session.presenceReady && owner !== null && owner !== session.clientId;

  return {
    role,
    session,
    state,
    talk,
    scenes: navScenes,
    scene,
    index,
    personal,
    locale: state?.locale ?? params.lang ?? preferredTalkLocale(talk.presentation) ?? defaultTalkLocale(talk.presentation),
    getSource,
    controller,
    ownsStage,
    linked,
    outOfDate,
    shell,
    reducedMotion: prefersReduced || Boolean(shell.pauseMotion),
    actions,
  };
}

/** Re-renders every `intervalMs` and returns the current epoch ms. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useElapsedMs(state: SessionState | null): number {
  const now = useNow(state?.timer.startedAt != null ? 500 : 5000);
  return state ? timerElapsed(state, now) : 0;
}
