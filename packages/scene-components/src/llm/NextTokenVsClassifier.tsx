/**
 * NextTokenVsClassifier: the bridge from the sports classifier to language models.
 * Step 0: the classifier picks between two answers (a real output of the
 *   chapter's small sports network).
 * Step 1: the same bars, but one per token of the vocabulary, with the real
 *   probabilities a small model gave (recorded, no model runs here).
 * Steps 2 to 4: the most likely word slides into the sentence and the bars
 *   update for the next position, one word per click (three words).
 */
import { useEffect, useRef } from "react";
import type { L10n } from "@ai-exhibit/presentation-core";
import { LANGUAGE_MODELS } from "@ai-exhibit/ml-runtime/lm";
import type { SceneComponentProps } from "../contract.ts";
import { prepareCanvas, readPalette, rgba } from "../learning/shared/canvas.ts";
import { useThemeName } from "../theme/theme.ts";
import { NeutralSources } from "./NeutralSources.tsx";
import {
  appendedAt, barsStepFor, CLASSIFIER_SENTENCE, classifierBars, cloudShape, cloudSpots, displayToken, NEXT_TOKEN_STEPS,
  restProbability, seededRandom, sentenceAfter, sliceFor, vocabSize, vocabSourceId,
} from "./nextToken.ts";
import { formatNumber, formatPercent } from "./shared.ts";
import common from "./common.module.css";
import styles from "./NextTokenVsClassifier.module.css";

const COPY = {
  head0: { en: "Our sports classifier: two possible answers", fr: "Notre classifieur de sport : deux réponses possibles" },
  head1: {
    en: "A language model does the same with text: which word comes next?",
    fr: "Un modèle de langage fait pareil avec du texte : quel mot vient ensuite ?",
  },
  head2: { en: "Pick one, add it to the sentence, ask again", fr: "En choisir un, l'ajouter à la phrase, redemander" },
  sub0: { en: "Football or basketball: one bar per possible answer.", fr: "Football ou basket : une barre par réponse possible." },
  sub1: {
    en: "It reads the start of a sentence and scores every word it knows ({n} of them): not two answers, tens of thousands.",
    fr: "Il lit le début d'une phrase et note chaque mot qu'il connaît ({n}) : pas deux réponses, des dizaines de milliers.",
  },
  sub2: {
    en: "Here it takes the most likely word, adds it, and scores every word again.",
    fr: "Ici il prend le mot le plus probable, l'ajoute, et note à nouveau chaque mot.",
  },
  example: { en: "Real output of our small sports network", fr: "Vraie sortie de notre petit réseau des sports" },
  real: { en: "Real probabilities from {model}, recorded", fr: "Vraies probabilités de {model}, enregistrées" },
  others: { en: "{n} other words", fr: "{n} autres mots" },
  grid: { en: "Every dot is one word the model could choose", fr: "Chaque point est un mot que le modèle pourrait choisir" },
  sub4: {
    en: "Three clicks, three words. Repeat, and a whole answer appears, one word at a time.",
    fr: "Trois clics, trois mots. On recommence, et une réponse entière apparaît, mot après mot.",
  },
} satisfies Record<string, L10n>;

const CLOUD_W = 660;
const CLOUD_H = 470;

/**
 * The whole vocabulary as a cloud of dots, one per token, drawn on a canvas (a
 * vocabulary is 50k to 150k dots). The current candidates are ringed in the bar
 * color; the most likely one is filled in the accent color and named.
 */
function TokenCloud({
  size, candidates, still,
}: { size: number; candidates: { id: number; label: string }[]; still: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const theme = useThemeName();
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const draw = () => {
      const g = prepareCanvas(el, CLOUD_W, CLOUD_H);
      if (!g) return;
      const { muted } = readPalette(el);
      const { cols, pitchX, pitchY } = cloudShape(size, CLOUD_W, CLOUD_H);
      const rand = seededRandom(size);
      const base = Math.min(pitchX, pitchY);
      const fade = 46;
      for (let i = 0; i < size; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = (c + 0.5 + (rand() - 0.5) * 0.7) * pitchX;
        const y = (r + 0.5 + (rand() - 0.5) * 0.7) * pitchY;
        const d = base * (0.42 + rand() * 0.3);
        // Soft edges: the cloud thins out instead of ending on a hard border.
        const edge = Math.min(x, y, CLOUD_W - x, CLOUD_H - y, fade) / fade;
        g.fillStyle = rgba(muted, (0.22 + rand() * 0.48) * edge);
        g.fillRect(x - d / 2, y - d / 2, d, d);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [size, theme]);

  const spots = cloudSpots(candidates.map((c) => c.id), CLOUD_W, CLOUD_H);
  const top = spots[0];
  const topLabel = candidates[0]?.label ?? "";
  const key = candidates.map((c) => c.id).join("-");
  return (
    <div className={styles.cloud} style={{ width: CLOUD_W, height: CLOUD_H }}>
      <canvas ref={canvas} className={styles.cloudCanvas} style={{ width: CLOUD_W, height: CLOUD_H }} aria-hidden="true" />
      <svg className={styles.cloudMarks} viewBox={`0 0 ${CLOUD_W} ${CLOUD_H}`} width={CLOUD_W} height={CLOUD_H} aria-hidden="true" key={key} data-entering={!still}>
        {spots.slice(1).map((p, i) => (
          <g key={p.id} className={styles.spot} style={{ animationDelay: `${120 + i * 60}ms` }}>
            <circle className={styles.spotRing} cx={p.x} cy={p.y} r={15} />
            <circle className={styles.spotDot} cx={p.x} cy={p.y} r={5} />
          </g>
        ))}
        {top ? (
          <g className={styles.spot}>
            <circle className={styles.topHalo} cx={top.x} cy={top.y} r={30} />
            <circle className={styles.topRing} cx={top.x} cy={top.y} r={20} />
            <circle className={styles.topDot} cx={top.x} cy={top.y} r={9} />
          </g>
        ) : null}
      </svg>
      {top ? (
        <span
          key={`l${key}`}
          className={styles.topLabel}
          data-entering={!still}
          style={{ left: top.x, top: top.y }}
        >
          {topLabel}
        </span>
      ) : null}
    </div>
  );
}

export function NextTokenVsClassifier({ ctx }: SceneComponentProps<Record<string, never>>) {
  const { locale, role, revealStep } = ctx;
  const step = Math.min(Math.max(revealStep, 0), NEXT_TOKEN_STEPS);
  const slice = sliceFor(locale);
  const size = vocabSize(slice.model);
  const barsStep = barsStepFor(step);
  const cands = barsStep === null ? [] : slice.steps[barsStep]!;
  const rest = barsStep === null ? 0 : restProbability(cands);
  const { added } = sentenceAfter(slice, appendedAt(step));
  const still = ctx.reducedMotion || role === "preview";
  const nWords = formatNumber(size, locale);

  // Rows: two classifier bars morph into 12 token bars plus "everything else".
  const rows: { key: string; label: string; p: number; rest?: boolean; chosen?: boolean }[] =
    barsStep === null
      ? // Same tones as the sports scenes: basketball in the accent, football in the second accent.
        classifierBars(locale).map((c, i) => ({ key: `r${i}`, label: c.label, p: c.p, chosen: c.sport === "basketball" }))
      : [
          ...cands.map((c, i) => ({ key: `r${i}`, label: displayToken(c.text), p: c.p, chosen: i === 0 })),
          {
            key: "rest",
            label: COPY.others[locale].replace("{n}", formatNumber(size - cands.length, locale)),
            p: rest,
            rest: true,
          },
        ];

  const headline = step === 0 ? COPY.head0[locale] : step === 1 ? COPY.head1[locale].replace("{n}", nWords) : COPY.head2[locale];
  const sub =
    step === 0 ? COPY.sub0[locale] : step === 1 ? COPY.sub1[locale] : step < NEXT_TOKEN_STEPS ? COPY.sub2[locale] : COPY.sub4[locale];
  const modelLabel = LANGUAGE_MODELS[slice.model].label;

  return (
    <div className={`${common.root} ${styles.root} ${still ? common.still : ""}`} data-step={step}>
      <h2 className={common.headline} key={`h${Math.min(step, 2)}`} data-entering={!still}>
        {headline}
      </h2>
      <p className={common.sub}>{sub}</p>
      {step >= 1 ? (
        <p className={styles.sentence} lang={slice.locale}>
          {slice.text}
          {added.map((t, i) => (
            <span key={i} className={`${styles.added} ${i === added.length - 1 ? styles.newest : ""}`}>
              {t}
            </span>
          ))}
          <span className={styles.blank} aria-hidden="true" />
        </p>
      ) : null}

      <div className={styles.body}>
        <div className={styles.input}>
          {step === 0 ? (
            <blockquote className={styles.classified} lang={locale}>
              {CLASSIFIER_SENTENCE[locale].text}
            </blockquote>
          ) : (
            <>
              <figure className={styles.gridFigure}>
                <TokenCloud size={size} candidates={cands.map((c) => ({ id: c.id, label: displayToken(c.text) }))} still={still} />
                <figcaption className={styles.gridCaption}>
                  {COPY.grid[locale]}: <strong>{nWords}</strong>
                </figcaption>
              </figure>
            </>
          )}
        </div>

        <ol className={styles.bars} data-mode={barsStep === null ? "classifier" : "tokens"}>
          {rows.map((r) => (
            <li key={r.key} className={`${styles.row} ${r.rest ? styles.rest : ""} ${r.chosen ? styles.chosen : ""}`}>
              <span className={styles.label}>{r.label}</span>
              <span className={styles.track}>
                <span className={styles.fill} style={{ width: `${(r.p * 100).toFixed(2)}%` }} />
              </span>
              <span className={styles.value}>{formatPercent(r.p, locale)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={common.footer}>
        <span className={common.tag}>
          {step === 0 ? COPY.example[locale] : COPY.real[locale].replace("{model}", modelLabel)}
        </span>
        {step >= 1 ? (
          <NeutralSources
            ids={[vocabSourceId(slice.model)]}
            getSource={ctx.getSource}
          />
        ) : null}
      </div>
    </div>
  );
}
