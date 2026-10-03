import { useSyncExternalStore } from "react";

/** Presentation-wide color theme, set as `data-theme` on <html> by the app shell. */
export type ThemeName = "light" | "dark";

export const DEFAULT_THEME: ThemeName = "light";

export function isThemeName(value: unknown): value is ThemeName {
  return value === "light" || value === "dark";
}

/** Theme in effect for `el` (nearest `[data-theme]` ancestor), else the document's. */
export function themeOf(el?: Element | null): ThemeName {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const holder = el?.closest?.("[data-theme]") ?? document.documentElement;
  const value = holder.getAttribute("data-theme");
  return isThemeName(value) ? value : DEFAULT_THEME;
}

function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/**
 * The document's current theme, re-rendering when it changes. Canvas and WebGL
 * code reads colors from CSS variables, so it must list this value in the
 * dependencies of the effect that reads the palette and redraws.
 */
export function useThemeName(): ThemeName {
  return useSyncExternalStore(subscribe, () => themeOf(null), () => DEFAULT_THEME);
}
