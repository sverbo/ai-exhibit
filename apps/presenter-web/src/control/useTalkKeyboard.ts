import type { Talk } from "../talk/useTalk.ts";
import type { KeyAction } from "./keyboard.ts";
import { useKeyboard } from "./useKeyboard.ts";

/** Wires the spec keyboard map to a talk. View-level keys (N, G, Esc) go to `onView`. */
export function useTalkKeyboard(
  talk: Talk,
  onView: (action: Extract<KeyAction, "notes" | "goto" | "escape">) => void,
  enabled = true,
): void {
  const { actions } = talk;
  useKeyboard((action) => {
    switch (action) {
      case "next":
      case "prev":
      case "nextScene":
      case "prevScene":
      case "sceneEnd":
      case "sceneStart":
        actions.nav(action);
        return;
      case "fallback":
        actions.toggleFallback();
        return;
      case "reset":
        actions.resetScene();
        return;
      case "blackout":
        actions.toggleBlackout();
        return;
      case "freeze":
        actions.toggleFreeze();
        return;
      case "timer":
        actions.toggleTimer();
        return;
      case "theme":
        actions.toggleTheme();
        return;
      default:
        onView(action);
    }
  }, enabled && talk.controller);
}
