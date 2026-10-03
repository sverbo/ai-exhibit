import type { CSSProperties } from "react";
import type { L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import styles from "./OpinionGap.module.css";

export interface OpinionBar {
  /** Who answered, e.g. "US adults", "AI experts". */
  who: L10n;
  group: "public" | "experts";
  /** Percent, 0 to 100. */
  value: number;
  /** Upper end when the survey gives a range (drawn as a lighter extension). */
  upTo?: number;
}

export interface OpinionRow {
  /** The question, in plain words. */
  question: L10n;
  /** Survey name and year, shown under the bars. */
  source: L10n;
  bars: OpinionBar[];
}

export interface OpinionGapProps {
  heading?: L10n;
  rows: OpinionRow[];
}

/** Steps a scene using OpinionGap declares: step 0 shows the first row, each step adds one. */
export function opinionGapSteps(props: OpinionGapProps): number {
  return Math.max(0, props.rows.length - 1);
}

function percent(value: number, locale: "en" | "fr"): string {
  return locale === "fr" ? `${value} %` : `${value}%`;
}

function barLabel(b: OpinionBar, locale: "en" | "fr"): string {
  if (b.upTo === undefined) return percent(b.value, locale);
  return locale === "fr" ? `${b.value} à ${b.upTo} %` : `${b.value} to ${b.upTo}%`;
}

/**
 * OpinionGap {heading?, rows}: survey answers as horizontal bars on one 0 to
 * 100% scale, the public in one color and experts in another. One row per
 * step. No state; preview shows every row, still.
 */
export function OpinionGap({ props, ctx }: SceneComponentProps<OpinionGapProps>) {
  const { locale, role } = ctx;
  const preview = role === "preview";
  const still = preview || ctx.reducedMotion;
  const rows = props.rows ?? [];
  const visible = preview ? rows.length : Math.min(rows.length, Math.max(0, ctx.revealStep) + 1);

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} data-visible={visible}>
      <header className={styles.head}>
        {props.heading ? <h2 className={styles.heading}>{props.heading[locale]}</h2> : null}
        <EvidenceBadge level="observed" locale={locale} size="sm" />
      </header>
      <div className={styles.rows}>
        {rows.map((row, i) => {
          const shown = i < visible;
          return (
            <section
              key={i}
              className={`${styles.row} ${shown ? styles.shown : styles.hidden}`}
              data-row={i}
              data-shown={shown ? "" : undefined}
              aria-hidden={!shown}
            >
              <h3 className={styles.question}>{row.question[locale]}</h3>
              {row.bars.map((b, j) => (
                <div key={j} className={styles.bar} data-group={b.group}>
                  <span className={styles.who}>{b.who[locale]}</span>
                  <span className={styles.track}>
                    <span
                      className={styles.fill}
                      style={{ "--value": shown ? b.value : 0, "--up": shown ? (b.upTo ?? b.value) : 0 } as CSSProperties}
                    />
                    {b.upTo !== undefined ? (
                      <span className={styles.range} style={{ "--value": b.value, "--up": shown ? b.upTo : b.value } as CSSProperties} />
                    ) : null}
                  </span>
                  <span className={styles.value}>{barLabel(b, locale)}</span>
                </div>
              ))}
              <p className={styles.source}>{row.source[locale]}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
