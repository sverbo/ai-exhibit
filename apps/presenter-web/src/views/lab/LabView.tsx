import { useEffect, useMemo, useReducer, useState } from "react";
import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import {
  registeredSceneComponents,
  SceneRenderer,
  Stage,
  type SceneRole,
} from "@ai-exhibit/scene-components";
import { stepCount } from "@ai-exhibit/presentation-core";
import type { SessionCommand, SessionState } from "@ai-exhibit/session-protocol";
import { useUi } from "../../i18n.ts";
import { demoPresentation } from "../../talk/demo.ts";
import { presentations } from "../../talk/presentation.ts";
import { useDefaultModelSource } from "../../talk/modelSourceDefault.ts";
import { sceneSlice, usePrefersReducedMotion, useSceneContext } from "../../talk/sceneContext.ts";
import { useRuntime, glossaryUrlFor } from "../../talk/runtime.ts";
import chrome from "../../ui/chrome.module.css";
import { ThemeToggle } from "../../ui/ThemeToggle.tsx";
import { initialLab, LAB_SCENE_ID, labReducer, labScene } from "./labStore.ts";
import styles from "./LabView.module.css";

type Selection = { kind: "component"; name: string } | { kind: "scene"; id: string };

function readSelection(): { selection: Selection | null; props: string; step: number; fallback: boolean; locale: Locale } {
  const q = new URLSearchParams(window.location.search);
  const c = q.get("c");
  const scene = q.get("scene");
  return {
    selection: c ? { kind: "component", name: c } : scene ? { kind: "scene", id: scene } : null,
    props: q.get("props") ?? "",
    step: Number(q.get("step") ?? 0) || 0,
    fallback: q.get("fallback") === "1",
    locale: q.get("locale") === "fr" ? "fr" : "en",
  };
}

const allScenes = presentations.flatMap((p) => p.scenes);
const sourceMap = new Map<string, SourceRecord>(presentations.flatMap((p) => p.sources.map((s) => [s.id, s] as const)));
const getSource = (id: string) => sourceMap.get(id);

/** Content scenes using each component name. */
function scenesUsing(name: string): SceneDefinition[] {
  return allScenes.filter((s) => s.visual.layout === "component" && s.visual.component === name);
}

function prettyProps(props: unknown): string {
  return props && Object.keys(props as object).length ? JSON.stringify(props, null, 2) : "{}";
}

export default function LabView() {
  const { t, locale: uiLocale } = useUi();
  const initial = useMemo(readSelection, []);
  const registered = useMemo(() => registeredSceneComponents(), []);
  const referenced = useMemo(
    () =>
      [...new Set([...allScenes.flatMap((s) => (s.visual.layout === "component" ? [s.visual.component] : []))])]
        .filter((n) => !registered.includes(n) && !n.startsWith("Demo"))
        .sort(),
    [registered],
  );
  const layoutScenes = demoPresentation.scenes.filter((s) => s.visual.layout !== "component");

  const [selection, setSelection] = useState<Selection | null>(
    initial.selection ?? (registered[0] ? { kind: "component", name: registered[0] } : null),
  );
  const [propsText, setPropsText] = useState(initial.props ? prettyJson(initial.props) : "{}");
  const [props, setProps] = useState<Record<string, unknown>>(() => parseProps(initial.props) ?? {});
  const [propsError, setPropsError] = useState(false);
  const [steps, setSteps] = useState(3);
  const [baseScene, setBaseScene] = useState<SceneDefinition | undefined>();
  const [locale, setLocale] = useState<Locale>(initial.locale);
  const [pauseMotion, setPauseMotion] = useState(false);
  const [store, send] = useReducer(labReducer, LAB_SCENE_ID, initialLab);
  const prefersReduced = usePrefersReducedMotion();
  const { network } = useRuntime(15000);
  const glossaryUrl = glossaryUrlFor(network) ?? `${window.location.origin}/glossary`;

  // Initial step, fallback and example props from the URL.
  useEffect(() => {
    if (initial.selection?.kind === "component") {
      const example = scenesUsing(initial.selection.name)[0];
      if (example) {
        setBaseScene(example);
        setSteps(stepCount(example));
        if (!initial.props && example.visual.layout === "component") {
          setProps(example.visual.props ?? {});
          setPropsText(prettyProps(example.visual.props ?? {}));
        }
      }
    }
    if (initial.step) send({ kind: "command", command: { type: "goto", sceneId: LAB_SCENE_ID, revealStep: initial.step } });
    if (initial.fallback) send({ kind: "command", command: { type: "setFallback", sceneId: LAB_SCENE_ID, on: true } });
  }, [initial]);

  const scene: SceneDefinition | null = useMemo(() => {
    if (!selection) return null;
    if (selection.kind === "scene") {
      const s = allScenes.find((x) => x.id === selection.id);
      return s ? { ...s, id: LAB_SCENE_ID } : null;
    }
    return labScene(selection.name, props, steps, baseScene);
  }, [selection, props, steps, baseScene]);

  // Keep the URL shareable.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = "";
    if (selection?.kind === "component") {
      url.searchParams.set("c", selection.name);
      if (Object.keys(props).length) url.searchParams.set("props", JSON.stringify(props));
    } else if (selection?.kind === "scene") {
      url.searchParams.set("scene", selection.id);
    }
    if (store.state.revealStep) url.searchParams.set("step", String(store.state.revealStep));
    if (store.state.fallback[LAB_SCENE_ID]) url.searchParams.set("fallback", "1");
    if (locale === "fr") url.searchParams.set("locale", "fr");
    window.history.replaceState(null, "", url);
  }, [selection, props, store.state.revealStep, store.state.fallback, locale]);

  const select = (next: Selection) => {
    setSelection(next);
    send({ kind: "reset", sceneId: LAB_SCENE_ID });
    if (next.kind === "component") {
      const example = scenesUsing(next.name)[0];
      applyBase(example);
      if (!example) {
        setProps({});
        setPropsText("{}");
        setSteps(3);
      }
    }
  };

  const applyBase = (base: SceneDefinition | undefined) => {
    setBaseScene(base);
    if (base && base.visual.layout === "component") {
      const p = base.visual.props ?? {};
      setProps(p);
      setPropsText(prettyProps(p));
      setSteps(stepCount(base));
    }
  };

  const applyProps = () => {
    const parsed = parseProps(propsText);
    if (!parsed) {
      setPropsError(true);
      return;
    }
    setPropsError(false);
    setProps(parsed);
  };

  const dispatch = (command: SessionCommand) => send({ kind: "command", command });
  const state = store.state;
  const maxStep = scene ? stepCount(scene) : 0;
  const fallbackOn = Boolean(state.fallback[LAB_SCENE_ID]);
  const reducedMotion = prefersReduced || pauseMotion;
  const name = selection?.kind === "component" ? selection.name : null;
  const examples = name ? scenesUsing(name) : [];

  return (
    <div className={styles.lab}>
      <aside className={styles.sidebar}>
        <h1 className={styles.brand}>{t("viewLab")}</h1>
        <Section title={`${t("labComponents")} (${registered.length})`}>
          {registered.length === 0 ? <p className={styles.none}>0</p> : null}
          {registered.map((n) => (
            <Item key={n} active={selection?.kind === "component" && selection.name === n} onClick={() => select({ kind: "component", name: n })}>
              {n}
            </Item>
          ))}
        </Section>
        <Section title={`${t("labNotBuilt")} (${referenced.length})`}>
          {referenced.map((n) => (
            <Item key={n} dim active={selection?.kind === "component" && selection.name === n} onClick={() => select({ kind: "component", name: n })}>
              {n}
            </Item>
          ))}
        </Section>
        <Section title={t("labLayouts")}>
          {layoutScenes.map((s) => (
            <Item key={s.id} active={selection?.kind === "scene" && selection.id === s.id} onClick={() => select({ kind: "scene", id: s.id })}>
              {s.visual.layout}
            </Item>
          ))}
        </Section>
      </aside>

      <main className={styles.main}>
        {!scene ? (
          <p className={styles.pick}>{t("labPickOne")}</p>
        ) : (
          <>
            <div className={styles.toolbar}>
              <h2 className={styles.name}>{name ?? scene.title[locale]}</h2>
              <div className={styles.group}>
                <span className={chrome.label}>{t("step")}</span>
                <button type="button" className={chrome.btn} disabled={state.revealStep <= 0}
                  onClick={() => dispatch({ type: "goto", sceneId: LAB_SCENE_ID, revealStep: state.revealStep - 1 })}>
                  −
                </button>
                <span className={`${chrome.mono} ${styles.step}`}>
                  {state.revealStep} / {maxStep}
                </span>
                <button type="button" className={chrome.btn} disabled={state.revealStep >= maxStep}
                  onClick={() => dispatch({ type: "goto", sceneId: LAB_SCENE_ID, revealStep: state.revealStep + 1 })}>
                  +
                </button>
                {selection?.kind === "component" ? (
                  <label className={styles.inline}>
                    <span className={chrome.label}>{t("labSteps")}</span>
                    <input className={styles.num} type="number" min={0} max={50} value={steps}
                      onChange={(e) => setSteps(Math.max(0, Number(e.target.value) || 0))} />
                  </label>
                ) : null}
              </div>
              <div className={styles.group}>
                <button type="button" className={`${chrome.btn} ${fallbackOn ? chrome.on : ""}`} aria-pressed={fallbackOn}
                  onClick={() => dispatch({ type: "setFallback", sceneId: LAB_SCENE_ID, on: !fallbackOn })}>
                  {t("fallback")}
                </button>
                <button type="button" className={`${chrome.btn} ${pauseMotion ? chrome.on : ""}`} aria-pressed={pauseMotion}
                  onClick={() => setPauseMotion((p) => !p)}>
                  {t("pauseMotion")}
                </button>
                <button type="button" className={chrome.btn} onClick={() => send({ kind: "reset", sceneId: LAB_SCENE_ID })}>
                  {t("labResetState")}
                </button>
                <select className={chrome.select} aria-label={t("labLocale")} value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                </select>
                <ThemeToggle hint={false} />
              </div>
            </div>

            <div className={styles.stages}>
              <Pane title={t("labController")} className={styles.controller}>
                <LabStage scene={scene} role="controller" state={state} locale={locale} dispatch={dispatch} glossaryUrl={glossaryUrl} reducedMotion={reducedMotion} />
              </Pane>
              <div className={styles.side}>
                <Pane title={t("labDisplay")}>
                  <LabStage scene={scene} role="display" state={state} locale={locale} dispatch={null} glossaryUrl={glossaryUrl} reducedMotion={reducedMotion} />
                </Pane>
                <Pane title={t("labPreview")}>
                  <LabStage scene={scene} role="preview" state={state} locale={locale} dispatch={null} glossaryUrl={glossaryUrl} reducedMotion revealStep={0} />
                </Pane>
              </div>
            </div>

            <div className={styles.panels}>
              {selection?.kind === "component" ? (
                <section className={styles.panel}>
                  <h3 className={chrome.label}>{t("labProps")}</h3>
                  {examples.length ? (
                    <div className={styles.examples}>
                      {examples.map((s) => (
                        <button key={s.id} type="button" className={`${chrome.btn} ${baseScene?.id === s.id ? chrome.on : ""}`} onClick={() => applyBase(s)}>
                          {t("labFromScene")} {s.number}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <textarea className={`${styles.code} ${propsError ? styles.invalid : ""}`} value={propsText} spellCheck={false}
                    onChange={(e) => setPropsText(e.target.value)} rows={10} />
                  <div className={styles.row}>
                    <button type="button" className={`${chrome.btn} ${chrome.primary}`} onClick={applyProps}>
                      {t("labApply")}
                    </button>
                    {propsError ? <span className={styles.error}>{t("labInvalidJson")}</span> : null}
                  </div>
                </section>
              ) : null}
              <section className={styles.panel}>
                <h3 className={chrome.label}>{t("labState")}</h3>
                <pre className={styles.code}>{JSON.stringify(
                  { sceneState: state.sceneStates[LAB_SCENE_ID] ?? null, fallback: fallbackOn, revealStep: state.revealStep },
                  null,
                  2,
                )}</pre>
              </section>
              <section className={styles.panel}>
                <h3 className={chrome.label}>{t("labCommands")}</h3>
                <ol className={styles.log}>
                  {store.log.map((e, i) => (
                    <li key={store.log.length - i}>
                      <span className={chrome.muted}>{new Date(e.at).toLocaleTimeString(uiLocale)}</span> {summarize(e.command)}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LabStage({
  scene, role, state, locale, dispatch, glossaryUrl, reducedMotion, revealStep,
}: {
  scene: SceneDefinition;
  role: SceneRole;
  state: SessionState;
  locale: Locale;
  dispatch: ((c: SessionCommand) => void) | null;
  glossaryUrl: string;
  reducedMotion: boolean;
  revealStep?: number;
}) {
  const defaultSource = useDefaultModelSource();
  const ctx = useSceneContext({
    scene,
    role,
    locale,
    revealStep: revealStep ?? state.revealStep,
    ...sceneSlice(state, scene.id),
    dispatch,
    getSource,
    glossaryUrl,
    reducedMotion,
    modelSource: LAB_MODEL_SOURCE ?? defaultSource,
  });
  return (
    <Stage>
      <SceneRenderer scene={scene} ctx={ctx} />
    </Stage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={chrome.label}>{title}</h2>
      <ul className={styles.items}>{children}</ul>
    </section>
  );
}

function Item({ children, active, dim, onClick }: { children: React.ReactNode; active: boolean; dim?: boolean; onClick: () => void }) {
  return (
    <li>
      <button type="button" className={`${styles.item} ${active ? styles.itemActive : ""} ${dim ? styles.itemDim : ""}`} onClick={onClick}>
        {children}
      </button>
    </li>
  );
}

function Pane({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={`${styles.pane} ${className ?? ""}`}>
      <figcaption className={chrome.label}>{title}</figcaption>
      <div className={styles.frame}>{children}</div>
    </figure>
  );
}

function parseProps(text: string): Record<string, unknown> | null {
  if (!text.trim()) return {};
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function prettyJson(text: string): string {
  const parsed = parseProps(text);
  return parsed ? JSON.stringify(parsed, null, 2) : text;
}

function summarize(c: SessionCommand): string {
  const { type, ...rest } = c;
  const body = JSON.stringify(rest);
  return `${type} ${body.length > 120 ? `${body.slice(0, 117)}...` : body}`;
}

/**
 * `?source=hf|simulation` tries a language scene with each model source.
 * Read once at load: the lab rewrites its URL afterwards.
 */
const LAB_MODEL_SOURCE: "hf" | "simulation" | null = (() => {
  const v = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("source");
  return v === "hf" || v === "simulation" ? v : null;
})();
