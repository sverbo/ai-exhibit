import { pick } from "@ai-exhibit/presentation-core";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { NextTokenRecordingFile } from "@ai-exhibit/ml-runtime/lm";
import { sources } from "../../../../content/sources/index.ts";
import { languageModelFor } from "../language/data.ts";
import { NEXT_TOKEN_SEQUENCE, SEQUENCE_WORDS } from "./prompts.ts";
import { netTestSentences } from "../textlab/data/net.ts";
import {
  appendedAt, barsStepFor, CLASSIFIER_SENTENCE, classifierBars, cloudShape, cloudSpots, displayToken, NEXT_TOKEN_STEPS, restProbability, sentenceAfter, sliceFor, SLICES, vocabSize, vocabSourceId,
} from "./nextToken.ts";

const recording = JSON.parse(
  readFileSync(new URL("../../../../content/assets/recordings/next-token.json", import.meta.url), "utf8"),
) as NextTokenRecordingFile;

describe("NextTokenVsClassifier data", () => {
  it("step 0 is a real, correct, not certain verdict of the sports network on a held-out sentence", () => {
    for (const locale of ["en", "fr"] as const) {
      const ex = pick(CLASSIFIER_SENTENCE, locale);
      expect(netTestSentences(locale).some((s) => s.text === ex.text && s.label === ex.label)).toBe(true);
      const bars = classifierBars(locale);
      expect(bars[0]!.sport).toBe(ex.label);
      expect(bars[0]!.p).toBeGreaterThan(0.6);
      expect(bars[0]!.p).toBeLessThan(0.95);
      expect(bars[0]!.p + bars[1]!.p).toBeCloseTo(1);
    }
  });

  it("matches the recorded probabilities exactly", () => {
    for (const slice of SLICES) {
      const rec = recording.prompts.find((p) => p.model === slice.model && p.text === slice.text);
      expect(rec, `${slice.model} "${slice.text}" is recorded`).toBeDefined();
      slice.steps.forEach((cands, s) => {
        const recCands = rec!.steps[s]!.candidates;
        expect(cands.map((c) => [c.id, c.text, c.p])).toEqual(recCands.map((c) => [c.id, c.text, c.p]));
      });
    }
  });

  it("records the sequence prompt in both locales, one position per word plus the next", () => {
    for (const locale of ["en", "fr"] as const) {
      const s = sliceFor(locale);
      expect(s.locale).toBe(locale);
      expect(s.text).toBe(pick(NEXT_TOKEN_SEQUENCE, locale));
      expect(s.steps).toHaveLength(SEQUENCE_WORDS + 1);
    }
  });

  it("the greedy continuation is three whole words (no punctuation, no word pieces)", () => {
    for (const locale of ["en", "fr"] as const) {
      const words = sentenceAfter(sliceFor(locale), SEQUENCE_WORDS).added;
      expect(words).toHaveLength(SEQUENCE_WORDS);
      for (const w of words) expect(w, w).toMatch(/^ \p{L}{2,}$/u);
    }
  });

  it("uses the same base model per locale as the language scenes", () => {
    for (const locale of ["en", "fr"] as const) {
      expect(sliceFor(locale).model).toBe(languageModelFor(locale, "base"));
    }
    expect(vocabSize("amd-olmo-1b")).toBe(50304);
    expect(vocabSize("qwen2.5-0.5b")).toBe(151936);
  });

  it("cites an existing source for each vocabulary size", () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const s of SLICES) expect(ids.has(vocabSourceId(s.model)), vocabSourceId(s.model)).toBe(true);
  });

  it("places every candidate inside the vocabulary", () => {
    for (const s of SLICES) for (const step of s.steps) for (const c of step) expect(c.id).toBeLessThan(vocabSize(s.model));
  });

  it("gives every token of the vocabulary a cell in the cloud", () => {
    for (const size of [50304, 151936]) {
      const { cols, rows, pitchX, pitchY } = cloudShape(size, 640, 480);
      expect(cols * rows).toBeGreaterThanOrEqual(size);
      expect(cols * (rows - 1)).toBeLessThan(size);
      expect(pitchX * cols).toBeCloseTo(640);
      expect(pitchY * rows).toBeCloseTo(480);
    }
  });

  it("spreads the highlighted tokens over the cloud, stably", () => {
    for (const s of SLICES) {
      for (const step of s.steps) {
        const ids = step.map((c) => c.id);
        const spots = cloudSpots(ids, 640, 480);
        expect(spots).toEqual(cloudSpots(ids, 640, 480));
        for (const p of spots) {
          expect(p.x).toBeGreaterThan(640 * 0.1);
          expect(p.x).toBeLessThan(640 * 0.9);
          expect(p.y).toBeGreaterThan(480 * 0.1);
          expect(p.y).toBeLessThan(480 * 0.9);
        }
        for (let i = 0; i < spots.length; i++) {
          for (let j = i + 1; j < spots.length; j++) {
            expect(Math.hypot(spots[i]!.x - spots[j]!.x, spots[i]!.y - spots[j]!.y)).toBeGreaterThan(60);
          }
        }
      }
    }
  });

  it("computes what is left for the other tokens", () => {
    const rest = restProbability(sliceFor("en").steps[0]!);
    expect(rest).toBeGreaterThan(0);
    expect(rest).toBeLessThan(1);
    expect(restProbability([{ id: 0, text: "a", p: 0.7 }, { id: 1, text: "b", p: 0.4 }])).toBe(0);
  });

  it("adds one word per step after the first bars", () => {
    const s = sliceFor("en");
    expect(NEXT_TOKEN_STEPS).toBe(4);
    expect(appendedAt(1)).toBe(0);
    expect(appendedAt(2)).toBe(1);
    expect(appendedAt(4)).toBe(3);
    expect(appendedAt(9)).toBe(3);
    expect(sentenceAfter(s, 1).added).toEqual([s.steps[0]![0]!.text]);
    expect(barsStepFor(0)).toBeNull();
    expect(barsStepFor(1)).toBe(0);
    expect(barsStepFor(4)).toBe(3);
  });

  it("shows tokens readably", () => {
    expect(displayToken(" couch")).toBe("couch");
    expect(displayToken("\n")).toBe("↵");
    expect(displayToken(" ")).toBe("·");
    expect(displayToken("ère")).toBe("ère");
  });
});
