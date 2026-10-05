/**
 * Who runs the stage. Several windows may show the current scene as its
 * controller (the presenter view, a solo or projector window acting alone):
 * only one of them may, or interactive scenes would compute twice (model
 * calls, animations, streamed answers). The rule is deterministic, so every
 * window reaches the same answer from the same client list:
 *
 * 0. a visible window wins over a hidden one (a background tab or a minimised
 *    window): browsers slow down its timers, and animations would freeze. When
 *    every window is hidden, the rules below apply to all of them;
 * 1. a presenter view wins over a solo window (the projector acting alone);
 * 2. between two of the same kind, the one that joined first wins (the client
 *    list is in joining order);
 * 3. ties (same join time) go to the smaller client id.
 *
 * The others render the scene as a display: they mirror the owner's state.
 */
import type { ClientRole, ClientSummary } from "./types.ts";

/** Roles that render the stage as its controller when they own it. */
export const STAGE_ROLES: readonly ClientRole[] = ["presenter", "solo"];

const RANK: Partial<Record<ClientRole, number>> = { presenter: 0, solo: 1 };

/** Client id of the window that runs the stage, or null when none is present. */
export function stageOwner(clients: readonly ClientSummary[]): string | null {
  const visible = clients.filter((c) => !c.hidden && RANK[c.role] !== undefined);
  return ownerAmong(visible.length ? visible : clients, clients);
}

function ownerAmong(candidates: readonly ClientSummary[], all: readonly ClientSummary[]): string | null {
  let best: { c: ClientSummary; i: number } | null = null;
  candidates.forEach((c) => {
    const i = all.indexOf(c);
    const rank = RANK[c.role];
    if (rank === undefined) return;
    if (!best) {
      best = { c, i };
      return;
    }
    const b: { c: ClientSummary; i: number } = best;
    const bestRank = RANK[b.c.role]!;
    if (rank !== bestRank) {
      if (rank < bestRank) best = { c, i };
      return;
    }
    const since = c.since ?? i;
    const bestSince = b.c.since ?? b.i;
    if (since < bestSince || (since === bestSince && c.clientId < b.c.clientId)) best = { c, i };
  });
  return (best as { c: ClientSummary } | null)?.c.clientId ?? null;
}

/** True when another stage window outranks `role` right now (used to show "linked to the presenter"). */
export function hasOtherStageWindow(clients: readonly ClientSummary[], selfId: string): boolean {
  return clients.some((c) => c.clientId !== selfId && STAGE_ROLES.includes(c.role));
}
