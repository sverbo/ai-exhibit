import type { SceneComponentProps } from "../../contract.ts";
import { shortSourceLabel } from "../../primitives/sourceLabel.ts";
import { SceneHeading, cx, l, type L10n } from "../../learning/shared/ui.tsx";
import { CapIcon } from "../shared/icons.tsx";
import { CONNECTORS, connectorPosition, resolveSource, visibleConnectors } from "./connectors.ts";
import styles from "./ConnectedAssistant.module.css";

export type ConnectedAssistantProps = Record<string, never>;

const TEXT = {
  heading: l("Les assistants d'aujourd'hui se branchent sur votre vie", "Today's assistants plug into your life"),
  hub: l("Assistant", "Assistant"),
  alone: l("Seul, il ne peut que parler.", "On its own, it can only talk."),
  aloneSub: l("Chaque branchement lui ouvre une porte de plus.", "Each connection opens one more door."),
};

/** Stage geometry, in stage pixels. */
const CENTER = { x: 960, y: 452 };
const RADIUS = { x: 600, y: 268 };
const HUB_R = 112;
const NODE_R = 50;

export function ConnectedAssistant({ ctx }: SceneComponentProps<ConnectedAssistantProps>) {
  const { locale, role, reducedMotion } = ctx;
  const t = (x: L10n) => x[locale];
  const n = CONNECTORS.length;
  const shown = visibleConnectors(ctx.revealStep);
  const current = shown > 0 ? CONNECTORS[shown - 1]! : null;
  const animate = role !== "preview" && !reducedMotion;
  // Half-step offset keeps the top of the ring clear of the heading.
  const pos = (i: number) => connectorPosition(i + 0.5, n, CENTER, RADIUS);

  return (
    <div className={cx(styles.root, animate && styles.animate)}>
      <div className={styles.heading}>
        <SceneHeading>{t(TEXT.heading)}</SceneHeading>
      </div>

      <svg className={styles.wires} viewBox="0 0 1920 1080" aria-hidden="true">
        {CONNECTORS.map((c, i) => {
          if (i >= shown) return null;
          const p = pos(i);
          const dx = p.x - CENTER.x;
          const dy = p.y - CENTER.y;
          const len = Math.hypot(dx, dy);
          const x1 = CENTER.x + (dx / len) * (HUB_R + 6);
          const y1 = CENTER.y + (dy / len) * (HUB_R + 6);
          const x2 = p.x - (dx / len) * (NODE_R + 8);
          const y2 = p.y - (dy / len) * (NODE_R + 8);
          return (
            <line
              key={c.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              pathLength={1}
              className={cx(styles.wire, i === shown - 1 && styles.wireNew)}
            />
          );
        })}
      </svg>

      <div className={styles.hub} style={{ left: CENTER.x - HUB_R, top: CENTER.y - HUB_R, width: HUB_R * 2, height: HUB_R * 2 }}>
        <CapIcon name="chat" size={64} strokeWidth={1.6} />
        <span className={styles.hubLabel}>{t(TEXT.hub)}</span>
      </div>

      {CONNECTORS.map((c, i) => {
        const p = pos(i);
        return (
          <div
            key={c.id}
            className={cx(styles.node, i < shown && styles.nodeOn, i === shown - 1 && styles.nodeCurrent)}
            style={{ left: p.x, top: p.y }}
            aria-hidden={i >= shown}
          >
            <span className={styles.disc}>
              <CapIcon name={c.icon} size={46} strokeWidth={1.7} />
            </span>
            <span className={styles.label}>{t(c.label)}</span>
          </div>
        );
      })}

      <footer className={styles.band} key={current?.id ?? "alone"}>
        {current ? (
          <>
            <p className={styles.example}>
              <span className={styles.quote}>{locale === "fr" ? "«\u00a0" : "\u201c"}</span>
              {t(current.example)}
              <span className={styles.quote}>{locale === "fr" ? "\u00a0»" : "\u201d"}</span>
            </p>
            <p className={styles.sources}>
              {current.sourceIds
                .map((id) => resolveSource(id, ctx.getSource))
                .filter((s) => s !== undefined)
                .map((s) => (
                  <span key={s.id} className={styles.source}>
                    {shortSourceLabel(s)}
                  </span>
                ))}
            </p>
          </>
        ) : (
          <>
            <p className={styles.example}>{t(TEXT.alone)}</p>
            <p className={styles.aloneSub}>{t(TEXT.aloneSub)}</p>
          </>
        )}
      </footer>
    </div>
  );
}
