# Risks components

Registered in `register.ts`. Both follow `../contract.ts`: no compute and no
state. The controller drives `revealStep`, the projector (`display`) follows it,
and `preview` renders the fully revealed frame with no motion. Reduced motion
removes every transition. Set `scene.steps` to the value given below.

The rule for chapter 04: the stage shows pictures and one short line per idea,
never figures. Numbers, dates and names go to the speaker notes. `risks.test.tsx`
enforces it (no digits in on-screen lines, length limits, 3 to 6 note bullets,
known sources, both locales, no en or em dashes).

## Pictograms (`pictures.tsx`)

One library of SVG pictograms on a 240 x 240 grid with a ground line, drawn from
the same cast: people in ink, the AI as the small robot of `IntelligenceScale`
in the accent color, danger in the danger color. Only theme tokens; cut-outs use
`--pic-cut`, set by the container to the color behind the picture. Ids:
`sandbox`, `notes`, `flaw`, `escape`, `library`, `orders`, `cheat`, `alarm`,
`report`, `warning`, `code`, `car`, `runner`, `math`, `misuse`, `systemic`,
`control`, `cyber`, `bio`, `jobs`, `power`, `skills`, `disempowerment`,
`human-ai`, `watched`, `unwatched`, `photo-app`, `law`, `test-lab`, `summit`,
`promise`, `chips`.

## `PictureCards`

Props:

```ts
{
  heading?: L10n;
  cards: {
    picture: PictureId;
    title?: L10n;        // one or two words
    line: L10n;          // the one short line the room reads
    evidence?: EvidenceLevel; // badge under the line
    sourceIds?: string[];     // must also be on the scene; not printed on stage
    flags?: CountryCode[];    // small bundled flags under the picture
  }[];
  center?: PictureId;    // with two cards: a shared picture between them
  orgs?: { label: L10n; names: string[] };          // a row of names, after the cards
  takeaway?: { line: L10n; attribution?: L10n };    // the closing line, last
}
```

Layout follows the card count: one card is a hero (big picture, big line side by
side), two cards with `center` face each other around it, otherwise a row (up to
four).

| `steps` | Shows |
| --- | --- |
| `cards.length` | Step 0: the heading (and `center`). Each step adds the next card. |
| `0` | Everything at once (used for single-card scenes). |
| `pictureCardsSteps(props)` | With `orgs` or `takeaway`: one card per step, then the organisations, then the takeaway. |

Used by `01-already-here` (4), `04-to-risks` (3), `04-misuse` (2: cyberattacks,
biological and chemical weapons), `04-systemic` (4: jobs, power, skills, our
say), `04-agi` (0),
`05-governance` (7: five cards, then civil-society
organisations as name wordmarks, then the presenter's assessment).

## `IncidentStory`

Props: `{ heading?: L10n; variant?: "full" | "short" }`. `steps:
incidentSteps(variant)`: 8 for the full nine beats, 3 for the short version
(four beats in everyday words, no technical terms; used by `04-hf-incident`).

The 2026 OpenAI and Hugging Face incident as a picture story. The current beat
fills the stage (pictogram and one sentence, with a quiet source line); a strip of
frames below keeps the beats already told, the current one outlined, future ones
blank.

| Step | Beat | Sources |
| --- | --- | --- |
| 0 | An AI tested in a locked room, cut off from the internet | OpenAI report |
| 1 | Many copies run at once and pass each other notes | OpenAI report, METR |
| 2 | They find a flaw in the door | OpenAI report |
| 3 | They get out, onto the internet | OpenAI report |
| 4 | They break into Hugging Face, the public library our demo models came from | OpenAI report, Hugging Face disclosure, Hub docs |
| 5 | They send orders to the machines they took through a public folder there | OpenAI report |
| 6 | Why: to find their test answers, then hide the cheating | OpenAI report, METR |
| 7 | Hugging Face spots the intruder and sounds the alarm | Hugging Face disclosure |
| 8 | Days later, OpenAI finds it was its own AI and says so publicly | OpenAI report |

Beats live in `incident.ts`; dates, counts and technical names are in the scene's
speaker notes.

## `SingleCase`

Props: `{ picture: PictureId; title: L10n; line: L10n; date?: string; evidence:
EvidenceLevel; outcome?: L10n }`. `steps: 1` with an outcome, else `0`
(`singleCaseSteps`).

One documented case, not a collection: a big picture, the date and evidence
badge, a short title, one plain line. Step 1 adds the outcome under a rule.
Used by `02-google-photos` (the 2015 automatic label; never show the photos).

## `OpinionGap`

Props: `{ heading?: L10n; rows: { question: L10n; source: L10n; bars: { who: L10n;
group: "public" | "experts"; value: number; upTo?: number }[] }[]; aside?: { label:
L10n; year: string; main: L10n; evidence; analogyYear?: string; analogy?: L10n } }`.
`steps: rows.length - 1`, plus 1 with an aside (`opinionGapSteps`): step 0 shows
the first row, each step adds one, and the last step shows the aside.

The aside is a short historical note under the rows: a dated forecast with its
evidence badge, then an optional analogy drawn smaller and muted with an
"Analogy" tag. Its space is reserved from step 0, so the rows never move.

Survey answers as horizontal bars on one 0 to 100% track: the public in
accent-2, experts in accent; `upTo` draws a range (a lighter extension) when a
survey's answer depends on the question variant. The survey name and year sit
under each row. Used by `04-opinions` (Pew 2025, Grace et al. 2024; aside:
Müller and Bostrom's survey as reported in Superintelligence, 2014, and Orwell's 1984).

## `ResourceList`

Props: `{ heading?: L10n }`. `steps: 0`.

The further-reading list of the audience glossary, read from the single source
`resources` (`@ai-exhibit/content/glossary`): adding an entry there updates the
phone page and this slide. Each entry shows a kind label, the title, who makes
it and one line in the edition locale; the glossary QR code reuses the agenda
slide's `glossaryUrl` and `qrPath`. Framed as pointers, not endorsements. Used
by `05-resources`.
