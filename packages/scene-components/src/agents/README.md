# Agents components

Scene components for the agent thread of the talk (0.4, 0.5, 5.2 to 5.6, 8.1).
All are deterministic: `mode: "fallback"` renders exactly like `live`, so scenes
can use `fallback: { kind: "deterministic" }`. State hooks and UI helpers come
from `../learning/shared/`. Every component accepts an optional `heading: L10n`.

## The agent loop (`loop/`)

Not a scene component of its own. `loop/LoopRing.tsx` draws the loop: the goal
at the center, then Plan, Act, Observe on a ring, and back to Plan (planning
again is just the next turn). `loop/MiniLoop.tsx` draws it in small with who
does what: the model plans (accent, yellow), ordinary software acts and reads
the result (accent-2, green), you give the goal; a pulse goes round (off in
previews and with reduced motion). `AgentRunExplainer` shows it on its `loop`
click (1.8).

## ToolCallDemo

Props: `{ scenario?: "weather" | "search" | "calculator" | "code" }` (default
`weather`). The controller can switch scenario live. Every scenario is labelled
illustrative on screen.

### `weather`: what "calling a tool" really means

For the scene placed before the complex agent run. Question: "Do I need an
umbrella in Bruges tomorrow?". A numbered track on the left shows who sends
what to whom. The right panel shows the real JSON in large monospace type,
coloured with the tokens, with the important fields highlighted at each step.
Block shapes follow the Anthropic Messages API (tool definition with
`name`/`description`/`input_schema`, a `tool_use` block with
`type`/`id`/`name`/`input` and `stop_reason: "tool_use"`, a `tool_result` block
with `type`/`tool_use_id`/`content`). These shapes were checked against the
tool-use docs on 2026-10-02 (`toolcall/weather.ts`). The values are made up,
and the date is tomorrow's.

| Step | Shows |
| --- | --- |
| 0 | The question, and "what happens between the question and the answer?" |
| 1 | The software gives the model the `get_weather` tool definition (location, date) |
| 2 | The model's reply is a `tool_use` block, not prose. On screen: "the model only writes text; the software reads it and runs the tool" |
| 3 | The software calls the weather service and sends back a `tool_result` with the same id |
| 4 | The model's plain-language answer |

### `search`: a chatbot vs the same model with a web search tool (JSON)

Used by scene 01-tool-call. Question: "Who won last night's match, Westhoek
against Damme?" The match, sites and score are invented, and the scene says so.
Left: the model alone, which cannot know recent facts. Right: the same model
with a `web_search` tool. A numbered strip shows the round trip, and only
the current JSON is on screen (24px monospace, token colours, key fields
highlighted). Block shapes match `weather` (`toolcall/search.ts`).

| Step | Shows |
| --- | --- |
| 0 | The question, on both sides |
| 1 | Left: "I can't know that", and why (its knowledge stops at training) |
| 2 | Right: the `web_search` tool definition (`input_schema` with `query`) |
| 3 | The model's `tool_use` block with the query, plus `stop_reason: "tool_use"`. On screen: the model only writes; the software runs the search |
| 4 | The `tool_result` (same id) with two short text results |
| 5 | The final answer citing its sources |

`scene.steps`: 5.

### `calculator`, `code`: text only vs with tools

Left: a model on its own (text in, text out). Right: the same question, a strip
of available tools (web search, calculator, run code) with the chosen one
highlighted, a structured call, the tool result, then the final answer.

| Step | Shows |
| --- | --- |
| 0 | The question, on both sides |
| 1 | The text-only answer and why it falls short |
| 2 | The model emits a structured tool call; the chosen tool lights up |
| 3 | The software runs the tool; the result goes back to the model |
| 4 | The final answer |

`scene.steps`: 4 for `weather`, `calculator` and `code`; 5 for `search`.
