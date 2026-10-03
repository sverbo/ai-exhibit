/**
 * TrainingLoop: how a language model learns. Show ordinary text up to some
 * point, let the model guess the NEXT word (at first at random: about 1 chance
 * in the vocabulary size), compare with the actual next word, nudge a few
 * numbers, then repeat over a stream of different texts (web pages, books,
 * code), faster and faster, while the counter climbs and the right word's
 * chance rises. Illustrative numbers (labelled on screen); the vocabulary size
 * and the final counter are real.
 *
 * Steps: 0 text up to a point, 1 random guess, 2 compare and error, 3 nudge,
 * 4 repeat over many texts.
 */
import type { L10n, Locale } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { NeutralSources } from "./NeutralSources.tsx";
import { LANGUAGE_MODELS } from "@ai-exhibit/ml-runtime/lm";
import { languageModelFor } from "../language/data.ts";
import { formatChance, formatNumber, numberInWords, roundSig, useElapsed } from "./shared.ts";
import {
  chanceAt, counterAt, COUNTER_MS, demoModelSourceId, errorOf, EXAMPLES, FIRST_SLIDE_MS, nextAfter, ONE_NUDGE,
  progressAt, RANDOM_GUESSES, randomChance, splitAtNext, splitLast, STEPS, STREAM, streamLineAt, TOKENS_SEEN,
  type TrainingLoopState, WEIGHTS,
} from "./training.ts";
import common from "./common.module.css";
import styles from "./TrainingLoop.module.css";

const HEADLINES: L10n[] = [
  { en: "Take ordinary text, up to some point", fr: "Prendre un texte ordinaire, jusqu'à un certain point" },
  { en: "At first, the model guesses at random", fr: "Au début, le modèle devine au hasard" },
  { en: "Compare with the actual next word", fr: "Comparer avec le vrai mot suivant" },
  { en: "Nudge the numbers, a tiny bit", fr: "Ajuster les nombres, un tout petit peu" },
  { en: "Again and again, over trillions of words", fr: "Encore, et encore, et encore…" },
];

/** For the code example the next piece is a token (a symbol), not a word. */
const CODE_HEADLINES: Partial<Record<number, L10n>> = {
  2: { en: "Compare with the actual next token", fr: "Comparer avec le vrai token suivant" },
};

const COPY = {
  source: {
    en: "Web pages, books… and huge amounts of code (17% of Llama 3's training text)",
    fr: "Pages web, livres… et énormément de code (17 % des textes d'entraînement de Llama 3)",
  },
  illustration: { en: "Illustration: invented numbers", fr: "Illustration : nombres inventés" },
  guesses: { en: "Its top guesses: random tokens", fr: "Ses meilleures propositions : des tokens au hasard" },
  randomNote: {
    en: "Random at first: the right word gets about 1 chance in {n}.",
    fr: "Au hasard au début : le bon mot a environ 1 chance sur {n}.",
  },
  afterNudge: { en: "After one nudge", fr: "Après un ajustement" },
  gave: { en: "The next word was “{w}”. It gave it {p}; it should be 100%.", fr: "Le mot suivant était « {w} ». Il lui donnait {p}\u00a0; il faudrait 100\u00a0%." },
  gaveCode: { en: "The next token was “{w}”. It gave it {p}; it should be 100%.", fr: "Le token suivant était « {w} ». Il lui donnait {p}\u00a0; il faudrait 100\u00a0%." },
  codeNote: {
    en: "Code is text too. In one study, adding it to training improved reasoning by up to 8%.",
    fr: "Le code est aussi du texte. Dans une étude, en ajouter à l'entraînement a amélioré le raisonnement jusqu'à 8 %.",
  },
  error: { en: "Error: almost 100%", fr: "Erreur : presque 100 %" },
  better: {
    en: "Barely better: {a} → {b}. It takes trillions of these.",
    fr: "À peine mieux : {a} → {b}. Il en faut des milliers de milliards.",
  },
  network: { en: "A few of the model's numbers", fr: "Quelques nombres du modèle" },
  networkNote: {
    en: "The small model in this talk has about {n} of them; large models, hundreds of billions.",
    fr: "Le petit modèle de cet exposé en a environ {n} ; les grands, des centaines de milliards.",
  },
  nudgeNote: {
    en: "Each one moves slightly, in the direction that makes the actual next word more likely.",
    fr: "Chacun bouge légèrement, dans le sens qui rend le vrai mot suivant plus probable.",
  },
  counter: { en: "Guesses so far", fr: "Propositions jusqu'ici" },
  counterNote: {
    en: "One guess per token. Llama 3.1 405B (2024) was trained on {n} tokens.",
    fr: "Une proposition par token. Llama 3.1 405B (2024) a été entraîné sur {n} de tokens.",
  },
  curve: { en: "Chance it gives the right next word", fr: "Chance donnée au bon mot suivant" },
  start: { en: "random", fr: "hasard" },
  another: { en: "Another sentence", fr: "Autre phrase" },
} satisfies Record<string, L10n>;

// Network drawing: 4 inputs, 5 hidden, 4 outputs.
const LAYERS = [4, 5, 4];
const NET_W = 720;
const NET_H = 320;
const layerX = (i: number) => 70 + i * ((NET_W - 140) / (LAYERS.length - 1));
const nodeY = (layer: number, j: number) => {
  const n = LAYERS[layer]!;
  const gap = (NET_H - 80) / (n - 1);
  return 40 + j * gap;
};
/** Edges whose number is written: [fromLayer, fromNode, toNode]. */
const LABELLED: [number, number, number][] = [
  [0, 0, 0], [0, 1, 1], [0, 2, 3], [0, 3, 4],
  [1, 0, 0], [1, 1, 1], [1, 3, 2], [1, 4, 3],
];

function signed(n: number, locale: Locale): string {
  const s = formatNumber(Math.abs(n), locale, 2);
  return n < 0 ? `−${s}` : s;
}

function Network({ step, flicker, locale }: { step: number; flicker: number; locale: Locale }) {
  const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  for (let l = 0; l < LAYERS.length - 1; l++) {
    for (let a = 0; a < LAYERS[l]!; a++) {
      for (let b = 0; b < LAYERS[l + 1]!; b++) {
        edges.push({ key: `${l}-${a}-${b}`, x1: layerX(l), y1: nodeY(l, a), x2: layerX(l + 1), y2: nodeY(l + 1, b) });
      }
    }
  }
  const flowing = step === 1 || step === 4;
  return (
    <svg className={styles.net} viewBox={`0 0 ${NET_W} ${NET_H}`} width={NET_W} height={NET_H} aria-hidden="true" data-flow={flowing}>
      {edges.map((e) => (
        <line key={e.key} className={styles.edge} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
      ))}
      {LAYERS.flatMap((n, l) =>
        Array.from({ length: n }, (_, j) => (
          <circle key={`n${l}-${j}`} className={styles.node} cx={layerX(l)} cy={nodeY(l, j)} r={18} />
        )),
      )}
      {LABELLED.map(([l, a, b], i) => {
        const w = WEIGHTS[i]!;
        const x = (layerX(l) + layerX(l + 1)) / 2;
        const y = (nodeY(l, a) + nodeY(l + 1, b)) / 2;
        const nudged = step >= 3;
        let value = nudged ? w.after : w.before;
        // During "repeat", the numbers keep shifting (deterministic wobble).
        if (step === 4 && flicker > 0) value = w.after + Math.round(Math.sin(flicker * (i + 1) * 1.7) * 3) / 100;
        const delta = w.after - w.before;
        const dir = step === 3 && delta !== 0 ? (delta > 0 ? "up" : "down") : "none";
        return (
          <g key={i} className={styles.weight} data-dir={dir} transform={`translate(${x} ${y})`}>
            <rect x={-54} y={-22} width={108} height={44} rx={10} />
            <text x={0} y={9} textAnchor="middle">
              {signed(value, locale)}
            </text>
            {dir !== "none" ? (
              <text className={styles.arrow} x={64} y={9} textAnchor="middle">
                {dir === "up" ? "▲" : "▼"}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// Learning curve: x is training progress (log of guesses), y the right word's chance (log).
const CURVE_W = 820;
const CURVE_H = 200;
const Y_MIN = -6; // 0.0001%
const Y_MAX = 0; // 100%
const cx = (f: number) => 70 + f * (CURVE_W - 90);
const cy = (p: number) => 10 + (1 - (Math.log10(p) - Y_MIN) / (Y_MAX - Y_MIN)) * (CURVE_H - 40);

function Curve({ f, start, locale }: { f: number; start: number; locale: Locale }) {
  const pts: string[] = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * f;
    pts.push(`${i === 0 ? "M" : "L"}${cx(x).toFixed(1)} ${cy(chanceAt(x, start)).toFixed(1)}`);
  }
  const now = chanceAt(f, start);
  return (
    <svg className={styles.curve} viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} width={CURVE_W} height={CURVE_H} aria-hidden="true">
      {[-6, -4, -2, 0].map((e) => (
        <g key={e}>
          <line className={styles.curveGrid} x1={cx(0)} x2={cx(1)} y1={cy(10 ** e)} y2={cy(10 ** e)} />
          <text className={styles.curveTick} x={cx(0) - 10} y={cy(10 ** e) + 6} textAnchor="end">
            {`${formatNumber(10 ** (e + 2), locale, Math.max(0, -(e + 2)))}${locale === "fr" ? "\u00a0%" : "%"}`}
          </text>
        </g>
      ))}
      <line className={styles.curveAxis} x1={cx(0)} x2={cx(1)} y1={CURVE_H - 30} y2={CURVE_H - 30} />
      <path className={styles.curveLine} d={pts.join(" ")} />
      <circle className={styles.curveDot} cx={cx(f)} cy={cy(now)} r={9} />
      <text className={styles.curveLabel} x={cx(0)} y={CURVE_H - 6}>
        {COPY.start[locale]}
      </text>
    </svg>
  );
}

export function TrainingLoop({ ctx }: SceneComponentProps<Record<string, never>, TrainingLoopState>) {
  const { locale, role, revealStep } = ctx;
  const step = Math.min(Math.max(revealStep, 0), STEPS);
  const exIndex = (ctx.state?.example ?? 0) % EXAMPLES.length;
  const ex = EXAMPLES[exIndex]!;
  const still = ctx.reducedMotion || role === "preview";
  const demo = LANGUAGE_MODELS[languageModelFor(locale, "base")];
  const p0 = randomChance(demo.vocabSize);
  const elapsed = useElapsed(`${step}-${exIndex}`, !still && step === 4, COUNTER_MS + 500);
  const f = step === 4 ? progressAt(elapsed) : 0;
  const count = counterAt(elapsed);
  const flicker = step === 4 && Number.isFinite(elapsed) ? Math.floor(elapsed / 120) : 0;
  const { context, rest } = splitAtNext(ex.text[locale]);

  // What the text card shows.
  let shown: string;
  let slot: { text: string; revealed: boolean } | null;
  let code = Boolean(ex.code);
  let lineKey = `e${exIndex}`;
  const streaming = step === 4 && (!Number.isFinite(elapsed) || elapsed >= FIRST_SLIDE_MS);
  if (step < 2) {
    shown = context;
    slot = { text: "?", revealed: false };
  } else if (step < 4) {
    shown = context;
    slot = { text: ex.answer[locale], revealed: true };
  } else if (!streaming) {
    // One word forward in the same sentence.
    shown = `${context}${ex.code ? "" : " "}${ex.answer[locale]}`;
    slot = nextAfter(rest) ? { text: "?", revealed: false } : null;
  } else {
    // Then many different texts, faster and faster (the last one when motion is off).
    const i = Number.isFinite(elapsed) ? streamLineAt(elapsed - FIRST_SLIDE_MS) : STREAM.length - 1;
    const line = STREAM[i % STREAM.length]!;
    const { context: c, next } = splitLast(line.text[locale]);
    shown = c;
    slot = { text: next, revealed: true };
    code = Boolean(line.code);
    lineKey = `s${i}`;
  }

  const nudged = p0 * ONE_NUDGE;
  const randomRows = RANDOM_GUESSES.map((g) => ({ key: g.token.en, word: g.token[locale], p: p0 * g.times, answer: false }));
  const answerRow = { key: "answer", word: ex.answer[locale], p: step >= 3 ? nudged : p0, answer: true };
  const rows = step >= 2 ? [...randomRows, answerRow] : randomRows;
  const showBar = (p: number) => `max(3px, ${(p * 100).toFixed(4)}%)`;

  return (
    <div className={`${common.root} ${styles.root} ${still ? common.still : ""}`} data-step={step}>
      <h2 className={common.headline} key={`h${step}`} data-entering={!still}>
        {((ex.code && CODE_HEADLINES[step]) || HEADLINES[step]!)[locale]}
      </h2>

      <figure className={styles.textCard}>
        {/* One caption line: the training mix, or the code note on the code example (never an extra row). */}
        <figcaption className={styles.textSource}>
          {ex.code && step < 4 ? (
            <>
              {COPY.codeNote[locale]} <NeutralSources ids={["llm-aryabumi-2024"]} getSource={ctx.getSource} />
            </>
          ) : (
            <>
              {COPY.source[locale]} <NeutralSources ids={["llm-llama3-paper"]} getSource={ctx.getSource} />
            </>
          )}
        </figcaption>
        <p className={`${styles.sentence} ${code ? styles.code : ""} ${streaming ? styles.fast : ""}`} key={lineKey}>
          {shown}
          {code && !streaming ? "" : " "}
          {slot ? <span className={`${styles.slot} ${slot.revealed ? styles.slotRevealed : ""}`}>{slot.text}</span> : null}
        </p>
      </figure>

      <div className={styles.lower}>
        <section className={styles.left}>
          {step >= 1 && step <= 3 ? (
            <>
              <h3 className={styles.panelTitle}>{step === 3 ? COPY.afterNudge[locale] : COPY.guesses[locale]}</h3>
              <ol className={styles.bars}>
                {rows.map((r) => (
                  <li key={r.key} className={`${styles.row} ${r.answer ? styles.answer : ""}`}>
                    <span className={styles.word}>{r.word}</span>
                    <span className={styles.track}>
                      <span className={styles.fill} style={{ width: showBar(r.p) }} />
                      {r.answer && step === 2 ? <span className={styles.gap} style={{ left: "3px", right: 0 }} /> : null}
                    </span>
                    <span className={styles.pct}>{formatChance(r.p, locale)}</span>
                  </li>
                ))}
              </ol>
              {step === 1 ? (
                <p className={styles.verdict}>{COPY.randomNote[locale].replace("{n}", formatNumber(demo.vocabSize, locale))}</p>
              ) : null}
              {step === 2 ? (
                <p className={styles.verdict}>
                  {(ex.code ? COPY.gaveCode : COPY.gave)[locale].replace("{w}", ex.answer[locale]).replace("{p}", formatChance(p0, locale))}{" "}
                  <strong className={styles.errorText}>{errorOf(p0) > 0.999 ? COPY.error[locale] : ""}</strong>
                </p>
              ) : null}
              {step === 3 ? (
                <p className={styles.verdict}>
                  <strong className={styles.betterText}>
                    {COPY.better[locale].replace("{a}", formatChance(p0, locale)).replace("{b}", formatChance(nudged, locale))}
                  </strong>
                </p>
              ) : null}
            </>
          ) : null}
          {step === 4 ? (
            <div className={styles.counter}>
              <h3 className={styles.panelTitle}>{COPY.counter[locale]}</h3>
              <p className={styles.count} aria-live="off">
                {formatNumber(count, locale)}
              </p>
              <h3 className={styles.panelTitle}>
                {COPY.curve[locale]}: <span className={styles.curveNow}>{formatChance(chanceAt(f, p0), locale)}</span>
              </h3>
              <Curve f={f} start={p0} locale={locale} />
              <p className={styles.countNote}>
                {COPY.counterNote[locale].replace("{n}", numberInWords(TOKENS_SEEN, locale))}{" "}
                <NeutralSources ids={["llm-llama3-paper"]} getSource={ctx.getSource} />
              </p>
            </div>
          ) : null}
        </section>

        <section className={styles.right} data-visible={step >= 1}>
          <h3 className={styles.panelTitle}>{COPY.network[locale]}</h3>
          <Network step={step} flicker={flicker} locale={locale} />
          <p className={styles.netNote}>
            {step === 3
              ? COPY.nudgeNote[locale]
              : COPY.networkNote[locale].replace("{n}", numberInWords(roundSig(demo.parameters, 1), locale))}
            {step !== 3 ? (
              <>
                {" "}
                <NeutralSources ids={[demoModelSourceId(demo.id), "llm-llama3-paper"]} getSource={ctx.getSource} />
              </>
            ) : null}
          </p>
        </section>
      </div>

      <div className={common.footer}>
        <span className={common.tag}>{COPY.illustration[locale]}</span>
        {role === "controller" ? (
          <div className={common.controls}>
            <button
              type="button"
              className={common.button}
              onClick={() => ctx.setState({ example: (exIndex + 1) % EXAMPLES.length })}
            >
              {COPY.another[locale]}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
