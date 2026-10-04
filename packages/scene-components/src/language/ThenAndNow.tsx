/**
 * ThenAndNow: trick questions that fooled older language models.
 *
 * - game (scene 1.1): the clock riddle; each click reveals one generation's
 *   published answer, then today's recorded answer, then the live ladder: a
 *   question typed in any interactive window, answered side by side by three
 *   open models streamed from the server (/api/llm/ladder). In Simulation the
 *   ladder shows a recorded run of a fixed question, locked and labelled.
 *   Nothing runs in the browser.
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
import { useGpt2Answers, useLiveLadderRecording } from "./runtime.ts";
import { keepKeys } from "../primitives/Controls.tsx";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { stripEmphasis } from "./format.ts";
import { useSourceDecision } from "./source.ts";
import { useOnStepChange, useSceneState } from "./state.ts";
import {
  applyLadderEvent,
  failLive,
  filledSlots,
  gameQuestion,
  LIVE_MAX_CHARS,
  type LiveAnswer,
  type LiveLadder,
  lastStage,
  liveQuestion,
  liveStage,
  maxStage,
  pickQuestions,
  questionRuns,
  recordedLive,
  startLive,
  truncate,
} from "./thenAndNow.ts";
import styles from "./ThenAndNow.module.css";
import { cx, Frame, Pending } from "./ui.tsx";

export interface ThenAndNowProps {
  variant?: "game" | "recap";
  questionIds?: string[];
}

/** The stage follows the reveal step; only the live step keeps state. */
export interface ThenAndNowState {
  /** The live step's last question and its streamed answers. */
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
  const riddle = gameQuestion(props.questionIds);
  const [state, setState] = useSceneState<ThenAndNowState>(ctx, () => ({ live: null }), { throttleMs: 60 });
  const liveAbort = useRef<AbortController | null>(null);
  const { decision } = useSourceDecision(ctx);
  const recording = useLiveLadderRecording();
  const canAskLive = decision.active === "hf";

  useEffect(() => () => liveAbort.current?.abort(), []);

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

  // The field works in every interactive window (presenter or projector); only the stage owner calls the models.
  const act = useSceneActions<LiveAction, ThenAndNowState>(ctx, (a) => {
    if (a.type === "ask") void askLive(a.question);
  });
  // Other windows cannot ask the server whether Hugging Face is on: the owner publishes it.
  useEffect(() => {
    if (role === "controller" && Boolean(state.liveOff) !== !canAskLive) setState((s) => ({ ...s, liveOff: !canAskLive }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, canAskLive, state.liveOff]);

  if (!riddle) return <Frame />;
  const view: ThenAndNowState = role === "preview" || (role === "display" && ctx.state === undefined) ? { live: null } : state;
  // One stage per click: the riddle, each published answer, today's, then the live ladder.
  const stage = role === "preview" ? 0 : Math.min(maxStage(riddle), ctx.revealStep);

  if (stage >= (liveStage(riddle) ?? Infinity)) {
    const off = role === "controller" ? !canAskLive : Boolean(view.liveOff);
    // Simulation: the recorded run of a fixed question, locked, labelled as recorded.
    const shown = off ? recordedLive(recording, locale) : (view.live ?? null);
    return (
      <Frame label={tr(ctx.scene.title, locale)}>
        <LiveView
          live={shown}
          interactive={role !== "preview" && canInteract(ctx)}
          locked={off}
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
    <Frame label={tr(ctx.scene.title, locale)}>
      <p className={cx(styles.question, styles.questionCompact)}>
        <QuestionText text={tr(riddle.question, locale)} />
      </p>
      {riddle.ladder && locale !== "en" ? (
        <p className={styles.original}>
          {tr(COPY.askedInEnglish, locale)} <q>{riddle.ladder.originalPrompt}</q>
        </p>
      ) : null}
      <LadderView q={riddle} stage={stage} locale={locale} />
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
 * smallest first, each answer growing as its words arrive. Locked (Simulation),
 * the field holds the recorded question and every answer is labelled recorded.
 * Windows that cannot act (previews, the presenter's projector mirror) show the
 * question as text.
 */
function LiveView({
  live,
  interactive,
  locked,
  onAsk,
  locale,
}: {
  live: LiveLadder | null;
  interactive: boolean;
  locked: boolean;
  onAsk: (question: string) => void;
  locale: Locale;
}) {
  const question = live?.question ?? "";
  return (
    <div className={styles.liveWrap}>
      {interactive || !question ? (
        <LiveField
          value={question}
          locked={locked || !interactive}
          busy={live?.running === true}
          onAsk={onAsk}
          locale={locale}
        />
      ) : (
        <p className={styles.liveQuestion}>{question}</p>
      )}
      <ol className={styles.live}>
        {LADDER_MODELS.map((m) => (
          <li key={m.id} className={styles.liveCol}>
            <LiveHead model={m} locale={locale} />
            {live?.recordedOn ? (
              <span className={styles.liveRecorded}>
                {tr(COPY.recordedAnswer, locale)}, {formatDate(live.recordedOn, locale)}
              </span>
            ) : null}
            <LiveBody answer={live?.answers[m.id] ?? null} locale={locale} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The question field: keeps its own draft while focused, otherwise shows the
 * last question asked (from whichever window asked it). Locked: read only.
 */
function LiveField({
  value,
  locked,
  busy,
  onAsk,
  locale,
}: {
  value: string;
  locked: boolean;
  busy: boolean;
  onAsk: (q: string) => void;
  locale: Locale;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current || locked) setDraft(value);
  }, [value, locked]);
  return (
    <form
      className={styles.liveForm}
      data-keys-local=""
      onSubmit={(e) => {
        e.preventDefault();
        if (!locked) onAsk(draft);
      }}
    >
      <input
        className={styles.liveInput}
        value={locked ? value : draft}
        readOnly={locked}
        placeholder={tr(COPY.livePlaceholder, locale)}
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
      <button type="submit" className={styles.liveAskButton} disabled={locked || busy || !liveQuestion(draft)}>
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
