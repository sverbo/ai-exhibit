import { tr, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../../contract.ts";
import { Rich } from "../../primitives/Rich.tsx";
import { Byline, CreditLink, displayUrl, type TalkCredits } from "./Byline.tsx";
import styles from "./CreditsSlide.module.css";

export interface CreditsLink {
  url: string;
  /** Shown instead of the address, e.g. the publisher's domain for a long book URL. */
  label?: string;
}

export interface CreditsItem {
  /** A proper title stays a plain string (shown as written in every language). */
  title: string | L10n;
  /** Who makes it and what it is, e.g. "Book by Karen Hao, 2025". */
  by: L10n;
  links?: CreditsLink[];
  /** The registry entries behind the line (content/sources). */
  sourceIds?: string[];
}

export interface CreditsSlideProps {
  /** Who made the talk (presentations/canonical/src/credits.ts). */
  credits: TalkCredits;
  heading?: L10n;
  /** One line before the items. */
  intro?: L10n;
  items: CreditsItem[];
}

const COPY = {
  heading: { en: "Credits" },
  presentation: { en: "Presentation by {name}" },
} satisfies Record<string, L10n>;

/**
 * CreditsSlide {credits, heading?, intro?, items}: the last slide. Who made the
 * talk (the fork's line first in a fork, then the original author with the
 * link to the original talk), then the works the talk borrowed most from.
 * Static: no steps, no state. Links open in a new tab on the live screens and
 * stay plain text in the preview, like ResourceList.
 */
export function CreditsSlide({ props, ctx }: SceneComponentProps<CreditsSlideProps>) {
  const { locale, role } = ctx;
  const text = (x: string | L10n) => (typeof x === "string" ? x : tr(x, locale));
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <h2 className={styles.heading}>
          <Rich text={tr(props.heading ?? COPY.heading, locale)} />
        </h2>
        <Byline credits={props.credits} line={COPY.presentation} locale={locale} role={role} size="lg" />
      </header>
      <section className={styles.works}>
        {props.intro && (
          <p className={styles.intro}>
            <Rich text={tr(props.intro, locale)} />
          </p>
        )}
        <ul className={styles.list}>
          {props.items.map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.title}>
                <Rich text={text(item.title)} />
              </span>
              <span className={styles.by}>
                <Rich text={tr(item.by, locale)} />
              </span>
              {item.links && item.links.length > 0 && (
                <span className={styles.links}>
                  {item.links.map((l) => (
                    <CreditLink key={l.url} url={l.url} role={role} className={styles.url}>
                      {l.label ?? displayUrl(l.url)}
                    </CreditLink>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
