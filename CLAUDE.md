# ai-exhibit

Interactive web presentation that explains modern AI to a non-technical
audience. Start with `README.md`, then `docs/architecture.md` (how it works
today) and `docs/authoring/content-guide.md` (how scenes and sources are
written). `docs/narrative.md` tells the talk as one story; `docs/specs/` holds
the design records, and where they disagree with the architecture notes, the
notes win.

If someone asks you to set up their own copy of the talk, follow
`docs/setup-prompt.md`.

## How it runs

- The talk runs from Vercel (`vercel.json`): the built app plus the functions
  in `api/`, which call Hugging Face with the server's `HF_TOKEN`.
- Live demos use Hugging Face through `/api/*`, or Simulation (recorded real
  outputs in `content/assets/recordings`). No model is downloaded or run
  locally or in the browser; do not add one.
- `apps/local-runtime` is the development server behind `pnpm dev`: the same
  `/api` endpoints (plus `/api/network` for the glossary QR's LAN address).
  Windows sync through a BroadcastChannel (same browser profile); there is no
  session relay, phone remote or audience voting.
- One edition, `en`.

## Commands

- `pnpm dev`: local runtime (:4317) + Vite (:5173), both on 0.0.0.0
- `pnpm typecheck`, `pnpm test` (Vitest), `pnpm build`
- `pnpm verify:content`, `pnpm verify:sources`, `pnpm rehearse`
- `pnpm recordings:build` (needs `HF_TOKEN`)

## Conventions

- Everything written in the repo is English. Audience/presenter-facing strings
  are `L10n` values, and their non-English text is a product decision.
- No em dashes or en dashes anywhere, including content strings. Rewrite the
  sentence (comma, parentheses, or two sentences) instead.
- Packages export TypeScript source; no build step for packages.
- Scene components follow `packages/scene-components/src/contract.ts`: heavy
  compute and model calls only when `ctx.role === "controller"`, display renders
  from `ctx.state`, preview stays static. Use CSS modules and the tokens in
  `theme/tokens.css`.
- Never invent incidents, statistics, quotes, company positions or regulation
  details. Unverified material gets a `todo` and a `needs-verification` source.
- Nothing is fetched from the internet at presentation time except the Hugging
  Face calls behind `/api`; images, fonts and data are bundled. Every
  third-party image has a credits entry with its license.
- Never commit `.env` or a token. `archive/` is a local, gitignored store of
  removed code: do not import from it.
- `pnpm typecheck`, `pnpm test` and `pnpm verify:content` must pass before a
  commit. See `CONTRIBUTING.md` for pull requests.
- When you change a slide (add, remove, reorder, or change what it says), update
  in the same change: its `takeaway` and `speakerNotes` (English in the scene
  file, French in `presentations/canonical/locales/fr.json`), and both
  narratives, `content/script/narrative.en.md` and `narrative.fr.md` (the talk
  told slide by slide; their headings and takeaways match the slides).

## Credits and forks

Authorship lives in one place, `presentations/canonical/src/credits.ts`: the
original author (Samuel Verboomen, https://ai-exhibit.samverbo.com) and a
`fork` field, null in the original. The first slide (`00-holding`) and the
credits slide (`05-credits`) read it. A fork is welcome to present under its own
name by setting `fork`; the author asks that it keep the line "Original
presentation by Samuel Verboomen" with its link to ai-exhibit.samverbo.com on
both slides (they show it on their own when `fork` is set). The content license,
CC BY 4.0, asks for attribution anyway.

## Working in a shared tree

The presenter may be running `pnpm dev` on this tree: keep it runnable after
every edit (no half-applied renames, no broken imports left between steps).
When testing on your own ports, run the runtime without watch mode
(`RUNTIME_PORT=<port> npx tsx apps/local-runtime/src/main.ts --dev`) and stop it
before finishing. A leftover `tsx watch` respawns its runtime on every file
change and can take over the presenter's port.
