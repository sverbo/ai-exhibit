/**
 * Session client used by every view: a BroadcastChannel shared by the windows
 * of one browser profile (presenter, projector, rehearsal). There is no
 * server. A new window asks the others for their state; controllers apply
 * commands locally and post the new state.
 *
 * Presence: each window announces itself ("here", then every second), holds a
 * Web Lock while it lives and says "bye" when it closes, so every window knows
 * who else is in the session (see stage.ts).
 *
 * Everything environment-specific (BroadcastChannel, Web Locks) is injectable
 * so the client runs under Node in tests.
 */

import { applyCommand, canSend, isControllerRole } from "./reducer.ts";
import { isSessionState } from "./validate.ts";
import type {
  ClientRole,
  ClientSummary,
  ConnectionStatus,
  SessionClient,
  SessionCommand,
  SessionState,
  SessionTransport,
} from "./types.ts";

export const DEFAULT_SESSION_ID = "main";

/** The subset of the BroadcastChannel API the client uses. */
export interface BroadcastChannelLike {
  postMessage(message: unknown): void;
  close(): void;
  onmessage: ((ev: { data: unknown }) => void) | null;
}
export type BroadcastChannelCtor = new (name: string) => BroadcastChannelLike;

/** The subset of the Web Locks API used to know which windows are still alive. */
export interface LocksLike {
  request(name: string, callback: () => Promise<unknown>): Promise<unknown>;
  query(): Promise<{ held?: { name?: string }[] }>;
}

export interface ConnectSessionOptions {
  role: ClientRole;
  sessionId?: string;
  /** Starts the session when no other window answers. */
  initialState: () => SessionState;
  /** Injected constructor; defaults to the global. Null: no other window can be reached. */
  BroadcastChannelImpl?: BroadcastChannelCtor | null;
  clientId?: string;
  /** How long each snapshot request waits (default 300 ms). */
  snapshotTimeoutMs?: number;
  /** BroadcastChannel presence: announce interval (default 1000 ms). */
  presenceMs?: number;
  /**
   * A silent window is forgotten after this long (default 90 s). Long on
   * purpose: browsers run timers of hidden tabs as rarely as once a minute,
   * and a closing window says "bye" anyway.
   */
  presenceTimeoutMs?: number;
  /**
   * Web Locks (default: navigator.locks). Each window holds a lock while it
   * lives; the browser releases it the moment the window closes or crashes,
   * even when no "bye" got out, so the others notice within a second.
   */
  locks?: LocksLike | null;
}

/** BroadcastChannel wire messages. */
type ChannelMessage =
  | { t: "req"; from: string; attempt: number }
  | { t: "snap"; from: string; to: string; state: SessionState }
  | { t: "state"; from: string; state: SessionState }
  | { t: "bye"; from: string }
  | { t: "here"; from: string; role: ClientRole; since: number; hidden?: boolean; ask?: boolean };

const KNOWN_ROLES: readonly ClientRole[] = ["projector", "presenter", "solo"];

function randomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function connectSession(opts: ConnectSessionOptions): SessionClient {
  return new BroadcastSessionClient(opts);
}

class BroadcastSessionClient implements SessionClient {
  readonly role: ClientRole;
  readonly clientId: string;
  private readonly sessionId: string;
  private readonly opts: ConnectSessionOptions;
  private readonly BC: BroadcastChannelCtor | null;

  private transport: SessionTransport | null = null;
  private status: ConnectionStatus = "connecting";
  private closed = false;
  private listeners = new Set<() => void>();
  private clients: ClientSummary[] = [];

  /** The session as this window knows it. */
  private local: SessionState | null = null;
  /** Commands dispatched before the session was resolved. */
  private pending: SessionCommand[] = [];

  private channel: BroadcastChannelLike | null = null;
  private latestWriter: string | null = null;
  private snapshots: { from: string; state: SessionState }[] = [];
  private snapshotTimer: ReturnType<typeof setTimeout> | null = null;
  /** BroadcastChannel presence: other windows, by id. */
  private peers = new Map<string, { role: ClientRole; since: number; hidden: boolean; seen: number }>();
  private readonly since = Date.now();
  /** This window is not visible (background tab, minimised): it tells the others, so a visible one runs the stage. */
  private hidden = isDocumentHidden();
  private readonly onVisibility = () => {
    const hidden = isDocumentHidden();
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    this.here();
    this.refreshClients();
    this.notify();
  };
  private presenceTimer: ReturnType<typeof setInterval> | null = null;
  private presenceReadyTimer: ReturnType<typeof setTimeout> | null = null;
  private presenceKnown = false;
  private readonly locks: LocksLike | null;
  private releaseLock: (() => void) | null = null;
  private readonly onPageHide = () => {
    // The tab is closing: React cleanups may not run, so say goodbye now.
    this.post({ t: "bye", from: this.clientId });
  };

  constructor(opts: ConnectSessionOptions) {
    this.opts = opts;
    this.role = opts.role;
    this.clientId = opts.clientId ?? randomId();
    this.sessionId = opts.sessionId ?? DEFAULT_SESSION_ID;
    const g = globalThis as { BroadcastChannel?: BroadcastChannelCtor };
    this.BC = opts.BroadcastChannelImpl === undefined ? (g.BroadcastChannel ?? null) : opts.BroadcastChannelImpl;
    const nav = (globalThis as { navigator?: { locks?: LocksLike } }).navigator;
    this.locks = opts.locks === undefined ? (nav?.locks ?? null) : opts.locks;

    (globalThis as { addEventListener?: (t: string, f: () => void) => void }).addEventListener?.("pagehide", this.onPageHide);
    (globalThis as { document?: { addEventListener?: (t: string, f: () => void) => void } }).document?.addEventListener?.("visibilitychange", this.onVisibility);
    this.startBroadcast();
  }

  // ---------------------------------------------------------------- public API

  getState(): SessionState | null {
    return this.local;
  }
  getStatus(): ConnectionStatus {
    return this.status;
  }
  getTransport(): SessionTransport | null {
    return this.transport;
  }
  canControl(): boolean {
    return isControllerRole(this.role);
  }
  getClients(): ClientSummary[] {
    return this.clients;
  }
  presenceReady(): boolean {
    return this.presenceKnown;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(command: SessionCommand): void {
    if (this.closed || !canSend(this.role, command) || !this.channel) return;
    if (!this.local) {
      this.pending.push(command);
      return;
    }
    const next = applyCommand(this.local, command, this.role);
    if (next === this.local) return;
    this.local = next;
    this.latestWriter = this.clientId;
    this.post({ t: "state", from: this.clientId, state: next });
    this.notify();
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearTimers();
    this.stopPresence();
    (globalThis as { removeEventListener?: (t: string, f: () => void) => void }).removeEventListener?.("pagehide", this.onPageHide);
    (globalThis as { document?: { removeEventListener?: (t: string, f: () => void) => void } }).document?.removeEventListener?.("visibilitychange", this.onVisibility);
    if (this.channel) {
      this.post({ t: "bye", from: this.clientId });
      this.channel.onmessage = null;
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }

  // ---------------------------------------------------------- BroadcastChannel

  private startBroadcast(): void {
    if (this.closed) return;
    if (!this.BC) {
      this.transport = null;
      this.setStatus("offline");
      return;
    }
    this.transport = "broadcast";
    this.channel = new this.BC(`ai-exhibit:${this.sessionId}`);
    this.channel.onmessage = (ev) => this.onChannelMessage(ev.data);
    this.startPresence();
    this.requestSnapshot(0);
    this.notify();
  }

  private here(ask = false): void {
    this.post({ t: "here", from: this.clientId, role: this.role, since: this.since, ...(this.hidden ? { hidden: true } : {}), ...(ask ? { ask: true } : {}) });
  }

  private startPresence(): void {
    this.stopPresence();
    this.presenceKnown = false;
    this.refreshClients();
    this.here(true);
    this.holdLock();
    const every = this.opts.presenceMs ?? 1000;
    const timeout = this.opts.presenceTimeoutMs ?? 90_000;
    this.presenceTimer = setInterval(() => {
      this.here();
      const now = Date.now();
      let changed = false;
      for (const [id, p] of this.peers) {
        if (now - p.seen > timeout) {
          this.peers.delete(id);
          changed = true;
        }
      }
      if (changed) {
        this.refreshClients();
        this.notify();
      }
      void this.dropDeadPeers(every * 2);
    }, every);
    // Every window answers "ask" at once: a short wait is enough to know who is here.
    this.presenceReadyTimer = setTimeout(() => {
      this.presenceReadyTimer = null;
      this.presenceKnown = true;
      this.notify();
    }, Math.min(400, every));
  }

  private lockName(clientId: string): string {
    return `ai-exhibit:${this.sessionId}:window:${clientId}`;
  }

  private holdLock(): void {
    if (!this.locks || this.releaseLock) return;
    const held = new Promise<void>((resolve) => {
      this.releaseLock = resolve;
    });
    this.locks.request(this.lockName(this.clientId), () => held).catch(() => {});
  }

  /** Forgets peers whose window lock is gone (closed or crashed tab), once they are old enough to hold one. */
  private async dropDeadPeers(graceMs: number): Promise<void> {
    if (!this.locks || this.peers.size === 0) return;
    let held: Set<string>;
    try {
      const snapshot = await this.locks.query();
      held = new Set((snapshot.held ?? []).map((l) => l.name ?? ""));
    } catch {
      return;
    }
    if (this.closed) return;
    const now = Date.now();
    let changed = false;
    for (const [id, p] of this.peers) {
      if (now - p.since > graceMs && !held.has(this.lockName(id))) {
        this.peers.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.refreshClients();
      this.notify();
    }
  }

  private stopPresence(): void {
    this.releaseLock?.();
    this.releaseLock = null;
    if (this.presenceTimer) clearInterval(this.presenceTimer);
    if (this.presenceReadyTimer) clearTimeout(this.presenceReadyTimer);
    this.presenceTimer = null;
    this.presenceReadyTimer = null;
    this.peers.clear();
  }

  /** Client list from BroadcastChannel presence: this window and its peers, oldest first. */
  private refreshClients(): void {
    const all: ClientSummary[] = [
      { clientId: this.clientId, role: this.role, since: this.since, ...(this.hidden ? { hidden: true } : {}) },
      ...[...this.peers].map(([clientId, p]) => ({ clientId, role: p.role, since: p.since, ...(p.hidden ? { hidden: true } : {}) })),
    ];
    all.sort((a, b) => a.since! - b.since! || (a.clientId < b.clientId ? -1 : a.clientId > b.clientId ? 1 : 0));
    this.clients = all;
  }

  private post(msg: ChannelMessage): void {
    try {
      this.channel?.postMessage(msg);
    } catch {
      // channel closed
    }
  }

  private requestSnapshot(attempt: number): void {
    this.snapshots = [];
    this.post({ t: "req", from: this.clientId, attempt });
    const wait = this.opts.snapshotTimeoutMs ?? 300;
    this.snapshotTimer = setTimeout(() => {
      this.snapshotTimer = null;
      if (this.closed || this.local) return;
      const best = this.bestSnapshot();
      if (best) {
        this.adopt(best.state, best.from);
        return;
      }
      if (attempt === 0) {
        // The most recent writer did not answer: ask everyone holding state.
        this.requestSnapshot(1);
      } else if (this.canControl()) {
        // Nobody else is here: start the session.
        this.adopt(this.opts.initialState(), this.clientId);
        this.post({ t: "state", from: this.clientId, state: this.local! });
      } else {
        // Followers wait for a controller, asking again now and then.
        this.snapshotTimer = setTimeout(() => {
          this.snapshotTimer = null;
          if (!this.local) this.requestSnapshot(1);
        }, 2000);
      }
    }, wait);
  }

  private bestSnapshot(): { from: string; state: SessionState } | null {
    let best: { from: string; state: SessionState } | null = null;
    for (const s of this.snapshots) {
      if (!best || s.state.version > best.state.version || (s.state.version === best.state.version && s.from > best.from)) {
        best = s;
      }
    }
    return best;
  }

  private adopt(state: SessionState, writer: string): void {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = null;
    this.local = state;
    this.latestWriter = writer;
    this.status = "open";
    // Commands dispatched before the session was resolved.
    const queued = this.pending;
    this.pending = [];
    let changed = false;
    for (const p of queued) {
      const next = applyCommand(this.local, p, this.role);
      if (next !== this.local) {
        this.local = next;
        changed = true;
      }
    }
    if (changed) {
      this.latestWriter = this.clientId;
      this.post({ t: "state", from: this.clientId, state: this.local });
    }
    this.notify();
  }

  private onChannelMessage(data: unknown): void {
    if (this.closed || typeof data !== "object" || data === null) return;
    const msg = data as ChannelMessage;
    if (msg.from === this.clientId || typeof msg.from !== "string") return;
    switch (msg.t) {
      case "req": {
        if (!this.local) return;
        const answer = msg.attempt >= 1 || this.latestWriter === this.clientId;
        if (answer) this.post({ t: "snap", from: this.clientId, to: msg.from, state: this.local });
        return;
      }
      case "snap":
        if (msg.to === this.clientId && !this.local && isSessionState(msg.state)) {
          this.snapshots.push({ from: msg.from, state: msg.state });
        }
        return;
      case "state": {
        if (!isSessionState(msg.state)) return;
        const cur = this.local;
        const newer =
          !cur ||
          msg.state.version > cur.version ||
          (msg.state.version === cur.version && msg.from > this.clientId);
        if (!newer) return;
        if (!cur) {
          this.adopt(msg.state, msg.from);
          return;
        }
        this.local = msg.state;
        this.latestWriter = msg.from;
        this.notify();
        return;
      }
      case "bye":
        if (this.latestWriter === msg.from) this.latestWriter = null;
        if (this.peers.delete(msg.from)) {
          this.refreshClients();
          this.notify();
        }
        return;
      case "here": {
        if (!(KNOWN_ROLES as readonly string[]).includes(msg.role) || typeof msg.since !== "number") return;
        const known = this.peers.get(msg.from);
        const hidden = msg.hidden === true;
        this.peers.set(msg.from, { role: msg.role, since: msg.since, hidden, seen: Date.now() });
        if (msg.ask) this.here();
        if (!known || known.role !== msg.role || known.since !== msg.since || known.hidden !== hidden) {
          this.refreshClients();
          this.notify();
        }
        return;
      }
    }
  }

  // ------------------------------------------------------------------ helpers

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.notify();
  }

  private notify(): void {
    for (const l of [...this.listeners]) {
      try {
        l();
      } catch (err) {
        console.error(err);
      }
    }
  }

  private clearTimers(): void {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = null;
  }
}

/** True when this page is not visible (no document outside a browser: visible). */
function isDocumentHidden(): boolean {
  const d = (globalThis as { document?: { visibilityState?: string } }).document;
  return d?.visibilityState === "hidden";
}
