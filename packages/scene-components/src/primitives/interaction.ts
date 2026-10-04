/**
 * Interaction from any window (docs/specs/2026-10-04-interaction-anywhere.md).
 *
 * Every user action in a scene goes through `act`. On the window that runs the
 * stage it is handled at once; on another interactive window it becomes a
 * request that the stage owner handles, exactly once. Compute (model calls,
 * animations) therefore always runs in one window only.
 */
import { useCallback, useEffect, useRef } from "react";
import type { SceneContext } from "../contract.ts";

/** True when this window shows the scene's controls. */
export function canInteract<S>(ctx: SceneContext<S>): boolean {
  return ctx.role === "controller" || Boolean(ctx.interactive && ctx.role === "display" && ctx.sendRequest);
}

/**
 * Returns `act(action)`. `handle` runs on the stage owner only: for its own
 * actions and for each new request from another window. A request already
 * present when the owner mounted (a hand-over) is never replayed.
 */
export function useSceneActions<A, S = unknown>(ctx: SceneContext<S>, handle: (action: A) => void): (action: A) => void {
  const owner = ctx.role === "controller";
  const handleRef = useRef(handle);
  handleRef.current = handle;
  const seen = useRef(ctx.request?.id ?? null);

  useEffect(() => {
    if (!owner) return;
    const req = ctx.request;
    if (!req || req.id === seen.current) return;
    seen.current = req.id;
    handleRef.current(req.payload as A);
  }, [owner, ctx.request]);

  const sendRef = useRef(ctx.sendRequest);
  sendRef.current = ctx.sendRequest;
  const remote = !owner && Boolean(ctx.interactive);
  return useCallback(
    (action: A) => {
      if (owner) handleRef.current(action);
      else if (remote) sendRef.current?.(action);
    },
    [owner, remote],
  );
}
