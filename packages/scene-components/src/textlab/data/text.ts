import type { Locale } from "@ai-exhibit/presentation-core";

/**
 * How the text scenes read a sentence: lower case, split into words, plural
 * "s" dropped, so "baskets" and "basket" (or "nets" and "net") count as the
 * same word. Small grammar words ("the", "de", ...) are ignored by every
 * learner: they say nothing about the sport.
 */

export type Sport = "football" | "basketball";

export interface LabelledSentence {
  text: string;
  label: Sport;
}

export interface Token {
  /** As written in the sentence. */
  surface: string;
  /** What the learners compare: lower case, plural folded. */
  word: string;
  start: number;
  end: number;
  /** Grammar word, ignored by the learners. */
  stop: boolean;
}

const STOPWORDS: Record<Locale, ReadonlySet<string>> = {
  en: new Set(
    "a an the and or but of to in on at by for from with into onto off over out up as is was were be been it its he she his her him they them their our we you your i that this then than after before just".split(
      " ",
    ),
  ),
  fr: new Set(
    "le la les l un une des du de d et ou au aux à a en dans sur sous par pour avec sans il elle ils elles son sa ses leur leurs notre nos se s qu que qui ce cet cette est était a été ne n pas y on lui".split(
      " ",
    ),
  ),
};

/** "baskets" -> "basket", "nets" -> "net"; short words and "-ss" words stay. */
export function foldWord(lower: string): string {
  if (lower.length >= 4 && lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
}

const WORD = /[\p{L}\p{N}]+/gu;

export function tokenize(text: string, locale: Locale): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(WORD)) {
    const surface = m[0];
    const lower = surface.toLowerCase();
    out.push({
      surface,
      word: foldWord(lower),
      start: m.index!,
      end: m.index! + surface.length,
      stop: STOPWORDS[locale].has(lower),
    });
  }
  return out;
}

/** The distinct meaningful words of a sentence. */
export function wordSet(text: string, locale: Locale): Set<string> {
  return new Set(tokenize(text, locale).filter((t) => !t.stop).map((t) => t.word));
}

