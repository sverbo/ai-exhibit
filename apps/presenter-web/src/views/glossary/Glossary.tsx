import { useEffect, useMemo, useRef, useState } from "react";
import { LOCALES, LOCALE_INFO, parseLocale, tr, type Locale } from "@ai-exhibit/presentation-core";
import { glossary, resources, type GlossaryEntry } from "@ai-exhibit/content/glossary";
import { currentStampedTheme } from "../../theme.ts";
import { guessLocale } from "./locale.ts";
import { letterOf, searchGlossary, termId } from "./search.ts";
import styles from "./Glossary.module.css";

const COPY = {
  glossary: { en: "Glossary", fr: "Glossaire" },
  resources: { en: "Resources", fr: "Ressources" },
  intro: {
    en: "The words of today's talk, in plain language. Tap a word to read it.",
    fr: "Les mots de la conférence, en langage simple. Touchez un mot pour le lire.",
  },
  search: { en: "Search a word", fr: "Chercher un mot" },
  clear: { en: "Clear", fr: "Effacer" },
  noMatch: { en: "No word matches. Try a shorter search.", fr: "Aucun mot ne correspond. Essayez une recherche plus courte." },
  seeAlso: { en: "See also", fr: "Voir aussi" },
  termsNote: { en: "Terms stay in English, as you hear them on stage.", fr: "Les termes restent en anglais, comme sur scène." },
  resourcesIntro: { en: "To go further after the talk.", fr: "Pour aller plus loin après la conférence." },
  online: { en: "Online:", fr: "En ligne :" },
  language: { en: "Language", fr: "Langue" },
  sections: { en: "Sections", fr: "Rubriques" },
} satisfies Record<string, Record<Locale, string>>;

const LOCALE_KEY = "ai-exhibit:glossary-locale";

/** `?lang=` first (the QR code carries the talk's language), then this phone's last choice. */
function readLocale(fallback?: Locale): Locale {
  const asked = typeof window === "undefined" ? null : parseLocale(new URLSearchParams(window.location.search).get("lang"));
  if (asked) return asked;
  try {
    const v = parseLocale(localStorage.getItem(LOCALE_KEY));
    if (v) return v;
  } catch {
    // storage unavailable
  }
  return fallback ?? guessLocale(typeof navigator === "undefined" ? [] : navigator.languages);
}

/**
 * Audience phones follow their own light/dark preference unless this browser
 * already chose a theme for the talk.
 */
function useSystemTheme(): void {
  useEffect(() => {
    if (currentStampedTheme().at > 0 || typeof matchMedia === "undefined") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = query.matches ? "dark" : "light";
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
}

/**
 * The audience's phone companion: every term of the talk, searchable, plus a
 * few resources. Works offline (only the resource links need the internet)
 * and needs no session. Used by /glossary.
 */
export function Glossary({ initialLocale }: { initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => readLocale(initialLocale));
  const [tab, setTab] = useState<"glossary" | "resources">("glossary");
  const [query, setQuery] = useState("");
  const [openTerms, setOpenTerms] = useState<Set<string>>(() => new Set());
  const pendingScroll = useRef<string | null>(null);
  useSystemTheme();

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {
      // storage unavailable
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const hits = useMemo(() => searchGlossary(glossary, query, locale), [query, locale]);
  const searching = query.trim().length > 0;
  const groups = useMemo(() => {
    if (searching) return [{ letter: "", entries: hits }];
    const out: { letter: string; entries: GlossaryEntry[] }[] = [];
    for (const e of hits) {
      const letter = letterOf(e.term);
      const last = out[out.length - 1];
      if (last && last.letter === letter) last.entries.push(e);
      else out.push({ letter, entries: [e] });
    }
    return out;
  }, [hits, searching]);

  const toggle = (term: string) =>
    setOpenTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });

  const goTo = (term: string) => {
    setQuery("");
    setOpenTerms((prev) => new Set(prev).add(term));
    pendingScroll.current = term;
  };

  useEffect(() => {
    const term = pendingScroll.current;
    if (!term) return;
    pendingScroll.current = null;
    const el = document.getElementById(termId(term));
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
    el?.querySelector("button")?.focus({ preventScroll: true });
  });

  return (
    <div className={styles.glossary} lang={locale}>
      <header className={styles.top}>
        <nav className={styles.tabs} aria-label={tr(COPY.sections, locale)}>
          {(["glossary", "resources"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`${styles.tab} ${tab === id ? styles.tabOn : ""}`}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {tr(COPY[id], locale)}
            </button>
          ))}
        </nav>
        <span className={styles.lang} role="radiogroup" aria-label={tr(COPY.language, locale)}>
          {LOCALES.map((l) => (
            <button key={l} type="button" role="radio" lang={l} title={LOCALE_INFO[l].name} aria-checked={locale === l} className={`${styles.langBtn} ${locale === l ? styles.langOn : ""}`} onClick={() => setLocale(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </span>
      </header>

      {tab === "glossary" ? (
        <>
          <div className={styles.searchBar}>
            <input
              className={styles.search}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              placeholder={tr(COPY.search, locale)}
              aria-label={tr(COPY.search, locale)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {!searching ? <p className={styles.intro}>{tr(COPY.intro, locale)}</p> : null}
          {hits.length === 0 ? <p className={styles.empty}>{tr(COPY.noMatch, locale)}</p> : null}
          {groups.map((g) => (
            <section key={g.letter || "hits"} className={styles.group} aria-label={g.letter || undefined}>
              {g.letter ? (
                <h2 className={styles.letter} aria-hidden="true">
                  {g.letter}
                </h2>
              ) : null}
              <ul className={styles.list}>
                {g.entries.map((e) => {
                  const open = openTerms.has(e.term) || (searching && hits.length <= 3);
                  return (
                    <li key={e.term} id={termId(e.term)} className={`${styles.entry} ${open ? styles.open : ""}`}>
                      <button type="button" className={styles.term} aria-expanded={open} onClick={() => toggle(e.term)}>
                        <span>{e.term}</span>
                        <span className={styles.chevron} aria-hidden="true" />
                      </button>
                      {open ? (
                        <div className={styles.body}>
                          <p className={styles.explanation}>{tr(e.explanation, locale)}</p>
                          {e.seeAlso?.length ? (
                            <p className={styles.seeAlso}>
                              <span className={styles.seeAlsoLabel}>{tr(COPY.seeAlso, locale)}</span>
                              {e.seeAlso.map((s) => (
                                <button key={s} type="button" className={styles.chip} onClick={() => goTo(s)}>
                                  {s}
                                </button>
                              ))}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <p className={styles.note}>{tr(COPY.termsNote, locale)}</p>
        </>
      ) : (
        <section className={styles.resources}>
          <p className={styles.intro}>{tr(COPY.resourcesIntro, locale)}</p>
          <ul className={styles.list}>
            {resources.map((r) => (
              <li key={r.url}>
                <a className={styles.resource} href={r.url} target="_blank" rel="noopener noreferrer">
                  <span className={styles.resourceTitle}>{r.title}</span>
                  <span className={styles.resourceBy}>{tr(r.by, locale)}</span>
                  <span className={styles.explanation}>{tr(r.description, locale)}</span>
                  <span className={styles.online}>
                    {tr(COPY.online, locale)} {new URL(r.url).hostname.replace(/^www\./, "")}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
