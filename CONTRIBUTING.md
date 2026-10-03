# Contributing

Corrections, improvements and new languages for the original talk are welcome,
as a pull request on [sverbo/ai-exhibit](https://github.com/sverbo/ai-exhibit)
or as a message to the author on Signal (`sverbo.39`). To change the talk
itself (another audience, length or angle), make your own version instead:
see "Make your own version" in the [README](README.md).

## A good pull request

- **One topic per pull request**, on its own branch, with a title and
  description that say what changes for the audience or the presenter.
- **Follow [CLAUDE.md](CLAUDE.md)**: everything written in the repository is
  English; audience and presenter text is an `L10n` value; no long dashes (em
  or en) anywhere, including in content strings.
- **No invented facts.** Every claim about the world (a number, an incident, a
  quote, a company's position, a regulation) is backed by a source record in
  `content/sources/` and referenced by the scene. Anything not yet checked gets
  a `todo` on the scene and a `needs-verification` source, never a guess.
- **Audience text in every language of the talk.** A scene, note or glossary
  entry you add or change is written in each of the talk's languages.
- **Checks pass**: `pnpm typecheck`, `pnpm test` and `pnpm verify:content`.
  For a new or changed source, also `pnpm verify:sources`.
- **Screenshots** (or a short recording) for any visual change, in light and
  dark themes when colours are involved.
- **Nothing fetched at presentation time** beyond the Hugging Face calls of the
  live demos: images, fonts and data are bundled in the repository, and every
  third-party image has a credits entry with its license.

The [content guide](docs/authoring/content-guide.md) explains how scenes,
sources and components fit together, and the
[architecture notes](docs/architecture.md) how the app is built.

## What may be declined

The author may decline a change that alters the talk's direction (its
audience, its angle, what it chooses to say). That is not a judgement on the
change: a fork is the way to give the talk another direction, and hosted
versions can be listed under "Exhibits" on the original site.
