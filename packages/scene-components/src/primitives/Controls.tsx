/**
 * Shared scene controls: one compact bar, the same in every window
 * (docs/specs/2026-10-04-interaction-anywhere.md). Scenes render it when
 * `canInteract(ctx)` and route clicks through `useSceneActions`.
 */
import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { MAX_INPUT_CHARS } from "@ai-exhibit/ml-runtime/lm";
import styles from "./Controls.module.css";

function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** Keys the presentation shell listens to; inputs keep them for themselves (Escape still leaves). */
export const keepKeys = (e: KeyboardEvent) => {
  if (e.key !== "Escape") e.stopPropagation();
};
const NAV_KEYS = new Set([" ", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"]);

export function ControlBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx(styles.bar, className)} data-keys-local="">
      {children}
    </div>
  );
}

export function ControlButton({
  children,
  onClick,
  active,
  disabled,
  primary,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={cx(styles.button, primary && styles.primary, active && styles.active)}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        onClick();
        // Keep presentation keys working after a pointer click.
        if (e.detail > 0) e.currentTarget.blur();
      }}
      onKeyDown={(e) => {
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

/** A label and mutually exclusive options, on one line. */
export function ControlChoice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label?: string;
  value: T | null;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.row}>
        {options.map((o) => (
          <ControlButton key={String(o.value)} active={o.value === value} disabled={disabled} onClick={() => onChange(o.value)}>
            {o.label}
          </ControlButton>
        ))}
      </div>
    </div>
  );
}

/** Longest text a scene field accepts, matching the server's cap. */
export const MAX_FIELD_CHARS = MAX_INPUT_CHARS;

/** How long after the last keystroke a field keeps its own draft over the published value. */
const TYPING_MS = 1500;

/**
 * Text input that never fights the published value: while the user is typing
 * in it (focused, last keystroke under 1.5 s ago) it keeps its own draft, so
 * typing stays smooth in any window and the caret never jumps; otherwise it
 * shows the published `value`, including edits made in another window.
 * `onChange` fires on each edit (debounced by `debounceMs` when set),
 * `onSubmit` on Enter.
 */
export function ControlField({
  label,
  value,
  placeholder,
  onSubmit,
  onChange,
  submitLabel,
  disabled,
  wide,
  clearOnSubmit,
  debounceMs = 0,
  maxLength = MAX_FIELD_CHARS,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onSubmit?: (v: string) => void;
  onChange?: (v: string) => void;
  submitLabel?: string;
  disabled?: boolean;
  wide?: boolean;
  clearOnSubmit?: boolean;
  debounceMs?: number;
  /** The server accepts 300 characters per text (MAX_INPUT_CHARS in ml-runtime's cloud client). */
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const focused = useRef(false);
  const lastEdit = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resync = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value ?? "");
  valueRef.current = value ?? "";
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const typing = () => focused.current && Date.now() - lastEdit.current < TYPING_MS;

  // Published value: shown unless the user is typing here.
  useEffect(() => {
    if (!typing()) setDraft(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (resync.current) clearTimeout(resync.current);
    },
    [],
  );

  const emit = (v: string) => {
    if (!onChangeRef.current) return;
    if (debounceMs <= 0) {
      onChangeRef.current(v);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      onChangeRef.current?.(v);
    }, debounceMs);
  };

  return (
    <form
      className={cx(styles.field, wide && styles.wide)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(draft);
        if (clearOnSubmit) setDraft("");
      }}
    >
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        value={draft}
        placeholder={placeholder}
        aria-label={label}
        maxLength={maxLength}
        disabled={disabled}
        spellCheck={false}
        onKeyDown={keepKeys}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          if (timer.current) {
            // Flush the last edit before showing the published value again.
            clearTimeout(timer.current);
            timer.current = null;
            onChangeRef.current?.(draft);
          }
          // The published value takes over again when it next changes.
        }}
        onChange={(e) => {
          const v = e.currentTarget.value;
          lastEdit.current = Date.now();
          setDraft(v);
          emit(v);
          // Once typing pauses, follow the published value again (edits from another window).
          if (resync.current) clearTimeout(resync.current);
          resync.current = setTimeout(() => {
            resync.current = null;
            if (!typing()) setDraft(valueRef.current);
          }, TYPING_MS + 50);
        }}
      />
      {submitLabel ? (
        <button type="submit" className={cx(styles.button, styles.primary)} disabled={disabled}>
          {submitLabel}
        </button>
      ) : null}
    </form>
  );
}
