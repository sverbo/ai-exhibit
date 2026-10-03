import { useEffect, useRef, useState } from "react";
import {
  connectSession,
  type ClientRole,
  type ClientSummary,
  type ConnectionStatus,
  type SessionClient,
  type SessionCommand,
  type SessionState,
  type SessionTransport,
} from "@ai-exhibit/session-protocol";

export interface SessionView {
  state: SessionState | null;
  status: ConnectionStatus;
  transport: SessionTransport | null;
  canControl: boolean;
  /** Windows in the session, this one included, oldest first. */
  clients: ClientSummary[];
  /** This window's id in `clients` (null before connecting). */
  clientId: string | null;
  /** False until `clients` is known. */
  presenceReady: boolean;
  dispatch: (command: SessionCommand) => void;
}

export interface UseSessionOptions {
  sessionId?: string;
  initialState: () => SessionState;
}

const EMPTY: Omit<SessionView, "dispatch"> = {
  state: null,
  status: "connecting",
  transport: null,
  canControl: false,
  clients: [],
  clientId: null,
  presenceReady: false,
};

/**
 * Connects one view to the shared session and re-renders on every change.
 * Windows of the same browser profile share it over a BroadcastChannel
 * (presenter, projector, rehearsal), on a deployment and under `pnpm dev`
 * alike; there is no session server.
 */
export function useSession(role: ClientRole, opts: UseSessionOptions): SessionView {
  const [snapshot, setSnapshot] = useState(EMPTY);
  const clientRef = useRef<SessionClient | null>(null);
  const initialRef = useRef(opts.initialState);
  initialRef.current = opts.initialState;
  const sessionId = opts.sessionId;

  useEffect(() => {
    const client = connectSession({
      role,
      sessionId,
      initialState: () => initialRef.current(),
      // No relay: go straight to the BroadcastChannel.
      WebSocketImpl: null,
    });
    clientRef.current = client;
    const read = () => {
      setSnapshot({
        state: client.getState(),
        status: client.getStatus(),
        transport: client.getTransport(),
        canControl: client.canControl(),
        clients: client.getClients(),
        clientId: client.clientId,
        presenceReady: client.presenceReady(),
      });
    };
    const unsubscribe = client.subscribe(read);
    read();
    return () => {
      unsubscribe();
      client.close();
      clientRef.current = null;
      setSnapshot(EMPTY);
    };
  }, [role, sessionId]);

  const dispatchRef = useRef((command: SessionCommand) => clientRef.current?.dispatch(command));
  return { ...snapshot, dispatch: dispatchRef.current };
}
