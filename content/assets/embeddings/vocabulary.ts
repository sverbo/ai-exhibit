import type { L10n } from "@ai-exhibit/presentation-core";

/**
 * Curated vocabulary for the embedding explorer (scenes 2.4 to 2.6).
 *
 * Most entries are French/English translation pairs: the model is multilingual,
 * so "chat" and "cat" should land next to each other. Words spelled the same in
 * both languages (Paris, piano, tennis) are listed once with lang "both".
 * Words with a strong second meaning across clusters (souris, avocat, neuf as
 * "new", fils/son) are avoided on purpose so the clusters read cleanly; search
 * mode is the place to try them live. Entries were also screened with the model:
 * French words it barely knows on their own (ours, grêle, voile, marron...)
 * landed in a meaningless clump and were replaced by better known ones.
 *
 * `canonical.json` was built from this list by a script that ran the model
 * locally; that script has been removed, so the map is frozen. A test checks
 * that the two still match: editing this file means rebuilding the map.
 */

export type VocabularyLang = "fr" | "en" | "both";

export interface VocabularyCluster {
  id: string;
  label: L10n;
  /** [french, english] translation pairs. */
  pairs: [string, string][];
  /** Spelled identically in French and English. */
  shared?: string[];
}

export interface VocabularyItem {
  text: string;
  lang: VocabularyLang;
  cluster: string;
  /** Index of the translation partner in the flattened list, or -1. */
  pair: number;
}

export const clusters: VocabularyCluster[] = [
  {
    id: "animals",
    label: { fr: "Animaux", en: "Animals" },
    pairs: [
      ["chat", "cat"],
      ["chien", "dog"],
      ["cheval", "horse"],
      ["vache", "cow"],
      ["cochon", "pig"],
      ["mouton", "sheep"],
      ["oiseau", "bird"],
      ["poisson", "fish"],
      ["lapin", "rabbit"],
      ["loup", "wolf"],
      ["éléphant", "elephant"],
      ["serpent", "snake"],
      ["tigre", "tiger"],
      ["singe", "monkey"],
      ["baleine", "whale"],
      ["papillon", "butterfly"],
      ["girafe", "giraffe"],
    ],
  },
  {
    id: "food",
    label: { fr: "Nourriture", en: "Food" },
    pairs: [
      ["pain", "bread"],
      ["fromage", "cheese"],
      ["pomme", "apple"],
      ["fraise", "strawberry"],
      ["gâteau", "cake"],
      ["soupe", "soup"],
      ["riz", "rice"],
      ["œuf", "egg"],
      ["beurre", "butter"],
      ["viande", "meat"],
      ["carotte", "carrot"],
      ["tomate", "tomato"],
      ["chocolat", "chocolate"],
      ["pâtes", "pasta"],
      ["lait", "milk"],
    ],
  },
  {
    id: "people",
    label: { fr: "Famille et personnes", en: "Family and people" },
    pairs: [
      ["mère", "mother"],
      ["père", "father"],
      ["sœur", "sister"],
      ["frère", "brother"],
      ["grand-mère", "grandmother"],
      ["grand-père", "grandfather"],
      ["grands-parents", "grandparents"],
      ["oncle", "uncle"],
      ["tante", "aunt"],
      ["bébé", "baby"],
      ["enfant", "child"],
      ["homme", "man"],
      ["femme", "woman"],
      ["garçon", "boy"],
      ["roi", "king"],
      ["reine", "queen"],
    ],
  },
  {
    id: "emotions",
    label: { fr: "Émotions", en: "Emotions" },
    pairs: [
      ["joie", "joy"],
      ["tristesse", "sadness"],
      ["colère", "anger"],
      ["peur", "fear"],
      ["amour", "love"],
      ["haine", "hatred"],
      ["heureux", "happy"],
      ["triste", "sad"],
      ["fâché", "angry"],
      ["honte", "shame"],
      ["fierté", "pride"],
      ["espoir", "hope"],
      ["jalousie", "jealousy"],
      ["calme", "calm"],
      ["bonheur", "happiness"],
      ["dégoût", "disgust"],
    ],
  },
  {
    id: "jobs",
    label: { fr: "Métiers", en: "Jobs" },
    pairs: [
      ["médecin", "doctor"],
      ["infirmière", "nurse"],
      ["enseignant", "teacher"],
      ["boulanger", "baker"],
      ["policier", "police officer"],
      ["pompier", "firefighter"],
      ["cuisinier", "cook"],
      ["agriculteur", "farmer"],
      ["ingénieur", "engineer"],
      ["pilote", "pilot"],
      ["plombier", "plumber"],
      ["juge", "judge"],
      ["journaliste", "journalist"],
      ["architecte", "architect"],
    ],
  },
  {
    id: "countries",
    label: { fr: "Pays", en: "Countries" },
    pairs: [
      ["Allemagne", "Germany"],
      ["Espagne", "Spain"],
      ["Italie", "Italy"],
      ["Japon", "Japan"],
      ["Chine", "China"],
      ["Brésil", "Brazil"],
      ["Mexique", "Mexico"],
      ["Égypte", "Egypt"],
      ["Inde", "India"],
      ["Russie", "Russia"],
      ["Belgique", "Belgium"],
      ["Suisse", "Switzerland"],
      ["Royaume-Uni", "United Kingdom"],
      ["États-Unis", "United States"],
      ["Maroc", "Morocco"],
    ],
    shared: ["France", "Canada"],
  },
  {
    id: "capitals",
    label: { fr: "Capitales", en: "Capitals" },
    pairs: [
      ["Londres", "London"],
      ["Pékin", "Beijing"],
      ["Moscou", "Moscow"],
      ["Le Caire", "Cairo"],
      ["Bruxelles", "Brussels"],
      ["Lisbonne", "Lisbon"],
      ["Varsovie", "Warsaw"],
      ["Athènes", "Athens"],
      ["Vienne", "Vienna"],
    ],
    shared: ["Paris", "Rome", "Berlin", "Madrid", "Tokyo", "Ottawa"],
  },
  {
    id: "colors",
    label: { fr: "Couleurs", en: "Colors" },
    pairs: [
      ["rouge", "red"],
      ["bleu", "blue"],
      ["vert", "green"],
      ["jaune", "yellow"],
      ["noir", "black"],
      ["blanc", "white"],
      ["violet", "purple"],
      ["rose", "pink"],
      ["gris", "grey"],
    ],
    shared: ["orange"],
  },
  {
    id: "numbers",
    label: { fr: "Nombres", en: "Numbers" },
    pairs: [
      ["zéro", "zero"],
      ["un", "one"],
      ["deux", "two"],
      ["trois", "three"],
      ["quatre", "four"],
      ["cinq", "five"],
      ["sept", "seven"],
      ["huit", "eight"],
      ["dix", "ten"],
      ["douze", "twelve"],
      ["vingt", "twenty"],
      ["cent", "hundred"],
      ["mille", "thousand"],
    ],
  },
  {
    id: "weather",
    label: { fr: "Météo", en: "Weather" },
    pairs: [
      ["pluie", "rain"],
      ["neige", "snow"],
      ["soleil", "sun"],
      ["nuage", "cloud"],
      ["brouillard", "fog"],
      ["chaleur", "heat"],
      ["froid", "cold"],
      ["glace", "ice"],
      ["tempête", "storm"],
      ["température", "temperature"],
      ["éclair", "lightning"],
    ],
  },
  {
    id: "tech",
    label: { fr: "Technologie", en: "Technology" },
    pairs: [
      ["ordinateur", "computer"],
      ["téléphone", "phone"],
      ["clavier", "keyboard"],
      ["écran", "screen"],
      ["logiciel", "software"],
      ["courriel", "email"],
      ["intelligence artificielle", "artificial intelligence"],
      ["réseau", "network"],
      ["mot de passe", "password"],
      ["imprimante", "printer"],
      ["application", "app"],
      ["données", "data"],
      ["algorithme", "algorithm"],
      ["puce électronique", "microchip"],
    ],
    shared: ["internet", "robot"],
  },
  {
    id: "vehicles",
    label: { fr: "Véhicules", en: "Vehicles" },
    pairs: [
      ["voiture", "car"],
      ["vélo", "bicycle"],
      ["avion", "airplane"],
      ["bateau", "boat"],
      ["camion", "truck"],
      ["moto", "motorcycle"],
      ["métro", "subway"],
      ["hélicoptère", "helicopter"],
      ["sous-marin", "submarine"],
      ["fusée", "rocket"],
      ["tracteur", "tractor"],
    ],
    shared: ["train", "bus", "taxi"],
  },
  {
    id: "music",
    label: { fr: "Musique", en: "Music" },
    pairs: [
      ["musique", "music"],
      ["guitare", "guitar"],
      ["violon", "violin"],
      ["chanson", "song"],
      ["chanteur", "singer"],
      ["trompette", "trumpet"],
      ["flûte", "flute"],
      ["mélodie", "melody"],
      ["rythme", "rhythm"],
      ["orchestre", "orchestra"],
      ["danse", "dance"],
      ["harpe", "harp"],
      ["chorale", "choir"],
    ],
    shared: ["piano", "concert", "saxophone"],
  },
  {
    id: "body",
    label: { fr: "Corps humain", en: "Human body" },
    pairs: [
      ["tête", "head"],
      ["main", "hand"],
      ["pied", "foot"],
      ["œil", "eye"],
      ["bouche", "mouth"],
      ["nez", "nose"],
      ["oreille", "ear"],
      ["cœur", "heart"],
      ["bras", "arm"],
      ["jambe", "leg"],
      ["dent", "tooth"],
      ["cheveux", "hair"],
      ["épaule", "shoulder"],
      ["genou", "knee"],
      ["doigt", "finger"],
    ],
  },
  {
    id: "sports",
    label: { fr: "Sports", en: "Sports" },
    pairs: [
      ["natation", "swimming"],
      ["course à pied", "running"],
      ["escalade", "climbing"],
      ["randonnée", "hiking"],
      ["patinage", "skating"],
      ["cyclisme", "cycling"],
      ["basket-ball", "basketball"],
    ],
    shared: ["tennis", "ski", "judo", "golf", "football", "rugby"],
  },
  {
    id: "phrases",
    label: { fr: "Petites phrases", en: "Short phrases" },
    pairs: [
      ["Il pleut des cordes", "It's raining cats and dogs"],
      ["Je t'aime", "I love you"],
      ["Bonjour, comment ça va ?", "Hello, how are you?"],
      ["J'ai faim", "I'm hungry"],
      ["Bonne nuit", "Good night"],
      ["Merci beaucoup", "Thank you very much"],
      ["Où est la gare ?", "Where is the train station?"],
      ["Il fait très chaud aujourd'hui", "It is very hot today"],
      ["Mon chat dort sur le canapé", "My cat is sleeping on the couch"],
      ["Joyeux anniversaire", "Happy birthday"],
    ],
  },
];

/** Flattened, stable order: per cluster, pairs (fr then en), then shared words. */
export function flattenVocabulary(defs: VocabularyCluster[] = clusters): VocabularyItem[] {
  const items: VocabularyItem[] = [];
  for (const c of defs) {
    for (const [fr, en] of c.pairs) {
      const i = items.length;
      items.push({ text: fr, lang: "fr", cluster: c.id, pair: i + 1 });
      items.push({ text: en, lang: "en", cluster: c.id, pair: i });
    }
    for (const word of c.shared ?? []) {
      items.push({ text: word, lang: "both", cluster: c.id, pair: -1 });
    }
  }
  return items;
}
