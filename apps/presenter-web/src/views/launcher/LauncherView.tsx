import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@ai-exhibit/presentation-core";
import {
  DEFAULT_EDITION,
  defaultTalkLocale,
  preferredTalkLocale,
  rememberTalkLocale,
  resolveTalk,
} from "../../talk/presentation.ts";
import { LinkedInIcon, NeuronMark } from "@ai-exhibit/scene-components";
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
        <p className={styles.brand}>
          <NeuronMark size={56} className={styles.mark} />
          ai-exhibit
        </p>
        <h1 className={styles.title}>{talk.presentation.title.en}</h1>
        <p className={styles.welcome}>
          Giving this talk? I would love to hear how it went: which version, how many people, what worked and what did not.
          Don't hesitate to message me on Signal, <b>{SIGNAL}</b>. Let's spread the word: you don't need to be an expert to help
          the general public understand what is happening.
        </p>
        <p className={styles.caveat}>
          <b>A work in progress, and it always will be.</b> Some statements may be wrong, or put too firmly. Don't hesitate to
          open a pull request on{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{" "}
          or to send me a message on Signal, <b>{SIGNAL}</b>: I am open to any feedback. Much of this content was made with
          AI, and I do not hide it; the storyline and the ideas for the animations are my own.
        </p>
        <div className={styles.theme}>
          <ThemeToggle hint={false} locale="en" />
        </div>
      </header>

      <div className={styles.language}>
        <a className={chrome.btn} href={`/narrative?lang=${lang}`}>
          Narrative
        </a>
        <span className={styles.settingHint}>The talk's general flow as a text to read or download (English or French).</span>
      </div>

      <div className={styles.language}>
        <a className={chrome.btn} href="/presenter?config">
          Config
        </a>
        <span className={styles.settingHint}>Reorder, hide or annotate scenes for your own talk (saved in this browser).</span>
        <span className={styles.sep} aria-hidden="true" />
        <span className={styles.languageLabel} id="talk-language">
          Language of the talk
        </span>
        <LocalePicker value={lang} onChange={chooseLang} />
      </div>

      <main className={styles.entries}>
        <a className={`${styles.entry} ${styles.primary}`} href="/projector">
          <span className={styles.entryTitle}>Projector</span>
          <span className={styles.entryHint}>
            For the main screen and the audience. Put it full screen; the arrows or a clicker advance it. It is all you need.
          </span>
        </a>

        <a className={styles.entry} href="/presenter">
          <span className={styles.entryTitle}>Presenter (optional)</span>
          <span className={styles.entryHint}>
            For you, on your own screen: notes, timer and full control. Open it whenever you like; it stays linked to the
            Projector.
          </span>
        </a>

        <section className={`${styles.entry} ${styles.remote}`} aria-labelledby="glossary-title">
          <h2 id="glossary-title" className={styles.entryTitle}>
            For the room
          </h2>
          {glossaryUrl ? (
            <div className={styles.qr}>
              <QrCode value={glossaryUrl} size={120} label="For the room: glossary, resources and demos to try" />
              <span className={styles.entryHint}>
                Glossary, resources and demos to try on their phone. They scan this code, also on the agenda slide.{" "}
                <a href="/glossary">Open it</a>
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

      <p className={styles.howto}>
        <b>Good to know:</b> the Projector works on its own. Open the Presenter as well and the two are linked and in sync:
        either window advances the talk, with the arrows or a clicker. Use the same browser profile (not a private window),
        even on two screens.
      </p>

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
          GitHub. To add your own notes, move or hide scenes, no need for any of that: use <b>Config</b> above.
        </p>
        <p className={styles.copyPrompt}>
          <CopyPrompt />
        </p>
        <p>
          <b>Contribute, or make your own version:</b> paste this prompt into Claude Code (button above). It first asks what you
          want to do. A correction, feedback or a new language belongs in the original talk: it opens a pull request on{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            {REPO_URL.replace("https://", "")}
          </a>{" "}
          for you. Another audience, length or angle is your own version: it forks the talk, installs it and guides you to host
          it. Live models need a Hugging Face token in <code>.env</code>, the only
          required setting; without one, every demo runs on recorded simulation. Run it locally with <code>pnpm dev</code>, or host it
          (easy on Vercel). Big changes such as a new language use many tokens: a generous Claude plan helps. If you host a
          version, send me the link and a short description (for example: kid friendly, 60 minutes) and I will add it to the
          list below. <b>Hosting or Hugging Face credits a hassle?</b> I am happy to host your fork myself and cover the credits: just
          ask on Signal.
        </p>
        <p>
          <b>Gave the talk?</b> Tell me on Signal, <b>{SIGNAL}</b>: which version, how it went, and roughly how many people
          were there. It helps keep a count of how many people this talk has reached.
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
              <b>{x.title}</b>
              {x.linkedin && (
                <a
                  className={styles.linkedin}
                  href={x.linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${x.linkedin.name} on LinkedIn`}
                  title={`${x.linkedin.name} on LinkedIn`}
                >
                  <LinkedInIcon className={styles.linkedinIcon} />
                </a>
              )}
              . {x.description} <span className={styles.languages}>{x.languages.join(", ")}</span>
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
