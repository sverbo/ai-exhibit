import type { CSSProperties } from "react";
import { tr, type EvidenceLevel, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
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

/** A short historical aside under the rows: one dated forecast, and an optional analogy in a muted style. */
export interface OpinionAside {
  /** Small label above the aside, e.g. "A look back". */
  label: L10n;
  /** Year shown large beside the main line, e.g. "2014". */
  year: string;
  main: L10n;
  /** Evidence level of the main line (a survey of forecasts is a projection). */
  evidence: Exclude<EvidenceLevel, "none">;
  /** Year beside the analogy line. */
  analogyYear?: string;
  /** A rhetorical comparison, tagged "Analogy" and drawn smaller. */
  analogy?: L10n;
}

export interface OpinionGapProps {
  heading?: L10n;
  rows: OpinionRow[];
  /** Revealed by one extra step after the last row. */
  aside?: OpinionAside;
}

/** Steps a scene using OpinionGap declares: step 0 shows the first row, each step adds one, then the aside if any. */
export function opinionGapSteps(props: OpinionGapProps): number {
  return Math.max(0, props.rows.length - 1) + (props.aside ? 1 : 0);
}

const ANALOGY: L10n = { en: "Analogy" };

/** Every row draws its bars in this order, so the public and experts never swap places between rows. */
const GROUP_ORDER: Record<OpinionBar["group"], number> = { public: 0, experts: 1 };

export function orderedBars(bars: OpinionBar[]): OpinionBar[] {
  return [...bars].sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group]);
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
 * 100% scale, the public in one color and experts in another. Every row has
 * the same layout: same axis, public bar above experts, labels in the same
 * columns. One row per step, then the optional aside. No state; preview shows
 * everything, still.
 */
export function OpinionGap({ props, ctx }: SceneComponentProps<OpinionGapProps>) {
  const { locale, role } = ctx;
  const preview = role === "preview";
  const still = preview || ctx.reducedMotion;
  const rows = props.rows ?? [];
  const visible = preview ? rows.length : Math.min(rows.length, Math.max(0, ctx.revealStep) + 1);
  const aside = props.aside;
  const asideShown = aside !== undefined && (preview || ctx.revealStep >= rows.length);

  return (
    <div className={`${styles.root} ${still ? styles.still : ""} ${aside ? styles.withAside : ""}`} data-visible={visible}>
      <header className={styles.head}>
        {props.heading ? <h2 className={styles.heading}><Rich text={tr(props.heading, locale)} /></h2> : null}
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
              <h3 className={styles.question}><Rich text={tr(row.question, locale)} /></h3>
              {orderedBars(row.bars).map((b, j) => (
                <div key={j} className={styles.bar} data-group={b.group}>
                  <span className={styles.who}>
                    <Rich text={tr(b.who, locale)} />
                  </span>
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
              <p className={styles.source}>
                <Rich text={tr(row.source, locale)} />
              </p>
            </section>
          );
        })}
        {aside ? (
          <aside
            className={`${styles.aside} ${asideShown ? styles.shown : styles.hidden}`}
            data-aside=""
            data-shown={asideShown ? "" : undefined}
            aria-hidden={!asideShown}
          >
            <span className={styles.asideLabel}>
              <Rich text={tr(aside.label, locale)} />
            </span>
            <p className={styles.asideMain}>
              <span className={styles.asideYear}>{aside.year}</span>
              <span className={styles.asideText}>
                <Rich text={tr(aside.main, locale)} />
              </span>
              <EvidenceBadge level={aside.evidence} locale={locale} size="sm" />
            </p>
            {aside.analogy ? (
              <p className={styles.asideAnalogy} data-analogy="">
                {aside.analogyYear ? <span className={styles.asideYear}>{aside.analogyYear}</span> : null}
                <span className={styles.asideText}>
                  <Rich text={tr(aside.analogy, locale)} />
                </span>
                <span className={styles.analogyTag}>{tr(ANALOGY, locale)}</span>
              </p>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
