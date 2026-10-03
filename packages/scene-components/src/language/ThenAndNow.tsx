/**
 * ThenAndNow: trick questions that fooled older language models.
 *
 * - game (scene 1.2): one question at a time; the room guesses, then GPT-2
 *   answers (a recorded real run, replayed word by word), then today's
 *   recorded answer. Ladder questions show the published answers of each
 *   generation. Nothing runs in the browser.
 * - recap (scene 3.12): every question in one grid, GPT-2 vs today, with the
 *   callback line. Recorded data only.
 *
 * Every model answer on screen is real: see content/assets/then-and-now/questions.ts.
 */
import { useEffect, useRef } from "react";
import type { Locale } from "@ai-exhibit/presentation-core";
import { GPT2_SETTINGS, type ThenAndNowQuestion } from "@ai-exhibit/content/assets/then-and-now/questions.ts";
import type { SceneComponentProps } from "../contract.ts";
import { COPY } from "./copy.ts";
import { useGpt2Answers } from "./runtime.ts";
import { useOnStepChange, useSceneState } from "./state.ts";
import { filledSlots, lastStage, pickQuestions, questionRuns, truncate } from "./thenAndNow.ts";
import styles from "./ThenAndNow.module.css";
import { Button, cx, Frame, Pending, Segmented, TextField } from "./ui.tsx";

export interface ThenAndNowProps {
  variant?: "game" | "recap";
  questionIds?: string[];
}

interface Gpt2Answer {
  questionId: string;
  text: string;
  state: "idle" | "running" | "done";
  source: "live" | "recorded";
  /** 0 = greedy, then samples. */
  attempt: number;
}

export interface ThenAndNowState {
  index: number;
  guesses: string[];
  /**
   * 0 question, 1 GPT-2, 2 today; for a question with published answers
   * (ladder): 1..n one generation per click, n+1 today. null: follow the reveal step.
   */
  stage: number | null;
  gpt2: Gpt2Answer | null;
}

export function ThenAndNow(props: SceneComponentProps<ThenAndNowProps, ThenAndNowState>) {
  return props.props.variant === "recap" ? <Recap {...props} /> : <Game {...props} />;
}

function Game({ props, ctx }: SceneComponentProps<ThenAndNowProps, ThenAndNowState>) {
  const { locale, role } = ctx;
  const questions = pickQuestions(props.questionIds, "game");
  const recorded = useGpt2Answers();
  const [state, setState] = useSceneState<ThenAndNowState>(ctx, () => ({ index: 0, guesses: [], stage: null, gpt2: null }), {
    throttleMs: 60,
  });
  const abort = useRef<AbortController | null>(null);

  const q = questions[Math.min(state.index, questions.length - 1)];
  const sceneSteps = ctx.scene.steps ?? 0;
  const maxStage = q ? lastStage(q) : 2;
  const stage = state.stage ?? (sceneSteps > 0 ? Math.min(maxStage, ctx.revealStep) : 0);

  const ask = async (attempt: number) => {
    if (!q) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    const base: Gpt2Answer = { questionId: q.id, text: "", state: "running", source: "recorded", attempt };
    setState((s) => ({ ...s, gpt2: base }));
    try {
      const rec = recorded?.answers[q.id];
      const all = rec ? [rec.greedy, ...rec.samples] : [];
      const full = all[attempt % Math.max(1, all.length)] ?? "";
      const words = full.split(/(?<=\s)/);
      let text = "";
      for (const w of words) {
        if (ac.signal.aborted) return;
        text += w;
        setState((s) => ({ ...s, gpt2: { ...base, text } }));
        if (!ctx.reducedMotion) await new Promise((r) => setTimeout(r, 90));
      }
      setState((s) => ({ ...s, gpt2: { ...base, text: full, state: "done" } }));
    } catch {
      if (!ac.signal.aborted) setState((s) => ({ ...s, gpt2: s.gpt2 ? { ...s.gpt2, state: "done" } : null }));
    }
  };

  // GPT-2's recorded answer plays when its column is revealed, once per question.
  // Ladder questions show the published answers of each generation instead.
  useEffect(() => {
    if (role !== "controller" || !q || q.ladder || stage < 1) return;
    if (state.gpt2?.questionId === q.id) return;
    if (!recorded) return;
    void ask(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, q?.id, stage, recorded]);
  useEffect(() => () => abort.current?.abort(), []);
  useOnStepChange(ctx.revealStep, () => setState((s) => ({ ...s, stage: null })));

  const view: ThenAndNowState =
    role === "preview" || (role === "display" && ctx.state === undefined) ? { index: 0, guesses: [], stage: 0, gpt2: null } : state;
  const viewQ = questions[Math.min(view.index, questions.length - 1)];
  if (!viewQ) return <Frame />;
  const viewStage = role === "preview" ? 0 : stage;
  const gpt2 = view.gpt2?.questionId === viewQ.id ? view.gpt2 : null;
  const slots = filledSlots(viewQ);

  const go = (index: number) => {
    abort.current?.abort();
    setState({ index, guesses: [], stage: 0, gpt2: null });
  };

  const controls =
    role === "controller" ? (
      <>
        <Segmented
          label={COPY.question[locale]}
          value={state.index}
          options={questions.map((_, i) => ({ value: i, label: String(i + 1) }))}
          onChange={go}
        />
        <TextField
          label={COPY.addGuess[locale]}
          placeholder={COPY.guessPlaceholder[locale]}
          clearOnSubmit
          submitLabel="+"
          onSubmit={(g) => {
            const v = g.trim().slice(0, 40);
            if (v) setState((s) => (s.guesses.includes(v) ? s : { ...s, guesses: [...s.guesses, v].slice(-6) }));
          }}
        />
        {q?.ladder ? (
          <>
            <Button disabled={stage <= 0} onClick={() => setState((s) => ({ ...s, stage: Math.max(0, stage - 1) }))}>
              {COPY.previousGeneration[locale]}
            </Button>
            <Button primary disabled={stage >= maxStage} onClick={() => setState((s) => ({ ...s, stage: Math.min(maxStage, stage + 1) }))}>
              {stage >= maxStage - 1 ? COPY.showToday[locale] : COPY.nextGeneration[locale]}
            </Button>
          </>
        ) : (
          <>
            <Button primary={stage < 1} onClick={() => setState((s) => ({ ...s, stage: Math.max(1, stage) }))} disabled={stage >= 1}>
              {COPY.askGpt2[locale]}
            </Button>
            <Button disabled={stage < 1 || state.gpt2?.state === "running"} onClick={() => void ask((state.gpt2?.attempt ?? 0) + 1)}>
              {COPY.askAgain[locale]}
            </Button>
            <Button primary={stage === 1} disabled={stage >= 2} onClick={() => setState((s) => ({ ...s, stage: 2 }))}>
              {COPY.showToday[locale]}
            </Button>
          </>
        )}
      </>
    ) : null;

  return (
    <Frame controls={controls} label={ctx.scene.title[locale]}>
      <p className={cx(styles.question, viewQ.ladder && styles.questionCompact)}>
        <QuestionText text={viewQ.question[locale]} />
      </p>
      {viewQ.ladder && locale !== "en" ? (
        <p className={styles.original}>
          {COPY.askedInEnglish[locale]} <q>{viewQ.ladder.originalPrompt}</q>
        </p>
      ) : null}
      {viewQ.ladder ? (
        <LadderView q={viewQ} stage={viewStage} locale={locale} />
      ) : (
      <div className={styles.columns}>
        {view.guesses.length ? (
          <section className={cx(styles.column, styles.room)}>
            <header className={styles.colHead}>
              <span className={styles.colTitle}>{COPY.roomGuesses[locale]}</span>
            </header>
            <ul className={styles.guesses}>
              {view.guesses.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className={cx(styles.column, styles.then, viewStage < 1 && styles.hidden)} aria-hidden={viewStage < 1}>
          <header className={styles.colHead}>
            <span className={styles.colTitle}>GPT-2</span>
            <span className={styles.colYear}>2019</span>
            <span className={styles.colSub}>
              {COPY.gpt2Recorded[locale]}
            </span>
          </header>
          <p className={styles.answer}>
            {gpt2?.text ? <q>{gpt2.text}</q> : gpt2?.state === "running" ? <Pending>{COPY.writing[locale]}</Pending> : null}
          </p>
          {locale !== "en" ? <p className={styles.footnote}>{COPY.gpt2English[locale]}</p> : null}
        </section>
        {slots.map((o) => (
          <section key={o.generation} className={cx(styles.column, viewStage < 2 && styles.hidden)} aria-hidden={viewStage < 2}>
            <header className={styles.colHead}>
              <span className={styles.colTitle}>{o.generation}</span>
              {o.date ? <span className={styles.colYear}>{o.date.slice(0, 4)}</span> : null}
              <span className={styles.colSub}>{COPY.recordedAnswer[locale]}</span>
            </header>
            <p className={styles.answer}>
              <q>{o.answer[locale]}</q>
            </p>
          </section>
        ))}
        <section className={cx(styles.column, styles.now, viewStage < 2 && styles.hidden)} aria-hidden={viewStage < 2}>
          <header className={styles.colHead}>
            <span className={styles.colTitle}>{viewQ.today.model}</span>
            <span className={styles.colYear}>{viewQ.today.date.slice(0, 4)}</span>
            <span className={styles.colSub}>
              {COPY.recordedAnswer[locale]}, {formatDate(viewQ.today.date, locale)}
            </span>
          </header>
          <p className={styles.answer}>
            <q>{viewQ.today.answer[locale]}</q>
          </p>
        </section>
      </div>
      )}
      <footer className={styles.footer}>
        {viewStage >= lastStage(viewQ) && !viewQ.ladder ? (
          <p className={styles.correct}>
            {COPY.correctAnswer[locale]} <b>{viewQ.correct[locale]}</b>
          </p>
        ) : null}
      </footer>
    </Frame>
  );
}

function Recap({ props, ctx }: SceneComponentProps<ThenAndNowProps, ThenAndNowState>) {
  const { locale } = ctx;
  const questions = pickQuestions(props.questionIds, "recap");
  const recorded = useGpt2Answers();
  const generations = [...new Set(questions.flatMap((q) => filledSlots(q).map((o) => o.generation)))];
  const today = questions[0]?.today;
  return (
    <Frame label={ctx.scene.title[locale]}>
      <h2 className={styles.recapTitle}>{COPY.recapTitle[locale]}</h2>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th scope="col">{COPY.question[locale]}</th>
            <th scope="col">
              GPT-2 <span className={styles.colYear}>2019</span>
            </th>
            {generations.map((g) => (
              <th key={g} scope="col">
                {g}
              </th>
            ))}
            <th scope="col">
              {today?.model} <span className={styles.colYear}>{today?.date.slice(0, 4)}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const old = recorded?.answers[q.id]?.greedy ?? "";
            return (
              <tr key={q.id}>
                <th scope="row">
                  <QuestionText text={q.question[locale]} />
                </th>
                <td className={styles.oldCell}>{old ? <q>{truncate(old, 70)}</q> : null}</td>
                {generations.map((g) => {
                  const slot = q.others.find((o) => o.generation === g);
                  return <td key={g}>{slot?.answer ? <q>{truncate(slot.answer[locale], 70)}</q> : null}</td>;
                })}
                <td className={styles.nowCell}>{q.correct[locale]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.recapNote}>
        GPT-2: {COPY.gpt2Recorded[locale]}. {today?.model}: {COPY.recordedAnswer[locale]}, {today ? formatDate(today.date, locale) : ""}.
      </p>
    </Frame>
  );
}

/** Published answers, one generation per stage, then today's recorded answer. */
function LadderView({ q, stage, locale }: { q: ThenAndNowQuestion; stage: number; locale: Locale }) {
  const ladder = q.ladder!;
  const last = lastStage(q);
  return (
    <div className={styles.ladderWrap}>
      <ol className={styles.ladder}>
        {ladder.rungs.map((r, i) => (
          <li key={r.generation} className={cx(styles.rung, stage < i + 1 && styles.hidden)} aria-hidden={stage < i + 1}>
            <span className={styles.rungWho}>
              <span className={styles.colTitle}>{r.generation}</span>
              <span className={styles.colYear}>{r.year}</span>
              <span className={styles.rungCost}>
                {r.cost ? `${COPY.estimatedCost[locale]} ${r.cost[locale]}` : COPY.costUnknown[locale]}
              </span>
            </span>
            <q className={styles.rungAnswer}>{r.answer}</q>
            <Mark correct={r.correct} locale={locale} />
          </li>
        ))}
        <li className={cx(styles.rung, styles.rungNow, stage < last && styles.hidden)} aria-hidden={stage < last}>
          <span className={styles.rungWho}>
            <span className={styles.colTitle}>{q.today.model}</span>
            <span className={styles.colYear}>{q.today.date.slice(0, 4)}</span>
            <span className={styles.rungCost}>
              {COPY.recordedAnswer[locale]}, {formatDate(q.today.date, locale)}
            </span>
          </span>
          <q className={styles.rungAnswer}>{q.today.answer[locale]}</q>
          <Mark correct locale={locale} />
        </li>
      </ol>
      <p className={styles.ladderSource}>{COPY.publishedBy[locale]}</p>
    </div>
  );
}

/** Correct / incorrect: shape and word, never color alone. */
function Mark({ correct, locale }: { correct: boolean; locale: Locale }) {
  return (
    <span className={cx(styles.mark, correct ? styles.markOk : styles.markNo)}>
      <span aria-hidden="true">{correct ? "✓" : "✗"}</span> {correct ? COPY.correctMark[locale] : COPY.incorrectMark[locale]}
    </span>
  );
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Question text with operators and punctuation drawn at full stroke weight. */
function QuestionText({ text }: { text: string }) {
  return (
    <>
      {questionRuns(text).map((run, i) =>
        run.kind !== "text" ? (
          <span key={i} className={styles[run.kind]}>
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
  );
}
