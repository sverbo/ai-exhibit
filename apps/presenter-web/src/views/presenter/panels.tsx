import { useState } from "react";
import type { Locale, PresentationDefinition, SceneDefinition, SourceRecord } from "@ai-exhibit/presentation-core";
import { EvidenceBadge, getSceneComponent } from "@ai-exhibit/scene-components";
import { formatDuration, type Pace } from "../../control/pace.ts";
import { useUi } from "../../i18n.ts";
import { cloudHealthText, useCloudHealth } from "../../talk/runtime.ts";
import type { Talk } from "../../talk/useTalk.ts";
import chrome from "../../ui/chrome.module.css";
import { SpeakerNotes } from "../../ui/SpeakerNotes.tsx";
import styles from "./panels.module.css";

/** Scene-level plus card-level source IDs, deduplicated. */
export function sceneSourceIds(scene: SceneDefinition): string[] {
  const ids = [...scene.sourceIds];
  if (scene.visual.layout === "cards") for (const c of scene.visual.cards) ids.push(...(c.sourceIds ?? []));
  return [...new Set(ids)];
}

/** Content TODOs plus problems the shell can detect itself. */
export function sceneTodos(scene: SceneDefinition): string[] {
  const todos = [...(scene.todo ?? [])];
  if (scene.visual.layout === "component" && !getSceneComponent(scene.visual.component)) {
    todos.unshift(`Component "${scene.visual.component}" is not built yet: the projector shows a placeholder.`);
  }
  if (scene.visual.layout === "placeholder") todos.unshift("Scene is a placeholder layout.");
  return todos;
}

const NOTES_SCALE_KEY = "ai-exhibit:notes-scale";
const SCALE_MIN = 0.7;
const SCALE_MAX = 1.6;

function readScale(): number {
  try {
    const v = Number(localStorage.getItem(NOTES_SCALE_KEY));
    return v >= SCALE_MIN && v <= SCALE_MAX ? v : 1;
  } catch {
    return 1;
  }
}

/** Notes text size, persisted per machine (A- / A+). */
export function useNotesScale(): { scale: number; change: (delta: number) => void } {
  const [scale, setScale] = useState(readScale);
  const change = (delta: number) => {
    const next = Math.round(Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale + delta)) * 10) / 10;
    setScale(next);
    try {
      localStorage.setItem(NOTES_SCALE_KEY, String(next));
    } catch {
      // storage unavailable
    }
  };
  return { scale, change };
}

/**
 * The presenter's main reading surface: the talking points large, the
 * takeaway above them and the way out below, both quieter.
 */
export function NotesPanel({
  scene,
  next,
  locale,
  scale,
  personalNote,
}: {
  scene: SceneDefinition | undefined;
  next: SceneDefinition | undefined;
  locale: Locale;
  scale: number;
  /** The presenter's own note (personal config), shown as the first bullet. */
  personalNote?: string;
}) {
  const { t } = useUi();
  if (!scene) return null;
  const takeaway = scene.takeaway[locale];
  const transition = scene.transitionOut[locale];
  return (
    <div className={styles.notes} style={{ "--notes-scale": scale } as React.CSSProperties}>
      {takeaway ? (
        <p className={styles.takeaway}>
          <span className={styles.aside}>{t("takeaway")}</span> {takeaway}
        </p>
      ) : null}
      <div className={styles.pointsScroll}>
        <SpeakerNotes markdown={scene.speakerNotes[locale]} variant="desk" personal={personalNote} />
      </div>
      <div className={styles.then}>
        {transition ? (
          <p className={styles.transitionOut}>
            <span className={styles.aside}>{t("transitionOut")}</span> {transition}
          </p>
        ) : null}
        <p className={styles.nextLine}>
          <span className={styles.aside}>{t("upNext")}</span>{" "}
          {next ? (
            <>
              <span className={chrome.mono}>{next.number}</span> {next.title[locale]}
            </>
          ) : (
            t("endOfTalk")
          )}
        </p>
      </div>
    </div>
  );
}

export function SourcesPanel({
  scene,
  locale,
  getSource,
}: {
  scene: SceneDefinition | undefined;
  locale: Locale;
  getSource: (id: string) => SourceRecord | undefined;
}) {
  const { t } = useUi();
  if (!scene) return null;
  const ids = sceneSourceIds(scene);
  return (
    <div className={styles.sources}>
      {scene.evidenceLevel !== "none" ? (
        <p className={styles.badgeScope}>
          <EvidenceBadge level={scene.evidenceLevel} locale={locale} size="sm" />
        </p>
      ) : null}
      {ids.length === 0 ? <p className={chrome.muted}>{t("noSources")}</p> : null}
      <ol className={styles.sourceList}>
        {ids.map((id) => (
          <SourceItem key={id} id={id} source={getSource(id)} locale={locale} />
        ))}
      </ol>
    </div>
  );
}

export function SourceItem({ id, source, locale }: { id: string; source: SourceRecord | undefined; locale: Locale }) {
  const { t } = useUi();
  if (!source) {
    return (
      <li className={styles.source}>
        <span className={styles.unknown}>{id}</span>
      </li>
    );
  }
  const verified = source.verification === "verified";
  return (
    <li className={styles.source}>
      <div className={styles.sourceHead}>
        <span className={`${styles.verify} ${verified ? styles.verified : styles.unverified}`}>
          <span aria-hidden="true">{verified ? "✓" : "?"}</span> {verified ? t("verified") : t("needsVerification")}
        </span>
        {source.evidence !== "none" ? (
          <span className={styles.badgeScope}>
            <EvidenceBadge level={source.evidence} locale={locale} size="sm" />
          </span>
        ) : null}
      </div>
      <p className={styles.sourceTitle}>
        {source.url ? (
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.title}
          </a>
        ) : (
          source.title
        )}
      </p>
      <p className={styles.sourceMeta}>
        {[source.publisher, source.authors?.join(", "), source.date].filter(Boolean).join(" · ")}
      </p>
      <p className={styles.claim}>{source.claim}</p>
      {source.notes ? <p className={styles.claim}>{source.notes}</p> : null}
    </li>
  );
}

export function TodoPanel({ scene }: { scene: SceneDefinition | undefined }) {
  const { t } = useUi();
  if (!scene) return null;
  const todos = sceneTodos(scene);
  if (!todos.length) return <p className={chrome.muted}>{t("noTodo")}</p>;
  return (
    <ul className={styles.todos}>
      {todos.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function HealthPanel({ talk }: { talk: Talk }) {
  const { t } = useUi();
  const { session } = talk;
  const cloud = cloudHealthText(useCloudHealth());
  const counts = new Map<string, number>();
  for (const c of session.clients) counts.set(c.role, (counts.get(c.role) ?? 0) + 1);
  // The projector window joins as "solo" (it can run alone), like a rehearsal window.
  const screens = counts.get("solo") ?? 0;

  const statusText =
    session.status === "open" ? t("statusOpen") : session.status === "connecting" ? t("statusConnecting") : t("statusOffline");
  return (
    <div className={styles.health}>
      <dl className={styles.rows}>
        <Row ok={session.status === "open" ? "ok" : session.status === "connecting" ? "warn" : "bad"} label={t("session")}>
          {statusText} · {t("viaBrowser")}
        </Row>
        <Row ok={screens > 0 ? "ok" : "warn"} label={t("clients")}>
          {`presenter ${counts.get("presenter") ?? 0} · projector ${screens}`}
          {talk.ownsStage ? ` · ${t("runsScenes")}` : talk.linked ? ` · ${t("linkedElsewhere")}` : ""}
        </Row>
        <Row ok={cloud.state} label={t("cloudModels")}>
          {cloud.text.replace(/^Hugging Face:? ?/, "")}
        </Row>
      </dl>

      <button
        type="button"
        className={`${chrome.btn} ${styles.restart}`}
        disabled={!talk.controller}
        onClick={() => {
          if (window.confirm(t("confirmRestart"))) talk.actions.restart();
        }}
      >
        {t("restartTalk")}
      </button>
    </div>
  );
}

function Row({ ok, label, children }: { ok: "ok" | "warn" | "bad" | "none"; label: string; children: React.ReactNode }) {
  const dot = ok === "ok" ? chrome.dotOk : ok === "warn" ? chrome.dotWarn : ok === "bad" ? chrome.dotBad : "";
  return (
    <div className={styles.row}>
      <dt>
        <span className={`${chrome.dot} ${dot}`} /> {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Chapters as proportional segments, with the planned position and the clock. */
export function ChapterStrip({
  pace,
  presentation,
  locale,
}: {
  pace: Pace;
  presentation: PresentationDefinition;
  locale: Locale;
}) {
  const { t } = useUi();
  const total = pace.plannedTotalSec || 1;
  const pct = (sec: number) => `${Math.min(100, Math.max(0, (sec / total) * 100))}%`;
  return (
    <div className={styles.strip}>
      <div className={styles.segments}>
        {pace.chapters.map((c) => {
          const title = presentation.chapters.find((ch) => ch.id === c.id)?.title[locale] ?? c.id;
          return (
            <div
              key={`${c.id}-${c.plannedStartSec}`}
              className={`${styles.segment} ${styles[`seg_${c.status}`]}`}
              style={{ flexGrow: c.plannedSec || 1 }}
              title={`${c.id} · ${title} · ${formatDuration(c.plannedSec)}`}
            >
              <span className={styles.segLabel}>
                <span className={chrome.mono}>{c.id}</span> {c.status === "current" ? title : ""}
              </span>
            </div>
          );
        })}
      </div>
      {pace.plannedTotalSec > 0 ? (
        <>
          <span className={styles.markPos} style={{ left: pct(pace.plannedSceneStartSec) }} title={t("scene")} />
          <span className={styles.markClock} style={{ left: pct(pace.elapsedSec) }} title={t("timer")} />
        </>
      ) : null}
    </div>
  );
}
