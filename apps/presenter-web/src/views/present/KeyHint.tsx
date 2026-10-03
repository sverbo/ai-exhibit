import { type ReactNode, useEffect, useRef, useState } from "react";
import { useUi } from "../../i18n.ts";
import chrome from "../../ui/chrome.module.css";
import styles from "./KeyHint.module.css";

const VISIBLE_MS = 2000;
/** On arrival the full-screen button stays up a little longer: browsers only enter full screen on a click. */
const FIRST_VISIBLE_MS = 5000;

/**
 * Projector-only mode: a faint line of the main keys at the bottom edge,
 * shown only while the mouse moves over the window and gone ~2 s after it
 * stops, when it leaves the window, or at the first key (a clicker press never
 * shows it). The audience mostly never sees it. While the window is not full
 * screen, a "Full screen" button shows with it (top right), and on arrival:
 * a page cannot enter full screen by itself, it needs that click. The same
 * corner holds `corner` (the model source switch, otherwise only in the hidden
 * HUD) and stays up while the pointer is over it.
 */
export function KeyHint({
  fullscreen,
  corner,
  keys = true,
}: {
  fullscreen: { isFullscreen: boolean; toggle: () => void };
  corner?: ReactNode;
  /** False on a display-only window (keys do nothing there). */
  keys?: boolean;
}) {
  const { t } = useUi();
  const [shown, setShown] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovering = useRef(false);

  useEffect(() => {
    const hide = () => {
      if (hovering.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setShown(false);
    };
    const onMove = (e: PointerEvent) => {
      // Touch and pen taps are not "moving the mouse".
      if (e.pointerType !== "mouse") return;
      setShown(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(hide, VISIBLE_MS);
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
    };
    timer.current = setTimeout(hide, FIRST_VISIBLE_MS);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("mouseout", onLeave);
    window.addEventListener("keydown", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onLeave);
      window.removeEventListener("keydown", hide, true);
      window.removeEventListener("blur", hide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const K = ({ k }: { k: string }) => <kbd className={chrome.kbd}>{k}</kbd>;
  return (
    <>
      <div
        className={`${styles.corner} ${shown ? styles.shownCorner : ""}`}
        onPointerEnter={() => {
          hovering.current = true;
        }}
        onPointerLeave={() => {
          hovering.current = false;
        }}
      >
        {corner}
        {!fullscreen.isFullscreen ? (
          <button type="button" className={chrome.btn} onClick={fullscreen.toggle} tabIndex={shown ? 0 : -1}>
            {t("fullscreen")}
          </button>
        ) : null}
      </div>
      {keys ? (
      <p className={`${styles.hint} ${shown ? styles.shown : ""}`} aria-hidden="true" data-key-hint={shown ? "shown" : "hidden"}>
      <K k="→" /> {t("next").toLowerCase()} · <K k="←" /> {t("prev").toLowerCase()} · <K k="↓" /> {t("sceneEnd").toLowerCase()} ·{" "}
      <K k="⇧→" /> {t("nextScene").toLowerCase()} · <K k="N" /> {t("notes").toLowerCase()} · <K k="B" /> {t("blackout").toLowerCase()} ·{" "}
        <K k="G" /> {t("gotoScene").toLowerCase()}
      </p>
      ) : null}
    </>
  );
}
