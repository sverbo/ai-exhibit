# Presenter guide

How to prepare, rehearse and deliver the canonical talk from this repository,
without help from its author. Follow the sections in order the first time; later,
the [checklist before each talk](#before-each-talk) is enough.

The talk runs from a Vercel deployment (the original:
<https://ai-exhibit.samverbo.com>; see the README to host your own). Paths below
are relative to that address. For development and rehearsal on your laptop,
`pnpm dev` serves the same paths on `http://localhost:5173`.

## 1. Laptop setup (development and rehearsal)

To present from a deployment you only need a recent browser. To run the talk
from the repository:

| Need | Detail |
| --- | --- |
| Node | 22 or later (`node --version`) |
| pnpm | 10, pinned in `package.json`: run `corepack enable` once, then `pnpm --version` |
| Browser | A recent Chrome, Edge, Firefox or Safari. No model runs in the browser |
| Disk | About 600 MB for dependencies |
| Network | Internet for the live language demos (Hugging Face). Without it, every demo plays its recorded real outputs (Simulation) |

```sh
git clone https://github.com/sverbo/ai-exhibit && cd ai-exhibit
corepack enable
pnpm install
pnpm dev
```

## 2. Hugging Face

The live language demos (2.14 Tokens, 2.16 Embedding search, 2.17 Base model,
2.18 Fine-tuned model) run on Hugging Face, through the server's `/api`
endpoints: the Vercel functions, or the local runtime under `pnpm dev`. Nothing
is downloaded to the browser.

- **Token**: create a fine-grained Hugging Face token with only the "Make calls
  to Inference Providers" permission. Locally, put it in the repo-root `.env`
  as `HF_TOKEN=...` (gitignored); on Vercel, in the project's environment
  variables (see the README). Set a spending limit on that account.
- **Model source**: the "Models" switch in the presenter view (and in `/present`
  with the HUD shown) chooses Hugging Face or Simulation for the whole talk. It
  defaults to Hugging Face when the server has a token, otherwise Simulation.
- **Simulation** replays recorded real outputs of the same models on the
  prepared examples; typing is off. A scene switches to it on its own when
  Hugging Face does not answer, and its badge (presenter screen only) says why.
- **Check**: the launcher and the Health tab show "Hugging Face ready" when the
  server has a token and Hugging Face answers.

## 3. Rehearse

| Tool | Use it to |
| --- | --- |
| `/overview` | See every scene of the edition: number, runtime class (A deterministic, B local compute, C live or networked), duration, reveal steps, optional flag, evidence badge, TODO count. Totals compare planned minutes with the edition target. Click a scene to rehearse from there |
| `/present` | Rehearse alone, one window, keyboard driven. A HUD docked under the stage (never over it, so a scene's own controls stay usable) shows the scene, steps, timer, the talking points and key hints. "Hide notes" collapses it to one line, `N` hides it, its "Full screen" button fills the screen |
| `/presenter` | Rehearse exactly as on the day, with notes, transitions and timing |
| `pnpm rehearse` | Automated health check in a real browser with the internet blocked: every scene and reveal step of the edition in `/present`, live and in fallback; then `/presenter` driving `/projector` in two windows of one browser, and the projector's own keys; then the other views. It reports console errors, uncaught exceptions, crashed scenes and any request to the internet, and exits 1 on any problem (full report in `$TMPDIR/ai-exhibit-rehearsal.json`). It starts its own runtime and Vite on free ports and its own browser, so your windows are untouched. Options: `--headed`, `--viewport 1920x1080`, `--shots <dir>`, `--jobs <n>`, `--base-url <url>` (drives a running app and its session: reset it afterwards). First run: `pnpm exec playwright install chromium` |

Speaker notes are a short bullet list per scene, in the edition's language: the
concepts to explain, in order, plus optional **Ask:** (a question to the room) and
**Do:** (an action on stage) bullets. The presenter view shows them large in the
right-hand panel, numbered, with Ask and Do bullets on a tinted band; the
takeaway sits above them and the transition to the next scene below. `A−`/`A+`
resize them (remembered per machine). Sources, TODOs and Health are tabs above
the notes.
Rehearse every interactive scene (runtime class B) once live and once with `F`.

## 4. Day-of setup

Open the deployment's home page on the presenter laptop. It offers three
entries:

**Two screens (recommended).** Set the projector as an extended display (not
mirrored).

1. Open **Presenter** on the laptop screen (`/presenter`).
2. Open **Projector** (`/projector`) in a second window of the same browser
   (not a private window), drag it to the projector and make it full screen.
   The two windows stay in sync, and either one takes the arrow keys or a
   clicker.
3. Check the Health tab of the presenter view: the session and the Hugging
   Face status.

**One screen.** Mirror the displays and open only the **Projector**: it works
alone, `N` shows your notes (the room sees them too), the keyboard or a
clicker advances it, and its scenes are interactive.

You can switch mid-talk: open the Presenter at any time; it picks up where you
are and takes over the scenes (every model call), while the projector mirrors
it and still takes the keys. Close the Presenter and the projector takes over
again. Only one window runs the scenes at a time: a presenter view first,
otherwise the window opened first.

## 5. Audience phones

The audience's phones get the glossary (`/glossary`): its QR code is on the
home page and on the agenda scene. On a deployment, turn off Vercel's
Deployment Protection so it opens without a login.

There is no phone remote and no audience voting: the projector and presenter
windows are driven by the keyboard or a clicker.

## 6. Keyboard map

Active in `/presenter` and `/present`. Keys typed inside a scene's text field
stay in the field.

| Key | Action |
| --- | --- |
| `→`, `Space`, `PageDown` | Next reveal step, then next scene |
| `←`, `PageUp` | Previous step |
| `Shift+→` / `Shift+←` | Next / previous scene (skip the remaining steps) |
| `↓` / `↑` | Jump to the end of the current scene (every animation shown) / back to its start; never changes scene |
| `F` | Toggle fallback for the current scene |
| `R` | Reset the current scene (state and reveal step) |
| `B` | Blackout the projector (toggle) |
| `Z` | Freeze the projector on the current position (toggle) |
| `T` | Start or pause the timer |
| `N` | Toggle the notes panel (`/presenter`) or the HUD (`/present`) |
| `G` | Go to a scene: type a number or part of a title |
| `L` | Switch between the light and dark theme on every screen |
| `Esc` | Close the palette |

**Light or dark.** The talk is light (ink on warm paper) by default. The theme
is one setting for the whole talk: switch it with `L` or the Light/Dark control in
the launcher, the presenter view or the `/present` HUD, and the projector
follows through the session. Each screen remembers the last choice. Dark
suits a dim room; light reads better in a bright one.

A clicker that sends `PageDown`/`PageUp` or arrows works as is. The presenter view
also has buttons for each action, plus "Animations paused" (stops motion on every
screen).

## 7. Fallback

`F` switches the current scene to its fallback on every screen at once, in one
keypress; press it again to go back to live. The presenter view shows
"Fallback active". A language scene whose cloud call fails switches to its recordings on
its own and says why, calmly.

| Scenes | Live | In fallback |
| --- | --- | --- |
| 1.4 Then and now | Published answers and recorded real GPT-2 runs (no live model) | Same |
| 2.14 Tokens | Tokenizes anything typed with Llama 3.1's tokenizer (or GPT-2's), on the server | Recorded tokenizations of the example sentences; typing is off |
| 2.15 Embedding training | Precomputed map, no model | Same |
| 2.16 Embedding search | Embeds the typed word through Hugging Face and finds its neighbours | Matches the typed text to the closest prepared word and shows its precomputed neighbours |
| 2.17 Base model | Llama 3.1 8B (base) continues the text; the one-token bars come from Llama 3.3 70B Instruct reading the raw text (the base model's provider gives no probabilities), and the screen says so | Recorded continuation and recorded bars for the prepared prompt |
| 2.18 Fine-tuned model | Llama 3.1 8B Instruct answers, with its chat template shown | Recorded answers to the ready questions and the harmful request |
| Every other component (capabilities, agents, story, text classifier, risks, evidence) | Deterministic | Identical: `F` changes nothing visible |

## 8. Blackout and freeze

- `B` turns the projector black (the presenter view shows "Projector black"). Use
  it to pull attention back to you. `B` again restores it.
- `Z` freezes the projector on what it shows now. You can keep navigating on the
  laptop (the stage is marked "Private navigation: the audience does not see this
  scene"), find a scene, then `Z` again: the projector jumps to where you are.

## 9. Reset before the talk

Rehearsing leaves state behind: timer, votes, fallback flags, scene states.

1. Presenter view, Health tab, "Restart the talk", confirm. This clears the timer,
   votes, scene states, fallback flags, blackout and freeze. The edition and
   current scene stay.
2. Go to the first scene: `G`, type `0.1`, `Enter`.
3. Press `T` when you start speaking.

Under `pnpm dev`, the session survives a runtime restart
(`~/.cache/ai-exhibit/session/state.json`), and a runtime on another port keeps
its own session (`session-<port>`), so a test runtime never overwrites the
talk's.

**"This window is out of date".** When scenes were added or renamed after a
window was opened, that window shows this banner and stops navigating (it would
otherwise drag the talk back to the first scene). Reload it. The projector
reloads itself. In development, content changes reload every window.

## 10. Edition

There is one edition, `en`: English, 45 scenes, planned 92 min against a target
of 75 to 95 min. Once the timer runs (`T`), the presenter view says "ahead" or
"behind" against the planned scene durations and estimates the finish time
against that target. Scenes marked `optional` are the first candidates to skip
when running late (`Shift+→`).

Scenes carry `localizationNotes` for adapting examples to a local audience.

## 11. Your own version of the talk

**Config** (top right of the presenter view) makes the talk yours without
touching the repository:

- **Reorder** scenes by dragging them, with the ↑/↓ buttons, or `Alt+↑`/`Alt+↓`
  on a focused row. Chapter headers follow the scenes.
- **Hide** scenes: navigation skips them, so the projector never shows them.
  `G` still lists them, greyed, if you decide to show one anyway. Hiding the
  scene you are on keeps you there until you move on.
- **Note**: your own line for a scene, shown first in its speaker notes
  (marked "Mine"), never on the slide.

The panel shows the new planned total live; the pace, finish estimate and
chapter strip use your sequence. Everything is saved in this browser at once and
applies to every window of it: the projector follows the same order and hidden
scenes, whether it is linked to the presenter view or running alone. **Export** downloads a JSON
file you can keep, edit by hand or bring to another machine with **Import**;
**Reset to the default talk** clears it.

Scenes are referred to by a short code (shown under the scene number, and
accepted by `G`), so your configuration keeps working when the talk is updated:
new scenes appear after the scene that precedes them, and codes of removed
scenes are listed once in the panel. The configuration belongs to the browser
profile: open the presenter and the projector in the same one.

## Before each talk

Online, a few days ahead:

- [ ] `git pull && pnpm install` (if you present from your own copy)
- [ ] `pnpm verify:content`: 0 errors
- [ ] `pnpm verify:sources`: every source answers; fix or replace dead links
- [ ] Review the scene TODOs: `/overview` counts them, the presenter view's TODO tab
      lists them per scene. Each is an unverified claim or missing work: verify it,
      rephrase the scene, or decide to say it with its caveat
- [ ] Governance (5.3): re-check the European Commission's AI Act page and make
      sure the dates in the speaker notes and in your speech match
- [ ] Launcher: "Hugging Face ready" (or decide to present in Simulation)
- [ ] `pnpm rehearse`: passes

On the presentation laptop, the day before or on site:

- [ ] On the venue network, open the deployment: one pass through the language
      scenes with Hugging Face, then the same pass with the "Models" switch on
      Simulation
- [ ] One pass through `/overview` and every C scene in `/present`, live and with `F`
- [ ] Projector resolution and full screen, glossary QR scanned once with a phone
- [ ] [Reset the session](#9-reset-before-the-talk)

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Presenter and projector do not follow each other | They must be two windows of the same browser profile (not a private window, not two browsers): they sync through the browser. Reload both |
| The glossary QR asks the audience to log in | Vercel's Deployment Protection is on: turn off Vercel Authentication in the project's settings |
| Under `pnpm dev`, a phone cannot open the glossary QR on venue Wi-Fi | Many venue networks isolate devices. Use a phone hotspot; the QR codes update within a few seconds to the new address |
| A language scene's badge says "Recorded: no Hugging Face token on the server" | Set `HF_TOKEN` in the Vercel environment and redeploy (or in the repo-root `.env` and restart `pnpm dev`). Until then the scene plays its recordings |
| Badge says "Hugging Face unreachable" or "the cloud model failed" | No internet, or the provider is down. The scene already plays its recordings; carry on, or switch the "Models" control to Simulation for the rest of the talk |
| A demo waits on "The model is computing" | A cloud answer takes a few seconds (the first tokenizer call can take longer while the server fetches its files). Press `F` to show the recording and continue. Navigation never waits for a model |
| Projector stays black or frozen | `B` or `Z` is on: the presenter view's top-left status says which. Press the same key again |
| A scene crashed | The projector shows a calm slate with the scene title; the error detail stays on the laptop. `F` switches to fallback, which also retries the scene; `Shift+→` moves on |
