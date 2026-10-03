import type { ReactNode, MouseEvent, KeyboardEvent } from "react";
import { typeset, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import styles from "./ui.module.css";

export type { L10n, Locale };

/**
 * French punctuation takes a non-breaking space before ? ! ; : % and inside
 * guillemets, so a projector never wraps a lone "?" onto its own line.
 * `tr` applies it to every French string it reads.
 */
export function frenchSpacing(text: string): string {
  return typeset(text, "fr");
}

/** Bilingual strings inline (`l(fr, en)`) and the one way to read them (`tr`). */
export { l, tr } from "@ai-exhibit/presentation-core";

export function fmtPercent(value: number, locale: Locale): string {
  const n = Math.round(value * 100);
  return locale === "fr" ? `${n} %` : `${n}%`;
}

const NAV_KEYS = new Set([" ", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"]);

/**
 * Presentation keys (Space, arrows, PageUp/PageDown) must keep driving the talk
 * even right after a button was clicked, so buttons drop focus after a pointer
 * click and never swallow those keys.
 */
export function SceneButton({
  children,
  onClick,
  active,
  disabled,
  variant = "plain",
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: "plain" | "primary" | "danger";
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={`${styles.button} ${styles[variant]} ${active ? styles.active : ""}`}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        onClick();
        if (e.detail > 0) e.currentTarget.blur();
      }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (NAV_KEYS.has(e.key)) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {children}
    </button>
  );
}

/** A labelled group of mutually exclusive buttons. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {label && <span className={styles.segLabel}>{label}</span>}
      <div className={styles.segRow}>
        {options.map((o) => (
          <SceneButton key={String(o.value)} active={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </SceneButton>
        ))}
      </div>
    </div>
  );
}

/** The scene's heading, set in the display serif. */
export function SceneHeading({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className={styles.heading}>
      <h2 className={styles.h}>{typeof children === "string" ? <Rich text={children} /> : children}</h2>
      {sub && <p className={styles.sub}>{typeof sub === "string" ? <Rich text={sub} /> : sub}</p>}
    </header>
  );
}

/** Controller-only strip of controls; never rendered on the projector. */
export function ControlBar({ children }: { children: ReactNode }) {
  return <div className={styles.controls}>{children}</div>;
}

/** Plainly states that what is on screen is a toy, a reconstruction or an illustration. */
export function Disclosure({ children }: { children: ReactNode }) {
  return (
    <p className={styles.disclosure}>
      <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
        <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

export { styles as uiStyles };
