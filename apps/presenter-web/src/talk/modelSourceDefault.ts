import { useEffect, useState } from "react";
import { cloudStatus, getAccessCode } from "@ai-exhibit/ml-runtime/lm";
import type { ModelSource } from "@ai-exhibit/scene-components";
import { DEFAULT_MODEL_SOURCE } from "./shell.ts";

/**
 * Default model source when the presenter has not chosen one, wherever the
 * app is served (local runtime or Vercel): Hugging Face when the server has a
 * token (and no access code is needed, or this browser has it), else
 * Simulation.
 */
export async function detectDefaultModelSource(): Promise<ModelSource> {
  try {
    const s = await cloudStatus({ accessCode: null, timeoutMs: 8000 });
    const usable = s.configured && s.reachable !== false && (!s.codeRequired || Boolean(getAccessCode()));
    return usable ? "hf" : "simulation";
  } catch {
    return "simulation";
  }
}

let detected: Promise<ModelSource> | null = null;
let known: ModelSource | null = null;

/** Asked once per page; the presenter's explicit choice (shell.modelSource) always wins over it. */
export function useDefaultModelSource(): ModelSource {
  const [value, setValue] = useState<ModelSource>(() => known ?? DEFAULT_MODEL_SOURCE);
  useEffect(() => {
    let alive = true;
    detected ??= detectDefaultModelSource().then((v) => (known = v));
    detected.then((v) => alive && setValue(v));
    return () => {
      alive = false;
    };
  }, []);
  return value;
}
