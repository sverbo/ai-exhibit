import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { thenAndNowQuestions, type Gpt2AnswersFile } from "@ai-exhibit/content/assets/then-and-now/questions.ts";
import { filledSlots, lastStage, pickQuestions, questionRuns, truncate } from "./thenAndNow.ts";

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
