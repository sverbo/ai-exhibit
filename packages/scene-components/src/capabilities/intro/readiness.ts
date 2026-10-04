import { useEffect, useState } from "react";
import { cloudStatus, getAccessCode, type CloudStatus } from "@ai-exhibit/ml-runtime/lm";
import type { ModelSource } from "../../contract.ts";
import { loadYouTubeApi } from "../video/youtube.ts";

/**
 * Is the talk ready to run its live parts? Two checks, asked again every
 * RECHECK_MS until they pass:
 * - the language demos: Simulation is always ready; Hugging Face is ready when
 *   the server says it is configured and reachable (and has the access code it
 *   needs);
 * - the opening video: the YouTube player script loaded.
 */
export const RECHECK_MS = 15_000;

export type Check = "pending" | "ok" | "failed";

export interface Readiness {
  models: Check;
  video: Check;
  /** The presenter chose Simulation: ready, with a discreet note. */
  simulation: boolean;
}

/** Pure: is the Hugging Face status good enough for the demos. */
export function cloudReady(status: CloudStatus, hasAccessCode: boolean): boolean {
  if (!status.configured || status.reachable !== true) return false;
  return !status.codeRequired || hasAccessCode;
}

export function isReady(r: Readiness): boolean {
  return r.models === "ok" && r.video === "ok";
}

/** Polls both checks while `enabled`; stops asking once a check passes. */
export function useReadiness(modelSource: ModelSource, enabled: boolean): Readiness {
  const simulation = modelSource !== "hf";
  const [models, setModels] = useState<Check>(simulation ? "ok" : "pending");
  const [video, setVideo] = useState<Check>("pending");

  useEffect(() => {
    if (!enabled) return;
    if (simulation) {
      setModels("ok");
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = () => {
      cloudStatus({ accessCode: null })
        .then((s) => cloudReady(s, Boolean(getAccessCode())))
        .catch(() => false)
        .then((ok) => {
          if (!alive) return;
          setModels(ok ? "ok" : "failed");
          if (!ok) timer = setTimeout(ask, RECHECK_MS);
        });
    };
    ask();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled, simulation]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = () => {
      loadYouTubeApi().then(
        () => alive && setVideo("ok"),
        () => {
          if (!alive) return;
          setVideo("failed");
          timer = setTimeout(ask, RECHECK_MS);
        },
      );
    };
    ask();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled]);

  return { models: simulation ? "ok" : models, video, simulation };
}
