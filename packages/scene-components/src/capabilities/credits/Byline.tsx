import type { ReactNode } from "react";
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import type { SceneRole } from "../../contract.ts";
import { cx } from "../../learning/shared/ui.tsx";
import styles from "./Byline.module.css";

/** A person credited on screen; mirrors `credits.ts` in the presentation. */
export interface CreditPerson {
  name: string;
  url?: string;
}

/**
 * Who made the talk, passed as scene props from the presentation's single
 * attribution config (presentations/canonical/src/credits.ts).
 */
export interface TalkCredits {
  original: CreditPerson & { url: string };
  /** A fork's own presenter or author; null in the original talk. */
  fork: CreditPerson | null;
}

const COPY = {
  original: { en: "Original presentation by {name}" },
} satisfies Record<string, L10n>;

/**
 * Puts a name into a line such as "by {name}". French elides "de" before a
 * vowel: "Présentation d'Ada", not "Présentation de Ada".
 */
export function withName(line: string, name: string, locale: Locale): string {
  const elide = locale === "fr" && /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(name);
  return (elide ? line.replace(/\bde \{name\}/, "d'{name}") : line).replace("{name}", name);
}

/** "ai-exhibit.samverbo.com" for "https://ai-exhibit.samverbo.com/". */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/**
 * A link on the live screens (new tab, so the presenter can open it from the
 * projector or the presenter view, like the Resources slide); plain text in
 * the preview thumbnail.
 */
export function CreditLink({ url, role, className, children }: { url: string; role: SceneRole; className?: string; children: ReactNode }) {
  if (role === "preview") return <span className={className}>{children}</span>;
  return (
    <a className={cx(styles.link, className)} href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * The talk's byline: the presenter's own line (the fork's, or the original
 * author's), then, in a fork, "Original presentation by Samuel Verboomen"
 * with the link to the original talk. `line` holds "{name}".
 */
export function Byline({
  credits,
  line,
  locale,
  role,
  size = "md",
}: {
  credits: TalkCredits;
  line: L10n;
  locale: Locale;
  role: SceneRole;
  size?: "md" | "lg";
}) {
  const own = credits.fork ?? credits.original;
  const ownText = withName(tr(line, locale), own.name, locale);
  const { original } = credits;
  return (
    <div className={cx(styles.root, size === "lg" && styles.large)}>
      <p className={styles.own}>
        {credits.fork?.url ? (
          <CreditLink url={credits.fork.url} role={role}>
            {ownText}
          </CreditLink>
        ) : (
          ownText
        )}
      </p>
      {credits.fork && (
        <p className={styles.original}>
          <span>{withName(tr(COPY.original, locale), original.name, locale)}</span>
          <CreditLink url={original.url} role={role} className={styles.url}>
            {displayUrl(original.url)}
          </CreditLink>
        </p>
      )}
    </div>
  );
}
