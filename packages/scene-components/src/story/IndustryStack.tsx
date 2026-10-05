import { tr } from "@ai-exhibit/presentation-core";
import type { CSSProperties } from "react";
import { getStoryImage } from "@ai-exhibit/content/assets/media/story/credits.ts";
import type { SceneComponentProps } from "../contract.ts";
import { SourceList } from "../evidence/SourceList.tsx";
import { stopShellKeys } from "../evidence/shared.ts";
import { Credits } from "./Credits.tsx";
import { Flags } from "./Flags.tsx";
import { flagImageId, HEADQUARTERS } from "./countries.ts";
import { logoBox } from "./data.ts";
import { INDUSTRY_STEPS, LAYERS, MOVES, PEOPLE, placementsAt, type LayerId, type PersonMove } from "./industry.ts";
import styles from "./IndustryStack.module.css";

/* Stage geometry (1920 x 1080 logical px). Everything is placed absolutely:
   each place a person stands in is its own portrait and link line, which fade
   in and out with the step. Nothing travels. */
const LEFT = 64;
const RIGHT = 1856;
const LOGO_X0 = 372;
const PORTRAIT = 100;
const INLINE_PORTRAIT = 84; // a portrait standing beside its logo inside a layer
const FLAG_GAP = 8; // between a logo and its flags
const PRODUCT_GAP = 30; // from the top of the flags to the product chip (ChatGPT, Claude)
const FLAG_H = 22; // Flags.module.css
const TAG_GAP = 10; // from the flags to the "open weights" tag
const SHARE_GAP = 18;// from the left edge of a logo to its market share
const LANE_Y = 46; // top of the portraits in the lane above the labs
const LINK_FROM_Y = 190; // just under the names
const LAYER_BOX: Record<LayerId, { top: number; height: number; rows: number }> = {
  labs: { top: 206, height: 252, rows: 2 },
  cloud: { top: 470, height: 124, rows: 1 },
  chips: { top: 606, height: 124, rows: 1 },
  foundries: { top: 742, height: 124, rows: 1 },
  equipment: { top: 878, height: 124, rows: 1 },
};
const SIZING = {
  labs: { area: 9500, maxW: 220, maxH: 58 },
  other: { area: 7400, maxW: 200, maxH: 54 },
};

interface Placed {
  id: string;
  layer: LayerId;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Logo centres and sizes, computed once (pure, also used by tests). */
export function layoutActors(): Map<string, Placed> {
  const out = new Map<string, Placed>();
  for (const layer of LAYERS) {
    const box = LAYER_BOX[layer.id];
    const rowCount = box.rows;
    for (let row = 0; row < rowCount; row++) {
      const actors = layer.actors.filter((a) => (a.row ?? 0) === row);
      const span = (RIGHT - LOGO_X0) / actors.length;
      // Logos sit a little above the middle of their row to leave room for the flags below.
      const y = box.top + (box.height * (row + 0.42)) / rowCount;
      actors.forEach((actor, i) => {
        const image = getStoryImage(actor.image);
        const s = layer.id === "labs" ? SIZING.labs : SIZING.other;
        const { w, h } = logoBox(image?.aspect ?? 4, s.area * (actor.weight ?? 1), s.maxW, s.maxH);
        out.set(actor.id, { id: actor.id, layer: layer.id, x: Math.round(LOGO_X0 + span * (i + 0.5)), y: Math.round(y), w, h });
      });
    }
  }
  return out;
}

const ACTORS = layoutActors();
const LIT_AT = new Map(LAYERS.flatMap((l) => l.actors.map((a) => [a.id, a.lightAt ?? Infinity] as const)));

/** Portrait centre x for a move. */
export function personX(move: PersonMove): number {
  if (move.org === null) return move.dx;
  return (ACTORS.get(move.org)?.x ?? 0) + move.dx;
}

/** Top-left corner of a portrait for a move: in the lane, or beside its logo for inline moves. */
function portraitOrigin(move: PersonMove): { x: number; y: number } {
  if (move.inline && move.org) {
    const target = ACTORS.get(move.org)!;
    return { x: personX(move) - INLINE_PORTRAIT / 2, y: target.y - INLINE_PORTRAIT / 2 - 10 };
  }
  return { x: personX(move) - PORTRAIT / 2, y: LANE_Y };
}

/** Width of an actor's flag row (Flags.module.css: 22px high, 6px apart). */
function flagRowWidth(actorId: string): number {
  const countries = HEADQUARTERS[actorId]?.countries ?? [];
  const widths = countries.map((c) => FLAG_H * (getStoryImage(flagImageId(c))?.aspect ?? 1.5));
  return widths.reduce((sum, w) => sum + w, 0) + 6 * Math.max(0, widths.length - 1);
}

const COPY = {
  label: { en: "The AI industry, layer by layer" },
  sources: { en: "Sources for what is lit" },
  openWeights: { en: "open weights" },
} as const;

/**
 * The whole industry as a stack: machines that make chips, chip factories,
 * chip designers, data centers and cloud, AI labs. Every mark is drawn in one
 * ink and starts dimmed; each step lights only what the presenter talks about.
 * Portraits stand at the organisation where each person works, linked to it by
 * a line. Every change is one click and a plain fade: when a person changes
 * organisation, the old portrait and line fade out as the new ones fade in.
 * Market shares (left of their logo) and "open weights" tags (after the
 * flags) fade in with their actor and stay; they are hidden, not ghosted,
 * before that.
 * No state.
 */
export function IndustryStack({ ctx }: SceneComponentProps<Record<string, never>>) {
  const { locale, role } = ctx;
  const step = role === "preview" ? INDUSTRY_STEPS : Math.max(0, Math.min(INDUSTRY_STEPS, ctx.revealStep));
  const still = role === "preview" || ctx.reducedMotion;
  const placements = placementsAt(step);
  const litNow = LAYERS.flatMap((l) => l.actors).filter((a) => a.lightAt !== undefined && a.lightAt <= step);
  const newest = Math.max(0, ...litNow.map((a) => a.lightAt ?? 0));

  const litSources = [
    ...new Set([
      ...litNow.flatMap((a) => [...a.sourceIds, ...(a.share?.sourceIds ?? []), ...(a.openWeights?.sourceIds ?? [])]),
      ...[...placements.values()].flatMap((m) => m.sourceIds),
    ]),
  ];
  const imageIds = [...PEOPLE.map((p) => p.image), ...LAYERS.flatMap((l) => l.actors.map((a) => a.image))];

  return (
    <div className={`${styles.root} ${still ? styles.still : ""}`} aria-label={tr(COPY.label, locale)}>
      {LAYERS.map((layer) => {
        const box = LAYER_BOX[layer.id];
        return (
          <section
            key={layer.id}
            className={styles.layer}
            data-layer={layer.id}
            style={{ top: box.top, height: box.height, left: LEFT, width: RIGHT - LEFT }}
            aria-label={tr(layer.name, locale)}
          >
            <h3 className={styles.layerName}>{tr(layer.name, locale)}</h3>
          </section>
        );
      })}

      {LAYERS.flatMap((layer) =>
        layer.actors.map((actor) => {
          const p = ACTORS.get(actor.id)!;
          const image = getStoryImage(actor.image);
          const on = actor.lightAt !== undefined && actor.lightAt <= step;
          const style = {
            left: p.x - p.w / 2,
            top: p.y - p.h / 2,
            width: p.w,
            height: p.h,
            "--logo": image ? `url("${image.url}")` : "none",
          } as CSSProperties;
          const isNewest = on && actor.lightAt === newest;
          return [
            <span
              key={actor.id}
              className={`${styles.logo} ${on ? styles.on : styles.off}`}
              style={style}
              role="img"
              aria-label={tr(actor.label, locale)}
              data-lit={on}
            />,
            <Flags
              key={`${actor.id}-flags`}
              actorId={actor.id}
              locale={locale}
              className={`${styles.flagRow} ${on ? styles.on : styles.off}`}
              style={{ left: p.x, top: p.y + p.h / 2 + FLAG_GAP }}
            />,
            actor.product ? (
              <span
                key={`${actor.id}-product`}
                className={`${styles.product} ${on ? styles.on : styles.off}`}
                style={{ left: p.x, top: p.y + p.h / 2 + FLAG_GAP + PRODUCT_GAP }}
              >
                <span
                  className={styles.productMark}
                  style={{ "--logo": `url("${getStoryImage(actor.product.image)?.url ?? ""}")` } as CSSProperties}
                  aria-hidden="true"
                />
                {actor.product.name}
              </span>
            ) : null,
            actor.share ? (
              <span
                key={`${actor.id}-share`}
                className={`${styles.share} ${on ? styles.shown : styles.hidden}`}
                // Centred in the layer, not on the logo (set a little high): three lines of caption fit.
                style={{ left: p.x - p.w / 2 - SHARE_GAP, top: LAYER_BOX[p.layer].top + LAYER_BOX[p.layer].height / 2 }}
                aria-hidden={!on}
                data-share={on ? actor.id : undefined}
              >
                <span className={styles.shareValue}>{tr(actor.share.value, locale)}</span>
                <span className={styles.shareWhat}>{tr(actor.share.what, locale)}</span>
              </span>
            ) : null,
            actor.openWeights ? (
              <span
                key={`${actor.id}-open`}
                className={`${styles.tag} ${on ? styles.shown : styles.hidden}`}
                style={{ left: p.x + flagRowWidth(actor.id) / 2 + TAG_GAP, top: p.y + p.h / 2 + FLAG_GAP + FLAG_H / 2 }}
                aria-hidden={!on}
                data-open-weights={on ? actor.id : undefined}
              >
                {tr(COPY.openWeights, locale)}
              </span>
            ) : null,
            // The accent stroke is a sibling: a child of the masked logo would be masked away.
            isNewest ? (
              <span
                key={`${actor.id}-stroke`}
                className={styles.stroke}
                style={{ left: p.x - 24, top: p.y + p.h / 2 + FLAG_GAP + (actor.product ? PRODUCT_GAP + 34 : 28) }}
              />
            ) : null,
          ];
        }),
      )}

      <svg className={styles.links} viewBox="0 0 1920 1080" aria-hidden="true">
        {MOVES.filter((m) => m.org !== null).map((m) => {
          const target = ACTORS.get(m.org!)!;
          const x = personX(m);
          const d = m.inline
            ? `M ${x - INLINE_PORTRAIT / 2 - 6} ${target.y - 10} L ${target.x + target.w / 2 + 10} ${target.y - 10}`
            : `M ${x} ${LINK_FROM_Y} L ${target.x} ${target.y - target.h / 2 - 10}`;
          // A line only points at a lit organisation: Musk and Altman stand alone until OpenAI lights.
          const orgLit = (LIT_AT.get(m.org!) ?? Infinity) <= step;
          const shown = placements.get(m.person) === m && orgLit;
          return (
            <path
              key={`${m.person}@${m.step}`}
              className={`${styles.link} ${shown ? styles.shown : styles.hidden}`}
              d={d}
              data-link={shown ? `${m.person}-${m.org}` : undefined}
            />
          );
        })}
      </svg>

      {MOVES.map((move) => {
        const person = PEOPLE.find((p) => p.id === move.person)!;
        const shown = placements.get(move.person) === move;
        const image = getStoryImage(person.image);
        const at = portraitOrigin(move);
        return (
          <figure
            key={`${move.person}@${move.step}`}
            className={`${styles.person} ${shown ? styles.shown : styles.hidden} ${move.org === null ? styles.apart : ""} ${move.inline ? styles.inline : ""}`}
            style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
            aria-hidden={!shown}
            data-person={shown ? person.id : undefined}
            data-org={shown ? (move.org ?? "none") : undefined}
          >
            {image ? <img className={styles.portrait} src={image.url} alt="" draggable={false} /> : <span className={styles.portrait} />}
            <figcaption className={styles.name}>{person.name}</figcaption>
          </figure>
        );
      })}

      <footer className={styles.footer}>
        {role === "controller" && litSources.length ? (
          <details className={styles.sources} onKeyDown={stopShellKeys}>
            <summary>{tr(COPY.sources, locale)}</summary>
            <ul className={styles.moves}>
              {MOVES.filter((m) => m.step <= step).map((m) => (
                <li key={`${m.person}-${m.step}`}>{tr(m.what, locale)}</li>
              ))}
            </ul>
            <SourceList sourceIds={litSources} role={role} locale={locale} getSource={ctx.getSource} />
          </details>
        ) : (
          <span />
        )}
        <Credits imageIds={imageIds} role={role} locale={locale} />
      </footer>
    </div>
  );
}
