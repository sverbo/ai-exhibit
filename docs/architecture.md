# Architecture

A concise tour of how the app works today. The original design decisions are
in [`docs/specs/2026-10-02-v0-design.md`](specs/2026-10-02-v0-design.md), a
historical record: where it disagrees with this page (in-browser models, model
downloads, several editions), this page is current.

## Packages

pnpm workspace; packages export TypeScript source (no build step), Vite compiles
the app, `tsx` runs Node code, one root `tsconfig.json` typechecks everything.

| Package | Role | Runs in |
| --- | --- | --- |
| `apps/presenter-web` | Every view (launcher, presenter, projector, present, remote, join, overview, handout, glossary, lab), keyboard map (`src/control/`), session hooks (`src/talk/`) | Browser |
| `apps/local-runtime` | Development server on :4317: the `/api` endpoints (through `packages/cloud-api`), session relay (`/session`, `/api/session/*`), LAN addresses (`/api/network`), the built app when run without `--dev` | Node |
| `api/` | Vercel functions: the same `/api` endpoints, thin wrappers around `packages/cloud-api` | Vercel (Node) |
| `packages/cloud-api` | Hugging Face calls: base model, chat model, next-token probabilities, embeddings, tokenizers (pinned files from the Hub); access code and per-visitor limits | Node |
| `packages/presentation-core` | Content model types, edition resolution, navigation, content validation. Pure | Both |
| `packages/session-protocol` | `SessionState`, commands, the pure reducer `applyCommand`, message validation, WebSocket and BroadcastChannel clients | Both |
| `packages/ml-runtime` | Browser helpers: the `/api` client, recording formats, chat-template rendering, byte-level token spans, embedding geometry and the decoder of the precomputed map. No model runs here | Browser (and Node for scripts) |
| `packages/scene-components` | Scene contract and registry, `SceneRenderer`, 1920x1080 `Stage`, generic layouts, theme tokens, components by area | Browser |
| `presentations/canonical` | The talk: chapters, scenes, the `en` edition, the bundled data manifest | Data |
| `content` | Source registry, glossary, bundled assets (embedding map, recordings, media with credits) | Data |
| `scripts/prepare`, `scripts/verify` | Recording builders (cloud answers, tokenizations, embedding test fixture); content, source and rehearsal checks | Node |

## Where it runs

- **Vercel (the talk).** The static app plus the functions in `api/`. There is
  no session server: windows of the same browser sync through
  BroadcastChannel (presenter and projector on one laptop), and either window
  takes the arrow keys or a clicker.
- **`pnpm dev` (development).** Vite on :5173 proxies `/api` and `/session` to
  the local runtime on :4317. The runtime adds a WebSocket session relay, so
  other devices can follow: the phone remote (paired by QR code from the
  presenter view) and audience phones.

## A keypress, from presenter to projector

```
 laptop: /presenter (role presenter, controller)          projector: /projector (role display)
 ┌──────────────────────────────────────────┐              ┌───────────────────────────────┐
 │ keydown "→"                              │              │                               │
 │  └ control/keyboard.ts  → action "next"  │              │                               │
 │  └ control/navigation.ts → presentation- │              │                               │
 │     core resolves { goto sceneId, step } │              │                               │
 │  └ applyCommand (optimistic) → render    │              │ state → SceneRenderer         │
 │  └ send command ──────────┐              │              │   (display: draws from state) │
 └───────────────────────────┼──────────────┘              └──────────────▲────────────────┘
                             ▼                                            │
          BroadcastChannel (same browser) or, under pnpm dev,             │
          the runtime's /session WebSocket relay: applyCommand            │
          (authoritative), persists state.json, broadcasts ───────────────┘
```

1. `useKeyboard` maps the key (`keyboard.ts`); keys typed into inputs or
   `[data-keys-local]` regions are ignored.
2. `navCommand` turns "next" into an explicit `goto` using the edition's resolved
   scene list (`presentation-core`): next reveal step, or the next scene.
3. The client applies the command optimistically with the shared reducer and sends
   it with an ID.
4. The other windows (or the relay) apply the same reducer; the sender rebases
   its optimistic queue on the acknowledged state.
5. Every client renders `SceneRenderer` with a `SceneContext` built from the state:
   the projector as `display`, the presenter stage as `controller`, the next-scene
   thumbnail as `preview`.

Shell flags travel the same way: `setFallback`, `resetScene`, `setBlackout`,
`setFrozen` (the frozen position is kept under a reserved scene-state key), timer.

## Compute ownership

One controller computes; everyone else draws. A scene component receives
`ctx.role`:

- `controller` (`/presenter` or `/present`): accepts input, calls the `/api`
  endpoints or trains in-page (the small text classifier), and publishes small
  results (`ctx.setState`, kept under about 50 KB) into the session.
- `display` (`/projector`, the presenter's projector mirror): renders only from
  `ctx.state` and `ctx.revealStep`.
- `preview` (next scene, `/overview`): static, no compute, no animation.

So a model is never called twice for one step, and the projector makes no
model calls. `ctx.mode === "fallback"` (the `F` key) swaps live calls for recorded
or deterministic data.

Which window owns the stage (`stageOwner` in `packages/session-protocol`): a
visible window before a hidden one (browsers slow down a background tab's
timers, which would freeze animations), then the presenter view before a
projector acting alone, then the window that joined first. A new owner resumes
from the published state. Animations driven by timers are paced on the wall
clock, so a late timer catches up instead of freezing. Entering a scene (forward,
back or by jump) clears its state: every visit starts it over.

## Live models and Simulation

| Endpoint | What |
| --- | --- |
| `GET /api/llm/status` | `{configured, reachable, codeRequired}` |
| `POST /api/llm/complete` | Base model continuation (Llama 3.1 8B) |
| `POST /api/llm/next` | Top next-token probabilities of a raw text (Llama 3.3 70B Instruct) |
| `POST /api/llm/chat` | Assistant answer with first-token probabilities (Llama 3.1 8B Instruct) |
| `POST /api/llm/ladder` | One question, answers of three open models of increasing power (Qwen2.5 0.5B base, Llama 3.1 8B Instruct, GLM-5.3 reasoning) streamed side by side (NDJSON); costs three requests of the hourly budget |
| `POST /api/embed` | Sentence embeddings (paraphrase-multilingual-MiniLM-L12-v2) |
| `POST /api/tokenize` | Tokens with Llama 3.1's or GPT-2's tokenizer |

- The token (`HF_TOKEN`) stays on the server: the repo-root `.env` for the
  local runtime, the project's environment on Vercel. Model names, providers
  and limits live in `packages/cloud-api/src/core.ts`.
- The presenter chooses the model source for the whole talk (Hugging Face or
  Simulation); it defaults to Hugging Face when the server has a token.
  `scene-components/src/language/source.ts` decides per scene and falls back
  to Simulation on its own (no token, unreachable, access code missing, failed
  call), with the reason in a badge on the controller: timeout, network,
  Hugging Face error, or the hourly limit reached. After a failed call the
  badge offers "Retry Hugging Face", which clears the failure and asks the
  status again (no reload). Too many requests this minute is not a fallback:
  the scene keeps Hugging Face, the projector shows a short notice, and calls
  resume once the minute frees up.
- A refused call (429, `error: "rate-limited"`) also carries `limit`
  (`"minute"` or `"hour"`), `max` and `retryAfter` (seconds, also sent as a
  `Retry-After` header). On Vercel (`PUBLIC_LIMITS`) each address may make 20
  model requests per rolling minute and 100 per hour, counted in memory per
  function instance; tokenizing does not count against them.
- Simulation replays `content/assets/recordings/` (`cloud.json`,
  `tokenizations.json`, rebuilt by `pnpm recordings:build`). The embedding map
  (`content/assets/embeddings/canonical.json`) is precomputed and frozen;
  `next-token.json` and `then-and-now/gpt2-answers.json` were recorded with
  earlier local models and are kept as the source of the numbers some scenes
  show.

## Session relay (local runtime)

- One session per runtime (`sessionId = "main"`). The relay holds the
  authoritative `SessionState`, persists it to `<cache>/session/state.json`
  (cache: `$AI_EXHIBIT_CACHE`, default `~/.cache/ai-exhibit`; another port gets
  `session-<port>`) and restores it at startup.
- **Roles.** `presenter`, `solo` and `remote` (with a valid token) may send every
  command except `vote`; `audience` may only `vote`; `projector` sends nothing.
  The presenter token is stored in `<cache>/session/token.json`;
  `GET /api/session/presenter-token` answers only to loopback requests, which is
  why controller views open on `localhost` and phones get the token through a
  QR code.
- **Transport selection.** Clients try `ws(s)://<host>/session` for 1.5 s. If no
  runtime answers (always the case on Vercel), they use the BroadcastChannel
  `ai-exhibit:main`: windows of the same browser profile stay in sync,
  controllers are trusted, a new window asks for a snapshot and the highest
  `version` wins.
- **Audience.** Phones receive `audienceView(state)`: the active poll, no scene
  states. The current edition has no poll scene, so this interface stays hidden.
