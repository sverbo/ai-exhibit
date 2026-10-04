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
are only trusted within 30 s. Sound comes only out of the audience screen
(`ctx.audienceScreen`: the projector window, alone or linked), never out of the
presenter view or its mirror, so it cannot play twice; the presenter can turn it
off. If the projector's browser
blocks sound before any click, it plays muted and asks for one click.

| Step | Shows |
| --- | --- |
| 0 | The video, paused (or the placeholder) |
| 1 | Optional: stepping to 1 starts playback, back to 0 pauses |

`scene.steps`: 0, or 1 to let the clicker start the video.

## YouTubeScene

Props: `{ videoId, durationSec, kicker?, heading?, caption? }`. Scene
`00-welcome-video` (0.2). A large 16:9 YouTube player (IFrame Player API,
privacy-enhanced host `youtube-nocookie.com`, no YouTube controls), with a
kicker, a heading and a caption. `scene.steps`: 0; nothing plays until the
presenter presses Play. Helpers and the loader: `video/youtube.ts`.

Sound plays once. Only the audience screen holds a player:
`ctx.audienceScreen` is true on the projector window (alone or linked), on a
single present window and in the lab's projector pane; it is false in the
presenter view, its projector mirror and previews, which show a still card
with the clock ("Plays with sound on the projector only") and never load
YouTube. Playback follows the `VideoState` of `video/sync.ts`: the
controller's Play, Pause, Back to start and position slider only publish
state; the player seeks when it drifts more than 2 s while playing. A
controller without a player (the presenter) ends playback on its own clock
after `durationSec`; a controller with one (projector alone) republishes the
real position every 5 s. If the browser blocks sound (no gesture on the
projector yet), the player goes muted and asks for one click, like VideoScene.

What YouTube allows, plainly:

- Captions: on (`cc_load_policy=1`), in the slide's language when YouTube has
  that track (`cc_lang_pref`, `hl`). The opening video has English captions
  only (2026-10-04): a French talk shows English subtitles. The embed does not
  trigger auto-translation.
- Audio: no documented parameter or public API method selects the audio
  track (`getAvailableAudioTracks` and `setAudioTrack` are internal to
  YouTube's player). The video has auto-dubbed tracks; in tests (English and
  French talk, 2026-10-04) the English original played, but YouTube may choose
  a dub from the viewer's settings: check on the projector machine.
- Offline: the script never loads (10 s timeout) and the slide shows a card
  with the video's address instead; a player that is merely slow (20 s) shows
  the card until it becomes ready. No crash.

The scene declares `online.hosts`: the one deliberate exception to "nothing
from the internet during a talk". `pnpm rehearse` blocks those hosts too (so
it rehearses the offline card) without reporting them.

## HoldingSlide

Props: `{ title: L10n; line?: L10n }`. Scene `00-holding` (0.1), the first
scene of a fresh session: shown while the room fills up, it never advances by
itself. The talk's title (`talkTitle` in `presentations/canonical/src/chapters.ts`,
also the presentation title), "The talk starts in a moment", the glossary QR
code (`agenda/GlossaryQr.tsx`, shared with the agenda) and a small status dot:
"Getting ready", then "Ready" when both checks pass (`intro/readiness.ts`,
asked again every 15 s): the language demos (Simulation counts as ready, with
a discreet "simulation" note; Hugging Face needs `GET /api/llm/status`
configured and reachable, and the access code when one is required) and the
YouTube player script loaded. The presenter's own screen also says which check
is still waiting. `scene.steps`: 0.

## FrontierProgress

Props: `{}`. Scene `01-progress` ("Everything went up"): one slide, two rows,
one series per click. Data, sources and the design note: `progress/progress.ts`.

Top row, four small LINEAR charts on a shared 2019 to 2028 axis, each with a
title, a plain-words subtitle, a tag saying how we know and a big growth
factor: training cost (estimate, Epoch AI), training power (estimate, Epoch
AI), memory as pages (published by the developers) and task length, the METR
time horizon (measured). Only the first and last
points are labelled on screen; the notes give every point. Bottom row, one
chart of the hardest tests as "best score so far" (Epoch AI data), each line
named at its end in a right-hand column (labels never overlap:
`placeEndLabels`); while a new series is introduced the older ones fade.

| Step | Shows |
| --- | --- |
| 0 | Heading and empty frames (titles, axes) |
| 1 | Training cost: $4,300 (GPT-2, 2019) to $366M (GPT-4.5, 2025), × 84,000 |
| 2 | Training power: 5 MW (GPT-3) to 233 MW (GPT-6 Astra, 2026), × 46; "≈ 190,000 US homes" |
| 3 | Memory: 1.5 pages (GPT-2) to 1,500 pages (Grok 3, 2025), × 1,000; "not projected" |
| 4 | Task finished half the time (METR): 3 seconds (GPT-2) to 17 hours (Claude Mythos Preview, 2026), × 19,000 |
| 5 | GPQA Diamond 36% to 96%, with the PhD experts line at 65% |
| 6 | + SWE-bench Verified 31% to 84% |
| 7 | + Humanity's Last Exam 5% to 55% and FrontierMath 1% to 94% |
| 8 | + ARC-AGI-2 0% to 95%, and a medal marker: Maths Olympiad gold, July 2025 |
| 9 | Projection for October 2027 on cost, power and time horizon: a dashed line in the projection color leaving the chart as an arrow ("over $1 billion", "about 500 MW", "3 to 8 weeks of work") and a Projection badge; the controller sees the arithmetic instead of the footer |

`scene.steps`: 9.

Projection arithmetic: $366M (GPT-4.5, Feb 2025) × 2.4 a year for 2.6 years
≈ $3.6 billion, shown as Epoch AI's own "over $1 billion by 2027"
(`tk-epoch-2024-training-cost-trend`); 233 MW × 2.1 a year for 1.1 years ≈ 520
MW (`tk-epoch-2024-power-trend`); 17 h × 2^(days / doubling) with METR's two
doubling times, 7 months (`tk-metr-2025-time-horizon-paper`) and 131 days
(`tk-metr-2026-time-horizon-1-1`), gives about 100 h to 310 h, 3 to 8 weeks of
40 hours. Memory and test scores are not projected.

## `Agenda`

The talk's plan (scene `00-agenda`) with a large QR code to the audience glossary
on the side. Props: `{ heading: L10n; items: L10n[] }`. Items reveal like a
generic `list` (`visibleItemCount`): one per step with `scene.steps` equal to the
item count, all at once with `scene.steps: 0`. The QR code points at
`ctx.glossaryUrl` (the LAN address under `pnpm dev`), or at
`window.location.origin + "/glossary"` when there is none (public deployment). It
is generated locally with `qrcode`, dark modules on a light card in both themes.
