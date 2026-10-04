# Story components

Registered in `register.ts`. All follow `../contract.ts`. None of them needs
compute: the projector (`display`) renders from `ctx.revealStep` (and, for
`AITimeline`, a small `ctx.state`); `preview` renders the fully revealed frame
with no motion. Set `scene.steps` to the value given below.

Data lives in `data.ts`. Sources use the `st-` prefix in
`content/sources/story.ts`; `IndustryStack` also cites existing `sc-` company
records from `content/sources/supply-chain.ts`. Images are local files in
`content/assets/media/story/`, each with a record in `credits.ts` (subject,
Commons page, author, license, license URL, local edits). `story.test.tsx`
fails when a source ID, a locale, an image file or a credit is missing, or when
a string contains an en or em dash.

## `AIEnvelopes` (2.2)

Props: `{}`. `steps: 3`.

| Step | Shows |
| --- | --- |
| 0 | Artificial intelligence: any machine imitating intelligence, even with hand-written rules (a chess program) |
| 1 | + Machine learning: learns its rules from examples (a spam filter) |
| 2 | + Neural networks: layers of numbers adjusted in training (finding dog photos) |
| 3 | + Large language models: a neural network trained on text (chat assistants) |

Nested rooms, each a deeper tint of the accent; the newest ring has an accent
border. No state.

## `AITimeline` (2.1)

Props: `{ range: "ai" }`. `steps: 10` (11 milestones in date order; step 0 shows
the first).

Two tracks on one rail: promises above the line (round dots, accent color),
setbacks below it (danger color, and a "Setback" kicker with a down triangle in
the feature panel), so the room sees promise, failure, promise. The AI winters
are one period, drawn as a shaded band across its column rather than a point.

| Step | Track | Milestone |
| --- | --- | --- |
| 0 | promise | 1936, one machine for any procedure (Turing's universal machine) |
| 1 | promise | 1939 to 1945, Turing helps break Enigma, with the Bombe demo (below) |
| 2 | promise | 1956, the name (Dartmouth proposal) |
| 3 | promise | 1958, the first neural network that learns (perceptron) |
| 4 | setback (period) | 1970s and 1980s, the AI winters (limits of simple networks, Lighthill report, brittle expert systems, funding cuts) |
| 5 | promise | 1997, Deep Blue beats Kasparov (search plus scoring rules written by people) |
| 6 | promise | 2012, deep learning takes off (a CNN wins ImageNet on gaming GPUs) |
| 7 | promise | 2016, a machine wins at Go (AlphaGo beats Lee Sedol 4 to 1; learned from human games, then from playing itself) |
| 8 | promise | 2017, the Transformer (the T in GPT) |
| 9 | promise | 2019, GPT-2 |
| 10 | promise | 2020, GPT-3 |

**The Bombe demo** (`BombeDemo.tsx`, `enigma.ts`). A real Enigma I simulation
(rotors I, II, III left to right, reflector B, rings AAA, no plugboard, start
NKV) made the intercepted message `WETTERBERICHTXREGENABENDS` ("weather report,
rain this evening"; X is a space). The search tries the 17,576 rotor start
positions in alphabetical order with the crib `WETTERBERICHT` at the start of
the message, rejecting each one at its first contradiction; it stops at NKV
(the only fit, after 9,069 rejections), then decrypts the whole message. The
cabinet is a drawing in the spirit of the British Bombe (3 banks of 12 drum
triplets, 108 drums, coloured by rotor type) whose spinning drums stand for
parallel candidate tests; it is not a wiring model of the Bombe. Each drum is a
ring of letters with a bold notch and a hand, ticking one letter at a time
(`steps(26)`); the top row turns fastest (1.3 s per turn), the others slower
(6.5 s, 22 s). Timeline: 30 ticks of search, 6 of stop, then one letter per tick
(200 ms ticks, about 12 s).
The controller ticks it and publishes `{ bombe: tick }` in the scene state; the
projector renders from it; without state, with reduced motion and in preview it
shows the end state. The controller has a "Replay the search" button. To see it
in the talk: scene 2.1, press Next once (step 1). Motion stops only with the
system "reduce motion" setting or when the presenter turns on "Animations
paused".

No company is named on the projector, which is why the projector shows no
source line here (some publishers are companies); the controller shows the
full source records under the text.

The newest milestone fills the stage; earlier ones stay on the rail.
Controller: click an earlier station to bring it back to the stage; the choice
holds until the next step. State: `{ focus: number | null, atStep: number }`.

## Headquarters flags

`IndustryStack` shows small full-colour flags under each company
logo (bundled Wikimedia SVGs in `content/assets/media/story/flag-*.svg`, never
emoji). Countries and their sources live in `countries.ts`; Google DeepMind
shows the UK (London lab) and the US (Alphabet). Flags dim and light with their
logo; their accessible name is the country.

## `IndustryStack` (one slide for the whole industry)

Props: `{}`. `steps: 13`. Data in `industry.ts`.

Five layers, bottom to top: machines that make chips (ASML, Applied Materials,
Lam Research, Tokyo Electron, KLA), chip factories (TSMC, Samsung, Intel,
SMIC), chip designers (NVIDIA, AMD, Google TPU, Huawei Ascend), data centers
and cloud (AWS, Microsoft Azure, Google Cloud, Oracle, CoreWeave, Alibaba
Cloud), AI labs (Google DeepMind, OpenAI, Anthropic, xAI, Meta, Mistral AI; then
DeepSeek, Qwen, Moonshot AI, Z.ai on a second row). Every mark is one ink and
starts dimmed; only the entries below light up, the rest stay ghosts.
Portraits stand in a lane above the labs, with an accent line to where each
person works. Every visible change is its own click and a plain fade: nothing
travels and nothing animates in stages. Each place a person stands in is its
own portrait and line, so a change of organisation fades the old ones out as
the new ones fade in. Jensen Huang stands beside the NVIDIA logo inside its
layer. Reduced motion and preview skip the fades.

| Step | Lights | People |
| --- | --- | --- |
| 0 | nothing | |
| 1 | Google DeepMind | |
| 2 | | Elon Musk and Sam Altman appear, linked to OpenAI (founded December 2015) |
| 3 | OpenAI | both still linked |
| 4 | | Musk unlinks and stands apart (left the board, February 2018) |
| 5 | | Dario Amodei appears at OpenAI (vice president of research) |
| 6 | Anthropic | Amodei now at Anthropic (co-founded 2021) |
| 7 | xAI | Musk now at xAI (announced July 2023) |
| 8 | Meta | |
| 9 | Mistral AI | Arthur Mensch appears at Mistral AI (co-founded 2023) |
| 10 | DeepSeek, Qwen, Moonshot AI, Z.ai | |
| 11 | NVIDIA | Jensen Huang (founder and CEO) beside the logo |
| 12 | TSMC | |
| 13 | ASML | |

Each move cites sources (`MOVES` in `industry.ts`); the controller's "Sources
for what is lit" lists the moves so far and every source behind what is lit.
The projector shows one small credit line. No state.

## `IntelligenceScale` (risks: AGI vs ASI)

Props: `{}`. `steps: 5`. Always labelled with the thought-experiment
`EvidenceBadge` and "not a measurement": the sizes are symbolic.

| Step | Shows |
| --- | --- |
| 0 | An ant, filling the view (the camera is zoomed in on it) |
| 1 | The camera pulls back: a human, much bigger, next to the ant |
| 2 | AGI, an AI at human level: one robot-like figure about the human's height |
| 3 | The AGI is not one but many: identical copies fill the row and run past the frame, with three traits (copies without limit; never tired, never sleeps; expert level in every field). The human stays one |
| 4 | How AGI could become ASI, recursive self-improvement: a loop on the left (AI does AI research, a better AI, even faster research, back to the start) while a dot runs three turns and the AGI figures grow a little each turn (to 1.5 times) |
| 5 | ASI, a superintelligence: a giant that overflows the top of the frame on purpose (the crowd, traits and loop fade) |

Silhouettes are inline SVG in token colors (ink for ant and human, accent for
AGI and its copies, second accent for ASI). One ground line; a camera (zoom and
centre per step, `CAMERAS`) maps the figures onto the stage, and labels follow
it. Copies appear in a cascade, then the traits one by one. Reduced motion and
preview skip the zoom, cascade, loop dot and growth, and show the end state
(figures already grown at step 4). No state: the
projector follows the step.
