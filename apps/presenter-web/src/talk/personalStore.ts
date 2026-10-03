import { useCallback, useSyncExternalStore } from "react";
import type { PresentationDefinition } from "@ai-exhibit/presentation-core";
import { EMPTY_CONFIG, isEmptyConfig, parseConfig, serializeConfig, talkCodes, type PersonalConfig } from "./personal.ts";

/**
 * Personal configs live in localStorage, one per talk: every window of the
 * browser profile (presenter, projector, rehearsal, overview) reads the same
 * key, and the `storage` event carries a change to the other windows.
 */
export function personalKey(talkId: string): string {
  return `ai-exhibit:personal:${talkId}`;
}

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; config: PersonalConfig }>();

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The stored config for a talk, or the empty one. Stable while storage is unchanged. */
export function readPersonalConfig(presentation: PresentationDefinition): PersonalConfig {
  const key = personalKey(presentation.id);
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.config;
  let config = EMPTY_CONFIG;
  if (raw) {
    const parsed = parseConfig(raw, presentation.id, talkCodes(presentation));
    if (parsed.ok) config = parsed.config;
  }
  cache.set(key, { raw, config });
  return config;
}

export function writePersonalConfig(presentation: PresentationDefinition, config: PersonalConfig): void {
  const key = personalKey(presentation.id);
  try {
    if (isEmptyConfig(config)) localStorage.removeItem(key);
    else localStorage.setItem(key, serializeConfig(config, presentation.id));
  } catch {
    // storage unavailable: the change lasts until reload, in this window only
    cache.set(key, { raw: readRaw(key), config });
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith("ai-exhibit:personal:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The talk's personal config, live across windows, and a setter that persists it. */
export function usePersonalConfig(presentation: PresentationDefinition): [PersonalConfig, (config: PersonalConfig) => void] {
  const config = useSyncExternalStore(subscribe, () => readPersonalConfig(presentation));
  const set = useCallback((next: PersonalConfig) => writePersonalConfig(presentation, next), [presentation]);
  return [config, set];
}
