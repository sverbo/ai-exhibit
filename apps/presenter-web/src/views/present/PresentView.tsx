import { Rich } from "@ai-exhibit/scene-components";
import { useEffect, useState } from "react";
import { tr, stepCount } from "@ai-exhibit/presentation-core";
import { useTalkKeyboard } from "../../control/useTalkKeyboard.ts";
import { formatDuration } from "../../control/pace.ts";
import { useUi } from "../../i18n.ts";
import { glossaryUrlFor, useRuntime } from "../../talk/runtime.ts";
import { useElapsedMs, useTalk } from "../../talk/useTalk.ts";
import chrome from "../../ui/chrome.module.css";
import { GotoPalette } from "../../ui/GotoPalette.tsx";
import { OutOfDateNotice } from "../../ui/OutOfDate.tsx";
import { ProjectorSurface } from "../../ui/ProjectorSurface.tsx";
import { SpeakerNotes } from "../../ui/SpeakerNotes.tsx";
import { StatusChips } from "../../ui/StatusChips.tsx";
import { ThemeToggle } from "../../ui/ThemeToggle.tsx";
import { ModelSourceToggle } from "../../ui/ModelSourceToggle.tsx";
import { LocalePicker } from "../../ui/LocalePicker.tsx";
import { useFullscreen, usePointerActivity } from "../../ui/useFullscreen.ts";
import { KeyHint } from "./KeyHint.tsx";
import { openView } from "../../talk/openView.ts";
import { ProgressRail } from "./ProgressRail.tsx";
import { talkProgress } from "./progress.ts";
import styles from "./PresentView.module.css";
import { deskTitle } from "../../ui/deskTitle.ts";

type HudMode = "full" | "strip";
const HUD_KEY = "ai-exhibit:present-hud";

function readHud(): HudMode {
  try {
    return localStorage.getItem(HUD_KEY) === "strip" ? "strip" : "full";
  } catch {
    return "full";
  }
}

/**
 * Solo mode: the stage is the projector, the keyboard drives it. The HUD is
 * docked under the stage, never over it, so a scene's own controls stay
 * reachable: the stage letterboxes into whatever room the HUD leaves. The HUD
 * collapses to a one-line strip, and N hides it entirely.
 *
 * The same view is the projector (`/projector`, variant "projector"): HUD
 * hidden until N so the audience never sees notes, a faint key reminder and a
 * corner with the model source and Full screen while the mouse moves. It works
 * alone (it runs the stage: interactive scenes, model calls) or linked with a
 * presenter view in the same browser profile, which then runs the stage while
 * this window mirrors it and still takes the arrow keys and the clicker (see
 * `ownsStage` in useTalk). `/present` is the rehearsal variant, HUD shown
 * (`?hud=off` hides it, for old links).
 */
export default function PresentView({ variant = "present" }: { variant?: "present" | "projector" }) {
  const { t, setLocale } = useUi();
  const talk = useTalk("solo");
  // The few interface words here follow the talk's language.
  useEffect(() => {
    setLocale(talk.locale);
  }, [talk.locale, setLocale]);
  const { network } = useRuntime(15000);
  const [hud, setHud] = useState(
    () => variant !== "projector" && new URLSearchParams(window.location.search).get("hud") !== "off",
  );
  const pointerActive = usePointerActivity(2200);
  const [mode, setModeState] = useState<HudMode>(readHud);
  const [palette, setPalette] = useState(false);
  const fullscreen = useFullscreen();
  const elapsed = useElapsedMs(talk.state);

  const setMode = (next: HudMode) => {
    setModeState(next);
    try {
      localStorage.setItem(HUD_KEY, next);
    } catch {
      // storage unavailable
    }
  };

  useTalkKeyboard(
    talk,
    (action) => {
      if (action === "notes") setHud((h) => !h);
      else if (action === "goto") setPalette(true);
      else setPalette(false);
    },
    !palette,
  );

  useEffect(() => {
    document.title = `${t(variant === "projector" ? "viewProjector" : "viewPresent")} · ai-exhibit`;
  }, [t, variant]);

  const { scene, state, scenes, index, locale } = talk;
  const steps = scene ? stepCount(scene) : 0;
  const full = mode === "full";

  return (
    <div className={`${styles.present} ${!hud && !pointerActive ? styles.idle : ""}`} lang={locale} data-stage={talk.ownsStage ? "owner" : talk.linked ? "linked" : "none"}>
      <OutOfDateNotice talk={talk} className={styles.outOfDate} />
      <div className={styles.stageArea}>
        <ProjectorSurface
          talk={talk}
          role="controller"
          audienceScreen
          glossaryUrl={glossaryUrlFor(network)}
          overlay={<ProgressRail progress={talkProgress(talk.talk.presentation.chapters, talk.personal.timed, scene)} />}
        />
        {!hud && !palette ? (
          <KeyHint
            fullscreen={fullscreen}
            keys={talk.controller}
            corner={
              <>
                {/* Language and model source from the projector too, presenter open or not: everything can be run from here. */}
                {talk.linked && !talk.ownsStage ? <span className={styles.linked}>{t("linkedToPresenter")}</span> : null}
                {talk.controller ? (
                  <>
                    <LocalePicker compact value={talk.locale} onChange={talk.actions.setLocale} />
                    <ModelSourceToggle shell={talk.shell} onChange={talk.actions.setModelSource} />
                  </>
                ) : null}
                <button type="button" className={chrome.btn} onClick={() => openView("presenter")} title={t("openOtherHint")}>
                  {t("openPresenter")}
                </button>
              </>
            }
          />
        ) : null}
      </div>

      {hud ? (
        <section className={`${styles.hud} ${full ? "" : styles.hudStrip}`} aria-label={t("hudRegion")} data-hud={mode}>
          <div className={styles.hudMain}>
            <span className={`${chrome.mono} ${styles.position}`}>
              {scene ? scene.number : "..."} <span className={chrome.muted}>{index + 1}/{scenes.length}</span>
            </span>
            <span className={styles.title}><Rich text={scene ? deskTitle(scene, locale) : ""} /></span>
            {steps > 0 ? (
              <span className={styles.steps} aria-label={`${t("step")} ${state?.revealStep ?? 0}/${steps}`}>
                {Array.from({ length: steps }, (_, i) => (
                  <span key={i} className={`${styles.stepDot} ${i < (state?.revealStep ?? 0) ? styles.stepOn : ""}`} />
                ))}
              </span>
            ) : null}
            <StatusChips state={state} sceneId={scene?.id} />
            <span className={`${chrome.mono} ${styles.timer} ${state?.timer.startedAt == null ? styles.paused : ""}`}>
              {formatDuration(elapsed / 1000)}
            </span>
            {full ? <ThemeToggle /> : null}
            {full && talk.linked ? <span className={styles.linked}>{t("linkedToPresenter")}</span> : null}
            {full ? <ModelSourceToggle shell={talk.shell} onChange={talk.actions.setModelSource} /> : null}
            {!fullscreen.isFullscreen ? (
              <button type="button" className={`${chrome.btn} ${styles.small}`} onClick={fullscreen.toggle}>
                {t("fullscreen")}
              </button>
            ) : null}
            <button
              type="button"
              className={`${chrome.btn} ${styles.small}`}
              onClick={() => setMode(full ? "strip" : "full")}
              aria-expanded={full}
              title={full ? t("hudCollapse") : t("hudExpand")}
            >
              {full ? t("hudCollapse") : t("hudExpand")}
            </button>
          </div>

          {full && scene ? (
            <div className={styles.body}>
              <div className={styles.notesCol}>
                <SpeakerNotes markdown={tr(scene.speakerNotes, locale)} variant="hud" personal={talk.personal.noteFor(scene)} />
              </div>
              <div className={styles.sideCol}>
                {tr(scene.takeaway, locale) ? (
                  <p className={styles.mainTakeaway}>
                    <span className={styles.aside}>{t("takeaway")}</span> <Rich text={tr(scene.takeaway, locale)} />
                  </p>
                ) : null}
                {tr(scene.transitionOut, locale) ? (
                  <p className={styles.takeaway}>
                    <span className={styles.aside}>{t("transitionOut")}</span> <Rich text={tr(scene.transitionOut, locale)} />
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {full && !talk.controller && !talk.outOfDate && talk.session.status === "open" ? <p className={styles.warn}>{t("cannotControl")}</p> : null}
          {full ? (
            <p className={styles.keys}>
              <K k="→" /> <K k="←" /> {t("next").toLowerCase()} · <K k="⇧→" /> {t("nextScene").toLowerCase()} · <K k="↓" /> {t("sceneEnd").toLowerCase()} · <K k="F" />{" "}
              {t("fallback").toLowerCase()} · <K k="R" /> {t("reset").toLowerCase()} · <K k="B" /> {t("blackout").toLowerCase()} ·{" "}
              <K k="T" /> {t("timer").toLowerCase()} · <K k="G" /> {t("gotoScene").toLowerCase()} · <K k="L" /> {t("theme").toLowerCase()} ·{" "}
              <K k="N" /> {t("hideHud").toLowerCase()}
            </p>
          ) : null}
        </section>
      ) : null}

      {palette ? (
        <GotoPalette
          scenes={talk.personal.sequence.ordered}
          hiddenIds={talk.personal.sequence.hiddenIds}
          presentation={talk.talk.presentation}
          locale={locale}
          currentId={scene?.id}
          onClose={() => setPalette(false)}
          onGo={(id) => {
            talk.actions.goto(id);
            setPalette(false);
          }}
        />
      ) : null}
    </div>
  );
}

function K({ k }: { k: string }) {
  return <kbd className={chrome.kbd}>{k}</kbd>;
}
