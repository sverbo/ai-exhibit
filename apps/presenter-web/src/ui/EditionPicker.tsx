import { allEditions } from "../talk/presentation.ts";
import { useUi } from "../i18n.ts";
import chrome from "./chrome.module.css";

/** Select over every edition of every presentation (including the demo). */
export function EditionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t, locale } = useUi();
  return (
    <select className={chrome.select} value={value} aria-label={t("edition")} onChange={(e) => onChange(e.target.value)}>
      {allEditions().map(({ presentation, edition }) => (
        <option key={edition.id} value={edition.id}>
          {edition.title[locale]}
          {presentation.id === "demo" ? "" : ` (${edition.id})`}
        </option>
      ))}
    </select>
  );
}

/** Keeps `?edition=` in the URL in sync with a picker. */
export function setEditionParam(id: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("edition", id);
  window.history.replaceState(null, "", url);
}
