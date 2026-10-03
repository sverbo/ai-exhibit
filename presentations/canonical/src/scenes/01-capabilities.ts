import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { agendaItems, partOpener } from "../chapters.ts";

/**
 * Introduction (agenda and framing, 0.1 and 0.2, chapter "00"), then chapter 01:
 * what AI can do today, opened by its part slide (1.0).
 * Answers first, then agents acting on our behalf, then what it took to build them.
 */
export const chapter01: SceneDefinition[] = [
  {
    id: "00-agenda",
    code: "agnd",
    chapter: "00",
    number: "0.1",
    title: { en: "Today", fr: "Aujourd'hui" },
    objective: {
      en: "Welcome the room and show the five parts of the talk.",
      fr: "Accueillir la salle et montrer les cinq parties de la conférence.",
    },
    takeaway: {
      en: "Five parts: what AI can do, its history and how it works, who builds it, the risks, what we can do.",
      fr: "Cinq parties : ce que l'IA sait faire, son histoire et comment ça marche, qui la construit, les risques, ce qu'on peut faire.",
    },
    visual: {
      layout: "component",
      component: "Agenda",
      props: {
        heading: { en: "Today", fr: "Aujourd'hui" },
        items: agendaItems,
      },
    },
    // One part per click, as with the list it replaced (0 shows them all at once).
    steps: 5,
    interaction: "presenter",
    speakerNotes: {
      en: `- Welcome, who I am, why this talk
- **Do:** five parts, one per click
- First what it does, then how, then who builds it
- Then the risks, and what we can do about them
- Questions at the end`,
      fr: `- Bienvenue, qui je suis, pourquoi cette conférence
- **Faire :** cinq parties, une par clic
- D'abord ce qu'elle fait, puis comment, puis qui la construit
- Ensuite les risques, et ce qu'on peut y faire
- Les questions à la fin`,
    },
    transitionIn: { en: "The talk opens on its plan.", fr: "La conférence s'ouvre sur son plan." },
    transitionOut: { en: "And two things this talk is not.", fr: "Et deux choses que cette conférence n'est pas." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static list." },
    durationSec: 45,
    optional: false,
    localizationNotes: "Items come from the chapter titles in chapters.ts.",
  },
  {
    id: "00-not-this",
    code: "isnt",
    chapter: "00",
    number: "0.2",
    title: { en: "What this talk is not", fr: "Ce que cette conférence n'est pas" },
    objective: {
      en: "Set expectations: no tool tutorial, no environmental assessment, and why today's focus is capabilities and risks.",
      fr: "Cadrer les attentes : pas de tutoriel d'outils, pas de bilan environnemental, et pourquoi le sujet d'aujourd'hui porte sur les capacités et les risques.",
    },
    takeaway: {
      en: "Today is about what AI can do and what is at stake, not how to use a tool.",
      fr: "Aujourd'hui, il s'agit de ce que l'IA sait faire et de ce qui est en jeu, pas de comment utiliser un outil.",
    },
    visual: {
      layout: "cards",
      heading: { en: "What this talk is not", fr: "Ce que cette conférence n'est pas" },
      cards: [
        {
          title: { en: "Not a tutorial on AI tools", fr: "Pas un tutoriel d'outils d'IA" },
          body: {
            en: "Tools change every month. Know what is possible; then ask your assistant for the rest.",
            fr: "Les outils changent chaque mois. Sachez ce qui est possible ; demandez le reste à votre assistant.",
          },
        },
        {
          title: { en: "Not about the environment", fr: "Pas sur l'environnement" },
          body: {
            en: "It matters, but it is another talk. One hour of video streaming uses about as much energy as 250 chatbot questions.",
            fr: "C'est important, mais c'est une autre conférence. Une heure de vidéo en streaming consomme à peu près autant que 250 questions à un chatbot.",
          },
          evidence: "contested",
          sourceIds: ["tk-epoch-2025-chatgpt-energy", "tk-iea-2020-streaming", "sc-iea-2025-energy-ai"],
        },
        {
          title: { en: "Today's focus", fr: "Le sujet d'aujourd'hui" },
          body: {
            en: "\"Mitigating the risk of extinction from AI should be a global priority.\" (AI researchers and lab leaders, 2023)",
            fr: "« Réduire le risque d'extinction lié à l'IA devrait être une priorité mondiale. » (chercheurs et dirigeants de laboratoires d'IA, 2023)",
          },
          evidence: "contested",
          sourceIds: ["tk-cais-statement-ai-risk", "tk-cais-2023-press-release"],
        },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Not a tutorial: tool setup goes out of date fast, and tools keep adding layers on top
- What lasts: knowing what is possible; then ask your assistant how
- Not about the environment: it matters, it is another talk
- To calibrate: one query about 0.3 Wh, one hour of streaming about 77 Wh, so roughly 250 queries (long or reasoning queries cost far more)
- Data centres: about 1.5% of world electricity in 2024 (IEA)
- 2023: Hinton, Bengio and AI lab leaders signed: extinction risk from AI, a priority alongside pandemics and nuclear war
- My own view, not a consensus: for many experts, AI risk is an order of magnitude more pressing than the environment`,
      fr: `- Pas un tutoriel : les réglages d'outils se périment vite, et les outils ajoutent sans cesse des couches
- Ce qui dure : savoir ce qui est possible ; ensuite, demander à son assistant comment faire
- Pas sur l'environnement : c'est important, c'est une autre conférence
- Pour se situer : une requête environ 0,3 Wh, une heure de streaming environ 77 Wh, soit à peu près 250 requêtes (les requêtes longues ou de raisonnement coûtent bien plus)
- Centres de données : environ 1,5 % de l'électricité mondiale en 2024 (AIE)
- 2023 : Hinton, Bengio et des dirigeants de laboratoires d'IA signent : le risque d'extinction lié à l'IA, une priorité au même titre que les pandémies et la guerre nucléaire
- Mon avis, pas un consensus : pour beaucoup d'experts, le risque de l'IA est d'un ordre de grandeur plus pressant que l'environnement`,
    },
    transitionIn: { en: "From the plan to what is not in it.", fr: "Du plan à ce qui n'y est pas." },
    transitionOut: { en: "So, what can AI do today?", fr: "Alors, que sait faire l'IA aujourd'hui ?" },
    evidenceLevel: "contested",
    sourceIds: [
      "tk-epoch-2025-chatgpt-energy",
      "tk-iea-2020-streaming",
      "sc-iea-2025-energy-ai",
      "tk-cais-statement-ai-risk",
      "tk-cais-2023-press-release",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static cards." },
    durationSec: 90,
    optional: true,
    localizationNotes: "The French quote translates the CAIS statement; the original is in English. Say clearly that the order-of-magnitude comparison is the presenter's opinion.",
  },
  partOpener("01", "pcap"),
  {
    id: "01-opening",
    code: "open",
    chapter: "01",
    number: "1.1",
    title: { en: "Opening", fr: "Ouverture" },
    objective: {
      en: "Set the question of the first chapter: what AI can actually do today.",
      fr: "Poser la question du premier chapitre : ce que l'IA sait vraiment faire aujourd'hui.",
    },
    takeaway: {
      en: "Before explaining how it works, let's look at what it does.",
      fr: "Avant d'expliquer comment ça marche, regardons ce que ça fait.",
    },
    visual: {
      layout: "title",
      heading: { en: "What can AI do today?", fr: "Que sait faire l'IA aujourd'hui ?" },
    },
    interaction: "none",
    speakerNotes: {
      en: `- Everyone has an opinion on AI, often formed a few years ago
- **Ask:** who has used a chatbot this week?
- Let's test your picture with a few trick questions`,
      fr: `- Tout le monde a un avis sur l'IA, souvent formé il y a quelques années
- **Question :** qui a utilisé un chatbot cette semaine ?
- Testons votre image avec quelques questions pièges`,
    },
    transitionIn: { en: "From what this talk is not to the first question.", fr: "De ce que la conférence n'est pas à la première question." },
    transitionOut: {
      en: "Let's start with a few trick questions.",
      fr: "Commençons par quelques questions pièges.",
    },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static title." },
    durationSec: 30,
    optional: false,
  },
  {
    id: "01-then-and-now",
    code: "then",
    steps: 5,
    chapter: "01",
    number: "1.2",
    title: { en: "Then and now", fr: "Avant et maintenant" },
    objective: {
      en: "Show that trick questions which fooled early language models are now answered correctly.",
      fr: "Montrer que des questions pièges qui trompaient les premiers modèles de langage sont aujourd'hui bien résolues.",
    },
    takeaway: {
      en: "The tricks that used to fool AI mostly no longer work.",
      fr: "Les pièges qui trompaient l'IA ne marchent pour la plupart plus.",
    },
    visual: { layout: "component", component: "ThenAndNow", props: { variant: "game" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- A famous riddle: "When ten plus four is two, what is nine plus six?"
- **Ask:** the room answers first (answer: 3, on a clock)
- **Do:** click through the published answers: GPT-2 (2019), GPT-3 (2020), GPT-3.5 (2022): all wrong
- **Do:** GPT-4 (2023) gets it; note the training cost climbing, from about $4.6k to about $50m
- **Do:** last click, today's reasoning model, recorded answer with name and date
- Other questions (letters in a word, 9.11 vs 9.9, Sally's sisters): same pattern`,
      fr: `- Une énigme connue : « Si dix plus quatre font deux, combien font neuf plus six ? »
- **Question :** la salle répond d'abord (réponse : 3, sur une horloge)
- **Faire :** cliquer les réponses publiées : GPT-2 (2019), GPT-3 (2020), GPT-3.5 (2022) : toutes fausses
- **Faire :** GPT-4 (2023) trouve ; le coût d'entraînement grimpe, d'environ 4 600 $ à environ 50 M$
- **Faire :** dernier clic, un modèle de raisonnement actuel, réponse enregistrée avec son nom et sa date
- Les autres questions (lettres d'un mot, 9,11 contre 9,9, les sœurs de Sally) : même schéma`,
    },
    transitionIn: {
      en: "From the question to a quick test.",
      fr: "De la question à un petit test.",
    },
    transitionOut: { en: "Not just this riddle: everything is going up.", fr: "Pas seulement cette énigme : tout est en train de monter." },
    evidenceLevel: "observed",
    sourceIds: ["tk-aidigest-2023-progress", "tk-hagendorff-2022-crt", "tk-berglund-2023-reversal-curse", "llm-gpt2-paper"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "recording", asset: "then-and-now/gpt2-answers.json" },
    durationSec: 240,
    optional: false,
    localizationNotes:
      "GPT-2 is always asked in English (it learned from English web text); the French edition shows the question in French and GPT-2's English answer as quoted output.",
    todo: [
      "Do not say a specific named model failed a given question unless content/assets/then-and-now/questions.ts marks that history note as verified.",
    ],
  },
  {
    id: "01-model-comparison",
    code: "side",
    steps: 4,
    chapter: "01",
    number: "1.3",
    title: { en: "Then and now, side by side", fr: "Avant et maintenant, côte à côte" },
    objective: {
      en: "Compare a 2019 model, a 2020 model and a current frontier model on cost, electricity, reliability, skill and memory.",
      fr: "Comparer un modèle de 2019, un de 2020 et un modèle de pointe actuel sur le coût, l'électricité, la fiabilité, les compétences et la mémoire.",
    },
    takeaway: {
      en: "In six years, everything grew by orders of magnitude: the cost, the power, and what the models can do.",
      fr: "En six ans, tout a grandi de plusieurs ordres de grandeur : le coût, l'énergie, et ce que les modèles savent faire.",
    },
    visual: { layout: "component", component: "ModelComparison", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- One row per click: GPT-2 (2019), GPT-3 (2020), then Grok 3 (2025), the recent frontier model with the most published estimates
- Cost to train: from a few thousand dollars to about $200 million (estimates)
- Electricity: GPT-3 about 1.3 GWh; Grok 3 about 240 GWh, the yearly use of tens of thousands of homes (estimates)
- Reliability: the length of task an agent finishes half the time, from seconds to hours on today's models; skill: PhD-level science questions now above the experts' score
- Memory: from about a page and a half to about 1,500 pages
- How we know, GPT-2 electricity (1.7 MWh, labelled "calculated"): nobody published it, so we computed it: 168 hours × 32 TPU v3 chips (Strubell et al., second-hand from the authors) × 283 W per chip × 1.10 for the datacenter (Patterson et al.) ≈ 1.7 MWh, about two months of one US home. An order of magnitude only: the real figure may be a few times higher
- How we know, GPT-2 science (25%): not a GPT-2 score. GPT-2 was never tested on GPQA; with four answer choices, guessing scores 25%
- How we know, GPT-3 science (30%): measured by the test's authors on GPT-3.5, the 2023 successor (Rein et al.: 29.6%), barely above guessing; the original GPT-3 was never tested
- How we know, Grok 3 reliability (1 hour): METR never measured Grok 3; the best model METR measured from the same months is Claude 3.7 Sonnet (February 2025), about 60 minutes
- **Do:** last click, "grew by": tens of thousands of times more expensive. Training concentrates enormous power in one place; across all use, running the models now uses even more
- **Do:** last row, a projection for about a year from now, from published trends: over $1 billion to train, about 1,000 GWh, tasks of about two weeks of human work; trends, not promises`,
      fr: `- Une ligne par clic : GPT-2 (2019), GPT-3 (2020), puis Grok 3 (2025), le modèle de pointe récent avec le plus d'estimations publiées
- Coût d'entraînement : de quelques milliers de dollars à environ 200 millions (estimations)
- Électricité : GPT-3 environ 1,3 GWh ; Grok 3 environ 240 GWh, la consommation annuelle de dizaines de milliers de foyers (estimations)
- Fiabilité : la durée des tâches qu'un agent réussit une fois sur deux, de quelques secondes à des heures pour les modèles actuels ; compétences : questions de science niveau doctorat, désormais au-dessus du score des experts
- Mémoire : d'environ une page et demie à environ 1 500 pages
- D'où ça vient, électricité de GPT-2 (1,7 MWh, marqué « calculé ») : personne ne l'a publiée, on l'a calculée : 168 heures × 32 puces TPU v3 (Strubell et al., rapporté par les auteurs) × 283 W par puce × 1,10 pour le centre de données (Patterson et al.) ≈ 1,7 MWh, environ deux mois d'un foyer américain. Un ordre de grandeur seulement : le vrai chiffre peut être quelques fois plus élevé
- D'où ça vient, sciences de GPT-2 (25 %) : ce n'est pas un score de GPT-2. GPT-2 n'a jamais passé GPQA ; avec quatre réponses possibles, répondre au hasard donne 25 %
- D'où ça vient, sciences de GPT-3 (30 %) : mesuré par les auteurs du test sur GPT-3.5, son successeur de 2023 (Rein et al. : 29,6 %), à peine mieux que le hasard ; le GPT-3 d'origine n'a jamais été testé
- D'où ça vient, fiabilité de Grok 3 (1 heure) : METR n'a jamais mesuré Grok 3 ; le meilleur modèle mesuré par METR sur les mêmes mois est Claude 3.7 Sonnet (février 2025), environ 60 minutes
- **Faire :** dernier clic, « a grandi de » : des dizaines de milliers de fois plus cher. L'entraînement concentre une énergie énorme en un seul lieu ; sur l'ensemble des usages, faire tourner les modèles consomme encore plus
- **Faire :** dernière ligne, une projection à environ un an, d'après les tendances publiées : plus d'un milliard de dollars d'entraînement, environ 1 000 GWh, des tâches d'environ deux semaines de travail humain ; des tendances, pas des promesses`,
    },
    transitionIn: { en: "Not just one riddle: everything grew.", fr: "Pas seulement une énigme : tout a grandi." },
    transitionOut: { en: "So what is all this for? Not just answering: acting.", fr: "Tout ça pour quoi faire ? Pas seulement répondre : agir." },
    evidenceLevel: "evaluation",
    sourceIds: [
      "tk-epoch-notable-models",
      "tk-epoch-2024-power-trend",
      "tk-epoch-2024-training-cost-trend",
      "tk-xai-2025-grok3",
      "llm-patterson-2021",
      "llm-patterson-2022",
      "tk-metr-2026-time-horizon-1-1",
      "tk-rein-2023-gpqa",
      "tk-rein-2023-gpqa-baselines",
      "tk-strubell-2019-gpt2-hardware",
      "tk-patterson-2021-tpu-v3-power",
      "tk-metr-early-2025-best",
      "tk-gpt2-context-1024",
      "tk-gpt3-context-2048",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 150,
    optional: false,
  },
  {
    id: "01-connected",
    code: "conn",
    steps: 7,
    chapter: "01",
    number: "1.4",
    title: { en: "Connected to your life", fr: "Branché sur votre vie" },
    objective: {
      en: "Show that today's assistants can be connected to email, calendar, files, the browser, payments and code.",
      fr: "Montrer que les assistants actuels peuvent être branchés sur les mails, l'agenda, les fichiers, le navigateur, les paiements et le code.",
    },
    takeaway: {
      en: "An assistant is no longer a chat window: it plugs into the tools of your daily life.",
      fr: "Un assistant n'est plus une fenêtre de discussion : il se branche sur les outils de votre quotidien.",
    },
    visual: { layout: "component", component: "ConnectedAssistant", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The assistant sits in the middle; connectors appear one by one
- Email and calendar: read, draft, schedule
- Files: search and summarize your documents
- Browser: it clicks and fills forms on websites
- Shopping and payments: protocols now exist for agents to pay
- Code: it writes and runs programs`,
      fr: `- L'assistant au centre ; les connecteurs apparaissent un par un
- Mails et agenda : lire, rédiger, planifier
- Fichiers : chercher et résumer vos documents
- Navigateur : il clique et remplit des formulaires sur des sites
- Achats et paiements : des protocoles existent pour que des agents paient
- Code : il écrit et lance des programmes`,
    },
    transitionIn: { en: "From answering to acting.", fr: "De répondre à agir." },
    transitionOut: {
      en: "Connected, yes. But allowed to do what?",
      fr: "Branché, oui. Mais autorisé à faire quoi ?",
    },
    evidenceLevel: "observed",
    sourceIds: [
      "fnd-chatgpt-agent-system-card",
      "fnd-claude-for-chrome",
      "fnd-claude-computer-use-docs",
      "fnd-claude-code-docs",
      "fnd-google-ap2",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "01-permissions",
    code: "perm",
    steps: 5,
    chapter: "01",
    number: "1.5",
    title: { en: "Permissions", fr: "Les permissions" },
    objective: {
      en: "Show that what an assistant can do depends on what we allow it to touch, up to spending money.",
      fr: "Montrer que ce qu'un assistant peut faire dépend de ce qu'on l'autorise à toucher, jusqu'à dépenser de l'argent.",
    },
    takeaway: {
      en: "The same model has very different power depending on what we let it touch.",
      fr: "Le même modèle n'a pas la même puissance selon ce qu'on l'autorise à toucher.",
    },
    visual: { layout: "component", component: "PermissionsBoard", props: { mode: "permissions" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Same model; only its permissions change
- **Do:** flip the switches: read files, write files, terminal, browser, money
- Each switch turns advice into action
- Money is real: published tools already let agents make transfers
- **Ask:** which switch would make you hesitate on your own computer?`,
      fr: `- Même modèle ; seules ses permissions changent
- **Faire :** activer les interrupteurs : lire, écrire, terminal, navigateur, argent
- Chaque interrupteur transforme un conseil en action
- L'argent, c'est réel : des outils publiés permettent déjà à des agents de faire des virements
- **Question :** quel interrupteur vous ferait hésiter sur votre propre ordinateur ?`,
    },
    transitionIn: {
      en: "The connections exist; what matters is what we switch on.",
      fr: "Les connexions existent ; ce qui compte, c'est ce qu'on active.",
    },
    transitionOut: {
      en: "Here is what it looks like when I switch them on myself.",
      fr: "Voici ce que ça donne quand je les active moi-même.",
    },
    evidenceLevel: "observed",
    sourceIds: ["fm-aisi-trends-2025-agents-finance"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "01-personal-demo",
    code: "demo",
    steps: 1,
    chapter: "01",
    number: "1.6",
    title: { en: "My own demo", fr: "Ma propre démo" },
    objective: {
      en: "Show a real task the presenter gave an AI assistant, recorded on screen.",
      fr: "Montrer une vraie tâche confiée par le présentateur à un assistant, enregistrée à l'écran.",
    },
    takeaway: {
      en: "This is not a lab demo: it is an ordinary person's ordinary use.",
      fr: "Ce n'est pas une démo de laboratoire : c'est un usage ordinaire, par une personne ordinaire.",
    },
    visual: { layout: "component", component: "VideoScene", props: { src: "personal-demo.mp4" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- What I asked, in one sentence
- Which product and model, and when I recorded it
- **Do:** play; pause where it acts on its own
- Point at the moment it asks before acting
- What it got wrong, if anything`,
      fr: `- Ce que je lui ai demandé, en une phrase
- Quel produit, quel modèle, et quand je l'ai enregistré
- **Faire :** lancer ; mettre en pause quand il agit seul
- Montrer le moment où il demande avant d'agir
- Ce qu'il a raté, s'il a raté quelque chose`,
    },
    transitionIn: {
      en: "From the switches to a real run.",
      fr: "Des interrupteurs à un vrai essai.",
    },
    transitionOut: {
      en: "Let's slow one request down and look at every step.",
      fr: "Ralentissons une demande et regardons chaque étape.",
    },
    evidenceLevel: "observed",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    todo: [
      "Record the demo and put it at content/assets/media/personal-demo.mp4; note the product, model and recording date in the notes.",
      "Set durationSec to the video length plus about 30 seconds once recorded.",
    ],
  },
  {
    id: "01-tool-call",
    code: "tool",
    steps: 5,
    chapter: "01",
    number: "1.7",
    title: { en: "Chat or agent: calling a tool", fr: "Chat ou agent : appeler un outil" },
    objective: {
      en: "Show, with real JSON, that a model only writes text and the software around it runs the tools.",
      fr: "Montrer, avec du vrai JSON, qu'un modèle ne fait qu'écrire du texte et que le logiciel autour exécute les outils.",
    },
    takeaway: {
      en: "The model writes a request in a precise format; the software does the action and reports back.",
      fr: "Le modèle écrit une demande dans un format précis ; le logiciel fait l'action et lui rend le résultat.",
    },
    visual: { layout: "component", component: "ToolCallDemo", props: { scenario: "search" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Same question on both sides: who won last night's match? (illustrative)
- **Do:** step 1, the chatbot alone: it cannot know, its knowledge stops at training
- **Do:** step 2, the agent side: the software tells the model it has a web_search tool
- **Do:** step 3, the model does not answer: it writes a tool call, in JSON
- Key point: the model only writes text; the software reads it and runs the search
- **Do:** steps 4 and 5, the results come back, then an answer that cites them
- Everything an agent does is this, repeated`,
      fr: `- Même question des deux côtés : qui a gagné le match d'hier soir ? (exemple illustratif)
- **Faire :** étape 1, le chatbot seul : il ne peut pas savoir, ses connaissances s'arrêtent à l'entraînement
- **Faire :** étape 2, côté agent : le logiciel dit au modèle qu'il dispose d'un outil web_search
- **Faire :** étape 3, le modèle ne répond pas : il écrit un appel d'outil, en JSON
- Point clé : le modèle n'écrit que du texte ; le logiciel le lit et lance la recherche
- **Faire :** étapes 4 et 5, les résultats reviennent, puis une réponse qui les cite
- Tout ce que fait un agent, c'est ceci, répété`,
    },
    transitionIn: {
      en: "Before a complex request, one single tool call.",
      fr: "Avant une demande complexe, un seul appel d'outil.",
    },
    transitionOut: {
      en: "Now chain dozens of these.",
      fr: "Maintenant, enchaînons-en des dizaines.",
    },
    evidenceLevel: "none",
    sourceIds: ["fnd-claude-tool-use-docs"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 150,
    optional: false,
    localizationNotes: "JSON keys stay in English in every edition: they are the real format.",
  },
  {
    id: "01-one-request",
    code: "steps",
    steps: 15,
    chapter: "01",
    number: "1.8",
    title: { en: "One request, every step", fr: "Une demande, chaque étape" },
    objective: {
      en: "Make every step of one complex request visible: tool calls, sub-agents in parallel, merged results, a human approval before paying.",
      fr: "Rendre visible chaque étape d'une demande complexe : appels d'outils, sous-agents en parallèle, résultats fusionnés, accord humain avant de payer.",
    },
    takeaway: {
      en: "Behind one sentence, an agent runs many small steps, and can stop to ask you.",
      fr: "Derrière une seule phrase, un agent enchaîne beaucoup de petites étapes, et peut s'arrêter pour vous demander.",
    },
    visual: { layout: "component", component: "AgentRunExplainer", props: { scenario: "weekend-trip" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Illustrative, not a recording: say so
- One sentence: plan a weekend trip
- An orchestrator splits the job into tasks
- Tool calls: weather, calendar, maps, search, email
- Sub-agents work in parallel, results are merged
- **Do:** stop at the approval gate: nothing is paid without a yes`,
      fr: `- Illustration, pas un enregistrement : le dire
- Une phrase : organiser un week-end
- Un orchestrateur découpe le travail en tâches
- Appels d'outils : météo, agenda, cartes, recherche, mail
- Des sous-agents travaillent en parallèle, les résultats sont fusionnés
- **Faire :** s'arrêter à la validation : rien n'est payé sans un oui`,
    },
    transitionIn: {
      en: "From a real run to a slowed-down one.",
      fr: "D'un vrai essai à un essai au ralenti.",
    },
    transitionOut: {
      en: "All these steps follow one simple pattern.",
      fr: "Toutes ces étapes suivent un schéma simple.",
    },
    evidenceLevel: "thought-experiment",
    sourceIds: ["fm-anthropic-building-agents-2024", "fnd-chatgpt-agent-system-card"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 195,
    optional: false,
  },
  {
    id: "01-agent-loop",
    code: "loop",
    steps: 5,
    chapter: "01",
    number: "1.9",
    title: { en: "The agent loop", fr: "La boucle d'agent" },
    objective: {
      en: "Name the pattern: an agent is a model in a loop of goal, plan, act, observe, re-plan.",
      fr: "Nommer le schéma : un agent, c'est un modèle dans une boucle objectif, plan, action, observation, nouveau plan.",
    },
    takeaway: {
      en: "An agent is a model placed in a loop, with tools and memory.",
      fr: "Un agent, c'est un modèle placé dans une boucle, avec des outils et une mémoire.",
    },
    visual: { layout: "component", component: "AgentLoop", props: { variant: "intro" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Goal, plan, act, observe, plan again
- In the middle: a language model, like a chatbot
- Around it: ordinary software, tools and a memory
- It goes round until the goal is met or it asks you`,
      fr: `- Objectif, plan, action, observation, nouveau plan
- Au centre : un modèle de langage, comme un chatbot
- Autour : du logiciel ordinaire, des outils et une mémoire
- La boucle tourne jusqu'au but, ou jusqu'à ce qu'il vous demande`,
    },
    transitionIn: {
      en: "From one example to the general pattern.",
      fr: "D'un exemple au schéma général.",
    },
    transitionOut: { en: "So what is inside? Let us open the box.", fr: "Alors, qu'y a-t-il dedans ? Ouvrons la boîte." },
    evidenceLevel: "none",
    sourceIds: ["fnd-claude-tool-use-docs", "fm-anthropic-building-agents-2024"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
    localizationNotes: "Loop labels come from the AgentLoop component strings; say them with the same words.",
  },
];
