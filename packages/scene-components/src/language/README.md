# Language scene components

Tokens and token IDs, base and fine-tuned models, chat formats, and the
opening "then and now" trick questions. Registered in
`register.ts`.

All follow `../contract.ts`:

- **controller** (presenter, solo) calls the server's `/api` endpoints through
  `@ai-exhibit/ml-runtime/lm` (`cloudTokenize`, `cloudNextToken`,
  `cloudComplete`, `cloudChat`) and publishes small results with
  `ctx.setState` (text, token IDs and offsets, top-k candidates, revealed text).
  No model runs or downloads in the browser.
- **display** (projector) renders only from `ctx.state`; before the controller
  publishes anything it shows the first recorded example.
- **preview** renders the static initial view from recordings, without motion.
- **Simulation** (the presenter's model source, `ctx.mode === "fallback"`, or
  automatically when Hugging Face is unavailable) replays
  `content/assets/recordings/*.json`. The projector then shows a small
  "Recorded example" tag; the controller's badge says why.

Recordings come from `pnpm recordings:build`: `scripts/prepare/record-cloud.ts`
(the cloud models' answers and next-token bars on the planned prompts, needs
`HF_TOKEN`) and `scripts/prepare/record-tokenizations.ts` (the tokenizer
examples). Re-run it after changing prompts or examples. `next-token.json`
(the source of `../llm/NextTokenVsClassifier`'s numbers) was recorded with the
former local models, whose script has been removed.

## Components, props, reveal steps

Every component works with `steps: 0` (the presenter uses the buttons in the
control rail) and also honours reveal steps when the scene declares them. A
button press overrides the step until the next step change.

| Component | Props | Reveal steps (set `scene.steps`) |
| --- | --- | --- |
| `TokenizerPlayground` | `showIds?: boolean`, `tokenizer?: "llama-3.1" \| "gpt2"` (default Llama 3.1, the cloud model's), `examples?: L10n[]` | `showIds` and `steps: 1`: step 1 shows the token IDs. With `steps: 0`, IDs show at once when `showIds` (button hides them). |
| `BaseModelPlayground` | `prompt?: L10n` | No steps. One choice shown on screen: "one token at a time" (bars at the end of the text, temperature, sample or most likely, add one token) or "several tokens at once" (10, 30 or 60). Both extend the same text. Llama 3.1 8B (base) writes "several tokens" (Llama 3 8B, also a base model, when the server falls back to it; the header names the model that wrote); no provider gives a base model's probabilities, so the bars come from Llama 3.3 70B Instruct reading the raw text (`/api/llm/next`), said in small text. |
| `ChatPlayground` | `prompt?: L10n` (first ready question) | `steps: 1`: step 1 shows, next to the chat, the exact text the model reads for the current exchange (Llama 3.1's published chat template, rendered with `@huggingface/jinja`): an example system prompt (labelled as an example, hidden from users), the role tags in system / user / assistant chips, the question, the assistant tag, then the answer as the continuation and the model's end token (faded when the answer was cut by the length limit). Ready and typed questions; "Harmful request" shows a recorded real refusal. Models that did not refuse when recorded show a notice instead of their answer. |
| `ThenAndNow` | `variant?: "game" \| "recap"`, `questionIds?: string[]` | game, `steps: 4`, no control bar: AI Digest's clock riddle ("When ten plus four is two, what is nine plus six?"), numbers and the clock in bold; step 1 reveals the published answers of GPT-2, GPT-3 and GPT-3.5 (first ChatGPT) together (the ladder's `together`), step 2 GPT-4 (year, estimated training cost, the source's correct/incorrect mark, answers verbatim), step 3 today's recorded answer, step 4 the live ladder: one big field and Ask, from any interactive window (the stage owner makes the calls), then three open models of increasing power, Qwen2.5 0.5B (base), Llama 3.1 8B Instruct and GLM-5.3 (reasoning), each with its year and size, answer in three columns as their words stream in (`/api/llm/ladder`). In Simulation the field is locked on "How many r's are in the word strawberry?" and shows a real recorded run (`content/assets/recordings/live-ladder.json`), labelled as recorded. recap: no steps, recorded data only (not used by a scene). |

Typed input lives on the controller only (sentence to tokenize, typed questions,
edited prompts). Inputs keep the presentation keys to themselves.

## Numbers shown on screen

- Probabilities, logits and token IDs are the model's own (live or recorded).
- `ThenAndNow`: GPT-2 answers are a recorded real run
  (`content/assets/then-and-now/gpt2-answers.json`, made with a local GPT-2
  whose script has been removed); "today" answers were written by
  Claude Opus 5.5 (`claude-opus-5-5`) on 2026-10-02, cold and in one pass, and
  are labelled "recorded answer". Slots for other generations stay hidden until
  filled in `questions.ts` (instructions at the top of that file).

## Themes

Light by default, dark available. Every color comes from `theme/tokens.css`
variables (no raw colors, masks use `var(--color-text)` for opacity). Highlights
use an outline or a translucent mix of an accent with the text color on top,
never accent-colored text on an accent background.
- Sampling in the `sample` stage uses the full distribution live; in fallback
  it samples among the recorded top 12 (stated on screen).

## Model sources (presenter setting)

`SceneContext.modelSource` (shell setting, selector in /presenter and /present,
`?source=` in /lab; default Hugging Face when the server has a token, else
Simulation):

- `hf`: tokens from `/api/tokenize`; base model text from `/api/llm/complete`
  (Llama 3.1 8B base) and bars from `/api/llm/next`; chat from `/api/llm/chat`
  (Llama 3.1 8B Instruct, with the real top-5 probabilities of the first word),
  its hidden-text reveal rendering Llama 3.1's chat template
  (`content/assets/recordings/llama-3.1-8b-instruct.chat-template.json`).
- `simulation`: recordings only (`cloud.json`, `tokenizations.json`); free input
  is disabled, presets only.

Automatic fallback hf -> simulation (no token, offline, access code missing,
error, timeout, network, hourly limit reached); the controller badge shows the
source in use and why in plain words, and after a failed call a "Retry Hugging
Face" button that clears the failure and asks `/api/llm/status` again (no
reload). Too many requests this minute (the server's 429 with `limit:
"minute"`) is a pause, not a fallback: the scene keeps Hugging Face, the
projector shows a short "too many requests" notice, and the scene tries again
once the server's `retryAfter` has passed (the base model's bars, the
tokenizer) or the presenter clicks again (the chat, several tokens). See
`source.ts`. With Hugging Face, the base model costs one request to open or
apply a text, one per "+1" and two per "+10" or "+30" (`baseModel.ts`); the
server allows 50 a minute and 500 an hour per address on Vercel
(`PUBLIC_LIMITS`). The token stays on the
server (`HF_TOKEN`: the runtime's environment or repo-root `.env`, or the
Vercel project's environment).
