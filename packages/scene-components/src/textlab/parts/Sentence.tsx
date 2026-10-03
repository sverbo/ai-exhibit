import { Fragment, type ReactNode } from "react";
import type { Locale } from "@ai-exhibit/presentation-core";
import { cx } from "../../learning/shared/ui.tsx";
import { tokenize, type Sport } from "../data/text.ts";
import styles from "../TextClassifierLab.module.css";

/** Marker tone of a highlighted word: the sport it points to. */
export type Tone = Sport;

/**
 * A sentence, word by word. Highlighted words get a marker stroke in the tone
 * of the sport they point to; removed words are struck through (and ignored
 * by every classifier). With `onToken`, words are buttons.
 */
export function Sentence({
  text,
  locale,
  marks,
  faint,
  removed,
  onToken,
  className,
}: {
  text: string;
  locale: Locale;
  /** Token index (in `tokenize(text)`) to tone. */
  marks?: ReadonlyMap<number, Tone>;
  /** Marked tokens drawn faint (present, but they did not decide). */
  faint?: ReadonlySet<number>;
  removed?: ReadonlySet<number>;
  onToken?: (index: number) => void;
  className?: string;
}) {
  const tokens = tokenize(text, locale);
  const parts: ReactNode[] = [];
  let at = 0;
  tokens.forEach((t, i) => {
    if (t.start > at) parts.push(<Fragment key={`g${i}`}>{text.slice(at, t.start)}</Fragment>);
    const tone = marks?.get(i);
    const gone = removed?.has(i) ?? false;
    const cls = cx(styles.word, tone && styles.marked, tone === "football" && styles.toneFootball, tone === "basketball" && styles.toneBasketball, tone && faint?.has(i) && styles.markedFaint, gone && styles.removed);
    parts.push(
      onToken && !t.stop ? (
        <button key={`w${i}`} type="button" className={cx(cls, styles.wordButton)} onClick={() => onToken(i)} aria-pressed={gone}>
          {t.surface}
        </button>
      ) : (
        <span key={`w${i}`} className={cls}>
          {t.surface}
        </span>
      ),
    );
    at = t.end;
  });
  if (at < text.length) parts.push(<Fragment key="end">{text.slice(at)}</Fragment>);
  return <p className={cx(styles.sentence, className)}>{parts}</p>;
}

/** The sentence without the removed words (what the classifiers then read). */
export function withoutTokens(text: string, locale: Locale, removed: ReadonlySet<number>): string {
  if (removed.size === 0) return text;
  const tokens = tokenize(text, locale);
  let out = "";
  let at = 0;
  tokens.forEach((t, i) => {
    out += text.slice(at, t.start);
    if (!removed.has(i)) out += t.surface;
    at = t.end;
  });
  return out + text.slice(at);
}

