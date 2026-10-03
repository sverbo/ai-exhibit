# @ai-exhibit/session-protocol

One shared `SessionState` per talk. Every view (projector, presenter, phone
remote, audience phone) is a client of it. Types live in `src/types.ts`.

## Pieces

- `createInitialState(init)`: a fresh state at version 0.
- `applyCommand(state, command, role)`: the pure reducer, run by clients
  (optimistic updates) and by the relay (authoritative). It returns the same
  object when the role may not send the command or when nothing changes;
  otherwise a new state with `version + 1`.
- `canSend(role, command)`: `presenter`, `solo`, `remote` send everything except
  `vote`; `audience` sends only `vote`; `projector` sends nothing.
- `parseClientMessage` / `parseServerMessage` / `parseCommand`: runtime
  validation of untrusted frames (256 KB cap, ID lengths, words capped to 40 chars).
- `audienceView(state)`: what phones receive (no scene states, no live tallies
  while a poll is open).
- `pollTallies(interaction, pollId)`: phone votes plus hand counts, open or closed.
- `connectSession(opts)`: the `SessionClient` used by views.

## Polls

`openPoll` opens a poll (closing any other open poll first; reopening a closed
poll resumes its tallies). Votes count only while the phase is `open` and only
for the open `pollId`. `showPollResults` switches to `results`. `closePoll`
moves the tallies to `interaction.history[pollId]`. `setManualTally` stores hand
counts (`interaction.manual[pollId]`) that add to phone votes. `resetPoll`
forgets one poll; `resetSession` starts the talk fresh. Only tallies are
stored, never who voted what.

## Transport

`connectSession` tries `ws(s)://<host>/session` for 1.5 s, then falls back to
the BroadcastChannel `ai-exhibit:<sessionId>`.

**WebSocket (relay in `apps/local-runtime`).** The client sends
`hello { role, token?, clientId, initialState? }`. The relay answers `welcome`
once it has a state (a controller's `initialState` bootstraps an empty relay).
Control requires the presenter token (`GET /api/session/presenter-token`, loopback
only). Commands carry an `id`; the sender's copy of the resulting `state` (or the
`error` for a rejected command) carries it back as `ack`, so controllers rebase
their optimistic queue on the authoritative state. The relay rejects a second
vote from the same `voterId` (or connection) for a poll; voter IDs stay on the
relay and are never broadcast. Clients ping every 5 s and reconnect with
exponential backoff; the relay persists the state to
`<cache>/session/state.json` and restores it at startup.

**BroadcastChannel (no runtime, same browser).** Controllers are trusted. A new
tab asks for a snapshot; the most recent writer answers, then, if nobody did,
anyone holding state. A lone controller starts from `initialState()`. States
carry `version`; the higher one wins, ties go to the larger client ID.
