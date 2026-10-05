# Try it: the talk's demos on the audience's phones

Status: accepted for implementation, 2026-10-04.
Context: the audience page `/glossary` (opened from the QR code), the cloud
endpoints in `packages/cloud-api`, and
[`2026-10-04-interaction-anywhere.md`](2026-10-04-interaction-anywhere.md).

## Goal

A third tab on the audience page, "Try it" (French "Essayer"), where people try
the talk's interactive demos themselves on their phone, without a session or
a presenter, and without ever using up the presenter's budget.

## The tab

- Four demos, one column, opened one at a time, in the order the talk shows
  them: **Then and now** (one question, three models of increasing size
  answer; the clock riddle opens the talk), **Tokens** (type a sentence, see
  its tokens, free), **Words as points** (search a word, see its nearest
  neighbours, in the scene's views: the 2D map, with "show all words", and
  the 3D cloud), **Base model and assistant** (the base model continues a
  text by 10 tokens; the assistant answers a question).
- The words demo on touch: on the map, one finger pans, two pinch to zoom; in
  the 3D cloud, one finger turns it, two pinch to zoom; a tap on a dot shows
  that word's neighbours in both; + and - buttons zoom. The cloud is its own
  lazy chunk, loaded the first time it is picked. It writes positions to the
  DOM in its frame loop (no React render per frame), skips frames while it
  is still, and the map places at most 140 word labels even with "show all
  words".
- Wording: they are "demos" (« démos »), never "games".
- Phone first: works at 360 px wide, big touch targets, light and dark (the
  phone's preference), no horizontal scroll, the page's own FR/EN switch.
- Fast glossary: the tab is a lazy chunk, and each demo is its own lazy chunk
  loaded when opened. The translation catalog and recordings load with them.
- A short privacy line: what you type is sent to the server that runs the
  models; type nothing personal.

## Reuse, not copies

Scene components draw on a 1920x1080 stage, which is unreadable on a phone,
so the solo demos (`packages/scene-components/src/solo/`) are phone layouts
built from the scenes' own parts: the cloud client (`@ai-exhibit/ml-runtime/lm`),
presets and copy (`language/data.ts`, `language/copy.ts`, `embeddings/copy.ts`),
recordings (`language/runtime.ts`), the token tiles (`TokenizedText`), the map
(`InteractiveMap` and `Cloud3D`, which gain a fluid width, two-finger pinch
and, for the cloud, tap to pick a word, also useful on touch screens in the
talk; `MapView` gains a label cap), the vocabulary search
(`embeddings/search.ts`) and the ladder logic (`language/thenAndNow.ts`). They
take a small `SoloEnv` (locale, live or recorded, cloud options, asks left), not a
`SceneContext`: no session, no state publishing, no roles.

## Audience quota

Phones on the venue's Wi-Fi often share one public address, the presenter's
laptop included, so audience calls stay apart from the presenter's budget,
and each phone counts its own asks.

- **Counted on the phone.** localStorage key `ai-exhibit:asks` holds, per
  demo, the times of its live asks: `{ words: [t, ...], base: [...],
  assistant: [...], ladder: [...] }`, nothing else. On every read and before
  every write, times older than an hour are dropped and the pruned log is
  written back. Asks left = 10 minus the demo's count. One ask counts 1
  whatever the number of models behind it, so a ladder question is one ask;
  an ask counts once its answer arrives. Tokenizing, and a word already on
  the map, are free. If storage fails (private mode, full, disabled), the
  counts live in memory for the page (`apps/presenter-web/src/views/glossary/play/asks.ts`).
- **Shown per demo.** Each demo shows its own asks left, discreetly. At 0 it
  shows its recorded examples with a short note, until its oldest ask is an
  hour old; the other demos keep answering live.
- **The quota guides honest use; it is not a lock.** Clearing the browser's
  storage, or a private window, resets it. The Hugging Face spending limit is
  the real safeguard.
- **Server: no hourly count for the audience.** Each phone makes a random
  **device id** once (`crypto.randomUUID`, kept in localStorage, never
  personal data) and sends it in `x-ai-exhibit-audience` on every call of the
  tab. The header keeps the call out of the presenter's budget (per minute,
  100 per hour per address), so the presenter's demos keep working. The
  server only applies an anti-burst cap per device id: 3 model requests a
  minute (a ladder question counts one), 30 free ones (tokenizing, status),
  in memory per server instance, best effort. A refusal is a `429`
  `rate-limited`; the demo says "busy, try again in a few seconds".
- **Same caps as everyone**: the 300-character input cap, the output ceiling,
  2 chat messages, 1 text to embed.
- Endpoints: status, complete, chat, embed, tokenize, ladder. `next` and
  anything else are refused for audience calls. On the local runtime, LAN
  clients reach these endpoints only with the header; everything else stays
  for the presenter's machine. The audience status says whether the server
  has a working key and nothing else about it.

## Recorded fallback

When live calls are not possible (no token on the server, an access code
required, the server unreachable, or this phone's asks for the demo used up), each demo
shows recorded real examples with a short note: tokenizations of the
prepared sentences, the vocabulary's precomputed neighbours, the base model's
and the assistant's recorded answers to the prepared prompts, and the
published answers of four GPT generations to the ladder question. Nothing is
written by hand.

## Not covered

- Access codes: phones do not know the presenter's code, so a deployment that
  requires one shows the recordings only.
- The quota is per browser, not per person: a second browser on the same
  phone counts on its own.
