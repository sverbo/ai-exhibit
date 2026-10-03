import type { Locale } from "@ai-exhibit/presentation-core";
import type { ReactNode } from "react";
import { cx } from "../../learning/shared/ui.tsx";
import { pushesBasketball, type SimpleActivity, type SimpleView } from "../data/simple.ts";
import type { Sport } from "../data/text.ts";
import styles from "../TextClassifierLab.module.css";
import { SportGlyph } from "./glyphs.tsx";

/**
 * One big, readable network: the sentence's words on the left (a "1" when
 * present), a few hidden neurons, two outputs with their percentage. Line
 * thickness is the weight's size, tone the sport it pushes toward (accent:
 * basketball, accent-2: football). SVG, so every change of weight animates
 * (CSS transitions on thickness and tone; none when motion is reduced).
 * Words are HTML list items: separate blocks for every reader.
 */

export interface LineLabel {
  /** Drawn neuron n, drawn word k. */
  n: number;
  k: number;
  text: string;
  dir?: "up" | "down";
}

export interface SimpleNetProps {
  locale: Locale;
  view: SimpleView;
  act?: SimpleActivity | null;
  width: number;
  height: number;
  /** Thickness references (input-to-neuron, neuron-to-output). */
  scale: [number, number];
  /** What is revealed: weights (thickness and tone), neuron values, outputs. */
  show: { inputs: boolean; weights: boolean; neurons: boolean; outputs: boolean };
  label: (s: Sport) => string;
  /** Numbers written on some input-to-neuron lines. */
  lineLabels?: LineLabel[];
  /** Write every neuron's value inside it (the hood). */
  allNumbers?: boolean;
  /** Bars next to the outputs; `gapFor` hatches the missing part of that sport's bar. */
  bars?: boolean;
  gapFor?: Sport | null;
  /** Mark next to the output the network picked. */
  verdictMark?: ReactNode;
  /**
   * The weights before a nudge: every line that moved gets a halo as wide as
   * its move (relative to the biggest move).
   */
  movedFrom?: SimpleView;
  /** Animate changes (off for reduced motion and previews). */
  animate: boolean;
}

const fmt = (v: number, locale: Locale) => {
  const s = Math.abs(v).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return Math.abs(v) < 0.005 ? s : v < 0 ? `−${s}` : s;
};

export function pctText(p: number, locale: Locale): string {
  const n = p > 0.995 ? ">99" : p < 0.005 ? "<1" : String(Math.round(p * 100));
  return locale === "fr" ? `${n} %` : `${n}%`;
}

export function SimpleNet({
  locale,
  view,
  act,
  width,
  height,
  scale,
  show,
  label,
  lineLabels = [],
  allNumbers,
  bars,
  gapFor,
  verdictMark,
  movedFrom,
  animate,
}: SimpleNetProps) {
  const K = view.words.length;
  const N = view.neurons.length;
  const chipRight = Math.round(width * 0.2);
  const inX = chipRight + 30;
  const outX = width - (bars ? 470 : 330);
  const hidX = Math.round(inX + (outX - inX) * 0.48);
  const rowGap = Math.min(66, (height - 60) / Math.max(1, K - 1));
  const inY = (k: number) => height / 2 + (k - (K - 1) / 2) * rowGap;
  const hidGap = Math.min(104, (height - 90) / Math.max(1, N - 1));
  const hidY = (n: number) => height / 2 + (n - (N - 1) / 2) * hidGap;
  const outY: Record<Sport, number> = { football: height * 0.28, basketball: height * 0.72 };
  const R_IN = 17;
  const R_HID = 38;
  const R_OUT = 56;

  const w1Width = (w: number) => 1.5 + 15 * Math.min(1, Math.abs(w) / scale[0]);
  const w2Width = (w: number) => 2 + 16 * Math.min(1, Math.abs(w) / scale[1]);
  const present = (k: number) => (act ? act.inputs[k]! > 0 : true);
  const maxMove = movedFrom
    ? Math.max(...view.w1.flatMap((row, n) => row.map((w, k) => Math.abs(w - movedFrom.w1[n]![k]!))), ...view.w2.map((w, n) => Math.abs(w - movedFrom.w2[n]!))) || 1
    : 1;
  const halo = (d: number) => ({ cls: styles.haloMoved, width: 4 + 20 * Math.min(1, Math.abs(d) / maxMove), on: Math.abs(d) / maxMove > 0.08 });
  const verdict: Sport | null = act ? (act.p >= 0.5 ? "basketball" : "football") : null;

  // Where a neuron's line to the output goes: the sport it pushes toward right now (or by its weight alone).
  const pushTo = (n: number): Sport => {
    const w = view.w2[n]!;
    const v = show.neurons && act ? act.hidden[n]! * w : w;
    return v >= 0 ? "basketball" : "football";
  };
  const at = (t: number, x1: number, y1: number, x2: number, y2: number) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t] as const;

  return (
    <div className={cx(styles.simpleNet, animate && styles.simpleAnimate)} style={{ width, height }}>
      <svg className={styles.simpleSvg} viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        {/* Words to neurons. */}
        {view.w1.map((row, n) =>
          row.map((w, k) => {
            const toB = pushesBasketball(view, n, k);
            const lit = present(k);
            return (
              <g key={`l${n}-${k}`}>
                {movedFrom &&
                  (() => {
                    const h = halo(w - movedFrom.w1[n]![k]!);
                    return h.on ? (
                      <line className={cx(styles.linePulse, h.cls)} x1={inX + R_IN} y1={inY(k)} x2={hidX - R_HID} y2={hidY(n)} style={{ strokeWidth: w1Width(w) + h.width }} />
                    ) : null;
                  })()}
                <line
                  className={cx(styles.simpleLine, show.weights ? (toB ? styles.lineB : styles.lineF) : styles.lineBare, !lit && styles.lineOff)}
                  x1={inX + R_IN}
                  y1={inY(k)}
                  x2={hidX - R_HID}
                  y2={hidY(n)}
                  style={{ strokeWidth: show.weights ? w1Width(w) : 2 }}
                />
              </g>
            );
          }),
        )}
        {/* Neurons to the output they push toward. */}
        {view.w2.map((w, n) => {
          const to = pushTo(n);
          const strength = show.neurons && act ? Math.abs(act.hidden[n]!) : 1;
          const h = movedFrom ? halo(w - movedFrom.w2[n]!) : null;
          return (
            <g key={`o${n}`}>
            {h?.on && (
              <line className={cx(styles.linePulse, h.cls)} x1={hidX + R_HID} y1={hidY(n)} x2={outX - R_OUT} y2={outY[to]} style={{ strokeWidth: w2Width(w) + h.width }} />
            )}
            <line
              className={cx(styles.simpleLine, show.weights ? (to === "basketball" ? styles.lineB : styles.lineF) : styles.lineBare)}
              x1={hidX + R_HID}
              y1={hidY(n)}
              x2={outX - R_OUT}
              y2={outY[to]}
              style={{ strokeWidth: show.weights ? w2Width(w) * (0.35 + 0.65 * strength) : 2 }}
            />
            </g>
          );
        })}
        {/* Numbers on lines. */}
        {lineLabels.map((l) => {
          // Near the word's end of the line, anchored left: one label per word row, so they never pile up.
          const [x, y] = at(0.1, inX + R_IN, inY(l.k), hidX - R_HID, hidY(l.n));
          const w = l.text.length * 15.2 + (l.dir ? 30 : 0) + 24;
          return (
            <g key={`t${l.n}-${l.k}`} className={styles.lineLabel} transform={`translate(${x} ${y})`}>
              <rect x={0} y={-21} width={w} height={42} rx={21} />
              <text x={12} y={8}>
                {l.text}
                {l.dir && <tspan className={l.dir === "up" ? styles.dirUp : styles.dirDown}>{l.dir === "up" ? " \u25b2" : " \u25bc"}</tspan>}
              </text>
            </g>
          );
        })}
        {/* Nodes. */}
        {view.words.map((_, k) => (
          <g key={`i${k}`} className={cx(styles.inNode, show.inputs && present(k) && styles.inNodeOn)}>
            <circle cx={inX} cy={inY(k)} r={R_IN} />
            {show.inputs && (
              <text x={inX} y={inY(k) + 7} textAnchor="middle">
                {present(k) ? "1" : "0"}
              </text>
            )}
          </g>
        ))}
        {view.neurons.map((_, n) => {
          const h = act && show.neurons ? act.hidden[n]! : 0;
          const toB = h * view.w2[n]! >= 0;
          return (
            <g key={`h${n}`} className={cx(styles.hidNode, toB ? styles.toneBasketball : styles.toneFootball, show.neurons && act && styles.hidNodeOn)}>
              <circle cx={hidX} cy={hidY(n)} r={R_HID} style={{ fillOpacity: Math.min(1, Math.abs(h)) * 0.9 }} />
              {allNumbers && act && (
                <text x={hidX} y={hidY(n) + 8} textAnchor="middle">
                  {fmt(h, locale)}
                </text>
              )}
            </g>
          );
        })}
        {(["football", "basketball"] as const).map((sport) => {
          const p = act ? (sport === "basketball" ? act.p : 1 - act.p) : 0;
          return (
            <g key={sport} className={cx(styles.outNode, sport === "football" ? styles.toneFootball : styles.toneBasketball)}>
              <circle cx={outX} cy={outY[sport]} r={R_OUT} style={{ fillOpacity: show.outputs ? p : 0 }} />
            </g>
          );
        })}
      </svg>
      <ul className={styles.chips} aria-label={view.words.map((w) => w.label).join(", ")}>
        {view.words.map((w, k) => (
          <li
            key={k}
            className={cx(styles.chip, show.inputs && present(k) && styles.chipOn)}
            style={{ position: "absolute", top: inY(k), right: width - chipRight }}
          >
            {w.label}
          </li>
        ))}
      </ul>
      {(["football", "basketball"] as const).map((sport) => {
        const p = act ? (sport === "basketball" ? act.p : 1 - act.p) : 0;
        return (
          <div
            key={sport}
            className={cx(styles.outLabel, sport === "football" ? styles.toneFootball : styles.toneBasketball, show.outputs && verdict === sport && styles.outLabelOn)}
            style={{ position: "absolute", top: outY[sport], left: outX + R_OUT + 20 }}
          >
            <span className={styles.outRow}>
              <SportGlyph sport={sport} size={44} />
              <span className={styles.outName}>{label(sport)}</span>
              {show.outputs && verdict === sport && verdictMark}
            </span>
            <span className={styles.outRow} style={{ visibility: show.outputs && act ? "visible" : "hidden" }}>
              {bars && (
                <span className={styles.outTrack}>
                  <span className={styles.outFill} style={{ width: `${p * 100}%` }} />
                  {gapFor === sport && <span className={styles.outGap} style={{ left: `${p * 100}%` }} />}
                </span>
              )}
              <span className={styles.outPct}>{pctText(p, locale)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
