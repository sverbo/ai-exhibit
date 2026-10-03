import type { CSSProperties } from "react";
import { tr, type Locale } from "@ai-exhibit/presentation-core";
import { getStoryImage } from "@ai-exhibit/content/assets/media/story/credits.ts";
import { COUNTRY_NAMES, flagImageId, HEADQUARTERS } from "./countries.ts";
import styles from "./Flags.module.css";

/**
 * Small full-colour flags for a company's headquarters country (bundled SVGs,
 * not emoji, which Windows does not render as flags). Dimming is left to the
 * parent so a flag fades with its logo.
 */
export function Flags({ actorId, locale, className, style }: { actorId: string; locale: Locale; className?: string; style?: CSSProperties }) {
  const hq = HEADQUARTERS[actorId];
  if (!hq) return null;
  const names = hq.countries.map((c) => tr(COUNTRY_NAMES[c], locale)).join(", ");
  return (
    <span className={`${styles.flags} ${className ?? ""}`} style={style} role="img" aria-label={names} title={names}>
      {hq.countries.map((code) => {
        const image = getStoryImage(flagImageId(code));
        return image ? <img key={code} className={styles.flag} src={image.url} alt="" draggable={false} /> : null;
      })}
    </span>
  );
}
