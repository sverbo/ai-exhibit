# Evidence and governance components

Registered in `register.ts`. All follow `../contract.ts`: the controller (presenter
or solo window) handles clicks and publishes a small state with `ctx.setState`; the
projector (`display`) renders only from `ctx.state` and `ctx.revealStep`; `preview`
renders a static, fully revealed frame with no motion.

Set `scene.steps` to the value given below. Shell keys (`Space`, `Enter`) pressed on
a focused control are stopped so they do not also advance the talk.

Scenes only pass the small props below. Cited sources resolve from
`content/sources`.

## `DefenseInDepth` (9.1)

Props: `{ layers?: L10n[] }`. Default layers: training, evaluations,
interpretability, monitoring, sandboxing and permissions, governance.
`steps: layers.length + 1` (7 with the defaults).

| Step | Shows |
| --- | --- |
| 0 .. n-1 | Slices appear one by one (step k shows k + 1 slices) |
| n | Scripted problems, each stopped by a different layer |
| n + 1 | The rare path where holes line up and harm gets through |

Controller (once all slices are shown): "Send a problem", "Send 20", "Reset
counts". Hazards are drawn at random and traced through the actual hole geometry.
State: `{ attempts, passed, recent: { u, v, stop }[] }` (last 12). Cites
`cg-reason-2000-swiss-cheese` (Reason, BMJ 2000).

## `RaceDilemma` (10.8)

Props: `{}`. `steps: 5`. Labelled as an analogy (thought-experiment badge).

| Step | Shows |
| --- | --- |
| 0 | Empty 2 x 2 matrix (take time for safety / race ahead) |
| 1 | Ordinal outcomes for both sides |
| 2 | If A takes its time, B does better by racing |
| 3 | If A races, B still does better by racing |
| 4 | Both race: the equilibrium, worse for both than coordination |
| 5 | What changes the game, and where the analogy breaks (contested) |

Controller: click a cell to emphasize it for the current step. State:
`{ cell, atStep }`.
