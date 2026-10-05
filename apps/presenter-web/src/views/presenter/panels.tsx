import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { tr, type Locale, type PresentationDefinition, type SceneDefinition, type SourceRecord } from "@ai-exhibit/presentation-core";
import { Rich, EvidenceBadge, getSceneComponent } from "@ai-exhibit/scene-components";
import { formatDuration, type Pace } from "../../control/pace.ts";
import { useUi } from "../../i18n.ts";
import { cloudHealthText, useCloudHealth } from "../../talk/runtime.ts";
import type { Talk } from "../../talk/useTalk.ts";
import chrome from "../../ui/chrome.module.css";
import { SpeakerNotes } from "../../ui/SpeakerNotes.tsx";
import { plainInline } from "../../ui/notes.ts";
import styles from "./panels.module.css";
import { deskTitle } from "../../ui/deskTitle.ts";

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

// v2: the default moved to the small end (0.7), with two steps below it.
const NOTES_SCALE_KEY = "ai-exhibit:notes-scale-v2";
const SCALE_MIN = 0.5;
const SCALE_MAX = 1.6;
const SCALE_DEFAULT = 0.7;

function readScale(): number {
  try {
    const raw = localStorage.getItem(NOTES_SCALE_KEY);
    const v = Number(raw);
    return raw !== null && v >= SCALE_MIN && v <= SCALE_MAX ? v : SCALE_DEFAULT;
  } catch {
    return SCALE_DEFAULT;
  }
}

/**
 * How many talking points are cut off below the visible part of a scrolling
 * list, kept up to date on scroll, resize and content changes.
 */
function useHiddenBelow(ref: React.RefObject<HTMLElement | null>, key: unknown): number {
  const [hidden, setHidden] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const bottom = el.getBoundingClientRect().bottom;
      let n = 0;
      for (const li of el.querySelectorAll<HTMLElement>("[data-note-kind]")) {
        if (li.getBoundingClientRect().bottom > bottom + 2) n++;
      }
      setHidden(n);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const mutate = new MutationObserver(measure);
    mutate.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener("scroll", measure);
      resize.disconnect();
      mutate.disconnect();
    };
  }, [ref, key]);
  return hidden;
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
  const pointsRef = useRef<HTMLDivElement | null>(null);
  const hiddenBelow = useHiddenBelow(pointsRef, `${scene?.id}:${scale}:${locale}`);
  // A new scene starts at its first point.
  useEffect(() => {
    pointsRef.current?.scrollTo({ top: 0 });
  }, [scene?.id]);
  if (!scene) return null;
  const takeaway = tr(scene.takeaway, locale);
  const transition = tr(scene.transitionOut, locale);
  return (
    <div className={styles.notes} style={{ "--notes-scale": scale } as React.CSSProperties}>
      {takeaway ? (
        <p className={styles.takeaway}>
          <span className={styles.aside}>{t("takeaway")}</span> {takeaway}
        </p>
      ) : null}
      <div className={styles.pointsWrap}>
        <div className={styles.pointsScroll} ref={pointsRef}>
          <SpeakerNotes markdown={tr(scene.speakerNotes, locale)} variant="desk" personal={personalNote} />
        </div>
        {hiddenBelow > 0 ? (
          <button
            type="button"
            className={styles.moreBelow}
            onClick={() => pointsRef.current?.scrollBy({ top: pointsRef.current.clientHeight * 0.8, behavior: "smooth" })}
          >
            ▼ {hiddenBelow === 1 ? t("moreNotesOne") : t("moreNotes").replace("{n}", String(hiddenBelow))}
          </button>
        ) : null}
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
              <span className={chrome.mono}>{next.number}</span> <Rich text={deskTitle(next, locale)} />
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
  scenes,
  onGo,
}: {
  pace: Pace;
  presentation: PresentationDefinition;
  locale: Locale;
  /** The scenes the pace was computed on, in talk order; slides are those with a duration. */
  scenes: SceneDefinition[];
  /** Jump to a scene: hovering the strip splits each part into one cell per slide. */
  onGo: (sceneId: string) => void;
}) {
  const { t } = useUi();
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<{ id: string; label: string; left: number } | null>(null);
  // One unit per visible slide: segments and markers follow slide counts, not time or clicks.
  const total = pace.slideTotal || 1;
  const pct = (slides: number) => `${Math.min(100, Math.max(0, (slides / total) * 100))}%`;
  // The slides of each run of scenes, in the order computePace built its chapters (a part can come back after a reorder).
  const runs: SceneDefinition[][] = [];
  scenes.forEach((sc, i) => {
    if (i === 0 || scenes[i - 1]!.chapter !== sc.chapter) runs.push([]);
    if (sc.durationSec > 0) runs[runs.length - 1]!.push(sc);
  });
  // Where each slide's cell really is: parts are not exactly proportional (labels, gaps), so markers sit on the cells.
  const [cells, setCells] = useState<{ left: number; width: number }[]>([]);
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const measure = () => {
      const origin = strip.getBoundingClientRect().left;
      setCells(
        [...strip.querySelectorAll<HTMLElement>("[data-slide-cell]")].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left - origin, width: r.width };
        }),
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(strip);
    return () => resize.disconnect();
  }, [scenes, pace.chapters, locale]);
  /** A position in slides (3.5 = halfway through the fourth slide), as a left offset on the strip. */
  const at = (slides: number): string => {
    if (cells.length !== pace.slideTotal || !cells.length) return pct(slides);
    const k = Math.floor(slides);
    if (k >= cells.length) return `${cells[cells.length - 1]!.left + cells[cells.length - 1]!.width}px`;
    const c = cells[Math.max(0, k)]!;
    return `${c.left + Math.max(0, slides - k) * c.width}px`;
  };
  const show = (e: React.MouseEvent<HTMLButtonElement>, scene: SceneDefinition) => {
    const strip = stripRef.current?.getBoundingClientRect();
    const cell = e.currentTarget.getBoundingClientRect();
    if (!strip) return;
    setHover({
      id: scene.id,
      label: `${scene.number} ${plainInline(deskTitle(scene, locale))}`,
      // Kept inside the strip so the label never runs off either end.
      left: Math.min(strip.width - 140, Math.max(140, cell.left + cell.width / 2 - strip.left)),
    });
  };
  return (
    <div className={styles.strip} ref={stripRef} onMouseLeave={() => setHover(null)}>
      <div className={styles.segments}>
        {pace.chapters.map((c, run) => {
          if (c.slideCount === 0) return null;
          const title = tr(presentation.chapters.find((ch) => ch.id === c.id)?.title ?? { en: c.id }, locale);
          const own = runs[run] ?? [];
          return (
            <div
              key={`${c.id}-${c.plannedStartSec}`}
              className={`${styles.segment} ${styles[`seg_${c.status}`]}`}
              // Width strictly proportional to the slide count: the current part's title never widens its segment.
              style={{ flex: `${c.slideCount} 1 0px` }}
            >
              <span className={styles.segLabel}>
                <span className={chrome.mono}>{c.id}</span> {c.status === "current" ? title : ""}
              </span>
              <span className={styles.cells}>
                {own.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    data-slide-cell
                    className={`${styles.cell} ${hover?.id === sc.id ? styles.cellHover : ""}`}
                    aria-label={`${sc.number} ${plainInline(deskTitle(sc, locale))}`}
                    onMouseEnter={(e) => show(e, sc)}
                    onFocus={(e) => show(e as unknown as React.MouseEvent<HTMLButtonElement>, sc)}
                    onClick={() => onGo(sc.id)}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {pace.slideTotal > 0 ? (
        <>
          {/* The current slide's cell, centred; the clock marker moves through the cells as time passes. */}
          <span className={styles.markPos} style={{ left: at(pace.slideIndex + 0.5) }} title={t("scene")} />
          <span className={styles.markClock} style={{ left: at(pace.clockSlides) }} title={t("timer")} />
        </>
      ) : null}
      {hover ? (
        <span className={styles.stripTip} style={{ left: hover.left }} role="tooltip">
          {hover.label}
        </span>
      ) : null}
    </div>
  );
}
