/**
 * The talk's narrative: the general flow of the talk, slide by slide, as a
 * text to read (content/script/narrative.fr.md). Not the full script: the
 * technical explanations and the demos live in the slides and their notes.
 * Written in French for now; it can be downloaded as Markdown.
 */
import narrative from "../../../../../content/script/narrative.fr.md?raw";
import { Markdown } from "../../ui/Markdown.tsx";
import chrome from "../../ui/chrome.module.css";
import styles from "./NarrativeView.module.css";

const FILE_NAME = "ai-exhibit-narrative.fr.md";

function download() {
  const url = URL.createObjectURL(new Blob([narrative], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = FILE_NAME;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function NarrativeView() {
  return (
    <div className={styles.page}>
      <nav className={styles.bar}>
        <a className={chrome.btn} href="/">
          ← Home
        </a>
        <button type="button" className={chrome.btn} onClick={download}>
          Download (Markdown)
        </button>
      </nav>
      <p className={styles.note}>
        The general flow of the talk: its structure, its ideas and how they follow each other, slide by slide. It is not the
        full script: much of what is said on stage, especially the technical explanations and the demos, lives in the slides
        and their notes. Written in French for now.
      </p>
      <article lang="fr">
        <Markdown className={styles.text} text={narrative} />
      </article>
    </div>
  );
}
