/**
 * Opens the other talk view in a named tab of this browser (same profile, so the
 * two stay linked); a second click focuses the tab already opened.
 */
export function openView(view: "presenter" | "projector"): void {
  window.open(`/${view}`, `ai-exhibit-${view}`);
}
