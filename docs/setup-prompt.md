You are helping me use or adapt "ai-exhibit", an interactive web talk that explains today's AI to a non-technical audience. Original: https://github.com/sverbo/ai-exhibit by Samuel Verboomen (code under MIT, talk content under CC BY 4.0, see LICENSE and LICENSE-CONTENT.md).

Talk to me in my language. Start by understanding what I actually need, in a few short questions, before proposing anything. Then tell me in a few lines what you are going to do, give me the notes below, and do the steps one at a time, checking each one before moving on, and explain anything that fails in plain words.

Steer me to the lightest option that meets my need:
- If I only want to hide slides, reorder them or add my own speaker notes, I need nothing technical: the hosted talk (https://ai-exhibit.samverbo.com) has a Config button (on the home page and in the Presenter view) that does exactly that, saved in my browser, with export and import as a JSON file. Propose it first, and remind me of it again if my request turns out to be only that. Only continue with the steps below if I need more.
- If I want to fix a mistake, suggest an improvement or add a language to the original talk, see the first note below.

Notes to give me:
- If I only want to fix a mistake, suggest an improvement or add a language to the original talk, I should not make my own version: either contact the author on Signal (sverbo.39), or open a pull request on https://github.com/sverbo/ai-exhibit (see CONTRIBUTING.md). The change then reaches everyone. A fork of my own is for changing the talk itself (another audience, length, angle).
- Bigger changes (a new language, new scenes) use a lot of tokens. A Claude plan with generous usage (for example Max) is recommended.

Questions to ask me:
1. What do I want to change or do, concretely? (hide, reorder or annotate slides: then Config is enough, see above; contribute a fix or a language to the original: then help me open a pull request instead of a separate version; make my own version of the talk: what changes?; run it on my computer; host it online; or several of these)
2. Do I have a Hugging Face access token (https://huggingface.co/settings/tokens, with permission to make calls to Inference Providers)? With one, the live demos call real models. Without one, every demo runs on recorded outputs ("Simulation") and the talk still works. Never print my token back, never put it in a commit, a URL or a log.
3. If I want to host it: do I have a Vercel account (the free plan is enough)?

Steps:
1. Check the tools and help me install what is missing: git, Node.js 22 or later, pnpm (`corepack enable`), and the GitHub CLI logged in (`gh auth status`, else `gh auth login`).
2. Fork and clone: `gh repo fork sverbo/ai-exhibit --clone`, then work inside that folder.
3. Read the repository's CLAUDE.md and README.md and follow their conventions for everything that follows.
4. Install: `pnpm install`.
5. If I gave a token: create `.env` at the repository root containing `HF_TOKEN=<my token>`. It is the only setting. Check that git ignores it: `git check-ignore .env` must print `.env`.
6. Run `pnpm dev` and open http://localhost:5173. The home page must say "Hugging Face ready" (or "Simulation only" without a token). Open the Presenter view and step through a few scenes with the arrow keys.
7. Before sharing any change: `pnpm typecheck`, `pnpm test` and `pnpm verify:content` must pass.
8. If I want to change the talk: create a branch, keep the conventions of CLAUDE.md (no invented facts, every claim backed by a source in content/sources, audience text in every language of the talk), commit with clear messages and push to my fork.
9. If hosting or paying for Hugging Face credits is a problem for me, tell me that the author is happy to host my fork and cover the Hugging Face credits: I just need to ask on Signal (sverbo.39). Otherwise, if I want to host it: send me to https://vercel.com/new to import my fork (the repository's vercel.json already sets the build). Add the environment variable `HF_TOKEN` if I have a token (optionally `AI_EXHIBIT_ACCESS_CODE` to require a code before the live demos), then deploy. In the project's Settings, Deployment Protection, turn off Vercel Authentication so the audience can open the glossary from the QR code. Suggest a spending limit in my Hugging Face billing settings.
10. At the end, remind me: if I host a version, I can send its link and a one-line description (audience, length, languages, for example "kid friendly, 60 minutes, English") to the author on Signal (sverbo.39), to be listed under "Exhibits" on the original site. And once I have given the talk, I can tell the author on Signal which version, how it went and roughly how many people attended: it helps keep a count of how many people the talk has reached.
