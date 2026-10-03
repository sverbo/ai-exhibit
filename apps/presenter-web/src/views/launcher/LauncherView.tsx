import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@ai-exhibit/presentation-core";
import {
  DEFAULT_EDITION,
  defaultTalkLocale,
  preferredTalkLocale,
  rememberTalkLocale,
  resolveTalk,
} from "../../talk/presentation.ts";
import { cloudHealthText, lanOrigin, useCloudHealth, useRuntime } from "../../talk/runtime.ts";
import chrome from "../../ui/chrome.module.css";
import { LocalePicker } from "../../ui/LocalePicker.tsx";
import { QrCode } from "../../ui/QrCode.tsx";
import { ThemeToggle } from "../../ui/ThemeToggle.tsx";
import setupPrompt from "../../../../../docs/setup-prompt.md?raw";
import { exhibits } from "./exhibits.ts";
import styles from "./LauncherView.module.css";

function initialLocale(): Locale {
  return preferredTalkLocale() ?? defaultTalkLocale();
}
/** The author's contact and repository, shown in "About this talk". */
const SIGNAL = "sverbo.39";
const REPO_URL = "https://github.com/sverbo/ai-exhibit";

/**
 * Home page, reduced to what the presenter uses on the day: the presenter
 * view, the projector window and the audience's glossary QR code, plus one
 * readiness line. English only on this page (product decision: the
 * presenter works in English), apart from the talk's language picker: it sets
 * the language the next talk session starts in; during a talk, the presenter's
 * switch (or the projector's corner) changes it for every window. Links carry
 * no language: one address per view.
 */
export default function LauncherView() {
  const talk = useMemo(() => resolveTalk(DEFAULT_EDITION), []);
  const [lang, setLang] = useState(initialLocale);
  const chooseLang = (l: Locale) => {
    setLang(l);
    rememberTalkLocale(l);
  };
  const runtime = useRuntime(5000);
  const cloud = cloudHealthText(useCloudHealth());

  useEffect(() => {
    document.title = "ai-exhibit";
  }, []);

  // Under pnpm dev the runtime knows the LAN address phones use for the glossary.
  const origin = lanOrigin(runtime.network);
  // The glossary has its own language switch: one address, one QR code, whatever the talk's language.
  const glossaryUrl = origin ? `${origin}/glossary` : null;

  return (
    <div className={styles.launcher} lang="en">
      <header className={styles.header}>
        <p className={styles.brand}>ai-exhibit</p>
        <h1 className={styles.title}>{talk.presentation.title.en}</h1>
        <div className={styles.theme}>
          <ThemeToggle hint={false} locale="en" />
        </div>
      </header>

      <div className={styles.language}>
        <span className={styles.languageLabel} id="talk-language">
          Language of the talk
        </span>
        <LocalePicker value={lang} onChange={chooseLang} />
      </div>

      <main className={styles.entries}>
        <a
          className={`${styles.entry} ${styles.primary}`}
          href="/presenter"
        >
          <span className={styles.entryTitle}>Presenter</span>
          <span className={styles.entryHint}>Notes, timer and controls.</span>
        </a>

        <a className={styles.entry} href="/projector">
          <span className={styles.entryTitle}>Projector</span>
          <span className={styles.entryHint}>
            Works alone: put it full screen on the projector; arrows or a clicker advance it. Open the Presenter too for notes.
          </span>
        </a>

        <section className={`${styles.entry} ${styles.remote}`} aria-labelledby="glossary-title">
          <h2 id="glossary-title" className={styles.entryTitle}>
            Glossary and resources
          </h2>
          {glossaryUrl ? (
            <div className={styles.qr}>
              <QrCode value={glossaryUrl} size={156} label="Glossary and resources" />
              <span className={styles.entryHint}>
                A page for everyone in the room: every term of the talk explained in plain words, and links to go further. They
                open it by scanning this code, also shown on the agenda slide. <a href="/glossary">Open it</a>
              </span>
            </div>
          ) : (
            <p className={styles.entryHint}>
              {runtime.reachable && !runtime.network?.addresses.length
                ? "No network address: join a Wi-Fi network or a phone hotspot."
                : "Open this page through its network address to show a code phones can reach."}{" "}
              <a href="/glossary">Open it</a>
            </p>
          )}
        </section>
      </main>

      <section className={styles.howto} aria-label="How it works">
        <p>
          <b>The Projector works alone:</b> arrows or a clicker advance it, scenes are interactive, and N shows your notes
          (the room sees them too).
        </p>
        <p>
          <b>Open the Presenter as well</b> for notes, timer and controls, at any time: the two stay linked, and either
          window takes the arrow keys.
        </p>
        <p>
          <b>Same browser profile:</b> separate windows are fine, even on two screens, but not a private window.
        </p>
      </section>

      <p className={styles.ready} role="status">
        <Dot state={cloud.state} />
        {cloud.text}
      </p>

      <section className={styles.about} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.aboutTitle}>
          About this talk
        </h2>
        <p>
          An introduction to today's AI for a non-technical audience with a general knowledge of new technologies. About two
          hours, and intense. It is meant to evolve.
        </p>
        <p>
          <b>Feedback, corrections or a new language:</b> contact me on Signal, <b>{SIGNAL}</b>, or open a pull request on
          GitHub.
        </p>
        <p>
          <b>Make your own version</b> (another audience, length or angle): paste this prompt into Claude Code <CopyPrompt />: it checks your tools, forks{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {REPO_URL.replace("https://", "")}
          </a>
          , installs it and guides you to host it. Live models need a Hugging Face token in <code>.env</code>, the only
          setting; without one, every demo runs on recorded simulation. Run it locally with <code>pnpm dev</code>, or host it
          (easy on Vercel). Big changes such as a new language use many tokens: a generous Claude plan helps. If you host a
          version, send me the link and a short description (for example: kid friendly, 60 minutes) and I will add it to the
          list below.
        </p>
        <p>The Hugging Face token behind this site is mine, offered for free: please keep usage light.</p>
      </section>

      <section className={styles.about} aria-labelledby="exhibits-title">
        <h2 id="exhibits-title" className={styles.aboutTitle}>
          Exhibits
        </h2>
        <ul className={styles.exhibits}>
          {exhibits.map((x) => (
            <li key={x.url}>
              <a href={x.url} target="_blank" rel="noopener noreferrer">
                {x.url.replace("https://", "")}
              </a>{" "}
              <b>{x.title}</b>. {x.description} <span className={styles.languages}>{x.languages.join(", ")}</span>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}

/** Copies the setup prompt (docs/setup-prompt.md, the same text the README links to). */
function CopyPrompt() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setupPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(`${REPO_URL}/blob/main/docs/setup-prompt.md`, "_blank", "noopener,noreferrer");
    }
  };
  return (
    <button type="button" className={chrome.btn} onClick={() => void copy()}>
      {copied ? "Copied" : "Copy the setup prompt"}
    </button>
  );
}

function Dot({ state }: { state: "ok" | "warn" | "bad" | "none" }) {
  const tone = state === "ok" ? chrome.dotOk : state === "warn" ? chrome.dotWarn : state === "bad" ? chrome.dotBad : "";
  return <span className={`${chrome.dot} ${tone}`} aria-hidden="true" />;
}
