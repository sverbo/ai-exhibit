# Agents components

Scene components for the agent thread of the talk (0.4, 0.5, 5.2 to 5.6, 8.1).
All are deterministic: `mode: "fallback"` renders exactly like `live`, so scenes
can use `fallback: { kind: "deterministic" }`. State hooks and UI helpers come
from `../learning/shared/`. Every component accepts an optional `heading: L10n`.

## AgentLoop

Props: `{ variant: "intro" | "tools" | "high-stakes", goal?: L10n }`. Used by
0.5 (`intro`), 5.3 (`tools`), 8.1 (`high-stakes`).

One diagram, drawn by `loop/LoopRing.tsx` at the same place in every variant:
the goal at the center, then Plan, Act, Observe, Re-plan on a ring. Stage
labels never change between variants. A pulse travels around the ring once
the loop is complete (off in previews and with reduced motion). No shared state.

| Step | `intro` | `tools` | `high-stakes` |
| --- | --- | --- | --- |
| 0 | Goal | Full loop, cycling | Full loop, cycling |
| 1 | + Plan | Tools fan out from Act: web search, browser, run code, files, calculator | Broad access fans out from Act: bank account, email, terminal, production servers, internet |
| 2 | + Act | | "In the real world": payments sent, emails in your name, files deleted... and the loop speeds up |
| 3 | + Observe | | |
| 4 | + Re-plan, the loop closes and cycles | | |
| 5 | Who does what: you (goal), the model (plan, re-plan), the software (act, observe) | | |

A plain-words legend of each stage sits on the right in `intro`.
`scene.steps`: intro 5 (4 is enough to stop at the closed loop), tools 1, high-stakes 2.

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

## PermissionsBoard

Props: `{ mode: "permissions" | "approval" }`. Used by 5.4 and 5.5.

Switches: read files, write files, terminal, web browser, money. The list on
the right shows what the same agent can do (13 capabilities in
`permissions/capabilities.ts`, some only through combinations such as read +
browser = "send your documents to an outside website"), risky ones flagged.
The controller can flip any switch at any time.

| Step | `permissions` | `approval` |
| --- | --- | --- |
| 0 | No access: it can only answer | Everything on, risky actions run "without asking" |
| 1..5 | Grants read, write, terminal, browser, money, one per step | 1: a human approval gate: risky actions become "with your approval", and a pending request card (pay a bill, delete files, install a program) with Approve / Deny on the controller |

`scene.steps`: permissions 5, approval 1.
