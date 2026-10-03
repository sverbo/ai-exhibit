import { tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import type { KeyboardEvent, MouseEvent } from "react";
import type { SceneComponentProps } from "../../contract.ts";
import { useSceneState, useOnStepChange } from "../../learning/shared/sceneState.ts";
import { SceneButton, SceneHeading, cx, l, type L10n } from "../../learning/shared/ui.tsx";
import { Icon } from "../shared/icons.tsx";
import {
  CAPABILITIES,
  PERMISSIONS,
  PERMISSION_INFO,
  REQUESTS,
  available,
  grantedAtStep,
  toggle,
  type Permission,
} from "./capabilities.ts";
import styles from "./PermissionsBoard.module.css";

export type PermissionsMode = "permissions" | "approval";

export interface PermissionsBoardProps {
  mode?: PermissionsMode;
  heading?: L10n;
}

export interface PermissionsState {
  granted: Permission[];
  /** Approval mode: index of the request on screen. */
  request: number;
  /** Decision taken on the request on screen, if any. */
  decision: "approved" | "denied" | null;
}

const TEXT = {
  heading: {
    permissions: { en: "What we allow it to do" },
    approval: { en: "Keeping a hand on the wheel" },
  } satisfies Record<PermissionsMode, L10n>,
  sub: {
    permissions: { en: "The same agent. Only its access changes." },
    approval0: { en: "Everything is allowed, and everything happens without asking." },
    approval1: { en: "Risky actions go through a person first." },
  },
  access: { en: "Access given to the agent" },
  can: { en: "What it can do" },
  count: (n: number, r: number): L10n => ({
    fr: `${n} action${n > 1 ? "s" : ""}, dont ${r} risquée${r > 1 ? "s" : ""}`,
    en: `${n} action${n > 1 ? "s" : ""}, ${r} of them risky`,
  }),
  risky: { en: "risky" },
  auto: { en: "without asking" },
  gated: { en: "with your approval" },
  combo: { en: "combination" },
  pending: { en: "The agent asks" },
  approve: l("Approuver", "Approve"),
  deny: { en: "Deny" },
  nextRequest: { en: "Next request" },
  needsAccess: { en: "This access is off: the agent cannot even ask." },
};

const NAV_KEYS = new Set([" ", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"]);

export function PermissionsBoard({ props, ctx }: SceneComponentProps<PermissionsBoardProps, PermissionsState>) {
  const mode: PermissionsMode = props.mode === "approval" ? "approval" : "permissions";
  const { locale, revealStep, role } = ctx;
  const isController = role === "controller";
  const t = (x: L10n) => tr(x, locale);

  const initialGranted = (step: number) => (mode === "approval" ? [...PERMISSIONS] : grantedAtStep(step));
  const [state, setState] = useSceneState<PermissionsState>(ctx, () => ({
    granted: initialGranted(revealStep),
    request: 0,
    decision: null,
  }));

  // In "permissions" mode, each reveal step grants the next access (the presenter can still toggle).
  useOnStepChange(revealStep, (step) => {
    if (isController && mode === "permissions") setState((s) => ({ ...s, granted: grantedAtStep(step) }));
  });

  const gate = mode === "approval" && revealStep >= 1;
  const granted = state.granted.filter((p) => PERMISSIONS.includes(p));
  const can = new Set(available(granted).map((c) => c.id));
  const riskyCount = CAPABILITIES.filter((c) => can.has(c.id) && c.risky).length;
  const request = REQUESTS[state.request % REQUESTS.length]!;
  const requestBlocked = !granted.includes(request.needs);

  const onToggle = (p: Permission) => setState((s) => ({ ...s, granted: toggle(s.granted, p) }));

  return (
    <div className={styles.root}>
      <SceneHeading sub={t(mode === "permissions" ? TEXT.sub.permissions : gate ? TEXT.sub.approval1 : TEXT.sub.approval0)}>
        <Rich text={t(props.heading ?? TEXT.heading[mode])} />
      </SceneHeading>

      <div className={cx(styles.body, gate && styles.withGate)}>
        <section className={styles.switches} aria-label={t(TEXT.access)}>
          <h3 className={styles.colTitle}><Rich text={t(TEXT.access)} /></h3>
          {PERMISSIONS.map((p) => {
            const on = granted.includes(p);
            return (
              <button
                key={p}
                type="button"
                role="switch"
                aria-checked={on}
                disabled={!isController}
                className={cx(styles.switchRow, on && styles.switchOn)}
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  onToggle(p);
                  if (e.detail > 0) e.currentTarget.blur();
                }}
                onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                  if (NAV_KEYS.has(e.key)) {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
              >
                <Icon name={PERMISSION_INFO[p].icon} size={40} className={styles.switchIcon} />
                <span className={styles.switchLabel}><Rich text={t(PERMISSION_INFO[p].label)} /></span>
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.knob} />
                </span>
              </button>
            );
          })}
        </section>

        <section className={styles.caps}>
          <div className={styles.capsHead}>
            <h3 className={styles.colTitle}><Rich text={t(TEXT.can)} /></h3>
            <span className={styles.count}><Rich text={t(TEXT.count(can.size, riskyCount))} /></span>
          </div>
          <ul className={styles.capList}>
            {CAPABILITIES.map((c) => {
              const on = can.has(c.id);
              return (
                <li key={c.id} className={cx(styles.cap, on && styles.capOn, on && c.risky && styles.capRisky, on && c.risky && gate && styles.capGated)}>
                  <span className={styles.capIcons}>
                    {c.requires.length === 0 ? (
                      <Icon name="chat" size={26} />
                    ) : (
                      c.requires.map((p) => <Icon key={p} name={PERMISSION_INFO[p].icon} size={26} />)
                    )}
                  </span>
                  <span className={styles.capLabel}><Rich text={t(c.label)} /></span>
                  {on && c.risky && (
                    <span className={cx(styles.capTag, gate ? styles.tagGate : styles.tagRisk)}>
                      {gate && <Icon name="person" size={20} />}
                      <Rich text={t(gate ? TEXT.gated : mode === "approval" ? TEXT.auto : TEXT.risky)} />
                    </span>
                  )}
                  {c.requires.length > 1 && <span className={styles.combo}><Rich text={t(TEXT.combo)} /></span>}
                </li>
              );
            })}
          </ul>
        </section>

        {gate && (
          <section className={styles.gateCol}>
            <div className={cx(styles.request, state.decision && styles[state.decision])}>
              <span className={styles.reqLabel}>
                <Icon name="robot" size={28} /> <Rich text={t(TEXT.pending)} />
              </span>
              <p className={styles.reqAction}>
                <Icon name={PERMISSION_INFO[request.needs].icon} size={34} /> <Rich text={t(request.action)} />
              </p>
              {requestBlocked ? (
                <p className={styles.reqOutcome}><Rich text={t(TEXT.needsAccess)} /></p>
              ) : state.decision ? (
                <p className={styles.reqOutcome}>
                  <Icon name={state.decision === "approved" ? "check" : "cross"} size={28} />
                  <Rich text={t(state.decision === "approved" ? request.ifApproved : request.ifDenied)} />
                </p>
              ) : isController ? (
                <div className={styles.reqButtons}>
                  <SceneButton variant="primary" onClick={() => setState((s) => ({ ...s, decision: "approved" }))}>
                    <Rich text={t(TEXT.approve)} />
                  </SceneButton>
                  <SceneButton variant="danger" onClick={() => setState((s) => ({ ...s, decision: "denied" }))}>
                    <Rich text={t(TEXT.deny)} />
                  </SceneButton>
                </div>
              ) : (
                <p className={styles.reqWaiting}>
                  <Icon name="pause" size={24} /> <Rich text={t(TEXT.gated)} />
                </p>
              )}
            </div>
            {isController && (
              <SceneButton onClick={() => setState((s) => ({ ...s, request: (s.request + 1) % REQUESTS.length, decision: null }))}>
                <Rich text={t(TEXT.nextRequest)} />
              </SceneButton>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
