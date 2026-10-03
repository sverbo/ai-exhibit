/** Presenter keyboard map (spec §3, plus L for the theme and Down/Up to jump to the end or start of the current scene). */
export type KeyAction =
  | "next"
  | "prev"
  | "nextScene"
  | "prevScene"
  | "sceneEnd"
  | "sceneStart"
  | "fallback"
  | "reset"
  | "blackout"
  | "freeze"
  | "timer"
  | "notes"
  | "goto"
  | "theme"
  | "escape";

export interface KeyLike {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

const LETTERS: Record<string, KeyAction> = {
  f: "fallback",
  r: "reset",
  b: "blackout",
  z: "freeze",
  t: "timer",
  n: "notes",
  g: "goto",
  l: "theme",
};

/**
 * Maps a key event to an action, or null. Shortcuts with Ctrl/Cmd/Alt are left
 * to the browser (reload, copy, devtools...).
 */
export function keyAction(e: KeyLike): KeyAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  switch (e.key) {
    case "ArrowRight":
      return e.shiftKey ? "nextScene" : "next";
    case "ArrowLeft":
      return e.shiftKey ? "prevScene" : "prev";
    case " ":
    case "Spacebar":
    case "PageDown":
      return "next";
    case "PageUp":
      return "prev";
    case "ArrowDown":
      return "sceneEnd";
    case "ArrowUp":
      return "sceneStart";
    case "Escape":
      return "escape";
  }
  if (e.key.length === 1) return LETTERS[e.key.toLowerCase()] ?? null;
  return null;
}

interface ElementLike {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
}

/** True when keys typed in `target` belong to the target (text inputs, editors). */
export function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as ElementLike;
  if (el.isContentEditable) return true;
  const tag = el.tagName?.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // Scenes can opt a whole region out of navigation keys.
  return Boolean(el.closest?.("[data-keys-local]"));
}
