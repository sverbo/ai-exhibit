import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, PresentationDefinition, SceneDefinition } from "@ai-exhibit/presentation-core";
import { useUi } from "../i18n.ts";
import styles from "./GotoPalette.module.css";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Filters scenes by number prefix ("3.2"), ID or title words. */
export function filterScenes(scenes: SceneDefinition[], query: string, locale: Locale): SceneDefinition[] {
  const q = normalize(query.trim());
  if (!q) return scenes;
  return scenes.filter((s) => {
    if (s.number.startsWith(q) || s.id.includes(q)) return true;
    const title = normalize(`${s.title[locale]} ${s.title.en}`);
    return q.split(/\s+/).every((w) => title.includes(w));
  });
}

/** G: jump to any scene of the edition. */
export function GotoPalette({
  scenes,
  presentation,
  locale,
  currentId,
  onGo,
  onClose,
}: {
  scenes: SceneDefinition[];
  presentation: PresentationDefinition;
  locale: Locale;
  currentId: string | undefined;
  onGo: (sceneId: string) => void;
  onClose: () => void;
}) {
  const { t } = useUi();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const matches = useMemo(() => filterScenes(scenes, query, locale), [scenes, query, locale]);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const i = query ? 0 : Math.max(0, matches.findIndex((s) => s.id === currentId));
    setActive(i);
  }, [query, matches, currentId]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const chapterTitle = (id: string) => presentation.chapters.find((c) => c.id === id)?.title[locale] ?? id;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.palette} role="dialog" aria-label={t("gotoScene")} onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          className={styles.input}
          value={query}
          placeholder={t("gotoPlaceholder")}
          aria-label={t("gotoScene")}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(matches.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const target = matches[active];
              if (target) onGo(target.id);
            }
          }}
        />
        {matches.length === 0 ? <p className={styles.empty}>{t("noMatch")}</p> : null}
        <ol ref={list} className={styles.list}>
          {matches.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                data-index={i}
                className={`${styles.item} ${i === active ? styles.active : ""} ${s.id === currentId ? styles.current : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => onGo(s.id)}
              >
                <span className={styles.number}>{s.number}</span>
                <span className={styles.title}>{s.title[locale]}</span>
                <span className={styles.chapter}>{chapterTitle(s.chapter)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
