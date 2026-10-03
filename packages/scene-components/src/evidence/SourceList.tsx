import { tr, type Locale, type SourceRecord } from "@ai-exhibit/presentation-core";
import type { SceneRole } from "../contract.ts";
import { formatIsoDate, shortSourceLabel } from "./shared.ts";
import styles from "./SourceList.module.css";

const COPY = {
  sources: { en: "Sources" },
  unverified: { en: "Needs verification" },
  missing: { en: "Unknown source ID" },
  retrieved: { en: "checked" },
} as const;

/**
 * Projector (display/preview) shows short labels only; the controller sees
 * full records, links and verification status (spec §1, sources decision).
 */
export function SourceList({
  sourceIds,
  role,
  locale,
  getSource,
  compact = false,
}: {
  sourceIds: string[];
  role: SceneRole;
  locale: Locale;
  getSource: (id: string) => SourceRecord | undefined;
  compact?: boolean;
}) {
  if (sourceIds.length === 0) return null;
  const records = sourceIds.map((id) => ({ id, source: getSource(id) }));
  if (role !== "controller" || compact) {
    const labels = records.map(({ id, source }) => (source ? shortSourceLabel(source) : id));
    return (
      <p className={styles.short}>
        <span className={styles.shortHead}>{tr(COPY.sources, locale)}</span> {labels.join("; ")}
      </p>
    );
  }
  return (
    <ul className={styles.full} aria-label={tr(COPY.sources, locale)}>
      {records.map(({ id, source }) => (
        <li key={id} className={styles.item}>
          {source ? (
            <>
              <span className={styles.title}>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                ) : (
                  source.title
                )}
              </span>
              <span className={styles.meta}>
                {[source.publisher, source.date ? formatIsoDate(source.date, locale) : undefined]
                  .filter(Boolean)
                  .join(", ")}
                {source.retrieved ? ` (${tr(COPY.retrieved, locale)} ${formatIsoDate(source.retrieved, locale)})` : ""}
              </span>
              {source.verification === "needs-verification" ? (
                <span className={styles.warn}>
                  <span aria-hidden="true">⚠</span> {tr(COPY.unverified, locale)}
                  {source.notes ? `: ${source.notes}` : ""}
                </span>
              ) : null}
            </>
          ) : (
            <span className={styles.warn}>
              <span aria-hidden="true">⚠</span> {tr(COPY.missing, locale)}: <code>{id}</code>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
