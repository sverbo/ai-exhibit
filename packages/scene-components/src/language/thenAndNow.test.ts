import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { thenAndNowQuestions, type Gpt2AnswersFile } from "@ai-exhibit/content/assets/then-and-now/questions.ts";
import { LADDER_MODELS } from "@ai-exhibit/ml-runtime/lm";
import {
  applyLadderEvent,
  failLive,
  filledSlots,
  lastStage,
  liveQuestion,
  liveStage,
  maxStage,
  pickQuestions,
  questionRuns,
  startLive,
  truncate,
} from "./thenAndNow.ts";

describe("then-and-now data", () => {
  it("has unique ids, both locales and a real recorded today answer", () => {
    const ids = thenAndNowQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of thenAndNowQuestions) {
      expect(q.question.en && q.question.fr).toBeTruthy();
      expect(q.today.modelId).toBe("claude-opus-5-5");
      expect(q.today.answer.en && q.today.answer.fr).toBeTruthy();
      expect(q.gpt2Prompt.endsWith("\nA:")).toBe(true);
      if (q.history?.verification === "verified") expect(q.history.source?.url).toMatch(/^https:/);
    }
  });

  it("has a recorded GPT-2 run for every question", () => {
    const file = JSON.parse(
      readFileSync(new URL("../../../../content/assets/then-and-now/gpt2-answers.json", import.meta.url), "utf8"),
    ) as Gpt2AnswersFile;
    for (const q of thenAndNowQuestions) {
      expect(file.answers[q.id]?.prompt).toBe(q.gpt2Prompt);
      expect(file.answers[q.id]?.samples.length).toBeGreaterThan(0);
    }
  });
});

describe("pickQuestions", () => {
  it("uses the storyboard five for the game and everything for the recap", () => {
    expect(pickQuestions(undefined, "game").map((q) => q.id)).toEqual(["clock-riddle", "strawberry", "decimals", "sally", "bat-and-ball"]);
    expect(pickQuestions(undefined, "recap")).toHaveLength(thenAndNowQuestions.length);
    expect(pickQuestions(["sally", "nope"], "game").map((q) => q.id)).toEqual(["sally"]);
  });
});

describe("filledSlots", () => {
  it("only returns generations that were actually run", () => {
    const q = { ...thenAndNowQuestions[0]!, others: [
      { generation: "GPT-3", model: null, date: null, how: null, answer: null },
      { generation: "GPT-4", model: "gpt-4", date: "2026-10-05", how: "web", answer: { en: "14", fr: "14" } },
    ] };
    expect(filledSlots(q).map((o) => o.generation)).toEqual(["GPT-4"]);
  });
});

describe("truncate", () => {
  it("cuts at a word boundary with an ellipsis", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("The clock is a device that measures the time", 20)).toBe("The clock is a…");
  });

  it("splits operators and punctuation out of a question", () => {
    expect(questionRuns("On a clock, what is 9 + 5?")).toEqual([
      { text: "On a clock", kind: "text" },
      { text: ",", kind: "punctuation" },
      { text: " what is 9 ", kind: "text" },
      { text: "+", kind: "operator" },
      { text: " 5", kind: "text" },
      { text: "?", kind: "punctuation" },
    ]);
    for (const q of thenAndNowQuestions) {
      expect(questionRuns(q.question.en).map((r) => r.text).join("")).toBe(q.question.en);
    }
  });
});

describe("ladder", () => {
  it("opens the game with AI Digest's published answers, one generation per stage", () => {
    const first = pickQuestions(undefined, "game")[0]!;
    expect(first.id).toBe("clock-riddle");
    expect(first.ladder?.sourceId).toBe("tk-aidigest-2023-progress");
    expect(first.ladder?.rungs.map((r) => r.generation)).toEqual(["GPT-2", "GPT-3", "GPT-3.5", "GPT-4"]);
    expect(first.ladder?.rungs.map((r) => r.correct)).toEqual([false, false, false, true]);
    expect(lastStage(first)).toBe(5);
    expect(lastStage(pickQuestions(["sally"], "game")[0]!)).toBe(2);
  });

  it("cites a source that exists and is verified", async () => {
    const { sources } = await import("@ai-exhibit/content/sources");
    const src = sources.find((x) => x.id === "tk-aidigest-2023-progress");
    expect(src?.verification).toBe("verified");
  });
});

describe("live step", () => {
  const riddle = thenAndNowQuestions.find((q) => q.id === "clock-riddle")!;
  const plain = thenAndNowQuestions.find((q) => !q.ladder)!;
  const ids = LADDER_MODELS.map((m) => m.id);

  it("comes right after today's answer, on ladder questions only", () => {
    expect(lastStage(riddle)).toBe(5);
    expect(liveStage(riddle)).toBe(6);
    expect(maxStage(riddle)).toBe(6);
    expect(liveStage(plain)).toBeNull();
    expect(maxStage(plain)).toBe(lastStage(plain));
  });

  it("is the scene's last reveal step", async () => {
    const { chapter01 } = await import("../../../../presentations/canonical/src/scenes/01-capabilities.ts");
    expect(chapter01.find((s) => s.id === "01-then-and-now")?.steps).toBe(maxStage(riddle));
  });

  it("asks only a non-empty question of 300 characters at most", () => {
    expect(liveQuestion("   ")).toBeNull();
    expect(liveQuestion("  Why is the sky blue? ")).toBe("Why is the sky blue?");
    expect(liveQuestion("y".repeat(400))).toHaveLength(300);
  });

  it("fills each column as its events arrive", () => {
    let live = startLive("Q", ids);
    expect(Object.values(live.answers).every((a) => a.state === "waiting")).toBe(true);
    live = applyLadderEvent(live, { type: "start", rung: "gpt-oss-120b", model: "openai/gpt-oss-120b", provider: "groq" });
    live = applyLadderEvent(live, { type: "reasoning", rung: "gpt-oss-120b" });
    expect(live.answers["gpt-oss-120b"]).toMatchObject({ state: "thinking", provider: "groq" });
    live = applyLadderEvent(live, { type: "text", rung: "gpt-oss-120b", text: "On a clock" });
    live = applyLadderEvent(live, { type: "text", rung: "gpt-oss-120b", text: ", 3." });
    live = applyLadderEvent(live, { type: "done", rung: "gpt-oss-120b", finishReason: "stop", ms: 900 });
    expect(live.answers["gpt-oss-120b"]).toMatchObject({ state: "done", text: "On a clock, 3." });
    live = applyLadderEvent(live, { type: "error", rung: "qwen2.5-0.5b-base", error: "timeout", message: "No full answer within 27 s" });
    expect(live.answers["qwen2.5-0.5b-base"]).toMatchObject({ state: "error", error: "No full answer within 27 s" });
    // A rung the scene does not know is ignored.
    expect(applyLadderEvent(live, { type: "text", rung: "nope", text: "x" })).toBe(live);
    expect(live.running).toBe(true);
    expect(applyLadderEvent(live, { type: "end" }).running).toBe(false);
  });

  it("marks only unfinished columns when the whole request fails", () => {
    let live = startLive("Q", ids);
    live = applyLadderEvent(live, { type: "text", rung: "llama-3.1-8b", text: "Fif" });
    live = applyLadderEvent(live, { type: "done", rung: "gpt-oss-120b", finishReason: "stop", ms: 1 });
    const failed = failLive(live, "offline");
    expect(failed.running).toBe(false);
    expect(failed.failure).toBe("offline");
    expect(failed.answers["llama-3.1-8b"]).toMatchObject({ state: "error", text: "Fif", error: "offline" });
    expect(failed.answers["gpt-oss-120b"]?.state).toBe("done");
    expect(failed.answers["qwen2.5-0.5b-base"]?.state).toBe("error");
  });
});
