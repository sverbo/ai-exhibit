/**
 * Recorded data of the language scenes, loaded lazily (bundled with the app,
 * so Simulation works with no server and no network), and the notices a scene
 * shows when it plays recorded data.
 */
import { useEffect, useState } from "react";
import type { TokenizationRecordingFile } from "@ai-exhibit/ml-runtime/lm";
import type { COPY } from "./copy.ts";

export type NoticeKey = keyof Pick<
  typeof COPY,
  "failed" | "fallback" | "notRecorded" | "replayGreedy" | "sampleOnRecorded" | "noRefusal" | "simulationPresetsOnly"
>;

/* ---------------------------------------------------------------------------- */
/* Recordings: dynamic imports so each JSON is its own chunk, fetched on demand. */

function lazyJson<T>(load: () => Promise<{ default: unknown }>) {
  let promise: Promise<T> | null = null;
  let value: T | null = null;
  const get = () => {
    promise ??= load().then((m) => {
      value = m.default as T;
      return value;
    });
    return promise;
  };
  return function useLazyJson(): T | null {
    const [v, setV] = useState<T | null>(value);
    useEffect(() => {
      if (value) return;
      let alive = true;
      get().then(
        (x) => alive && setV(x),
        () => {},
      );
      return () => {
        alive = false;
      };
    }, []);
    return v;
  };
}

export const useTokenizationRecording = lazyJson<TokenizationRecordingFile>(
  () => import("@ai-exhibit/content/assets/recordings/tokenizations.json"),
);

export const useGpt2Answers = lazyJson<import("@ai-exhibit/content/assets/then-and-now/questions.ts").Gpt2AnswersFile>(
  () => import("@ai-exhibit/content/assets/then-and-now/gpt2-answers.json"),
);

export const useCloudRecording = lazyJson<import("@ai-exhibit/ml-runtime/lm").CloudRecordingFile>(
  () => import("@ai-exhibit/content/assets/recordings/cloud.json"),
);
export const useLlamaTemplate = lazyJson<import("@ai-exhibit/ml-runtime/lm").ChatTemplateFile>(
  () => import("@ai-exhibit/content/assets/recordings/llama-3.1-8b-instruct.chat-template.json"),
);
