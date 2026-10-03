import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, PresentationDefinition, SceneDefinition } from "@ai-exhibit/presentation-core";
import { useUi } from "../i18n.ts";
import styles from "./GotoPalette.module.css";
import { filterScenes } from "./sceneSearch.ts";

export { filterScenes };

/**
 * G: jump to any scene of the edition, by number, code or title. Hidden
 * scenes (personal config) stay listed, greyed: jumping to one is deliberate.
 */
export function GotoPalette({
  scenes,
  presentation,
  locale,
  currentId,
  hiddenIds,
  onGo,
  onClose,
}: {
  scenes: SceneDefinition[];
  presentation: PresentationDefinition;
  locale: Locale;
  currentId: string | undefined;
  hiddenIds?: Set<string>;
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
                className={`${styles.item} ${i === active ? styles.active : ""} ${s.id === currentId ? styles.current : ""} ${hiddenIds?.has(s.id) ? styles.hidden : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => onGo(s.id)}
              >
                <span className={styles.number}>{s.number}</span>
                <span className={styles.title}>
                  {s.title[locale]}
                  {hiddenIds?.has(s.id) ? <span className={styles.hiddenTag}>{t("configHidden")}</span> : null}
                </span>
                <span className={styles.chapter}>{chapterTitle(s.chapter)}</span>
                <span className={styles.code}>{s.code}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
