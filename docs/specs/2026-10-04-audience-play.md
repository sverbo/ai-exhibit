# Audience play: the talk's demos on the audience's phones

Status: accepted for implementation, 2026-10-04.
Context: the audience page `/glossary` (opened from the QR code), the cloud
endpoints in `packages/cloud-api`, and
[`2026-10-04-interaction-anywhere.md`](2026-10-04-interaction-anywhere.md).

## Goal

A third tab on the audience page, "Play" (French "Jouer"), where people try
the talk's interactive demos themselves on their phone, without a session or
a presenter, and without ever using up the presenter's budget.

## The tab

- Four demos, one column, opened one at a time: **Tokens** (type a sentence,
  see its tokens, free), **Words as points** (search a word on the embedding
  map, drag and pinch to explore, see its nearest neighbours), **Base model
  and assistant** (the base model continues a text by 10 tokens; the
  assistant answers a question), **Then and now** (one question, three models
  of increasing size answer).
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
(`InteractiveMap`, which gains a fluid width and two-finger pinch, also
useful on touch screens in the talk), the vocabulary search
(`embeddings/search.ts`) and the ladder logic (`language/thenAndNow.ts`). They
take a small `SoloEnv` (locale, live or recorded, cloud options), not a
`SceneContext`: no session, no state publishing, no roles.

## Audience budget

Phones on the venue's Wi-Fi often share one public address, the presenter's
laptop included. Audience calls therefore get their own budgets:

- Each phone makes a random **device id** once (`crypto.randomUUID`, kept in
  localStorage, never personal data) and sends it in `x-ai-exhibit-audience`
  on every Play call. The header moves the call to the audience budgets.
- **Per device**: 10 model requests per hour, 3 per minute. The ladder costs
  one request per model (3). Tokenizing is free (30 per minute, no hourly
  count), and so is a word already in the map's vocabulary (no call).
- **Room cap per address**, all audience devices together: 200 model requests
  per hour, 30 per minute. On the local runtime every LAN phone shares one
  room budget.
- **Smaller answers**: at most 60 output tokens (the base model asks for 10),
  2 chat messages, 1 text to embed; the 300-character input cap stays.
- The presenter's budgets (per-minute, 100 per hour per address) never see
  audience calls, so the presenter's demos keep working.
- Endpoints: status, complete, chat, embed, tokenize, ladder. `next` and
  anything else are refused for audience calls. On the local runtime, LAN
  clients reach these endpoints only with the header; everything else stays
  for the presenter's machine.
- Answers carry `x-ai-exhibit-remaining` (the device's requests left this
  hour, the room cap included); the audience status returns
  `audience: { remaining, perHour }` and no key details. The tab shows it
  discreetly.
- Refusals are `429` with `window: "minute" | "hour"`: "minute" says "busy,
  try again in a few seconds"; "hour" says the live answers are used up for
  now and switches the tab to the recorded examples.

Limits: a determined user can reset the device id (clear storage), so the
per-address room cap and the Hugging Face spending limit are the real
safeguards. Counters live in memory per server instance (several Vercel
instances each count on their own): best effort, as for the presenter.

## Recorded fallback

When live calls are not possible (no token on the server, an access code
required, the server unreachable, or the hourly budget used up), each demo
shows recorded real examples with a short note: tokenizations of the
prepared sentences, the vocabulary's precomputed neighbours, the base model's
and the assistant's recorded answers to the prepared prompts, and the
published answers of four GPT generations to the ladder question. Nothing is
written by hand.

## Not covered

- Access codes: phones do not know the presenter's code, so a deployment that
  requires one shows the recordings only.
- No per-device counter survives a server restart.
