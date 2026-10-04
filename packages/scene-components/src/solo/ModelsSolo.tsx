/**
 * Base model and assistant, solo: the base model (Llama 3.1 8B, pretraining
 * only) continues a text by 10 tokens at a time; the assistant (Llama 3.1 8B
 * Instruct) answers a question as long as it likes. With live calls off, the recorded
 * real answers to the prepared prompts. Each card has its own temperature
 * (default 1) for its next call. Reuses the playground scenes' presets,
 * messages, recordings and copy.
 */
import { type FormEvent, useRef, useState } from "react";
import { pick, tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { cloudChat, cloudComplete, findCloudRecording, MAX_INPUT_CHARS, MAX_OUTPUT_TOKENS } from "@ai-exhibit/ml-runtime/lm";
import { Rich } from "../primitives/Rich.tsx";
import { COPY } from "../language/copy.ts";
import { assistantMessages, CHAT_PRESETS, DEFAULT_BASE_PROMPT } from "../language/data.ts";
import { stripEmphasis } from "../language/format.ts";
import { DEFAULT_TEMPERATURE, formatTemperature, TEMPERATURES } from "../language/shared.ts";
import { useCloudRecording } from "../language/runtime.ts";
import { SOLO } from "./copy.ts";
import { canAsk, type SoloEnv } from "./env.ts";
import { AsksLeft, BusyNotice, Chips, cx, RecordedTag, SoloRoot, soloStyles as styles } from "./ui.tsx";

/** Tokens the base model adds per press. */
export const ADD_TOKENS = 10;
/** The assistant answers freely: the server's ceiling, which models stop well before. */
export const ANSWER_TOKENS = MAX_OUTPUT_TOKENS;
const BASE_LABEL = "Llama 3.1 8B";
const CHAT_LABEL = "Llama 3.1 8B Instruct";

/**
 * Temperature for the next generation, the same choices as on the slides.
 * With recorded answers it is off, with the usual short note.
 */
function Temperature({ locale, value, onChange, live, disabled }: { locale: Locale; value: number; onChange: (v: number) => void; live: boolean; disabled?: boolean }) {
  const items = TEMPERATURES.map((t) => formatTemperature(t, locale));
  return (
    <div className={styles.form}>
      <span className={styles.label}>{tr(COPY.temperature, locale)}</span>
      <Chips
        label={tr(COPY.temperature, locale)}
        items={items}
        value={live ? formatTemperature(value, locale) : null}
        disabled={!live || disabled}
        onPick={(item) => onChange(TEMPERATURES[items.indexOf(item)] ?? DEFAULT_TEMPERATURE)}
      />
      <p className={styles.note}>{tr(live ? COPY.temperatureHint : COPY.simulationPresetsOnly, locale)}</p>
    </div>
  );
}

export default function ModelsSolo({ env }: { env: SoloEnv }) {
  return (
    <SoloRoot label={`${tr(COPY.baseTitle, env.locale)}, ${tr(SOLO.assistantTitle, env.locale)}`}>
      <BaseModel env={env} />
      <Assistant env={env} />
    </SoloRoot>
  );
}

function BaseModel({ env }: { env: SoloEnv }) {
  const { locale } = env;
  const planned = pick(DEFAULT_BASE_PROMPT as L10n, locale);
  const recordings = useCloudRecording();
  const [prompt, setPrompt] = useState(planned);
  const [added, setAdded] = useState<string[]>([]);
  const [source, setSource] = useState<"live" | "recorded" | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const run = useRef(0);
  const live = canAsk(env, "base");

  const startOver = (text = planned) => {
    run.current++;
    setPrompt(text);
    setAdded([]);
    setSource(null);
    setPending(false);
    setBusy(false);
  };

  const add = async () => {
    const id = ++run.current;
    setBusy(false);
    if (!live) {
      const rec = findCloudRecording(recordings, "base", planned);
      setPrompt(planned);
      setAdded(rec ? [rec.text] : []);
      setSource("recorded");
      return;
    }
    setPending(true);
    try {
      const full = prompt + added.join("");
      const r = await cloudComplete({ prompt: full, maxTokens: ADD_TOKENS, temperature }, env.cloud("base"));
      if (id !== run.current) return;
      setAdded((a) => [...a, r.text]);
      setSource("live");
    } catch (err) {
      if (id !== run.current) return;
      setBusy(env.report(err) === "busy");
    } finally {
      if (id === run.current) setPending(false);
    }
  };

  const full = prompt + added.join("");
  return (
    <div className={styles.solo}>
      <header>
        <h3 className={styles.cardTitle}>
          <Rich text={tr(COPY.baseTitle, locale)} /> <span className={styles.modelName}>{BASE_LABEL}</span>
        </h3>
        <p className={styles.intro}>{tr(SOLO.baseIntro, locale)}</p>
      </header>
      <AsksLeft env={env} demo="base" />
      {live ? (
        <label className={styles.form}>
          <span className={styles.label}>{tr(SOLO.baseField, locale)}</span>
          <textarea
            className={styles.input}
            rows={2}
            value={prompt}
            maxLength={MAX_INPUT_CHARS}
            disabled={pending}
            onChange={(e) => startOver(e.currentTarget.value)}
          />
        </label>
      ) : null}
      <p className={styles.text} aria-live="polite">
        {prompt}
        {added.map((piece, i) => (
          <span key={i} className={styles.added}>
            {piece}
          </span>
        ))}
        {pending ? <span className={styles.pending}> …</span> : null}
      </p>
      {busy ? <BusyNotice locale={locale} /> : null}
      <Temperature locale={locale} value={temperature} onChange={setTemperature} live={live} disabled={pending} />
      <div className={styles.buttons}>
        <button
          type="button"
          className={cx(styles.button, styles.primary)}
          disabled={pending || !prompt.trim() || full.length > MAX_INPUT_CHARS * 4 || (!live && source === "recorded")}
          onClick={() => void add()}
        >
          {live ? tr(SOLO.addTokens, locale) : tr(SOLO.showRecorded, locale)}
        </button>
        {added.length ? (
          <button type="button" className={styles.button} onClick={() => startOver()}>
            {tr(SOLO.startOver, locale)}
          </button>
        ) : null}
        {source === "recorded" ? <RecordedTag locale={locale} /> : null}
      </div>
    </div>
  );
}

interface Answer {
  question: string;
  text: string;
  cut: boolean;
  source: "live" | "recorded";
}

function Assistant({ env }: { env: SoloEnv }) {
  const { locale } = env;
  const presets = CHAT_PRESETS.map((p) => pick(p, locale));
  const recordings = useCloudRecording();
  const [draft, setDraft] = useState(presets[0] ?? "");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const run = useRef(0);
  const live = canAsk(env, "assistant");

  const recorded = (question: string) => {
    const rec = findCloudRecording(recordings, "chat", question);
    setAnswer(rec ? { question, text: rec.text, cut: rec.finishReason === "length", source: "recorded" } : null);
  };

  const ask = async (typed: string) => {
    const question = typed.trim().slice(0, MAX_INPUT_CHARS);
    if (!question) return;
    const id = ++run.current;
    setBusy(false);
    if (!live) return recorded(question);
    setPending(true);
    setAnswer(null);
    try {
      const r = await cloudChat({ messages: assistantMessages(locale, question), maxTokens: ANSWER_TOKENS, temperature }, env.cloud("assistant"));
      if (id !== run.current) return;
      setAnswer({ question, text: r.text, cut: r.finishReason === "length", source: "live" });
    } catch (err) {
      if (id !== run.current) return;
      const trouble = env.report(err);
      setBusy(trouble === "busy");
      if (trouble !== "busy") recorded(question);
    } finally {
      if (id === run.current) setPending(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  return (
    <div className={styles.solo}>
      <header>
        <h3 className={styles.cardTitle}>
          {tr(SOLO.assistantTitle, locale)} <span className={styles.modelName}>{CHAT_LABEL}</span>
        </h3>
        <p className={styles.intro}>{tr(SOLO.assistantIntro, locale)}</p>
      </header>
      <AsksLeft env={env} demo="assistant" />
      {live ? (
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label} htmlFor="solo-question">
            {tr(SOLO.questionField, locale)}
          </label>
          <div className={styles.row}>
            <input
              id="solo-question"
              className={styles.input}
              value={draft}
              maxLength={MAX_INPUT_CHARS}
              enterKeyHint="send"
              autoComplete="off"
              onChange={(e) => setDraft(e.currentTarget.value)}
            />
            <button type="submit" className={cx(styles.button, styles.primary)} disabled={pending || !draft.trim()}>
              {tr(COPY.liveAsk, locale)}
            </button>
          </div>
        </form>
      ) : (
        <p className={styles.note}>{tr(SOLO.pickQuestion, locale)}</p>
      )}
      <Temperature locale={locale} value={temperature} onChange={setTemperature} live={live} disabled={pending} />
      {/* Live, visitors ask their own question; the examples only serve the recorded fallback. */}
      {!env.live ? (
      <Chips
          label={tr(COPY.examples, locale)}
          items={presets}
          value={answer?.question ?? null}
          disabled={pending}
          onPick={(q) => {
            setDraft(q);
            void ask(q);
          }}
        />
      ) : null}
      {busy ? <BusyNotice locale={locale} /> : null}
      {pending ? <p className={styles.pending}>{tr(COPY.thinking, locale)}</p> : null}
      {answer ? (
        <div className={styles.card} aria-live="polite">
          <p className={styles.label}>{answer.question}</p>
          <p className={styles.answer}>
            {stripEmphasis(answer.text).trim()}
            {answer.cut ? "…" : null}
          </p>
          {answer.cut ? <p className={styles.note}>{tr(COPY.liveCut, locale)}</p> : null}
          {answer.source === "recorded" ? <RecordedTag locale={locale} /> : null}
        </div>
      ) : null}
      {live ? <p className={styles.note}>{tr(SOLO.shortAnswers, locale)}</p> : null}
    </div>
  );
}
