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
model's numbers, it does not move dots on a map. The end positions are the real
model's 2D map; the colours are ours.

| Step | What appears |
| --- | --- |
| 0 | Every word starts as a dot in a tight random cloud around the centre (seeded, identical on every screen), coloured by group so the mix is visible: embeddings are initialised as small random values near zero. "cat" ("chat" in French) is labelled, and a card in the top right corner shows its first four numbers (small random values near zero), "384 numbers in all". The caption bridges from the text classifier of chapter 02, where a word was only present or absent: to capture meaning, each word becomes a list of numbers, a point in space. This step alone serves scene 3.4. |
| 1 | The cloud expands and organises into the real map over about 5 s (fast moves first, then small refinements, like a learning curve), with a "Text read" bar. On landing, group names and word labels fade in and the card switches to the first four real numbers of "cat". |
| 2 | Animals, Emotions, Countries and Capitals stay lit, the rest dims; chat and cat are circled with "same meaning, two languages". |

The animation plays when the presenter moves from step 0 to step 1 while the
scene is on screen; arriving later (or with reduced motion or paused motion, or
in the preview) shows the end state at once. The controller has a `Replay`
button (state `replay`, a counter) that replays it on every screen. Controller
and projector each run the same deterministic animation locally.

### Exploring the map (training last step, search, cloud)

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
- The 3D cloud (cloud and search modes): drag rotates (and tilts), wheel or
  pinch zooms, buttons zoom and reset. It stops turning on its own once moved;
  `camera3d` is published the same way.

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
  and searches the vocabulary.
- `canonical.json` missing: a one-line notice, no crash.

### State (published by the controller, < 1 KB)

```ts
{ view?: "2d" | "3d"; focus?: number | null; busy?: boolean; replay?: number;
  camera?: { u, v, k } | null; camera3d?: { angle, tilt, zoom } | null; selected?: number | null;
  query?: { text, source: "model" | "vocabulary" | "unknown", matched?,
            neighbours: { index, similarity }[], position, position3d, ms? } | null }
```

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
