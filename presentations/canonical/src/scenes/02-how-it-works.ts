import type { L10n, SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/**
 * Prompt shared by the base-model and chat scenes. The fallback recordings
 * (`recordings-next-token`) are made for exactly these strings. French editions
 * run Qwen2.5-0.5B, English ones SmolLM2-135M (see
 * scene-components/src/language/data.ts).
 */
const baseVsInstructPrompt: L10n = { fr: "Comment mieux dormir ?", en: "How can I sleep better?" };

/**
 * Chapter 02: how it works (storyboard v1, scenes 2.1 to 2.20).
 * AI, machine learning and neural networks through one running example (is a
 * sentence about football or basketball?), then language models with the same
 * vocabulary. Numbers and network diagrams appear only in the text classifier
 * scenes and the training scene.
 */
export const chapter02: SceneDefinition[] = [
  partOpener("02"),
  {
    id: "02-envelopes",
    steps: 3,
    chapter: "02",
    number: "2.1",
    title: { en: "AI, machine learning, neural networks", fr: "IA, apprentissage automatique, réseaux de neurones" },
    objective: {
      en: "Place the words: AI contains machine learning, which contains neural networks, which contain language models.",
      fr: "Situer les mots : l'IA contient l'apprentissage automatique, qui contient les réseaux de neurones, qui contiennent les modèles de langage.",
    },
    takeaway: {
      en: "AI is the big family; language models are one small, recent branch of it.",
      fr: "L'IA est la grande famille ; les modèles de langage en sont une branche petite et récente.",
    },
    visual: { layout: "component", component: "AIEnvelopes", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- AI: anything that imitates human intelligence, even rules written by people
- Machine learning: the rules are learned from examples
- Neural networks, also called "deep learning" (many layers): one way of learning, loosely inspired by the brain
- Language models (LLMs): neural networks trained on text
- Each circle sits inside the previous one`,
      fr: `- IA : tout ce qui imite l'intelligence humaine, même des règles écrites à la main
- Apprentissage automatique : les règles sont apprises à partir d'exemples
- Réseaux de neurones, qu'on appelle aussi « deep learning » (apprentissage profond, à plusieurs couches) : une façon d'apprendre, vaguement inspirée du cerveau
- Modèles de langage (LLM) : des réseaux de neurones entraînés sur du texte
- Chaque cercle est inclus dans le précédent`,
    },
    transitionIn: { en: "From what it does to what it is.", fr: "De ce qu'elle fait à ce qu'elle est." },
    transitionOut: { en: "These words have a history.", fr: "Ces mots ont une histoire." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "02-short-history",
    steps: 9,
    chapter: "02",
    number: "2.2",
    title: { en: "A very short history", fr: "Une très courte histoire" },
    objective: {
      en: "Give a very short history of the field, from Turing's universal machine to the Transformer, GPT-2 and GPT-3.",
      fr: "Donner une très courte histoire du domaine, de la machine universelle de Turing au Transformer, à GPT-2 et à GPT-3.",
    },
    takeaway: {
      en: "AI is an old idea; what changed recently is learning from huge amounts of data.",
      fr: "L'IA est une vieille idée ; ce qui a changé récemment, c'est l'apprentissage sur d'énormes quantités de données.",
    },
    visual: { layout: "component", component: "AITimeline", props: { range: "ai" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Start, 1936: Turing describes one universal machine that can run any step-by-step procedure, the idea behind every computer
- Click 1, 1939 to 1945: at Bletchley Park, Turing helps break Enigma. Polish cryptanalysts (Rejewski, Różycki, Zygalski) broke it first and shared their methods in July 1939. The Bombe starts from a guessed word ("Wetterbericht", weather report) and searches for the settings that fit
- **Do:** let the search run (about 12 seconds): drums spin, settings are rejected, "Stop", then the message decodes; "Replay the search" restarts it
- Nuance: this is search, trying settings one by one and rejecting contradictions; learning, later in the talk, nudges numbers a little after each mistake. Both find settings from data
- Click 2, 1956: the name "artificial intelligence". Click 3, 1958: the perceptron, the first neural network that learns; the press already promises a computer that will read
- Click 4, 1970s to 1980s: the AI winters. Promises unmet, simple networks hit their limits, rule-based expert systems prove brittle, funding dries up twice
- Click 5, 1997: Deep Blue beats Kasparov at chess with search and scoring rules written by people
- Click 6, 2012: a neural network for images (a CNN) wins the ImageNet contest, trained on two gaming graphics cards: deep learning takes off
- Click 7, 2017: the Transformer, the T in GPT: it reads all the words at once, so training spreads over thousands of chips; far faster, but hungry for electricity. Clicks 8 and 9: GPT-2 (2019) and GPT-3 (2020), models only, no company names yet`,
      fr: `- Début, 1936 : Turing décrit une seule machine universelle capable d'exécuter n'importe quelle procédure pas à pas, l'idée derrière tout ordinateur
- Clic 1, 1939 à 1945 : à Bletchley Park, Turing aide à casser Enigma. Des cryptologues polonais (Rejewski, Różycki, Zygalski) l'avaient cassée les premiers et ont partagé leurs méthodes en juillet 1939. La Bombe part d'un mot deviné (« Wetterbericht », bulletin météo) et cherche les réglages qui collent
- **Faire :** laisser la recherche tourner (une douzaine de secondes) : les tambours tournent, des réglages sont rejetés, « Stop », puis le message se décode ; « Rejouer la recherche » la relance
- Nuance : c'est de la recherche, essayer les réglages un par un et rejeter les contradictions ; l'apprentissage, plus loin dans l'exposé, ajuste un peu des nombres après chaque erreur. Les deux trouvent des réglages à partir de données
- Clic 2, 1956 : le nom « intelligence artificielle ». Clic 3, 1958 : le perceptron, le premier réseau de neurones qui apprend ; la presse promet déjà un ordinateur qui saura lire
- Clic 4, années 1970 et 1980 : les hivers de l'IA. Promesses non tenues, réseaux simples à bout de souffle, systèmes experts à règles trop fragiles, financements taris deux fois
- Clic 5, 1997 : Deep Blue bat Kasparov aux échecs avec une recherche et des règles de notation écrites par des humains
- Clic 6, 2012 : un réseau de neurones pour les images (un CNN) gagne le concours ImageNet, entraîné sur deux cartes graphiques de jeu vidéo : l'apprentissage profond décolle
- Clic 7, 2017 : le Transformer, le T de GPT : il lit tous les mots à la fois, donc l'entraînement se répartit sur des milliers de puces ; bien plus rapide, mais gourmand en électricité. Clics 8 et 9 : GPT-2 (2019) et GPT-3 (2020), des modèles seulement, pas encore de noms d'entreprises`,
    },
    transitionIn: { en: "From the family tree to its history.", fr: "De l'arbre de famille à son histoire." },
    transitionOut: {
      en: "To see the difference between these eras, one simple example.",
      fr: "Pour voir la différence entre ces époques, un seul exemple simple.",
    },
    evidenceLevel: "observed",
    sourceIds: [
      "st-turing-1936-computable-numbers",
      "st-sep-turing-machine",
      "st-bletchley-turing",
      "st-bletchley-bombe",
      "st-wiki-bombe",
      "st-wiki-rejewski",
      "st-mccarthy-1955-dartmouth-proposal",
      "st-cornell-2019-perceptron",
      "st-wiki-ai-winter",
      "st-lighthill-1973-report",
      "st-wiki-expert-system",
      "st-ibm-deep-blue",
      "st-krizhevsky-2012-alexnet",
      "st-imagenet-2012-results",
      "llm-vaswani-2017",
      "llm-gpt2-paper",
      "llm-gpt3-paper",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,

  },
  {
    id: "02-text-task",
    steps: 1,
    chapter: "02",
    number: "2.3",
    title: { en: "Football or basketball?", fr: "Football ou basket ?" },
    objective: {
      en: "Introduce the running example: decide whether a short sentence is about football or basketball.",
      fr: "Présenter l'exemple fil rouge : décider si une phrase courte parle de football ou de basket.",
    },
    takeaway: {
      en: "Obvious for us, and surprisingly hard to explain to a computer.",
      fr: "Évident pour nous, et étonnamment difficile à expliquer à un ordinateur.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "task" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Our running example: short sentences about sport
- The task: is this sentence about football or basketball?
- **Ask:** which words give it away?
- **Do:** next: a few labelled sentences for each sport
- Obvious for us; how would you explain it to a computer?`,
      fr: `- Notre exemple fil rouge : des phrases courtes sur le sport
- La tâche : cette phrase parle-t-elle de football ou de basket ?
- **Question :** quels mots la trahissent ?
- **Faire :** étape suivante : quelques phrases étiquetées pour chaque sport
- Évident pour nous ; comment l'expliquer à un ordinateur ?`,
    },
    transitionIn: { en: "From history to one concrete task.", fr: "De l'histoire à une tâche concrète." },
    transitionOut: { en: "First idea: write the rule ourselves.", fr: "Première idée : écrire la règle nous-mêmes." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
  },
  {
    id: "02-text-rules",
    steps: 1,
    chapter: "02",
    number: "2.4",
    title: { en: "Write the rule", fr: "Écrire la règle" },
    objective: {
      en: "Show classic AI: a person writes a keyword rule, which works on many sentences and fails on others.",
      fr: "Montrer l'IA classique : une personne écrit une règle de mots-clés, qui marche sur beaucoup de phrases et échoue sur d'autres.",
    },
    takeaway: {
      en: "Rules written by hand work until they meet a case nobody thought of.",
      fr: "Les règles écrites à la main marchent jusqu'au cas auquel personne n'a pensé.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "rules" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Classic AI: a person writes the rule
- Here: a list of keywords for each sport
- Right on 18 of the 24 examples
- **Do:** a basketball sentence with "kicked" in it: the rule says football
- Every exception needs a new rule, written by hand`,
      fr: `- L'IA classique : une personne écrit la règle
- Ici : une liste de mots-clés pour chaque sport
- Juste sur 17 des 24 exemples
- **Faire :** une phrase de basket avec « coup de pied » : la règle dit football
- Chaque exception demande une nouvelle règle, écrite à la main`,
    },
    transitionIn: { en: "The first answer to the question.", fr: "La première réponse à la question." },
    transitionOut: { en: "What if the computer found the rule itself?", fr: "Et si l'ordinateur trouvait la règle lui-même ?" },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "02-text-tree",
    steps: 1,
    chapter: "02",
    number: "2.5",
    title: { en: "Learn the rule", fr: "Apprendre la règle" },
    objective: {
      en: "Show machine learning: a decision tree learns its questions from labelled sentences.",
      fr: "Montrer l'apprentissage automatique : un arbre de décision apprend ses questions à partir de phrases étiquetées.",
    },
    takeaway: {
      en: "In machine learning, people give examples and the computer finds the rule.",
      fr: "En apprentissage automatique, on donne des exemples et l'ordinateur trouve la règle.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "tree" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- We give 24 sentences, each labelled by a person
- The computer only asks "does the sentence contain the word X?"
- It picks the question that best separates the examples, then repeats
- **Do:** walk one example through the tree
- Right on 23 of 24, and nobody wrote this rule`,
      fr: `- On donne 24 phrases, chacune étiquetée par une personne
- L'ordinateur ne pose qu'une question : « la phrase contient-elle le mot X ? »
- Il choisit la question qui sépare le mieux les exemples, puis recommence
- **Faire :** faire passer un exemple dans l'arbre
- Juste sur 23 des 24, et personne n'a écrit cette règle`,
    },
    transitionIn: { en: "From writing rules to learning them.", fr: "D'écrire les règles à les apprendre." },
    transitionOut: { en: "Let's look at what it actually learned.", fr: "Regardons ce qu'il a vraiment appris." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: true,
  },
  {
    id: "02-text-tree-unseen",
    steps: 1,
    chapter: "02",
    number: "2.6",
    title: { en: "A strange rule", fr: "Une règle étrange" },
    objective: {
      en: "Let the room spot the odd rule the tree learned by itself, then show a new sentence falling into it.",
      fr: "Faire repérer à la salle la règle étrange que l'arbre a apprise seul, puis montrer une nouvelle phrase qui tombe dans le piège.",
    },
    takeaway: {
      en: "A learned rule can be odd; with a tree, at least, we can open the hood and see it.",
      fr: "Une règle apprise peut être étrange ; avec un arbre, au moins, on peut ouvrir le capot et la voir.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "tree-unseen" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- The tree we just trained, and a new sentence: "The striker smashed the ball into the back of the net."
- **Ask:** what will the tree answer? Let them read the tree and search
- **Do:** reveal: to us, football; the tree says basketball. The path lights up and "net" is highlighted
- It learned "contains net, so basketball": no football example mentioned a net
- It learned by itself, and we can open the hood and spot the odd rule
- **Do:** remove "net": now it says football`,
      fr: `- L'arbre qu'on vient d'entraîner, et une phrase nouvelle : « Il est venu jouer au foot en baskets. »
- **Question :** que va répondre l'arbre ? Les laisser lire l'arbre et chercher
- **Faire :** révéler : pour nous, foot ; l'arbre dit basket. Le chemin s'allume et « baskets » est surligné
- Il a appris « contient basket, donc basket » : aucun exemple de foot ne parlait de chaussures
- Il a appris seul, et on peut ouvrir le capot pour repérer la règle étrange
- **Faire :** retirer « baskets » : il répond football`,
    },
    transitionIn: { en: "The learned rule, looked at closely.", fr: "La règle apprise, vue de près." },
    transitionOut: { en: "To do better: a neural network.", fr: "Pour faire mieux : un réseau de neurones." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 180,
    optional: false,
  },
  {
    id: "02-text-network",
    steps: 3,
    chapter: "02",
    number: "2.7",
    title: { en: "A neural network", fr: "Un réseau de neurones" },
    objective: {
      en: "Show that a small neural network trained on many more sentences is far more accurate, and that its rule is thousands of numbers.",
      fr: "Montrer qu'un petit réseau de neurones entraîné sur beaucoup plus de phrases est bien plus précis, et que sa règle tient en milliers de nombres.",
    },
    takeaway: {
      en: "A neural network is far better, and its rule is a block of numbers nobody wrote.",
      fr: "Un réseau de neurones fait bien mieux, et sa règle est un bloc de nombres que personne n'a écrit.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "network" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- To do better than the tree: a neural network. A simplified view of the real one (200 words, 16 neurons, 3,249 connections)
- **Do:** words go in: each word of the sentence lights up
- **Do:** every connection is a number, a "weight": thick means strong, colour means "pushes towards football" or "towards basketball"
- **Do:** each neuron adds up what reaches it and fills up
- **Do:** two scores come out, turned into percentages: football, over 99%; the trap sentence is right this time
- On 200 new sentences: tree 58%, network 99.5%. But where do those weights come from?`,
      fr: `- Pour faire mieux que l'arbre : un réseau de neurones. Une vue simplifiée du vrai (200 mots, 16 neurones, 3 249 connexions)
- **Faire :** les mots entrent : chaque mot de la phrase s'allume
- **Faire :** chaque connexion est un nombre, un « poids » : épais veut dire fort, la couleur veut dire « pousse vers le foot » ou « vers le basket »
- **Faire :** chaque neurone additionne ce qui lui arrive et se remplit
- **Faire :** deux scores sortent, transformés en pourcentages : foot, plus de 99 % ; cette fois la phrase piège est juste
- Sur 200 phrases nouvelles : arbre 58 %, réseau 99,5 %. Mais d'où viennent ces poids ?`,
    },
    transitionIn: { en: "To do better: a neural network.", fr: "Pour faire mieux : un réseau de neurones." },
    transitionOut: { en: "But where do those weights come from?", fr: "Mais d'où viennent ces poids ?" },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "02-text-learning",
    steps: 4,
    chapter: "02",
    number: "2.8",
    title: { en: "How a network learns", fr: "Comment un réseau apprend" },
    objective: {
      en: "Show the learning loop on one sentence: guess, compare with the right answer, nudge every connection a little, try again.",
      fr: "Montrer la boucle d'apprentissage sur une seule phrase : deviner, comparer avec la bonne réponse, ajuster un peu chaque connexion, recommencer.",
    },
    takeaway: {
      en: "Learning is a tiny correction after each mistake, repeated thousands of times.",
      fr: "Apprendre, c'est une minuscule correction après chaque erreur, répétée des milliers de fois.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "learning" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Where the weights come from: at first they are random, so the network guesses at random
- **Do:** a basketball sentence: it says "football, 56%" (only 44% basketball)
- **Do:** compare with the right answer: this gap is the error
- **Do:** nudge: every connection moves a little in the direction that would have helped; watch the lines change, a few show before and after
- **Do:** same sentence again: basketball 75% (one step, enlarged so you can see it)
- **Do:** then thousands of sentences: guess, compare, nudge, repeat; the score climbs to 99.5%`,
      fr: `- D'où viennent les poids : au départ ils sont aléatoires, donc le réseau répond au hasard
- **Faire :** une phrase de foot : il ne lui donne que 38 % de foot
- **Faire :** comparer avec la bonne réponse : cet écart, c'est l'erreur
- **Faire :** ajuster : chaque connexion bouge un peu dans la direction qui aurait aidé ; regarder les lignes changer, quelques-unes montrent avant et après
- **Faire :** la même phrase à nouveau : foot 57 %, un peu mieux (un seul pas, agrandi pour qu'on le voie)
- **Faire :** puis des milliers de phrases : deviner, comparer, ajuster, recommencer ; le score monte jusqu'à 99,5 %`,
    },
    transitionIn: { en: "But where do those weights come from?", fr: "Mais d'où viennent ces poids ?" },
    transitionOut: { en: "Trained, accurate. And yet.", fr: "Entraîné, précis. Et pourtant." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 150,
    optional: false,
  },
  {
    id: "02-text-network-fail",
    steps: 2,
    chapter: "02",
    number: "2.9",
    title: { en: "Only numbers", fr: "Rien que des nombres" },
    objective: {
      en: "Show the network failing on a new sentence, and that opening it shows only numbers: we can test it, not know in advance.",
      fr: "Montrer le réseau qui échoue sur une phrase nouvelle, et qu'en l'ouvrant on ne voit que des nombres : on peut le tester, pas le prévoir.",
    },
    takeaway: {
      en: "We can test a neural network; we cannot know in advance where it will fail.",
      fr: "On peut tester un réseau de neurones ; on ne peut pas savoir à l'avance où il échouera.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "network-fail" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Excellent on average, and yet: a new football sentence, the network says basketball, 96% sure
- **Do:** open the hood: the same diagram, every weight is there
- No line says why, unlike the tree's odd "net" rule
- We can test it; we cannot know in advance where it will fail`,
      fr: `- Excellent en moyenne, et pourtant : une nouvelle phrase de foot, le réseau répond basket, sûr de lui
- **Faire :** ouvrir le capot : le même schéma, tous les poids sont là
- Aucune ligne ne dit pourquoi, contrairement à la règle bizarre « net » de l'arbre
- On peut le tester ; on ne peut pas savoir à l'avance où il se trompera`,
    },
    transitionIn: { en: "Trained, accurate. And yet.", fr: "Entraîné, précis. Et pourtant." },
    transitionOut: { en: "This is not just a toy problem.", fr: "Ce n'est pas qu'un problème de jouet." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
  },
  {
    id: "02-google-photos",
    steps: 1,
    chapter: "02",
    number: "2.10",
    title: { en: "Google Photos, 2015", fr: "Google Photos, 2015" },
    objective: {
      en: "Show a documented case where a powerful learned classifier produced a severe error nobody caught before release.",
      fr: "Montrer un cas documenté où un classifieur appris très performant a produit une erreur grave que personne n'avait repérée avant la sortie.",
    },
    takeaway: {
      en: "A very capable learned system can still fail badly, in ways nobody saw coming.",
      fr: "Un système appris très performant peut quand même échouer gravement, d'une façon que personne n'avait prévue.",
    },
    visual: {
      layout: "component",
      component: "SingleCase",
      props: {
        picture: "photo-app",
        title: { en: "Google Photos", fr: "Google Photos" },
        line: {
          en: "A photo app labelled two Black people “gorillas”. Nobody wrote that rule; it came from learning.",
          fr: "Une application photo a étiqueté deux personnes noires « gorilles ». Personne n'a écrit cette règle ; elle est sortie de l'apprentissage.",
        },
        date: "2015",
        evidence: "observed",
        outcome: {
          en: "Often, neither the model nor the engineers are the problem: models learn from data that reflects our society, with its gaps and biases. Yet we want them to do better than that past.",
          fr: "Souvent, ni le modèle ni les ingénieurs ne sont le problème : les modèles apprennent sur des données qui reflètent notre société, avec ses manques et ses biais. Or on veut qu'ils fassent mieux que ce passé.",
        },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Tone: sober, this hurt real people; never show the photos
- 2015: Google Photos labels your pictures automatically, with a learned model
- It labelled photos of two Black people "gorillas"; a user found it after release
- Nobody wrote that rule: the error came out of learning
- **Do:** step 1: years later (2018), the fix was still to block the label, not to correct the model
- **Do:** next: the general lesson, not a diagnosis of this case (Google never published the exact cause): biased or under-represented data is the usual suspect
- The data reflects decades of who was photographed and labelled; a model trained on it inherits that, and we want it to do better than that past
- The outcome: years later, the fix was still to block the label`,
      fr: `- Ton sobre : cela a blessé de vraies personnes ; ne jamais montrer les photos
- 2015 : Google Photos étiquette vos photos automatiquement, avec un modèle appris
- Il a étiqueté des photos de deux personnes noires « gorilles » ; un utilisateur l'a découvert après la sortie
- Personne n'a écrit cette règle : l'erreur est sortie de l'apprentissage
- **Faire :** étape 1 : des années plus tard (2018), le correctif consistait toujours à bloquer l'étiquette, pas à corriger le modèle
- **Faire :** ensuite, la leçon générale, pas un diagnostic de ce cas (Google n'a jamais publié la cause exacte) : des données biaisées ou qui sous-représentent certains groupes sont le suspect habituel
- Les données reflètent des décennies de qui a été photographié et étiqueté ; un modèle entraîné dessus en hérite, et on voudrait qu'il fasse mieux que ce passé
- L'issue : des années plus tard, le correctif consistait toujours à bloquer l'étiquette`,
    },
    transitionIn: { en: "From our toy sentences to a real image classifier used by millions.", fr: "De nos phrases jouets à un vrai classifieur d'images utilisé par des millions de personnes." },
    transitionOut: { en: "Now, the same ideas applied to language.", fr: "Maintenant, les mêmes idées appliquées au langage." },
    evidenceLevel: "observed",
    sourceIds: ["fm-google-photos-2015-petapixel", "fm-google-photos-2018-techreview", "fm-aiid-incident-16"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: true,
    localizationNotes: "Keep the quoted label exactly as documented; do not paraphrase or soften it.",
  },
  {
    id: "02-next-token",
    steps: 4,
    chapter: "02",
    number: "2.11",
    title: { en: "Predict the next word", fr: "Prédire le token suivant" },
    objective: {
      en: "Show that a language model makes the same kind of choice as the sport classifier, but among every token of its vocabulary.",
      fr: "Montrer qu'un modèle de langage fait le même genre de choix que le classifieur de sport, mais parmi tous les tokens de son vocabulaire.",
    },
    takeaway: {
      en: "A language model is a classifier whose labels are every possible next word.",
      fr: "Un modèle de langage, c'est un classifieur dont les étiquettes sont tous les mots suivants possibles.",
    },
    visual: { layout: "component", component: "NextTokenVsClassifier", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Football or basketball: a choice between two labels
- A language model makes the same kind of choice
- But among every word it knows, tens of thousands of them
- **Do:** watch two bars become a long list
- Real probabilities, recorded from a real model
- Pick one: that is the next word`,
      fr: `- Football ou basket : un choix entre deux étiquettes
- Un modèle de langage fait le même genre de choix
- Mais parmi tous les tokens qu'il connaît, des dizaines de milliers
- **Faire :** les deux barres deviennent une longue liste
- De vraies probabilités, enregistrées sur un vrai modèle
- On en choisit un : c'est le mot suivant`,
    },
    transitionIn: { en: "From labelling sentences to predicting words.", fr: "D'étiqueter des phrases à prédire des mots." },
    transitionOut: { en: "This simple change gives two superpowers.", fr: "Ce simple changement donne deux super-pouvoirs." },
    evidenceLevel: "none",
    sourceIds: ["llm-amd-olmo-1b-config", "fnd-qwen25-config"],
    runtimeClass: "A",
    artifacts: ["recordings-next-token"],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    localizationNotes: "Recorded probabilities come from AMD-OLMo-1B (English) and Qwen2.5-0.5B (French), through languageModelFor.",
  },
  {
    id: "02-two-superpowers",
    steps: 3,
    chapter: "02",
    number: "2.12",
    title: { en: "Two superpowers, one bet", fr: "Deux super-pouvoirs, un pari" },
    objective: {
      en: "Explain why next-word prediction changed everything: it generates, it needs no human labels, and it rewards sheer scale.",
      fr: "Expliquer pourquoi prédire le mot suivant a tout changé : ça génère, ça ne demande aucune étiquette humaine, et ça récompense la taille.",
    },
    takeaway: {
      en: "Almost unlimited data plus one simple task: the bet was to scale it up, and it paid off.",
      fr: "Des données presque illimitées et une tâche simple : le pari était de tout agrandir, et il a payé.",
    },
    visual: {
      layout: "cards",
      heading: { en: "Two superpowers, one bet", fr: "Deux super-pouvoirs, un pari" },
      cards: [
        {
          title: { en: "It writes", fr: "Il écrit" },
          body: {
            en: "A classifier stops at its answer. Here the answer goes back in: add the word, predict again.",
            fr: "Un classifieur s'arrête à sa réponse. Ici, la réponse repart dans la phrase : on ajoute le mot, on prédit encore.",
          },
        },
        {
          title: { en: "Almost unlimited data", fr: "Des données presque illimitées" },
          body: {
            en: "Sorting images needs people to label them. Here the label is the next word, already in the text.",
            fr: "Trier des images demande des humains pour les étiqueter. Ici, l'étiquette, c'est le mot suivant, déjà dans le texte.",
          },
          sourceIds: ["tk-wiki-recaptcha"],
        },
        {
          title: { en: "The bet: scale", fr: "Le pari : la taille" },
          body: {
            en: "Keep the same simple task; make the model and the data vastly bigger. GPT-2 rambles, GPT-3 stuns.",
            fr: "Garder la même tâche simple ; rendre le modèle et les données immensément plus grands. GPT-2 divague, GPT-3 bluffe.",
          },
          sourceIds: ["tk-kaplan-2020-scaling-laws", "llm-gpt2-paper", "llm-gpt3-paper"],
        },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Superpower 1, it writes: a classifier gives one answer and stops; here the answer goes back in, again and again
- Superpower 2, almost unlimited data: to train an image classifier, people must label every picture
- **Ask:** who has clicked on traffic lights in a CAPTCHA? Those clicks labelled images (Google says, to improve Maps)
- Here nobody labels anything: the next word is already in the text, so every text ever written is training data
- The bet: keep this one simple task and scale everything up; 2020 "scaling laws": errors fall predictably with size, data and compute, the exact design matters little
- GPT-2 (1.5 billion numbers) sometimes talks nonsense; GPT-3 (175 billion, 100 times bigger) is suddenly bluffing: same recipe, bigger`,
      fr: `- Super-pouvoir 1, il écrit : un classifieur donne une réponse et s'arrête ; ici la réponse repart dans la phrase, encore et encore
- Super-pouvoir 2, des données presque illimitées : pour entraîner un classifieur d'images, il faut des humains pour étiqueter chaque photo
- **Question :** qui a déjà cliqué sur des feux rouges dans un CAPTCHA ? Ces clics étiquetaient des images (Google dit : pour améliorer Maps)
- Ici, personne n'étiquette rien : le mot suivant est déjà dans le texte, donc tout texte jamais écrit devient une donnée d'entraînement
- Le pari : garder cette seule tâche simple et tout agrandir ; 2020, les « lois d'échelle » : l'erreur baisse de façon prévisible avec la taille, les données et le calcul, l'architecture exacte compte peu
- GPT-2 (1,5 milliard de nombres) dit parfois n'importe quoi ; GPT-3 (175 milliards, 100 fois plus gros) devient bluffant : même recette, en plus grand`,
    },
    transitionIn: { en: "Why this one change matters so much.", fr: "Pourquoi ce seul changement compte autant." },
    transitionOut: { en: "So how does it learn from all that text?", fr: "Alors, comment apprend-il de tout ce texte ?" },
    evidenceLevel: "none",
    sourceIds: ["tk-wiki-recaptcha", "tk-kaplan-2020-scaling-laws", "llm-gpt2-paper", "llm-gpt3-paper"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 150,
    optional: false,
  },
  {
    id: "02-how-training-works",
    steps: 4,
    chapter: "02",
    number: "2.13",
    title: { en: "How training works", fr: "Comment marche l'entraînement" },
    objective: {
      en: "Explain training as a loop: read a text up to a point, let the model guess the next word, measure the error, nudge the numbers, move one word forward.",
      fr: "Expliquer l'entraînement comme une boucle : lire un texte jusqu'à un point, laisser le modèle deviner le mot suivant, mesurer l'erreur, ajuster les nombres, avancer d'un mot.",
    },
    takeaway: {
      en: "Training is a tiny correction on the next word, repeated trillions of times.",
      fr: "L'entraînement, c'est une minuscule correction sur le mot suivant, répétée des milliers de milliards de fois.",
    },
    visual: { layout: "component", component: "TrainingLoop", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The same loop as football or basketball: guess, compare, nudge, repeat; only now the answer is the next word
- Take a real text and stop at some point: what is the next word?
- At first the model is random: the right word gets about 1 chance in 50,000 (0.002%)
- Compare with the real word: that is the error
- Nudge every number a tiny bit to do better
- Slide one word forward, then on to other texts: web, books, code, trillions of times
- Not only web pages and books: huge amounts of code, about 17% of Llama 3's training text
- Code is strict, structured text: the kind of precision the JSON tool calls of chapter 1 need
- Measured: adding code to pretraining improved reasoning, up to 8% relative (Aryabumi et al., 2024)
- Illustrative: real models have far more numbers`,
      fr: `- La même boucle que foot ou basket : deviner, comparer, ajuster, recommencer ; sauf que la réponse est le mot suivant
- Prendre un vrai texte et s'arrêter quelque part : quel est le mot suivant ?
- Au début, le modèle est aléatoire : le bon mot a environ 1 chance sur 50 000 (0,002 %)
- Comparer avec le vrai mot : c'est l'erreur
- Ajuster chaque nombre un tout petit peu pour faire mieux
- Avancer d'un mot, puis d'autres textes : web, livres, code, des milliers de milliards de fois
- Pas seulement des pages web et des livres : énormément de code, environ 17 % du texte d'entraînement de Llama 3
- Le code, c'est du texte strict et structuré : la précision qu'exigent les appels d'outils en JSON du chapitre 1
- Mesuré : ajouter du code au pré-entraînement améliore le raisonnement, jusqu'à 8 % en relatif (Aryabumi et al., 2024)
- Illustration : les vrais modèles ont bien plus de nombres`,
    },
    transitionIn: { en: "Free labels, put to work: the training loop.", fr: "Des étiquettes gratuites, mises au travail : la boucle d'entraînement." },
    transitionOut: { en: "But a computer does not read words: what does it really see?", fr: "Mais un ordinateur ne lit pas des mots : que voit-il vraiment ?" },
    evidenceLevel: "none",
    sourceIds: ["llm-llama3-paper", "llm-aryabumi-2024"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
  },
  {
    id: "02-tokens",
    steps: 1,
    chapter: "02",
    number: "2.14",
    title: { en: "Tokens", fr: "Les tokens" },
    objective: {
      en: "See live that a language model reads tokens, pieces of text with a number each, not words.",
      fr: "Voir en direct qu'un modèle de langage lit des tokens, des morceaux de texte avec chacun un numéro, et non des mots.",
    },
    takeaway: {
      en: "To the model, text is a sequence of numbered pieces.",
      fr: "Pour le modèle, un texte est une suite de morceaux numérotés.",
    },
    visual: { layout: "component", component: "TokenizerPlayground", props: { showIds: true } },
    interaction: "network",
    speakerNotes: {
      en: `- The model doesn't read words: it reads tokens
- A token: a whole word, part of a word, or a space and a letter
- **Ask:** give me a word or a sentence; type it
- **Do:** next step: each token has a number in a fixed dictionary
- The number says nothing about meaning yet`,
      fr: `- Le modèle ne lit pas des mots : il lit des tokens
- Un token : un mot entier, un bout de mot, ou un espace et une lettre
- **Question :** donnez-moi un mot ou une phrase ; le taper
- **Faire :** étape suivante : chaque token a un numéro dans un dictionnaire fixe
- Ce numéro ne dit encore rien du sens`,
    },
    transitionIn: { en: "From words to what the model actually reads.", fr: "Des mots à ce que le modèle lit vraiment." },
    transitionOut: { en: "A number has no meaning. So how does meaning get in?", fr: "Un numéro n'a pas de sens. Alors comment le sens arrive-t-il ?" },
    evidenceLevel: "none",
    sourceIds: ["llm-llama31-models"],
    runtimeClass: "C",
    artifacts: ["recordings-next-token"],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
    localizationNotes: "Each locale shows the tokenizer of the model its edition uses; pick example words natural in that language.",
  },
  {
    id: "02-embedding-training",
    steps: 2,
    chapter: "02",
    number: "2.15",
    title: { en: "Words as points", fr: "Les mots comme des points" },
    objective: {
      en: "Show that each word becomes a list of numbers, a point in space, scattered before training and organized after.",
      fr: "Montrer que chaque mot devient une liste de nombres, un point dans l'espace, dispersé avant l'entraînement et organisé après.",
    },
    takeaway: {
      en: "Training moves words with related meanings close together.",
      fr: "L'entraînement rapproche les mots de sens voisins.",
    },
    visual: { layout: "component", component: "EmbeddingExplorer", props: { mode: "training" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Our classifier only knew whether a word was there; richer: give each word a list of numbers
- That list is a point in space
- Before training: the points are scattered at random
- **Do:** play: the training loop we saw, repeated on huge amounts of text, gathers related words
- The animation is illustrative; the final map is real`,
      fr: `- Notre classifieur savait seulement si un mot était là ; plus riche : donner à chaque mot une liste de nombres
- Cette liste, c'est un point dans l'espace
- Avant l'entraînement : les points sont dispersés au hasard
- **Faire :** lancer : après des quantités énormes de texte, les mots liés se regroupent
- L'animation est une illustration ; la carte finale est réelle`,
    },
    transitionIn: { en: "From numbered pieces to points with meaning.", fr: "Des morceaux numérotés aux points porteurs de sens." },
    transitionOut: { en: "Let's explore the map with your words.", fr: "Explorons la carte avec vos mots." },
    evidenceLevel: "none",
    sourceIds: ["fnd-minilm-multilingual-model-card"],
    runtimeClass: "A",
    artifacts: ["embeddings-canonical"],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "02-embedding-play",
    steps: 0,
    chapter: "02",
    number: "2.16",
    title: { en: "Play with the map", fr: "Jouer avec la carte" },
    objective: {
      en: "Let the room suggest words, compute them live, and read their nearest neighbours.",
      fr: "Laisser la salle proposer des mots, les calculer en direct, et lire leurs plus proches voisins.",
    },
    takeaway: {
      en: "Closeness of meaning becomes something we can measure.",
      fr: "La proximité de sens devient quelque chose qu'on peut mesurer.",
    },
    visual: { layout: "component", component: "EmbeddingExplorer", props: { mode: "search" } },
    interaction: "network",
    speakerNotes: {
      en: `- **Ask:** a word, any word: a job, a place, an emotion
- **Do:** type it; it is computed live, by the same model through Hugging Face
- Read the nearest neighbours
- Surprising neighbour? Often a word used in the same sentences
- **Do:** "Show all words" labels every word; zoom in (wheel or pinch) to read one corner of the map
- The list is exact; the map is an approximation`,
      fr: `- **Question :** un mot, n'importe lequel : un métier, un lieu, une émotion
- **Faire :** le taper ; il est calculé en direct, par le même modèle via Hugging Face
- Lire les plus proches voisins
- Un voisin surprenant ? Souvent un mot employé dans les mêmes phrases
- **Faire :** « Tous les mots » affiche chaque mot ; zoomer (molette ou pincement) pour lire un coin de la carte
- La liste est exacte ; la carte est une approximation`,
    },
    transitionIn: { en: "The prepared map becomes interactive.", fr: "La carte préparée devient interactive." },
    transitionOut: { en: "So what comes out of all that training?", fr: "Alors, que sort-il de tout cet entraînement ?" },
    evidenceLevel: "none",
    sourceIds: ["fnd-minilm-multilingual-model-card"],
    runtimeClass: "C",
    artifacts: ["embeddings-canonical"],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: true,
    todo: [
      "Rehearse with a few likely audience words and check the neighbour lists are not embarrassing or offensive; prepare two safe fallback words.",
    ],
  },
  {
    id: "02-base-model",
    steps: 0,
    chapter: "02",
    number: "2.17",
    title: { en: "A base model", fr: "Un modèle de base" },
    objective: {
      en: "Show that a model straight out of pretraining just continues text, one token or several at a time.",
      fr: "Montrer qu'un modèle qui sort du pré-entraînement se contente de continuer le texte, un token ou plusieurs à la fois.",
    },
    takeaway: {
      en: "Pretraining gives a text continuer, not an assistant.",
      fr: "Le pré-entraînement donne un continuateur de texte, pas un assistant.",
    },
    visual: { layout: "component", component: "BaseModelPlayground", props: { prompt: baseVsInstructPrompt } },
    interaction: "network",
    speakerNotes: {
      en: `- This is "pretraining": exactly the next-word loop we saw, on a huge amount of text, nothing more
- **Do:** ask a question; it continues the page instead of answering
- **Do:** one token: show the bars, raise the temperature, draw one
- **Do:** several tokens: let it write on
- Here: Llama 3.1 8B, Meta's base model; the bars come from a larger sibling, Llama 3.3 70B Instruct, reading the same raw text (the base model's provider gives no probabilities), and the screen says so
- This model runs on Hugging Face, the public library where AI models are shared: remember that name
- It is neither helpful nor harmful: it imitates plausible text`,
      fr: `- C'est le « pré-entraînement » : exactement la boucle du mot suivant qu'on a vue, sur énormément de texte, rien de plus
- **Faire :** poser une question ; il continue la page au lieu de répondre
- **Faire :** un token : montrer les barres, monter la température, tirer
- **Faire :** plusieurs tokens : le laisser écrire
- Ici : Llama 3.1 8B, le modèle de base de Meta ; les barres viennent d'un grand frère, Llama 3.3 70B Instruct, qui lit le même texte brut (le fournisseur du modèle de base ne donne pas de probabilités), et l'écran le dit
- Ce modèle tourne sur Hugging Face, la bibliothèque publique où se partagent les modèles d'IA : retenez ce nom
- Ni serviable ni malveillant : il imite un texte plausible`,
    },
    transitionIn: { en: "We run the result of pretraining.", fr: "On fait tourner le résultat du pré-entraînement." },
    transitionOut: { en: "So how does it become an assistant?", fr: "Alors comment devient-il un assistant ?" },
    evidenceLevel: "none",
    sourceIds: ["llm-llama31-models", "llm-llama33-70b-model-card"],
    runtimeClass: "C",
    artifacts: ["recordings-next-token"],
    fallback: { kind: "recording", asset: "recordings-next-token" },
    durationSec: 210,
    optional: false,
    localizationNotes: "The prompt is shared with the chat scene; the recordings are made for exactly these strings.",
  },
  {
    id: "02-fine-tuned",
    steps: 1,
    chapter: "02",
    number: "2.18",
    title: { en: "A fine-tuned assistant", fr: "Un assistant affiné" },
    objective: {
      en: "Show that further training on questions and answers, plus guardrails, turns a base model into an assistant.",
      fr: "Montrer qu'un entraînement supplémentaire sur des questions-réponses, avec des garde-fous, transforme un modèle de base en assistant.",
    },
    takeaway: {
      en: "Fine-tuning is what turns a text continuer into an assistant.",
      fr: "C'est l'affinage qui transforme un continuateur de texte en assistant.",
    },
    visual: { layout: "component", component: "ChatPlayground", props: { prompt: baseVsInstructPrompt } },
    interaction: "network",
    speakerNotes: {
      en: `- Same kind of model, trained further on questions and answers (here Llama 3.1 8B Instruct, the assistant version of the base model we just used)
- **Do:** same question as before: now it answers
- It also learned which of two answers is preferred
- Guardrails: it is trained to refuse some requests
- **Do:** show the guardrail example (a recorded real refusal)
- Refusals are trained, and training can fail: this one refuses the bomb question (recorded); large assistants add far more safety training and filters
- **Do:** next step: what the model really reads: a hidden system prompt, role tags, the question, then "assistant:" and it continues
- Still next-word prediction: it writes the answer, then an end tag that tells the software to stop (here "<|eot_id|>")
- This step is what makes a chatbot`,
      fr: `- Le même genre de modèle, entraîné en plus sur des questions et des réponses (ici Llama 3.1 8B Instruct, la version assistant du modèle de base qu'on vient d'utiliser)
- **Faire :** même question qu'avant : cette fois il répond
- Il a aussi appris laquelle de deux réponses est préférée
- Garde-fous : il est entraîné à refuser certaines demandes
- **Faire :** montrer l'exemple de garde-fou (un vrai refus enregistré)
- Les refus s'apprennent, et l'apprentissage peut échouer : celui-ci refuse la question sur la bombe (enregistré) ; les grands assistants ajoutent bien plus d'entraînement à la sécurité et de filtres
- **Faire :** étape suivante : ce que le modèle lit vraiment : un message système caché, des balises de rôle, la question, puis « assistant : » et il continue
- C'est toujours prédire le mot suivant : il écrit la réponse, puis une balise de fin qui dit au logiciel de s'arrêter (ici « <|eot_id|> »)
- C'est cette étape qui fait un chatbot`,
    },
    transitionIn: { en: "From the base model to its assistant version.", fr: "Du modèle de base à sa version assistant." },
    transitionOut: { en: "But examples are not the only thing shaping it.", fr: "Mais les exemples ne sont pas les seuls à le façonner." },
    evidenceLevel: "none",
    sourceIds: ["fnd-instructgpt", "llm-llama31-models"],
    runtimeClass: "C",
    artifacts: ["recordings-next-token"],
    fallback: { kind: "recording", asset: "recordings-next-token" },
    durationSec: 180,
    optional: false,
  },
  {
    id: "02-shaping-assistant",
    steps: 3,
    chapter: "02",
    number: "2.19",
    title: { en: "How an assistant is shaped", fr: "Comment on façonne un assistant" },
    objective: {
      en: "Show the three layers that shape an assistant: example conversations, written rules, and classifiers around the model.",
      fr: "Montrer les trois couches qui façonnent un assistant : des conversations d'exemple, des règles écrites, et des classifieurs autour du modèle.",
    },
    takeaway: {
      en: "An assistant is a pretrained model, taught a style and written rules, and watched by classifiers.",
      fr: "Un assistant, c'est un modèle pré-entraîné, à qui l'on apprend un style et des règles écrites, et que des classifieurs surveillent.",
    },
    visual: {
      layout: "cards",
      heading: { en: "Three layers around the same model", fr: "Trois couches autour du même modèle" },
      cards: [
        {
          title: { en: "Example conversations", fr: "Des conversations d'exemple" },
          body: {
            en: "Thousands of questions and good answers teach it the style of an assistant.",
            fr: "Des milliers de questions et de bonnes réponses lui apprennent le style d'un assistant.",
          },
          sourceIds: ["fnd-instructgpt"],
        },
        {
          title: { en: "Written rules", fr: "Des règles écrites" },
          body: {
            en: "A \"constitution\" or \"model spec\" says what it must and must not do, for example: never help build chemical, biological or nuclear weapons.",
            fr: "Une « constitution » ou une « model spec » dit ce qu'il doit et ne doit pas faire, par exemple : ne jamais aider à fabriquer des armes chimiques, biologiques ou nucléaires.",
          },
          sourceIds: ["tk-openai-model-spec-2026", "tk-anthropic-constitution"],
        },
        {
          title: { en: "Classifiers around it", fr: "Des classifieurs autour" },
          body: {
            en: "Separate classifiers, like our football or basketball one, screen what goes in and what comes out, and block dangerous requests.",
            fr: "Des classifieurs à part, comme notre classifieur foot ou basket, examinent ce qui entre et ce qui sort, et bloquent les demandes dangereuses.",
          },
          sourceIds: ["fnd-anthropic-constitutional-classifiers"],
        },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Same pretrained model; three layers turn it into a product
- Layer 1, examples: questions and good answers, the assistant's style
- Layer 2, written rules: OpenAI's "Model Spec", Anthropic's "constitution"; the model is trained to follow them
- Example rule in both: no help creating chemical, biological, radiological or nuclear weapons
- Layer 3, classifiers: separate models, like our sports classifier, check the question and the answer and can block them
- **Ask:** which layer would you trust most? None alone is enough`,
      fr: `- Le même modèle pré-entraîné ; trois couches en font un produit
- Couche 1, les exemples : des questions et de bonnes réponses, le style de l'assistant
- Couche 2, des règles écrites : la « Model Spec » d'OpenAI, la « constitution » d'Anthropic ; le modèle est entraîné à les suivre
- Règle présente dans les deux : aucune aide pour créer des armes chimiques, biologiques, radiologiques ou nucléaires
- Couche 3, des classifieurs : des modèles à part, comme notre classifieur de sport, vérifient la question et la réponse et peuvent les bloquer
- **Question :** à quelle couche feriez-vous le plus confiance ? Aucune ne suffit seule`,
    },
    transitionIn: { en: "But examples are not the only thing shaping it.", fr: "Mais les exemples ne sont pas les seuls à le façonner." },
    transitionOut: { en: "Who builds these models?", fr: "Qui construit ces modèles ?" },
    evidenceLevel: "observed",
    sourceIds: ["fnd-instructgpt", "tk-openai-model-spec-2026", "tk-anthropic-constitution", "fnd-anthropic-constitutional-classifiers"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 120,
    optional: true,
  },
];
