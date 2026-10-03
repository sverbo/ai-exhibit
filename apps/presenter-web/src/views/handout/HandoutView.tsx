import { useEffect, useMemo, useState } from "react";
import { tr, type SourceRecord } from "@ai-exhibit/presentation-core";
import { EvidenceBadge } from "@ai-exhibit/scene-components";
import { useUi } from "../../i18n.ts";
import { DEFAULT_EDITION, defaultTalkLocale, queryParam, preferredTalkLocale, resolveTalk, sourceLookup } from "../../talk/presentation.ts";
import { LocalePicker } from "../../ui/LocalePicker.tsx";
import { sceneSourceIds } from "../presenter/panels.tsx";
import styles from "./HandoutView.module.css";

const COPY = {
  intro: {
    fr: "Ce qu'il faut retenir de la présentation, chapitre par chapitre, avec toutes les sources citées et leur niveau de preuve.",
    en: "What to remember from the talk, chapter by chapter, with every source cited and its level of evidence.",
  },
  sources: { fr: "Sources", en: "Sources" },
  verified: { fr: "Vérifiée", en: "Verified" },
  unverified: { fr: "À vérifier", en: "Needs verification" },
  retrieved: { fr: "consultée le", en: "retrieved" },
  evidenceKey: { fr: "Niveaux de preuve", en: "Levels of evidence" },
  objective: { fr: "Objectif", en: "Objective" },
  language: { fr: "Langue", en: "Language" },
} as const;

/** Public post-talk page, in the language last chosen in this browser (default: the talk's); its own picker switches it. */
export default function HandoutView() {
  const { t } = useUi();
  const [editionId] = useState(() => queryParam("edition") ?? DEFAULT_EDITION);
  const [locale, setLocale] = useState(() => preferredTalkLocale() ?? defaultTalkLocale());
  const talk = useMemo(() => resolveTalk(editionId), [editionId]);
  const getSource = useMemo(() => sourceLookup(talk.presentation), [talk.presentation]);
  const { presentation, edition, scenes } = talk;

  useEffect(() => {
    document.title = `${tr(presentation.title, locale)} · ${t("viewHandout")}`;
    document.documentElement.lang = locale;
  }, [presentation, locale, t]);

  // Every source cited in the edition, in order of first citation.
  const cited = useMemo(() => {
    const seen = new Map<string, SourceRecord | undefined>();
    for (const s of scenes) for (const id of sceneSourceIds(s)) if (!seen.has(id)) seen.set(id, getSource(id));
    return [...seen.entries()];
  }, [scenes, getSource]);
  const sourceNumber = useMemo(() => new Map(cited.map(([id], i) => [id, i + 1])), [cited]);

  return (
    <div className={styles.page} lang={locale}>
      <div className={styles.toolbar}>
        <LocalePicker
          value={locale}
          label={tr(COPY.language, locale)}
          onChange={(l) => {
            setLocale(l);
          }}
        />
      </div>
      <header className={styles.header}>
        <h1 className={styles.h1}>{tr(presentation.title, locale)}</h1>
        <p className={styles.intro}>{tr(COPY.intro, locale)}</p>
      </header>

      <main>
        {presentation.chapters.map((chapter) => {
          const chapterScenes = scenes.filter((s) => s.chapter === chapter.id);
          if (!chapterScenes.length) return null;
          return (
            <section key={chapter.id} className={styles.chapter}>
              <h2 className={styles.h2}>
                <span className={styles.chapterId}>{chapter.id}</span>
                {tr(chapter.title, locale)}
              </h2>
              <p className={styles.summary}>{tr(chapter.summary, locale)}</p>
              <ol className={styles.scenes}>
                {chapterScenes.map((scene) => {
                  const ids = sceneSourceIds(scene);
                  return (
                    <li key={scene.id} className={styles.scene}>
                      <p className={styles.takeaway}>{tr(scene.takeaway, locale)}</p>
                      <p className={styles.objective}>{tr(scene.objective, locale)}</p>
                      {scene.evidenceLevel !== "none" || ids.length ? (
                        <p className={styles.cites}>
                          {scene.evidenceLevel !== "none" ? (
                            <span className={styles.badgeScope}>
                              <EvidenceBadge level={scene.evidenceLevel} locale={locale} size="sm" />
                            </span>
                          ) : null}
                          {ids.map((id) => (
                            <a key={id} className={styles.ref} href={`#src-${id}`}>
                              [{sourceNumber.get(id)}]
                            </a>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}

        {cited.length ? (
          <section className={styles.chapter}>
            <h2 className={styles.h2}>{tr(COPY.sources, locale)}</h2>
            <ol className={styles.sourceList}>
              {cited.map(([id, source], i) => (
                <li key={id} id={`src-${id}`} className={styles.source}>
                  <span className={styles.sourceNumber}>{i + 1}</span>
                  {source ? (
                    <div>
                      <p className={styles.sourceTitle}>
                        {source.url ? <a href={source.url}>{source.title}</a> : source.title}
                      </p>
                      <p className={styles.sourceMeta}>
                        {[source.authors?.join(", "), source.publisher, source.date].filter(Boolean).join(", ")}
                        {source.retrieved ? ` (${tr(COPY.retrieved, locale)} ${source.retrieved})` : ""}
                      </p>
                      <p className={styles.sourceStatus}>
                        {source.evidence !== "none" ? (
                          <span className={styles.badgeScope}>
                            <EvidenceBadge level={source.evidence} locale={locale} size="sm" />
                          </span>
                        ) : null}
                        <span className={source.verification === "verified" ? styles.verified : styles.unverified}>
                          {source.verification === "verified" ? `✓ ${tr(COPY.verified, locale)}` : `? ${tr(COPY.unverified, locale)}`}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className={styles.sourceTitle}>{id}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </main>
    </div>
  );
}
