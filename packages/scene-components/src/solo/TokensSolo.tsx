/**
 * Tokens, solo: type a sentence and see how the cloud model's tokenizer
 * (Llama 3.1) cuts it, run by the server for free. Recorded examples when
 * live calls are off. Reuses the tokenizer scene's tiles, examples and copy.
 */
import { useEffect, useRef, useState } from "react";
import { pick, tr } from "@ai-exhibit/presentation-core";
import { cloudTokenize, findRecordedTokenization, MAX_INPUT_CHARS, type RecordedToken } from "@ai-exhibit/ml-runtime/lm";
import { Rich } from "../primitives/Rich.tsx";
import { COPY } from "../language/copy.ts";
import { DEFAULT_TOKENIZER_EXAMPLES } from "../language/data.ts";
import { charCount, formatInt } from "../language/format.ts";
import { useTokenizationRecording } from "../language/runtime.ts";
import { TokenizedText } from "../language/TokenizerPlayground.tsx";
import { SOLO } from "./copy.ts";
import type { SoloEnv } from "./env.ts";
import { BusyNotice, Chips, cx, RecordedTag, SoloRoot, soloStyles as styles } from "./ui.tsx";

const TOKENIZER = "llama-3.1";

export default function TokensSolo({ env }: { env: SoloEnv }) {
  const { locale } = env;
  const examples = DEFAULT_TOKENIZER_EXAMPLES.map((e) => pick(e, locale));
  const recording = useTokenizationRecording();
  const [text, setText] = useState(examples[0] ?? "");
  const [tokens, setTokens] = useState<RecordedToken[]>([]);
  const [shownFor, setShownFor] = useState<string | null>(null);
  const [source, setSource] = useState<"live" | "recorded">("recorded");
  const [busy, setBusy] = useState(false);
  const [ids, setIds] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    const recorded = findRecordedTokenization(recording, TOKENIZER, text);
    if (!env.live || !text.trim()) {
      setTokens(recorded?.tokens ?? []);
      setShownFor(text);
      setSource("recorded");
      return;
    }
    const ac = new AbortController();
    const timer = setTimeout(() => {
      cloudTokenize(text, TOKENIZER, { ...env.cloud, signal: ac.signal }).then(
        (r) => {
          if (id !== request.current) return;
          setTokens(r.tokens);
          setShownFor(text);
          setSource("live");
          setBusy(false);
        },
        (err: unknown) => {
          if (id !== request.current || ac.signal.aborted) return;
          setBusy(env.report(err) === "busy");
        },
      );
    }, 350);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, env.live, recording]);

  const shown = shownFor === text ? tokens : [];
  return (
    <SoloRoot label={tr(COPY.tokenizer, locale)}>
      <label className={styles.form}>
        <span className={styles.label}>{tr(SOLO.tokensField, locale)}</span>
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          maxLength={MAX_INPUT_CHARS}
          disabled={!env.live}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setText(e.currentTarget.value)}
        />
      </label>
      <Chips label={tr(COPY.examples, locale)} items={examples} value={examples.includes(text) ? text : null} onPick={setText} />
      <p className={styles.note}>{tr(env.live ? SOLO.tokensFree : SOLO.tokensRecorded, locale)}</p>
      {busy ? <BusyNotice locale={locale} /> : null}
      <div className={cx(styles.card)}>
        <TokenizedText text={text} tokens={shown} showIds={ids} animate={!env.reducedMotion} locale={locale} />
      </div>
      {shown.length > 0 ? (
        <p className={styles.intro}>
          <b>{formatInt(shown.length, locale)}</b> <Rich text={tr(shown.length > 1 ? COPY.tokens : COPY.token, locale)} /> /{" "}
          <b>{formatInt(charCount(text), locale)}</b> {tr(COPY.characters, locale)}
        </p>
      ) : null}
      {shown.some((t) => text.slice(t.start, t.end).startsWith(" ")) ? <p className={styles.note}>{tr(COPY.spaceLegend, locale)}</p> : null}
      {shown.some((t) => t.partial) ? (
        <p className={styles.note}>
          <Rich text={tr(COPY.partialLegend, locale)} />
        </p>
      ) : null}
      <div className={styles.buttons}>
        <button type="button" className={styles.button} aria-pressed={ids} onClick={() => setIds(!ids)}>
          {tr(ids ? COPY.hideIds : COPY.showIds, locale)}
        </button>
        {source === "recorded" && shown.length > 0 ? <RecordedTag locale={locale} /> : null}
      </div>
    </SoloRoot>
  );
}
