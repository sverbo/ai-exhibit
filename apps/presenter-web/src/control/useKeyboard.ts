import { useEffect, useRef } from "react";
import { isEditableTarget, keyAction, type KeyAction } from "./keyboard.ts";

/**
 * Listens for the presenter keyboard map on window. Keys typed into inputs,
 * editors or `[data-keys-local]` regions are ignored, as are events a scene
 * already handled (defaultPrevented).
 */
export function useKeyboard(onAction: (action: KeyAction) => void, enabled = true): void {
  const handler = useRef(onAction);
  handler.current = onAction;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if (isEditableTarget(e.target)) return;
      const action = keyAction(e);
      if (!action) return;
      e.preventDefault();
      handler.current(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
