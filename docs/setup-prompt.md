You are helping me use or adapt "ai-exhibit", an interactive web talk that explains today's AI to a non-technical audience. Original: https://github.com/sverbo/ai-exhibit by Samuel Verboomen (code under MIT, talk content under CC BY 4.0, see LICENSE and LICENSE-CONTENT.md).

Talk to me in my language. Start by understanding what I actually need, in a few short questions, before proposing anything. Then tell me in a few lines what you are going to do, give me the note below, and do the steps one at a time, checking each one before moving on, and explain anything that fails in plain words.

First, ask me which of these three I want, and explain the difference in a few words:
- **Only hide, reorder or annotate slides.** I need nothing technical: the hosted talk (https://ai-exhibit.samverbo.com) has a Config button (on the home page and in the Presenter view) that does exactly that, saved in my browser, with export and import as a JSON file. Propose it, and remind me of it again if my request turns out to be only that.
- **A change meant for the original talk**: a correction, feedback, an improvement, a new language. It belongs in the general presentation, so everyone gets it. That is a **contribution**: a pull request to https://github.com/sverbo/ai-exhibit (follow "Path A" below). For a small remark, a message to the author on Signal (sverbo.39) is enough, and I need no setup at all.
- **My own version**: another audience, length or angle, or many changes the original may not want. That is a **fork**, which I run or host myself (follow "Path B" below).
If my answer mixes the two (for example a fix I also want in my own version), suggest doing the fix as a contribution first, then the fork.

Note to give me: bigger changes (a new language, new scenes) use a lot of tokens. A Claude plan with generous usage (for example Max) is recommended.

Then ask me:
1. What do I want to change or do, concretely? (and, for a fork: run it on my computer, host it online, or both)
2. Do I have a Hugging Face access token (https://huggingface.co/settings/tokens, a fine-grained token with the permission to make calls to Inference Providers)? With one, the live demos call real models. Without one, every demo runs on recorded outputs ("Simulation") and the talk still works. Never print my token back, never put it in a commit, a URL or a log.
3. If I want to host it: do I have a Vercel account (the free plan is enough)?

Steps common to both paths:
1. Check the tools and help me install what is missing: git, Node.js 22 or later, pnpm (`corepack enable`), and the GitHub CLI logged in (`gh auth status`, else `gh auth login`).
2. Fork and clone: `gh repo fork sverbo/ai-exhibit --clone`, then work inside that folder (a pull request also goes through a fork of my own).
3. Read the repository's CLAUDE.md and README.md and follow their conventions for everything that follows.
4. Install: `pnpm install`.
5. If I gave a token: create `.env` at the repository root containing `HF_TOKEN=<my token>`. It is the only setting. Check that git ignores it: `git check-ignore .env` must print `.env`.
6. Run `pnpm dev` and open http://localhost:5173. The home page must say "Hugging Face ready" (or "Simulation only" without a token). Open the Presenter view and step through a few scenes with the arrow keys.
7. Before sharing any change: `pnpm typecheck`, `pnpm test` and `pnpm verify:content` must pass.

Path A, a contribution to the original talk:
A1. Read CONTRIBUTING.md and follow it. Create one branch per topic, keep the conventions of CLAUDE.md (no invented facts, every claim backed by a source in content/sources, audience text in every language of the talk), and update a changed slide's notes and both narratives as CLAUDE.md asks. Do not touch `fork` in credits.ts or the personal demo video: they stay the author's.
A2. Show me the change running locally (screenshots for anything visual, light and dark), then commit with a clear English message and push the branch to my fork.
A3. Open the pull request to sverbo/ai-exhibit for me with the GitHub CLI (`gh pr create --repo sverbo/ai-exhibit`, a title and a description that say what changes for the audience or the presenter, with the screenshots). If the GitHub CLI is not available or I prefer the website, guide me step by step through opening it on github.com instead. Give me the pull request's link, and tell me the author may ask for changes, or may decline a change that alters the talk's direction (then a fork is the way).
A4. Stop here: no hosting is needed, the change reaches everyone once merged.

Path B, my own version (a fork):
B1. If I want to change the talk: create a branch, keep the conventions of CLAUDE.md (no invented facts, every claim backed by a source in content/sources, audience text in every language of the talk), commit with clear messages and push to my fork.
   If I will present my own version, set my name (and a link, if I want one) as `fork` in presentations/canonical/src/credits.ts: the first slide and the credits slide then show my byline. Keep the line "Original presentation by Samuel Verboomen" with its link to https://ai-exhibit.samverbo.com and its LinkedIn link (https://www.linkedin.com/in/verboomensamuel), which both slides show under my name: the author asks for it, and the content license (CC BY 4.0) asks for attribution anyway. Show me both slides before moving on.
   The slide "My own demo" plays the author's screen recording of an agent at work. Tell me I am free to replace it with a short recording of my own work, an agent doing something I really use it for every day: it speaks to the room much more when it is mine. Keeping the author's is fine too. If I record one, help me encode it as content/assets/media/README.md says, put it at content/assets/media/personal-demo.mp4 (add it with `git add -f`, the folder is ignored by git), and update that slide's notes (what I asked, product, model, date, what the agent did) and both narratives in content/script/.
B2. If hosting or paying for Hugging Face credits is a problem for me, tell me that the author is happy to host my fork and cover the Hugging Face credits: I just need to ask on Signal (sverbo.39). Otherwise, if I want to host it: send me to https://vercel.com/new to import my fork (the repository's vercel.json already sets the build). Add the environment variable `HF_TOKEN` if I have a token (optionally `AI_EXHIBIT_ACCESS_CODE` to require a code before the live demos), then deploy. In the project's Settings, Deployment Protection, turn off Vercel Authentication so the audience can open the glossary from the QR code. Suggest a spending limit in my Hugging Face billing settings.
B3. At the end, remind me: if I host a version, I can send its link and a one-line description (audience, length, languages, for example "kid friendly, 60 minutes, English") to the author on Signal (sverbo.39), to be listed under "Exhibits" on the original site. And once I have given the talk, I can tell the author on Signal which version, how it went and roughly how many people attended: it helps keep a count of how many people the talk has reached.
