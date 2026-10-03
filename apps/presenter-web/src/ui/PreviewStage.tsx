import { useEffect, useRef, useState } from "react";
import type { Locale, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { SceneRenderer, Stage } from "@ai-exhibit/scene-components";
import { useSceneContext } from "../talk/sceneContext.ts";

/** Static preview of a scene without a session, rendered only once scrolled into view. */
export function PreviewStage({
  scene,
  locale,
  getSource,
  ghost = true,
}: {
  scene: SceneDefinition;
  locale: Locale;
  getSource: (id: string) => SourceRecord | undefined;
  ghost?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setVisible(true);
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {visible ? <PreviewInner scene={scene} locale={locale} getSource={getSource} ghost={ghost} /> : null}
    </div>
  );
}

function PreviewInner({ scene, locale, getSource, ghost }: { scene: SceneDefinition; locale: Locale; getSource: (id: string) => SourceRecord | undefined; ghost: boolean }) {
  const ctx = useSceneContext({
    scene,
    role: "preview",
    locale,
    revealStep: 0,
    fallback: false,
    sceneState: undefined,
    dispatch: null,
    getSource,
    glossaryUrl: null,
    reducedMotion: true,
  });
  return (
    <Stage>
      <SceneRenderer scene={scene} ctx={ctx} ghostUnrevealed={ghost} />
    </Stage>
  );
}
