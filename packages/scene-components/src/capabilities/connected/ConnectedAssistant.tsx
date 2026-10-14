import { tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { shortSourceLabel } from "../../primitives/sourceLabel.ts";
import { SceneHeading, cx, type L10n } from "../../learning/shared/ui.tsx";
import { CapIcon } from "../shared/icons.tsx";
import { CONNECTORS, STEP_PERMISSION, STEP_RISK, connectorPosition, resolveSource, visibleConnectors } from "./connectors.ts";
import styles from "./ConnectedAssistant.module.css";

export type ConnectedAssistantProps = Record<string, never>;

const TEXT = {
  heading: { en: "Today's assistants plug into your life" },
  chatbotVsAgent: { en: "Chatbot vs agent: a chatbot can only talk; connected to tools, an agent acts." },
  hub: { en: "Assistant" },
  alone: { en: "On its own, it can only talk." },
  aloneSub: { en: "Each connection opens one more door." },
  permissionCallout: { en: "Each switch is a permission we give it" },
  permission: { en: "Every connection is a switch we turn on ourselves." },
  permissionSub: { en: "Same model; only what we let it touch changes." },
  riskCallout: { en: "In red: it acts in your name, hard to undo" },
  risk: { en: "It looks reliable, so we switch on more and more, until the day it really matters." },
  riskSub: { en: "Automation bias: the more reliable a system looks, the less we check it." },
};

/** Stage geometry, in stage pixels. */
const CENTER = { x: 960, y: 452 };
const RADIUS = { x: 600, y: 268 };
const HUB_R = 112;
const NODE_R = 50;
/** Permission switch worn by each connector, clear of its label (below the disc) and its wire. */
const SWITCH = { w: 60, h: 32 };
/** Switch centre relative to its node: top right of the disc; beside it for the top nodes, which sit just under the subtitle. */
const switchOffset = (p: { y: number }) => (p.y < CENTER.y - 160 ? { dx: 76, dy: -12 } : { dx: 44, dy: -58 });
/** The connectors the permission and risk callouts point at. */
const PERMISSION_TARGET = "calendar";
const RISK_TARGET = "shopping";

export function ConnectedAssistant({ ctx }: SceneComponentProps<ConnectedAssistantProps>) {
  const { locale, role, reducedMotion } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const n = CONNECTORS.length;
  const step = Math.floor(ctx.revealStep);
  const shown = visibleConnectors(step);
  const permissions = step >= STEP_PERMISSION;
  const risks = step >= STEP_RISK;
  // Once every connector is on, no single one is "current": the band speaks about all of them.
  const current = shown > 0 && !permissions ? CONNECTORS[shown - 1]! : null;
  const animate = role !== "preview" && !reducedMotion;
  // Half-step offset keeps the top of the ring clear of the heading.
  const pos = (i: number) => connectorPosition(i + 0.5, n, CENTER, RADIUS);
  /** Wire i, from the hub's edge to the node's edge. */
  const wire = (i: number) => {
    const p = pos(i);
    const dx = p.x - CENTER.x;
    const dy = p.y - CENTER.y;
    const len = Math.hypot(dx, dy);
    const x1 = CENTER.x + (dx / len) * (HUB_R + 6);
    const y1 = CENTER.y + (dy / len) * (HUB_R + 6);
    const x2 = p.x - (dx / len) * (NODE_R + 8);
    const y2 = p.y - (dy / len) * (NODE_R + 8);
    return { x1, y1, x2, y2 };
  };
  const permNode = pos(CONNECTORS.findIndex((c) => c.id === PERMISSION_TARGET));
  const permOffset = switchOffset(permNode);
  const permTarget = { x: permNode.x + permOffset.dx - SWITCH.w / 2, y: permNode.y + permOffset.dy };
  const riskTarget = pos(CONNECTORS.findIndex((c) => c.id === RISK_TARGET));

  return (
    <div className={cx(styles.root, animate && styles.animate)}>
      <div className={styles.heading}>
        <SceneHeading><Rich text={t(TEXT.heading)} /></SceneHeading>
        <p className={styles.sub}>
          <Rich text={t(TEXT.chatbotVsAgent)} />
        </p>
      </div>

      <svg className={styles.wires} viewBox="0 0 1920 1080" aria-hidden="true">
        <defs>
          <marker id="conn-arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M1,1 L10,6 L1,11" className={styles.arrowHead} />
          </marker>
          <marker id="conn-arrow-risk" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M1,1 L10,6 L1,11" className={cx(styles.arrowHead, styles.arrowHeadRisk)} />
          </marker>
        </defs>
        {CONNECTORS.map((c, i) => {
          if (i >= shown) return null;
          const w = wire(i);
          return (
            <line
              key={c.id}
              x1={w.x1}
              y1={w.y1}
              x2={w.x2}
              y2={w.y2}
              pathLength={1}
              className={cx(styles.wire, i === shown - 1 && !permissions && styles.wireNew, permissions && styles.wirePermission, risks && c.risk && styles.wireRisky)}
            />
          );
        })}
        {permissions && (
          <path
            d={`M1470,300 C1470,${permTarget.y} ${permTarget.x - 60},${permTarget.y} ${permTarget.x - 14},${permTarget.y}`}
            markerEnd="url(#conn-arrow)"
            className={cx(styles.callout, styles.calloutIn)}
          />
        )}
        {risks && (
          <path
            d={`M330,316 C420,316 ${riskTarget.x - 140},${riskTarget.y + 20} ${riskTarget.x - NODE_R - 14},${riskTarget.y + 6}`}
            markerEnd="url(#conn-arrow-risk)"
            className={cx(styles.callout, styles.calloutRisk, styles.calloutIn)}
          />
        )}
      </svg>

      {permissions && (
        <p className={cx(styles.calloutText, styles.calloutPermission)}>
          <Rich text={t(TEXT.permissionCallout)} />
        </p>
      )}
      {risks && (
        <p className={cx(styles.calloutText, styles.calloutRiskText)}>
          <Rich text={t(TEXT.riskCallout)} />
        </p>
      )}

      <div className={styles.hub} style={{ left: CENTER.x - HUB_R, top: CENTER.y - HUB_R, width: HUB_R * 2, height: HUB_R * 2 }}>
        <CapIcon name="chat" size={64} strokeWidth={1.6} />
        <span className={styles.hubLabel}><Rich text={t(TEXT.hub)} /></span>
      </div>

      {CONNECTORS.map((c, i) => {
        const p = pos(i);
        return (
          <div
            key={c.id}
            className={cx(styles.node, i < shown && styles.nodeOn, c === current && styles.nodeCurrent, risks && c.risk && styles.nodeRisky)}
            style={{ left: p.x, top: p.y }}
            aria-hidden={i >= shown}
          >
            <span className={styles.disc}>
              <CapIcon name={c.icon} size={46} strokeWidth={1.7} />
            </span>
            {permissions && (
              <span
                className={cx(styles.switch, risks && c.risk && styles.switchRisky)}
                style={{ left: switchOffset(p).dx - SWITCH.w / 2, top: switchOffset(p).dy - SWITCH.h / 2, width: SWITCH.w, height: SWITCH.h }}
              >
                <span className={styles.knob} />
              </span>
            )}
            <span className={styles.label}>
              <Rich text={t(c.label)} />
              {risks && c.risk && (
                <span className={styles.riskTag}>
                  <Rich text={t(c.risk)} />
                </span>
              )}
            </span>
          </div>
        );
      })}

      <footer className={styles.band} key={current?.id ?? (risks ? "risk" : permissions ? "permission" : "alone")}>
        {permissions ? (
          <>
            <p className={styles.example}><Rich text={t(risks ? TEXT.risk : TEXT.permission)} /></p>
            <p className={styles.aloneSub}><Rich text={t(risks ? TEXT.riskSub : TEXT.permissionSub)} /></p>
          </>
        ) : current ? (
          <>
            <p className={styles.example}>
              <span className={styles.quote}>{locale === "fr" ? "«\u00a0" : "\u201c"}</span>
              <Rich text={t(current.example)} />
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
            <p className={styles.example}><Rich text={t(TEXT.alone)} /></p>
            <p className={styles.aloneSub}><Rich text={t(TEXT.aloneSub)} /></p>
          </>
        )}
      </footer>
    </div>
  );
}
