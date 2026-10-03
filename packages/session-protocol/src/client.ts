/**
 * Session client used by every view. Tries the local-runtime WebSocket relay
 * first; when it is not reachable within `wsTimeoutMs`, falls back to a
 * BroadcastChannel shared by windows of the same browser profile, and keeps
 * retrying the relay in the background: a window opened while the runtime was
 * restarting must not stay cut off from the real session.
 *
 * Presence: the relay lists the connected windows; over the BroadcastChannel
 * each window announces itself ("here", then every second) and says "bye" when
 * it closes, so every window knows who else is in the session (see stage.ts).
 *
 * Everything environment-specific (WebSocket, BroadcastChannel, URL) is
 * injectable so the client runs under Node in tests.
 */

import { applyCommand, canSend, isControllerRole } from "./reducer.ts";
import { isSessionState, parseServerMessage } from "./validate.ts";
import type {
  ClientMessage,
  ClientRole,
  ClientSummary,
  ConnectionStatus,
  SessionClient,
  SessionCommand,
  SessionState,
  SessionTransport,
} from "./types.ts";

export const DEFAULT_SESSION_ID = "main";

/** The subset of the WebSocket API the client uses. */
export interface WebSocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
}
export type WebSocketCtor = new (url: string) => WebSocketLike;

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
  /** Presenter token, required for controller rights on the relay. */
  token?: string;
  sessionId?: string;
  /** Used to bootstrap a relay without state, or a BroadcastChannel session nobody answers. */
  initialState: () => SessionState;
  /** Defaults to ws(s)://<location.host>/session. */
  wsUrl?: string;
  /** Injected constructors; default to globals. Pass null to disable a transport. */
  WebSocketImpl?: WebSocketCtor | null;
  BroadcastChannelImpl?: BroadcastChannelCtor | null;
  clientId?: string;
  /** How long to wait for the relay before falling back (default 1500 ms). */
  wsTimeoutMs?: number;
  /** How long each BroadcastChannel snapshot request waits (default 300 ms). */
  snapshotTimeoutMs?: number;
  /** Ping interval; the socket is recycled after 3 silent intervals (default 5000 ms). */
  heartbeatMs?: number;
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
  | { t: "here"; from: string; role: ClientRole; since: number; ask?: boolean };

interface Pending {
  id: number;
  command: SessionCommand;
}

const WS_OPEN = 1;
const KNOWN_ROLES: readonly ClientRole[] = ["projector", "presenter", "solo", "remote", "audience"];
const MAX_BACKOFF_MS = 10_000;

function randomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultWsUrl(): string | null {
  const loc = (globalThis as { location?: { protocol: string; host: string } }).location;
  if (!loc?.host) return null;
  return `${loc.protocol === "https:" ? "wss" : "ws"}://${loc.host}/session`;
}

export function connectSession(opts: ConnectSessionOptions): SessionClient {
  return new HybridSessionClient(opts);
}

class HybridSessionClient implements SessionClient {
  readonly role: ClientRole;
  readonly clientId: string;
  private readonly sessionId: string;
  private readonly opts: ConnectSessionOptions;
  private readonly WS: WebSocketCtor | null;
  private readonly BC: BroadcastChannelCtor | null;
  private readonly wsUrl: string | null;

  private transport: SessionTransport | null = null;
  private status: ConnectionStatus = "connecting";
  private closed = false;
  private listeners = new Set<() => void>();
  private clients: ClientSummary[] = [];
  private controlGranted: boolean;

  /** Optimistic view shown to the app. */
  private local: SessionState | null = null;
  /** Last authoritative state from the relay (WebSocket mode). */
  private server: SessionState | null = null;
  private pending: Pending[] = [];
  private nextId = 1;

  private ws: WebSocketLike | null = null;
  private wsTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private attempts = 0;
  private lastSeen = 0;

  private channel: BroadcastChannelLike | null = null;
  private latestWriter: string | null = null;
  private snapshots: { from: string; state: SessionState }[] = [];
  private snapshotTimer: ReturnType<typeof setTimeout> | null = null;
  /** BroadcastChannel presence: other windows, by id. */
  private peers = new Map<string, { role: ClientRole; since: number; seen: number }>();
  private readonly since = Date.now();
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
    const g = globalThis as { WebSocket?: WebSocketCtor; BroadcastChannel?: BroadcastChannelCtor };
    this.WS = opts.WebSocketImpl === undefined ? (g.WebSocket ?? null) : opts.WebSocketImpl;
    this.BC = opts.BroadcastChannelImpl === undefined ? (g.BroadcastChannel ?? null) : opts.BroadcastChannelImpl;
    this.wsUrl = opts.wsUrl ?? defaultWsUrl();
    const nav = (globalThis as { navigator?: { locks?: LocksLike } }).navigator;
    this.locks = opts.locks === undefined ? (nav?.locks ?? null) : opts.locks;
    // Until the relay says otherwise, controllers act as controllers (optimistic queue).
    this.controlGranted = isControllerRole(this.role);

    (globalThis as { addEventListener?: (t: string, f: () => void) => void }).addEventListener?.("pagehide", this.onPageHide);
    if (this.WS && this.wsUrl) this.tryWebSocket(true);
    else this.startBroadcast();
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
    return this.controlGranted && isControllerRole(this.role);
  }
  getClients(): ClientSummary[] {
    return this.clients;
  }
  presenceReady(): boolean {
    return this.transport === "broadcast" ? this.presenceKnown : this.transport === "websocket" && this.status === "open";
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(command: SessionCommand): void {
    if (this.closed || !canSend(this.role, command)) return;

    if (this.role === "audience") {
      // Votes are never optimistic: only the relay knows who already voted.
      this.send({ kind: "command", command, id: this.nextId++ });
      return;
    }
    if (!this.canControl()) return;

    if (this.transport === "broadcast") {
      if (!this.local) {
        this.pending.push({ id: this.nextId++, command });
        return;
      }
      const next = applyCommand(this.local, command, this.role);
      if (next === this.local) return;
      this.local = next;
      this.latestWriter = this.clientId;
      this.post({ t: "state", from: this.clientId, state: next });
      this.notify();
      return;
    }

    // WebSocket mode, or transport still being chosen: queue + apply optimistically.
    const id = this.nextId++;
    this.pending.push({ id, command });
    if (this.local) {
      const next = applyCommand(this.local, command, this.role);
      if (next !== this.local) {
        this.local = next;
        this.notify();
      }
    }
    if (this.transport === "websocket" && this.status === "open") {
      this.send({ kind: "command", command, id });
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearTimers();
    this.stopPresence();
    (globalThis as { removeEventListener?: (t: string, f: () => void) => void }).removeEventListener?.("pagehide", this.onPageHide);
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      detach(ws);
      try {
        ws.close();
      } catch {
        // already closed
      }
    }
    if (this.channel) {
      this.post({ t: "bye", from: this.clientId });
      this.channel.onmessage = null;
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }

  // ---------------------------------------------------------------- WebSocket

  private tryWebSocket(first: boolean): void {
    if (this.closed || !this.WS || !this.wsUrl) return;
    let ws: WebSocketLike;
    try {
      ws = new this.WS(this.wsUrl);
    } catch {
      this.onSocketFailed(first);
      return;
    }
    this.ws = ws;
    let opened = false;

    if (first) {
      this.wsTimer = setTimeout(() => {
        this.wsTimer = null;
        if (opened || this.closed) return;
        detach(ws);
        try {
          ws.close();
        } catch {
          // ignore
        }
        this.ws = null;
        this.onSocketFailed(true);
      }, this.opts.wsTimeoutMs ?? 1500);
    }

    ws.onopen = () => {
      if (this.ws !== ws) return;
      opened = true;
      if (this.wsTimer) clearTimeout(this.wsTimer);
      this.wsTimer = null;
      // Back from the fallback: the relay is authoritative again.
      if (this.transport === "broadcast") this.stopBroadcast();
      this.transport = "websocket";
      this.attempts = 0;
      this.lastSeen = Date.now();
      const hello: ClientMessage = {
        kind: "hello",
        sessionId: this.sessionId,
        role: this.role,
        clientId: this.clientId,
      };
      if (this.opts.token) hello.token = this.opts.token;
      if (isControllerRole(this.role)) hello.initialState = this.local ?? this.opts.initialState();
      this.send(hello);
      this.startHeartbeat();
      this.notify();
    };
    ws.onmessage = (ev) => {
      if (this.ws !== ws) return;
      this.lastSeen = Date.now();
      this.onServerMessage(ev.data);
    };
    ws.onerror = () => {
      // onclose follows; nothing to do here.
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.stopHeartbeat();
      if (!opened) {
        if (this.wsTimer) clearTimeout(this.wsTimer);
        this.wsTimer = null;
        this.onSocketFailed(first);
        return;
      }
      this.setStatus("offline");
      this.scheduleReconnect();
    };
  }

  private onSocketFailed(first: boolean): void {
    if (this.closed) return;
    if (first && this.transport === null && this.BC) {
      this.startBroadcast();
      this.scheduleReconnect();
      return;
    }
    if (this.transport === "broadcast") {
      // Still working through the channel; try the relay again later.
      this.scheduleReconnect();
      return;
    }
    this.setStatus(this.transport === null ? "connecting" : "offline");
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.closed || this.reconnectTimer) return;
    const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.attempts) * (0.8 + Math.random() * 0.4);
    this.attempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.status !== "open" && this.transport !== "broadcast") this.setStatus("connecting");
      this.tryWebSocket(false);
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    const every = this.opts.heartbeatMs ?? 5000;
    this.heartbeatTimer = setInterval(() => {
      const ws = this.ws;
      if (!ws) return;
      if (Date.now() - this.lastSeen > every * 3) {
        // Silent relay (laptop slept, Wi-Fi dropped): recycle the socket.
        detach(ws);
        try {
          ws.close();
        } catch {
          // ignore
        }
        ws.onclose = null;
        this.ws = null;
        this.stopHeartbeat();
        this.setStatus("offline");
        this.scheduleReconnect();
        return;
      }
      this.send({ kind: "ping", t: Date.now() });
    }, every);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  private send(msg: ClientMessage): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WS_OPEN) return;
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // the close handler will deal with it
    }
  }

  private onServerMessage(raw: unknown): void {
    const msg = parseServerMessage(raw);
    if (!msg) return;
    switch (msg.kind) {
      case "welcome": {
        this.controlGranted = msg.canControl;
        this.clients = msg.clients;
        this.server = msg.state;
        if (!this.canControl()) this.pending = [];
        // Resend whatever was queued; controller commands are idempotent.
        for (const p of this.pending) this.send({ kind: "command", command: p.command, id: p.id });
        this.rebase();
        this.status = "open";
        this.notify();
        return;
      }
      case "state":
        this.server = msg.state;
        if (msg.ack !== undefined) this.dropPending(msg.ack);
        this.rebase();
        this.notify();
        return;
      case "error":
        if (msg.ack !== undefined) {
          this.dropPending(msg.ack);
          this.rebase();
          this.notify();
        }
        return;
      case "clients":
        this.clients = msg.clients;
        this.notify();
        return;
      case "pong":
        return;
    }
  }

  private dropPending(ack: number): void {
    this.pending = this.pending.filter((p) => p.id > ack);
  }

  private rebase(): void {
    if (!this.server) return;
    let s = this.server;
    if (this.canControl()) for (const p of this.pending) s = applyCommand(s, p.command, this.role);
    this.local = s;
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
    this.controlGranted = isControllerRole(this.role);
    this.startPresence();
    this.requestSnapshot(0);
    this.notify();
  }

  private here(ask = false): void {
    this.post({ t: "here", from: this.clientId, role: this.role, since: this.since, ...(ask ? { ask: true } : {}) });
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
      { clientId: this.clientId, role: this.role, since: this.since },
      ...[...this.peers].map(([clientId, p]) => ({ clientId, role: p.role, since: p.since })),
    ];
    all.sort((a, b) => a.since! - b.since! || (a.clientId < b.clientId ? -1 : a.clientId > b.clientId ? 1 : 0));
    this.clients = all;
  }

  private stopBroadcast(): void {
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.snapshotTimer = null;
    this.stopPresence();
    if (!this.channel) return;
    this.post({ t: "bye", from: this.clientId });
    this.channel.onmessage = null;
    this.channel.close();
    this.channel = null;
    this.latestWriter = null;
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
      const next = applyCommand(this.local, p.command, this.role);
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
        this.peers.set(msg.from, { role: msg.role, since: msg.since, seen: Date.now() });
        if (msg.ask) this.here();
        if (!known || known.role !== msg.role || known.since !== msg.since) {
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
    if (this.wsTimer) clearTimeout(this.wsTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.snapshotTimer) clearTimeout(this.snapshotTimer);
    this.stopHeartbeat();
    this.wsTimer = this.reconnectTimer = this.snapshotTimer = null;
  }
}

function detach(ws: WebSocketLike): void {
  ws.onopen = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
}
