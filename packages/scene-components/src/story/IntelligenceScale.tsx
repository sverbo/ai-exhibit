import type { CSSProperties, ReactNode } from "react";
import { tr, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import styles from "./IntelligenceScale.module.css";

/*
 * A thought experiment drawn as figures standing on one ground line: an ant,
 * a human, an AI at human level (AGI), then a superintelligence (ASI) too big
 * for the frame. Heights are symbolic, not measurements of anything.
 *
 * Figures live in "world" units (ground at y = 0, up is negative). A camera
 * (zoom and horizontal centre) per step maps them onto the 1920 x 1080 stage:
 * screenX = ORIGIN_X + (x - cx) * zoom, screenY = GROUND_Y + y * zoom.
 */

const ORIGIN_X = 960;
const GROUND_Y = 860;

type FigureId = "ant" | "human" | "agi" | "asi";

interface Figure {
  id: FigureId;
  /** Step at which it appears. */
  step: number;
  /** Centre x on the ground, in world units. */
  x: number;
  w: number;
  h: number;
  name: L10n;
  sub?: L10n;
}

export const FIGURES: Figure[] = [
  { id: "ant", step: 0, x: -700, w: 40, h: 18, name: { en: "Ant" } },
  { id: "human", step: 1, x: -260, w: 200, h: 560, name: { en: "Human" } },
  {
    id: "agi",
    step: 2,
    x: 120,
    w: 200,
    h: 580,
    name: { en: "AGI" },
    sub: { en: "AI at human level" },
  },
  {
    id: "asi",
    step: 5,
    x: 1000,
    w: 793,
    h: 2300,
    name: { en: "ASI" },
    sub: { en: "Superintelligence, far beyond us" },
  },
];

/** Camera per step: the ant fills the view at first, then the view pulls back. */
export const CAMERAS: { zoom: number; cx: number }[] = [
  { zoom: 12, cx: -700 },
  { zoom: 1, cx: -480 },
  { zoom: 1, cx: -290 },
  { zoom: 0.7, cx: -100 },
  { zoom: 0.7, cx: -100 },
  { zoom: 0.62, cx: 90 },
];

/** The step where the single AGI becomes a crowd of identical copies. */
export const CROWD_STEP = 3;

/** The step where the copies improve AI research, and so themselves: they grow each turn. */
export const LOOP_STEP = 4;

/** Growth of the AGI figures after each of the three turns of the loop. */
export const LOOP_GROWTH = [1, 1.15, 1.32, 1.5];

/** The loop, top to bottom; the last node feeds back into the first. */
export const LOOP_NODES: L10n[] = [
  { en: "AI does AI research" },
  { en: "a better AI" },
  { en: "even faster research" },
];

/** Name of the loop, shown above it. */
export const LOOP_NAME: L10n = {
  en: "RSI: recursive self-improvement",
};

export const LOOP_CAPTION: L10n = {
  en: "each turn, it gets better at getting better",
};

/**
 * Copies of the AGI figure: a front row on the ground running past the right
 * edge of the frame (no end in sight), and a fainter row behind it.
 */
export const CROWD: { x: number; y: number; scale: number; row: "front" | "back"; order: number }[] = [
  ...Array.from({ length: 13 }, (_, k) => ({ x: 5 + k * 230, y: -46, scale: 0.85, row: "back" as const, order: k })),
  ...Array.from({ length: 12 }, (_, k) => ({ x: 120 + (k + 1) * 230, y: 0, scale: 1, row: "front" as const, order: k })),
];

/** Short traits shown with the crowd. */
export const CROWD_TRAITS: L10n[] = [
  { en: "copies without limit" },
  { en: "never tired, never sleeps" },
  { en: "expert level in every field" },
];

export const INTELLIGENCE_STEPS = CAMERAS.length - 1;

export function screenX(x: number, step: number): number {
  const cam = CAMERAS[step]!;
  return ORIGIN_X + (x - cam.cx) * cam.zoom;
}

const COPY = {
  label: { en: "A thought experiment about scales of intelligence" },
  notMeasured: { en: "not a measurement" },
} as const;

/** Simple silhouettes, filled with the current text color of their wrapper. */
function Silhouette({ id }: { id: FigureId }): ReactNode {
  switch (id) {
    case "ant":
      return (
        <svg viewBox="0 0 40 18" className={styles.svg} aria-hidden="true">
          <g fill="currentColor">
            <ellipse cx="9" cy="9.5" rx="8" ry="5.5" />
            <ellipse cx="22" cy="10" rx="5.5" ry="3.6" />
            <circle cx="32.5" cy="8.5" r="4.2" />
          </g>
          <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none">
            <path d="M19 12 L15 17.5 M22 12.5 L21 17.5 M25 12 L28 17.5" />
            <path d="M34 5 Q36 0.5 39.5 1 M32 4.5 Q32 0.2 35.5 0" />
          </g>
        </svg>
      );
    case "human":
      return (
        <svg viewBox="0 0 200 560" className={styles.svg} aria-hidden="true">
          <g fill="currentColor">
            <circle cx="100" cy="52" r="48" />
            <rect x="42" y="112" width="116" height="222" rx="40" />
            <rect x="6" y="120" width="30" height="196" rx="15" />
            <rect x="164" y="120" width="30" height="196" rx="15" />
            <rect x="46" y="300" width="50" height="260" rx="22" />
            <rect x="104" y="300" width="50" height="260" rx="22" />
          </g>
        </svg>
      );
    default:
      // The AI figures share one robot-like pictogram: square head, a chip on the chest.
      return (
        <svg viewBox="0 0 200 580" className={styles.svg} aria-hidden="true">
          <g fill="currentColor">
            <rect x="52" y="0" width="96" height="100" rx="18" />
            <rect x="92" y="100" width="16" height="16" />
            <rect x="38" y="114" width="124" height="232" rx="22" />
            <rect x="4" y="124" width="28" height="200" rx="10" />
            <rect x="168" y="124" width="28" height="200" rx="10" />
            <rect x="44" y="314" width="52" height="266" rx="14" />
            <rect x="104" y="314" width="52" height="266" rx="14" />
          </g>
          <g fill="var(--color-bg)">
            <circle cx="80" cy="46" r="10" />
            <circle cx="120" cy="46" r="10" />
            <rect x="74" y="168" width="52" height="52" rx="6" />
          </g>
        </svg>
      );
  }
}

/**
 * IntelligenceScale {}: steps 0 to 5 add the ant, the human, one AGI, the AGI
 * crowd (copies without limit, with three traits), the self-improvement loop
 * (the copies grow each turn), then ASI.
 * No state; the projector follows the step. Preview shows the last step still.
 */
export function IntelligenceScale({ ctx }: SceneComponentProps<Record<string, never>>) {
  const { locale, role } = ctx;
  const step = role === "preview" ? INTELLIGENCE_STEPS : Math.max(0, Math.min(INTELLIGENCE_STEPS, ctx.revealStep));
  const still = role === "preview" || ctx.reducedMotion;
  const cam = CAMERAS[step]!;
  const crowd = step === CROWD_STEP || step === LOOP_STEP;
  const worldStyle: CSSProperties = { transform: `translateX(${-cam.cx * cam.zoom}px) scale(${cam.zoom})` };

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} aria-label={tr(COPY.label, locale)} data-step={step}>
      <p className={styles.badge}>
        <EvidenceBadge level="thought-experiment" locale={locale} size="lg" />
        <span className={styles.notMeasured}>{tr(COPY.notMeasured, locale)}</span>
      </p>

      <div className={styles.world} style={worldStyle}>
        {CROWD.map((c) => {
          const agi = FIGURES.find((f) => f.id === "agi")!;
          const w = agi.w * c.scale;
          const h = agi.h * c.scale;
          return (
            <div
              key={`${c.row}-${c.order}`}
              className={`${styles.figure} ${styles.copy} ${crowd ? styles.shown : styles.hidden} ${step === LOOP_STEP ? styles.grow : ""}`}
              data-row={c.row}
              style={{ left: c.x - w / 2, top: c.y - h, width: w, height: h, transitionDelay: step === CROWD_STEP ? `${200 + c.order * 90}ms` : "0ms" }}
              aria-hidden="true"
            >
              <Silhouette id="agi" />
            </div>
          );
        })}
        {FIGURES.map((f) => (
          <div
            key={f.id}
            className={`${styles.figure} ${f.step <= step ? styles.shown : styles.hidden} ${f.id === "agi" && step === LOOP_STEP ? styles.grow : ""}`}
            data-figure={f.id}
            style={{ left: f.x - f.w / 2, top: -f.h, width: f.w, height: f.h }}
          >
            <Silhouette id={f.id} />
          </div>
        ))}
      </div>

      <div className={styles.ground} aria-hidden="true" />

      <ul className={`${styles.traits} ${step === CROWD_STEP ? styles.shown : styles.hidden}`} aria-hidden={step !== CROWD_STEP}>
        {CROWD_TRAITS.map((t, i) => (
          <li key={t.en} className={styles.trait} style={{ animationDelay: `${1100 + i * 450}ms` }}>
            {tr(t, locale)}
          </li>
        ))}
      </ul>

      <figure className={`${styles.loop} ${step === LOOP_STEP ? styles.shown : styles.hidden}`} aria-hidden={step !== LOOP_STEP}>
        <p className={styles.loopName}>{tr(LOOP_NAME, locale)}</p>
        <div className={styles.loopBody}>
        <svg viewBox="0 0 640 330" className={styles.loopSvg} aria-hidden="true">
          <defs>
            <marker id="is-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <g className={styles.loopLines} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
            <path d="M260 76 L260 106" markerEnd="url(#is-arrow)" />
            <path d="M260 186 L260 216" markerEnd="url(#is-arrow)" />
            <path d="M492 256 C 616 256, 616 36, 496 36" markerEnd="url(#is-arrow)" />
          </g>
          <circle className={styles.loopDot} r="11" />
        </svg>
        <ol className={styles.loopNodes}>
          {LOOP_NODES.map((n) => (
            <li key={n.en} className={styles.loopNode}>
              {tr(n, locale)}
            </li>
          ))}
        </ol>
        </div>
        <figcaption className={styles.loopCaption}>{tr(LOOP_CAPTION, locale)}</figcaption>
      </figure>

      {FIGURES.map((f) => (
        <div
          key={f.id}
          className={`${styles.label} ${f.step <= step ? styles.shown : styles.hidden}`}
          data-figure={f.id}
          style={{ left: screenX(f.x, step) }}
          aria-hidden={f.step > step}
        >
          <span className={styles.name}>{tr(f.name, locale)}</span>
          {f.sub ? <span className={styles.sub}>{tr(f.sub, locale)}</span> : null}
        </div>
      ))}
    </div>
  );
}
