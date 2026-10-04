/**
 * BaseModelPlayground (scene 3.10): a model straight out of pretraining only
 * continues text, often badly. One control: add 1, 10 or 30 tokens. After
 * each addition, probability bars at the end of the text show what could come
 * next; one token is drawn from them (temperature 0.8), several are written by
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
import { cloudComplete, cloudNextToken, findCloudNext, findCloudRecording, MAX_INPUT_CHARS } from "@ai-exhibit/ml-runtime/lm";
import type { SceneComponentProps } from "../contract.ts";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { Rich } from "../primitives/Rich.tsx";
import styles from "./BaseModelPlayground.module.css";
import { COPY } from "./copy.ts";
import { DEFAULT_BASE_PROMPT } from "./data.ts";
import { type NoticeKey, useCloudRecording } from "./runtime.ts";
import { useSourceDecision } from "./source.ts";
import { type Cand, isL10n, promptIn } from "./shared.ts";
import { useSceneState } from "./state.ts";
import { Button, cx, Fan, Frame, Notice, Pending, RecordedTag, SourceBadge, TextField } from "./ui.tsx";

export interface BaseModelPlaygroundProps {
  prompt?: L10n;
}

export interface BaseModelState {
  prompt: string;
  /** Appended pieces; `cloud`: written by the base model in one go. */
  appended: { id: number; text: string; cloud?: boolean }[];
  /** Which model wrote the continuation on screen (shown to the audience). */
  textModel?: string;
  /** Model whose probabilities the bars show, and whether they are recorded. */
  bars?: { model: string; recorded: boolean } | null;
  candidates: Cand[];
  picked: number | null;
  busy: boolean;
  source: "live" | "recorded";
  notice: NoticeKey | null;
}

/** The only control: how many tokens to add. */
const ADD_OPTIONS = [1, 10, 30] as const;
const TEMPERATURE = 0.8;

type Action = { type: "add"; n: number } | { type: "stop" } | { type: "prompt"; text: string };
const PICK_MS = 550;
const MAX_APPENDED = 200;
const BASE_LABEL = "Llama 3.1 8B";
const BARS_LABEL = "Llama 3.3 70B Instruct";

/** Draws among the shown candidates with a temperature (the bars stay the raw probabilities). */
function draw(cands: Cand[], temperature: number): Cand | undefined {
  const w = cands.map((c) => Math.pow(Math.max(c.p, 1e-12), 1 / Math.max(0.05, temperature)));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) {
    r -= w[i]!;
    if (r <= 0) return cands[i];
  }
  return cands.at(-1);
}

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
  const { decision, cloudFailed } = useSourceDecision(ctx);
  const simulation = decision.active === "simulation";
  const decisionRef = useRef(decision);
  decisionRef.current = decision;
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);

  /** The whole text so far: what the next prediction continues. */
  const fullText = (s: BaseModelState) => s.prompt + s.appended.map((t) => t.text).join("");
  /** Recorded bars exist for the prepared prompt, step by step, as long as only recorded tokens were added. */
  const recordedStep = (s: BaseModelState) => {
    if (s.appended.some((t) => t.cloud)) return undefined;
    const run = findCloudNext(cloudRec, s.prompt);
    const step = run?.steps[s.appended.length];
    const onPath = run && s.appended.every((t, i) => t.text === run.steps[i]?.token);
    return onPath ? step : undefined;
  };

  /** Candidates for the next token after the text (the latest state, unless given). */
  const refresh = async (s: BaseModelState = stateRef.current) => {
    const gen = generation.current;
    if (decisionRef.current.active === "simulation") {
      const step = recordedStep(s);
      setState((x) => ({
        ...x,
        candidates: step ? step.candidates.map((c, i) => ({ id: i, text: c.text, p: c.p })) : [],
        bars: step ? { model: BARS_LABEL, recorded: true } : null,
        source: "recorded",
      }));
      return;
    }
    try {
      const r = await cloudNextToken({ prompt: fullText(s), temperature: 0 });
      if (gen !== generation.current) return;
      setState((x) => ({
        ...x,
        candidates: r.candidates.map((c, i) => ({ id: i, text: c.text, p: c.p })),
        bars: { model: BARS_LABEL, recorded: false },
        source: "live",
      }));
    } catch {
      if (gen !== generation.current) return;
      cloudFailed();
    }
  };

  useEffect(() => {
    if (role !== "controller") return;
    generation.current++;
    if (simulation && !cloudRec) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, state.prompt, decision.active, cloudRec]);
  useEffect(() => () => abort.current?.abort(), []);

  const oneToken = async () => {
    const s = stateRef.current;
    if (s.busy || s.appended.length >= MAX_APPENDED || !s.candidates.length) return;
    const gen = generation.current;
    setState((x) => ({ ...x, busy: true }));
    try {
      // Simulation replays the recorded run: always the most likely token.
      const pick = simulation ? s.candidates[0] : draw(s.candidates, TEMPERATURE);
      if (!pick) return;
      setState((x) => ({ ...x, picked: pick.id }));
      await new Promise((r) => setTimeout(r, ctx.reducedMotion ? 0 : PICK_MS));
      if (gen !== generation.current) return;
      const appended = [...stateRef.current.appended, { id: -1, text: pick.text }];
      setState((x) => ({ ...x, appended, picked: null, textModel: BARS_LABEL }));
      await refresh({ ...stateRef.current, appended });
    } finally {
      if (gen === generation.current) setState((x) => ({ ...x, busy: false }));
    }
  };

  const severalTokens = async (many: number) => {
    const s = stateRef.current;
    if (s.busy) return;
    const gen = generation.current;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setState((x) => ({ ...x, busy: true, candidates: [], picked: null }));
    /** What is on screen once the pieces are shown (the next bars continue it). */
    let appended = s.appended;
    /** Shows text word by word (answers arrive whole). */
    const reveal = async (text: string) => {
      for (const piece of text.split(/(?<=\s)/)) {
        if (ac.signal.aborted || gen !== generation.current) return false;
        appended = [...appended, { id: -1, text: piece, cloud: true }];
        const shown = appended;
        setState((x) => ({ ...x, appended: shown }));
        if (!ctx.reducedMotion) await new Promise((r) => setTimeout(r, 70));
      }
      return true;
    };
    try {
      if (decisionRef.current.active === "hf") {
        try {
          const r = await cloudComplete(
            { prompt: fullText(s), maxTokens: many, temperature: TEMPERATURE },
            { signal: ac.signal },
          );
          if (gen !== generation.current) return;
          setState((x) => ({ ...x, textModel: BASE_LABEL, source: "live" }));
          await reveal(r.text);
          await refresh({ ...stateRef.current, appended });
          return;
        } catch {
          if (ac.signal.aborted) return;
          cloudFailed();
        }
      }
      const recorded = !s.appended.length ? findCloudRecording(cloudRec, "base", s.prompt) : undefined;
      if (recorded) {
        setState((x) => ({ ...x, textModel: BASE_LABEL, source: "recorded", notice: null }));
        await reveal(recorded.text);
      } else {
        setState((x) => ({ ...x, notice: "simulationPresetsOnly" }));
      }
      await refresh({ ...stateRef.current, appended });
    } catch {
      /* cancelled or failed: keep what was written */
    } finally {
      if (gen === generation.current) setState((x) => ({ ...x, busy: false }));
    }
  };

  // Every window's buttons come here; only the stage owner runs them.
  const act = useSceneActions<Action, BaseModelState>(ctx, (action) => {
    if (action.type === "stop") abort.current?.abort();
    else if (action.type === "prompt") {
      const prompt = action.text.trim().slice(0, MAX_INPUT_CHARS);
      if (!prompt) return;
      // A new text starts over: no generated tokens, fresh bars (the effect on `prompt` asks for them).
      generation.current++;
      abort.current?.abort();
      setState((x) => ({ ...x, prompt, appended: [], candidates: [], picked: null, busy: false, textModel: undefined, notice: null }));
      // The same text again: the effect will not fire, so ask for the bars here.
      if (prompt === stateRef.current.prompt) void refresh({ ...stateRef.current, appended: [] });
    } else if (action.n <= 1) void oneToken();
    else void severalTokens(action.n);
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
      {role === "controller" ? <SourceBadge decision={decision} model={`${BASE_LABEL} (base)`} locale={locale} /> : null}
    </>
  ) : null;

  return (
    <Frame controls={controls} label={tr(ctx.scene.title, locale)}>
      <header className={styles.head}>
        <p className={styles.modelLine}>
          <Rich text={tr(COPY.baseTitle, locale)} /> <b>{BASE_LABEL}</b>
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

