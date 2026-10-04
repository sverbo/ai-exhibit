# Interaction from any window

Status: accepted for implementation, 2026-10-04.
Context: [`2026-10-02-v0-design.md`](2026-10-02-v0-design.md). Presenter and
projector are windows of one browser profile, synced over BroadcastChannel.
Exactly one window runs the stage (`stageOwner` in session-protocol: a
presenter view first, otherwise the oldest window); the others render the
current scene as a display and mirror its published state.

## Goal

The presenter can act on a live scene (type a sentence, pick an example,
generate tokens) from whichever window is under their hands, including the
projector while the presenter view is open. Compute still runs once: no model
call, animation or streamed answer ever runs in two windows.

## Roles and the `interactive` flag

`SceneContext` gains three fields:

- `interactive: boolean`: this window may act on the scene. True for the stage
  owner (`role: "controller"`) and for any other controller window that
  mirrors it (`role: "display"`, e.g. the projector while the presenter view
  is open). False for previews, for the presenter's projector mirror, and for
  a window that cannot control the session.
- `sendRequest(payload)`: for an interactive display window, asks the stage
  owner to act. A no-op everywhere else.
- `request: { id, payload } | null`: the latest request sent to this scene,
  read by the stage owner only.

Scenes render their controls when `interactive` is true, whatever the role,
and read what they show from the published state as they already do.

## Requests

A request is a small JSON payload describing what the user did, never the
result: `{ type: "generate", n: 10 }`, `{ type: "text", text: "..." }`,
`{ type: "example", index: 2 }`. It travels as a session command,
`sceneRequest { sceneId, id, payload }`, which the reducer stores as
`state.requests[sceneId]` (latest one only). Its `id` is unique (window id
plus a counter).

The stage owner handles each new request id exactly once, with the same
function that handles its own clicks:

```ts
const act = useSceneActions<Action>(ctx, (action) => { /* owner logic */ });
// controls, in every window: onClick={() => act({ type: "generate", n: 10 })}
```

`useSceneActions` (scene-components, `primitives/interaction.ts`):

- on the stage owner, `act(a)` runs the handler at once, and every new
  `ctx.request` runs it too;
- on an interactive display window, `act(a)` sends the request;
- elsewhere `act` does nothing.

A window that becomes the stage owner (presenter opened or closed) remembers
the request id present when it mounted and never replays it, so a hand-over
never runs an action twice. A request sent during a hand-over may be lost; the
presenter clicks again.

## Typing

Text fields keep a local draft while they have focus and ignore published
values until they lose it: typing stays smooth in any window, the caret never
jumps, and two windows never fight over the value. A display window sends the
text as a request (debounced, about 150 ms); the owner sets it in the scene
state, computes (tokenizes, searches) and publishes. On blur, the field shows
the published value again.

## Controls

One shared, compact control bar (`primitives/controls`) for every scene: one
row under the slide, small buttons, inline labels, the same in every window.
Scenes keep only what the presenter needs live (for example the base model
offers "1, 10 or 30 tokens" and nothing else); everything else (reset: `R`,
fallback: `F`) is a key.

## Not covered

Scenes still on their own controller-only controls (text classifier,
embeddings) show their controls only on the stage owner until they adopt
`useSceneActions`.
