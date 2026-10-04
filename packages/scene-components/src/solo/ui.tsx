/** Small shared parts of the solo demos. */
import type { ReactNode } from "react";
import { tr, type Locale } from "@ai-exhibit/presentation-core";
import { COPY } from "../language/copy.ts";
import type { AudienceDemo } from "@ai-exhibit/ml-runtime/lm";
import { SOLO } from "./copy.ts";
import type { SoloEnv } from "./env.ts";
import styles from "./Solo.module.css";

export { styles as soloStyles };

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** The root of every solo demo: phone-scale tokens for the parts reused from the scenes. */
export function SoloRoot({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section className={styles.solo} aria-label={label}>
      {children}
    </section>
  );
}

/** "Recorded example": shown on every recorded output, so nobody takes it for a live one. */
export function RecordedTag({ locale }: { locale: Locale }) {
  return <span className={styles.tag}>{tr(COPY.fallback, locale)}</span>;
}

/** The calm line shown when the room is busy this minute. */
export function BusyNotice({ locale }: { locale: Locale }) {
  return (
    <p className={styles.notice} role="status">
      {tr(SOLO.busy, locale)}
    </p>
  );
}

/** A demo's own asks left this hour, discreet; or, once spent, why it shows recordings. */
export function AsksLeft({ env, demo }: { env: SoloEnv; demo: AudienceDemo }) {
  if (!env.live) return null;
  const left = env.left(demo);
  if (left === 0) {
    return (
      <p className={styles.notice} role="status">
        {tr(SOLO.demoUsedUp, env.locale)}
      </p>
    );
  }
  if (left === null || env.perHour === null) return null;
  return (
    <p className={styles.note} role="status">
      {tr(SOLO.asksLeft, env.locale).replace("{n}", String(left)).replace("{m}", String(env.perHour))}
    </p>
  );
}

/** Example or question chips: big enough for a thumb. */
export function Chips({
  items,
  value,
  onPick,
  disabled,
  label,
}: {
  items: string[];
  value: string | null;
  onPick: (item: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={cx(styles.chip, item === value && styles.chipOn)}
          aria-pressed={item === value}
          disabled={disabled}
          onClick={() => onPick(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
