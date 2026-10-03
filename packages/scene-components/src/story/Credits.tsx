import { useState } from "react";
import type { Locale } from "@ai-exhibit/presentation-core";
import { getStoryImage, type ImageCredit } from "@ai-exhibit/content/assets/media/story/credits.ts";
import type { SceneRole } from "../contract.ts";
import { stopShellKeys } from "../evidence/shared.ts";
import styles from "./Credits.module.css";

const COPY = {
  photos: { en: "Photos", fr: "Photos" },
  via: { en: "via Wikimedia Commons", fr: "via Wikimedia Commons" },
  trademarks: { en: "Logos are trademarks of their owners.", fr: "Les logos sont des marques de leurs propriétaires." },
  open: { en: "Image credits", fr: "Crédits des images" },
  close: { en: "Close", fr: "Fermer" },
  caution: { en: "Check license", fr: "Licence à vérifier" },
} as const;

export function creditsFor(imageIds: string[]): ImageCredit[] {
  const seen = new Set<string>();
  const out: ImageCredit[] = [];
  for (const id of imageIds) {
    const image = getStoryImage(id);
    if (image && !seen.has(id)) {
      seen.add(id);
      out.push(image);
    }
  }
  return out;
}

/** One discreet line for the projector: photo authors and licenses, then the trademark note. */
export function creditLine(images: ImageCredit[], locale: Locale): string {
  const photos = images.filter((i) => i.kind === "portrait");
  const parts: string[] = [];
  if (photos.length) {
    parts.push(`${COPY.photos[locale]}: ${photos.map((p) => `${p.author} (${p.license})`).join(", ")}, ${COPY.via[locale]}.`);
  }
  if (images.some((i) => i.kind === "logo")) parts.push(COPY.trademarks[locale]);
  return parts.join(" ");
}

/**
 * Projector and preview: a small credit line. Controller: the same line plus a
 * button that opens the full attribution (author, license, links, edits).
 */
export function Credits({ imageIds, role, locale }: { imageIds: string[]; role: SceneRole; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const images = creditsFor(imageIds);
  if (!images.length) return null;
  const line = creditLine(images, locale);
  return (
    <div className={styles.root}>
      <p className={styles.line}>{line}</p>
      {role === "controller" ? (
        <button type="button" className={styles.toggle} aria-expanded={open} onClick={() => setOpen(!open)} onKeyDown={stopShellKeys}>
          {open ? COPY.close[locale] : COPY.open[locale]}
        </button>
      ) : null}
      {role === "controller" && open ? (
        <ul className={styles.panel} aria-label={COPY.open[locale]}>
          {images.map((image) => (
            <li key={image.id} className={styles.item}>
              <a href={image.sourcePage} target="_blank" rel="noreferrer">
                {image.subject}
              </a>
              <span className={styles.meta}>
                {image.author},{" "}
                <a href={image.licenseUrl} target="_blank" rel="noreferrer">
                  {image.license}
                </a>
              </span>
              {image.notes ? <span className={styles.note}>{image.notes}</span> : null}
              {image.caution ? (
                <span className={styles.caution}>
                  <span aria-hidden="true">⚠</span> {COPY.caution[locale]}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
