import type { ReactNode } from "react";
import { Stage, type SceneRole } from "@ai-exhibit/scene-components";
import { projectorView } from "../talk/shell.ts";
import type { Talk } from "../talk/useTalk.ts";
import { useUi } from "../i18n.ts";
import { SceneStage } from "./SceneStage.tsx";
import styles from "./ProjectorSurface.module.css";

/**
 * Exactly what the projector shows: the live scene, the held frame while
 * frozen, or black. Used by /projector, /present and the presenter's mirror.
 */
export function ProjectorSurface({
  talk,
  role,
  glossaryUrl,
  overlay,
}: {
  talk: Talk;
  role: Exclude<SceneRole, "preview">;
  glossaryUrl: string | null;
  /** Drawn over the live scene, in stage pixels; not on black or on a slate. */
  overlay?: ReactNode;
}) {
  const { t } = useUi();
  const { state, scenes } = talk;
  if (!state) return <Slate text={t("waitingSession")} />;
  const view = projectorView(state);
  if (view.kind === "blackout") return <div className={styles.black} data-projector="blackout" />;
  // The full edition: a hidden scene the presenter still stands on (or froze) must render.
  const scene = talk.talk.scenes.find((s) => s.id === view.sceneId);
  if (!scene) return <Slate text={scenes.length ? t("waitingSession") : t("emptyEdition")} />;
  return (
    <div className={styles.surface} data-projector={view.kind}>
      <SceneStage talk={talk} scene={scene} role={role} revealStep={view.revealStep} glossaryUrl={glossaryUrl} overlay={overlay} />
    </div>
  );
}

function Slate({ text }: { text: string }) {
  return (
    <div className={styles.surface}>
      <Stage>
        <div className={styles.slate}>
          <span className={styles.slateMark} aria-hidden="true" />
          <p className={styles.slateText}>{text}</p>
        </div>
      </Stage>
    </div>
  );
}
