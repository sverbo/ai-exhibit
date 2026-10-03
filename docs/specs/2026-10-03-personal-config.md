# Personal talk configuration

Status: accepted for implementation, 2026-10-03.
Context: [`2026-10-02-v0-design.md`](2026-10-02-v0-design.md). The talk is
presented from a static deployment (Vercel): presenter and projector are two
windows of one browser profile, synced over BroadcastChannel, with no server
state. Anyone who presents the talk should be able to make it theirs without
forking the repository.

## What a presenter can change

A **Config** button in the presenter view opens a panel where the presenter can:

1. **Reorder** scenes: drag and drop, or the move up/down buttons
   (`Alt+↑`/`Alt+↓` on a focused row). Chapter headers are derived from the
   sequence (a header appears wherever the chapter changes); they are not
   moved themselves, and a scene may move anywhere.
2. **Hide** scenes: navigation skips them, so the projector never shows them.
   They stay listed, greyed, in the panel, in the go-to palette and in
   `/overview`. The go-to palette can still jump to a hidden scene on purpose.
3. **Add a personal note** per scene: it becomes the first bullet of that
   scene's speaker notes (desk, rehearsal HUD), marked as personal, rendered as
   plain text (never markdown or HTML, since an imported file is untrusted). It
   never reaches the projector.
4. **Export** the configuration as a JSON file, **import** one, and **reset**
   to the default talk.

The panel shows the planned total of the personal sequence, live, against the
edition target.

## Scene codes

Every `SceneDefinition` has a `code`: 4 or 5 characters, lowercase letters and
digits, readable and derived from the topic (`tokn`, `race`, `swiss`). The
configuration refers to scenes **only by code**, never by position, number or
ID, so the author can add, remove, reorder or renumber scenes and existing
configurations keep working.

Rules, enforced by `validatePresentation` (`pnpm verify:content`):

- format `^[a-z0-9]{4,5}$`;
- unique across `scenes` and `parkedScenes`;
- not in `retiredSceneCodes` (codes of deleted scenes).

Rules for authors (documented in the content guide): **never change a code,
never reuse one.** When a scene is deleted, move its code to
`retiredSceneCodes`. A scene that changes topic so much that old notes would
be wrong gets a new code (and the old one is retired).

The presenter sees codes discreetly: in the scene header and in the go-to
palette, which also accepts a code (an exact code match comes first).

## Storage and format

One configuration per talk (presentation ID) per browser profile, in
`localStorage` under `ai-exhibit:personal:<talkId>`. Presenter, projector,
rehearsal and overview windows read the same key and listen to the `storage`
event, so a change in one window applies in every other window of the profile.
The exported file uses the same shape, pretty-printed:

```json
{
  "schema": 1,
  "talk": "canonical",
  "order": ["open", "agnd", "tokn"],
  "hidden": ["race"],
  "notes": { "tokn": "Tell the story about my first prompt." },
  "help": "...",
  "titles": { "open": "1.3 Opening" }
}
```

- `order`: codes in the presenter's order. Empty means "the default order"
  (a configuration that only hides scenes or adds notes keeps following the
  author's order). The panel writes the full order once something is moved.
- `hidden`: codes to skip. `notes`: code to text (at most 2000 characters).
- `help` and `titles` are written on export for humans and ignored on import.

Import never throws: invalid JSON, a non-object, an unsupported `schema`
(newer than 1) or another talk's file are refused with a message; entries of
the wrong type are dropped and counted; unknown codes are reported and kept
out of the sequence.

## Applying a configuration (forward compatibility)

Input: the edition's default scene list and a configuration.

1. Codes that match no scene of the talk (`scenes` or `parkedScenes`) are
   **unknown**: ignored, listed once in the panel (with a button to forget
   them). Codes of talk scenes outside the current edition are ignored
   silently.
2. Known codes in `order` (duplicates dropped) give the personal order.
3. A scene of the edition missing from `order` (for example one the author
   added later) is inserted right after its **nearest predecessor in the
   default order that is placed**, and is visible. With no such predecessor it
   goes first. Consecutive new scenes keep their default order.
4. `hidden` and `notes` apply to known scenes only.

## Navigation, timing and sync

- Navigation (`→`, `←`, `Shift+→`, from the presenter view or the projector
  window's keys and clicker) walks the
  **navigable** sequence: the visible scenes in personal order, plus the
  current scene if it is hidden. Hiding the scene on screen therefore keeps the
  talk where it is until the presenter moves on, then skips it.
- Every time estimate uses the personal sequence: pace ahead/behind, the
  finish estimate, the planned total, the chapter strip and the comparison
  with the edition target. Hidden scenes count zero (a hidden current scene
  marks a position, not a duration).
- No session protocol change. The session still carries only the current
  scene ID, which every window resolves against the full edition, so a
  projector on a hidden scene still renders it and a projector opened alone
  reads the same configuration from storage. Stage ownership (which window
  runs the scene, `stageOwner`) is independent of the configuration: both
  windows compute the same sequence from the same storage, so handing the
  stage over keeps the order and hidden set.
- The content-version check (`contentHash`) stays on the default edition
  list, so personal configurations never mark a window out of date.
- The configuration belongs to the browser profile: a window in another
  profile or on another device navigates the default sequence.

## Tests

`personal.test.ts` (merge and forward-compatibility rules, navigation skipping
hidden scenes and staying on a hidden current scene, timing, editing, import
validation, export round trip), `notes.test.ts` (personal note injection),
`validate.test.ts` (code format, uniqueness, retired codes),
`sceneSearch.test.ts` (go-to palette code lookup).
