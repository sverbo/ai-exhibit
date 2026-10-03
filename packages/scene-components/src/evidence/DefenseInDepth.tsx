import { plainText, tr, type L10n } from "@ai-exhibit/presentation-core";
import { useMemo } from "react";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { formatNumber, stopShellKeys } from "./shared.ts";
import { SourceList } from "./SourceList.tsx";
import {
  alignedHazard, type DefenseState, demoHazards, type Hazard, launch, makeLayers, record,
} from "./swissCheese.ts";
import common from "./common.module.css";
import styles from "./DefenseInDepth.module.css";

export interface DefenseInDepthProps {
  layers?: L10n[];
}

export const DEFAULT_LAYERS: L10n[] = [
  { en: "Training" },
  { en: "Evaluations" },
  { en: "Interpretability" },
  { en: "Monitoring" },
  { en: "Sandboxing and permissions" },
  { en: "Governance" },
];

/** Source for the Swiss-cheese model itself (registry: content/sources/control-and-governance.ts). */
export const SWISS_CHEESE_SOURCE = "cg-reason-2000-swiss-cheese";

const COPY = {
  firstLayer: { en: "Every safety layer has holes." },
  moreLayers: { en: "Another layer can cover a gap in the previous one." },
  demo: { en: "Most problems are stopped by one layer or another." },
  aligned: { en: "Rarely, the holes line up. No single layer is enough." },
  hazard: { en: "Problem" },
  harm: { en: "Harm" },
  send1: { en: "Send a problem" },
  send20: { en: "Send 20" },
  reset: { en: "Reset counts" },
  attempts: { en: "sent" },
  passed: { en: "got through" },
  note: {
    en: "Holes are drawn for illustration. These counts come from this drawing, not from real systems.",
  },
  model: { en: "Swiss-cheese model, after James Reason" },
} as const;

// Stage geometry (SVG units = stage pixels).
const VIEW_W = 1792;
const VIEW_H = 700;
const FW = 150; // foreshortened slice width
const FH = 500; // slice height
const SKEW = 70; // vertical offset of the far edge
const Y0 = 120;
const X_START = 280;
const X_END = VIEW_W - 260;

function point(x0: number, u: number, v: number): [number, number] {
  return [x0 + u * FW, Y0 + v * FH - u * SKEW + SKEW];
}

export function DefenseInDepth({ props, ctx }: SceneComponentProps<DefenseInDepthProps, DefenseState>) {
  const { locale, role } = ctx;
  const names = props.layers?.length ? props.layers : DEFAULT_LAYERS;
  const n = names.length;
  const layers = useMemo(() => makeLayers(n), [n]);
  const demo = useMemo(() => demoHazards(layers), [layers]);
  const aligned = useMemo(() => alignedHazard(layers), [layers]);
  const step = role === "preview" ? n + 1 : ctx.revealStep;
  const visible = Math.min(n, step + 1);
  const gap = n > 1 ? Math.min(280, (X_END - X_START - FW) / (n - 1)) : 0;
  const xs = names.map((_, i) => X_START + i * gap);
  const interactive = role === "controller";
  const allShown = visible === n;

  let hazards: { h: Hazard; kind: "demo" | "aligned" | "live" }[] = [];
  if (allShown && step >= n) hazards = demo.map((h) => ({ h, kind: "demo" as const }));
  if (step >= n + 1) hazards.push({ h: aligned, kind: "aligned" });
  if (allShown && ctx.state?.recent.length) {
    hazards = [...hazards, ...ctx.state.recent.map((h) => ({ h, kind: "live" as const }))];
  }

  const caption = step >= n + 1 ? COPY.aligned : step >= n ? COPY.demo : step === 0 ? COPY.firstLayer : COPY.moreLayers;

  const send = (count: number) => {
    if (!interactive) return;
    ctx.setState(record(ctx.state, Array.from({ length: count }, () => launch(layers, Math.random))));
  };

  const lastX = (xs[n - 1] ?? X_START) + FW;

  return (
    <div className={`${styles.root} ${ctx.reducedMotion || role === "preview" ? common.still : ""}`}>
      <p className={styles.caption} key={caption.en}>
        <Rich text={tr(caption, locale)} />
      </p>

      <svg className={styles.svg} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={plainText(tr(caption, locale))}>
        <defs>
          <marker id="did-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" className={styles.arrowHead} />
          </marker>
        </defs>

        <text className={styles.endLabel} x={0} y={Y0 + FH / 2 + SKEW / 2} dominantBaseline="middle">
          {tr(COPY.hazard, locale)}
        </text>
        {step >= n + 1 ? (
          <text className={`${styles.endLabel} ${styles.harm}`} x={VIEW_W - 40} y={Y0 + FH / 2 + SKEW / 2} textAnchor="end" dominantBaseline="middle">
            {tr(COPY.harm, locale)}
          </text>
        ) : null}

        {names.map((name, i) => {
          const x0 = xs[i]!;
          const shown = i < visible;
          return (
            <g key={i} className={`${styles.slice} ${shown ? styles.shown : styles.hidden}`}>
              <g transform={`matrix(${FW} ${-SKEW} 0 ${FH} ${x0} ${Y0 + SKEW})`}>
                <polygon className={styles.face} points="0,0 1,0 1,1 0,1" vectorEffect="non-scaling-stroke" />
                {layers[i]!.map((hole, k) => (
                  <ellipse
                    key={k}
                    className={styles.hole}
                    cx={hole.u}
                    cy={hole.v}
                    rx={hole.r}
                    ry={hole.r / 1.4}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
              <foreignObject x={x0 - 60} y={Y0 + FH + SKEW + 24} width={FW + 120} height={110}>
                <div className={styles.layerName}>
                  <Rich text={tr(name, locale)} />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {hazards.map(({ h, kind }, k) => {
          const [, y] = point(0, h.u, h.v);
          const endX = h.stop === -1 ? (step >= n + 1 ? VIEW_W - 200 : lastX + 60) : point(xs[h.stop]!, h.u, h.v)[0];
          const cls = kind === "aligned" ? styles.alignedPath : kind === "live" ? styles.livePath : styles.demoPath;
          return (
            <g key={`${kind}-${k}`} className={cls}>
              <line x1={210} y1={y} x2={endX} y2={y} markerEnd={h.stop === -1 ? "url(#did-arrow)" : undefined} />
              {h.stop !== -1 ? (
                <path className={styles.stopMark} d={`M${endX - 12} ${y - 12} l24 24 M${endX + 12} ${y - 12} l-24 24`} />
              ) : null}
            </g>
          );
        })}
      </svg>

      <footer className={styles.footer}>
        <SourceList sourceIds={[SWISS_CHEESE_SOURCE]} role={role} locale={locale} getSource={ctx.getSource} compact />
        {interactive && allShown ? (
          <div className={common.controls} onKeyDown={stopShellKeys}>
            <button type="button" className={common.button} onClick={() => send(1)}>{tr(COPY.send1, locale)}</button>
            <button type="button" className={common.button} onClick={() => send(20)}>{tr(COPY.send20, locale)}</button>
            <button
              type="button"
              className={common.button}
              disabled={!ctx.state}
              onClick={() => ctx.setState({ attempts: 0, passed: 0, recent: [] })}
            >
              {tr(COPY.reset, locale)}
            </button>
          </div>
        ) : null}
        {ctx.state && ctx.state.attempts > 0 && allShown ? (
          <p className={styles.counts}>
            <span>{formatNumber(ctx.state.attempts, locale)} {tr(COPY.attempts, locale)}</span>
            <span className={styles.passedCount}>{formatNumber(ctx.state.passed, locale)} {tr(COPY.passed, locale)}</span>
            <span className={styles.note}>{tr(COPY.note, locale)}</span>
          </p>
        ) : null}
      </footer>
    </div>
  );
}
