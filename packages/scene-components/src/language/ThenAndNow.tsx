/**
 * ThenAndNow: trick questions that fooled older language models.
 *
 * - game (scene 1.2): one question at a time; the room guesses, then GPT-2
 *   answers (a recorded real run, replayed word by word), then today's
 *   recorded answer. Ladder questions show the published answers of each
 *   generation, then a live step: the presenter types a question and open
 *   models of increasing size answer it side by side, streamed from the
 *   server (/api/llm/ladder). Nothing runs in the browser.
 * - recap (scene 3.12): every question in one grid, GPT-2 vs today, with the
 *   callback line. Recorded data only.
 *
 * Every model answer on screen is real: see content/assets/then-and-now/questions.ts.
 */
import { useEffect, useRef, useState } from "react";
import { own, intlLocale, tr, typeset, type Locale } from "@ai-exhibit/presentation-core";
import { type ThenAndNowQuestion } from "@ai-exhibit/content/assets/then-and-now/questions.ts";
import { cloudLadder, CloudLlmError, LADDER_MODELS, type LadderModel } from "@ai-exhibit/ml-runtime/lm";
import { GPT2_ANSWER_TRANSLATIONS } from "@ai-exhibit/content/assets/then-and-now/translations.ts";
import type { SceneComponentProps } from "../contract.ts";
import { COPY } from "./copy.ts";
import { useGpt2Answers } from "./runtime.ts";
import { keepKeys } from "../primitives/Controls.tsx";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { stripEmphasis } from "./format.ts";
import { useSourceDecision } from "./source.ts";
import { useOnStepChange, useSceneState } from "./state.ts";
import {
  applyLadderEvent,
  failLive,
  filledSlots,
  LIVE_MAX_CHARS,
  type LiveAnswer,
  type LiveLadder,
  lastStage,
  liveQuestion,
  liveStage,
  maxStage as maxStageOf,
  pickQuestions,
  questionRuns,
  startLive,
  truncate,
} from "./thenAndNow.ts";
import styles from "./ThenAndNow.module.css";
import { Button, cx, Frame, Pending, Segmented, SourceBadge, TextField } from "./ui.tsx";

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
  /** The live step's last question and its streamed answers (ladder questions). */
  live?: LiveLadder | null;
  /** Published by the stage owner: live answers are off (Simulation), so every window disables the field. */
  liveOff?: boolean;
}

/** What any window's live field asks the stage owner to do. */
type LiveAction = { type: "ask"; question: string };

export function ThenAndNow(props: SceneComponentProps<ThenAndNowProps, ThenAndNowState>) {
  return props.props.variant === "recap" ? <Recap {...props} /> : <Game {...props} />;
}

function Game({ props, ctx }: SceneComponentProps<ThenAndNowProps, ThenAndNowState>) {
  const { locale, role } = ctx;
  const questions = pickQuestions(props.questionIds, "game");
  const recorded = useGpt2Answers();
  const [state, setState] = useSceneState<ThenAndNowState>(ctx, () => ({ index: 0, guesses: [], stage: null, gpt2: null, live: null }), {
    throttleMs: 60,
  });
  const abort = useRef<AbortController | null>(null);
  const liveAbort = useRef<AbortController | null>(null);
  const { decision } = useSourceDecision(ctx);

  const q = questions[Math.min(state.index, questions.length - 1)];
  const sceneSteps = ctx.scene.steps ?? 0;
  const maxStage = q ? maxStageOf(q) : 2;
  const live = q ? liveStage(q) : null;
  const canAskLive = decision.active === "hf";
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
  useEffect(
    () => () => {
      abort.current?.abort();
      liveAbort.current?.abort();
    },
    [],
  );

  /** Every rung at once; each answer grows as its words arrive from the server. */
  const askLive = async (input: string) => {
    const question = liveQuestion(input);
    if (!question || !canAskLive) return;
    liveAbort.current?.abort();
    const ac = new AbortController();
    liveAbort.current = ac;
    let run = startLive(question, LADDER_MODELS.map((m) => m.id));
    const show = () => setState((s) => ({ ...s, live: run }));
    show();
    try {
      await cloudLadder(
        question,
        (e) => {
          if (ac.signal.aborted) return;
          run = applyLadderEvent(run, e);
          show();
        },
        { signal: ac.signal },
      );
      if (ac.signal.aborted) return;
      // The stream ended without its closing line: say so on the unfinished rungs.
      if (run.running) run = failLive(run, tr(COPY.liveStreamCut, locale));
      show();
    } catch (err) {
      if (ac.signal.aborted) return;
      run = failLive(run, err instanceof CloudLlmError ? err.message : String(err));
      show();
    }
  };
  useOnStepChange(ctx.revealStep, () => setState((s) => ({ ...s, stage: null })));

  // The field works in every interactive window (presenter or projector); only the stage owner calls the models.
  const act = useSceneActions<LiveAction, ThenAndNowState>(ctx, (a) => {
    if (a.type === "ask") void askLive(a.question);
  });
  // Other windows cannot ask the server whether Hugging Face is on: the owner publishes it.
  useEffect(() => {
    if (role === "controller" && Boolean(state.liveOff) !== !canAskLive) setState((s) => ({ ...s, liveOff: !canAskLive }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, canAskLive, state.liveOff]);

  const view: ThenAndNowState =
    role === "preview" || (role === "display" && ctx.state === undefined) ? { index: 0, guesses: [], stage: 0, gpt2: null, live: null } : state;
  const viewQ = questions[Math.min(view.index, questions.length - 1)];
  if (!viewQ) return <Frame />;
  const viewStage = role === "preview" ? 0 : stage;
  const gpt2 = view.gpt2?.questionId === viewQ.id ? view.gpt2 : null;
  const slots = filledSlots(viewQ);

  const go = (index: number) => {
    abort.current?.abort();
    liveAbort.current?.abort();
    setState({ index, guesses: [], stage: 0, gpt2: null, live: null });
  };
  const viewLive = Boolean(viewQ.ladder) && viewStage >= (liveStage(viewQ) ?? Infinity);
  const shownLive = viewLive ? (view.live ?? null) : null;

  const controls =
    role === "controller" ? (
      <>
        <Segmented
          label={tr(COPY.question, locale)}
          value={state.index}
          options={questions.map((_, i) => ({ value: i, label: String(i + 1) }))}
          onChange={go}
        />
        {live !== null && stage >= live ? null : (
          <TextField
            label={tr(COPY.addGuess, locale)}
            placeholder={tr(COPY.guessPlaceholder, locale)}
            clearOnSubmit
            submitLabel="+"
            onSubmit={(g) => {
              const v = g.trim().slice(0, 40);
              if (v) setState((s) => (s.guesses.includes(v) ? s : { ...s, guesses: [...s.guesses, v].slice(-6) }));
            }}
          />
        )}
        {q?.ladder ? (
          <>
            <Button disabled={stage <= 0} onClick={() => setState((s) => ({ ...s, stage: Math.max(0, stage - 1) }))}>
              {tr(COPY.previousGeneration, locale)}
            </Button>
            <Button primary disabled={stage >= maxStage} onClick={() => setState((s) => ({ ...s, stage: Math.min(maxStage, stage + 1) }))}>
              {stage >= lastStage(q)
                ? tr(COPY.goLive, locale)
                : stage === lastStage(q) - 1
                  ? tr(COPY.showToday, locale)
                  : tr(COPY.nextGeneration, locale)}
            </Button>
            {live !== null && stage >= live ? <SourceBadge decision={decision} locale={locale} /> : null}
          </>
        ) : (
          <>
            <Button primary={stage < 1} onClick={() => setState((s) => ({ ...s, stage: Math.max(1, stage) }))} disabled={stage >= 1}>
              {tr(COPY.askGpt2, locale)}
            </Button>
            <Button disabled={stage < 1 || state.gpt2?.state === "running"} onClick={() => void ask((state.gpt2?.attempt ?? 0) + 1)}>
              {tr(COPY.askAgain, locale)}
            </Button>
            <Button primary={stage === 1} disabled={stage >= 2} onClick={() => setState((s) => ({ ...s, stage: 2 }))}>
              {tr(COPY.showToday, locale)}
            </Button>
          </>
        )}
      </>
    ) : null;

  if (viewLive) {
    const off = role === "controller" ? !canAskLive : Boolean(view.liveOff);
    return (
      <Frame controls={controls} label={tr(ctx.scene.title, locale)}>
        <LiveView
          live={shownLive}
          question={shownLive?.question ?? tr(viewQ.question, locale)}
          interactive={role !== "preview" && canInteract(ctx)}
          off={off}
          onAsk={(question) => {
            const qn = liveQuestion(question);
            if (qn) act({ type: "ask", question: qn });
          }}
          locale={locale}
        />
      </Frame>
    );
  }

  return (
    <Frame controls={controls} label={tr(ctx.scene.title, locale)}>
      <p className={cx(styles.question, viewQ.ladder && styles.questionCompact)}>
        <QuestionText text={tr(viewQ.question, locale)} />
      </p>
      {viewQ.ladder && locale !== "en" ? (
        <p className={styles.original}>
          {tr(COPY.askedInEnglish, locale)} <q>{viewQ.ladder.originalPrompt}</q>
        </p>
      ) : null}
      {viewQ.ladder ? (
        <LadderView q={viewQ} stage={viewStage} locale={locale} />
      ) : (
      <div className={styles.columns}>
        {view.guesses.length ? (
          <section className={cx(styles.column, styles.room)}>
            <header className={styles.colHead}>
              <span className={styles.colTitle}>{tr(COPY.roomGuesses, locale)}</span>
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
              {tr(COPY.gpt2Recorded, locale)}
            </span>
          </header>
          <p className={styles.answer}>
            {gpt2?.text ? <q lang="en">{gpt2.text}</q> : gpt2?.state === "running" ? <Pending>{tr(COPY.writing, locale)}</Pending> : null}
          </p>
          {gpt2?.state === "done" ? <Translation text={gpt2Translation(gpt2.text, locale)} locale={locale} /> : null}
          {locale !== "en" ? <p className={styles.footnote}>{tr(COPY.gpt2English, locale)}</p> : null}
        </section>
        {slots.map((o) => (
          <section key={o.generation} className={cx(styles.column, viewStage < 2 && styles.hidden)} aria-hidden={viewStage < 2}>
            <header className={styles.colHead}>
              <span className={styles.colTitle}>{o.generation}</span>
              {o.date ? <span className={styles.colYear}>{o.date.slice(0, 4)}</span> : null}
              <span className={styles.colSub}>{tr(COPY.recordedAnswer, locale)}</span>
            </header>
            <p className={styles.answer}>
              <q>{tr(o.answer, locale)}</q>
            </p>
          </section>
        ))}
        <section className={cx(styles.column, styles.now, viewStage < 2 && styles.hidden)} aria-hidden={viewStage < 2}>
          <header className={styles.colHead}>
            <span className={styles.colTitle}>{viewQ.today.model}</span>
            <span className={styles.colYear}>{viewQ.today.date.slice(0, 4)}</span>
            <span className={styles.colSub}>
              {tr(COPY.recordedAnswer, locale)}, {formatDate(viewQ.today.date, locale)}
            </span>
          </header>
          <p className={styles.answer}>
            <q>{tr(viewQ.today.answer, locale)}</q>
          </p>
        </section>
      </div>
      )}
      <footer className={styles.footer}>
        {viewStage >= lastStage(viewQ) && !viewQ.ladder ? (
          <p className={styles.correct}>
            {tr(COPY.correctAnswer, locale)} <b>{tr(viewQ.correct, locale)}</b>
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
    <Frame label={tr(ctx.scene.title, locale)}>
      <h2 className={styles.recapTitle}>{tr(COPY.recapTitle, locale)}</h2>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th scope="col">{tr(COPY.question, locale)}</th>
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
                  <QuestionText text={tr(q.question, locale)} />
                </th>
                <td className={styles.oldCell}>
                  {old ? (
                    <>
                      <q lang="en">{truncate(old, 70)}</q>
                      <Translation text={truncateMaybe(gpt2Translation(old, locale), 70)} locale={locale} />
                    </>
                  ) : null}
                </td>
                {generations.map((g) => {
                  const slot = q.others.find((o) => o.generation === g);
                  return <td key={g}>{slot?.answer ? <q>{truncate(tr(slot.answer, locale), 70)}</q> : null}</td>;
                })}
                <td className={styles.nowCell}>{tr(q.correct, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={styles.recapNote}>
        GPT-2: {tr(COPY.gpt2Recorded, locale)}. {today?.model}: {tr(COPY.recordedAnswer, locale)}, {today ? formatDate(today.date, locale) : ""}.
      </p>
    </Frame>
  );
}

/**
 * The live step: one big question field and Ask, then one column per model,
 * smallest first, each answer growing as its words arrive. Windows that cannot
 * act (previews, the presenter's projector mirror) show the question as text.
 */
function LiveView({
  live,
  question,
  interactive,
  off,
  onAsk,
  locale,
}: {
  live: LiveLadder | null;
  question: string;
  interactive: boolean;
  off: boolean;
  onAsk: (question: string) => void;
  locale: Locale;
}) {
  return (
    <div className={styles.liveWrap}>
      {interactive ? (
        <LiveField value={question} disabled={off || live?.running === true} onAsk={onAsk} locale={locale} />
      ) : (
        <p className={styles.liveQuestion}>{question}</p>
      )}
      {interactive && off ? <p className={styles.liveNote}>{tr(COPY.liveNeedsHf, locale)}</p> : null}
      <ol className={styles.live}>
        {LADDER_MODELS.map((m) => (
          <li key={m.id} className={styles.liveCol}>
            <LiveHead model={m} locale={locale} />
            <LiveBody answer={live?.answers[m.id] ?? null} locale={locale} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The question field: keeps its own draft while focused, otherwise shows the
 * last question asked (from whichever window asked it).
 */
function LiveField({ value, disabled, onAsk, locale }: { value: string; disabled: boolean; onAsk: (q: string) => void; locale: Locale }) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <form
      className={styles.liveForm}
      data-keys-local=""
      onSubmit={(e) => {
        e.preventDefault();
        onAsk(draft);
      }}
    >
      <input
        className={styles.liveInput}
        value={draft}
        aria-label={tr(COPY.liveQuestion, locale)}
        maxLength={LIVE_MAX_CHARS}
        spellCheck={false}
        onKeyDown={keepKeys}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
        }}
        onChange={(e) => setDraft(e.currentTarget.value)}
      />
      <button type="submit" className={styles.liveAskButton} disabled={disabled || !liveQuestion(draft)}>
        {tr(COPY.liveAsk, locale)}
      </button>
    </form>
  );
}

function LiveHead({ model, locale }: { model: LadderModel; locale: Locale }) {
  const size = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(model.paramsB);
  return (
    <header className={styles.liveHead}>
      <span className={styles.colTitle}>{model.name}</span>
      <span className={styles.liveSize}>
        {size} {tr(COPY.billionParams, locale)}
      </span>
    </header>
  );
}

function LiveBody({ answer, locale }: { answer: LiveAnswer | null; locale: Locale }) {
  if (!answer) return null;
  if (answer.state === "waiting" || answer.state === "thinking") {
    return (
      <p className={styles.liveAnswer}>
        <Pending>{tr(answer.state === "thinking" ? COPY.liveThinking : COPY.liveWaiting, locale)}</Pending>
      </p>
    );
  }
  const text = stripEmphasis(answer.text).trim();
  const cut = answer.finishReason === "length";
  return (
    <>
      {text || answer.state === "done" ? (
        <p className={styles.liveAnswer}>
          {text || tr(COPY.liveEmpty, locale)}
          {cut ? "…" : null}
        </p>
      ) : null}
      {cut ? <p className={styles.liveNote}>{tr(COPY.liveCut, locale)}</p> : null}
      {answer.state === "error" ? (
        <p className={styles.liveError}>
          {tr(COPY.liveNoAnswer, locale)} {answer.error}
        </p>
      ) : null}
    </>
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
                {r.cost ? `${tr(COPY.estimatedCost, locale)} ${tr(r.cost, locale)}` : tr(COPY.costUnknown, locale)}
              </span>
            </span>
            <span className={styles.rungText}>
              <q className={styles.rungAnswer} lang="en">
                {r.answer}
              </q>
              <Translation text={locale === "en" ? undefined : own(r.translation as Partial<Record<Locale, string>> | undefined, locale)} locale={locale} />
            </span>
            <Mark correct={r.correct} locale={locale} />
          </li>
        ))}
        <li className={cx(styles.rung, styles.rungNow, stage < last && styles.hidden)} aria-hidden={stage < last}>
          <span className={styles.rungWho}>
            <span className={styles.colTitle}>{q.today.model}</span>
            <span className={styles.colYear}>{q.today.date.slice(0, 4)}</span>
            <span className={styles.rungCost}>
              {tr(COPY.recordedAnswer, locale)}, {formatDate(q.today.date, locale)}
            </span>
          </span>
          <q className={styles.rungAnswer}>{tr(q.today.answer, locale)}</q>
          <Mark correct locale={locale} />
        </li>
      </ol>
      <p className={styles.ladderSource}>{tr(COPY.publishedBy, locale)}</p>
    </div>
  );
}

/**
 * A translation of an English model answer, for the audience: in italics and
 * labelled, so it is never mistaken for what the model wrote.
 */
function Translation({ text, locale }: { text: string | undefined; locale: Locale }) {
  if (!text || locale === "en") return null;
  return (
    <span className={styles.translation}>
      <span className={styles.translationLabel}>{tr(COPY.translation, locale)}</span> <em>{typeset(text, locale)}</em>
    </span>
  );
}

function truncateMaybe(text: string | undefined, n: number): string | undefined {
  return text === undefined ? undefined : truncate(text, n);
}

/** The translation of one of GPT-2's recorded answers, if any. */
function gpt2Translation(text: string | undefined, locale: Locale): string | undefined {
  if (!text || locale === "en") return undefined;
  return own(GPT2_ANSWER_TRANSLATIONS[text.trim()] as Partial<Record<Locale, string>> | undefined, locale)
}

/** Correct / incorrect: shape and word, never color alone. */
function Mark({ correct, locale }: { correct: boolean; locale: Locale }) {
  return (
    <span className={cx(styles.mark, correct ? styles.markOk : styles.markNo)}>
      <span aria-hidden="true">{correct ? "✓" : "✗"}</span> {correct ? tr(COPY.correctMark, locale) : tr(COPY.incorrectMark, locale)}
    </span>
  );
}

function formatDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(intlLocale(locale), { day: "numeric", month: "long", year: "numeric" });
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
