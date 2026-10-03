import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, isThemeName, type ThemeName } from "@ai-exhibit/scene-components";

/**
 * The presentation's color theme on this device: persisted in localStorage,
 * applied as `data-theme` on <html>, and stamped with the time it was chosen so
 * the session can settle disagreements between screens (newest choice wins,
 * see `useSessionTheme`).
 */
export interface StampedTheme {
  theme: ThemeName;
  /** Epoch ms of the choice; 0 means "never chosen, using the default". */
  at: number;
}

const STORAGE_KEY = "ai-exhibit:theme";
const listeners = new Set<() => void>();

export function parseStampedTheme(raw: string | null): StampedTheme | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { theme?: unknown; at?: unknown };
    if (isThemeName(v.theme) && typeof v.at === "number" && Number.isFinite(v.at)) return { theme: v.theme, at: v.at };
  } catch {
    // older or foreign value
  }
  return null;
}

function read(): StampedTheme {
  const fromUrl = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("theme");
  if (isThemeName(fromUrl)) return { theme: fromUrl, at: 0 };
  try {
    return parseStampedTheme(localStorage.getItem(STORAGE_KEY)) ?? { theme: DEFAULT_THEME, at: 0 };
  } catch {
    return { theme: DEFAULT_THEME, at: 0 };
  }
}

let current: StampedTheme = typeof window === "undefined" ? { theme: DEFAULT_THEME, at: 0 } : read();

function apply(): void {
  if (typeof document !== "undefined") document.documentElement.dataset.theme = current.theme;
}

function commit(next: StampedTheme, persist: boolean): void {
  if (next.theme === current.theme && next.at === current.at) return;
  current = next;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable: the theme still applies to this page
    }
  }
  apply();
  for (const l of listeners) l();
}

/** The presenter picked a theme here, now. */
export function chooseTheme(theme: ThemeName): void {
  commit({ theme, at: Date.now() }, true);
}

/** Takes a choice made elsewhere (the session, another tab) when it is newer than ours. */
export function adoptTheme(other: StampedTheme): void {
  if (other.at > current.at) commit(other, true);
}

export function currentStampedTheme(): StampedTheme {
  return current;
}

if (typeof window !== "undefined") {
  apply();
  // Another tab of this browser (the launcher, say) chose a theme.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const next = parseStampedTheme(e.newValue);
    if (next) adoptTheme(next);
  });
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** This device's theme plus a toggle. Views inside a session also call `useSessionTheme`. */
export function useTheme(): { theme: ThemeName; stamped: StampedTheme; toggle: () => void; set: (t: ThemeName) => void } {
  const stamped = useSyncExternalStore(subscribe, () => current, () => current);
  return {
    theme: stamped.theme,
    stamped,
    toggle: () => chooseTheme(stamped.theme === "light" ? "dark" : "light"),
    set: chooseTheme,
  };
}
