import { describe, expect, it } from "vitest";
import {
  chanceAt, counterAt, COUNTER_MS, errorOf, EXAMPLES, lineDuration, nextAfter, ONE_NUDGE, progressAt, RANDOM_GUESSES,
  randomChance, splitAtNext, splitLast, STREAM, streamLineAt, TOKENS_SEEN, TRAINED_CHANCE, WEIGHTS,
} from "./training.ts";

describe("TrainingLoop logic", () => {
  it("every example marks the next word and the model only sees the text before it", () => {
    for (const ex of EXAMPLES) {
      for (const locale of ["en", "fr"] as const) {
        expect(ex.text[locale]).toContain("___");
        const { context, rest } = splitAtNext(ex.text[locale]);
        expect(context.length).toBeGreaterThan(0);
        expect(context).not.toContain(ex.answer[locale]);
        if (!ex.code) expect(nextAfter(rest).length).toBeGreaterThan(0);
      }
    }
  });

  it("includes code among the training texts and in the stream", () => {
    expect(EXAMPLES.some((e) => e.code)).toBe(true);
    expect(STREAM.filter((s) => s.code).length).toBeGreaterThanOrEqual(3);
    expect(STREAM.filter((s) => !s.code).length).toBeGreaterThanOrEqual(8);
  });

  it("starts random: about 1 chance in the vocabulary size, and one nudge barely helps", () => {
    const p0 = randomChance(50304);
    expect(p0 * 100).toBeCloseTo(0.002, 3);
    for (const g of RANDOM_GUESSES) expect(g.times).toBeLessThan(2);
    expect(ONE_NUDGE).toBeLessThan(1.1);
    expect(errorOf(p0)).toBeGreaterThan(0.999);
  });

  it("the illustrative curve rises from random chance to a trained value", () => {
    const p0 = randomChance(50304);
    expect(chanceAt(0, p0)).toBeCloseTo(p0, 10);
    expect(chanceAt(1, p0)).toBeCloseTo(TRAINED_CHANCE, 6);
    let prev = 0;
    for (let f = 0; f <= 1; f += 0.05) {
      const v = chanceAt(f, p0);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(progressAt(Infinity)).toBe(1);
    expect(progressAt(COUNTER_MS / 2)).toBeCloseTo(0.5);
  });

  it("the stream goes through different lines, faster and faster", () => {
    expect(lineDuration(10)).toBeLessThan(lineDuration(0));
    expect(streamLineAt(0)).toBe(0);
    expect(streamLineAt(5000)).toBeGreaterThan(STREAM.length / 2);
    for (const s of STREAM) {
      for (const locale of ["en", "fr"] as const) {
        const { context, next } = splitLast(s.text[locale]);
        expect(context.length).toBeGreaterThan(0);
        expect(next.length).toBeGreaterThan(0);
      }
    }
  });

  it("nudges are small", () => {
    for (const w of WEIGHTS) expect(Math.abs(w.after - w.before)).toBeLessThanOrEqual(0.03);
  });

  it("the counter races up and ends on the sourced token count", () => {
    expect(counterAt(0)).toBe(1);
    expect(counterAt(COUNTER_MS / 2)).toBeGreaterThan(1e6);
    expect(counterAt(COUNTER_MS)).toBe(TOKENS_SEEN);
    expect(counterAt(Infinity)).toBe(TOKENS_SEEN);
  });
});
