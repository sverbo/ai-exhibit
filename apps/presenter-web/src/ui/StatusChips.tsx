import type { SessionState } from "@ai-exhibit/session-protocol";
import { useUi } from "../i18n.ts";
import styles from "./StatusChips.module.css";

/** Fallback / frozen / blackout indicators, shape + text, never color alone. */
export function StatusChips({ state, sceneId }: { state: SessionState | null; sceneId: string | undefined }) {
  const { t } = useUi();
  if (!state) return null;
  const chips: { key: string; text: string; tone: "black" | "frozen" | "fallback" }[] = [];
  if (state.blackout) chips.push({ key: "b", text: t("projectorBlack"), tone: "black" });
  if (state.frozen) chips.push({ key: "z", text: t("projectorFrozenShort"), tone: "frozen" });
  if (sceneId && state.fallback[sceneId]) chips.push({ key: "f", text: t("fallbackOn"), tone: "fallback" });
  if (!chips.length) return null;
  return (
    <span className={styles.chips}>
      {chips.map((c) => (
        <span key={c.key} className={`${styles.chip} ${styles[c.tone]}`}>
          {c.text}
        </span>
      ))}
    </span>
  );
}
