/**
 * The "Try it" tab's quota, counted on the phone (docs/specs/2026-10-04-audience-play.md):
 * per demo, the times of its live asks in the last hour, kept in localStorage
 * under ASKS_KEY. It guides honest use; clearing the browser's storage or a
 * private window resets it, and the Hugging Face spending limit stays the
 * real safeguard.
 */
export const ASKS_KEY = "ai-exhibit:asks";
export const ASKS_PER_HOUR = 10;
const HOUR = 3_600_000;

/** Per demo, the times (ms) of its asks. Nothing else. */
export type AskLog = Record<string, number[]>;

type Store = Pick<Storage, "getItem" | "setItem">;

export interface AskQuota {
  /** Asks left for a demo: ASKS_PER_HOUR minus its asks in the last hour. */
  left(demo: string): number;
  /** Counts one ask for a demo now. */
  spend(demo: string): void;
  /** When the next ask of a spent demo frees up (ms), or null when none is spent. */
  nextFree(): number | null;
}

function safeStorage(): Store | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * A quota on `storage` (default: localStorage). If storage fails (private
 * mode, quota, disabled), the counts live in memory for this page.
 */
export function createAskQuota(storage: Store | null = safeStorage(), now: () => number = Date.now): AskQuota {
  let memory: AskLog = {};
  // Once storage fails, the counts stay in memory for this page.
  let useStorage = Boolean(storage);

  const parse = (raw: string | null): AskLog => {
    if (!raw) return {};
    try {
      const v = JSON.parse(raw) as unknown;
      if (!v || typeof v !== "object" || Array.isArray(v)) return {};
      const out: AskLog = {};
      for (const [k, list] of Object.entries(v)) {
        if (Array.isArray(list)) out[k] = list.filter((t): t is number => typeof t === "number" && Number.isFinite(t));
      }
      return out;
    } catch {
      return {};
    }
  };

  /** Drops asks older than an hour, and empty demos. */
  const prune = (log: AskLog): AskLog => {
    const since = now() - HOUR;
    const out: AskLog = {};
    for (const [k, list] of Object.entries(log)) {
      const kept = list.filter((t) => t > since);
      if (kept.length) out[k] = kept;
    }
    return out;
  };

  const write = (log: AskLog) => {
    memory = log;
    if (!useStorage) return;
    try {
      storage!.setItem(ASKS_KEY, JSON.stringify(log));
    } catch {
      useStorage = false;
    }
  };

  /** Every read prunes and writes the pruned log back. */
  const read = (): AskLog => {
    let log = memory;
    if (useStorage) {
      try {
        log = parse(storage!.getItem(ASKS_KEY));
      } catch {
        useStorage = false;
      }
    }
    const pruned = prune(log);
    write(pruned);
    return pruned;
  };

  return {
    left: (demo) => Math.max(0, ASKS_PER_HOUR - (read()[demo]?.length ?? 0)),
    spend: (demo) => {
      const log = read();
      write({ ...log, [demo]: [...(log[demo] ?? []), now()] });
    },
    nextFree: () => {
      const spent = Object.values(read()).filter((list) => list.length >= ASKS_PER_HOUR);
      if (!spent.length) return null;
      return Math.min(...spent.map((list) => Math.min(...list))) + HOUR;
    },
  };
}
