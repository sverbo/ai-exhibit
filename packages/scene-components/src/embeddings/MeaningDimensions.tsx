/**
 * MeaningDimensions: why a word needs many numbers. A scripted, illustrative
 * animation (invented positions, labelled as such), advanced click by click:
 *
 * 0 one line, one number per word: colours on one side, fruits on the other,
 *   "orange" in the middle;
 * 1 "salmon" (a colour and a fish) hesitates: the line has no room for the sea;
 * 2 a second number, a second axis ("the sea"): salmon settles between the
 *   colours and the sea (French: "pêche" between the fruits and the sea);
 * 3 "blue" is pulled four ways (colour, sea, sky, sadness or a bruise): two
 *   numbers are not enough, labels collide;
 * 4 the word becomes a row of 384 numbers, with real model sizes;
 * 5 a bridge line toward the real map.
 *
 * Every screen draws from the step alone (dimensions.ts); no state, no model,
 * no network. Motion is CSS transitions between step states, off with reduced
 * motion and in previews.
 */
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { formatNumber } from "../llm/shared.ts";
import { NeutralSources } from "../llm/NeutralSources.tsx";
import common from "../llm/common.module.css";
import {
  ARROWS, dimensionsView, GHOST, LLAMA_405B_DIMS, LLAMA_8B_DIMS, positionAt, STRIP, STRIP_HEAD, STRIP_LENGTH, WORDS,
} from "./dimensions.ts";
import styles from "./MeaningDimensions.module.css";

const HEADLINES: L10n[] = [
  { en: "To compute with words, you need numbers" },
  { en: "Salmon: a colour, and a fish" },
  { en: "A second number, a second direction" },
  { en: "Blue: a colour, the sea, the sky, sadness" },
  { en: "So each word gets hundreds of numbers" },
  { en: "So each word gets hundreds of numbers" },
];

const CAPTIONS: L10n[] = [
  { en: "One number per word: its place on the line. Orange, a colour and a fruit, sits in the middle." },
  { en: "Near the colours, and near the sea? On the line, the sea has no place." },
  { en: "With two numbers, salmon can sit between the colours and the sea." },
  { en: "Near all of them at once? Two numbers are not enough: halfway between everything is close to nothing." },
  { en: "Nobody names these numbers: they are learned from text. Words used in the same sentences end up close." },
  { en: "Next: the real map, learned from text." },
];

const COPY = {
  onePerWord: { en: "1 number per word" },
  perWord: { en: "{n} numbers per word" },
  colours: { en: "colours" },
  // Same word in French: inline, so the catalog has no entry identical to English.
  fruits: { en: "fruits", fr: "fruits" },
  seaAxis: { en: "the sea" },
  stripNote: { en: "Each number: one more way to be neighbours" },
  ourMap: { en: "our word map (next slide)" },
  illustration: { en: "Illustration: invented, very simplified values" },
} satisfies Record<string, L10n>;

// Map geometry, in stage pixels inside the map area.
const AREA_W = 1728;
const AREA_H = 600;
const LINE_Y = 470;
const px = (x: number) => AREA_W / 2 + x * 740;
const py = (y: number) => LINE_Y - y * 400;

function signed(n: number, locale: Locale): string {
  const s = formatNumber(Math.abs(n), locale, 2);
  return n < 0 ? `−${s}` : s;
}

function formatValue(value: number[] | "?", locale: Locale): string {
  if (value === "?") return "?";
  const parts = value.map((v) => signed(v, locale));
  if (parts.length === 1) return parts[0]!;
  // French decimals use a comma, so the pair is separated by a semicolon.
  return locale === "fr" ? `(${parts.join(" ; ")})` : `(${parts.join(", ")})`;
}

/** An arrow from a word toward what pulls it, shortened at both ends. */
function arrowLine(from: { x: number; y: number }, to: { x: number; y: number }) {
  const x1 = px(from.x);
  const y1 = py(from.y);
  const x2 = px(to.x);
  const y2 = py(to.y);
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  return { x1: x1 + ux * 44, y1: y1 + uy * 44, x2: x2 - ux * 34, y2: y2 - uy * 34 };
}

function MapArea({ locale, step }: { locale: Locale; step: number }) {
  const view = dimensionsView(step, locale);
  const arrows = Object.entries(ARROWS).flatMap(([s, list]) =>
    list.map((a) => {
      const word = WORDS.find((w) => w.id === a.from)!;
      return { ...a, step: Number(s), line: arrowLine(positionAt(word, Number(s)), a.to) };
    }),
  );
  return (
    <div className={styles.map} data-visible={view.map}>
      <svg className={styles.lines} viewBox={`0 0 ${AREA_W} ${AREA_H}`} width={AREA_W} height={AREA_H} aria-hidden="true">
        <defs>
          <marker id="dims-pull" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className={styles.pullHead} />
          </marker>
          <marker id="dims-axis" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className={styles.axisHead} />
          </marker>
        </defs>
        <line className={styles.axis} x1={px(-1.12)} x2={px(1.12)} y1={LINE_Y} y2={LINE_Y} />
        <g className={styles.vAxis} data-visible={view.plane}>
          <line className={styles.axis} x1={px(-1.12)} x2={px(-1.12)} y1={LINE_Y} y2={py(1.08)} markerEnd="url(#dims-axis)" />
        </g>
        {arrows.map((a) => (
          <line
            key={a.id}
            className={styles.pull}
            data-visible={a.step === view.step}
            x1={a.line.x1}
            y1={a.line.y1}
            x2={a.line.x2}
            y2={a.line.y2}
            markerEnd="url(#dims-pull)"
          />
        ))}
      </svg>

      <span className={styles.group} style={{ left: px(-0.72), top: LINE_Y + 72 }}>
        {tr(COPY.colours, locale)}
      </span>
      <span className={styles.group} style={{ left: px(0.72), top: LINE_Y + 72 }}>
        {tr(COPY.fruits, locale)}
      </span>
      <span className={styles.axisLabel} data-visible={view.plane} style={{ left: px(-1.12) + 26, top: py(1.08) - 6 }}>
        {tr(COPY.seaAxis, locale)}
      </span>

      <span className={styles.ghost} data-visible={view.ghost} style={{ transform: `translate(${px(GHOST.at.x)}px, ${py(GHOST.at.y)}px)` }}>
        <span className={styles.ghostLabel}>{tr(GHOST.text, locale)}</span>
      </span>

      {view.words.map((w) => (
        <span
          key={w.id}
          className={styles.word}
          data-visible={w.visible}
          data-mood={w.mood}
          data-word={w.id}
          style={{ transform: `translate(${px(w.x)}px, ${py(w.y)}px)` }}
        >
          <span className={styles.wobble}>
            <span className={styles.dot} />
            <span className={styles.label}>{tr(w.text, locale)}</span>
          </span>
          {w.value !== null ? <span className={styles.value}>{formatValue(w.value, locale)}</span> : null}
        </span>
      ))}
    </div>
  );
}

const BAR_W = AREA_W / STRIP_LENGTH;

function NumberRow({ locale, visible }: { locale: Locale; visible: boolean }) {
  const blue = WORDS.find((w) => w.id === "blue")!;
  const tiles: { n: number; label: string }[] = [
    { n: STRIP_LENGTH, label: tr(COPY.ourMap, locale) },
    { n: LLAMA_8B_DIMS, label: "Llama 3.1 8B" },
    { n: LLAMA_405B_DIMS, label: "Llama 3.1 405B" },
  ];
  return (
    <div className={styles.numbers} data-visible={visible}>
      <div className={styles.head}>
        <span className={styles.headWord}>{tr(blue.text, locale)}</span>
        <span className={styles.equals}>=</span>
        {STRIP_HEAD.map((v, i) => (
          <span key={i} className={styles.cell}>
            {signed(v, locale)}
          </span>
        ))}
        <span className={styles.more}>…</span>
      </div>
      <svg className={styles.bars} viewBox={`0 0 ${AREA_W} 180`} width={AREA_W} height={180} aria-hidden="true">
        <line className={styles.barsBase} x1={0} x2={AREA_W} y1={90} y2={90} />
        {STRIP.map((v, i) => (
          <rect
            key={i}
            className={styles.bar}
            data-sign={v < 0 ? "neg" : "pos"}
            data-head={i < STRIP_HEAD.length}
            x={i * BAR_W + 0.6}
            y={v < 0 ? 90 : 90 - Math.max(2, Math.abs(v) * 86)}
            width={BAR_W - 1.2}
            height={Math.max(2, Math.abs(v) * 86)}
            style={{ animationDelay: `${Math.round(i * 1.6)}ms` }}
          />
        ))}
      </svg>
      <p className={styles.stripNote}>{tr(COPY.stripNote, locale)}</p>
      <div className={styles.tiles}>
        {tiles.map((t) => (
          <div key={t.label} className={styles.tile}>
            <span className={styles.tileNumber}>{formatNumber(t.n, locale)}</span>
            <span className={styles.tileLabel}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MeaningDimensions({ ctx }: SceneComponentProps<Record<string, never>, undefined>) {
  const { locale, role } = ctx;
  const view = dimensionsView(ctx.revealStep, locale);
  const still = ctx.reducedMotion || role === "preview";
  const counter = view.numbers === 1 ? tr(COPY.onePerWord, locale) : tr(COPY.perWord, locale).replace("{n}", formatNumber(view.numbers, locale));

  return (
    <div className={`${common.root} ${styles.root} ${still ? common.still : ""}`} data-step={view.step}>
      <h2 className={common.headline} key={`h${view.step}`} data-entering={!still}>
        <Rich text={tr(HEADLINES[view.step]!, locale)} />
      </h2>

      <div className={styles.area}>
        <MapArea locale={locale} step={view.step} />
        <NumberRow locale={locale} visible={view.strip} />
        <span className={styles.counter} key={`c${view.numbers}`}>
          {counter}
        </span>
      </div>

      <p className={styles.caption} key={`p${view.step}`} data-bridge={view.bridge}>
        <Rich text={tr(CAPTIONS[view.step]!, locale)} />
      </p>

      <div className={common.footer}>
        <span className={common.tag}>{tr(COPY.illustration, locale)}</span>
        {view.strip ? <NeutralSources ids={["fnd-minilm-multilingual-model-card", "llm-llama3-paper"]} getSource={ctx.getSource} /> : null}
      </div>
    </div>
  );
}
