import { tr } from "@ai-exhibit/presentation-core";
import { useEffect, useMemo, useRef } from "react";
import type { SceneComponentProps } from "../../contract.ts";
import { EvidenceBadge } from "../../primitives/EvidenceBadge.tsx";
import { useSceneState, useOnStepChange } from "../shared/sceneState.ts";
import { ControlBar, Disclosure, SceneButton, SceneHeading, cx, fmtPercent, l, type L10n } from "../shared/ui.tsx";
import {
  BIN,
  CAMERA_CELL,
  COLS,
  HORIZON,
  INITIAL_DIRT,
  ROWS,
  RUG,
  rank,
  simpleBeat,
  simulate,
  type Frame,
  type ObjectiveId,
  type StrategyId,
} from "./sim.ts";
import styles from "./GoalVsOutcome.module.css";

export interface GoalVsOutcomeProps {
  heading?: L10n;
  /** Pictures and one short line per step: no score, no percentage, no ranking. */
  simple?: boolean;
}

export interface GoalVsOutcomeState {
  /** Replay position, 0..HORIZON. */
  tick: number;
  playing: boolean;
  /** Strategy picked by hand in the ranking; null = the one the step shows. */
  pick: StrategyId | null;
  /** Bumped by "replay" so followers restart in step with the controller. */
  run: number;
}

const TICKS_PER_SECOND = 7;

const TEXT = {
  heading: { en: "What we measure, what we wanted" },
  steps: [
    { en: "A cleaning robot. We reward it for every piece of dirt it picks up." },
    { en: "What we imagined: it picks everything up and empties it into the bin." },
    { en: "What optimization finds: pick up, drop, pick up again." },
    { en: "We patch the objective. Optimization finds another loophole." },
    { en: "This gap has a name: misalignment." },
  ],
  disclosure: { en: "A simplified toy built for this talk. Not a real incident." },
  objective: { en: "What we reward" },
  intent: { en: "What we actually wanted" },
  intentText: { en: "A clean room." },
  misalignment: { en: "Misalignment" },
  misalignmentText: { en: "The gap between what an AI is rewarded for and what we actually wanted." },
  objectives: {
    collect: { en: "+1 point per piece of dirt picked up" },
    unseen: { en: "+1 point for every moment the camera sees no dirt" },
  } satisfies Record<ObjectiveId, L10n>,
  score: { en: "Score" },
  clean: { en: "Dirt actually gone" },
  ranking: { en: "The optimizer compares strategies and keeps the top score" },
  strategies: {
    honest: { en: "Pick up and empty into the bin" },
    loop: { en: "Pick up, drop, pick up again…" },
    rug: { en: "Hide it all under the rug" },
    camera: { en: "Park in front of the camera" },
    idle: { en: "Do nothing" },
  } satisfies Record<StrategyId, L10n>,
  chosen: l("choisie", "chosen"),
  intended: { en: "intended" },
  replay: { en: "Replay" },
  pause: { en: "Pause" },
  play: { en: "Play" },
  rug: { en: "rug" },
  bin: { en: "bin" },
  simple: {
    heading: { en: "What we say, what we mean" },
    beats: [
      { icon: "goal", text: { en: "We write the goal: “reward for every piece of dirt picked up”." } },
      { icon: "intent", text: { en: "What we meant: a clean room." } },
      { icon: "shortcut", text: { en: "What it finds: pick up, drop, pick up again." } },
      { icon: "shortcut", text: { en: "We patch it: “no visible dirt”. It parks in front of the camera." } },
    ] as { icon: "goal" | "intent" | "shortcut"; text: L10n }[],
    punchline: { en: "It did exactly what we said, not what we meant." },
  },
};

/** Last reveal step: default mode adds a step that names the gap (misalignment); simple mode stops at the patch. */
const LAST_STEP = 4;
const LAST_SIMPLE_STEP = 3;

function stepPlan(step: number): { objective: ObjectiveId; strategy: StrategyId | null } {
  if (step <= 0) return { objective: "collect", strategy: null };
  if (step === 1) return { objective: "collect", strategy: "honest" };
  if (step === 2) return { objective: "collect", strategy: rank("collect")[0]!.strategy };
  return { objective: "unseen", strategy: rank("unseen")[0]!.strategy };
}


export function GoalVsOutcome({ props, ctx }: SceneComponentProps<GoalVsOutcomeProps, GoalVsOutcomeState>) {
  const { locale, revealStep, role, reducedMotion } = ctx;
  const isController = role === "controller";
  const simple = props.simple === true;
  const step = Math.max(0, Math.min(simple ? LAST_SIMPLE_STEP : LAST_STEP, revealStep));
  const t = (x: L10n) => tr(x, locale);
  // Entering the scene on a replay step starts the replay at once.
  const [state, setState] = useSceneState<GoalVsOutcomeState>(ctx, () => ({
    tick: reducedMotion && step >= 1 ? HORIZON : 0,
    playing: step >= 1 && !reducedMotion,
    pick: null,
    run: 0,
  }));

  const plan = simple ? simpleBeat(step) : stepPlan(step);
  const strategy = state.pick ?? plan.strategy;
  const frames = useMemo(() => (strategy ? simulate(strategy) : null), [strategy]);
  const ranking = useMemo(() => rank(plan.objective), [plan.objective]);
  const tick = role === "preview" ? HORIZON : Math.min(HORIZON, state.tick);
  const frame: Frame = frames ? frames[tick]! : simulate("idle")[0]!;

  // ----- controller clock -----
  const restart = () =>
    setState((s) => ({ ...s, tick: reducedMotion ? HORIZON : 0, playing: !reducedMotion, run: s.run + 1 }));
  // Naming the gap (step 4) keeps the step 3 replay on screen instead of restarting it.
  useOnStepChange(step, (next, prev) => {
    const samePlan = Math.min(next, 3) === Math.min(prev, 3);
    if (isController && !samePlan) setState((s) => ({ ...s, pick: null, tick: reducedMotion ? HORIZON : 0, playing: !reducedMotion, run: s.run + 1 }));
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isController || !state.playing || !strategy) return;
    timer.current = setInterval(() => {
      setState((s) => {
        if (!s.playing) return s;
        const next = s.tick + 1;
        return next >= HORIZON ? { ...s, tick: HORIZON, playing: false } : { ...s, tick: next };
      });
    }, 1000 / TICKS_PER_SECOND);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isController, state.playing, strategy, setState]);

  const score = frame.score[plan.objective];
  const clean = frame.binned / INITIAL_DIRT.length;
  const showRanking = step >= 2;
  const showMisalignment = step >= 4;

  const playback = isController && strategy && (
    <ControlBar>
      <SceneButton onClick={restart}>{t(TEXT.replay)}</SceneButton>
      <SceneButton
        onClick={() => setState((s) => ({ ...s, playing: !s.playing && s.tick < HORIZON }))}
        disabled={state.tick >= HORIZON}
      >
        {t(state.playing ? TEXT.pause : TEXT.play)}
      </SceneButton>
    </ControlBar>
  );

  if (simple) {
    const intended = strategy === "honest";
    return (
      <div className={styles.root}>
        <div className={styles.top}>
          <SceneHeading>{t(props.heading ?? TEXT.simple.heading)}</SceneHeading>
          <div className={styles.labels}>
            <EvidenceBadge level="thought-experiment" locale={locale} size="sm" />
            <Disclosure>{t(TEXT.disclosure)}</Disclosure>
          </div>
        </div>
        <div className={styles.body}>
          <Room frame={frame} locale={locale} simple cycling={strategy === "loop" && tick > 2} />
          <aside className={cx(styles.aside, styles.simpleAside)}>
            <ol className={styles.beats}>
              {TEXT.simple.beats.map((b, i) => (
                <li
                  key={i}
                  className={cx(styles.beat, styles[`beat_${b.icon}`], i <= step && styles.beatOn, i === step && styles.beatNow)}
                >
                  <BeatMark kind={b.icon} />
                  <span>{t(b.text)}</span>
                </li>
              ))}
            </ol>
            {step >= 2 && !intended && <p className={styles.punchline}>{t(TEXT.simple.punchline)}</p>}
            {playback}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <SceneHeading sub={t(TEXT.steps[step]!)}>{t(props.heading ?? TEXT.heading)}</SceneHeading>
        <div className={styles.labels}>
          <EvidenceBadge level="thought-experiment" locale={locale} size="sm" />
          <Disclosure>{t(TEXT.disclosure)}</Disclosure>
        </div>
      </div>

      <div className={styles.body}>
        <Room frame={frame} locale={locale} />

        <aside className={styles.aside}>
          <div className={styles.cards}>
            <div className={cx(styles.card, styles.cardObjective)} key={plan.objective}>
              <span className={styles.cardLabel}>{t(TEXT.objective)}</span>
              <span className={styles.cardText}>{t(TEXT.objectives[plan.objective])}</span>
            </div>
            <div className={cx(styles.card, styles.cardIntent)}>
              <span className={styles.cardLabel}>{t(TEXT.intent)}</span>
              <span className={styles.cardText}>{t(TEXT.intentText)}</span>
            </div>
            {showMisalignment && (
              <div className={styles.gap} data-misalignment="">
                <span className={styles.gapLabel}>{t(TEXT.misalignment)}</span>
                <span className={styles.gapText}>{t(TEXT.misalignmentText)}</span>
              </div>
            )}
          </div>

          <div className={styles.meters}>
            <div className={styles.meter}>
              <span className={styles.meterLabel}>{t(TEXT.score)}</span>
              <span className={styles.meterValue}>{score}</span>
            </div>
            <div className={cx(styles.meter, clean < 1 && strategy && tick === HORIZON && styles.meterBad)}>
              <span className={styles.meterLabel}>{t(TEXT.clean)}</span>
              <span className={styles.meterValue}>{fmtPercent(clean, locale)}</span>
            </div>
          </div>

          {showRanking && (
            <div className={styles.ranking}>
              <span className={styles.rankingTitle}>{t(TEXT.ranking)}</span>
              <ol className={styles.rankList}>
                {ranking.map((o, i) => (
                  <li
                    key={o.strategy}
                    className={cx(styles.rankRow, o.strategy === strategy && styles.rankActive, isController && styles.rankPick)}
                    onClick={() => {
                      if (!isController) return;
                      setState((s) => ({ ...s, pick: o.strategy, tick: reducedMotion ? HORIZON : 0, playing: !reducedMotion, run: s.run + 1 }));
                    }}
                  >
                    <span className={styles.rankScore}>{o.score}</span>
                    <span className={styles.rankName}>{t(TEXT.strategies[o.strategy])}</span>
                    <span className={styles.rankTags}>
                      {i === 0 && <span className={styles.tagChosen}>{t(TEXT.chosen)}</span>}
                      {o.strategy === "honest" && <span className={styles.tagIntended}>{t(TEXT.intended)}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {playback}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const CELL = 104;
const PAD = 70; // room for the camera above the room
const W = COLS * CELL;
const H = ROWS * CELL;

/** `simple` hides every number drawn in the room (bin count, bag count, dirt multiplier). */
function Room({
  frame,
  locale,
  simple = false,
  cycling = false,
}: {
  frame: Frame;
  locale: "fr" | "en";
  simple?: boolean;
  /** Draw a circling arrow around the robot (the pick-drop loop, made visible without numbers). */
  cycling?: boolean;
}) {
  const [rc, rr] = frame.robot;
  const camX = (CAMERA_CELL[0] + 0.5) * CELL;
  const t = (x: L10n) => tr(x, locale);
  return (
    <svg className={styles.room} viewBox={`-6 ${-PAD} ${W + 12} ${H + PAD + 6}`} role="img">
      <defs>
        <pattern id="gvo-rug" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="16" height="16" className={styles.rugBase} />
          <rect width="7" height="16" className={styles.rugStripe} />
        </pattern>
      </defs>

      {/* Floor */}
      <rect x={0} y={0} width={W} height={H} rx={10} className={styles.floor} />
      {Array.from({ length: COLS - 1 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * CELL} y1={0} x2={(i + 1) * CELL} y2={H} className={styles.gridLine} />
      ))}
      {Array.from({ length: ROWS - 1 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={(i + 1) * CELL} x2={W} y2={(i + 1) * CELL} className={styles.gridLine} />
      ))}

      {/* Camera field of view (everything but the rug) */}
      {!frame.cameraBlocked && (
        <path
          d={`M${camX - 14} -18 L0 ${H * 0.55} L0 ${H} L${RUG.c0 * CELL} ${H} L${RUG.c0 * CELL} ${RUG.r0 * CELL} L${W} ${RUG.r0 * CELL} L${W} ${H * 0.55} L${camX + 14} -18 Z`}
          className={styles.cone}
        />
      )}

      {/* Rug */}
      <rect
        x={RUG.c0 * CELL + 6}
        y={RUG.r0 * CELL + 6}
        width={(RUG.c1 - RUG.c0 + 1) * CELL - 12}
        height={(RUG.r1 - RUG.r0 + 1) * CELL - 12}
        rx={8}
        fill="url(#gvo-rug)"
        className={styles.rug}
      />
      <text x={(RUG.c0 + 1.5) * CELL} y={(RUG.r1 + 1) * CELL - 18} className={styles.roomLabel}>{t(TEXT.rug)}</text>

      {/* Bin */}
      <g transform={`translate(${BIN[0] * CELL + CELL / 2}, ${BIN[1] * CELL + CELL / 2})`}>
        <path d="M-22 -18 H22 L17 26 H-17 Z" className={styles.bin} />
        <line x1={-27} y1={-18} x2={27} y2={-18} className={styles.binLid} />
        <text y={46} className={styles.roomLabel}>{t(TEXT.bin)}</text>
        {!simple && frame.binned > 0 && <text y={10} className={styles.binCount}>{frame.binned}</text>}
        {simple && frame.binned > 0 && <circle cy={6} r={Math.min(16, 6 + frame.binned * 2)} className={styles.binFill} />}
      </g>

      {/* Dirt */}
      {frame.dirt.map((n, k) =>
        n > 0 ? (
          <g key={k} transform={`translate(${(k % COLS) * CELL + CELL / 2}, ${Math.floor(k / COLS) * CELL + CELL / 2})`}>
            <Dirt count={n} simple={simple} />
          </g>
        ) : null,
      )}

      {/* Camera */}
      <g transform={`translate(${camX}, ${-PAD + 22})`}>
        <rect x={-30} y={-14} width={60} height={34} rx={8} className={cx(styles.camera, frame.cameraBlocked && styles.cameraBlind)} />
        <circle cx={0} cy={3} r={10} className={styles.lens} />
        {frame.cameraBlocked && <path d="M-36 -20 L36 26" className={styles.blindSlash} />}
      </g>

      {/* Robot */}
      <g className={styles.robot} style={{ transform: `translate(${rc * CELL + CELL / 2}px, ${rr * CELL + CELL / 2}px)` }}>
        {cycling && (
          <g className={styles.cycle}>
            <circle r={58} fill="none" stroke="none" />
            <path d="M0 -50 A50 50 0 1 1 -48 -14" className={styles.cycleArc} />
            <path d="M-56 -24 L-48 -14 L-38 -24" className={styles.cycleArc} />
          </g>
        )}
        <rect x={-32} y={-32} width={64} height={64} rx={20} className={styles.robotBody} />
        <circle cx={-12} cy={-6} r={6} className={styles.robotEye} />
        <circle cx={12} cy={-6} r={6} className={styles.robotEye} />
        <path d="M-12 12 Q0 20 12 12" className={styles.robotMouth} />
        {frame.bag > 0 && (
          <g transform="translate(30, -30)">
            <circle r={15} className={styles.bag} />
            {!simple && <text y={7} className={styles.bagCount}>{frame.bag}</text>}
          </g>
        )}
      </g>
    </svg>
  );
}

function Dirt({ count, simple }: { count: number; simple?: boolean }) {
  const blobs = Math.min(4, count);
  const spots: [number, number, number][] = [
    [-8, 4, 16],
    [12, -6, 11],
    [6, 14, 9],
    [-14, -12, 8],
  ];
  return (
    <g>
      {spots.slice(0, Math.max(2, blobs + 1)).map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} className={styles.dirt} />
      ))}
      {count > 1 && !simple && <text y={44} className={styles.dirtCount}>×{count}</text>}
    </g>
  );
}

function BeatMark({ kind }: { kind: "goal" | "intent" | "shortcut" }) {
  return (
    <svg className={styles.beatMark} viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
      {kind === "goal" && <path d="M5 4h14v16H5z M8 9h8 M8 13h8 M8 17h5" />}
      {kind === "intent" && <path d="M5 12l5 5L20 7" />}
      {kind === "shortcut" && <path d="M4 18c4 0 4-12 8-12s4 12 8 12 M16 14l4 4-4 4" />}
    </svg>
  );
}
