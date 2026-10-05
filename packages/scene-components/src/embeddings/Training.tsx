import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import { intlLocale, plainText, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cloud3D, cloudFrame } from "./Cloud3D.tsx";
import { TRAINING, tr } from "./copy.ts";
import { clusterColor } from "./data.ts";
import { InteractiveMap } from "./InteractiveMap.tsx";
import { fitBox, MapView } from "./MapView.tsx";
import { randomStart, randomStart3d, randomVector, TRAINING_MS, trainingPosition } from "./motion.ts";
import type { Camera3D } from "./search.ts";
import { NeighbourCard, selectionMarks } from "./Selection.tsx";
import type { Camera } from "./view.ts";
import styles from "./Training.module.css";

const MARGIN = 40;
/** The word shown as a list of numbers (in the audience's language); its translation is highlighted at step 2. */
export const SHOWCASE_WORD: L10n = { en: "cat" };
/** Groups singled out at step 2. */
export const FOCUS_GROUPS = ["animals", "emotions", "countries", "capitals"];
/** Where the "cat as numbers" card sits (map pixels). */
export const CARD_RECT = { x0: 1208, y0: 0, x1: 1728, y1: 235 };
const CARD_AVOID = [CARD_RECT];

function formatVectorValue(x: number, locale: Locale): string {
  return x.toLocaleString(intlLocale(locale), { minimumFractionDigits: 3, maximumFractionDigits: 3 });
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
  /**
   * The 2D map, or the same story in the turning 3D cloud: a tight random
   * cloud that grows into the real 3D layout. Default "2d".
   */
  view?: "2d" | "3d";
  /** Last step: pan, zoom and click words (controller), followed by the projector. In 3D, turning works at every step. */
  explore?: {
    interactive: boolean;
    camera: Camera | null | undefined;
    onCamera: (c: Camera) => void;
    camera3d?: Camera3D | null;
    onCamera3d?: (c: Camera3D) => void;
    selected: number | null;
    onSelect: (i: number | null) => void;
    reducedMotion: boolean;
    showAll?: boolean;
    onShowAll?: (on: boolean) => void;
  };
}

export function TrainingView({ space, locale, width, height, step, replay, still, view = "2d", explore }: TrainingViewProps) {
  const n = space.items.length;
  const nClusters = space.json.clusters.length;
  const start = useMemo(() => randomStart(n, width, height), [n, width, height]);
  const start3d = useMemo(() => {
    const f = cloudFrame(space.coords.umap3d);
    return randomStart3d(n, f.c, f.r);
  }, [space, n]);
  const end = useMemo(() => {
    const coords = space.coords.umap2d;
    const f = fitBox(coords, width, height, MARGIN);
    return coords.map((p) => [f.cx + p[0]! * f.sx, f.cy - p[1]! * f.sy] as [number, number]);
  }, [space, width, height]);
  const showcase = useMemo(() => space.items.findIndex((it) => it.text === tr(SHOWCASE_WORD, locale)), [space, locale]);
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
  // Progress of the running animation, read by the 3D cloud on each of its frames.
  const progress = useRef(0);
  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    const t0 = performance.now();
    progress.current = 0;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / TRAINING_MS));
      progress.current = t;
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
  // The 3D cloud's clock: the start at step 0 (and just before an animation
  // starts), the running animation's progress, else the trained cloud.
  const morphProgress = () => (step === 0 || pending ? 0 : animating ? progress.current : 1);
  const pairHighlight = useMemo(() => (showcase < 0 ? [] : partner >= 0 ? [showcase, partner] : [showcase]), [showcase, partner]);
  const showcaseOnly = useMemo(() => (showcase < 0 ? [] : [showcase]), [showcase]);
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
      {view === "3d" ? (
        // One cloud for every step, so it keeps turning from one step to the next.
        <Cloud3D
          space={space}
          locale={locale}
          width={width}
          height={height}
          colored
          clusterNames={trained}
          focus={trained && step >= 2 ? focus : null}
          highlight={trained ? pairHighlight : showcaseOnly}
          dimOthers={false}
          avoid={step <= 1 ? CARD_AVOID : undefined}
          morph={{ from: start3d, progress: morphProgress }}
          showAll={trained && step >= 2 && Boolean(explore?.showAll)}
          onShowAll={trained && step >= 2 ? explore?.onShowAll : undefined}
          spinning={!still}
          reducedMotion={explore?.reducedMotion ?? still}
          interactive={explore?.interactive}
          camera={explore?.camera3d ?? null}
          onCamera={explore?.onCamera3d}
        />
      ) : trained && step >= 2 && explore ? (
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
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-label={plainText(tr(TRAINING.captions[0]!, locale))}>
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
                {tr(SHOWCASE_WORD, locale)}
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
          <p className={styles.vectorWord}>{tr(SHOWCASE_WORD, locale)}</p>
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
