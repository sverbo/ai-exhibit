import { tr, type EvidenceLevel, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { visibleItemCount } from "../layouts/reveal.ts";
import { getStoryImage } from "@ai-exhibit/content/assets/media/story/credits.ts";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import { COUNTRY_NAMES, flagImageId, type CountryCode } from "../story/countries.ts";
import { Picture, type PictureId } from "./pictures.tsx";
import styles from "./PictureCards.module.css";

export interface PictureCard {
  picture: PictureId;
  /** One or two words, set above the line. Optional. */
  title?: L10n;
  /** The one short line the room reads. Figures and dates belong in the notes. */
  line: L10n;
  /** Shown as a badge under the line. */
  evidence?: EvidenceLevel;
  /** Must also be on the scene; listed in presenter view and handout, not on the stage. */
  sourceIds?: string[];
  /** Small bundled flags under the picture (the countries the card is about). */
  flags?: CountryCode[];
  /** A sticker beside the picture with the update pictogram and a short call, revealed on the step after the last card. */
  tip?: L10n;
}

/** A row of organisation names, set as quiet monochrome wordmarks. */
export interface PictureCardsOrgs {
  label: L10n;
  names: string[];
}

/** A closing line, attributed (for example to the presenter). */
export interface PictureCardsTakeaway {
  line: L10n;
  attribution?: L10n;
}

export interface PictureCardsProps {
  heading?: L10n;
  cards: PictureCard[];
  /** With exactly two cards: a picture between them, shown from step 0 (the shared tool). */
  center?: PictureId;
  /** Revealed on the step after the last card. */
  orgs?: PictureCardsOrgs;
  /** Revealed on the final step. */
  takeaway?: PictureCardsTakeaway;
}

function hasTips(props: PictureCardsProps): boolean {
  return (props.cards ?? []).some((c) => c.tip);
}

/** Steps a PictureCards scene declares when it has tips, orgs or a takeaway: one per card, then one each. */
export function pictureCardsSteps(props: PictureCardsProps): number {
  return props.cards.length + (hasTips(props) ? 1 : 0) + (props.orgs ? 1 : 0) + (props.takeaway ? 1 : 0);
}

export type PictureCardsLayout = "hero" | "versus" | "row";

export function pictureCardsLayout(props: PictureCardsProps): PictureCardsLayout {
  if (props.cards.length === 1) return "hero";
  if (props.cards.length === 2 && props.center) return "versus";
  return "row";
}

/** Cards visible at a step: one per step after the heading (step 0); all of them in preview or with no steps. */
export function visiblePictureCards(count: number, steps: number, revealStep: number, preview: boolean): number {
  if (preview) return count;
  return visibleItemCount(count, steps, revealStep);
}

/**
 * PictureCards {heading?, cards, center?}: a pictogram and one short line per
 * card. Step 0 shows the heading (and the center picture); each step reveals
 * the next card. No state: the projector follows the step.
 */
export function PictureCards({ props, ctx }: SceneComponentProps<PictureCardsProps>) {
  const { locale, role } = ctx;
  const cards = props.cards ?? [];
  const layout = pictureCardsLayout(props);
  const preview = role === "preview";
  const steps = ctx.scene?.steps ?? 0;
  // With tips or a footer, cards come one per step and the extras follow: tips, orgs, takeaway.
  const tips = hasTips(props);
  const stepped = tips || props.orgs || props.takeaway;
  const visible = stepped ? (preview ? cards.length : Math.min(cards.length, ctx.revealStep)) : visiblePictureCards(cards.length, steps, ctx.revealStep, preview);
  const tipStep = cards.length + 1;
  const showTips = tips && (preview || ctx.revealStep >= tipStep);
  const orgsStep = tipStep + (tips ? 1 : 0);
  const takeawayStep = orgsStep + (props.orgs ? 1 : 0);
  const showOrgs = Boolean(props.orgs) && (preview || ctx.revealStep >= orgsStep);
  const showTakeaway = Boolean(props.takeaway) && (preview || ctx.revealStep >= takeawayStep);
  const still = preview || ctx.reducedMotion;

  const card = (c: PictureCard, i: number) => {
    const shown = i < visible;
    return (
      <figure
        key={i}
        className={`${styles.card} ${shown ? styles.shown : styles.hidden}`}
        data-card={i}
        data-shown={shown ? "" : undefined}
        aria-hidden={!shown}
      >
        <div className={styles.picture}>
          <Picture id={c.picture} />
          {c.flags?.length ? (
            <span className={styles.flags} role="img" aria-label={c.flags.map((f) => tr(COUNTRY_NAMES[f], locale)).join(", ")}>
              {c.flags.map((f) => {
                const image = getStoryImage(flagImageId(f));
                return image ? <img key={f} className={styles.flag} src={image.url} alt="" draggable={false} /> : null;
              })}
            </span>
          ) : null}
          {c.tip ? (
            <span className={`${styles.tip} ${showTips ? styles.tipShown : styles.tipHidden}`} data-tip={showTips ? "" : undefined} aria-hidden={!showTips}>
              <span className={styles.tipPicture}>
                <Picture id="update" />
              </span>
              <span className={styles.tipLine}>
                <Rich text={tr(c.tip, locale)} />
              </span>
            </span>
          ) : null}
        </div>

        <figcaption className={styles.caption}>
          {c.title ? (
            <span className={styles.title}>
              <Rich text={tr(c.title, locale)} />
            </span>
          ) : null}
          <span className={c.title ? styles.lineSmall : styles.line}>
            <Rich text={tr(c.line, locale)} />
          </span>
          {c.evidence && c.evidence !== "none" ? (
            <span className={styles.meta}>
              <EvidenceBadge level={c.evidence} locale={locale} size="sm" />
            </span>
          ) : null}
        </figcaption>
      </figure>
    );
  };

  return (
    <div
      className={`${styles.root} ${still ? styles.still : ""}`}
      data-layout={layout}
      data-visible={visible}
      data-footer={props.orgs || props.takeaway ? "" : undefined}
    >
      {props.heading ? <h2 className={styles.heading}>
          <Rich text={tr(props.heading, locale)} />
        </h2> : null}
      <div className={styles.cards} data-count={cards.length}>
        {layout === "versus" ? (
          <>
            {card(cards[0]!, 0)}
            <div className={styles.center} aria-hidden="true">
              <Picture id={props.center!} />
            </div>
            {card(cards[1]!, 1)}
          </>
        ) : (
          cards.map(card)
        )}
      </div>
      {props.orgs || props.takeaway ? (
        <footer className={styles.footer}>
          {props.orgs ? (
            <div className={`${styles.orgs} ${showOrgs ? styles.shown : styles.hidden}`} data-orgs={showOrgs ? "" : undefined} aria-hidden={!showOrgs}>
              <span className={styles.orgsLabel}>
                <Rich text={tr(props.orgs.label, locale)} />
              </span>
              <ul className={styles.orgNames}>
                {props.orgs.names.map((n) => (
                  <li key={n} className={styles.orgName}>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {props.takeaway ? (
            <p className={`${styles.takeaway} ${showTakeaway ? styles.shown : styles.hidden}`} data-takeaway={showTakeaway ? "" : undefined} aria-hidden={!showTakeaway}>
              <span className={styles.takeawayLine}>
                <Rich text={tr(props.takeaway.line, locale)} />
              </span>
              {props.takeaway.attribution ? (
                <span className={styles.attribution}>
                  <Rich text={tr(props.takeaway.attribution, locale)} />
                </span>
              ) : null}
            </p>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
