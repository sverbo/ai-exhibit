import { Suspense } from "react";
import { tr, type L10n, type Locale, type SceneDefinition } from "@ai-exhibit/presentation-core";
import { getSceneComponent, type SceneContext } from "../contract.ts";
import { GenericLayout } from "../layouts/GenericLayout.tsx";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import { Rich } from "../primitives/Rich.tsx";
import { SourceLabels } from "../primitives/SourceLabel.tsx";
import { SceneErrorBoundary } from "./SceneErrorBoundary.tsx";
import styles from "./SceneRenderer.module.css";

const COPY = {
  notBuilt: {  en: "Component not built yet" },
  objective: {  en: "Scene objective" },
  failed: {  en: "This scene could not be displayed." },
  pressF: {  en: "Press F to switch to the fallback." },
  inFallback: {  en: "The fallback failed too." },
  loading: {  en: "Loading" },
} satisfies Record<string, L10n>;

export interface SceneRendererProps {
  scene: SceneDefinition;
  ctx: SceneContext;
  /** Show unrevealed items of generic layouts as faint outlines. Presenter-side only. */
  ghostUnrevealed?: boolean;
  /**
   * Evidence badge and source labels of generic layouts, low on the stage.
   * Default true. The scene number is never printed on the stage: the presenter
   * chrome and HUD carry it, and on the stage it collided with scene content.
   */
  placard?: boolean;
}

/**
 * Renders one scene on a Stage: a generic layout, a registered component, or a
 * labelled placeholder. Failures are contained so navigation never breaks.
 */
export function SceneRenderer({ scene, ctx, ghostUnrevealed = false, placard = true }: SceneRendererProps) {
  const animate = !ctx.reducedMotion && ctx.role !== "preview";
  const visual = scene.visual;
  const showSceneSources = visual.layout !== "component" && visual.layout !== "cards";

  return (
    <div
      key={scene.id}
      className={`${styles.scene} ${animate ? styles.enter : ""}`}
      data-scene-id={scene.id}
      data-role={ctx.role}
      data-mode={ctx.mode}
      data-reveal-step={ctx.revealStep}
    >
      <SceneErrorBoundary
        resetKeys={[scene, ctx.mode]}
        fallback={(error) => <SceneFailure scene={scene} ctx={ctx} error={error} />}
      >
        <Suspense fallback={<div className={styles.loading} data-scene-loading="">{tr(COPY.loading, ctx.locale)}</div>}>
          {visual.layout === "component" ? (
            <ComponentSlot name={visual.component} props={visual.props ?? {}} ctx={ctx} />
          ) : (
            <GenericLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />
          )}
        </Suspense>
      </SceneErrorBoundary>
      {placard && showSceneSources ? (
        <footer className={styles.placard}>
          <span className={styles.placardSources}>
            <EvidenceBadge level={scene.evidenceLevel} locale={ctx.locale} size="sm" />
            <SourceLabels ids={scene.sourceIds} getSource={ctx.getSource} />
          </span>
        </footer>
      ) : null}
    </div>
  );
}

function ComponentSlot({ name, props, ctx }: { name: string; props: Record<string, unknown>; ctx: SceneContext }) {
  const Component = getSceneComponent(name);
  if (!Component) return <MissingComponent name={name} scene={ctx.scene} locale={ctx.locale} />;
  return <Component props={props} ctx={ctx} />;
}

export function MissingComponent({ name, scene, locale }: { name: string; scene: SceneDefinition; locale: Locale }) {
  return (
    <div className={styles.missing} data-scene-missing={name}>
      <p className={styles.missingTag}>
        {tr(COPY.notBuilt, locale)} <code className={styles.code}>{name}</code>
      </p>
      <h2 className={styles.missingTitle}>
        <Rich text={tr(scene.title, locale)} />
      </h2>
      <p className={styles.missingLabel}>{tr(COPY.objective, locale)}</p>
      <p className={styles.missingObjective}>
        <Rich text={tr(scene.objective, locale)} />
      </p>
    </div>
  );
}

function SceneFailure({ scene, ctx, error }: { scene: SceneDefinition; ctx: SceneContext; error: Error }) {
  const locale = ctx.locale;
  const note = scene.fallback.kind === "static" ? tr(scene.fallback.note, locale) : null;
  const canSwitch = scene.fallback.kind !== "none" && ctx.mode === "live";
  // The projector shows a calm slate; diagnostic detail stays on presenter screens.
  const showDetail = ctx.role !== "display";
  return (
    <div className={styles.failure} data-scene-failure={error.message}>
      <h2 className={styles.failureTitle}>
        <Rich text={tr(scene.title, locale)} />
      </h2>
      {note ? (
        <p className={styles.failureNote}>
          <Rich text={note} />
        </p>
      ) : null}
      {showDetail ? (
        <>
          <p className={styles.failureHint}>
            {ctx.mode === "fallback" ? tr(COPY.inFallback, locale) : tr(COPY.failed, locale)}{" "}
            {canSwitch ? tr(COPY.pressF, locale) : null}
          </p>
          <pre className={styles.failureError}>{error.message}</pre>
        </>
      ) : null}
    </div>
  );
}
