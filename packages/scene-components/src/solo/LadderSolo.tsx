/**
 * Then and now, solo: one question, three open models of increasing size
 * answering at once as their words stream in (the ThenAndNow scene's live
 * ladder, same logic, phone layout). With live calls off, the published
 * answers of four GPT generations to the talk's riddle.
 */
import { type FormEvent, useEffect, useRef, useState } from "react";
import { intlLocale, own, tr, typeset, type Locale } from "@ai-exhibit/presentation-core";
import { cloudLadder, CloudLlmError, LADDER_MODELS } from "@ai-exhibit/ml-runtime/lm";
import { COPY } from "../language/copy.ts";
import { stripEmphasis } from "../language/format.ts";
import {
  applyLadderEvent,
  failLive,
  LIVE_MAX_CHARS,
  type LiveAnswer,
  type LiveLadder,
  liveQuestion,
  pickQuestions,
  startLive,
} from "../language/thenAndNow.ts";
import { SOLO } from "./copy.ts";
import { canAsk, type SoloEnv } from "./env.ts";
import { AsksLeft, BusyNotice, cx, RecordedTag, SoloRoot, soloStyles as styles } from "./ui.tsx";

export default function LadderSolo({ env }: { env: SoloEnv }) {
  const { locale } = env;
  // Prefilled with the same question as the slide; the visitor can replace it.
  const [draft, setDraft] = useState(tr(COPY.livePlaceholder, locale));
  const [live, setLive] = useState<LiveLadder | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const asking = canAsk(env, "ladder");

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    const question = liveQuestion(draft);
    if (!question || live?.running) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setBusy(false);
    let run = startLive(question, LADDER_MODELS.map((m) => m.id));
    setLive(run);
    try {
      await cloudLadder(
        question,
        (ev) => {
          run = applyLadderEvent(run, ev);
          setLive(run);
        },
        { ...env.cloud("ladder"), signal: ac.signal },
      );
      if (run.running) run = failLive(run, tr(COPY.liveStreamCut, locale));
      setLive(run);
    } catch (err) {
      if (ac.signal.aborted) return;
      const trouble = env.report(err);
      setBusy(trouble === "busy");
      setLive(trouble === "busy" ? null : failLive(run, err instanceof CloudLlmError ? err.message : String(err)));
    }
  };

  if (!asking) {
    return (
      <SoloRoot label={tr(SOLO.ladderRecorded, locale)}>
        <AsksLeft env={env} demo="ladder" />
        <p className={styles.intro}>{tr(SOLO.ladderRecorded, locale)}</p>
        <Published locale={locale} />
      </SoloRoot>
    );
  }

  return (
    <SoloRoot label={tr(SOLO.ladderIntro, locale)}>
      <p className={styles.intro}>{tr(SOLO.ladderIntro, locale)}</p>
      <form className={styles.form} onSubmit={ask}>
        <label className={styles.label} htmlFor="solo-ladder">
          {tr(COPY.liveQuestion, locale)}
        </label>
        <textarea
          id="solo-ladder"
          className={styles.input}
          rows={2}
          value={draft}
          maxLength={LIVE_MAX_CHARS}
          onChange={(e) => setDraft(e.currentTarget.value)}
        />
        <div className={styles.buttons}>
          <button type="submit" className={cx(styles.button, styles.primary)} disabled={!liveQuestion(draft) || live?.running === true}>
            {tr(COPY.liveAsk, locale)}
          </button>
        </div>
      </form>
      <p className={styles.note}>{tr(SOLO.ladderCost, locale)}</p>
      <AsksLeft env={env} demo="ladder" />
      {busy ? <BusyNotice locale={locale} /> : null}
      {live ? (
        <ol className={styles.list}>
          {LADDER_MODELS.map((m) => (
            <li key={m.id} className={styles.card}>
              <header className={styles.cardHead}>
                <h3 className={styles.cardTitle}>{m.name}</h3>
                <span className={styles.cardMeta}>
                  {new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(m.paramsB)} {tr(COPY.billionParams, locale)}
                </span>
              </header>
              <LiveText answer={live.answers[m.id] ?? null} locale={locale} />
            </li>
          ))}
        </ol>
      ) : null}
    </SoloRoot>
  );
}

function LiveText({ answer, locale }: { answer: LiveAnswer | null; locale: Locale }) {
  if (!answer) return null;
  if (answer.state === "waiting" || answer.state === "thinking") {
    return <p className={styles.pending}>{tr(answer.state === "thinking" ? COPY.liveThinking : COPY.liveWaiting, locale)}…</p>;
  }
  const text = stripEmphasis(answer.text).trim();
  const cut = answer.finishReason === "length";
  return (
    <>
      {text || answer.state === "done" ? (
        <p className={styles.answer}>
          {text || tr(COPY.liveEmpty, locale)}
          {cut ? "…" : null}
        </p>
      ) : null}
      {cut ? <p className={styles.note}>{tr(COPY.liveCut, locale)}</p> : null}
      {answer.state === "error" ? (
        <p className={styles.error}>
          {tr(COPY.liveNoAnswer, locale)} {answer.error}
        </p>
      ) : null}
    </>
  );
}

/** The riddle's published answers, oldest first, then today's recorded one. */
function Published({ locale }: { locale: Locale }) {
  const q = pickQuestions(undefined, "game").find((x) => x.ladder);
  if (!q?.ladder) return null;
  return (
    <>
      <p className={styles.text}>{tr(q.question, locale)}</p>
      {locale !== "en" ? (
        <p className={styles.note}>
          {tr(COPY.askedInEnglish, locale)} <q lang="en">{q.ladder.originalPrompt}</q>
        </p>
      ) : null}
      <ol className={styles.list}>
        {q.ladder.rungs.map((r) => {
          const translation = locale === "en" ? undefined : own(r.translation as Partial<Record<Locale, string>> | undefined, locale);
          return (
            <li key={r.generation} className={styles.card}>
              <header className={styles.cardHead}>
                <h3 className={styles.cardTitle}>{r.generation}</h3>
                <span className={styles.cardMeta}>
                  {r.year}, {r.cost ? `${tr(COPY.estimatedCost, locale)} ${tr(r.cost, locale)}` : tr(COPY.costUnknown, locale)}
                </span>
              </header>
              <p className={styles.answer}>
                <q lang="en">{r.answer}</q>
                {translation ? (
                  <span className={styles.translation}>
                    {tr(COPY.translation, locale)} <em>{typeset(translation, locale)}</em>
                  </span>
                ) : null}
              </p>
              <Mark correct={r.correct} locale={locale} />
            </li>
          );
        })}
        <li className={styles.card}>
          <header className={styles.cardHead}>
            <h3 className={styles.cardTitle}>{q.today.model}</h3>
            <span className={styles.cardMeta}>
              {q.today.date.slice(0, 4)}, {tr(COPY.recordedAnswer, locale)}
            </span>
          </header>
          <p className={styles.answer}>
            <q>{tr(q.today.answer, locale)}</q>
          </p>
          <Mark correct locale={locale} />
        </li>
      </ol>
      <p className={styles.note}>{tr(COPY.publishedBy, locale)}</p>
      <RecordedTag locale={locale} />
    </>
  );
}

function Mark({ correct, locale }: { correct: boolean; locale: Locale }) {
  return (
    <span className={cx(styles.mark, correct ? styles.markOk : styles.markNo)}>
      <span aria-hidden="true">{correct ? "✓" : "✗"}</span> {tr(correct ? COPY.correctMark : COPY.incorrectMark, locale)}
    </span>
  );
}
