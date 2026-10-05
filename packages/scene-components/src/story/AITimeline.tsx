import { plainText, tr } from "@ai-exhibit/presentation-core";
import { useEffect, useState } from "react";
import type { SceneComponentProps } from "../contract.ts";
import { SourceList } from "../evidence/SourceList.tsx";
import { Rich } from "../primitives/Rich.tsx";
import { stopShellKeys } from "../evidence/shared.ts";
import { BombeDemo, BOMBE_TICKS, TICK_MS } from "./BombeDemo.tsx";
import { TIMELINES } from "./data.ts";
import styles from "./AITimeline.module.css";

export interface AITimelineProps {
  range?: "ai";
}

/** Controller choice of which revealed milestone fills the feature panel; valid only at `atStep`. */
export interface AITimelineState {
  focus: number | null;
  atStep: number;
  /**
   * When the Bombe search started (ms since epoch), published once by the controller. Every window
   * computes the same frame from it, so the demo never freezes when one window's timers slow down.
   */
  bombeStart?: number;
}

const COPY = {
  label: { en: "A short history of AI" },
  promise: { en: "Promise" },
  setback: { en: "Setback" },
  bombeCaption: {
    en: "Given a known word, the machine searched for the settings itself.",
  },
  replay: { en: "Replay the search" },
} as const;

/** Shape that carries the track besides color: up for promises, down for setbacks. */
const TRACK_MARK = { promise: "▲", setback: "▼" } as const;

/** Index of the milestone shown large: the latest revealed one, unless the controller picked another at this step. */
export function focusedMilestone(revealed: number, step: number, state: AITimelineState | undefined): number {
  const latest = revealed - 1;
  if (!state || state.atStep !== step || state.focus === null) return latest;
  return state.focus >= 0 && state.focus <= latest ? state.focus : latest;
}

/** What one reveal step shows: a milestone, and for a demo milestone whether its demo runs (its second step). */
export interface TimelineStep {
  index: number;
  run: boolean;
}

/** Reveal steps in order: one per milestone, two for a demo (the machine still, then running). */
export function timelineStepMap(range: "ai" = "ai"): TimelineStep[] {
  return TIMELINES[range].flatMap((m, index) => (m.demo ? [{ index, run: false }, { index, run: true }] : [{ index, run: false }]));
}

/** Steps a scene should declare for a range: step 0 shows the first milestone. */
export function timelineSteps(range: "ai" = "ai"): number {
  return timelineStepMap(range).length - 1;
}

/**
 * A short history as a rail of stations. The newest station fills the stage
 * (big date, one sentence); earlier ones stay on the rail. The controller can
 * click an earlier station to bring it back; the projector follows.
 */
export function AITimeline({ props, ctx }: SceneComponentProps<AITimelineProps, AITimelineState>) {
  const { locale, role } = ctx;
  const milestones = TIMELINES[props.range ?? "ai"];
  const stepMap = timelineStepMap(props.range ?? "ai");
  const step = role === "preview" ? stepMap.length - 1 : Math.min(stepMap.length - 1, Math.max(0, ctx.revealStep));
  const here = stepMap[step]!;
  const revealed = here.index + 1;
  const focus = focusedMilestone(revealed, step, role === "preview" ? undefined : ctx.state);
  const current = milestones[focus]!;
  const interactive = role === "controller";
  const still = role === "preview" || ctx.reducedMotion;

  const choose = (index: number) => {
    if (interactive) ctx.setState({ focus: index === revealed - 1 ? null : index, atStep: step });
  };

  // The Bombe demo: shown still on its first step, run on the next one. The controller publishes when
  // the run started; every window draws the frame for that moment, so all of them stay in step.
  const demo = current.demo === "bombe";
  const running = demo && here.run && focus === here.index;
  const [replay, setReplay] = useState(0);
  const keepFocus = ctx.state?.atStep === step ? ctx.state.focus : null;
  const start = ctx.state?.atStep === step && typeof ctx.state?.bombeStart === "number" ? ctx.state.bombeStart : null;
  useEffect(() => {
    if (!interactive || !running) return;
    // A window taking over the stage mid-run keeps the published start; a replay starts again.
    if (start !== null && replay === 0) return;
    ctx.setState({ focus: keepFocus, atStep: step, bombeStart: Date.now() });
    // Start once per run step, and again on each replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, running, step, replay]);
  const [now, setNow] = useState(() => Date.now());
  const runningTick = start === null ? 0 : Math.max(0, Math.floor((now - start) / TICK_MS));
  useEffect(() => {
    if (!running || still || start === null) return;
    if (runningTick >= BOMBE_TICKS) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [running, still, start, runningTick >= BOMBE_TICKS]);
  // Reduced motion, previews, or the station brought back from a later step: the end state.
  // On its first step the machine stands still; on the next one it runs from the published start.
  const settled = still || focus !== here.index;
  const bombeTick = settled ? BOMBE_TICKS : running ? Math.min(BOMBE_TICKS, runningTick) : 0;
  const bombeRunning = settled || here.run;

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} aria-label={plainText(tr(COPY.label, locale))}>
      <section className={styles.feature} key={current.id} data-track={current.track} data-demo={demo} aria-live={demo ? undefined : "polite"}>
        <div className={styles.featureText}>
        <p className={styles.kicker}>
          <span aria-hidden="true">{TRACK_MARK[current.track]}</span> {tr(COPY[current.track], locale)}
        </p>
        <p className={styles.when} data-long={tr(current.when, locale).length > 8}>
          <Rich text={tr(current.when, locale)} />
        </p>
        <h2 className={styles.title}>
          <Rich text={tr(current.title, locale)} />
        </h2>
        <p className={styles.text}>
          <Rich text={tr(current.text, locale)} />
        </p>
        {current.aside ? (
          <p className={styles.aside}>
            <Rich text={tr(current.aside, locale)} />
          </p>
        ) : null}
        {interactive ? (
          // Presenter only: some publishers are companies, and this scene names none on the projector.
          <div className={styles.sources}>
            {/* Long lists (the winters cite six sources) collapse to short labels to keep the date on stage. */}
            <SourceList sourceIds={current.sourceIds} role={role} locale={locale} getSource={ctx.getSource} compact={current.sourceIds.length > 3} />
          </div>
        ) : null}
        {demo ? (
          <p className={styles.caption}>
            <Rich text={tr(COPY.bombeCaption, locale)} />
          </p>
        ) : null}
        {demo && interactive && here.run ? (
          <button type="button" className={styles.replay} onClick={() => setReplay((n) => n + 1)} onKeyDown={stopShellKeys}>
            {tr(COPY.replay, locale)}
          </button>
        ) : null}
        </div>
        {demo ? <BombeDemo tick={bombeTick} locale={locale} running={bombeRunning} /> : null}
      </section>

      <ol className={styles.rail} style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
        {milestones.map((m, i) => {
          const visible = i < revealed;
          const isFocus = i === focus;
          const label = (
            <span className={styles.label}>
              <span className={styles.stationWhen}>{visible ? <Rich text={tr(m.when, locale)} /> : ""}</span>
              <span className={styles.stationShort}>{visible ? <Rich text={tr(m.short, locale)} /> : ""}</span>
            </span>
          );
          const body = (
            <>
              <span className={styles.above}>{m.track === "promise" ? label : null}</span>
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.below}>{m.track === "setback" ? label : null}</span>
            </>
          );
          return (
            <li
              key={m.id}
              className={`${styles.station} ${visible ? styles.reached : styles.ahead} ${isFocus ? styles.focus : ""}`}
              data-track={m.track}
              data-period={m.period === true}
              aria-hidden={!visible}
              aria-current={isFocus ? "step" : undefined}
            >
              {interactive && visible ? (
                <button type="button" className={styles.stationButton} aria-pressed={isFocus} onClick={() => choose(i)} onKeyDown={stopShellKeys}>
                  {body}
                </button>
              ) : (
                <div className={styles.stationButton}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
