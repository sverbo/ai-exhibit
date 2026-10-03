// Same contract as learning/shared/sceneState.ts, kept local so the two areas evolve independently.
import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneContext } from "../contract.ts";

type Update<S> = S | ((prev: S) => S);

export interface SceneStateOptions {
  /** Minimum delay between two published states, in ms. The last update is always published. */
  throttleMs?: number;
}

/**
 * Shared scene state with one source of truth per role.
 *
 * - controller: keeps a local copy (so input stays responsive), restores it from
 *   `ctx.state` when the scene is revisited, publishes every change with
 *   `ctx.setState` (optionally throttled) and starts over when the session resets
 *   the scene (state goes from defined to undefined).
 * - display / preview: read `ctx.state`, falling back to `initial()`; the setter is a no-op.
 */
export function useSceneState<S>(
  ctx: SceneContext<S>,
  initial: () => S,
  options: SceneStateOptions = {},
): [S, (next: Update<S>) => void] {
  const isController = ctx.role === "controller";
  const [local, setLocal] = useState<S>(() => (ctx.state as S | undefined) ?? initial());
  const localRef = useRef(local);
  localRef.current = local;

  const setStateRef = useRef(ctx.setState);
  setStateRef.current = ctx.setState;
  const throttleMs = options.throttleMs ?? 0;
  const lastPublish = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publish = useCallback(
    (value: S, force = false) => {
      if (pending.current) {
        clearTimeout(pending.current);
        pending.current = null;
      }
      const now = Date.now();
      const wait = throttleMs - (now - lastPublish.current);
      if (force || wait <= 0) {
        lastPublish.current = now;
        setStateRef.current(value);
        return;
      }
      pending.current = setTimeout(() => {
        pending.current = null;
        lastPublish.current = Date.now();
        setStateRef.current(localRef.current);
      }, wait);
    },
    [throttleMs],
  );

  // Publish the initial state once so followers have something to render.
  useEffect(() => {
    if (isController && ctx.state === undefined) publish(localRef.current, true);
    return () => {
      if (pending.current) {
        clearTimeout(pending.current);
        // Flush the last value so a follower never stays one update behind.
        setStateRef.current(localRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isController]);

  // Reset detection: the session cleared this scene's state (R key).
  const prevCtxState = useRef(ctx.state);
  useEffect(() => {
    const prev = prevCtxState.current;
    prevCtxState.current = ctx.state;
    if (isController && prev !== undefined && ctx.state === undefined) {
      const fresh = initial();
      localRef.current = fresh;
      setLocal(fresh);
      publish(fresh, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.state, isController]);

  const update = useCallback(
    (next: Update<S>) => {
      if (!isController) return;
      const value =
        typeof next === "function" ? (next as (prev: S) => S)(localRef.current) : next;
      localRef.current = value;
      setLocal(value);
      publish(value);
    },
    [isController, publish],
  );

  if (!isController) return [(ctx.state as S | undefined) ?? local, update];
  return [local, update];
}

/** Calls `fn` whenever `step` changes after mount (not on the first render). */
export function useOnStepChange(step: number, fn: (step: number, prev: number) => void): void {
  const prev = useRef(step);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (prev.current !== step) {
      const p = prev.current;
      prev.current = step;
      fnRef.current(step, p);
    }
  }, [step]);
}
