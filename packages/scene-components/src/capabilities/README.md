# Capabilities components

Scene components for chapter 01, "What AI can do today" (storyboard v1, scenes
1.3, 1.5 and 1.6). All are deterministic: `mode: "fallback"` renders
exactly like `live`, so scenes can use `fallback: { kind: "deterministic" }`.
Icons come from `../agents/shared/icons.tsx`, extended in `shared/icons.tsx`;
state hooks and buttons from `../learning/shared/`.

## ConnectedAssistant

Props: `{}`. Used by 1.3.

The assistant sits in the middle of the stage; connectors appear around it,
one per step, each with a one-line everyday request in large type and the
short label of the sources showing that a public product offers that kind of
connection. Data: `connected/connectors.ts`.

| Step | Shows |
| --- | --- |
| 0 | The assistant alone: "On its own, it can only talk." |
| 1 | + Email: "Find the invoice from my plumber and add it to my accounts." |
| 2 | + Calendar |
| 3 | + Files and documents |
| 4 | + Web browser |
| 5 | + Shopping and payments |
| 6 | + Code |
| 7 | + Phone and messages |

`scene.steps`: 7.

Sources per connector: `fnd-claude-google-workspace` (email, calendar, files),
`fnd-claude-for-chrome` and `fnd-chatgpt-agent-system-card` (browser),
`fnd-chatgpt-agent-system-card` and `fnd-google-ap2` (shopping and payments),
`fnd-claude-code-docs` (code), `fnd-gemini-messages-android` (phone and
messages). The two ids not yet in `content/sources/foundations.ts` are defined
in `REQUESTED_SOURCES` (same file), checked on 2026-10-02, and used until the
registry carries them. Add them to the scene's `sourceIds` too so they reach
Presenter View and `/handout`.

## AgentRunExplainer

Props: `{ scenario: "weekend-trip" }`. Used by 1.6.

One complex request, every step visible. The top shows the request, the
"illustrative reconstruction" disclosure (always on screen) and four counters
(tool calls, helpers, changes of plan, approvals asked) derived from the data.
The middle is a score: one lane per actor (you, the assistant, then three
helpers that appear when they are started), one column per step, links
between consecutive actions, the current column shaded. A square is you, a
circle is an action. The bottom shows a plain-language caption on the left and
the step's detail on the right: the to-do list, a tool card ("Sends" / "Gets
back", the answer arriving a moment later), three helpers side by side, the
merged reports with the pick, the struck-out plan item, the approval card, the
final summary. Step 0 shows how to read the score.

The step index is the session's reveal step, so the clicker, the in-scene
buttons and the projector always agree. The controller strip has previous,
play/pause, next and a speed choice (slow, normal, fast); autoplay advances by
sending `goto` commands and always stops at the approval gate, which the
presenter clicks through ("Approve" on the controller card, or the clicker).
Shared state is only `{ playing, speed }`.

| Step | Shows (weekend-trip) |
| --- | --- |
| 0 | The request; how to read the score |
| 1 | The assistant writes its own to-do list |
| 2 | Tool: shared calendars (three free weekends) |
| 3 | Starts three helpers, one per weekend |
| 4 | Helpers in parallel: weather outlook |
| 5 | Helpers in parallel: hotel search under 150 euros |
| 6 | Merge: picks 14-15 November |
| 7 | Tool: maps |
| 8 | Tool fails: the hotel is now fully booked |
| 9 | Re-plan: second choice |
| 10 | Tool: two rooms held, not paid |
| 11 | Tool: invitation drafted, not sent |
| 12 | Approval gate: book 238 euros and send the invitation? |
| 13 | Tool: booking and payment (after approval) |
| 14 | Tool: invitation sent |
| 15 | Summary |

`scene.steps`: 15 (scenario length minus one).

Data: `content/assets/scenarios/weekend-trip.ts`, typed and validated by
`content/assets/scenarios/index.ts` (`validateScenario`: starts with a request,
ends with a result, helpers used only after they are started, a re-plan
follows a failure, any call marked `needsApproval` comes after the approval
step, both locales, no dashes). People, hotels, prices, forecasts and the
booking reference are invented; hotels have descriptive names so no real
business is credited with a price.

## VideoScene

Props: `{ src: string; poster?: string; caption?: L10n }`. Used by 1.5
(`src: "personal-demo.mp4"`; a leading `media/` is accepted).

Plays a local file from `content/assets/media/`, found at build time by an
`import.meta.glob` in `video/media.ts`: Vite serves it from the source tree in
dev and copies it into `dist/assets/` on `pnpm build`. Nothing is fetched from
the internet. A missing file shows a calm placeholder card with the expected
path (restart the dev server after adding a file). A file the browser cannot
decode shows the same card with "the browser cannot play it". A `.vtt` file
with the same base name (`personal-demo.vtt`) is attached as captions.
`poster` is a still in the same folder, also used by the preview.

The controller publishes `{ playing, position, at, sound }`; every video
element (the controller's included) follows that state: followers
extrapolate the position from `at`, seek only when off by more than 0.75 s
while playing (0.25 s when paused), and the controller republishes its real
position every 5 s to correct drift. Timestamps from another machine's clock
are only trusted within 30 s. Sound is off by default; the controller routes it
to the projector or to its own screen, never both. If the projector's browser
blocks sound before any click, it plays muted and asks for one click.

| Step | Shows |
| --- | --- |
| 0 | The video, paused (or the placeholder) |
| 1 | Optional: stepping to 1 starts playback, back to 0 pauses |

`scene.steps`: 0, or 1 to let the clicker start the video.

## ModelComparison

Props: `{}`. One comparison table, revealed one row per step. Columns: training
cost, training electricity, reliability (METR: length of task finished half
the time), PhD-level science (GPQA Diamond) and memory (context window, with
pages in small). Each cell has a big value with units in plain words and a
small line saying how we know (estimate, measured, published) or giving a
familiar comparison (US homes for a year, pages). Empty cells say "not
published" or "not tested". Data and the choice of rows: `compare/comparison.ts`.

| Step | Shows |
| --- | --- |
| 0 | GPT-2 (2019): $4,300 (estimate), electricity not published, 3 seconds, not tested, 1,024 tokens (about 1.5 pages) |
| 1 | + GPT-3 (2020): $2.1 million (estimate), 1.3 GWh (estimate, about 120 US homes for a year), 9 seconds (measured on a later GPT-3 version), not tested, 2,048 tokens (about 3 pages) |
| 2 | + Grok 3 (2025): $218 million (estimate), 240 GWh (estimate, about 22,000 US homes for a year), not tested by METR, 75% (published by xAI; PhD experts 65%), 1,000,000 tokens (about 1,500 pages) |
| 3 | + "In about a year", labelled PROJECTION (badge, dashed and hatched row, italic values): over $1 billion, about 1,000 GWh (about 100,000 US homes for a year), about 2 weeks of full-time work, near the ceiling (new, harder tests), 1M+ (not projected) |
| 4 | The table compacts (values only) and three small LINEAR charts appear below it: training cost ($4,300, $2.1M, $218M, projection > $1 billion), training electricity (GPT-2 not published, 1.3 GWh, 240 GWh, projection about 1,000 GWh) and GPQA (GPT-2 and GPT-3 not tested, 75%, PhD experts 65%, projection "near the ceiling" band). Early points sit near zero on purpose; every point is labelled; the projection is a dashed segment to a hollow point in the projection color |

`scene.steps`: 4. The former "Grew by" ratio row is replaced by the charts.

Projection arithmetic (shown on the controller screen only at step 3, in place
of the footnote): cost $218M (Grok 3, 2025) x 2.4 x 2.4 = about $1.3 billion in 2027,
matching Epoch AI's own "more than a billion dollars by 2027"
(`tk-epoch-2024-training-cost-trend`); electricity 240 GWh x 2.1 x 2.1 = about
1,060 GWh in 2027 at the same training time (`tk-epoch-2024-power-trend`);
METR 12 h (Claude Opus 4.6, Feb 2026) x 2^(365/131) = about 83 h, about two
40-hour weeks (`tk-metr-2026-time-horizon-1-1`, 131-day post-2023 doubling).

Why Grok 3: among 2025-2026 frontier models it is the only one with Epoch AI
estimates for both training cost and training electricity, and its developer
published its context window and a GPQA score. Newer frontier models have no
cost or electricity estimate. GPQA was chosen over MMLU because the frontier
row has a GPQA score and no MMLU score; GPT-2 and GPT-3 predate the test.

Sources: `tk-epoch-notable-models` (costs, Grok 3 power and duration),
`llm-patterson-2021` (GPT-3 electricity), `llm-eia-household-electricity`
(homes), `tk-epoch-benchmarking-hub` (METR values), `tk-xai-2025-grok3` (Grok 3
context and GPQA), `tk-rein-2023-gpqa` (experts 65%), `tk-gpt2-context-1024`,
`tk-gpt3-context-2048`.

## `Agenda`

The talk's plan (scene `00-agenda`) with a large QR code to the audience glossary
on the side. Props: `{ heading: L10n; items: L10n[] }`. Items reveal like a
generic `list` (`visibleItemCount`): one per step with `scene.steps` equal to the
item count, all at once with `scene.steps: 0`. The QR code points at
`ctx.joinUrl` with `/join` replaced by `/glossary` (the LAN address), or at
`window.location.origin + "/glossary"` when there is none (public deployment). It
is generated locally with `qrcode`, dark modules on a light card in both themes.
