import { useEffect, useMemo, useRef, useState } from "react";
import { plainText, tr, totalDurationSec, type SceneDefinition } from "@ai-exhibit/presentation-core";
import { formatDuration, formatMinutes } from "../../control/pace.ts";
import { useUi, type UiKey } from "../../i18n.ts";
import {
  EMPTY_CONFIG,
  NOTE_MAX,
  forgetUnknown,
  isEmptyConfig,
  moveScene,
  parseConfig,
  serializeConfig,
  setHidden,
  setNote,
  talkCodes,
  type ParseError,
} from "../../talk/personal.ts";
import type { Talk } from "../../talk/useTalk.ts";
import chrome from "../../ui/chrome.module.css";
import styles from "./ConfigPanel.module.css";

const IMPORT_ERRORS: Record<ParseError, UiKey> = {
  json: "configErrorJson",
  shape: "configErrorShape",
  schema: "configErrorSchema",
  talk: "configErrorTalk",
};

type Message = { tone: "ok" | "bad"; text: string } | null;

/**
 * The presenter's own version of the talk (docs/specs/2026-10-03-personal-config.md):
 * reorder (drag, buttons, Alt+arrows), hide, annotate, export, import, reset.
 * Every change is saved at once and applies to every window of this browser.
 */
export function ConfigPanel({ talk, onClose }: { talk: Talk; onClose: () => void }) {
  const { t } = useUi();
  const { personal, locale } = talk;
  const presentation = talk.talk.presentation;
  const edition = talk.talk.edition;
  const { config, sequence } = personal;
  const ordered = sequence.ordered;
  const knownCodes = useMemo(() => talkCodes(presentation), [presentation]);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ code: string; before: number | null } | null>(null);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const plannedSec = totalDurationSec(sequence.visible);
  const defaultSec = totalDurationSec(talk.talk.scenes);
  const [minM, maxM] = edition.targetMinutes;
  const inTarget = plannedSec >= minM * 60 && plannedSec <= maxM * 60;

  useEffect(() => dialog.current?.focus(), []);
  // Esc closes the panel wherever focus is (a note editor stops it first).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!focusCode) return;
    list.current?.querySelector<HTMLElement>(`[data-code="${focusCode}"] [data-handle]`)?.focus();
    setFocusCode(null);
  }, [focusCode, ordered]);

  const move = (code: string, to: number) => {
    personal.set(moveScene(config, ordered, code, to));
    setFocusCode(code);
  };

  const onImport = async (file: File) => {
    const text = await file.text().catch(() => "");
    const result = parseConfig(text, presentation.id, knownCodes);
    if (!result.ok) {
      setMessage({ tone: "bad", text: t(IMPORT_ERRORS[result.error]) });
      return;
    }
    personal.set(result.config);
    // Unknown codes are listed by the notice below, once.
    const parts = [t("configImported")];
    if (result.dropped) parts.push(`${result.dropped} ${t("configDropped")}.`);
    setMessage({ tone: "ok", text: parts.join(" ") });
  };

  const onExport = () => {
    const blob = new Blob([serializeConfig(config, presentation.id, ordered)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-exhibit-${presentation.id}-config.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const chapterTitle = (id: string) => plainText(tr(presentation.chapters.find((c) => c.id === id)?.title ?? { en: id }, locale));

  const dropAt = (before: number) => {
    if (!drag) return;
    const from = ordered.findIndex((s) => s.code === drag.code);
    move(drag.code, before > from ? before - 1 : before);
    setDrag(null);
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        ref={dialog}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-title"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <div className={styles.headText}>
            <h2 id="config-title" className={styles.title}>
              {t("configTitle")}
            </h2>
            <p className={styles.hint}>{t("configHint")}</p>
          </div>
          <div className={`${styles.total} ${inTarget ? "" : styles.off}`} aria-live="polite">
            <span className={chrome.label}>{t("configPlanned")}</span>
            <span className={`${chrome.mono} ${styles.totalValue}`}>{formatMinutes(plannedSec)}</span>
            <span className={styles.totalMeta}>
              {t("target")} {minM} {t("rangeTo")} {maxM} min · {sequence.visible.length}/{ordered.length} {t("configScenes")}
              {plannedSec !== defaultSec ? ` · ${t("configDefaultTotal")} ${formatMinutes(defaultSec)}` : ""}
            </span>
          </div>
          <button type="button" className={chrome.btn} onClick={onClose}>
            {t("close")} <kbd className={chrome.kbd}>Esc</kbd>
          </button>
        </header>

        <div className={styles.toolbar}>
          <button type="button" className={chrome.btn} onClick={onExport}>
            {t("configExport")}
          </button>
          <button type="button" className={chrome.btn} onClick={() => fileInput.current?.click()}>
            {t("configImport")}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onImport(file);
            }}
          />
          <span className={styles.grow} />
          <button
            type="button"
            className={`${chrome.btn} ${chrome.danger}`}
            disabled={isEmptyConfig(config)}
            onClick={() => {
              if (window.confirm(t("configConfirmReset"))) {
                personal.set(EMPTY_CONFIG);
                setMessage(null);
              }
            }}
          >
            {t("configReset")}
          </button>
        </div>

        {message ? (
          <p className={`${styles.message} ${message.tone === "bad" ? styles.messageBad : ""}`} role="status">
            {message.text}
          </p>
        ) : null}
        {sequence.unknownCodes.length ? (
          <p className={styles.unknown}>
            {t("configUnknown")}: <span className={chrome.mono}>{sequence.unknownCodes.join(", ")}</span>{" "}
            <button type="button" className={`${chrome.btn} ${styles.small}`} onClick={() => personal.set(forgetUnknown(config, knownCodes))}>
              {t("configForget")}
            </button>
          </p>
        ) : null}

        <ol ref={list} className={styles.list} onDragOver={(e) => drag && e.preventDefault()}>
          {ordered.map((scene, i) => {
            const prev = ordered[i - 1];
            const hidden = sequence.hiddenIds.has(scene.id);
            const note = config.notes[scene.code] ?? "";
            const noteOpen = openNote === scene.code;
            return (
              <SceneRow
                key={scene.id}
                scene={scene}
                index={i}
                count={ordered.length}
                chapterHeader={!prev || prev.chapter !== scene.chapter ? `${scene.chapter} · ${chapterTitle(scene.chapter)}` : null}
                current={scene.id === talk.scene?.id}
                hidden={hidden}
                note={note}
                noteOpen={noteOpen}
                dragging={drag?.code === scene.code}
                dropBefore={drag?.before === i ? "before" : drag?.before === i + 1 && i === ordered.length - 1 ? "after" : null}
                locale={locale}
                t={t}
                onMove={(to) => move(scene.code, to)}
                onHide={() => personal.set(setHidden(config, scene.code, !hidden))}
                onToggleNote={() => {
                  setOpenNote(noteOpen ? null : scene.code);
                  if (noteOpen) setFocusCode(scene.code);
                }}
                onNote={(text) => personal.set(setNote(config, scene.code, text))}
                onDragStart={() => setDrag({ code: scene.code, before: null })}
                onDragOverRow={(after) => drag && setDrag({ ...drag, before: after ? i + 1 : i })}
                onDrop={(after) => dropAt(after ? i + 1 : i)}
                onDragEnd={() => setDrag(null)}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function SceneRow({
  scene,
  index,
  count,
  chapterHeader,
  current,
  hidden,
  note,
  noteOpen,
  dragging,
  dropBefore,
  locale,
  t,
  onMove,
  onHide,
  onToggleNote,
  onNote,
  onDragStart,
  onDragOverRow,
  onDrop,
  onDragEnd,
}: {
  scene: SceneDefinition;
  index: number;
  count: number;
  chapterHeader: string | null;
  current: boolean;
  hidden: boolean;
  note: string;
  noteOpen: boolean;
  dragging: boolean;
  dropBefore: "before" | "after" | null;
  locale: "fr" | "en";
  t: (key: UiKey) => string;
  onMove: (to: number) => void;
  onHide: () => void;
  onToggleNote: () => void;
  onNote: (text: string) => void;
  onDragStart: () => void;
  onDragOverRow: (after: boolean) => void;
  onDrop: (after: boolean) => void;
  onDragEnd: () => void;
}) {
  const isAfter = (e: React.DragEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientY > r.top + r.height / 2;
  };
  return (
    <>
      {chapterHeader ? (
        <li className={styles.chapter} aria-hidden="true">
          {chapterHeader}
        </li>
      ) : null}
      <li
        data-code={scene.code}
        className={[
          styles.row,
          hidden ? styles.hidden : "",
          current ? styles.current : "",
          dragging ? styles.dragging : "",
          dropBefore === "before" ? styles.dropBefore : "",
          dropBefore === "after" ? styles.dropAfter : "",
        ].join(" ")}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", scene.code);
          onDragStart();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOverRow(isAfter(e));
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(isAfter(e));
        }}
        onDragEnd={onDragEnd}
        onKeyDown={(e) => {
          if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
          if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
          e.preventDefault();
          onMove(e.key === "ArrowUp" ? index - 1 : index + 1);
        }}
      >
        <div className={styles.main}>
          <button type="button" data-handle className={styles.handle} title={t("configDrag")} aria-label={`${t("configDrag")}: ${scene.number} ${plainText(tr(scene.title, locale))}`}>
            <span aria-hidden="true">⠿</span>
          </button>
          <span className={`${chrome.mono} ${styles.number}`}>{scene.number}</span>
          <span className={styles.sceneTitle}>
            {plainText(tr(scene.title, locale))}
            {hidden ? <span className={styles.tag}>{t("configHidden")}</span> : null}
            {note && !noteOpen ? <span className={styles.notePreview}>{note}</span> : null}
          </span>
          <span className={`${chrome.mono} ${styles.code}`} title="code">
            {scene.code}
          </span>
          <span className={`${chrome.mono} ${styles.duration}`}>{formatDuration(scene.durationSec)}</span>
          <span className={styles.actions}>
            <button type="button" className={`${chrome.btn} ${styles.small}`} onClick={() => onMove(index - 1)} disabled={index === 0} aria-label={t("configMoveUp")} title={t("configMoveUp")}>
              ↑
            </button>
            <button
              type="button"
              className={`${chrome.btn} ${styles.small}`}
              onClick={() => onMove(index + 1)}
              disabled={index === count - 1}
              aria-label={t("configMoveDown")}
              title={t("configMoveDown")}
            >
              ↓
            </button>
            <button type="button" className={`${chrome.btn} ${styles.small} ${hidden ? chrome.on : ""}`} onClick={onHide} aria-pressed={hidden}>
              {hidden ? t("configShow") : t("configHide")}
            </button>
            <button type="button" className={`${chrome.btn} ${styles.small} ${note ? chrome.on : ""}`} onClick={onToggleNote} aria-expanded={noteOpen}>
              {t("configNote")}
            </button>
          </span>
        </div>
        {noteOpen ? (
          <textarea
            className={styles.note}
            value={note}
            maxLength={NOTE_MAX}
            rows={3}
            autoFocus
            placeholder={t("configNotePlaceholder")}
            aria-label={`${t("configNote")}: ${scene.number} ${plainText(tr(scene.title, locale))}`}
            onChange={(e) => onNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onToggleNote();
              }
            }}
          />
        ) : null}
      </li>
    </>
  );
}
