import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  stepCount,
  totalDurationSec,
  type Locale,
  type RuntimeClass,
  type SceneDefinition,
  type SourceRecord,
} from "@ai-exhibit/presentation-core";
import { EvidenceBadge } from "@ai-exhibit/scene-components";
import { formatDuration, formatMinutes } from "../../control/pace.ts";
import { useUi } from "../../i18n.ts";
import { DEFAULT_EDITION, queryParam, resolveTalk, sourceLookup } from "../../talk/presentation.ts";
import chrome from "../../ui/chrome.module.css";
import { EditionPicker, setEditionParam } from "../../ui/EditionPicker.tsx";
import { PreviewStage } from "../../ui/PreviewStage.tsx";
import { sceneTodos } from "../presenter/panels.tsx";
import styles from "./OverviewView.module.css";

/** Every scene of an edition at a glance; click to rehearse from there. */
export default function OverviewView() {
  const { t } = useUi();
  const [editionId, setEditionId] = useState(() => queryParam("edition") ?? DEFAULT_EDITION);
  const talk = useMemo(() => resolveTalk(editionId), [editionId]);
  const getSource = useMemo(() => sourceLookup(talk.presentation), [talk.presentation]);
  const locale = talk.edition.locale;
  const scenes = talk.scenes;

  useEffect(() => {
    document.title = `${t("viewOverview")} · ai-exhibit`;
  }, [t]);

  const totals = useMemo(() => {
    const byClass: Record<RuntimeClass, number> = { A: 0, B: 0, C: 0 };
    let todos = 0;
    let optional = 0;
    for (const s of scenes) {
      byClass[s.runtimeClass] += 1;
      todos += sceneTodos(s).length;
      if (s.optional) optional += 1;
    }
    return { byClass, todos, optional, duration: totalDurationSec(scenes) };
  }, [scenes]);

  const [minM, maxM] = talk.edition.targetMinutes;
  const minutes = totals.duration / 60;
  const inTarget = minutes >= minM && minutes <= maxM;

  return (
    <div className={styles.overview}>
      <header className={styles.header}>
        <div>
          <Link to="/" className={styles.back}>
            ai-exhibit
          </Link>
          <h1 className={styles.h1}>{t("viewOverview")}</h1>
        </div>
        <EditionPicker
          value={talk.edition.id}
          onChange={(id) => {
            setEditionId(id);
            setEditionParam(id);
          }}
        />
      </header>

      <dl className={styles.totals}>
        <div>
          <dt>{t("scenesCount")}</dt>
          <dd>{scenes.length}</dd>
        </div>
        <div className={inTarget ? "" : styles.off}>
          <dt>
            {t("planned")} / {t("target")}
          </dt>
          <dd>
            {formatMinutes(totals.duration)} <span className={chrome.muted}>/ {minM} {t("rangeTo")} {maxM} min</span>
          </dd>
        </div>
        <div>
          <dt>{t("optional")}</dt>
          <dd>{totals.optional}</dd>
        </div>
        <div>
          <dt>{t("runtimeClass")} A / B / C</dt>
          <dd>
            {totals.byClass.A} / {totals.byClass.B} / {totals.byClass.C}
          </dd>
        </div>
        <div className={totals.todos ? styles.warnTotal : ""}>
          <dt>{t("todos")}</dt>
          <dd>{totals.todos}</dd>
        </div>
      </dl>

      {scenes.length === 0 ? (
        <p className={styles.empty}>{t("noScenes")}</p>
      ) : null}

      {talk.presentation.chapters.map((chapter) => {
        const chapterScenes = scenes.filter((s) => s.chapter === chapter.id);
        if (!chapterScenes.length) return null;
        return (
          <section key={chapter.id} className={styles.chapter}>
            <h2 className={styles.h2}>
              <span className={chrome.mono}>{chapter.id}</span> {chapter.title[locale]}
              <span className={styles.chapterMeta}>{formatMinutes(totalDurationSec(chapterScenes))}</span>
            </h2>
            <ol className={styles.grid}>
              {chapterScenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  locale={locale}
                  getSource={getSource}
                  href={`/present?edition=${encodeURIComponent(talk.edition.id)}&scene=${encodeURIComponent(scene.id)}`}
                  hint={t("rehearseFromHere")}
                />
              ))}
            </ol>
          </section>
        );
      })}

    </div>
  );
}

function SceneCard({
  scene,
  locale,
  getSource,
  href,
  hint,
}: {
  scene: SceneDefinition;
  locale: Locale;
  getSource: (id: string) => SourceRecord | undefined;
  href: string;
  hint: string;
}) {
  const { t } = useUi();
  const todos = sceneTodos(scene).length;
  const steps = stepCount(scene);
  return (
    <li>
      <Link className={styles.card} to={href} title={hint}>
        <div className={styles.thumb}>
          <PreviewStage scene={scene} locale={locale} getSource={getSource} />
        </div>
        <div className={styles.meta}>
          <p className={styles.title}>
            <span className={`${chrome.mono} ${styles.number}`}>{scene.number}</span> {scene.title[locale]}
          </p>
          <p className={styles.id}>{scene.id}</p>
          <p className={styles.facts}>
            <span className={styles.fact} title={t("runtimeClass")}>
              {scene.runtimeClass}
            </span>
            <span className={chrome.mono}>{formatDuration(scene.durationSec)}</span>
            {steps ? (
              <span className={chrome.muted}>
                {steps} {steps > 1 ? t("steps") : t("step")}
              </span>
            ) : null}
            {scene.optional ? <span className={styles.optional}>{t("optional")}</span> : null}
            {todos ? (
              <span className={styles.todo}>
                {todos} {t("todos")}
              </span>
            ) : null}
            {scene.evidenceLevel !== "none" ? (
              <span className={styles.badgeScope}>
                <EvidenceBadge level={scene.evidenceLevel} locale={locale} size="sm" />
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </li>
  );
}
