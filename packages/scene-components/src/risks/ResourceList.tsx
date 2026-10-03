import { useMemo } from "react";
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { resources, type ResourceEntry } from "@ai-exhibit/content/glossary";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { resolveGlossaryUrl, qrPath } from "../capabilities/agenda/glossaryUrl.ts";
import qrStyles from "../capabilities/agenda/Agenda.module.css";
import styles from "./ResourceList.module.css";

export interface ResourceListProps {
  heading?: L10n;
}

const KIND: Record<ResourceEntry["kind"], L10n> = {
  video: { en: "Video" },
  article: { en: "Article" },
  book: { en: "Book" },
  website: { en: "Website" },
  course: { en: "Course" },
  petition: { en: "Petition" },
};

const COPY = {
  heading: { en: "Resources" },
  sub: { en: "Pointers to explore, not endorsements." },
  qrLabel: { en: "These links on your phone" },
  qrHint: { en: "In the glossary, under Resources." },
} satisfies Record<string, L10n>;

/**
 * ResourceList {heading?}: the further-reading list of the audience glossary,
 * read from the single source `resources` (content/glossary), with the same
 * glossary QR code as the agenda slide. Static: no steps, no state. Titles
 * are links (new tab) on the live screens, so the presenter can open one from
 * the projector; the preview thumbnail keeps plain text.
 */
export function ResourceList({ props, ctx }: SceneComponentProps<ResourceListProps>) {
  const { locale } = ctx;
  const origin = typeof window === "undefined" ? null : window.location.origin;
  const url = resolveGlossaryUrl(ctx.glossaryUrl, origin);
  const qr = useMemo(() => (url ? qrPath(url) : null), [url]);

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <header className={styles.head}>
          <h2 className={styles.heading}><Rich text={tr(props.heading ?? COPY.heading, locale)} /></h2>
          <p className={styles.sub}>{tr(COPY.sub, locale)}</p>
        </header>
        <ul className={styles.list}>
          {resources.map((r) => (
            <li key={r.url} className={styles.entry} data-kind={r.kind}>
              <span className={styles.kind}>{tr(KIND[r.kind], locale)}</span>
              {ctx.role === "preview" ? (
                <span className={styles.title}>{r.title}</span>
              ) : (
                <a className={`${styles.title} ${styles.link}`} href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
              )}
              <span className={styles.url}>{r.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
              <span className={styles.by}>
                <Rich text={tr(r.by, locale)} />
              </span>
              <span className={styles.description}>
                <Rich text={tr(r.description, locale)} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      {qr && url ? (
        <figure className={styles.qr}>
          <div className={qrStyles.code}>
            <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={tr(COPY.qrLabel, locale)} shapeRendering="crispEdges">
              <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} className={qrStyles.light} />
              <path d={qr.d} className={qrStyles.dark} />
            </svg>
          </div>
          <figcaption className={qrStyles.caption}>
            <span className={qrStyles.label}>{tr(COPY.qrLabel, locale)}</span>
            <span className={qrStyles.hint}>{tr(COPY.qrHint, locale)}</span>
            <span className={qrStyles.url}>{url.replace(/^https?:\/\//, "")}</span>
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
