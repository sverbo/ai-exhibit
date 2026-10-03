# Content guide

How to write or adapt scenes, add an edition, and add a scene component. The
talk as one story: [`docs/narrative.md`](../narrative.md). How the app works:
[`docs/architecture.md`](../architecture.md).

## Where content lives

| Path | Holds |
| --- | --- |
| `presentations/canonical/src/scenes/0X-*.ts` | One array of `SceneDefinition` per chapter, in narrative order |
| `presentations/canonical/src/chapters.ts` | Chapter titles and one-line summaries |
| `presentations/canonical/src/editions.ts` | The editions (one today: `en`) |
| `presentations/canonical/src/artifacts.ts` | Manifest of the bundled data (embedding map, recordings) that scenes refer to |
| `content/sources/*.ts` | Source registry, one file per area |
| `content/assets/` | Bundled assets: `embeddings/`, `recordings/`, `scenarios/`, `then-and-now/`, `media/` |

Types: `packages/presentation-core/src/types.ts`.

## Writing a scene

Every scene is structured data, never markup. Fields of `SceneDefinition`:

| Field | Guidance |
| --- | --- |
| `id` | `<chapter>-<kebab-slug>`, e.g. `02-tokens`. Stable: rehearsal links and polls refer to it |
| `chapter` | `"00"` to `"11"`; must match the ID prefix |
| `number` | Position in the talk, e.g. `"3.2"`. Shown to the presenter, used by the go-to palette |
| `title` | Internal title; may never appear on the projector |
| `objective` | One sentence: what the audience should understand |
| `takeaway` | The single idea to retain, said at the end. Shown in the presenter view and the handout |
| `visual` | A generic layout or a component, see below |
| `steps` | Reveal steps after the initial state. Defaults to the item count for `cards`, `list`, `flow`; otherwise 0. Components document the value they expect |
| `interaction` | `none`, `presenter`, `audience`, `local-model`, `network` |
| `speakerNotes` | Markdown, in both locales. Use **Do** / **Say** / **Ask** / timing, the honesty caveats to say aloud, and how to bridge when the short edition skips the next scene |
| `transitionIn`, `transitionOut` | The bridge from the previous scene and to the next. `transitionOut` is shown under the stage in the presenter view |
| `evidenceLevel` | Badge for the scene, see [Evidence](#evidence-and-editorial-policy). `none` for explanatory scenes |
| `sourceIds` | IDs from the source registry. Components can also cite sources inside their props |
| `runtimeClass` | `A` deterministic/offline, `B` local compute (in-page training), `C` live/networked (Hugging Face, polls) |
| `artifacts` | IDs of the bundled data the scene uses, from `artifacts.ts` (checked by `verify:content`) |
| `fallback` | `{ kind: "deterministic" }` (component's own mode), `{ kind: "recording", asset }` (replayed data), `{ kind: "static", note }` (what the presenter says or does instead), or `{ kind: "none" }`. Classes B and C must not use `none` |
| `durationSec` | Target speaking time. Edition totals are checked against targets |
| `optional` | `true` if a short cut may drop it |
| `localizationNotes` | English, for adapters: what not to translate literally, what needs a local example |
| `todo` | English list of unverified claims or missing work. Shown in the presenter TODO tab and counted in `/overview` |

### Generic layouts

| `layout` | Fields | Reveal |
| --- | --- | --- |
| `title` | `heading`, `kicker?`, `sub?` | None |
| `question` | `question`, `hint?` | None |
| `statement` | `text`, `attribution?` | None |
| `cards` | `heading?`, `cards: { title, body?, icon?, evidence?, sourceIds? }[]` | One card per step (or even groups if `steps` is smaller) |
| `list` | `heading?`, `items: L10n[]` | One item per step |
| `flow` | `heading?`, `nodes: { id, label, detail? }[]`, `edges?`, `loop?` | One node per step |
| `compare` | `heading?`, `left` and `right: { title, items }` | Set `steps: 2` to reveal left then right; with 0, both show at once |
| `component` | `component: <registered name>`, `props?` | Defined by the component |
| `placeholder` | `description` | None; labelled "Scene to be built" |

`steps: 0` on a list-like layout shows everything at once. Card `icon` is
decorative only. See every layout live in `/lab`.

### Components

Every registered component is used by the canonical talk. The area READMEs are
the reference: props, reveal-step tables, controller extras, state shapes,
fallback.

| Component | Scenes (`en`) | Reference |
| --- | --- | --- |
| `ThenAndNow` | 1.4 | [language](../../packages/scene-components/src/language/README.md) |
| `ModelComparison` | 1.5 | [capabilities](../../packages/scene-components/src/capabilities/README.md) |
| `ConnectedAssistant` | 1.6 | [capabilities](../../packages/scene-components/src/capabilities/README.md) |
| `PermissionsBoard` | 1.7 | [agents](../../packages/scene-components/src/agents/README.md) |
| `VideoScene` | 1.8 | [capabilities](../../packages/scene-components/src/capabilities/README.md) |
| `ToolCallDemo` | 1.9 | [agents](../../packages/scene-components/src/agents/README.md) |
| `AgentRunExplainer` | 1.10 | [capabilities](../../packages/scene-components/src/capabilities/README.md) |
| `AgentLoop` | 1.11 | [agents](../../packages/scene-components/src/agents/README.md) |
| `AIEnvelopes` | 2.1 | [story](../../packages/scene-components/src/story/README.md) |
| `AITimeline` | 2.2 | [story](../../packages/scene-components/src/story/README.md) |
| `TextClassifierLab` | 2.3 to 2.9 | [textlab](../../packages/scene-components/src/textlab/README.md) |
| `SingleCase` | 2.10 | [risks](../../packages/scene-components/src/risks/README.md) |
| `NextTokenVsClassifier` | 2.11 | [llm](../../packages/scene-components/src/llm/README.md) |
| `TrainingLoop` | 2.13 | [llm](../../packages/scene-components/src/llm/README.md) |
| `TokenizerPlayground` | 2.14 | [language](../../packages/scene-components/src/language/README.md) |
| `EmbeddingExplorer` | 2.15, 2.16 | [embeddings](../../packages/scene-components/src/embeddings/README.md) |
| `BaseModelPlayground` | 2.17 | [language](../../packages/scene-components/src/language/README.md) |
| `ChatPlayground` | 2.18 | [language](../../packages/scene-components/src/language/README.md) |
| `IndustryStack` | 3.1 | [story](../../packages/scene-components/src/story/README.md) |
| `RaceDilemma` | 3.2 | [evidence](../../packages/scene-components/src/evidence/README.md) |
| `PictureCards` | 4.1 to 4.5, 5.3 | [risks](../../packages/scene-components/src/risks/README.md) |
| `IntelligenceScale` | 4.6 | [story](../../packages/scene-components/src/story/README.md) |
| `GoalVsOutcome` | 4.7 | [learning](../../packages/scene-components/src/learning/README.md) |
| `IncidentStory` | 4.8 | [risks](../../packages/scene-components/src/risks/README.md) |
| `DefenseInDepth` | 5.2 | [evidence](../../packages/scene-components/src/evidence/README.md) |

A name that is not registered renders a labelled placeholder and is a
`verify:content` warning, so content can land before its component.

## L10n rules

- Every string the audience or presenter sees is an `L10n`: `{ fr: "...", en: "..." }`.
  Both locales are required and non-empty (`verify:content` errors otherwise).
- French text is a product decision, written for French speakers, not a literal
  translation. Adapt examples (idioms, prompts, local references) rather than
  translating them, and note why in `localizationNotes`.
- Code, comments, `claim`, `todo`, `localizationNotes` and docs are English.
- **No em dash or en dash anywhere**, in either locale. Rewrite with a comma,
  parentheses or two sentences. `verify:content` rejects them.
- Keep projector text minimal: big type, one idea per scene. Detail goes in notes.

## Evidence and editorial policy

Badges carry a shape and a word, never color alone:

| `evidenceLevel` | Badge | Use for |
| --- | --- | --- |
| `observed` | ● Observed | A documented real-world event or deployed-system behavior |
| `evaluation` | ▲ Evaluation | Behavior produced in a controlled test, benchmark or simulation |
| `projection` | ◆ Projection | A reasoned scenario from trends or assumptions, not observed |
| `thought-experiment` | ○ Thought experiment | An illustrative hypothetical |
| `contested` | ◐ Contested | Material disagreement about interpretation or policy |
| `none` | no badge | Explanatory scenes |

Rules:

- **Never invent** incidents, statistics, quotes, company positions or regulation
  details. A claim without a verified source is rephrased as a question or concept,
  or it carries a `todo` and a source with `verification: "needs-verification"`.
- Never present simulated behavior as a real incident. Illustrative replays and
  toys say so on screen (e.g. "illustrative reconstruction, not a recording of any
  real product").
- Separate capability evidence from claims about likely future deployment.
- Governance: documented positions and incentives, no hidden motives.
- Date-stamp regulatory and geopolitical scenes (`asOf` in the data files).
- Prefer primary papers, official incident reports and regulator texts; journalism
  for context.
- In chapters 04, 06, 07, 08 and 10, a scene with an evidence level needs at least
  one source or a `todo` (`verify:content` enforces it).

The projector shows the badge and a short source label; the presenter Sources tab
shows full records with their verification status; `/handout` lists everything.

## Sources

`SourceRecord` fields: `id`, `title`, `url?`, `publisher?`, `authors?`, `date?`
(ISO), `retrieved?` (ISO date last checked), `kind` (`paper`, `report`, `news`,
`regulation`, `dataset`, `documentation`, `book`, `other`), `claim` (English: what
the source supports), `evidence`, `verification`, `notes?`.

| File | ID prefix | Area |
| --- | --- | --- |
| `content/sources/foundations.ts` | `fnd-` | Chapters 0 to 3 |
| `content/sources/failures-and-misuse.ts` | `fm-` | Chapters 4 to 7 |
| `content/sources/control-and-governance.ts` | `cg-` | Chapters 8 to 11 |
| `content/sources/supply-chain.ts` | `sc-` | Supply-chain map and governance data |

Verification states:

- `verified`: a person or agent opened the source and confirmed the claim. Set
  `retrieved` (a verified source without it is a warning).
- `needs-verification`: plausible, not yet checked. Shown as such to the presenter.

IDs are global; duplicates are errors. `pnpm verify:sources` (online) checks every
URL; run it before each talk.

## Durations and cuts

- Each scene has `durationSec`. An edition's total must fall within its
  `targetMinutes` (`en`: 75 to 95): `verify:content` errors otherwise.
- The short cut keeps every scene where `optional` is false. Mark a scene optional
  when the story still holds without it, and write the bridge in the previous
  scene's notes.
- `pnpm verify:content` prints minutes per chapter for both cuts, edition totals,
  TODO counts and unverified sources.

## `pnpm verify:content`

Checks, as errors: scene ID format and chapter prefix, unknown chapter, missing
locale in any `L10n`, long dashes in any string, unknown source IDs (scene and
inside `visual`), unknown artifact IDs, runtime class B or C without fallback,
implausible duration, evidence without sources or TODO in chapters 04/06/07/08/10,
duplicate scene or source IDs, edition include/exclude naming unknown scenes,
edition durations outside target. As warnings: unregistered component,
`placeholder` layout, verified source without `retrieved`, source without URL.
`--strict` fails on warnings too.

It does not check that `steps` matches what a component expects: use the table
above and `/lab`.

## Adding an edition

An edition is a locale, a cut and optional explicit lists, in
`presentations/canonical/src/editions.ts`:

```ts
{
  id: "en-school",
  locale: "en",
  title: { fr: "Édition scolaire, anglais (50 min)", en: "School edition (50 min)" },
  targetMinutes: [45, 55],
  cut: "short",
  include: ["02-embedding-search"],   // added back on top of the cut
  exclude: ["10-race-dynamics"],      // removed on top of the cut
}
```

Then `pnpm verify:content` (duration and IDs) and a pass through
`/overview?edition=en-school`. `pnpm rehearse` picks it up automatically.

A new language needs a new `Locale` in `presentation-core` and the text in every
`L10n`: a larger change than an edition.

## Adding a scene component

Contract: `packages/scene-components/src/contract.ts`. A component receives
`{ props, ctx }`; `ctx` carries `scene`, `locale`, `revealStep`, `role`, `mode`,
`state`, `setState`, `interaction`, `sendCommand`, `getSource`, `joinUrl`,
`reducedMotion`, `modelSource`.

| `ctx.role` | Where | Must |
| --- | --- | --- |
| `controller` | `/presenter`, `/present` | Accept input, call models (`/api`) and run heavy compute (training), publish small results with `ctx.setState` (keep it under about 50 KB) |
| `display` | `/projector`, the presenter's projector mirror | Render only from `ctx.state` and `ctx.revealStep`. Never call models, never write state |
| `preview` | Next-scene thumbnail, `/overview` | Static and cheap: no compute, no animation |

Rules:

1. **Fallback.** When `ctx.mode === "fallback"`, use recorded or deterministic
   data and touch no model or network. Switch to it on your own when Hugging
   Face is not available or a call fails, and say so calmly on screen
   (`language/source.ts` decides this for the language scenes).
2. **Never block navigation.** Call models through the `/api` client in
   `@ai-exhibit/ml-runtime/lm`, show a loading state, and publish
   `{ status: "loading" }` in state so other screens know. No model is ever
   downloaded or run in the browser.
3. **Keys.** Inputs keep the presentation keys to themselves: text inputs are
   ignored by the shell automatically; wrap other interactive regions in
   `data-keys-local`, or stop propagation of `Space`/arrows on focused buttons
   (`SceneButton` in `learning/shared/ui.tsx` does it).
4. **Reveal steps.** Read `ctx.revealStep`; document the expected `scene.steps`.
5. **Reset.** `R` clears the scene state: when `ctx.state` goes from defined to
   undefined, start over. `useSceneState` in `learning/shared/sceneState.ts`
   handles controller/display state and reset for you.
6. **Style.** Draw on the 1920x1080 stage in stage pixels, use CSS modules and the
   tokens in `theme/tokens.css` (`--color-*`, `--font-*`, `--text-*`, `--space-*`).
   Respect `ctx.reducedMotion`. Never carry meaning by color alone.
7. **Strings.** On-screen copy is `L10n`, usually in the area's `copy.ts`.

Register it in the area's `register.ts` (a new area also needs a line in
`src/registerAll.ts`):

```ts
registerSceneComponent("MyComponent", MyComponent);
```

Then reference it from a scene with `visual: { layout: "component", component: "MyComponent", props: {...} }`,
set `steps`, `runtimeClass`, `artifacts` and `fallback`, and document props and
steps in the area README.

**Test it in `/lab`.** Pick the component (or a scene using it), edit props as
JSON, change the step and locale, toggle fallback, and watch controller, display
and preview side by side with the shared state and the commands sent. URL
parameters make a state shareable: `/lab?c=PermissionsBoard&props={"mode":"approval"}&step=1&fallback=1&locale=en`.
Then `pnpm test`, `pnpm verify:content` and `pnpm rehearse`.

If the component needs a new model, add an endpoint to `packages/cloud-api`
(served by both the local runtime and `api/`) and record its outputs for
Simulation in `scripts/prepare/`. New bundled data goes under `content/assets/`
with an `ArtifactSpec` in `presentations/canonical/src/artifacts.ts` (its
`license` and `fallback` sentence); a third-party image also needs a credits
entry with its license.
