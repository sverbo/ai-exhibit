import type { EmbeddingSpace } from "@ai-exhibit/ml-runtime/embeddings";
import { intlLocale, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cloud3D, cloudFrame } from "./Cloud3D.tsx";
import { TRAINING, tr } from "./copy.ts";
import { randomStart3d, randomVector, TRAINING_MS } from "./motion.ts";
import type { Camera3D } from "./search.ts";
import { NeighbourCard } from "./Selection.tsx";
import styles from "./Training.module.css";

/** The word shown as a list of numbers (in the audience's language); its translation is highlighted once trained. */
export const SHOWCASE_WORD: L10n = { en: "cat" };
/** Groups singled out at step 2. */
export const FOCUS_GROUPS = ["animals", "emotions", "countries", "capitals"];
/** Where the "cat as numbers" card sits (map pixels). */
export const CARD_RECT = { x0: 1208, y0: 0, x1: 1728, y1: 235 };
const CARD_AVOID = [CARD_RECT];
/**
 * The cloud's framing in this short box (1728 x 690): turning, it stays below
 * the top edge (and the "Text read" bar) and clear of the card on the right.
 */
const FIT = { size: 0.44, down: 40 };

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
  /** Jump cuts instead of motion, and no spin (reduced motion, paused, preview). */
  still: boolean;
  /** Turning and zooming at every step, and at the last step clicking words (controller), followed by the projector. */
  explore?: {
    interactive: boolean;
    camera3d: Camera3D | null;
    onCamera3d: (c: Camera3D) => void;
    selected: number | null;
    onSelect: (i: number | null) => void;
    reducedMotion: boolean;
    showAll: boolean;
    onShowAll: (on: boolean) => void;
  };
}

/**
 * The illustrative training, in the turning 3D cloud: every word starts in a
 * tight seeded cloud near the centre (`randomStart3d`) and glides to its real
 * 3D position (`space.coords.umap3d`). One cloud for every step, so it keeps
 * turning from one step to the next.
 */
export function TrainingView({ space, locale, width, height, step, replay, still, explore }: TrainingViewProps) {
  const n = space.items.length;
  const start3d = useMemo(() => {
    const f = cloudFrame(space.coords.umap3d);
    return randomStart3d(n, f.c, f.r);
  }, [space, n]);
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
  useEffect(() => {
    const before = prev.current;
    prev.current = { step, replay };
    const advanced = before.step === 0 && step === 1;
    const replayed = step >= 1 && replay !== before.replay;
    setAnimating((advanced || replayed) && !still);
  }, [step, replay, still]);

  const bar = useRef<HTMLSpanElement | null>(null);
  // Progress of the running animation, read by the cloud on each of its frames.
  const progress = useRef(0);
  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    const t0 = performance.now();
    progress.current = 0;
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / TRAINING_MS));
      progress.current = t;
      if (bar.current) bar.current.style.width = `${(t * 100).toFixed(1)}%`;
      if (t < 1) raf = requestAnimationFrame(frame);
      else setAnimating(false);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  // During the render right after the step change, the effect above has not
  // run yet: treat the animation as already pending so the end state never flashes.
  const pending = !still && ((prev.current.step === 0 && step === 1) || (step >= 1 && replay !== prev.current.replay));
  const trained = step >= 1 && !animating && !pending;
  const last = trained && step >= 2;
  // The cloud's clock: the start at step 0 (and just before an animation
  // starts), the running animation's progress, else the trained cloud.
  const morphProgress = () => (step === 0 || pending ? 0 : animating ? progress.current : 1);
  const pairHighlight = useMemo(() => (showcase < 0 ? [] : partner >= 0 ? [showcase, partner] : [showcase]), [showcase, partner]);
  const showcaseOnly = useMemo(() => (showcase < 0 ? [] : [showcase]), [showcase]);
  const pairNote = tr(TRAINING.pairNote, locale);
  const pair = useMemo(
    () => (showcase >= 0 && partner >= 0 ? { a: showcase, b: partner, note: pairNote } : null),
    [showcase, partner, pairNote],
  );
  const vector = useMemo(() => {
    if (showcase < 0) return [];
    return trained ? Array.from(space.vectors[showcase]!.slice(0, 4)) : randomVector(4);
  }, [trained, space, showcase]);

  // Last step: a word clicked on the cloud is starred, with its nearest neighbours lit and listed.
  const selected = last && explore && explore.selected !== null && space.items[explore.selected] ? explore.selected : null;
  const neighbours = useMemo(
    () => (selected === null ? [] : space.neighboursOf(selected).slice(0, 6).map((nb) => nb.index)),
    [space, selected],
  );
  const selectedQuery = useMemo(() => {
    if (selected === null) return null;
    const p = space.coords.umap3d[selected]!;
    return { text: space.items[selected]!.text, position: [p[0]!, p[1]!, p[2]!] as [number, number, number] };
  }, [space, selected]);

  return (
    <div className={styles.wrap}>
      <Cloud3D
        space={space}
        locale={locale}
        width={width}
        height={height}
        colored
        fit={FIT}
        clusterNames={trained && !selectedQuery}
        focus={last && !selectedQuery ? focus : null}
        highlight={selectedQuery ? neighbours : trained ? pairHighlight : showcaseOnly}
        query={selectedQuery}
        pair={last && !selectedQuery ? pair : null}
        dimOthers={false}
        avoid={step <= 1 ? CARD_AVOID : undefined}
        morph={{ from: start3d, progress: morphProgress }}
        showAll={last && Boolean(explore?.showAll)}
        onShowAll={last ? explore?.onShowAll : undefined}
        spinning={!still}
        reducedMotion={explore?.reducedMotion ?? still}
        interactive={explore?.interactive}
        camera={explore?.camera3d ?? null}
        onCamera={explore?.onCamera3d}
        onSelect={last ? explore?.onSelect : undefined}
      />
      {selected !== null && <NeighbourCard space={space} index={selected} locale={locale} style={{ top: 0, right: 0 }} />}
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
