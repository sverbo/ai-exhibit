import { Rich } from "@ai-exhibit/scene-components";
import { useEffect, useMemo, useState } from "react";
import { tr, stepCount } from "@ai-exhibit/presentation-core";
import { useTalkKeyboard } from "../../control/useTalkKeyboard.ts";
import { computePace, formatDelta, formatDuration, formatMinutes } from "../../control/pace.ts";
import { useUi } from "../../i18n.ts";
import { chapterOf } from "../../talk/presentation.ts";
import { glossaryUrlFor, useRuntime } from "../../talk/runtime.ts";
import { projectorView } from "../../talk/shell.ts";
import { useElapsedMs, useTalk } from "../../talk/useTalk.ts";
import chrome from "../../ui/chrome.module.css";
import { GotoPalette } from "../../ui/GotoPalette.tsx";
import { OutOfDateNotice } from "../../ui/OutOfDate.tsx";
import { ProjectorSurface } from "../../ui/ProjectorSurface.tsx";
import { SceneStage } from "../../ui/SceneStage.tsx";
import { ThemeToggle } from "../../ui/ThemeToggle.tsx";
import { ModelSourceToggle } from "../../ui/ModelSourceToggle.tsx";
import { LocalePicker } from "../../ui/LocalePicker.tsx";
import { ChapterStrip, HealthPanel, NotesPanel, SourcesPanel, TodoPanel, sceneSourceIds, sceneTodos, useNotesScale } from "./panels.tsx";
import styles from "./PresenterView.module.css";
import { ConfigPanel } from "./ConfigPanel.tsx";
import { isEmptyConfig } from "../../talk/personal.ts";

type Tab = "notes" | "sources" | "todo" | "health";

/**
 * Laptop presenter view. The speaker notes are the dominant panel (right);
 * the live controller stage, controls and thumbnails sit on the left; sources,
 * TODOs and health wait behind tabs above the notes.
 */
export default function PresenterView() {
  const { t, locale: uiLocale, setLocale } = useUi();
  const talk = useTalk("presenter");
  // The interface follows the talk's language: one switch for both.
  useEffect(() => {
    setLocale(talk.locale);
  }, [talk.locale, setLocale]);
  // The runtime (under pnpm dev) knows the LAN address phones use for the glossary QR.
  const runtime = useRuntime(15000);
  const glossaryUrl = glossaryUrlFor(runtime.network);
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState<Tab>("notes");
  const [palette, setPalette] = useState(false);
  const [config, setConfig] = useState(false);
  const elapsed = useElapsedMs(talk.state);
  const notesScale = useNotesScale();

  useTalkKeyboard(
    talk,
    (action) => {
      if (action === "notes") {
        setSidebar((s) => !s);
        setTab("notes");
      } else if (action === "goto") setPalette(true);
      else setPalette(false);
    },
    !palette && !config,
  );

  useEffect(() => {
    document.title = `${t("viewPresenter")} · ai-exhibit`;
  }, [t]);

  const { state, scene, scenes, index, locale, actions, controller } = talk;
  const presentation = talk.talk.presentation;
  const edition = talk.talk.edition;
  const next = index >= 0 ? scenes[index + 1] : undefined;
  const steps = scene ? stepCount(scene) : 0;
  const reveal = state?.revealStep ?? 0;
  const chapter = chapterOf(presentation, scene);
  const pace = useMemo(
    () => computePace(talk.personal.timed, state?.sceneId ?? "", elapsed, edition.targetMinutes),
    [talk.personal.timed, state?.sceneId, elapsed, edition.targetMinutes],
  );
  const view = state ? projectorView(state) : null;
  const air = view?.kind ?? "live";
  const frozenScene = view?.kind === "frozen" ? talk.talk.scenes.find((s) => s.id === view.sceneId) : undefined;
  const currentHidden = Boolean(scene && talk.personal.sequence.hiddenIds.has(scene.id));
  const fallbackOn = Boolean(scene && state?.fallback[scene.id]);
  const timerRunning = state?.timer.startedAt != null;
  const sourceCount = scene ? sceneSourceIds(scene).length : 0;
  const todoCount = scene ? sceneTodos(scene).length : 0;

  return (
    <div className={`${styles.presenter} ${sidebar ? "" : styles.noSidebar}`} lang={uiLocale}>
      {/* ------------------------------------------------------------ top bar */}
      <header className={styles.topbar}>
        <div className={`${styles.air} ${styles[`air_${air}`]}`} role="status" aria-live="polite">
          <span className={styles.airShape} aria-hidden="true" />
          <span className={styles.airText}>
            {air === "blackout"
              ? t("projectorBlack")
              : air === "frozen"
                ? `${t("projectorFrozen")} ${frozenScene?.number ?? ""}`
                : t("onAir")}
          </span>
        </div>

        <div className={styles.sceneInfo}>
          <span className={styles.sceneId}>
            <span className={`${chrome.mono} ${styles.sceneNumber}`}>{scene?.number ?? "..."}</span>
            {scene ? (
              <span className={`${chrome.mono} ${styles.sceneCode}`} title="code">
                {scene.code}
              </span>
            ) : null}
          </span>
          <div className={styles.sceneText}>
            <span className={styles.sceneTitle}><Rich text={scene ? tr(scene.title, locale) : t("emptyEdition")} /></span>
            <span className={styles.sceneMeta}>
              {chapter ? <Rich text={`${t("chapter")} ${chapter.id} · ${tr(chapter.title, locale)}`} /> : ""}
              {scenes.length ? ` · ${t("scene")} ${index + 1}/${scenes.length}` : ""}
            </span>
          </div>
          {currentHidden ? <span className={styles.hiddenChip}>{t("configHiddenCurrent")}</span> : null}
          {steps > 0 ? (
            <span className={styles.steps} title={`${t("step")} ${reveal}/${steps}`}>
              {Array.from({ length: steps }, (_, i) => (
                <span key={i} className={`${styles.stepDot} ${i < reveal ? styles.stepOn : ""}`} />
              ))}
              <span className={`${chrome.mono} ${styles.stepText}`}>
                {reveal}/{steps}
              </span>
            </span>
          ) : null}
          {fallbackOn ? <span className={styles.fallbackChip}>{t("fallbackOn")}</span> : null}
        </div>

        <div className={styles.clock}>
          <button
            type="button"
            className={`${styles.timer} ${timerRunning ? "" : styles.timerPaused}`}
            onClick={actions.toggleTimer}
            disabled={!controller}
            title={`${timerRunning ? t("pause") : t("start")} (T)`}
          >
            <span className={styles.timerIcon} aria-hidden="true">{timerRunning ? "❚❚" : "▶"}</span>
            <span className={chrome.mono}>{formatDuration(elapsed / 1000)}</span>
          </button>
          <div className={styles.pace}>
            <span className={`${styles.paceStatus} ${styles[`pace_${pace.status}`]}`}>
              {pace.status === "on-track"
                ? t("paceOnTrack")
                : `${formatDelta(pace.deltaSec)} ${pace.status === "ahead" ? t("paceAhead") : t("paceBehind")}`}
            </span>
            <span className={styles.paceTarget}>
              {t("finishAt")} {formatMinutes(pace.projectedTotalSec)} · {t("target")} {edition.targetMinutes[0]} {t("rangeTo")} {edition.targetMinutes[1]} min
              {pace.target === "over" ? <strong className={styles.over}> · {t("overTarget")}</strong> : null}
            </span>
          </div>
        </div>

        <div className={styles.topRight}>
          <button
            type="button"
            className={styles.healthDots}
            onClick={() => {
              setSidebar(true);
              setTab("health");
            }}
            title={t("health")}
          >
            <span className={`${chrome.dot} ${talk.session.status === "open" ? chrome.dotOk : talk.session.status === "connecting" ? chrome.dotWarn : chrome.dotBad}`} />
          </button>
          <button
            type="button"
            className={`${chrome.btn} ${isEmptyConfig(talk.personal.config) ? "" : chrome.on}`}
            onClick={() => setConfig(true)}
            aria-haspopup="dialog"
            title={`${t("configTitle")}${isEmptyConfig(talk.personal.config) ? "" : ` (${t("configPersonal")})`}`}
          >
            {t("config")}
          </button>
          <ThemeToggle />
          <ModelSourceToggle shell={talk.shell} onChange={talk.actions.setModelSource} />
          {/* One language switch: the talk's (slides on every window) and this interface's. */}
          <LocalePicker
            compact
            value={talk.locale}
            onChange={(l) => {
              talk.actions.setLocale(l);
              setLocale(l);
            }}
          />
        </div>
      </header>

      {/* --------------------------------------------------------------- main */}
      <main className={styles.main}>
        <OutOfDateNotice talk={talk} />
        {!controller && !talk.outOfDate && talk.session.status === "open" ? (
          <p className={styles.banner}>{t("cannotControl")}</p>
        ) : null}

        <div className={`${styles.stageFrame} ${styles[`frame_${air}`]}`}>
          {air !== "live" ? <span className={styles.privateTag}>{t("privateNav")}</span> : null}
          {scene ? (
            <SceneStage talk={talk} scene={scene} role="controller" glossaryUrl={glossaryUrl} ghost bars="transparent" />
          ) : (
            <div className={styles.empty}>
              <p>{scenes.length ? t("waitingSession") : t("noScenes")}</p>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <Ctl label={t("prev")} k="←" onClick={() => actions.nav("prev")} disabled={!controller} />
          <Ctl label={t("next")} k="→" onClick={() => actions.nav("next")} disabled={!controller} primary />
          <Ctl label={t("sceneEnd")} k="↓" onClick={() => actions.nav("sceneEnd")} disabled={!controller || reveal >= steps} />
          <Ctl label={t("prevScene")} k="⇧←" onClick={() => actions.nav("prevScene")} disabled={!controller} />
          <Ctl label={t("skip")} k="⇧→" onClick={() => actions.nav("nextScene")} disabled={!controller} />
          <span className={styles.sep} />
          <Ctl label={t("reset")} k="R" onClick={actions.resetScene} disabled={!controller} />
          <Ctl label={t("fallback")} k="F" onClick={actions.toggleFallback} disabled={!controller} on={fallbackOn} />
          <Ctl label={state?.frozen ? t("unfreeze") : t("freeze")} k="Z" onClick={actions.toggleFreeze} disabled={!controller} on={state?.frozen} />
          <Ctl label={state?.blackout ? t("unblack") : t("blackout")} k="B" onClick={actions.toggleBlackout} disabled={!controller} on={state?.blackout} danger />
          <Ctl label={t("pauseMotion")} onClick={actions.togglePauseMotion} disabled={!controller} on={Boolean(talk.shell.pauseMotion)} />
          <Ctl label={t("gotoScene")} k="G" onClick={() => setPalette(true)} disabled={!controller} />
        </div>

        <div className={styles.lower}>
          <figure className={styles.thumb}>
            <figcaption className={styles.thumbCaption}>
              <span className={chrome.label}>{t("upNext")}</span>
              <span className={styles.thumbTitle}>
                {next ? (
                  <>
                    <span className={chrome.mono}>{next.number}</span> <Rich text={tr(next.title, locale)} />
                  </>
                ) : (
                  t("endOfTalk")
                )}
              </span>
            </figcaption>
            <div className={styles.thumbStage}>
              {next ? <SceneStage talk={talk} scene={next} role="preview" revealStep={0} glossaryUrl={glossaryUrl} ghost bars="transparent" /> : <div className={styles.thumbEmpty} />}
            </div>
          </figure>
          <figure className={`${styles.thumb} ${styles.mirror} ${styles[`mirror_${air}`]}`}>
            <figcaption className={styles.thumbCaption}>
              <span className={chrome.label}>{t("viewProjector")}</span>
              <span className={styles.thumbTitle}>
                {air === "live" ? t("projectorLive") : air === "frozen" ? `${t("projectorFrozen")} ${frozenScene?.number ?? ""}` : t("projectorBlack")}
              </span>
            </figcaption>
            <div className={styles.thumbStage}>
              <ProjectorSurface talk={talk} role="display" glossaryUrl={glossaryUrl} />
            </div>
          </figure>
        </div>
      </main>

      {/* ------------------------------------------------------------ sidebar */}
      {sidebar ? (
        <aside className={styles.sidebar}>
          <nav className={styles.tabs} role="tablist">
            <TabBtn id="notes" tab={tab} setTab={setTab} label={t("notes")} hint="N" />
            <TabBtn id="sources" tab={tab} setTab={setTab} label={t("sources")} count={sourceCount} />
            <TabBtn id="todo" tab={tab} setTab={setTab} label={t("todo")} count={todoCount} warn={todoCount > 0} />
            <TabBtn id="health" tab={tab} setTab={setTab} label={t("health")} />
            {tab === "notes" ? (
              <span className={styles.scale}>
                <button type="button" className={chrome.btn} onClick={() => notesScale.change(-0.1)} aria-label={t("smallerText")} title={t("smallerText")}>
                  A−
                </button>
                <button type="button" className={chrome.btn} onClick={() => notesScale.change(0.1)} aria-label={t("largerText")} title={t("largerText")}>
                  A+
                </button>
              </span>
            ) : null}
          </nav>
          <div className={`${styles.panel} ${tab === "notes" ? styles.panelNotes : ""}`}>
            {tab === "notes" ? (
              <NotesPanel scene={scene} next={next} locale={locale} scale={notesScale.scale} personalNote={talk.personal.noteFor(scene)} />
            ) : null}
            {tab === "sources" ? <SourcesPanel scene={scene} locale={locale} getSource={talk.getSource} /> : null}
            {tab === "todo" ? <TodoPanel scene={scene} /> : null}
            {tab === "health" ? <HealthPanel talk={talk} /> : null}
          </div>
        </aside>
      ) : null}

      {/* ------------------------------------------------------ chapter strip */}
      <footer className={styles.footer}>
        <ChapterStrip pace={pace} presentation={presentation} locale={locale} />
      </footer>

      {palette ? (
        <GotoPalette
          scenes={talk.personal.sequence.ordered}
          hiddenIds={talk.personal.sequence.hiddenIds}
          presentation={presentation}
          locale={locale}
          currentId={scene?.id}
          onClose={() => setPalette(false)}
          onGo={(id) => {
            actions.goto(id);
            setPalette(false);
          }}
        />
      ) : null}
      {config ? <ConfigPanel talk={talk} onClose={() => setConfig(false)} /> : null}
    </div>
  );
}

function Ctl({
  label,
  k,
  onClick,
  disabled,
  primary,
  on,
  danger,
}: {
  label: string;
  k?: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  on?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${chrome.btn} ${primary ? `${chrome.primary} ${styles.primaryCtl}` : ""} ${on ? chrome.on : ""} ${danger ? chrome.danger : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on === undefined ? undefined : on}
    >
      {label}
      {k ? <kbd className={`${chrome.kbd} ${primary ? styles.kbdOnPrimary : ""}`}>{k}</kbd> : null}
    </button>
  );
}

function TabBtn({
  id,
  tab,
  setTab,
  label,
  hint,
  count,
  warn,
}: {
  id: Tab;
  tab: Tab;
  setTab: (t: Tab) => void;
  label: string;
  hint?: string;
  count?: number;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
      onClick={() => setTab(id)}
    >
      {label}
      {count ? <span className={styles.count}>{count}</span> : null}
      {warn ? <span className={`${chrome.dot} ${chrome.dotWarn}`} /> : null}
      {hint ? <kbd className={chrome.kbd}>{hint}</kbd> : null}
    </button>
  );
}
