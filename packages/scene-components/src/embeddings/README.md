# Embedding scene components

Scenes 2.4 to 2.6. Data: `content/assets/embeddings/canonical.json` (artifact
`embeddings-canonical`), built from `content/assets/embeddings/vocabulary.ts`
(see [How the data was built](#how-the-data-was-built)). Live embedding:
`/api/embed` (paraphrase-multilingual-MiniLM-L12-v2 on Hugging Face) through
`cloudEmbed` in `@ai-exhibit/ml-runtime/lm`.

The precomputed file is bundled as a lazy chunk, so the map works without a
server. Only the controller in search mode ever calls the model.

## `EmbeddingExplorer`

Props: `{ mode: "cloud" | "search" | "training" }`.

### `mode: "training"` (storyboard 3.4 and 3.5), set `steps: 2`

Labelled on screen as an illustration at every step: training adjusts the
model's numbers, it does not move dots in space. The end positions are the real
model's 3D layout (`space.coords.umap3d`); the colours are ours.

Every step is the same turning 3D cloud (`Training.tsx` on `Cloud3D`), so it
keeps turning from one step to the next; there is no 2D/3D switch on this
slide. The cloud is framed a little smaller and lower than elsewhere
(`fit`), so as it turns it stays inside the short box and clear of the card.

| Step | What appears |
| --- | --- |
| 0 | Every word starts as a dot in a tight random cloud around the centre (`randomStart3d`, seeded, identical on every screen), coloured by group so the mix is visible: embeddings are initialised as small random values near zero. "cat" ("chat" in French) is labelled, and a card in the top right corner shows its first four numbers (small random values near zero), "384 numbers in all". The caption bridges from the text classifier of chapter 02, where a word was only present or absent: to capture meaning, each word becomes a list of numbers, a point in space. This step alone serves scene 3.4. |
| 1 | The words glide to their real 3D positions over about 5 s (`trainingPosition3d`: fast moves first, then small refinements, like a learning curve) while the cloud turns slowly, with a "Text read" bar. On landing, group names fade in, cat and chat are labelled and the card switches to the first four real numbers of "cat". |
| 2 | Animals, Emotions, Countries and Capitals stay lit, the rest dims; chat and cat are labelled side by side (each name on its outer side), joined by a line inside a dashed ring, with "same meaning, two languages" above or below the ring (`pair`). A click on a word stars it and lists its neighbours. |

The animation plays when the presenter moves from step 0 to step 1 while the
scene is on screen; arriving later (or with reduced motion or paused motion, or
in the preview) shows the end state at once, and the cloud does not turn. The
controller has a `Replay` button (state `replay`, a counter) that replays it on
every screen. Controller and projector each run the same deterministic
animation locally. The cloud can be dragged and zoomed at any step
(`camera3d`); at step 2 its corner has a `Show all words` button.

### Exploring the map (search, cloud)

On the controller the 2D map pans and zooms (`InteractiveMap.tsx`, maths in
`view.ts`):

- Mouse wheel and trackpad pinch zoom about the pointer; drag pans; a
  double-click zooms in on that point; `+`, `−` and `Reset view` buttons sit in
  the bottom right corner. Zoom is limited to 1x to 14x and the view can never
  leave the words.
- Click a word to select it: it is starred, joined to its nearest neighbours
  and listed with them (precomputed, all 384 dimensions). In search mode the
  click fills the result panel. With a word selected, `+` zooms toward it.
- Labels follow the zoom: zoomed out, group names and a few words; from about
  2.5x every word in view is labelled, with collision avoidance, and group names
  disappear from 3x.
- Keyboard: once the map has focus (click or Tab), `+`/`=` and `-` zoom and `0`
  resets. Arrows, Space and Page keys are deliberately not captured, so they
  keep driving the talk even after a click on the map (the least surprising
  choice on stage). The buttons sit in a `data-keys-local` region so Space or
  Enter on them never advances a slide.
- The camera (`camera`: centre in data coordinates and zoom) and the selection
  (`selected`, or `query` in search mode) are published in scene state at most
  every 90 ms; the projector eases toward each update (or jumps with reduced
  motion), so it shows the same view, at any screen size.
- The 3D cloud (all three modes): drag rotates (and tilts), wheel or
  pinch zooms, buttons zoom and reset. It stops turning on its own once moved;
  `camera3d` is published the same way.
- `Show all words` (state `showAll`) labels words in whichever view is shown.
  In 3D every word gets a label (433 of them), checked on every frame:
  highlighted words first, then group names (dropped from 2x zoom; each may
  slide a line up or down), then a pair's note, then the other words, nearest
  first within each; a label that would overlap one kept
  before it, the query, or the buttons' corner is hidden for that frame, so
  more words appear as the cloud is zoomed in. Hidden labels stop being moved
  once faded out, and a still cloud is not redrawn.

### `mode: "cloud"` (scene 2.4), set `steps: 2`

| Step | What appears |
| --- | --- |
| 0 | Every vocabulary item as an ivory dot, a scattering of word labels. Caption: the model placed them. |
| 1 | Dots take one colour per group, group names appear (Fraunces italic). Caption: we added the colours, the model never saw the categories. |
| 2 | Teal threads join each French word to its English translation; chat/cat, roi/king, pluie/rain are labelled. |

Controller extras (any step): `2D map` / `3D cloud` toggle (the 3D cloud turns
slowly; it stops when motion is paused). From step 1, clicking a group name
isolates that group; `Show all` clears it.

Group names on the map (FR / EN): Animaux / Animals, Nourriture / Food,
Famille et personnes / Family and people, Émotions / Emotions, Métiers / Jobs,
Pays / Countries, Capitales / Capitals, Couleurs / Colors, Nombres / Numbers,
Météo / Weather, Technologie / Technology, Véhicules / Vehicles, Musique / Music,
Corps humain / Human body, Sports / Sports, Petites phrases / Short phrases.

Talking points the data supports (checked against the build output):

- Translations land together: for 198 of 205 French words the nearest
  neighbour in the full space is the English translation (chat/cat 0.77,
  roi/king 0.98, pluie/rain 0.99).
- "car" sits far from "voiture" on the map: in French "car" also means
  "because". The neighbour list still ranks "car" third for "voiture".
- Capitals sit next to their countries (Tokyo/Japon 0.88, Le Caire/Égypte 0.88).

### `mode: "search"` (scene 2.5), `steps: 0`

The controller types a word or a short phrase. Live mode embeds it through
`/api/embed`, finds its true neighbours in all 384 dimensions, and estimates a map position from
those neighbours. The screen says that the list is more faithful than the
picture. Display renders only from `ctx.state.query`.

Suggested live words (they give clean results): violoniste, hôpital,
un petit chien, je suis content; kitten, hospital, a small dog, I am happy.
Words that show the model's limits honestly: framboise (lands near Belgique),
souris (lands near joie, perhaps read as a form of "sourire"), orage violent (near colère).

### Fallback

- `mode: "fallback"` (the `F` key) or Simulation: never calls the model. Typed
  text is fuzzy matched (accents, case, plural, small typos) to a vocabulary
  word and that word's precomputed neighbours are shown, with "Closest prepared
  word".
- Live mode when Hugging Face does not answer: the controller says so calmly
  and searches the vocabulary. The badge says why and, after a failed call,
  offers "Retry Hugging Face"; too many requests this minute only sends that
  one query to the vocabulary, the next one asks Hugging Face again.
- `canonical.json` missing: a one-line notice, no crash.

### State (published by the controller, < 1 KB)

```ts
{ view?: "2d" | "3d" (default "3d"); focus?: number | null; busy?: boolean; replay?: number;
  camera?: { u, v, k } | null; camera3d?: { angle, tilt, zoom } | null; selected?: number | null;
  query?: { text, source: "model" | "vocabulary" | "unknown", matched?,
            neighbours: { index, similarity }[], position, position3d, ms? } | null }
```

## `MeaningDimensions`

Props: none. Set `steps: 7`. A scripted illustration that comes before the
map: why a word needs many numbers. Positions and values are invented and
labelled as such on screen; everything is a pure function of the step
(`dimensions.ts`), so previous and next work both ways, every screen draws the
same picture, and there is no state, model call or network. Motion is CSS
transitions between step states, off with reduced motion and in previews.

| Step | What appears |
| --- | --- |
| 0 | One line, one number per word (written under each dot): colours on the left, fruits on the right, "orange" in the middle. Badge: "1 number per word" |
| 1 | "salmon" floats above the line, wobbling, with a "?" and two dashed arrows: toward the colours and toward a dashed "the sea?" that has no place |
| 2 | A vertical axis, "the sea", grows from the line; fish, sea and boat appear at the top; salmon settles between the colours and the sea, with its two numbers. French only: "pêche" (peach and fishing) between the fruits and the sea. Badge: "2 numbers per word" |
| 3 | "blue" lifts off the line, wobbling, pulled by four arrows (colours, sea, sky, and "sad" in English or "hématome" in French, for "un bleu"); sky and sad/hématome land on other words (dashed, colliding labels) |
| 4 | A third number: the plane shrinks back into a far wall and a floor comes toward the room, with a third axis ("feelings" in English, "le corps" in French); sad/hématome moves out along it, and "blue" settles near the colours, the sea and the sky, and that direction, with its three numbers and a dashed drop to the floor. Words outside blue's story go quieter. Badge: "3 numbers per word" |
| 5 | A fourth meaning appears outside the box, dashed: "the blues" (the music) in English, "les Bleus" (the French national football team) in French; one arrow pulls "blue", which wobbles again with a "?": no direction is left for it |
| 6 | The map fades; "blue" becomes a row of 384 invented numbers (the first six written, then 384 thin bars), and three tiles: 384 (our word map), 4,096 (Llama 3.1 8B), 16,384 (Llama 3.1 405B), with sources. Badge: "384 numbers per word" |
| 7 | The caption becomes the bridge: "Next: the real map, learned from text." |

Words are copy (`{ en }`, translated in the catalog); a word can be limited to
some locales (`locales` in `WORDS`). Positions are shared between locales.

## How the data was built

The map is frozen: it was built by a script that ran the model locally (8-bit
ONNX export of the same model) and has since been removed; a test checks that
`canonical.json` still matches `vocabulary.ts`. Each text was embedded as `": <text>"` with mean pooling and L2 normalisation,
then centred on the vocabulary mean: without the prefix the model collapses many
unrelated French single words together. UMAP (umap-js, exact cosine kNN, seeded)
gave the 2D and 3D layouts; among 12 fixed seeds the script kept the 2D layout
that fills a 16:9 screen best and the most evenly spread 3D one. The
`/api/embed` answers match the stored vectors closely (median cosine 0.9985,
see `packages/cloud-api/src/embed.ts`).

Colours and themes: everything uses `theme/tokens.css` variables, so the light
(default) and dark themes switch without a redraw (all drawing is SVG with CSS
variables, no canvas). Group colours (`clusterColor` in `data.ts`) are six
token hues, blends of neighbouring hues, and hues blended toward the text
colour, all through `color-mix` on token variables. Language is carried by
shape (filled, ring, ring with fill), never by colour alone.
