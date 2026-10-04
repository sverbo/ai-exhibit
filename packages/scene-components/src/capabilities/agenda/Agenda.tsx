import { tr, stepCount, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../../contract.ts";
import { Rich } from "../../primitives/Rich.tsx";
import { visibleItemCount } from "../../layouts/reveal.ts";
import layout from "../../layouts/layouts.module.css";
import { GlossaryQr } from "./GlossaryQr.tsx";
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
      <GlossaryQr glossaryUrl={ctx.glossaryUrl} locale={ctx.locale} label={COPY.qrLabel} hint={COPY.qrHint} />
    </div>
  );
}
