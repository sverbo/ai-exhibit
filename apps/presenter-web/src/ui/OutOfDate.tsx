import { useEffect } from "react";
import { useUi } from "../i18n.ts";
import type { Talk } from "../talk/useTalk.ts";
import chrome from "./chrome.module.css";
import styles from "./OutOfDate.module.css";

const RELOADED_KEY = "ai-exhibit:auto-reloaded-at";

/**
 * Shown when the session follows newer content than this window loaded. A
 * controller window asks to be reloaded (it no longer navigates meanwhile); a
 * display-only window, or the projector window (which may run alone and is
 * on the audience's screen), reloads itself, at most twice a minute.
 */
export function OutOfDateNotice({ talk, className }: { talk: Talk; className?: string }) {
  const { t } = useUi();
  const autoReload = talk.role === "projector" || window.location.pathname === "/projector";
  useEffect(() => {
    if (!talk.outOfDate || !autoReload) return;
    const id = setTimeout(() => {
      try {
        const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0);
        if (Date.now() - last < 30_000) return;
        sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
      } catch {
        // storage unavailable: reload anyway
      }
      window.location.reload();
    }, 1500);
    return () => clearTimeout(id);
  }, [talk.outOfDate, autoReload]);
  if (!talk.outOfDate || autoReload) return null;
  return (
    <p className={`${styles.notice} ${className ?? ""}`} role="alert" data-out-of-date="">
      <span>{t("outOfDate")}</span>
      <button type="button" className={`${chrome.btn} ${chrome.primary}`} onClick={() => window.location.reload()}>
        {t("reload")}
      </button>
    </p>
  );
}
