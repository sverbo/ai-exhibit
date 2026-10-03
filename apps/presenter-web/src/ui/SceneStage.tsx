import type { ReactNode } from "react";
import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { SceneRenderer, Stage, type SceneRole } from "@ai-exhibit/scene-components";
import { sceneSlice, useSceneContext } from "../talk/sceneContext.ts";
import { useDefaultModelSource } from "../talk/modelSourceDefault.ts";
import { modelSourceOf } from "../talk/shell.ts";
import type { Talk } from "../talk/useTalk.ts";

/** One scene on a letterboxed stage, wired to the session for a given role. */
export function SceneStage({
  talk,
  scene,
  role,
  revealStep,
  glossaryUrl,
  ghost = false,
  bars,
  className,
  overlay,
}: {
  talk: Talk;
  scene: SceneDefinition;
  role: SceneRole;
  revealStep?: number;
  glossaryUrl: string | null;
  ghost?: boolean;
  /** Letterbox color; "transparent" lets presenter chrome show through. */
  bars?: "black" | "transparent";
  className?: string;
  /** Drawn on top of the scene, in stage pixels (e.g. the projector's progress rail). */
  overlay?: ReactNode;
}) {
  const defaultSource = useDefaultModelSource();
  // One window runs the stage (talk.ownsStage); any other controller view mirrors it.
  const effective: SceneRole = role === "controller" && !talk.ownsStage ? "display" : role;
  const ctx = useSceneContext({
    scene,
    role: effective,
    locale: talk.locale,
    revealStep: revealStep ?? talk.state?.revealStep ?? 0,
    ...sceneSlice(talk.state, scene.id),
    dispatch: effective === "controller" && talk.controller ? talk.session.dispatch : null,
    getSource: talk.getSource,
    glossaryUrl,
    reducedMotion: talk.reducedMotion || effective === "preview",
    modelSource: modelSourceOf(talk.shell, defaultSource),
  });
  return (
    <Stage className={className} bars={bars}>
      {/* A new key on hand-over: the scene starts afresh in its new role, from the published state. */}
      <SceneRenderer key={effective} scene={scene} ctx={ctx} ghostUnrevealed={ghost} />
      {overlay}
    </Stage>
  );
}
