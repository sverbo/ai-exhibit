import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import type { Locale } from "@ai-exhibit/presentation-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { TRAINING, tr } from "./copy.ts";
import { clusterColor } from "./data.ts";
import { InteractiveMap } from "./InteractiveMap.tsx";
import { fitBox, MapView } from "./MapView.tsx";
import { NeighbourCard, selectionMarks } from "./Selection.tsx";
import type { Camera } from "./view.ts";
import styles from "./Training.module.css";

const MARGIN = 40;
/** The word shown as a list of numbers (in the audience's language); its translation is highlighted at step 2. */
export const SHOWCASE_WORD: Record<Locale, string> = { en: "cat", fr: "chat" };
/** Groups singled out at step 2. */
export const FOCUS_GROUPS = ["animals", "emotions", "countries", "capitals"];
/** Total length of the illustrative training animation. */
export const TRAINING_MS = 5200;

/** mulberry32, so every screen draws the same "random" start. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where the "cat as numbers" card sits (map pixels). */
export const CARD_RECT = { x0: 1208, y0: 0, x1: 1728, y1: 235 };
const CARD_AVOID = [CARD_RECT];
/** Spread of the starting cloud, in map pixels (standard deviation). */
export const START_SPREAD = 46;

/**
 * Deterministic start positions in map pixels: a tight random cloud around the
 * centre, because embeddings start as small random values near zero.
 */
export function randomStart(count: number, width: number, height: number): [number, number][] {
  const r = rng(20261002);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: count }, () => [width / 2 + gauss() * START_SPREAD, height / 2 + gauss() * START_SPREAD]);
}

/** Deterministic "untrained" numbers for the showcase word: small random values near zero. */
export function randomVector(length: number): number[] {
  const r = rng(7);
  return Array.from({ length }, () => Math.round((r() * 2 - 1) * 0.02 * 1000) / 1000);
}

/** Big moves first, then small refinements: the shape of a learning curve. */
function formatVectorValue(x: number, locale: Locale): string {
  return x.toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Position of point `i` at global progress `t` in [0, 1]: each point starts a
 * little later than the previous ones, moves fast then slows down while it
 * wanders less and less, and lands exactly on its final position at t = 1.
 */
export function trainingPosition(
  start: readonly [number, number],
  end: readonly [number, number],
  i: number,
  t: number,
): [number, number] {
  const delay = ((i * 0.618034) % 1) * 0.3;
  const local = Math.min(1, Math.max(0, (t - delay) / (1 - delay)));
  const e = easeOut(local);
  const wobble = Math.sin(local * Math.PI) * (1 - local) * 26;
  const phase = i * 2.39996;
  return [
    start[0] + (end[0] - start[0]) * e + Math.cos(phase + local * 9) * wobble,
    start[1] + (end[1] - start[1]) * e + Math.sin(phase + local * 7) * wobble,
  ];
}

export interface TrainingViewProps {
  space: EmbeddingSpace;
  locale: Locale;
  width: number;
  height: number;
  step: number;
  /** Bumped by the presenter's Replay button. */
  replay: number;
  /** Jump cuts instead of motion (reduced motion, paused, preview). */
  still: boolean;
  /** Last step: pan, zoom and click words (controller), followed by the projector. */
  explore?: {
    interactive: boolean;
    camera: Camera | null | undefined;
    onCamera: (c: Camera) => void;
    selected: number | null;
    onSelect: (i: number | null) => void;
    reducedMotion: boolean;
    showAll?: boolean;
    onShowAll?: (on: boolean) => void;
  };
}

export function TrainingView({ space, locale, width, height, step, replay, still, explore }: TrainingViewProps) {
  const n = space.items.length;
  const nClusters = space.json.clusters.length;
  const start = useMemo(() => randomStart(n, width, height), [n, width, height]);
  const end = useMemo(() => {
    const coords = space.coords.umap2d;
    const f = fitBox(coords, width, height, MARGIN);
    return coords.map((p) => [f.cx + p[0]! * f.sx, f.cy - p[1]! * f.sy] as [number, number]);
  }, [space, width, height]);
  const showcase = useMemo(() => space.items.findIndex((it) => it.text === SHOWCASE_WORD[locale]), [space, locale]);
  const partner = showcase >= 0 ? space.items[showcase]!.pair : -1;
  const focus = useMemo(
    () => FOCUS_GROUPS.map((id) => space.json.clusters.findIndex((c) => c.id === id)).filter((i) => i >= 0),
    [space],
  );

  // Animate only when the presenter moves from step 0 to step 1 (or presses
  // Replay) while the scene is on screen. Arriving later shows the end state.
  const prev = useRef({ step, replay });
  const [animating, setAnimating] = useState(false);
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const before = prev.current;
    prev.current = { step, replay };
    const advanced = before.step === 0 && step === 1;
    const replayed = step >= 1 && replay !== before.replay;
    if (step === 0) {
      setAnimating(false);
      setLanded(false);
    } else if ((advanced || replayed) && !still) {
      setAnimating(true);
      setLanded(false);
    } else if (advanced || replayed) {
      setAnimating(false);
      setLanded(true);
    }
  }, [step, replay, still]);

  const circles = useRef<(SVGCircleElement | null)[]>([]);
  const showcaseLabel = useRef<SVGGElement | null>(null);
  const bar = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / TRAINING_MS);
      for (let i = 0; i < n; i++) {
        const el = circles.current[i];
        if (!el) continue;
        const [x, y] = trainingPosition(start[i]!, end[i]!, i, t);
        el.setAttribute("cx", x.toFixed(1));
        el.setAttribute("cy", y.toFixed(1));
      }
      if (showcaseLabel.current && showcase >= 0) {
        const [x, y] = trainingPosition(start[showcase]!, end[showcase]!, showcase, t);
        showcaseLabel.current.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      }
      if (bar.current) bar.current.style.width = `${(t * 100).toFixed(1)}%`;
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        setAnimating(false);
        setLanded(true);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animating, n, start, end, showcase]);

  // During the render right after the step change, the effect above has not
  // run yet: treat the animation as already pending so the end state never flashes.
  const pending = !still && ((prev.current.step === 0 && step === 1) || (step >= 1 && replay !== prev.current.replay));
  const trained = step >= 1 && !animating && !pending;
  const vector = useMemo(() => {
    if (showcase < 0) return [];
    return trained ? Array.from(space.vectors[showcase]!.slice(0, 4)) : randomVector(4);
  }, [trained, space, showcase]);

  const selection = selectionMarks(space, explore?.selected);
  const pairOverlay =
    showcase >= 0 && partner >= 0
      ? (px: (p: readonly number[]) => [number, number]) => {
          const [x1, y1] = px(space.coords.umap2d[showcase]!);
          const [x2, y2] = px(space.coords.umap2d[partner]!);
          return (
            <g className={styles.pair}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={34} />
              <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 56} textAnchor="middle">
                {tr(TRAINING.pairNote, locale)}
              </text>
            </g>
          );
        }
      : undefined;

  return (
    <div className={styles.wrap}>
      {trained && step >= 2 && explore ? (
        <>
          <InteractiveMap
            space={space}
            locale={locale}
            width={width}
            height={height}
            colored
            clusterNames
            pairs={false}
            focus={focus}
            highlight={selection.query ? selection.highlight : showcase >= 0 ? [showcase, ...(partner >= 0 ? [partner] : [])] : []}
            query={selection.query}
            zoomTarget={selection.query?.position ?? null}
            showAll={explore.showAll}
            onShowAll={explore.onShowAll}
            labelBudget={160}
            overlay={selection.query ? undefined : pairOverlay}
            interactive={explore.interactive}
            camera={explore.camera}
            onCamera={explore.onCamera}
            onSelect={explore.onSelect}
            reducedMotion={explore.reducedMotion}
          />
          {explore.selected !== null && (
            <NeighbourCard space={space} index={explore.selected} locale={locale} style={{ top: 0, right: 0 }} />
          )}
        </>
      ) : trained ? (
        <MapView
          space={space}
          locale={locale}
          width={width}
          height={height}
          colored
          clusterNames
          pairs={false}
          focus={step >= 2 ? focus : null}
          highlight={showcase >= 0 ? [showcase, ...(partner >= 0 ? [partner] : [])] : []}
          dimOthers={step >= 2}
          avoid={step <= 1 ? CARD_AVOID : undefined}
          labelBudget={step >= 2 ? 160 : 220}
          labelsFadeIn={landed && !still}
          overlay={step >= 2 ? pairOverlay : undefined}
        />
      ) : (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-label={tr(TRAINING.captions[0]!, locale)}>
          {space.items.map((it) => {
            const [x, y] = start[it.index]!;
            const c = clusterColor(it.cluster, nClusters);
            return (
              <circle
                key={it.index}
                ref={(el) => {
                  circles.current[it.index] = el;
                }}
                cx={x}
                cy={y}
                r={it.index === showcase ? 9 : 6}
                className={it.index === showcase ? styles.showcaseDot : styles.dot}
                style={{ fill: it.lang === "en" ? "var(--color-bg)" : c, stroke: c, strokeWidth: it.lang === "fr" ? 0 : it.lang === "both" ? 3.5 : 2.5 }}
              />
            );
          })}
          {showcase >= 0 && (
            <g ref={showcaseLabel} transform={`translate(${start[showcase]![0]},${start[showcase]![1]})`} className={styles.showcaseLabel}>
              <text x={14} y={0}>
                {SHOWCASE_WORD[locale]}
              </text>
            </g>
          )}
        </svg>
      )}
      {step <= 1 && showcase >= 0 && (
        <aside
          className={styles.vector}
          style={{ left: CARD_RECT.x0, top: CARD_RECT.y0, width: CARD_RECT.x1 - CARD_RECT.x0 }}
          aria-live="polite"
        >
          <p className={styles.vectorWord}>{SHOWCASE_WORD[locale]}</p>
          <p className={styles.vectorNumbers}>
            [{vector.map((x) => formatVectorValue(x, locale)).join(locale === "fr" ? " ; " : ", ")} …]
          </p>
          <p className={styles.vectorNote}>
            {tr(trained ? TRAINING.vectorTitleTrained : TRAINING.vectorTitleRandom, locale)}
            <br />
            {tr(TRAINING.vectorMore, locale)}
          </p>
        </aside>
      )}
      {animating && (
        <div className={styles.progress} aria-hidden="true">
          <span className={styles.progressLabel}>{tr(TRAINING.progress, locale)}</span>
          <span className={styles.progressTrack}>
            <span ref={bar} className={styles.progressFill} />
          </span>
        </div>
      )}
    </div>
  );
}
