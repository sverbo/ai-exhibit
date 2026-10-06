import type { ReactNode } from "react";
import { tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import type { SceneRole } from "../../contract.ts";
import { cx } from "../../learning/shared/ui.tsx";
import styles from "./Byline.module.css";

/** A person credited on screen; mirrors `credits.ts` in the presentation. */
export interface CreditPerson {
  name: string;
  url?: string;
  /** LinkedIn profile: a small "in" mark after the name links to it. */
  linkedin?: string;
}

/**
 * Who made the talk, passed as scene props from the presentation's single
 * attribution config (presentations/canonical/src/credits.ts).
 */
export interface TalkCredits {
  original: CreditPerson & { url: string; linkedin?: string };
  /** A fork's own presenter or author; null in the original talk. */
  fork: CreditPerson | null;
}

const COPY = {
  original: { en: "Original presentation by {name}" },
  linkedin: { en: "{name} on LinkedIn" },
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
 * A simple "in" mark (rounded square, letters cut out so the slide shows
 * through), drawn here so nothing is fetched at presentation time.
 */
const IN_MARK =
  "M4 0H20A4 4 0 0 1 24 4V20A4 4 0 0 1 20 24H4A4 4 0 0 1 0 20V4A4 4 0 0 1 4 0Z" +
  "M4.6 6.6A1.9 1.9 0 1 0 8.4 6.6A1.9 1.9 0 1 0 4.6 6.6Z" +
  "M4.8 9.6H8.2V19.6H4.8Z" +
  "M10.4 9.6H13.6V11.1C14.2 10.1 15.4 9.4 17 9.4C19.3 9.4 20.1 10.9 20.1 13.4V19.6H16.7V14.3" +
  "C16.7 13.1 16.4 12.3 15.3 12.3C14.2 12.3 13.8 13.1 13.8 14.3V19.6H10.4Z";

/** The bare "in" mark, decorative (the link around it carries the label); also used on the home page. */
export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={IN_MARK} fillRule="evenodd" fill="currentColor" />
    </svg>
  );
}

/**
 * A person's LinkedIn mark, sized to the text around it: a link on the live
 * screens (new tab, like CreditLink), a plain decoration in the preview.
 */
export function LinkedInMark({ person, locale, role }: { person: CreditPerson; locale: Locale; role: SceneRole }) {
  if (!person.linkedin) return null;
  const svg = <LinkedInIcon className={styles.markIcon} />;
  if (role === "preview") return <span className={styles.mark}>{svg}</span>;
  const label = tr(COPY.linkedin, locale).replace("{name}", person.name);
  return (
    <a className={styles.mark} href={person.linkedin} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
      {svg}
    </a>
  );
}

/**
 * The talk's byline: the presenter's own line (the fork's, or the original
 * author's), then, in a fork, "Original presentation by Samuel Verboomen"
 * with the link to the original talk. A name with a LinkedIn profile gets its
 * "in" mark. `line` holds "{name}".
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
        <LinkedInMark person={own} locale={locale} role={role} />
      </p>
      {credits.fork && (
        <p className={styles.original}>
          <span>
            {withName(tr(COPY.original, locale), original.name, locale)}
            <LinkedInMark person={original} locale={locale} role={role} />
          </span>
          <CreditLink url={original.url} role={role} className={styles.url}>
            {displayUrl(original.url)}
          </CreditLink>
        </p>
      )}
    </div>
  );
}
