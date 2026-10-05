# ai-exhibit

An interactive web talk that explains today's AI to a non-technical audience:
what it can do, how it works, who builds it, what risks follow and what can be
done about them. It is a talk, not a slide deck: a full-screen, scene-by-scene
web app where a scene can be a statement, a live tokenizer, a language model
answering through Hugging Face, an embedding map or an agent walkthrough. Its
claims carry their sources.

Live: <https://ai-exhibit.samverbo.com>. One edition, `en` (English, about 90
minutes planned).

## Make your own version

There are three ways to take part:

1. **Corrections, improvements or a new language for the original talk.**
   Contact the author on Signal (`sverbo.39`) or open a pull request on
   [sverbo/ai-exhibit](https://github.com/sverbo/ai-exhibit) (see
   [CONTRIBUTING.md](CONTRIBUTING.md)). The change then reaches everyone, so
   there is no need to fork for this.
2. **Changing the talk itself** (another audience, length or angle): fork it
   and make your own version. The easiest way is to paste
   [`docs/setup-prompt.md`](docs/setup-prompt.md) into
   [Claude Code](https://claude.com/claude-code): it checks your tools, forks
   with `gh`, installs, sets the optional Hugging Face token in `.env`, runs
   `pnpm dev` and guides you through hosting on Vercel. Big changes (a new
   language, new scenes) use a lot of tokens: a Claude plan with generous
   usage (for example Max) is recommended. Present it under your own name:
   set `fork` in
   [`presentations/canonical/src/credits.ts`](presentations/canonical/src/credits.ts),
   and please keep the line "Original presentation by Samuel Verboomen" with
   its link to <https://ai-exhibit.samverbo.com>, which the first slide and the
   credits slide then show under your byline.
3. **Hosting a version.** Send the author its link and a one-line description
   (audience, length, languages): it will be listed under "Exhibits" on the
   original site's home page.

A Hugging Face token is optional everywhere: without one, every live demo plays
recorded real outputs of the same models (Simulation).

## Quick start

Requirements: Node 22 or later, pnpm 10 (`corepack enable` installs the pinned
version), a recent browser.

```sh
pnpm install
echo 'HF_TOKEN=hf_...' > .env    # optional: live demos through Hugging Face (gitignored)
pnpm dev                         # web app on http://localhost:5173 (local runtime on :4317)
```

The token needs only the "Make calls to Inference Providers" permission. Set a
spending limit on the Hugging Face account that owns it.

## Presenting

The home page (`/`) picks the language of the talk (or add `?lang=fr` to any
view; every window follows the same language) and offers two windows and the
audience's glossary:

- **Projector**: full screen on the projector. It works alone: the arrows or a
  clicker advance it, scenes are interactive, `N` shows the notes.
- **Presenter**: notes, timer, sources and controls, on the laptop screen.
  Open it as well, at any time: the two windows stay linked (the presenter
  runs the scenes, the projector mirrors it) and either one takes the arrow
  keys or a clicker. Both must be in the same browser profile (separate
  windows, even on two screens, but not a private window).

Other views: `/overview` (every scene, rehearse from any of them), `/handout`
(chapters, takeaways and sources for after the talk), `/glossary` (for the
audience's phones, shown as a QR code), `/lab` (one component in every role).
The [presenter guide](docs/presenter-guide.md) covers rehearsal, keys,
fallback and troubleshooting.

## Hosting on Vercel

The repository deploys as is: `vercel.json` builds `apps/presenter-web` and
turns `api/*.ts` into Node functions that call Hugging Face (tokenizer, base
model, chat model, next-token probabilities, embeddings).

| Environment variable | Required | What it does |
| --- | --- | --- |
| `HF_TOKEN` | no | Hugging Face token for the live demos. It stays on the server: never sent to the browser, never logged. Without it, the demos play Simulation |
| `AI_EXHIBIT_ACCESS_CODE` | no | When set, every model call must carry this code: the presenter view asks for it once and the browser remembers it. When unset, anyone with the URL can call the endpoints |

In the project's Settings, Deployment Protection, turn off Vercel
Authentication so the audience can open the glossary from the QR code. Every
endpoint refuses texts over 300 characters; answers are free (models stop on
their own, under a 1024-token safety ceiling, and anything still running after
25 s is cut and says so, inside Vercel's 30 s). Each address gets at most 100
model requests an hour, all endpoints together (tokenizing does not count),
plus a per-minute cap (`PUBLIC_LIMITS` in `packages/cloud-api/src/core.ts`).
These counters live in memory, per serverless instance: best effort only, so
keep the Hugging Face spending limit.

## Repository map

```
apps/presenter-web/          Vite + React app: every view
apps/local-runtime/          Node dev server on :4317: /api proxy to Hugging Face, LAN address for the glossary QR
api/                         Vercel functions, thin wrappers around packages/cloud-api
packages/cloud-api/          Hugging Face endpoints (/api/llm/*, /api/embed, /api/tokenize), shared by the runtime and api/
packages/presentation-core/  Content model types, editions, navigation, validation
packages/session-protocol/   Session state, commands, reducer, BroadcastChannel client and stage owner
packages/ml-runtime/         Browser helpers: /api client, recording formats, chat templates, embedding geometry
packages/scene-components/   Scene contract and registry, renderer, layouts, theme, components by area
presentations/canonical/     The talk: chapters, scenes/0X-*.ts, editions
content/                     Sources, glossary, bundled assets (embedding map, recordings, media)
scripts/                     Recording builders (prepare/) and checks (verify/)
docs/                        Presenter guide, content guide, architecture, narrative, design records
```

## Checks

| Command | What it does |
| --- | --- |
| `pnpm typecheck` | `tsc` over the whole workspace |
| `pnpm test` | Vitest |
| `pnpm verify:content [--strict]` | Scenes, locales, long dashes, references, edition durations |
| `pnpm verify:sources` | Every source URL answers (online) |
| `pnpm rehearse` | Playwright with the internet blocked: every scene and step, live and in fallback (first run: `pnpm exec playwright install chromium`) |
| `pnpm build` | Production build into `apps/presenter-web/dist` |
| `pnpm recordings:build` | Re-records Simulation's data in `content/assets/recordings` (needs `HF_TOKEN`) |

## Documentation

- [Presenter guide](docs/presenter-guide.md): rehearsal, delivering the talk, troubleshooting
- [Content guide](docs/authoring/content-guide.md): writing scenes, sources and components
- [Architecture](docs/architecture.md): packages, data flow, session, live models and Simulation
- [Narrative](docs/narrative.md): the talk as one story, slide by slide
- [Contributing](CONTRIBUTING.md)
- Design records: [`docs/specs/`](docs/specs/)
- Component notes: one `README.md` per area under `packages/scene-components/src/`

## License and citation

- Code: MIT, see [`LICENSE`](LICENSE).
- Talk content (scenes, notes, narrative, glossary, source summaries): CC BY 4.0,
  see [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
- Third-party images, logos and portraits keep their own licenses, listed with
  author and source in `content/assets/media/story/credits.ts`. Recorded model
  outputs are not covered by either license.
- To cite or credit the talk, see [`CITATION.cff`](CITATION.cff).
