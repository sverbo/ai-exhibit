# Text classifier components

The running example of chapter 02 told with short sentences instead of pixel
faces: which sport is this sentence about, football or basketball? One
hand-written set of 24 sentences, one hand-written keyword rule, one learned
decision tree, one small trained network. Everything is deterministic, so
scenes can use `fallback: { kind: "deterministic" }` (fallback renders exactly
like live).

## Data (`data/`)

- `text.ts`: how a sentence is read. Lower case, split into words, plural "s"
  dropped ("baskets" and "basket", "nets" and "net" are the same word),
  grammar words ("the", "de"...) ignored by every learner.
- `small.ts`: the 24 hand-written labelled sentences per language (12 per
  sport), the task picks, the keyword rule, the rule's failure and the trap
  sentence of tree-unseen. Something obvious is missing on purpose: no
  English football sentence mentions the net, no French football sentence
  mentions shoes.
- `rule.ts`: the hand rule (classic AI). Football keywords first, then
  basketball keywords, otherwise football. A keyword matches any word starting
  with it ("kick" matches "kicked").
- `tree.ts`: CART learner whose only question is "does the sentence contain
  the word X?" (Gini, candidate words seen in at least 2 sentences, at least
  2 sentences per side, depth at most 3, ties to the more frequent word then
  alphabetical). Learned at runtime from the 24 sentences in well under a
  millisecond. It learns `net? basketball : hoop? basketball : football` in
  English and `basket? basket : panier? basket : football` in French.
- `corpus.ts`: sentence generator for the network: a player, an action (verb
  and object from the same group) and sometimes a moment, or a casual
  sentence ("My son plays football in the park."). Many words are shared by
  both sports. Unlike the small set, football sentences do mention the net,
  and French football sentences sometimes mention "baskets".
- `net.ts` + `textNet.en.json` / `textNet.fr.json`: bag-of-words network
  (one 0/1 input per known word, 16 tanh neurons, one sigmoid output for
  "basketball"), trained with seeded mini-batch Adam on 500 generated
  sentences plus the 24 hand-written ones. English: 201 words, 3,249
  numbers; French: 206 words, 3,329 numbers. The test re-trains both and
  compares with the committed weights. To regenerate after changing the
  sentences or the training, run from the repository root
  `pnpm exec tsx packages/scene-components/src/textlab/data/trainNets.ts`,
  then the tests say which picks or scores in `examples.ts` changed.
- `net.ts` also exports `TextNetTraining`, the same seeded training one
  mini-batch at a time (`trainTextNet` runs it to the end; the test checks
  both land on the committed weights). The learning stream runs it live.
- `simple.ts`: the simplified view the network scenes draw. Only the
  sentence's known words (up to 8), the 5 hidden neurons with the largest
  influence on the answer for that sentence (|value x weight to the output|),
  every connection between them and each neuron's connection to the output.
  All numbers are real; the output is the whole network's. The network has
  one sigmoid output; the diagram shows Football and Basketball, which is
  exact (a softmax with basketball weights w / 2 and football weights
  -w / 2 gives the same probabilities).
- `learning.ts`: the learning beat. One training sentence the untrained
  network gets wrong (en: "The power forward dunked the ball through the
  hoop in the fourth quarter.", Football 56%; fr: « Ma fille joue au foot sur la
  plage. », Basket 62 %), the real starting weights of the seeded training,
  and one real gradient-descent step on that sentence alone (step size 0.2,
  chosen so one step is visible; only connections from the sentence's words
  and into the output move). Same sentence after: Basketball 75% / Football
  57 %. The test checks all of this. `curve.<locale>.json` is the real test
  accuracy after each of the 420 mini-batches (written by trainNets.ts,
  checked by the tests), drawn during the learning stream.
- `examples.ts`: the learned tree (cached per language), the network's
  picked failure, and the scores shown on
  screen, all re-derived by `textlab.test.ts`.

Scores shown (English / French): rule 18 / 17 of the 24 examples; tree 23 of
24 examples, 116 / 108 of 200 new sentences (58% / 54%); network 199 of 200
new sentences (99.5%). The network gets the trap sentence right. Its
failure is a fresh sentence (seed 99, never trained on): one of 19 / 32
mistakes among 6,000, basketball 96% / basket 92 %.

## TextClassifierLab

Props: `{ stage: "task" | "rules" | "tree" | "tree-unseen" | "learning" | "network" | "network-fail"; heading?: L10n }`.

One color language: football is `--color-accent-2`, basketball is
`--color-accent`. A highlighted word wears a marker in the tone of the sport
it points to (rule keywords, words the tree tested and found). Network
numbers take the same tones by sign (positive pushes toward basketball).
Right/wrong use `--color-ok` / `--color-danger`.

The three network scenes share one frame (like `llm/TrainingLoop`: optional
phase chips, a big headline per step, the sentence on a card with the right
answer stamped next to it, small print "Simplified view of the real network:
201 words, 16 neurons, 3,249 connections. Real numbers.") and one big diagram,
`parts/SimpleNet.tsx`: word chips with a 1 when present, 5 neurons, two
outputs with bar and percentage. Line thickness is the weight's size, colour
the sport it pushes toward. SVG with CSS transitions, so a change of weights
animates (none under reduced motion or in previews). Words are separate list
items (never one run of text, see `render.test.tsx`).

Scene order: `network` (what is inside) comes before `learning` (how it
learns), then `network-fail`. Training is shown once, in `learning`.

| Stage | Step 0 | Step 1 | Step 2 | `scene.steps` |
| --- | --- | --- | --- | --- |
| `task` | One big sentence, "Football ? Basketball" | Four labelled sentences per sport | | 1 |
| `rules` | The three-line rule, a sentence it gets right (keyword marked), "right on 18 of 24" | A new basketball sentence with "kicked" in it: the rule says football ("dunk" shown faint, never reached) | | 1 |
| `tree` | The 24 labelled sentences | The learned tree alone, to read its questions: no sentence, no path, no verdict; "Each box asks: does the sentence contain this word? Follow yes or no down to an answer.", "right on 23 of them" | One example walks through it (path lit, tested word marked, "To us", "The tree says"); previous / next example on the controller | 2 |
| `tree-unseen` | The tree and the trap sentence, posed as a question: "What will the tree answer?", "The tree says ?" (no path, no word marked, no verdict) | Everything at once: "To us: football", "The tree says basketball" wrong, the path lit, "net" (or "baskets") marked | | 1 |
| `network` | Words go in: chips lit, "1" on each (trap sentence) | Every connection is a weight: lines take thickness and colour, three of them labelled with their real number | Each neuron adds up what reaches it: neurons fill | Step 3, out come two scores: Football >99%, "On 200 new sentences: tree 58%, network 99.5%. And it gets the trap sentence right." | 3 |
| `network-fail` | The failure goes through: Basketball 96%, wrong; stamp "Football"; "Confident, and wrong." | Open the hood: the diagram with every neuron's value, and a table of every drawn weight; "All the lines and numbers are there. None of them says why." | "We can test it. We cannot know in advance where it will fail." | 2 |

`learning` (`scene.steps`: 4), same frame and diagram, chips Guess, Compare, Nudge, Again:

- 0 "At first, the connections are random": stamp "?", Football 56% / Basketball 44%.
- 1 Compare: the right answer stamped, the gap up to 100% hatched on its bar, "It gave it 44%; it should be 100%. Wrong by this much."
- 2 Nudge: the lines change thickness and colour (1.6 s transition), every moved line gets a halo as wide as its move, three or four labelled "before → after" with an up/down arrow, "Each connection moves a little, in the direction that would have helped."
- 3 Again: same sentence, Basketball 75%, "A bit better: 44% → 75%."
- 4 Again and again: the real seeded training streams on the controller (a few readable sentences, then more and more mini-batches per tick), the diagram redrawn for each sentence, "Sentences seen" up to 10,480, and the real accuracy on the 200 new sentences rising from 48% to 99.5%. "Train again", "Skip to the end".

Example sentences (English / French):

- task: "Our goalkeeper saved the penalty." / « Notre gardien a arrêté le penalty. »
- rules, right: "A late goal sent the match into extra time." / « Un but tardif a envoyé le match en prolongation. »
- rules, wrong: "Furious after missing the dunk, he kicked the ball into the stands." / « Furieux d'avoir raté son dunk, il a donné un coup de pied dans le ballon. »
- tree-unseen trap: "The striker smashed the ball into the back of the net." / « Il est venu jouer au foot en baskets. »
- network-fail: "The young forward hit the goalpost in the first half." (basketball, 96%) / « L'ailier a marqué contre son camp devant un public conquis. » (basket, 92 %)

Controller only (published via state, small):

- `tree`, step 2: previous / next example (`{ example }`, any integer,
  read modulo 24). Steps 1 and 2 render one layout keyed by the example: the
  tree alone turns into the first walk smoothly (same DOM), and each new
  example mounts afresh. Reusing the DOM across examples let the CSS
  transitions start from the previous example (its highlight slid onto the
  word at the same position in the new sentence, its leaf stayed lit for a
  moment beside the new verdict). `render.test.tsx` checks every example on
  the controller and the display, and the key.
- `learning`, step 4: the training snapshot (`{ train }`: steps, sentences
  seen, current sentence, its drawn weights rounded, neuron values, output;
  under 1 KB). "Train again" (`trainRun`), "Skip to the end" (`trainSkip`).
  Reduced motion: the training jumps to its end. A controller that comes back
  resumes from `train.steps` (same seed, same numbers). The display only draws
  the snapshot.
- `tree-unseen` step 1 and `network-fail` step 0: click a word to remove it
  or put it back (`{ removed }`, token indices), "Restore the sentence". The
  truth label hides while the sentence is edited. Remove "net" on
  tree-unseen: the tree answers football.

Every screen computes the tree path and the network's forward pass from the
sentence (a few thousand multiplications); no training at runtime.
