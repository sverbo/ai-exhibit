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
take a small `SoloEnv` (locale, live or recorded, cloud options), not a
`SceneContext`: no session, no state publishing, no roles.

## Audience budget

Phones on the venue's Wi-Fi often share one public address, the presenter's
laptop included. Audience calls therefore get their own budgets:

- Each phone makes a random **device id** once (`crypto.randomUUID`, kept in
  localStorage, never personal data) and sends it in `x-ai-exhibit-audience`
  on every call of the tab. The header moves the call to the audience budgets.
- **Per device and demo**: 5 asks per hour for each demo that calls a model:
  words (embedding a new word), base model (+10 tokens), assistant, and the
  three-model ladder. One ask counts 1 whatever the number of models behind
  it, so a ladder question is one ask. A device makes at most 3 asks a minute,
  all demos together. Tokenizing is free (30 per minute, no hourly count), and
  so is a word already on the map (no call).
- **No cap per address by default** (presenter's decision, 2026-10-04): phones
  on one venue Wi-Fi share an address, and the budget is per phone only. An
  optional room cap (`roomPerHour`, `roomPerMinute` in `AudienceLimits`, in
  model requests, a ladder question counting 3) remains available.
- **Smaller answers**: at most 60 output tokens (the base model asks for 10),
  2 chat messages, 1 text to embed; the 300-character input cap stays.
- The presenter's budgets (per-minute, 100 per hour per address) never see
  audience calls, so the presenter's demos keep working.
- Endpoints: status, complete, chat, embed, tokenize, ladder. `next` and
  anything else are refused for audience calls. On the local runtime, LAN
  clients reach these endpoints only with the header; everything else stays
  for the presenter's machine.
- A demo's answers carry `x-ai-exhibit-remaining`: that demo's asks left this
  hour (an optional room cap included). The audience status returns
  `audience: { perHour, games: { words, base, assistant, ladder } }` and, of
  the key, only whether it is valid. Each demo shows its own asks left,
  discreetly.
- Refusals are `429` with `window: "minute" | "hour"`, the demo (field `game`) and the
  `scope` (`"device"` or `"room"`). "minute" says "busy, try again in a few
  seconds". A device's demo spent switches that demo to its recorded
  examples and says the other demos still answer live; the room spent (or
  every demo spent) switches the whole tab to recordings. The wire names
  (`game`, `games`) predate the wording and stay for compatibility.

Limits: a determined user can reset the device id (clear storage); with no
room cap, the Hugging Face spending limit is the real safeguard. Counters live in memory per server instance (several Vercel
instances each count on their own): best effort, as for the presenter.

## Recorded fallback

When live calls are not possible (no token on the server, an access code
required, the server unreachable, or the demo's asks used up), each demo
shows recorded real examples with a short note: tokenizations of the
prepared sentences, the vocabulary's precomputed neighbours, the base model's
and the assistant's recorded answers to the prepared prompts, and the
published answers of four GPT generations to the ladder question. Nothing is
written by hand.

## Not covered

- Access codes: phones do not know the presenter's code, so a deployment that
  requires one shows the recordings only.
- No per-device counter survives a server restart.
