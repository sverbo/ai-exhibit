# LLM scene components

Concept scenes for language models (storyboard v1). Registered in `register.ts`.
None of them runs a model: they replay recorded numbers, sourced data or a
clearly labelled illustration, so controller, display and preview render the
same thing from the reveal step and a small shared state.

Both follow `../contract.ts`:

- **controller** may change a small state (`ctx.setState`); the projector follows it.
- **display** renders from the reveal step and `ctx.state` only.
- **preview** and reduced motion render the end state of the step, without animation
  (`common.module.css` `.still`, `useElapsed` returns `Infinity`).
- The bottom 168 px of the stage stay free for the renderer's placard.
- Projector citations use `NeutralSources`: authors or document titles, never a
  lab as publisher, because these scenes come before the talk names companies.

## Components, props, reveal steps

| Component | Props | Steps (set `scene.steps`) | State (controller) |
| --- | --- | --- | --- |
| `NextTokenVsClassifier` | `{}` | `4`: 0 the chapter's sports classifier picks football or basketball for a held-out sentence (real output of the textlab network); 1 the same bars over the whole vocabulary for the start of a sentence ("She looked out of the" / "Il était une"), with the recorded probabilities and every token drawn as one dot; 2, 3, 4 the most likely word slides into the sentence and the bars update for the next position, one word per step (window, and, saw / fois, une, grande) | none |
| `TrainingLoop` | `{}` | `4`: 0 ordinary text shown up to some point; 1 at first the model guesses at random (top guesses are arbitrary tokens, the right word gets about 1 chance in the vocabulary size, 0.002% for 50,304 tokens); 2 compare with the actual next word, error almost 100%; 3 one nudge of a few numbers, barely better; 4 one word forward, then many different texts (web, books, code) faster and faster while the counter climbs to 15.6 trillion and an illustrative curve shows the right word's chance rising to about 60%. Reduced motion shows the end state | `{ example: number }` ("Another sentence", includes a JSON line) |

## Where the numbers come from

- `NextTokenVsClassifier`: the prompt is `NEXT_TOKEN_SEQUENCE` in `prompts.ts`
  (recorded with the former local models, chosen because the
  locale's base model continues it greedily with three whole words);
  `nextToken.ts` holds copies of `content/assets/recordings/next-token.json`
  (greedy run, top candidates, first four positions) for the base model each locale uses (`languageModelFor` in
  `../language/data.ts`: AMD-OLMo-1B in English, Qwen2.5-0.5B in French).
  `nextToken.test.ts` fails when the recording or the model mapping changes; copy
  the new candidates from the recording then. Step 0 calls the textlab network
  (`netBasketballProbability`, committed weights) on a sentence of its test set.
- `TrainingLoop`: guesses, error and weights are invented (tag "Illustration:
  invented numbers"). The model only ever sees the text before the next word.
  Real: 15.6 trillion tokens (`llm-llama3-paper`), the demo
  model's parameter count (model cards).
  Sources: `content/sources/llm.ts`.
