import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelSource } from "../contract.ts";
import { type BaseModelState, createBaseModelEngine } from "./baseModel.ts";
import { type CloudFailure, classifyFailure, decideSource, failureReducer } from "./source.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const NEXT = { token: " a", candidates: [{ text: " a", p: 0.6 }, { text: " the", p: 0.3 }], model: "m", provider: "p", ms: 1 };
const COMPLETE = { text: " there was a king", finishReason: "length", model: "m", provider: "p", ms: 1 };
const TOO_MANY = { error: "rate-limited", message: "More than 20 requests in a minute", limit: "minute", max: 20, retryAfter: 3 };

/** A fake server: each path answers from its queue, then with its last answer. */
function server(answers: Record<string, (() => Response)[]>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      const queue = answers[url] ?? [];
      const next = queue.length > 1 ? queue.shift()! : queue[0];
      return next ? next() : json(404, { error: "not-found" });
    }),
  );
  return calls;
}

/** The engine with a plain store and useSourceDecision's rules, as the scene wires them. */
function setup() {
  let state: BaseModelState = { prompt: "Once upon a time", appended: [], candidates: [], picked: null, busy: false, source: "recorded", notice: null, temperature: 0 };
  let failure: CloudFailure | null = null;
  const source = (): ModelSource => decideSource({ requested: "hf", sceneFallback: false, cloud: null, cloudFailed: failure, hasAccessCode: false }).active;
  const engine = createBaseModelEngine({
    get: () => state,
    set: (update) => {
      state = update(state);
    },
    source,
    cloudFailed: (err) => {
      const f = classifyFailure(err);
      failure = failureReducer(failure, { type: "failed", failure: f });
      // The scene's pause timer (useSourceDecision) ends the pause.
      if (f.kind === "rate-minute") setTimeout(() => (failure = failureReducer(failure, { type: "pause-over", failure: f })), 3000);
      return f;
    },
    recording: () => null,
    reducedMotion: () => true,
  });
  /** The badge's "Retry Hugging Face" (useSourceDecision's retryCloud), then the scene's effect asking for bars. */
  const retry = async () => {
    failure = failureReducer(failure, { type: "clear" });
    engine.restart();
    await engine.refresh();
  };
  return { engine, state: () => state, source, failure: () => failure, retry };
}

describe("BaseModelPlayground with Hugging Face", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("waits out too many requests this minute instead of falling back, then asks for the bars again", async () => {
    const calls = server({ "/api/llm/next": [() => json(429, TOO_MANY), () => json(200, NEXT)] });
    const s = setup();
    await s.engine.refresh();
    expect(s.state().notice).toBe("rateLimited");
    expect(s.state().candidates).toEqual([]);
    // Still Hugging Face: nothing switched to Simulation.
    expect(s.source()).toBe("hf");
    expect(s.failure()?.kind).toBe("rate-minute");
    await vi.advanceTimersByTimeAsync(3000);
    expect(calls).toEqual(["/api/llm/next", "/api/llm/next"]);
    expect(s.state().candidates.map((c) => c.text)).toEqual([" a", " the"]);
    expect(s.state().notice).toBeNull();
    expect(s.state().source).toBe("live");
    expect(s.failure()).toBeNull();
  });

  it("keeps the text and the bars when writing several words hits the limit", async () => {
    const calls = server({ "/api/llm/next": [() => json(200, NEXT)], "/api/llm/complete": [() => json(429, TOO_MANY), () => json(200, COMPLETE)] });
    const s = setup();
    await s.engine.refresh();
    await s.engine.severalTokens(10);
    expect(s.state()).toMatchObject({ appended: [], busy: false, notice: "rateLimited" });
    expect(s.state().candidates).toHaveLength(2);
    expect(s.source()).toBe("hf");
    await vi.advanceTimersByTimeAsync(3000);
    // The notice goes once the pause is over, without spending a request.
    expect(s.state().notice).toBeNull();
    expect(calls).toEqual(["/api/llm/next", "/api/llm/complete"]);
    // The next click goes through: "+10" costs two requests (the words, then the bars).
    await s.engine.severalTokens(10);
    expect(s.state().appended.map((t) => t.text).join("")).toBe(COMPLETE.text);
    expect(calls.slice(2)).toEqual(["/api/llm/complete", "/api/llm/next"]);
  });

  it("hides the old bars when the bars after +1 hit the limit, so +1 waits for the new ones", async () => {
    server({ "/api/llm/next": [() => json(200, NEXT), () => json(429, TOO_MANY), () => json(200, NEXT)] });
    const s = setup();
    await s.engine.refresh();
    const step = s.engine.oneToken();
    await vi.advanceTimersByTimeAsync(0);
    await step;
    expect(s.state()).toMatchObject({ candidates: [], notice: "rateLimited", busy: false });
    await s.engine.oneToken();
    expect(s.state().appended).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(s.state().candidates).toHaveLength(2);
    expect(s.state().notice).toBeNull();
  });

  it("costs one request for +1", async () => {
    const calls = server({ "/api/llm/next": [() => json(200, NEXT)] });
    const s = setup();
    await s.engine.refresh();
    const step = s.engine.oneToken();
    await vi.advanceTimersByTimeAsync(0);
    await step;
    expect(s.state().appended).toHaveLength(1);
    expect(calls).toEqual(["/api/llm/next", "/api/llm/next"]);
  });

  it("falls back to Simulation on any other failure, with the reason, until the retry", async () => {
    const calls = server({
      "/api/llm/next": [() => json(200, NEXT)],
      "/api/llm/complete": [() => json(502, { error: "upstream", message: "Hugging Face answered 500" }), () => json(200, COMPLETE)],
    });
    const s = setup();
    await s.engine.refresh();
    await s.engine.severalTokens(10);
    expect(s.failure()).toEqual({ kind: "error" });
    expect(s.source()).toBe("simulation");
    // No recording for this text: the scene says Simulation has prepared examples only.
    expect(s.state().notice).toBe("simulationPresetsOnly");
    expect(calls).toEqual(["/api/llm/next", "/api/llm/complete"]);
    await s.retry();
    expect(s.source()).toBe("hf");
    expect(s.state()).toMatchObject({ source: "live", notice: null });
    await s.engine.severalTokens(10);
    expect(s.state().appended.map((t) => t.text).join("")).toBe(COMPLETE.text);
  });
});
