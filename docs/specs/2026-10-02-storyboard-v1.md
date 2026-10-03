# Storyboard v1: the pruned talk

> Historical record, superseded in part: the talk has evolved since (one edition, `en`; live demos on Hugging Face instead of in-browser models). Current story: [`docs/narrative.md`](../narrative.md); current app: [`docs/architecture.md`](../architecture.md).

Status: accepted, 2026-10-02. Supersedes the narrative order of the original product brief (§4) for
the default edition. The technical design in `2026-10-02-v0-design.md` still holds
except where this document says otherwise.

## Why this revision

Feedback on the first build: too technical, too many slides, wrong order. The talk
must start from what models can do today, then explain AI, machine learning and
neural networks through one running example (smile or frown), then language models,
then who builds them. Polls and audience phones leave the talk (the feature stays in
the code). Most first-build scenes are **parked**: kept in the repository, out of
every edition, visible in `/overview` under "Parked".

## Rules for every scene

- **One concept per scene, about 2 minutes.** The projector shows one idea, big and
  simple. Anything the presenter can say goes in the notes, not on the slide.
- **Speaker notes are bullet points**, one line each, the concepts to explain in order
  (markdown `- ` list, 3 to 7 bullets, optional `**Ask:**` and `**Do:**` bullets).
  No paragraphs, no scripts.
- **Numbers and network diagrams appear only in the smile scenes and the training
  scene.** Everywhere else, no internal machinery on screen.
- **English first.** The default edition is `en`. French strings stay in `L10n`
  (write natural French), but English is what gets rehearsed now.
- **Light theme by default**, dark theme available (toggle in launcher, presenter and
  `/present`).
- Evidence policy unchanged: never invent outputs, numbers, quotes or events. Model
  answers shown as real must be real (run live, recorded from a real run, or clearly
  marked as a slot the presenter fills).

## The talk (default edition `en`, about 60 to 70 minutes)

Chapter IDs are reused with new meanings: `01` to `05`. Parked scenes keep their old
IDs and chapter numbers under `parkedChapters`. New scene IDs must not collide with
parked ones. Order revised after presenter feedback: capabilities first (answers,
agents, then the scale and cost of training), then the technical explanation, then
the industry (labs, drama in the notes, race, chips), which leads into risks.

### 01. What AI can do today

| # | id | Concept | Visual |
| --- | --- | --- | --- |
| 1.1 | `01-opening` | "What can AI do today?" | `title` |
| 1.2 | `01-then-and-now` | Model answers progressed: trick questions that fooled old models ("On a clock, what is 9 + 5?", letters in "strawberry", 9.11 vs 9.9, Sally's sisters, bat and ball). GPT-2 answers live (nonsense), today's model answers correctly | `ThenAndNow { variant: "game" }` |
| 1.3 | `01-connected` | Today's assistants connect to your life: email, calendar, files, browser, shopping and payments, code | `ConnectedAssistant` |
| 1.4 | `01-permissions` | What it may do depends on what we allow, up to spending money | `PermissionsBoard { mode: "permissions" }` |
| 1.5 | `01-personal-demo` | The presenter's own recorded demo | `VideoScene { src: "personal-demo.mp4" }` |
| 1.6 | `01-one-request` | One complex request, every step visible: tools, sub-agents in parallel, approval before paying | `AgentRunExplainer { scenario: "weekend-trip" }` |
| 1.7 | `01-agent-loop` | What just happened is a loop: goal, plan, act, observe, re-plan | `AgentLoop { variant: "intro" }` |
| 1.8 | `01-scale` | Timeline from the Transformer (2017) to GPT-2, GPT-3 and today: model size, electricity used and money spent to train, growing by orders of magnitude. Models are named, companies are not (they come in chapter 03) | `ScaleChart` |

### 02. How it works: AI, machine learning, neural networks, language models

| # | id | Concept | Visual |
| --- | --- | --- | --- |
| 2.1 | `02-envelopes` | Nested: AI ⊃ machine learning ⊃ neural networks ⊃ LLMs | `AIEnvelopes` |
| 2.2 | `02-short-history` | Very short history of the field, ending with the Transformer and GPT-2/GPT-3; no company names | `AITimeline { range: "ai" }` |
| 2.3 | `02-smile-task` | The running example: smile or frown? | `SmileLab { stage: "task" }` |
| 2.4 | `02-smile-rules` | Classic AI: write the rule yourself; a face it gets wrong | `SmileLab { stage: "rules" }` |
| 2.5 | `02-smile-tree` | Machine learning: a learned decision tree | `SmileLab { stage: "tree" }` |
| 2.6 | `02-smile-tree-unseen` | **Ask:** will this new face be classified correctly? No, and we can see why | `SmileLab { stage: "tree-unseen" }` |
| 2.7 | `02-smile-network` | Neural network: far more accurate, its rule is thousands of numbers | `SmileLab { stage: "network" }` |
| 2.8 | `02-smile-network-fail` | It still fails, and the hood shows only numbers | `SmileLab { stage: "network-fail" }` |
| 2.9 | `02-google-photos` | A real case: Google Photos, 2015 | `EvidenceExplorer` (1 item) |
| 2.10 | `02-tests` | Testing helps, never covers everything (optional) | `TestCoverage` |
| 2.11 | `02-next-token` | Same idea, but choose the next token among all tokens | `NextTokenVsClassifier` |
| 2.12 | `02-two-superpowers` | Generative, and the labels are free | `compare` or `cards` |
| 2.13 | `02-tokens` | Text is cut into tokens | `TokenizerPlayground { showIds: true }` |
| 2.14 | `02-embedding-training` | Words as points: random before training, organized after (illustrative) | `EmbeddingExplorer { mode: "training" }` |
| 2.15 | `02-embedding-play` | Play with the map | `EmbeddingExplorer { mode: "search" }` |
| 2.16 | `02-how-training-works` | Hide a word, guess, compare, nudge the numbers | `TrainingLoop` |
| 2.17 | `02-gpus-transformers` | Why now: GPUs and the Transformer | `GpuParallel` |
| 2.18 | `02-base-model` | Pretraining only: it just continues text. One token or several | `BaseModelPlayground` |
| 2.19 | `02-fine-tuned` | Fine-tuning: questions and answers, plus guardrails | `ChatPlayground` |
| 2.20 | `02-not-gpt3-anymore` | Update your picture: recap of the opening questions | `ThenAndNow { variant: "recap" }` |

### 03. Who builds it

| # | id | Concept | Visual |
| --- | --- | --- | --- |
| 3.1 | `03-labs` | The state of the market, lit one per click on black logos: Google DeepMind; Elon Musk and Sam Altman (portraits); OpenAI; Dario Amodei (portrait); Anthropic; Meta; the four Chinese labs at once. The presenter tells the drama; the notes summarize dates (OpenAI founded as a non-profit in 2015, Musk leaves, capped-profit and Microsoft, Anthropic founded 2021, ChatGPT, xAI and Grok, the November 2023 board crisis, the for-profit restructuring) | `AIPlayers { group: "labs" }` |
| 3.2 | `03-race` | Race dynamics: each actor may see slowing down alone as costly (an analogy) | `RaceDilemma` |
| 3.3 | `03-chips` | It is also a race for chips: NVIDIA, TSMC, ASML lit one per click | `AIPlayers { group: "chips" }` |

### 04. Towards the risks

| # | id | Concept | Visual |
| --- | --- | --- | --- |
| 4.1 | `04-to-risks` | Powerful, opaque, racing: why risk is the next question. Risk scenes are parked for now and come back in a later revision | `statement` |

### 05. Closing

| # | id | Concept | Visual |
| --- | --- | --- | --- |
| 5.1 | `05-closing-question` | Who should decide how these systems are built and deployed? | `question` |

## New components (contracts)

All follow `packages/scene-components/src/contract.ts`. Props below are exact.

| Name | Area dir | Props | Notes |
| --- | --- | --- | --- |
| `ThenAndNow` | `capabilities` | `{ variant?: "game" \| "recap"; questionIds?: string[] }` | Questions in `content/assets/then-and-now/questions.ts`. GPT-2 answers live (artifact `gpt2`) with a recorded fallback of a real GPT-2 run; "today" answers recorded from a real current model with model name and date; optional presenter-recorded slots for other generations, shown only when filled. |
| `ConnectedAssistant` | `capabilities` | `{}` | Hub-and-spokes of connectors; reveal one per step; every product claim sourced. |
| `AgentRunExplainer` | `capabilities` | `{ scenario: "weekend-trip" }` | Deterministic, illustrative (labelled): an orchestrator, tool calls (weather, calendar, maps, search, email), sub-agents running in parallel, an approval gate before payment. Controller steps through; display follows. |
| `VideoScene` | `capabilities` | `{ src: string; poster?: string; caption?: L10n }` | Local file under `content/assets/media/`; calm placeholder when missing; controller play/pause synced. |
| `SmileLab` | `smile` | `{ stage: "task" \| "rules" \| "tree" \| "tree-unseen" \| "network" \| "network-fail" }` | One dataset of smile/frown pixel faces, one hand rule, one learned decision tree, one small trained network. Deterministic (seeded, weights committed). |
| `AIEnvelopes` | `story` | `{}` | Nested regions AI ⊃ ML ⊃ NN ⊃ LLM, revealed outward-in, with one plain example each. |
| `AITimeline` | `story` | `{ range: "ai" }` | Sourced milestones. |
| `AIPlayers` | `story` | `{ group: "labs" \| "chips" }` | All logos rendered in one monochrome ink (black on light theme), dimmed until lit; each Next lights the next entry. labs: Google DeepMind, Musk + Altman portraits, OpenAI, Amodei portrait, Anthropic, Meta, four Chinese labs together. chips: NVIDIA, TSMC, ASML. Images local with license and attribution. |
| `NextTokenVsClassifier` | `llm` | `{}` | Two bars (smile, frown) morph into a long bar list over the vocabulary. Uses recorded real probabilities. |
| `TrainingLoop` | `llm` | `{}` | Masked word, guess, error, nudged numbers; illustrative and labelled. |
| `GpuParallel` | `llm` | `{}` | One worker vs thousands in parallel; word-by-word vs all-at-once. |
| `ScaleChart` | `llm` | `{}` | Timeline from the Transformer (2017) through GPT-2, GPT-3 and today's frontier: size, training electricity and training cost, log scale; every point sourced; estimates labelled; no company names on screen. |
| `ChatPlayground` | `language` | `{ prompt?: L10n }` | Instruction-tuned model: Q&A and a guardrail example. |
| `EmbeddingExplorer` (new mode) | `embeddings` | `{ mode: "training" }` | Random scatter animates into the real projected map. |
| `BaseModelPlayground` (rework) | `language` | `{ prompt?: L10n }` | Choose: one token (bars, temperature, sample) or N tokens. |

## Models for the language demos (English)

- `gpt2` (Xenova/gpt2, quantized decoder with past) for "then" answers.
- Base vs fine-tuned pair: prefer a matched pair so the only difference is
  post-training. Candidates: AMD-OLMo-1B (base) and AMD-OLMo-1B-SFT-DPO
  (onnx-community), or Ai2 OLMo-1B-hf (base only) with a separate instruct model, or
  stay on SmolLM2-135M / -Instruct if the 1B models are too slow on WASM. Decide by
  measuring quality and tokens/s; report the choice.
