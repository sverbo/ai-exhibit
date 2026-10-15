/**
 * BaseModelPlayground (scene 3.10): a model straight out of pretraining only
 * continues text, often badly. One control: add 1, 10 or 30 tokens. After
 * each addition, probability bars at the end of the text show what could come
 * next; one token is drawn from them at the chosen temperature (0: always
 * the most likely), several are written by
 * the base model in one go. A text field replaces the prompt (and starts
 * over); in Simulation only the prepared prompt has recordings, so it is off.
 * `R` starts over.
 *
 * With Hugging Face, Llama 3.1 8B (base) writes the continuations. No provider
 * gives a base model's probabilities, so the bars come from Llama 3.3 70B
 * Instruct reading the same raw text (no chat format), and the screen says so.
 * In Simulation, both are recorded real runs on the prepared prompt.
 */
import { useEffect, useRef } from "react";
import { tr, type L10n } from "@ai-exhibit/presentation-core";
import { MAX_INPUT_CHARS } from "@ai-exhibit/ml-runtime/lm";
import type { SceneComponentProps } from "../contract.ts";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { Rich } from "../primitives/Rich.tsx";
import { BARS_LABEL, BASE_LABEL, type BaseModelEngine, type BaseModelState, createBaseModelEngine } from "./baseModel.ts";
import styles from "./BaseModelPlayground.module.css";
import { COPY } from "./copy.ts";
import { DEFAULT_BASE_PROMPT } from "./data.ts";
import { useCloudRecording } from "./runtime.ts";
import { useSourceDecision } from "./source.ts";
import { DEFAULT_TEMPERATURE, formatTemperature, isL10n, promptIn, TEMPERATURES } from "./shared.ts";
import { useSceneState } from "./state.ts";
import { Button, cx, Fan, Frame, Notice, Pending, RecordedTag, Segmented, SourceBadge, TextField } from "./ui.tsx";

export type { BaseModelState } from "./baseModel.ts";

export interface BaseModelPlaygroundProps {
  prompt?: L10n;
}

/** The only control: how many tokens to add. */
const ADD_OPTIONS = [1, 10, 30] as const;

type Action =
  | { type: "add"; n: number }
  | { type: "stop" }
  | { type: "prompt"; text: string }
  | { type: "temperature"; value: number };

export function BaseModelPlayground({ props, ctx }: SceneComponentProps<BaseModelPlaygroundProps, BaseModelState>) {
  const { locale, role } = ctx;
  const planned: L10n = isL10n(props.prompt) ? props.prompt : DEFAULT_BASE_PROMPT;
  const initial = (): BaseModelState => ({
    prompt: promptIn(planned, locale),
    appended: [],
    candidates: [],
    picked: null,
    busy: false,
    source: "recorded",
    notice: null,
  });
  const [state, setState] = useSceneState<BaseModelState>(ctx, initial, { throttleMs: 50 });
  const stateRef = useRef(state);
  stateRef.current = state;
  const cloudRec = useCloudRecording();
  const { decision, cloudFailed, retryCloud } = useSourceDecision(ctx);
  const simulation = decision.active === "simulation";
  // What the engine reads at call time: the latest render's values.
  const live = useRef({ decision, cloudFailed, cloudRec, reducedMotion: ctx.reducedMotion, setState });
  live.current = { decision, cloudFailed, cloudRec, reducedMotion: ctx.reducedMotion, setState };
  const engineRef = useRef<BaseModelEngine | null>(null);
  engineRef.current ??= createBaseModelEngine({
    get: () => stateRef.current,
    set: (update) => live.current.setState(update),
    source: () => live.current.decision.active,
    cloudFailed: (err) => live.current.cloudFailed(err),
    recording: () => live.current.cloudRec,
    reducedMotion: () => live.current.reducedMotion,
  });
  const engine = engineRef.current;

  useEffect(() => {
    if (role !== "controller") return;
    engine.restart();
    if (simulation && !cloudRec) return;
    void engine.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, state.prompt, decision.active, cloudRec]);
  useEffect(() => () => engine.dispose(), [engine]);

  // Every window's buttons come here; only the stage owner runs them.
  const act = useSceneActions<Action, BaseModelState>(ctx, (action) => {
    if (action.type === "stop") engine.stop();
    else if (action.type === "temperature") setState((x) => ({ ...x, temperature: action.value }));
    else if (action.type === "prompt") {
      const prompt = action.text.trim().slice(0, MAX_INPUT_CHARS);
      if (!prompt) return;
      // A new text starts over: no generated tokens, fresh bars (the effect on `prompt` asks for them).
      engine.restart();
      engine.stop();
      setState((x) => ({ ...x, prompt, appended: [], candidates: [], picked: null, busy: false, textModel: undefined, notice: null }));
      // The same text again: the effect will not fire, so ask for the bars here.
      if (prompt === stateRef.current.prompt) void engine.refresh({ ...stateRef.current, appended: [] });
    } else if (action.n <= 1) void engine.oneToken();
    else void engine.severalTokens(action.n);
  });

  const view = role === "preview" || (role === "display" && ctx.state === undefined) ? initial() : state;

  const controls = canInteract(ctx) ? (
    <>
      <TextField
        wide
        label={tr(COPY.edit, locale)}
        value={view.prompt}
        submitLabel={tr(COPY.apply, locale)}
        // Only the prepared text has recordings.
        disabled={simulation || view.busy}
        onSubmit={(text) => act({ type: "prompt", text })}
      />
      {simulation ? <span className={styles.addLabel}>{tr(COPY.simulationPresetsOnly, locale)}</span> : null}
      <span className={styles.addLabel}>{tr(COPY.howMany, locale)}</span>
      {ADD_OPTIONS.map((n) => (
        <Button key={n} primary disabled={view.busy} onClick={() => act({ type: "add", n })}>
          +{n}
        </Button>
      ))}
      {view.busy ? <Button onClick={() => act({ type: "stop" })}>{tr(COPY.stop, locale)}</Button> : null}
      <span title={tr(COPY.temperatureHint, locale)}>
        <Segmented
          label={tr(COPY.temperature, locale)}
          value={simulation ? null : (view.temperature ?? DEFAULT_TEMPERATURE)}
          disabled={simulation}
          options={TEMPERATURES.map((t) => ({ value: t, label: formatTemperature(t, locale) }))}
          onChange={(value) => act({ type: "temperature", value })}
        />
      </span>
      {role === "controller" ? <SourceBadge decision={decision} model={`${BASE_LABEL} (base)`} locale={locale} onRetry={retryCloud} /> : null}
    </>
  ) : null;

  return (
    <Frame controls={controls} label={tr(ctx.scene.title, locale)}>
      <header className={styles.head}>
        <p className={styles.modelLine}>
          <Rich text={tr(COPY.baseTitle, locale)} /> <b>{view.textModel ?? BASE_LABEL}</b>
          {locale === "fr" ? "\u00a0: " : ": "}
          <Rich text={tr(COPY.baseSub, locale)} />
        </p>
      </header>
      <div className={cx(styles.text, view.appended.length > 40 && styles.long)}>
        <span className={styles.prompt}>{view.prompt}</span>
        {view.appended.map((t, i) => (
          <span key={i} className={cx(styles.appended, i % 2 === 1 && styles.alt)}>
            {t.text}
          </span>
        ))}
        <span className={styles.slot}>
          <span className={styles.caret} aria-hidden="true" />
          {!view.busy && view.candidates.length ? (
            <span className={styles.fanAnchor}>
              <Fan
                locale={locale}
                animate={false}
                scale={role === "controller" ? 0.7 : 0.85}
                items={view.candidates.map((c, i) => ({
                  key: `${c.id}:${i}`,
                  text: c.text,
                  value: c.p,
                  highlight: view.picked === c.id ? "chosen" : null,
                }))}
              />
            </span>
          ) : view.busy ? (
            <span className={styles.waiting}>
              <Pending>{tr(COPY.thinking, locale)}</Pending>
            </span>
          ) : null}
        </span>
      </div>
      <footer className={styles.footer}>
        {view.bars && view.candidates.length ? (
          <p className={styles.barsNote}>
            <Rich text={tr(view.bars.recorded ? COPY.barsRecorded : COPY.barsFromCloud, locale).replace("{model}", view.bars.model)} />
          </p>
        ) : null}
        {view.source === "recorded" && role !== "preview" ? <RecordedTag locale={locale} /> : null}
        {view.notice && role !== "preview" ? <Notice reason={view.notice} locale={locale} /> : null}
        {view.source === "recorded" && ctx.mode === "fallback" && role !== "preview" ? (
          <Notice reason="replayGreedy" locale={locale} />
        ) : null}
      </footer>
    </Frame>
  );
}

