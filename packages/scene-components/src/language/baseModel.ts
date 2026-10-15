/**
 * What BaseModelPlayground does on the stage owner, without React: ask for
 * the bars, add one token or several, and handle a failed cloud call. Kept
 * apart so tests can drive it with a mocked server.
 *
 * Requests each button costs with Hugging Face (all count against the
 * server's per-minute and hourly model budgets, PUBLIC_LIMITS on Vercel):
 * opening the scene or applying a text, 1 (/api/llm/next, the bars); "+1", 1
 * (/next); "+10" or "+30", 2 (/api/llm/complete, then /next); temperature, 0.
 */
import {
  cloudComplete,
  cloudNextToken,
  type CloudRecordingFile,
  findCloudNext,
  findCloudRecording,
} from "@ai-exhibit/ml-runtime/lm";
import type { ModelSource } from "../contract.ts";
import type { NoticeKey } from "./runtime.ts";
import { type Cand, DEFAULT_TEMPERATURE } from "./shared.ts";
import { type CloudFailure, isPause, pauseLeftMs } from "./source.ts";

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
  /** For the next generation; absent means DEFAULT_TEMPERATURE. */
  temperature?: number;
}

export const PICK_MS = 550;
export const MAX_APPENDED = 200;
export const BASE_LABEL = "Llama 3.1 8B";
/** The server's stand-in base model (BASE_FALLBACK_MODEL in packages/cloud-api), when the first one is full. */
const FALLBACK_LABELS: Record<string, string> = { "meta-llama/Meta-Llama-3-8B": "Llama 3 8B" };

/** The label of the base model that actually wrote a continuation. */
export function baseLabel(modelId: string | undefined): string {
  return (modelId && FALLBACK_LABELS[modelId]) || BASE_LABEL;
}
export const BARS_LABEL = "Llama 3.3 70B Instruct";

/** Draws among the shown candidates with a temperature (the bars stay the raw probabilities). */
function draw(cands: Cand[], temperature: number): Cand | undefined {
  if (temperature <= 0) return cands[0];
  const w = cands.map((c) => Math.pow(Math.max(c.p, 1e-12), 1 / Math.max(0.05, temperature)));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) {
    r -= w[i]!;
    if (r <= 0) return cands[i];
  }
  return cands.at(-1);
}

export interface BaseModelDeps {
  /** The latest published state. */
  get: () => BaseModelState;
  set: (update: (s: BaseModelState) => BaseModelState) => void;
  /** The source in use now (useSourceDecision). */
  source: () => ModelSource;
  /** Reports a failed cloud call (useSourceDecision): a pause, or a fallback to Simulation. */
  cloudFailed: (err: unknown) => CloudFailure;
  recording: () => CloudRecordingFile | null | undefined;
  reducedMotion: () => boolean;
}

/** A "too many requests" notice goes once the pause is over. */
const clearRateNotice = (s: BaseModelState): NoticeKey | null => (s.notice === "rateLimited" ? null : s.notice);
/** Once Hugging Face answers (after a pause, or a retry), notices about waiting or Simulation go. */
const liveNotice = (s: BaseModelState): NoticeKey | null =>
  s.notice === "rateLimited" || s.notice === "simulationPresetsOnly" ? null : s.notice;

export function createBaseModelEngine(deps: BaseModelDeps) {
  const { get, set } = deps;
  /** Bumped when the text starts over: answers to older requests are dropped. */
  let generation = 0;
  let abort: AbortController | null = null;
  let pauseTimer: ReturnType<typeof setTimeout> | null = null;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, deps.reducedMotion() ? 0 : ms));

  /** The whole text so far: what the next prediction continues. */
  const fullText = (s: BaseModelState) => s.prompt + s.appended.map((t) => t.text).join("");
  /** Recorded bars exist for the prepared prompt, step by step, as long as only recorded tokens were added. */
  const recordedStep = (s: BaseModelState) => {
    if (s.appended.some((t) => t.cloud)) return undefined;
    const run = findCloudNext(deps.recording(), s.prompt);
    const step = run?.steps[s.appended.length];
    const onPath = run && s.appended.every((t, i) => t.text === run.steps[i]?.token);
    return onPath ? step : undefined;
  };

  /**
   * Too many requests this minute: say so on the stage and keep Hugging Face.
   * Once the pause is over the notice goes, and the missing bars are asked
   * for again (`bars`).
   */
  const pause = (failure: CloudFailure, gen: number, bars: boolean) => {
    set((x) => ({ ...x, notice: "rateLimited" }));
    if (pauseTimer) clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => {
      pauseTimer = null;
      if (gen !== generation) return;
      if (bars && !get().busy) void refresh();
      else set((x) => ({ ...x, notice: clearRateNotice(x) }));
    }, pauseLeftMs(failure));
  };

  /** Candidates for the next token after the text (the latest state, unless given). */
  const refresh = async (s: BaseModelState = get()): Promise<void> => {
    const gen = generation;
    if (deps.source() === "simulation") {
      const step = recordedStep(s);
      set((x) => ({
        ...x,
        candidates: step ? step.candidates.map((c, i) => ({ id: i, text: c.text, p: c.p })) : [],
        bars: step ? { model: BARS_LABEL, recorded: true } : null,
        source: "recorded",
      }));
      return;
    }
    try {
      const r = await cloudNextToken({ prompt: fullText(s), temperature: 0 });
      if (gen !== generation) return;
      set((x) => ({
        ...x,
        candidates: r.candidates.map((c, i) => ({ id: i, text: c.text, p: c.p })),
        bars: { model: BARS_LABEL, recorded: false },
        source: "live",
        notice: liveNotice(x),
      }));
    } catch (err) {
      if (gen !== generation) return;
      const failure = deps.cloudFailed(err);
      // Otherwise the scene is in Simulation now, and asks for recorded bars.
      if (isPause(failure)) {
        // The bars on screen were for the text before: hide them until the new ones come.
        set((x) => ({ ...x, candidates: [] }));
        pause(failure, gen, true);
      }
    }
  };

  const oneToken = async () => {
    const s = get();
    if (s.busy || s.appended.length >= MAX_APPENDED || !s.candidates.length) return;
    const gen = generation;
    set((x) => ({ ...x, busy: true }));
    try {
      // Simulation replays the recorded run: always the most likely token.
      const pick = deps.source() === "simulation" ? s.candidates[0] : draw(s.candidates, s.temperature ?? DEFAULT_TEMPERATURE);
      if (!pick) return;
      set((x) => ({ ...x, picked: pick.id }));
      await sleep(PICK_MS);
      if (gen !== generation) return;
      const appended = [...get().appended, { id: -1, text: pick.text }];
      set((x) => ({ ...x, appended, picked: null, textModel: BARS_LABEL }));
      await refresh({ ...get(), appended });
    } finally {
      if (gen === generation) set((x) => ({ ...x, busy: false }));
    }
  };

  const severalTokens = async (many: number) => {
    const s = get();
    if (s.busy) return;
    const gen = generation;
    abort?.abort();
    const ac = new AbortController();
    abort = ac;
    set((x) => ({ ...x, busy: true, candidates: [], picked: null }));
    /** What is on screen once the pieces are shown (the next bars continue it). */
    let appended = s.appended;
    /** Shows text word by word (answers arrive whole). */
    const reveal = async (text: string) => {
      for (const piece of text.split(/(?<=\s)/)) {
        if (ac.signal.aborted || gen !== generation) return false;
        appended = [...appended, { id: -1, text: piece, cloud: true }];
        const shown = appended;
        set((x) => ({ ...x, appended: shown }));
        if (!deps.reducedMotion()) await new Promise((r) => setTimeout(r, 70));
      }
      return true;
    };
    try {
      if (deps.source() === "hf") {
        try {
          const r = await cloudComplete(
            { prompt: fullText(s), maxTokens: many, temperature: s.temperature ?? DEFAULT_TEMPERATURE },
            { signal: ac.signal },
          );
          if (gen !== generation) return;
          set((x) => ({ ...x, textModel: baseLabel(r.model), source: "live", notice: liveNotice(x) }));
          await reveal(r.text);
          await refresh({ ...get(), appended });
          return;
        } catch (err) {
          if (ac.signal.aborted) return;
          const failure = deps.cloudFailed(err);
          if (isPause(failure)) {
            // Nothing was written: the bars on screen still continue the text. Click again after the pause.
            set((x) => ({ ...x, candidates: s.candidates, bars: s.bars }));
            pause(failure, gen, !s.candidates.length);
            return;
          }
        }
      }
      const recorded = !s.appended.length ? findCloudRecording(deps.recording(), "base", s.prompt) : undefined;
      if (recorded) {
        set((x) => ({ ...x, textModel: BASE_LABEL, source: "recorded", notice: null }));
        await reveal(recorded.text);
      } else {
        set((x) => ({ ...x, notice: "simulationPresetsOnly" }));
      }
      await refresh({ ...get(), appended });
    } catch {
      /* cancelled or failed: keep what was written */
    } finally {
      if (gen === generation) set((x) => ({ ...x, busy: false }));
    }
  };

  return {
    refresh,
    oneToken,
    severalTokens,
    /** Drops every answer still on its way (a new text, a new source). */
    restart() {
      generation++;
      if (pauseTimer) clearTimeout(pauseTimer);
      pauseTimer = null;
    },
    stop() {
      abort?.abort();
    },
    dispose() {
      abort?.abort();
      if (pauseTimer) clearTimeout(pauseTimer);
    },
  };
}

export type BaseModelEngine = ReturnType<typeof createBaseModelEngine>;
