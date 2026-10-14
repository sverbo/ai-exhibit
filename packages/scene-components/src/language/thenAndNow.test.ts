import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { thenAndNowQuestions, type Gpt2AnswersFile } from "@ai-exhibit/content/assets/then-and-now/questions.ts";
import { LADDER_MODELS } from "@ai-exhibit/ml-runtime/lm";
import { LADDER_SIZES } from "./copy.ts";
import {
  applyLadderEvent,
  failLive,
  filledSlots,
  gameQuestion,
  lastStage,
  type LiveLadderRecordingFile,
  liveQuestion,
  keyTermRuns,
  liveStage,
  rungStage,
  maxStage,
  pickQuestions,
  questionRuns,
  recordedLive,
  startLive,
  truncate,
} from "./thenAndNow.ts";
import { LADDER } from "../../../cloud-api/src/core.ts";

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
  it("opens the game with AI Digest's published answers: the three wrong ones together, then GPT-4", () => {
    const first = pickQuestions(undefined, "game")[0]!;
    expect(first.id).toBe("clock-riddle");
    expect(first.ladder?.sourceId).toBe("tk-aidigest-2023-progress");
    expect(first.ladder?.rungs.map((r) => r.generation)).toEqual(["GPT-2", "GPT-3", "GPT-3.5", "GPT-4"]);
    expect(first.ladder?.rungs.map((r) => r.correct)).toEqual([false, false, false, true]);
    expect(first.ladder!.rungs.map((_, i) => rungStage(first, i))).toEqual([1, 1, 1, 2]);
    expect(lastStage(first)).toBe(3);
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
    expect(lastStage(riddle)).toBe(3);
    expect(liveStage(riddle)).toBe(4);
    expect(maxStage(riddle)).toBe(4);
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
    live = applyLadderEvent(live, { type: "start", rung: "glm-5.3", model: "zai-org/GLM-5.3", provider: "together" });
    live = applyLadderEvent(live, { type: "reasoning", rung: "glm-5.3" });
    expect(live.answers["glm-5.3"]).toMatchObject({ state: "thinking", provider: "together" });
    live = applyLadderEvent(live, { type: "text", rung: "glm-5.3", text: "On a clock" });
    live = applyLadderEvent(live, { type: "text", rung: "glm-5.3", text: ", 3." });
    live = applyLadderEvent(live, { type: "done", rung: "glm-5.3", finishReason: "stop", ms: 900 });
    expect(live.answers["glm-5.3"]).toMatchObject({ state: "done", text: "On a clock, 3." });
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
    live = applyLadderEvent(live, { type: "done", rung: "glm-5.3", finishReason: "stop", ms: 1 });
    const failed = failLive(live, "offline");
    expect(failed.running).toBe(false);
    expect(failed.failure).toBe("offline");
    expect(failed.answers["llama-3.1-8b"]).toMatchObject({ state: "error", text: "Fif", error: "offline" });
    expect(failed.answers["glm-5.3"]?.state).toBe("done");
    expect(failed.answers["qwen2.5-0.5b-base"]?.state).toBe("error");
  });

  it("shows only the clock riddle, whose clicks end on the live step", () => {
    const q = gameQuestion();
    expect(q?.id).toBe("clock-riddle");
    expect(liveStage(q!)).toBe(maxStage(q!));
  });
});

describe("recorded live ladder (Simulation)", () => {
  const file = JSON.parse(
    readFileSync(new URL("../../../../content/assets/recordings/live-ladder.json", import.meta.url), "utf8"),
  ) as LiveLadderRecordingFile & { runs: { answers: { model: string }[] }[] };

  it("holds a real run of every rung, in both editions, from the ladder's own models", () => {
    expect(file.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const run of file.runs) {
      expect(run.question.length).toBeLessThanOrEqual(300);
      expect(run.answers.map((a) => a.rung)).toEqual(LADDER.map((r) => r.id));
      expect(run.answers.map((a) => a.model)).toEqual(LADDER.map((r) => r.hubId));
      for (const a of run.answers) {
        expect(a.text.trim()).not.toBe("");
        expect(LADDER.find((r) => r.id === a.rung)!.targets.map((t) => t.provider)).toContain(a.provider);
      }
    }
    expect(file.runs.map((r) => r.locale).sort()).toEqual(["en", "fr"]);
  });

  it("becomes a finished, labelled ladder for the edition's language, English otherwise", () => {
    const en = recordedLive(file, "en")!;
    expect(en.question).toBe("How many r's are in the word strawberry?");
    expect(en.running).toBe(false);
    expect(en.recordedOn).toBe(file.date);
    expect(Object.values(en.answers).every((a) => a.state === "done")).toBe(true);
    expect(recordedLive(file, "fr")!.question).toMatch(/strawberry/);
    expect(recordedLive(file, "de" as string)!.question).toBe(en.question);
    expect(recordedLive(null, "en")).toBeNull();
  });
});

describe("ladder labels", () => {
  it("give every rung a whole size label matching its parameter count, and a release year", () => {
    for (const m of LADDER_MODELS) {
      expect(LADDER_SIZES[m.id]?.en).toBe(`${m.paramsB} billion parameters`);
      expect(m.year).toBeGreaterThanOrEqual(2019);
    }
    expect(LADDER_MODELS.map((m) => m.paramsB)).toEqual([...LADDER_MODELS.map((m) => m.paramsB)].sort((a, b) => a - b));
  });
});

describe("key terms", () => {
  const keys = (text: string) => keyTermRuns(text).filter((r) => r.key).map((r) => r.text);

  it("picks out the numbers and the clock, in English and French", () => {
    expect(keys("When ten plus four is two, what is nine plus six?")).toEqual(["ten", "four", "two", "nine", "six"]);
    expect(keys("if it is ten o'clock and you add four hours")).toEqual(["ten", "o'clock", "four", "hours"]);
    expect(keys("3. Sur une horloge, dix heures plus quatre heures")).toEqual(["3", "horloge", "dix", "heures", "quatre", "heures"]);
  });

  it("leaves articles and words that only contain a number alone", () => {
    expect(keys("one of them, une horloge, often a tenure")).toEqual(["horloge"]);
  });

  it("keeps every character", () => {
    const text = "The answer is 15.";
    expect(keyTermRuns(text).map((r) => r.text).join("")).toBe(text);
  });
});
