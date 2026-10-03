import { LOCALE_INFO, type Locale } from "@ai-exhibit/presentation-core";
import { talkLocales } from "../talk/presentation.ts";
import chrome from "./chrome.module.css";

/**
 * The talk's language: one button per locale the talk offers, each named in
 * its own language (`compact`: its code, the name as a tooltip). `label`
 * names the group for screen readers.
 */
export function LocalePicker({
  value,
  onChange,
  label = "Language of the talk",
  locales = talkLocales(),
  className,
  compact = false,
}: {
  value: Locale;
  onChange: (locale: Locale) => void;
  label?: string;
  locales?: Locale[];
  className?: string;
  compact?: boolean;
}) {
  if (locales.length < 2) return null;
  return (
    <div className={`${chrome.segmented} ${className ?? ""}`} role="group" aria-label={label}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={`${chrome.segment} ${l === value ? chrome.segmentOn : ""}`}
          aria-pressed={l === value}
          title={compact ? LOCALE_INFO[l].name : undefined}
          onClick={() => onChange(l)}
        >
          {compact ? l.toUpperCase() : LOCALE_INFO[l].name}
        </button>
      ))}
    </div>
  );
}

/** Keeps `?lang=` in the URL in sync with a picker. */
export function setLangParam(locale: Locale): void {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState(null, "", url);
}
