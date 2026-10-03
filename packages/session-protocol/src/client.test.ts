import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type BroadcastChannelLike, type WebSocketLike, connectSession } from "./client.ts";
import { createInitialState } from "./reducer.ts";
import { stageOwner } from "./stage.ts";
import type { ClientRole, SessionClient } from "./types.ts";

/** In-memory BroadcastChannel: async delivery to every other instance with the same name. */
class FakeChannel implements BroadcastChannelLike {
  static buses = new Map<string, Set<FakeChannel>>();
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  private closed = false;
  constructor(readonly name: string) {
    const bus = FakeChannel.buses.get(name) ?? new Set();
    bus.add(this);
    FakeChannel.buses.set(name, bus);
  }
  postMessage(message: unknown): void {
    if (this.closed) throw new Error("closed");
    const data = structuredClone(message);
    for (const other of FakeChannel.buses.get(this.name) ?? []) {
      if (other !== this) queueMicrotask(() => other.onmessage?.({ data }));
    }
  }
  close(): void {
    this.closed = true;
    FakeChannel.buses.get(this.name)?.delete(this);
  }
}

/** A WebSocket that never connects. */
class DeadSocket implements WebSocketLike {
  static created = 0;
  readyState = 0;
  onopen = null;
  onclose = null;
  onerror = null;
  onmessage = null;
  constructor(_url: string) {
    DeadSocket.created++;
  }
  send(): void {}
  close(): void {}
}

const initial = () =>
  createInitialState({ presentationId: "canonical", editionId: "fr-full", locale: "fr", sceneId: "00-title" });

const clients: SessionClient[] = [];
function open(role: ClientRole, clientId: string, extra: Partial<Parameters<typeof connectSession>[0]> = {}) {
  const c = connectSession({
    role,
    clientId,
    initialState: initial,
    WebSocketImpl: null,
    BroadcastChannelImpl: FakeChannel,
    ...extra,
  });
  clients.push(c);
  return c;
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeChannel.buses.clear();
});
afterEach(() => {
  for (const c of clients.splice(0)) c.close();
  vi.useRealTimers();
});

describe("BroadcastChannel presence", () => {
  it("windows see each other, oldest first, and forget a window that says bye", async () => {
    const a = open("solo", "a");
    await vi.advanceTimersByTimeAsync(10);
    const b = open("presenter", "b");
    expect(a.presenceReady()).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(a.presenceReady()).toBe(true);
    expect(b.presenceReady()).toBe(true);
    expect(a.getClients().map((c) => `${c.clientId}:${c.role}`)).toEqual(["a:solo", "b:presenter"]);
    expect(b.getClients().map((c) => c.clientId)).toEqual(["a", "b"]);
    b.close();
    await vi.advanceTimersByTimeAsync(10);
    expect(a.getClients().map((c) => c.clientId)).toEqual(["a"]);
  });

  it("every window elects the same single stage owner, and hands over when it leaves", async () => {
    const owners = (cs: SessionClient[]) => cs.map((c) => stageOwner(c.getClients()));
    const projector = open("solo", "p");
    await vi.advanceTimersByTimeAsync(20);
    const oldTab = open("solo", "o");
    await vi.advanceTimersByTimeAsync(600);
    // Projector opened first: it runs the stage, the old /present tab mirrors it.
    expect(owners([projector, oldTab])).toEqual(["p", "p"]);
    const presenter = open("presenter", "z");
    const remote = open("remote", "r");
    await vi.advanceTimersByTimeAsync(600);
    expect(owners([projector, oldTab, presenter, remote])).toEqual(["z", "z", "z", "z"]);
    presenter.close();
    await vi.advanceTimersByTimeAsync(20);
    expect(owners([projector, oldTab, remote])).toEqual(["p", "p", "p"]);
  });

  it("forgets at once a window whose lock is gone (closed or crashed without a bye)", async () => {
    const held = new Set<string>();
    const releases = new Map<string, () => void>();
    const locks = {
      request(name: string, cb: () => Promise<unknown>) {
        held.add(name);
        const p = cb().finally(() => held.delete(name));
        releases.set(name, () => held.delete(name));
        return p;
      },
      async query() {
        return { held: [...held].map((name) => ({ name })) };
      },
    };
    const a = open("solo", "a", { locks });
    const b = open("presenter", "b", { locks });
    await vi.advanceTimersByTimeAsync(3000);
    expect(a.getClients().map((c) => c.clientId)).toEqual(["a", "b"]);
    // The tab is killed: its lock goes, no bye, no more announcements.
    (b as unknown as { stopPresence(): void }).stopPresence();
    releases.get("ai-exhibit:main:window:b")?.();
    await vi.advanceTimersByTimeAsync(1500);
    expect(a.getClients().map((c) => c.clientId)).toEqual(["a"]);
  });

  it("forgets a window that went silent", async () => {
    const a = open("solo", "a", { presenceTimeoutMs: 5000 });
    const b = open("projector", "b");
    await vi.advanceTimersByTimeAsync(1500);
    expect(a.getClients()).toHaveLength(2);
    // Simulate a crashed tab: it stops announcing itself without saying bye.
    (b as unknown as { stopPresence(): void }).stopPresence();
    await vi.advanceTimersByTimeAsync(7000);
    expect(a.getClients().map((c) => c.clientId)).toEqual(["a"]);
  });
});

describe("BroadcastChannel client", () => {
  it("a lone controller starts from initialState after asking twice", async () => {
    const a = open("solo", "a");
    expect(a.getTransport()).toBe("broadcast");
    expect(a.getState()).toBeNull();
    await vi.advanceTimersByTimeAsync(300);
    expect(a.getState()).toBeNull();
    await vi.advanceTimersByTimeAsync(300);
    expect(a.getState()?.sceneId).toBe("00-title");
    expect(a.getStatus()).toBe("open");
    expect(a.canControl()).toBe(true);
  });

  it("a new tab gets a snapshot from the most recent controller and follows commands", async () => {
    const a = open("presenter", "a");
    await vi.advanceTimersByTimeAsync(600);
    a.dispatch({ type: "goto", sceneId: "02-x", revealStep: 1 });

    const p = open("projector", "p");
    await vi.advanceTimersByTimeAsync(300);
    expect(p.getState()).toMatchObject({ sceneId: "02-x", revealStep: 1 });
    expect(p.canControl()).toBe(false);

    const seen = vi.fn();
    p.subscribe(seen);
    a.dispatch({ type: "setBlackout", on: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(p.getState()?.blackout).toBe(true);
    expect(seen).toHaveBeenCalled();

    // The projector cannot send anything.
    p.dispatch({ type: "setBlackout", on: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(a.getState()?.blackout).toBe(true);
    expect(p.getState()?.blackout).toBe(true);
  });

  it("two controllers stay in sync", async () => {
    const a = open("presenter", "a");
    await vi.advanceTimersByTimeAsync(600);
    const r = open("remote", "r");
    await vi.advanceTimersByTimeAsync(300);
    r.dispatch({ type: "goto", sceneId: "05-x", revealStep: 0 });
    await vi.advanceTimersByTimeAsync(0);
    expect(a.getState()?.sceneId).toBe("05-x");
    a.dispatch({ type: "goto", sceneId: "06-x", revealStep: 0 });
    await vi.advanceTimersByTimeAsync(0);
    expect(r.getState()?.sceneId).toBe("06-x");
    expect(r.getState()?.version).toBe(a.getState()?.version);
  });

  it("recovers state from any holder when the latest writer is gone", async () => {
    const a = open("presenter", "a");
    await vi.advanceTimersByTimeAsync(600);
    a.dispatch({ type: "goto", sceneId: "07-x", revealStep: 0 });
    const p = open("projector", "p");
    await vi.advanceTimersByTimeAsync(300);
    a.close();
    const b = open("presenter", "b");
    await vi.advanceTimersByTimeAsync(300);
    expect(b.getState()).toBeNull();
    await vi.advanceTimersByTimeAsync(300);
    expect(b.getState()?.sceneId).toBe("07-x");
    expect(p.getState()?.sceneId).toBe("07-x");
  });

  it("applies commands dispatched before the session was resolved", async () => {
    const a = open("solo", "a");
    a.dispatch({ type: "setFrozen", on: true });
    await vi.advanceTimersByTimeAsync(600);
    expect(a.getState()?.frozen).toBe(true);
  });

  it("falls back from WebSocket after 1.5 s", async () => {
    DeadSocket.created = 0;
    const a = open("solo", "a", { WebSocketImpl: DeadSocket, wsUrl: "ws://127.0.0.1:1/session" });
    expect(DeadSocket.created).toBe(1);
    expect(a.getTransport()).toBeNull();
    await vi.advanceTimersByTimeAsync(1499);
    expect(a.getTransport()).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(a.getTransport()).toBe("broadcast");
    await vi.advanceTimersByTimeAsync(600);
    expect(a.getState()).not.toBeNull();
  });

  it("keeps retrying the relay after falling back, then follows the relay", async () => {
    // The runtime was restarting when the window opened: the first sockets die.
    const sockets: ManualSocket[] = [];
    class ManualSocket implements WebSocketLike {
      readyState = 0;
      onopen: ((ev: unknown) => void) | null = null;
      onclose: ((ev: unknown) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      onmessage: ((ev: { data: unknown }) => void) | null = null;
      sent: unknown[] = [];
      constructor(_url: string) {
        sockets.push(this);
      }
      send(data: string): void {
        this.sent.push(JSON.parse(data));
      }
      close(): void {}
    }
    const a = open("projector", "a", { WebSocketImpl: ManualSocket, wsUrl: "ws://127.0.0.1:1/session" });
    await vi.advanceTimersByTimeAsync(1500);
    expect(a.getTransport()).toBe("broadcast");
    // A retry is scheduled even though the channel works.
    await vi.advanceTimersByTimeAsync(700);
    expect(sockets.length).toBe(2);
    sockets[1]!.onclose?.({});
    expect(a.getTransport()).toBe("broadcast");
    await vi.advanceTimersByTimeAsync(1300);
    expect(sockets.length).toBe(3);
    // The runtime is back.
    const live = sockets[2]!;
    live.readyState = 1;
    live.onopen?.({});
    expect(live.sent[0]).toMatchObject({ kind: "hello", role: "projector" });
    const relayState = { ...initial(), sceneId: "01-one-request", version: 42 };
    live.onmessage?.({ data: JSON.stringify({ kind: "welcome", state: relayState, canControl: false, clients: [] }) });
    expect(a.getTransport()).toBe("websocket");
    expect(a.getState()?.sceneId).toBe("01-one-request");
    expect(FakeChannel.buses.get("ai-exhibit:main")?.size ?? 0).toBe(0);
  });
});
