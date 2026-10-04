/**
 * Shared building blocks of the language scenes: the stage frame, controller
 * controls, calm notices, token tiles and the "fan" of next-token candidates
 * that continues the sentence on screen.
 */
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { plainText, tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import type { FallbackWhy, SourceDecision } from "./source.ts";
import { ControlBar } from "../primitives/Controls.tsx";
import { Rich } from "../primitives/Rich.tsx";
import { COPY } from "./copy.ts";
import { formatPercent, visibleToken } from "./format.ts";
import type { NoticeKey } from "./runtime.ts";
import styles from "./ui.module.css";

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

export { tr as t } from "@ai-exhibit/presentation-core";

/** Keys the presentation shell listens to; inputs keep them for themselves. */
const stopKeys = (e: KeyboardEvent) => {
  if (e.key !== "Escape") e.stopPropagation();
};
const NAV_KEYS = new Set([" ", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"]);

/** Full-stage frame: content area plus, in any interactive window, the shared control bar. */
export function Frame({
  children,
  controls,
  className,
  mainClassName,
  label,
}: {
  children?: ReactNode;
  controls?: ReactNode;
  className?: string;
  /** Extra class on the content area, e.g. to tighten its padding. */
  mainClassName?: string;
  label?: string;
}) {
  return (
    <section className={cx(styles.frame, className)} aria-label={label === undefined ? undefined : plainText(label)}>
      <div className={cx(styles.main, mainClassName)}>{children}</div>
      {controls ? <ControlBar>{controls}</ControlBar> : null}
    </section>
  );
}

/** The shared compact controls (primitives/Controls.tsx), under the names the language scenes use. */
export { ControlButton as Button, ControlChoice as Segmented, ControlField as TextField } from "../primitives/Controls.tsx";

/** A calm, non-alarming line: what is shown and why. Shape + text, never color alone. */
export function Notice({ reason, locale, extra }: { reason: NoticeKey | null; locale: Locale; extra?: ReactNode }) {
  if (!reason && !extra) return null;
  return (
    <p className={styles.notice} role="status">
      <svg viewBox="0 0 20 20" width="24" height="24" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2.4" />
      </svg>
      <span>
        {reason ? <Rich text={tr(COPY[reason], locale)} /> : null}
        {reason && extra ? " " : null}
        {extra}
      </span>
    </p>
  );
}

/** Small "recorded" tag for the projector, so the audience is never misled. */
export function RecordedTag({ locale }: { locale: Locale }) {
  return <span className={styles.recordedTag}>{tr(COPY.fallback, locale)}</span>;
}

/** Token text with its leading space shown as a discreet dot. */
export function TokenText({ text }: { text: string }) {
  const v = visibleToken(text);
  return (
    <>
      {v.leadingSpace ? <span className={styles.space}>·</span> : null}
      {v.body}
    </>
  );
}

export interface FanItem {
  key: string | number;
  text: string;
  /** Bar length, 0..1 (probability). */
  value: number;
  /** Ghost bar behind, e.g. the raw probability when settings changed it. */
  ghost?: number;
  label?: string;
  highlight?: "chosen" | "room" | null;
  dim?: boolean;
  badge?: ReactNode;
}

/**
 * The candidates for the next token, stacked where the sentence ends, so the
 * options literally continue the text. Bar length is the probability.
 */
export function Fan({
  items,
  locale,
  animate,
  footer,
  scale = 1,
}: {
  items: FanItem[];
  locale: Locale;
  animate: boolean;
  footer?: ReactNode;
  scale?: number;
}) {
  const max = Math.max(0.0001, ...items.map((i) => Math.max(i.value, i.ghost ?? 0)));
  return (
    <ol className={cx(styles.fan, animate && styles.animate)} style={{ "--fan-scale": scale } as CSSProperties}>
      {items.map((item, i) => (
        <li
          key={item.key}
          className={cx(
            styles.fanRow,
            item.highlight === "chosen" && styles.chosen,
            item.highlight === "room" && styles.roomMatch,
            item.dim && styles.dim,
          )}
          style={{ "--i": i, "--w": item.value / max, "--g": (item.ghost ?? 0) / max } as CSSProperties}
        >
          {item.ghost !== undefined ? <span className={styles.ghost} aria-hidden="true" /> : null}
          <span className={styles.bar} aria-hidden="true" />
          <span className={styles.fanText}>
            <TokenText text={item.text} />
          </span>
          <span className={styles.fanValue}>{item.label ?? formatPercent(item.value, locale)}</span>
          {item.badge ? <span className={styles.fanBadge}>{item.badge}</span> : null}
        </li>
      ))}
      {footer ? <li className={styles.fanFooter}>{footer}</li> : null}
    </ol>
  );
}

/** Spinner-free loading line: a slow breathing ellipsis (static when motion is reduced). */
export function Pending({ children }: { children: ReactNode }) {
  return (
    <span className={styles.pending}>
      {children}
      <span className={styles.ellipsis} aria-hidden="true">
        <i>.</i>
        <i>.</i>
        <i>.</i>
      </span>
    </span>
  );
}

export { styles as uiStyles };

const SOURCE_LABEL = { hf: "sourceHf", simulation: "sourceSimulation" } as const;
const WHY_LABEL: Record<FallbackWhy, keyof typeof COPY> = {
  "cloud-not-configured": "whyCloudNotConfigured",
  "cloud-offline": "whyCloudOffline",
  "cloud-code": "whyCloudCode",
  "cloud-error": "whyCloudError",
  "fallback-key": "whyFallbackKey",
};

/** Controller-only badge: the model source in use, the model, and why it differs from the presenter's choice. */
export function SourceBadge({ decision, model, locale }: { decision: SourceDecision; model?: string; locale: Locale }) {
  const fell = decision.active !== decision.requested;
  return (
    <span className={cx(styles.sourceBadge, styles[`source_${decision.active}`], fell && styles.sourceFell)} role="status">
      <b>{tr(COPY[SOURCE_LABEL[decision.active]], locale)}</b>
      {model ? <span>{model}</span> : null}
      {decision.why ? <span className={styles.sourceWhy}>{tr(COPY[WHY_LABEL[decision.why]], locale)}</span> : null}
    </span>
  );
}
