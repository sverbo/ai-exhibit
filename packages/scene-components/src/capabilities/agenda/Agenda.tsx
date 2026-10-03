import { useMemo } from "react";
import { tr, stepCount, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../../contract.ts";
import { Rich } from "../../primitives/Rich.tsx";
import { visibleItemCount } from "../../layouts/reveal.ts";
import layout from "../../layouts/layouts.module.css";
import { resolveGlossaryUrl, qrPath } from "./glossaryUrl.ts";
import styles from "./Agenda.module.css";

export interface AgendaProps {
  heading: L10n;
  /** One line per part of the talk, revealed like a generic list (one per step by default). */
  items: L10n[];
}

const COPY = {
  qrLabel: { en: "Glossary on your phone" },
  qrHint: { en: "Every word of the talk, explained." },
} satisfies Record<string, L10n>;

/** The talk's plan, with a large QR code to the audience glossary on the side. */
export function Agenda({ props, ctx }: SceneComponentProps<AgendaProps>) {
  const items = props.items ?? [];
  const visible = visibleItemCount(items.length, stepCount(ctx.scene), ctx.revealStep);
  const still = ctx.reducedMotion || ctx.role === "preview" ? layout.still : "";
  const origin = typeof window === "undefined" ? null : window.location.origin;
  const url = resolveGlossaryUrl(ctx.glossaryUrl, origin);
  const qr = useMemo(() => (url ? qrPath(url) : null), [url]);

  return (
    <div className={`${layout.frame} ${styles.agenda}`}>
      <div className={styles.plan}>
        <h2 className={layout.heading}>{props.heading ? <Rich text={tr(props.heading, ctx.locale)} /> : null}</h2>
        <ul className={layout.list}>
          {items.map((item, i) => (
            <li key={i} className={`${layout.listItem} ${layout.item} ${still} ${i < visible ? layout.shown : layout.hidden}`}>
              <Rich text={tr(item, ctx.locale)} />
            </li>
          ))}
        </ul>
      </div>
      {qr && url ? (
        <figure className={styles.qr}>
          <div className={styles.code}>
            <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} role="img" aria-label={tr(COPY.qrLabel, ctx.locale)} shapeRendering="crispEdges">
              <rect x={-2} y={-2} width={qr.size + 4} height={qr.size + 4} className={styles.light} />
              <path d={qr.d} className={styles.dark} />
            </svg>
          </div>
          <figcaption className={styles.caption}>
            <span className={styles.label}>{tr(COPY.qrLabel, ctx.locale)}</span>
            <span className={styles.hint}>{tr(COPY.qrHint, ctx.locale)}</span>
            <span className={styles.url}>{url.replace(/^https?:\/\//, "")}</span>
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
