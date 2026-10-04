import { useMemo } from "react";
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { resolveGlossaryUrl, qrPath } from "./glossaryUrl.ts";
import styles from "./GlossaryQr.module.css";

/**
 * The audience glossary as a large QR code with its caption (agenda, holding
 * slide). Generated locally; renders nothing when no address is known.
 */
export function GlossaryQr({
  glossaryUrl,
  locale,
  label,
  hint,
  width = 440,
  className,
}: {
  glossaryUrl: string | null;
  locale: Locale;
  label: L10n;
  hint: L10n;
  /** Stage pixels. */
  width?: number;
  className?: string;
}) {
  const origin = typeof window === "undefined" ? null : window.location.origin;
  const url = resolveGlossaryUrl(glossaryUrl, origin);
  const qr = useMemo(() => (url ? qrPath(url) : null), [url]);
  if (!qr || !url) return null;
  return (
    <figure className={`${styles.qr} ${className ?? ""}`} style={{ width }}>
      <div className={styles.code}>
        <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={tr(label, locale)} shapeRendering="crispEdges">
          <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} className={styles.light} />
          <path d={qr.d} className={styles.dark} />
        </svg>
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.label}>{tr(label, locale)}</span>
        <span className={styles.hint}>{tr(hint, locale)}</span>
        <span className={styles.url}>{url.replace(/^https?:\/\//, "")}</span>
      </figcaption>
    </figure>
  );
}
