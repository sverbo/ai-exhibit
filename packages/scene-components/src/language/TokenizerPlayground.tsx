import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { pick, tr, type L10n } from "@ai-exhibit/presentation-core";
import { CloudLlmError, cloudTokenize, type CloudTokenizerId, findRecordedTokenization, type RecordedToken } from "@ai-exhibit/ml-runtime/lm";
import type { SceneComponentProps } from "../contract.ts";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { Rich } from "../primitives/Rich.tsx";
import { COPY } from "./copy.ts";
import { DEFAULT_TOKENIZER_EXAMPLES } from "./data.ts";
import { charCount, formatInt } from "./format.ts";
import { useTokenizationRecording } from "./runtime.ts";
import { useSourceDecision } from "./source.ts";
import { useOnStepChange, useSceneState } from "./state.ts";
import styles from "./TokenizerPlayground.module.css";
import { Button, cx, Frame, Notice, Pending, RecordedTag, Segmented, SourceBadge, TextField } from "./ui.tsx";

/** Tokenize once typing pauses this long: one request per pause, not one per letter. */
const TYPING_PAUSE_MS = 350;
/** After a "too many requests" answer, try again this much later. */
const RATE_LIMIT_RETRY_MS = 2000;

type Action =
  | { type: "text"; text: string }
  | { type: "tokenizer"; id: CloudTokenizerId }
  | { type: "ids"; shown: boolean };

export interface TokenizerPlaygroundProps {
  showIds?: boolean;
  tokenizer?: CloudTokenizerId;
  examples?: L10n[];
}

export interface TokenizerState {
  text: string;
  tokenizerId: CloudTokenizerId;
  tokens: RecordedToken[];
  /** null: follow the reveal step. */
  idsShown: boolean | null;
  source: "live" | "recorded";
  notice: "typingNeedsTokenizer" | null;
}

const TOKENIZER_LABELS: Record<CloudTokenizerId, string> = { "llama-3.1": "Llama 3.1", gpt2: "GPT-2" };

function tokenizerLabel(id: CloudTokenizerId): string {
  return TOKENIZER_LABELS[id] ?? id;
}

/**
 * Text cut into tokens by a real tokenizer: with Hugging Face, the cloud
 * model's own (Llama 3.1) or GPT-2's, run by the server (/api/tokenize); in
 * Simulation, the same tokenizers' recorded output for the prepared examples.
 */
export function TokenizerPlayground({ props, ctx }: SceneComponentProps<TokenizerPlaygroundProps, TokenizerState>) {
  const { locale, role } = ctx;
  const examples = (props.examples?.length ? props.examples : DEFAULT_TOKENIZER_EXAMPLES).map((e) => pick(e, locale));
  const defaultTokenizer: CloudTokenizerId = props.tokenizer && props.tokenizer in TOKENIZER_LABELS ? props.tokenizer : "llama-3.1";
  const recording = useTokenizationRecording();

  const initial = (): TokenizerState => {
    const text = examples[0] ?? "";
    const rec = findRecordedTokenization(recording, defaultTokenizer, text);
    return { text, tokenizerId: defaultTokenizer, tokens: rec?.tokens ?? [], idsShown: null, source: "recorded", notice: null };
  };
  const [state, setState] = useSceneState<TokenizerState>(ctx, initial, { throttleMs: 60 });
  const { decision, cloudFailed } = useSourceDecision(ctx);
  const live = decision.active === "hf";

  // Controller: (re)tokenize whenever the text or tokenizer changes, once typing pauses.
  const request = useRef(0);
  // Bumped to try again after the server said "too many requests": that is not a failure of the model.
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (role !== "controller") return;
    const id = ++request.current;
    const { text, tokenizerId } = state;
    const rec = findRecordedTokenization(recording, tokenizerId, text);
    if (!live) {
      if (!recording) return;
      setState((s) => ({ ...s, tokens: rec?.tokens ?? [], source: "recorded", notice: rec ? null : "typingNeedsTokenizer" }));
      return;
    }
    const ac = new AbortController();
    const timer = setTimeout(() => {
      cloudTokenize(text, tokenizerId, { signal: ac.signal }).then(
        (r) => {
          if (id !== request.current) return;
          setState((s) => ({ ...s, tokens: r.tokens, source: "live", notice: null }));
        },
        (err: unknown) => {
          if (id !== request.current || ac.signal.aborted) return;
          if (err instanceof CloudLlmError && err.code === "rate-limited") {
            setTimeout(() => setRetry((n) => n + 1), RATE_LIMIT_RETRY_MS);
            return;
          }
          cloudFailed();
        },
      );
    }, TYPING_PAUSE_MS);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, state.text, state.tokenizerId, live, recording, retry]);

  // Every window's controls come here; only the stage owner changes the state.
  const act = useSceneActions<Action, TokenizerState>(ctx, (a) => {
    if (a.type === "text") setState((s) => ({ ...s, text: a.text }));
    else if (a.type === "tokenizer") setState((s) => ({ ...s, tokenizerId: a.id }));
    else setState((s) => ({ ...s, idsShown: a.shown }));
  });

  // A reveal step hands control of the IDs back to the step.
  useOnStepChange(ctx.revealStep, () => setState((s) => ({ ...s, idsShown: null })));

  // Preview, or a display before the controller published anything: first recorded example.
  const view: TokenizerState =
    role === "preview" || (role === "display" && ctx.state === undefined) ? initial() : state;
  const sceneSteps = ctx.scene.steps ?? 0;
  const idsVisible = Boolean(props.showIds) && (view.idsShown ?? (sceneSteps > 0 ? ctx.revealStep >= 1 : true));

  const controls = canInteract(ctx) ? (
    <>
      <TextField
        wide
        label={tr(COPY.typeHere, locale)}
        value={view.text}
        disabled={!live}
        // Typing in a window that does not run the stage sends the text in small batches.
        debounceMs={role === "controller" ? 0 : 150}
        onChange={(text) => act({ type: "text", text })}
      />
      <Segmented
        label={tr(COPY.examples, locale)}
        value={examples.includes(view.text) ? view.text : null}
        options={examples.map((ex) => ({ value: ex, label: ex.length > 14 ? `${ex.slice(0, 13)}…` : ex }))}
        onChange={(text) => act({ type: "text", text })}
      />
      <Segmented
        label={tr(COPY.tokenizer, locale)}
        value={view.tokenizerId}
        options={(Object.keys(TOKENIZER_LABELS) as CloudTokenizerId[]).map((id) => ({ value: id, label: TOKENIZER_LABELS[id] }))}
        onChange={(id) => act({ type: "tokenizer", id })}
      />
      {props.showIds ? (
        <Button active={idsVisible} onClick={() => act({ type: "ids", shown: !idsVisible })}>
          {idsVisible ? tr(COPY.hideIds, locale) : tr(COPY.showIds, locale)}
        </Button>
      ) : null}
      {role === "controller" && live && state.source !== "live" ? <Pending>{tr(COPY.loadingTokenizer, locale)}</Pending> : null}
      {role === "controller" ? <SourceBadge decision={decision} model={tokenizerLabel(state.tokenizerId)} locale={locale} /> : null}
    </>
  ) : null;

  return (
    <Frame controls={controls} label={tr(ctx.scene.title, locale)}>
      <TokenizedText
        text={view.text}
        tokens={view.tokens}
        showIds={idsVisible}
        animate={role !== "preview" && !ctx.reducedMotion}
        locale={locale}
      />
      <footer className={styles.footer}>
        {view.tokens.length > 0 ? (
          <p className={styles.count}>
            <b>{formatInt(view.tokens.length, locale)}</b>{" "}
            <Rich text={view.tokens.length > 1 ? tr(COPY.tokens, locale) : tr(COPY.token, locale)} />
            <span className={styles.countSep}>/</span>
            <b>{formatInt(charCount(view.text), locale)}</b> {tr(COPY.characters, locale)}
            <span className={styles.tokenizerName}>{tokenizerLabel(view.tokenizerId)}</span>
          </p>
        ) : null}
        <p className={styles.legend}>
          {view.tokens.some((t) => view.text.slice(t.start, t.end).startsWith(" ")) ? (
            <span>{tr(COPY.spaceLegend, locale)}</span>
          ) : null}
          {view.tokens.some((t) => t.partial) ? <span><Rich text={tr(COPY.partialLegend, locale)} /></span> : null}
        </p>
        {view.source === "recorded" && role !== "preview" ? (
          <div className={styles.status}>
            <RecordedTag locale={locale} />
            {view.notice ? <Notice reason={null} locale={locale} extra={tr(COPY.typingNeedsTokenizer, locale)} /> : null}
          </div>
        ) : null}
      </footer>
    </Frame>
  );
}

const PALETTE = ["--color-accent", "--color-accent-2", "--color-evidence-projection", "--color-evidence-thought-experiment"];

/** Text cut into colored tiles at token boundaries, with IDs underneath when shown. */
export function TokenizedText({
  text,
  tokens,
  showIds,
  animate,
  locale,
}: {
  text: string;
  tokens: RecordedToken[];
  showIds: boolean;
  animate: boolean;
  locale: "fr" | "en";
}) {
  const size = text.length > 60 ? styles.small : text.length > 32 ? styles.medium : styles.large;
  // Consecutive partial tokens of the same character share one visible glyph.
  const pieces = useMemo(() => {
    let lastEnd = 0;
    return tokens.map((tok, i) => {
      const from = Math.max(tok.start, lastEnd);
      const shown = tok.partial && from >= tok.end ? "" : text.slice(from, tok.end);
      lastEnd = Math.max(lastEnd, tok.end);
      return { tok, i, shown };
    });
  }, [text, tokens]);

  if (tokens.length === 0) {
    return <p className={cx(styles.sentence, size, styles.plain)}>{text || " "}</p>;
  }
  return (
    <p className={cx(styles.sentence, size, animate && styles.animate)} aria-label={text}>
      {pieces.map(({ tok, i, shown }) => {
        const leading = shown.startsWith(" ");
        const body = leading ? shown.slice(1) : shown;
        return (
          <span
            key={`${i}:${tok.id}`}
            className={cx(styles.tile, tok.partial && styles.partial)}
            style={{ "--tile": `var(${PALETTE[i % PALETTE.length]})`, "--i": i } as CSSProperties}
          >
            <span className={styles.piece}>
              {leading ? <span className={styles.space}>·</span> : null}
              {body || (tok.partial ? "◌" : "")}
            </span>
            {tok.partial && tok.bytes ? <span className={styles.bytes}>{tok.bytes}</span> : null}
            <span className={cx(styles.id, showIds && styles.idShown)} aria-hidden={!showIds}>
              {formatInt(tok.id, locale)}
            </span>
          </span>
        );
      })}
    </p>
  );
}
