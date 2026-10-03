import type { CSSProperties, ReactNode } from "react";
import { stepCount, tr as coreTr, type L10n, type SceneVisual } from "@ai-exhibit/presentation-core";
import type { SceneContext } from "../contract.ts";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import { Rich } from "../primitives/Rich.tsx";
import { SourceLabels } from "../primitives/SourceLabel.tsx";
import { cardColumns, displaySize, statementLines, visibleItemCount } from "./reveal.ts";
import styles from "./layouts.module.css";

export type GenericVisual = Exclude<SceneVisual, { layout: "component" }>;

interface LayoutProps<V> {
  visual: V;
  ctx: SceneContext;
  /** Show unrevealed items as faint outlines (presenter-side only, never on the projector). */
  ghostUnrevealed: boolean;
}

export function GenericLayout({ visual, ctx, ghostUnrevealed }: LayoutProps<GenericVisual>) {
  switch (visual.layout) {
    case "title":
      return <TitleLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "question":
      return <QuestionLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "statement":
      return <StatementLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "cards":
      return <CardsLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "list":
      return <ListLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "flow":
      return <FlowLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "compare":
      return <CompareLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
    case "placeholder":
      return <PlaceholderLayout visual={visual} ctx={ctx} ghostUnrevealed={ghostUnrevealed} />;
  }
}

type Of<L extends GenericVisual["layout"]> = Extract<GenericVisual, { layout: L }>;

function tr(text: L10n | undefined, ctx: SceneContext): string | undefined {
  return text ? coreTr(text, ctx.locale) : undefined;
}

/** Visibility class for the i-th revealable item. */
function useReveal(ctx: SceneContext, itemCount: number, ghost: boolean) {
  const visible = visibleItemCount(itemCount, stepCount(ctx.scene), ctx.revealStep);
  const motion = ctx.reducedMotion || ctx.role === "preview" ? styles.still : "";
  return (i: number) =>
    `${styles.item} ${motion} ${i < visible ? styles.shown : ghost ? styles.ghost : styles.hidden}`;
}

function Heading({ text }: { text: string | undefined }) {
  if (!text) return null;
  return <h2 className={styles.heading}>
      <Rich text={text} />
    </h2>;
}

/* Title, question and statement: one line of big type, hung from a short accent rule. */

function TitleLayout({ visual, ctx }: LayoutProps<Of<"title">>) {
  const heading = tr(visual.heading, ctx) ?? "";
  return (
    <div className={`${styles.frame} ${styles.displayFrame}`}>
      <span className={styles.rule} aria-hidden="true" />
      {visual.kicker ? <p className={styles.kicker}><Rich text={tr(visual.kicker, ctx)} /></p> : null}
      <h1 className={styles.title} data-size={displaySize(heading, 28, 56)}>
        <Rich text={heading} />
      </h1>
      {visual.sub ? <p className={styles.sub}><Rich text={tr(visual.sub, ctx)} /></p> : null}
    </div>
  );
}

function QuestionLayout({ visual, ctx }: LayoutProps<Of<"question">>) {
  const question = tr(visual.question, ctx) ?? "";
  return (
    <div className={`${styles.frame} ${styles.displayFrame}`}>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.question} data-size={displaySize(question, 40, 72)}>
        <Rich text={question} />
      </p>
      {visual.hint ? <p className={styles.hint}><Rich text={tr(visual.hint, ctx)} /></p> : null}
    </div>
  );
}

function StatementLayout({ visual, ctx }: LayoutProps<Of<"statement">>) {
  const text = tr(visual.text, ctx) ?? "";
  const lines = statementLines(text);
  const size = lines.length > 1 ? "lines" : displaySize(text, 40, 72);
  return (
    <div className={`${styles.frame} ${styles.displayFrame}`}>
      <span className={styles.rule} aria-hidden="true" />
      <blockquote className={styles.statement} data-size={size}>
        {lines.length > 1 ? lines.map((line, i) => <span key={i} className={styles.statementLine}><Rich text={line} /></span>) : <Rich text={text} />}
      </blockquote>
      {visual.attribution ? <p className={styles.attribution}><Rich text={tr(visual.attribution, ctx)} /></p> : null}
    </div>
  );
}

function CardsLayout({ visual, ctx, ghostUnrevealed }: LayoutProps<Of<"cards">>) {
  const cls = useReveal(ctx, visual.cards.length, ghostUnrevealed);
  const columns = cardColumns(visual.cards.length);
  const dense = visual.cards.length > 4 ? "" : undefined;
  return (
    <div className={styles.frame} data-dense={dense}>
      <Heading text={tr(visual.heading, ctx)} />
      <div
        className={styles.cards}
        style={{ "--columns": columns } as CSSProperties}
        data-dense={dense}
      >
        {visual.cards.map((card, i) => (
          <article key={i} className={`${styles.card} ${cls(i)}`}>
            {card.icon ? (
              <span className={styles.cardIcon} aria-hidden="true">
                {card.icon}
              </span>
            ) : null}
            <h3 className={styles.cardTitle}><Rich text={tr(card.title, ctx)} /></h3>
            {card.body ? <p className={styles.cardBody}><Rich text={tr(card.body, ctx)} /></p> : null}
            {(card.evidence && card.evidence !== "none") || card.sourceIds?.length ? (
              <footer className={styles.cardFooter}>
                {card.evidence ? <EvidenceBadge level={card.evidence} locale={ctx.locale} size="sm" /> : null}
                <SourceLabels ids={card.sourceIds} getSource={ctx.getSource} />
              </footer>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function ListLayout({ visual, ctx, ghostUnrevealed }: LayoutProps<Of<"list">>) {
  const cls = useReveal(ctx, visual.items.length, ghostUnrevealed);
  return (
    <div className={styles.frame}>
      <Heading text={tr(visual.heading, ctx)} />
      <ul className={styles.list} data-dense={visual.items.length > 5 ? "" : undefined}>
        {visual.items.map((item, i) => (
          <li key={i} className={`${styles.listItem} ${cls(i)}`}>
            <Rich text={tr(item, ctx)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlowLayout({ visual, ctx, ghostUnrevealed }: LayoutProps<Of<"flow">>) {
  const cls = useReveal(ctx, visual.nodes.length, ghostUnrevealed);
  const edgeLabel = (from: string, to: string) =>
    tr(visual.edges?.find((e) => e.from === from && e.to === to)?.label, ctx);
  const loopLabel = (() => {
    const last = visual.nodes[visual.nodes.length - 1];
    const first = visual.nodes[0];
    return last && first ? edgeLabel(last.id, first.id) : undefined;
  })();
  const lastIndex = visual.nodes.length - 1;
  const parts: ReactNode[] = [];
  visual.nodes.forEach((node, i) => {
    if (i > 0) {
      const prev = visual.nodes[i - 1]!;
      const label = edgeLabel(prev.id, node.id);
      parts.push(
        <div key={`a${i}`} className={`${styles.arrow} ${cls(i)}`} aria-hidden={label ? undefined : "true"}>
          {label ? <span className={styles.arrowLabel}><Rich text={label} /></span> : null}
          <span className={styles.arrowLine} />
        </div>,
      );
    }
    parts.push(
      <div key={node.id} className={`${styles.node} ${cls(i)}`}>
        <span className={styles.nodeLabel}><Rich text={tr(node.label, ctx)} /></span>
        {node.detail ? <span className={styles.nodeDetail}><Rich text={tr(node.detail, ctx)} /></span> : null}
      </div>,
    );
  });
  return (
    <div className={styles.frame}>
      <Heading text={tr(visual.heading, ctx)} />
      <div className={styles.flowWrap}>
        <div className={styles.flow} data-dense={visual.nodes.length > 4 ? "" : undefined}>
          {parts}
        </div>
        {visual.loop && lastIndex > 0 ? (
          <div
            className={`${styles.loop} ${cls(lastIndex)}`}
            style={{ "--loop-nodes": visual.nodes.length } as CSSProperties}
          >
            <span className={styles.loopLine} />
            {loopLabel ? <span className={styles.loopLabel}><Rich text={loopLabel} /></span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CompareLayout({ visual, ctx, ghostUnrevealed }: LayoutProps<Of<"compare">>) {
  const cls = useReveal(ctx, 2, ghostUnrevealed);
  const column = (col: Of<"compare">["left"], i: number, side: "left" | "right") => (
    <section className={`${styles.compareCol} ${styles[side]} ${cls(i)}`}>
      <h3 className={styles.compareTitle}><Rich text={tr(col.title, ctx)} /></h3>
      <ul className={styles.compareItems}>
        {col.items.map((item, j) => (
          <li key={j}><Rich text={tr(item, ctx)} /></li>
        ))}
      </ul>
    </section>
  );
  return (
    <div className={styles.frame}>
      <Heading text={tr(visual.heading, ctx)} />
      <div className={styles.compare}>
        {column(visual.left, 0, "left")}
        <div className={styles.compareRule} aria-hidden="true" />
        {column(visual.right, 1, "right")}
      </div>
    </div>
  );
}

function PlaceholderLayout({ visual, ctx }: LayoutProps<Of<"placeholder">>) {
  return (
    <div className={`${styles.frame} ${styles.placeholderFrame}`}>
      <div className={styles.placeholder}>
        <p className={styles.placeholderTag}>{ctx.locale === "fr" ? "Scène à construire" : "Scene to be built"}</p>
        <p className={styles.placeholderText}><Rich text={tr(visual.description, ctx)} /></p>
      </div>
    </div>
  );
}
