# Learning components

Scene components for chapter 1 (learned systems) and 8.2 (goal vs outcome).
All of them are deterministic: `mode: "fallback"` renders exactly like `live`,
so scenes can use `fallback: { kind: "deterministic" }`.

Shared pieces:

- `shared/sceneState.ts`: `useSceneState(ctx, initial, { throttleMs })`. The
  controller keeps a local copy, publishes it with `ctx.setState` and starts
  over when the session resets the scene (`R`). Display and preview read
  `ctx.state`. Also used by `../agents`.
- `shared/ui.tsx`: `l(fr, en)` (applies French non-breaking spaces),
  `SceneButton` (never swallows Space/arrows/PageUp/PageDown), `SceneHeading`,
  `Segmented`, `ControlBar` (controller only), `Disclosure`.
- `ml/mlp.ts`: a tiny MLP with Adam in plain TypeScript (seeded, deterministic).
  Sizes `[2, 1]` is logistic regression.

Every component accepts an optional `heading: L10n` that replaces its default title.

## GoalVsOutcome

Props: `{ simple?: boolean }`. Used by 8.2 and by 04-loss-of-control (default mode).

### `simple: true`: pictures, one line per step

No score, no percentage, no ranking, and no numbers drawn in the room. The
same animated room; the right side adds one short line per step. The thought-experiment
badge and the "not a real incident" note stay on screen.

| Step | Line added | Replayed |
| --- | --- | --- |
| 0 | We write the goal: "reward for every piece of dirt picked up" | nothing (setup) |
| 1 | What we meant: a clean room | the robot tidies and empties the bin |
| 2 | What it finds: pick up, drop, pick up again, plus "It did exactly what we said, not what we meant" | the pick-drop loop, with a circling arrow around the robot |
| 3 (optional) | We patch it: "no visible dirt". It parks in front of the camera | the robot blocks the camera |

`scene.steps`: 2 (or 3 with the patch).

### Default mode

Labelled on screen with the thought-experiment
badge and "a simplified toy built for this talk, not a real incident".

A cleaning robot in a 9 x 6 room. An "optimizer" scores five scripted
strategies under the written objective (`goal/sim.ts`, tested) and keeps the
best. The controller drives the replay clock (7 ticks per second, 60 ticks)
and publishes the tick; followers render that frame. Controls: replay, pause,
click any ranked strategy to replay it.

| Step | Objective | Replayed strategy |
| --- | --- | --- |
| 0 | +1 per piece of dirt picked up | none (setup) |
| 1 | same | the intended one: pick up and empty into the bin (score 6, room clean) |
| 2 | same | the optimizer's pick: pick up, drop, pick up again (score 29, room dirty) |
| 3 | +1 per moment the camera sees no dirt | the new pick: park in front of the camera (score 58); hiding dirt under the rug also beats cleaning |
| 4 | same | nothing new (the step 3 replay stays); a band under the two cards names the gap: "Misalignment: the gap between what an AI is rewarded for and what we actually wanted" |

`scene.steps`: 4 (3 without the naming step). Simple mode stops at step 3.
