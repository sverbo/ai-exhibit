import { plainText, tr } from "@ai-exhibit/presentation-core";
import { useEffect, useRef, useState } from "react";
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
  /** Progress of the Bombe demo (ticks of TICK_MS), published by the controller. */
  bombe?: number;
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

/** Steps a scene should declare for a range: step 0 shows the first milestone. */
export function timelineSteps(range: "ai" = "ai"): number {
  return TIMELINES[range].length - 1;
}

/**
 * A short history as a rail of stations. The newest station fills the stage
 * (big date, one sentence); earlier ones stay on the rail. The controller can
 * click an earlier station to bring it back; the projector follows.
 */
export function AITimeline({ props, ctx }: SceneComponentProps<AITimelineProps, AITimelineState>) {
  const { locale, role } = ctx;
  const milestones = TIMELINES[props.range ?? "ai"];
  const step = role === "preview" ? milestones.length - 1 : Math.max(0, ctx.revealStep);
  const revealed = Math.min(milestones.length, step + 1);
  const focus = focusedMilestone(revealed, step, role === "preview" ? undefined : ctx.state);
  const current = milestones[focus]!;
  const interactive = role === "controller";
  const still = role === "preview" || ctx.reducedMotion;

  const choose = (index: number) => {
    if (interactive) ctx.setState({ focus: index === revealed - 1 ? null : index, atStep: step });
  };

  // The Bombe demo: the controller ticks it and publishes each tick; the projector follows.
  const demo = current.demo === "bombe";
  const [replay, setReplay] = useState(0);
  const keepFocus = ctx.state?.atStep === step ? ctx.state.focus : null;
  // A window that takes over the stage mid-demo (the presenter view opened or
  // closed) resumes from the published tick instead of starting it again.
  const publishedTick = ctx.state?.atStep === step && typeof ctx.state?.bombe === "number" ? ctx.state.bombe : null;
  // What was on stage when this component mounted; resuming is allowed only
  // until the step changes or the presenter asks for a replay.
  const mounted = useRef({ step, tick: publishedTick, resumable: true });
  useEffect(() => {
    const m = mounted.current;
    if (step !== m.step || replay !== 0) m.resumable = false;
    const from = m.resumable ? m.tick : null;
    if (!interactive || !demo) return;
    const publish = (tick: number) => ctx.setState({ focus: keepFocus, atStep: step, bombe: tick });
    if (ctx.reducedMotion) {
      publish(BOMBE_TICKS);
      return;
    }
    if (from !== null && from >= BOMBE_TICKS) return;
    let tick = from ?? 0;
    publish(tick);
    const timer = setInterval(() => {
      tick += 1;
      publish(tick);
      if (tick >= BOMBE_TICKS) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
    // Restart only when the demo comes on stage (or on replay), not on every published tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, demo, step, current.id, ctx.reducedMotion, replay]);
  // Without a published tick (or with reduced motion) the demo shows its end state.
  const bombeTick =
    still || ctx.state?.atStep !== step || typeof ctx.state?.bombe !== "number" ? BOMBE_TICKS : ctx.state.bombe;

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
        {demo && interactive ? (
          <button type="button" className={styles.replay} onClick={() => setReplay((n) => n + 1)} onKeyDown={stopShellKeys}>
            {tr(COPY.replay, locale)}
          </button>
        ) : null}
        </div>
        {demo ? <BombeDemo tick={bombeTick} locale={locale} /> : null}
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
