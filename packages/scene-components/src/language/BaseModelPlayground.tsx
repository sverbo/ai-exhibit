/**
 * BaseModelPlayground (scene 3.10): a model straight out of pretraining only
 * continues text, often badly. One clear choice, shown on screen:
 * - "one token": probability bars at the end of the text, then append one token
 *   (the most likely, or drawn with the temperature);
 * - "several tokens": append N tokens in one go.
 * Both modes extend the same text, so the presenter can mix them.
 *
 * With Hugging Face, Llama 3.1 8B (base) writes the continuations. No provider
 * gives a base model's probabilities, so the bars come from Llama 3.3 70B
 * Instruct reading the same raw text (no chat format), and the screen says so.
 * In Simulation, both are recorded real runs on the prepared prompt.
 */
import { useEffect, useRef } from "react";
import { intlLocale, tr, type L10n } from "@ai-exhibit/presentation-core";
import { cloudComplete, cloudNextToken, findCloudNext, findCloudRecording } from "@ai-exhibit/ml-runtime/lm";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import styles from "./BaseModelPlayground.module.css";
import { COPY } from "./copy.ts";
import { DEFAULT_BASE_PROMPT } from "./data.ts";
import { type NoticeKey, useCloudRecording } from "./runtime.ts";
import { useSourceDecision } from "./source.ts";
import { type Cand, isL10n, promptIn } from "./shared.ts";
import { useSceneState } from "./state.ts";
import { Button, cx, Fan, Frame, Notice, Pending, RecordedTag, Segmented, Slider, SourceBadge, TextField } from "./ui.tsx";

export interface BaseModelPlaygroundProps {
  prompt?: L10n;
}

type Mode = "one" | "many";

export interface BaseModelState {
  mode: Mode;
  prompt: string;
  /** Appended pieces; `cloud`: written by the base model in one go. */
  appended: { id: number; text: string; cloud?: boolean }[];
  /** Which model wrote the continuation on screen (shown to the audience). */
  textModel?: string;
  /** Model whose probabilities the bars show, and whether they are recorded. */
  bars?: { model: string; recorded: boolean } | null;
  candidates: Cand[];
  picked: number | null;
  temperature: number;
  greedy: boolean;
  many: number;
  busy: boolean;
  source: "live" | "recorded";
  notice: NoticeKey | null;
}

const MANY_OPTIONS = [10, 30, 60];
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
    mode: "one",
    prompt: promptIn(planned, locale),
    appended: [],
    candidates: [],
    picked: null,
    temperature: 0.8,
    greedy: false,
    many: 30,
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
      const pick = s.greedy || simulation ? s.candidates[0] : draw(s.candidates, s.temperature);
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

  const severalTokens = async () => {
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
            { prompt: fullText(s), maxTokens: s.many, temperature: s.greedy ? 0 : s.temperature },
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

  const restart = (prompt?: string) => {
    generation.current++;
    abort.current?.abort();
    setState((x) => ({
      ...x,
      prompt: prompt ?? x.prompt,
      appended: [],
      candidates: [],
      picked: null,
      busy: false,
      textModel: undefined,
      notice: null,
    }));
    // A new prompt refreshes through the effect; the same prompt needs it here.
    if (prompt === undefined || prompt === stateRef.current.prompt) void refresh({ ...stateRef.current, appended: [] });
  };

  const view = role === "preview" || (role === "display" && ctx.state === undefined) ? initial() : state;
  const modeLabel = (m: Mode) => <Rich text={m === "one" ? tr(COPY.modeOne, locale) : tr(COPY.modeMany, locale)} />;

  const controls =
    role === "controller" ? (
      <>
        <Segmented
          label={tr(COPY.mode, locale)}
          value={state.mode}
          options={(["one", "many"] as Mode[]).map((m) => ({ value: m, label: modeLabel(m) }))}
          onChange={(mode) => setState((x) => ({ ...x, mode }))}
        />
        {state.mode === "one" ? (
          <Button primary disabled={state.busy || !state.candidates.length} onClick={() => void oneToken()}>
            {tr(COPY.addOneToken, locale)}
          </Button>
        ) : (
          <>
            <Segmented
              label={tr(COPY.howMany, locale)}
              value={state.many}
              options={MANY_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
              onChange={(many) => setState((x) => ({ ...x, many }))}
            />
            {state.busy ? (
              <Button onClick={() => abort.current?.abort()}>{tr(COPY.stop, locale)}</Button>
            ) : (
              <Button primary onClick={() => void severalTokens()}>
                {tr(COPY.addManyTokens, locale).replace("{n}", String(state.many))}
              </Button>
            )}
          </>
        )}
        <Segmented
          label={tr(COPY.nextToken, locale)}
          value={state.greedy ? "greedy" : "sample"}
          options={[
            { value: "greedy", label: tr(COPY.greedy, locale) },
            { value: "sample", label: tr(COPY.sample, locale) },
          ]}
          onChange={(m) => setState((x) => ({ ...x, greedy: m === "greedy" }))}
        />
        {!state.greedy ? (
          <Slider
            label={tr(COPY.temperature, locale)}
            value={state.temperature}
            min={0.1}
            max={2}
            step={0.1}
            disabled={simulation}
            format={(v) => v.toLocaleString(intlLocale(locale), { minimumFractionDigits: 1 })}
            onChange={(temperature) => setState((x) => ({ ...x, temperature }))}
          />
        ) : null}
        <TextField
          label={tr(COPY.edit, locale)}
          value={state.prompt}
          submitLabel={tr(COPY.apply, locale)}
          disabled={simulation}
          onSubmit={(v) => v.trim() && restart(v.trim())}
        />
        <Button disabled={!state.appended.length && state.prompt === promptIn(planned, locale)} onClick={() => restart(promptIn(planned, locale))}>
          {tr(COPY.restart, locale)}
        </Button>
        <SourceBadge decision={decision} model={`${BASE_LABEL} (base)`} locale={locale} />
      </>
    ) : null;

  return (
    <Frame controls={controls} label={tr(ctx.scene.title, locale)}>
      <header className={styles.head}>
        <div className={styles.modes} role="group" aria-label={tr(COPY.mode, locale)}>
          {(["one", "many"] as Mode[]).map((m) => (
            <span key={m} className={cx(styles.modeTab, view.mode === m && styles.modeOn)}>
              {modeLabel(m)}
            </span>
          ))}
        </div>
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
          {view.mode === "one" && view.candidates.length ? (
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
          ) : view.busy && view.mode === "many" ? null : view.busy ? (
            <span className={styles.waiting}>
              <Pending>{tr(COPY.thinking, locale)}</Pending>
            </span>
          ) : null}
        </span>
      </div>
      <footer className={styles.footer}>
        {view.mode === "one" && view.bars ? (
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

