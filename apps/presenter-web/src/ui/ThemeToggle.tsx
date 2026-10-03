import type { Locale } from "@ai-exhibit/presentation-core";
import { uiString, useUi, type UiKey } from "../i18n.ts";
import { useTheme } from "../theme.ts";
import chrome from "./chrome.module.css";

/**
 * Light/dark switch for the whole talk. In a session view the choice reaches
 * every screen (the projector follows); elsewhere it is saved for next time.
 */
export function ThemeToggle({ hint = true, className, locale }: { hint?: boolean; className?: string; locale?: Locale }) {
  const ui = useUi();
  const t = (key: UiKey) => (locale ? uiString(key, locale) : ui.t(key));
  const { theme, set } = useTheme();
  return (
    <span className={`${chrome.segmented} ${className ?? ""}`} role="radiogroup" aria-label={t("theme")}>
      {(["light", "dark"] as const).map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={theme === name}
          className={`${chrome.segment} ${theme === name ? chrome.segmentOn : ""}`}
          onClick={() => set(name)}
          title={hint ? `${t("theme")} (L)` : undefined}
        >
          {name === "light" ? t("themeLight") : t("themeDark")}
        </button>
      ))}
    </span>
  );
}
