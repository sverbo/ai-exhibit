import { intlLocale, type L10n, type Locale } from "@ai-exhibit/presentation-core";

export { tr } from "@ai-exhibit/presentation-core";

export function formatSimilarity(x: number, locale: Locale): string {
  return x.toLocaleString(intlLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const EXPLORER = {
  cloudHeading: {  en: "A map of meanings" },
  searchHeading: {  en: "Search a word" },
  cloudCaptions: [
    {
      en: "Each dot is a word or a short phrase. The model decides where it goes.",
    },
    {
      en: "We added the colours. The model never saw these categories.",
    },
    {
      en: "A thread joins each word to its translation: \"chat\" and \"cat\" land almost on the same spot.",
    },
  ] satisfies L10n[],
  legendFr: { fr: "français", en: "French" },
  legendEn: { fr: "anglais", en: "English" },
  legendBoth: {  en: "same in both languages" },
  legendPair: {  en: "translation" },
  view2d: {  en: "2D map" },
  view3d: {  en: "3D cloud" },
  showAll: {  en: "Show all" },
  clusterHint: {  en: "Click a group name to isolate it." },
  placeholder: {  en: "Type a word or a phrase" },
  submit: { fr: "Chercher", en: "Search" },
  clear: {  en: "Clear" },
  tryThese: {  en: "Try: kitten, hospital, a small dog, I am happy" },
  tryVocabulary: {  en: "Try a word from the map: cat, king, rain, Lisbon" },
  waiting: {  en: "Waiting for a word…" },
  thinking: {  en: "The model is working…" },
  loadingModel: {  en: "Loading the model…" },
  listHeading: {  en: "Closest according to the model" },
  closeness: {  en: "closeness" },
  faithful: {
    en: "This list uses all 384 dimensions of the model. The map keeps only 2, so the word's position on it is approximate.",
  },
  modelMissing: {
    en: "The online model is not available: search is limited to the prepared words.",
  },
  fallbackActive: {
    en: "Fallback mode: search is limited to the prepared words.",
  },
  matched: {  en: "Closest prepared word:" },
  unknown: {
    en: "This word is not among the prepared words. Try a word from the map.",
  },
  fromVocabulary: {  en: "precomputed neighbours" },
  liveMs: {  en: "computed live" },
  dataMissing: {
    en: "The map data is missing. Run the content preparation step.",
  },
  loadingData: {  en: "Loading the map…" },
} as const;

export const MAP_CONTROLS = {
  mapLabel: {
    en: "Word map: wheel or pinch to zoom, drag to move, double-click to zoom in, keys + − 0",
  },
  zoomIn: {  en: "Zoom in" },
  zoomOut: {  en: "Zoom out" },
  reset: {  en: "Reset view" },
  showAll: {  en: "Show all words" },
  hint: {
    en: "Scroll to zoom, drag to move, click a word to see its neighbours.",
  },
  neighboursOf: {  en: "Neighbours of" },
} as const;

export const TRAINING = {
  heading: {  en: "Words become points" },
  captions: [
    {
      en: "So far a word was just present or absent. To capture meaning, each word becomes a list of numbers, a point in space: before training, a random point near the centre.",
    },
    {
      en: "After reading a large part of the internet, words with related meanings end up together.",
    },
    {
      en: "Groups form on their own, even across languages: \"chat\" and \"cat\" end up side by side.",
    },
  ] satisfies L10n[],
  illustrative: {
    en: "Illustration. Training adjusts the model's numbers; it does not move dots in space. The final cloud is the real model's; the colours are ours.",
  },
  progress: {  en: "Text read" },
  replay: {  en: "Replay" },
  vectorTitleRandom: {
    en: "before training: small random values near zero",
  },
  vectorTitleTrained: {  en: "the model's real numbers" },
  vectorMore: {  en: "… 384 numbers in all" },
  pairNote: {  en: "same meaning, two languages" },
} as const;
