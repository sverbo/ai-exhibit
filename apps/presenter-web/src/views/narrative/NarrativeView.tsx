/**
 * The talk's narrative: the general flow of the talk, slide by slide, as a
 * text to read (content/script/narrative.<locale>.md). Not the full script:
 * the text's own first paragraph says so. English and French, each
 * downloadable as Markdown; `?lang=` picks one.
 */
import { useState } from "react";
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import narrativeEn from "../../../../../content/script/narrative.en.md?raw";
import narrativeFr from "../../../../../content/script/narrative.fr.md?raw";
import { LocalePicker } from "../../ui/LocalePicker.tsx";
import { Markdown } from "../../ui/Markdown.tsx";
import chrome from "../../ui/chrome.module.css";
import styles from "./NarrativeView.module.css";

const TEXTS: L10n = { en: narrativeEn, fr: narrativeFr };
const LOCALES: Locale[] = ["en", "fr"];

const COPY = {
  home: { en: "← Home", fr: "← Accueil" },
  download: { en: "Download (Markdown)", fr: "Télécharger (Markdown)" },
  language: { en: "Language", fr: "Langue" },
};

function initialLocale(): Locale {
  const asked = new URLSearchParams(window.location.search).get("lang");
  return LOCALES.find((l) => l === asked) ?? "en";
}

function download(text: string, locale: Locale) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-exhibit-narrative.${locale}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function NarrativeView() {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const text = tr(TEXTS, locale);
  const choose = (l: Locale) => {
    setLocale(l);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState(null, "", url);
  };
  return (
    <div className={styles.page} lang={locale}>
      <nav className={styles.bar}>
        <a className={chrome.btn} href="/">
          {tr(COPY.home, locale)}
        </a>
        <span className={styles.barEnd}>
          <LocalePicker value={locale} onChange={choose} locales={LOCALES} label={tr(COPY.language, locale)} compact />
          <button type="button" className={chrome.btn} onClick={() => download(text, locale)}>
            {tr(COPY.download, locale)}
          </button>
        </span>
      </nav>
      <article>
        <Markdown className={styles.text} text={text} />
      </article>
    </div>
  );
}
