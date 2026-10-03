import type { L10n, Locale } from "@ai-exhibit/presentation-core";

export function tr(value: L10n, locale: Locale): string {
  return value[locale];
}

export function formatSimilarity(x: number, locale: Locale): string {
  return x.toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const EXPLORER = {
  cloudHeading: { fr: "Une carte des sens", en: "A map of meanings" },
  searchHeading: { fr: "Chercher un mot", en: "Search a word" },
  cloudCaptions: [
    {
      fr: "Chaque point est un mot ou une petite phrase. C'est le modèle qui les place.",
      en: "Each dot is a word or a short phrase. The model decides where it goes.",
    },
    {
      fr: "Les couleurs, c'est nous qui les ajoutons. Le modèle n'a jamais vu ces catégories.",
      en: "We added the colours. The model never saw these categories.",
    },
    {
      fr: "Un fil relie chaque mot à sa traduction : «\u00a0chat\u00a0» et «\u00a0cat\u00a0» tombent presque au même endroit.",
      en: "A thread joins each word to its translation: \"chat\" and \"cat\" land almost on the same spot.",
    },
  ] satisfies L10n[],
  legendFr: { fr: "français", en: "French" },
  legendEn: { fr: "anglais", en: "English" },
  legendBoth: { fr: "pareil dans les deux langues", en: "same in both languages" },
  legendPair: { fr: "traduction", en: "translation" },
  view2d: { fr: "Carte 2D", en: "2D map" },
  view3d: { fr: "Nuage 3D", en: "3D cloud" },
  showAll: { fr: "Tout montrer", en: "Show all" },
  clusterHint: { fr: "Cliquer un nom de groupe pour l'isoler.", en: "Click a group name to isolate it." },
  placeholder: { fr: "Tapez un mot ou une phrase", en: "Type a word or a phrase" },
  submit: { fr: "Chercher", en: "Search" },
  clear: { fr: "Effacer", en: "Clear" },
  tryThese: { fr: "Essayez : violoniste, hôpital, un petit chien, je suis content", en: "Try: kitten, hospital, a small dog, I am happy" },
  tryVocabulary: { fr: "Essayez un mot de la carte : chat, roi, pluie, Lisbonne", en: "Try a word from the map: cat, king, rain, Lisbon" },
  waiting: { fr: "En attente d'un mot…", en: "Waiting for a word…" },
  thinking: { fr: "Le modèle calcule…", en: "The model is working…" },
  loadingModel: { fr: "Le modèle se prépare…", en: "Loading the model…" },
  listHeading: { fr: "Les plus proches selon le modèle", en: "Closest according to the model" },
  closeness: { fr: "proximité", en: "closeness" },
  faithful: {
    fr: "Cette liste est calculée sur les 384 dimensions du modèle. La carte n'en garde que 2 : la position du mot y est approximative.",
    en: "This list uses all 384 dimensions of the model. The map keeps only 2, so the word's position on it is approximate.",
  },
  modelMissing: {
    fr: "Modèle en ligne indisponible : la recherche se limite aux mots préparés.",
    en: "The online model is not available: search is limited to the prepared words.",
  },
  fallbackActive: {
    fr: "Mode secours : la recherche se limite aux mots préparés.",
    en: "Fallback mode: search is limited to the prepared words.",
  },
  matched: { fr: "Mot préparé le plus proche :", en: "Closest prepared word:" },
  unknown: {
    fr: "Ce mot ne fait pas partie des mots préparés. Essayez un mot de la carte.",
    en: "This word is not among the prepared words. Try a word from the map.",
  },
  fromVocabulary: { fr: "voisins précalculés", en: "precomputed neighbours" },
  liveMs: { fr: "calculé en direct", en: "computed live" },
  dataMissing: {
    fr: "Les données de la carte sont introuvables. Lancer la préparation des contenus.",
    en: "The map data is missing. Run the content preparation step.",
  },
  loadingData: { fr: "Chargement de la carte…", en: "Loading the map…" },
} as const;

export const MAP_CONTROLS = {
  mapLabel: {
    fr: "Carte des mots : molette ou pincement pour zoomer, glisser pour se déplacer, double-clic pour zoomer, touches + − 0",
    en: "Word map: wheel or pinch to zoom, drag to move, double-click to zoom in, keys + − 0",
  },
  zoomIn: { fr: "Zoomer", en: "Zoom in" },
  zoomOut: { fr: "Dézoomer", en: "Zoom out" },
  reset: { fr: "Vue d'ensemble", en: "Reset view" },
  showAll: { fr: "Tous les mots", en: "Show all words" },
  hint: {
    fr: "Molette pour zoomer, glisser pour se déplacer, cliquer un mot pour voir ses voisins.",
    en: "Scroll to zoom, drag to move, click a word to see its neighbours.",
  },
  neighboursOf: { fr: "Voisins de", en: "Neighbours of" },
} as const;

export const TRAINING = {
  heading: { fr: "Les mots deviennent des points", en: "Words become points" },
  captions: [
    {
      fr: "Jusqu'ici, un mot était juste présent ou absent. Pour saisir le sens, chaque mot devient une liste de nombres, un point dans l'espace : avant l'entraînement, un point au hasard près du centre.",
      en: "So far a word was just present or absent. To capture meaning, each word becomes a list of numbers, a point in space: before training, a random point near the centre.",
    },
    {
      fr: "Après avoir lu une grande partie d'internet, les mots de sens proche se retrouvent ensemble.",
      en: "After reading a large part of the internet, words with related meanings end up together.",
    },
    {
      fr: "Les groupes se forment tout seuls, même entre langues : «\u00a0chat\u00a0» et «\u00a0cat\u00a0» se retrouvent côte à côte.",
      en: "Groups form on their own, even across languages: \"chat\" and \"cat\" end up side by side.",
    },
  ] satisfies L10n[],
  illustrative: {
    fr: "Illustration. L'entraînement ajuste des nombres, il ne déplace pas de points sur une carte. La carte d'arrivée est celle du vrai modèle ; les couleurs sont les nôtres.",
    en: "Illustration. Training adjusts the model's numbers; it does not move dots on a map. The final map is the real model's; the colours are ours.",
  },
  progress: { fr: "Texte lu", en: "Text read" },
  replay: { fr: "Rejouer", en: "Replay" },
  vectorTitleRandom: {
    fr: "avant l'entraînement : petites valeurs au hasard, proches de zéro",
    en: "before training: small random values near zero",
  },
  vectorTitleTrained: { fr: "les vrais nombres du modèle", en: "the model's real numbers" },
  vectorMore: { fr: "… 384 nombres en tout", en: "… 384 numbers in all" },
  pairNote: { fr: "même sens, deux langues", en: "same meaning, two languages" },
} as const;
