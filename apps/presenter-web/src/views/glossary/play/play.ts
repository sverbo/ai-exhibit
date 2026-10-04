/**
 * The Play tab's decisions (docs/specs/2026-10-04-audience-play.md): this
 * phone's device id for the audience budget, and whether the demos call the
 * live models or show recorded examples.
 */
import type { CloudStatus } from "@ai-exhibit/ml-runtime/lm";

const DEVICE_KEY = "ai-exhibit:device";
const DEVICE_ID = /^[A-Za-z0-9_-]{8,64}$/;
let memo: string | null = null;

function randomId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * A random id for this phone, made once and kept in localStorage: it only
 * lets the server give each phone its own small budget. Never personal data;
 * clearing the browser's storage makes a new one.
 */
export function deviceId(storage: Pick<Storage, "getItem" | "setItem"> | null = safeStorage()): string {
  if (memo) return memo;
  let id: string | null = null;
  try {
    id = storage?.getItem(DEVICE_KEY) ?? null;
  } catch {
    // storage unavailable
  }
  if (!id || !DEVICE_ID.test(id)) {
    id = randomId();
    try {
      storage?.setItem(DEVICE_KEY, id);
    } catch {
      // storage unavailable: this id lasts for this page only
    }
  }
  memo = id;
  return id;
}

/** Forgets the memoized id (tests). */
export function forgetDeviceId(): void {
  memo = null;
}

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Why the demos show recorded examples:
 * "no-token": the server has no Hugging Face token (Simulation);
 * "code": the server requires an access code, which phones do not have;
 * "offline": the server or Hugging Face cannot be reached;
 * "used-up": this phone's (or the room's) live answers for this hour are spent;
 * "failed": a live call failed.
 */
export type RecordedWhy = "no-token" | "code" | "offline" | "used-up" | "failed";

export type PlayMode = { mode: "checking" } | { mode: "live" } | { mode: "recorded"; why: RecordedWhy };

/** Live or recorded, from the audience status (null while asking, "error" when it failed) and what happened since. */
export function decidePlay(status: CloudStatus | null | "error", stopped: "used-up" | "failed" | null): PlayMode {
  if (stopped) return { mode: "recorded", why: stopped };
  if (status === null) return { mode: "checking" };
  if (status === "error") return { mode: "recorded", why: "offline" };
  if (!status.configured) return { mode: "recorded", why: "no-token" };
  if (status.reachable === false) return { mode: "recorded", why: "offline" };
  if (status.codeRequired) return { mode: "recorded", why: "code" };
  if (status.audience && status.audience.remaining <= 0) return { mode: "recorded", why: "used-up" };
  return { mode: "live" };
}
