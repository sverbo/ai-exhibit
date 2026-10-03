import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/** Chapter 05: what we can do, and the closing question. */
export const chapter05: SceneDefinition[] = [
  partOpener("05", "pact"),
  {
    id: "05-defense-in-depth",
    code: "swiss",
    steps: 7,
    chapter: "05",
    number: "5.1",
    title: { en: "Defense in depth", fr: "La défense en profondeur" },
    objective: {
      en: "Present safety as a stack of imperfect layers rather than one solution.",
      fr: "Présenter la sécurité comme un empilement de couches imparfaites plutôt qu'une solution unique.",
    },
    takeaway: {
      en: "No single layer is enough; protection comes from stacking imperfect ones.",
      fr: "Aucune couche ne suffit seule ; on se protège en empilant des couches imparfaites.",
    },
    visual: { layout: "component", component: "DefenseInDepth", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The Swiss cheese model from aviation and hospital safety: each slice is a protection, each slice has holes
- **Do:** bring in the layers: training (the rules and classifiers we saw), evaluations, interpretability, monitoring, sandboxes and permissions, laws and governance
- **Do:** send problems through: most are stopped by one layer or another
- Last step: sometimes the holes line up, as in the Hugging Face incident
- We don't look for a perfect layer; we stack several, and that is a choice societies can make`,
      fr: `- Le modèle du fromage suisse, venu de la sécurité aérienne et hospitalière : chaque tranche est une protection, chaque tranche a des trous
- **Faire :** faire apparaître les couches : l'entraînement (les règles et classifieurs vus plus tôt), les évaluations, l'interprétabilité, la surveillance, les bacs à sable et permissions, les lois et la gouvernance
- **Faire :** envoyer des problèmes : la plupart sont arrêtés par une couche ou une autre
- Dernière étape : parfois les trous s'alignent, comme dans l'incident Hugging Face
- On ne cherche pas la couche parfaite ; on en empile plusieurs, et c'est un choix que les sociétés peuvent faire`,
    },
    transitionIn: { en: "So what can we do? No single protection is enough.", fr: "Alors, que peut-on faire ? Aucune protection ne suffit seule." },
    transitionOut: { en: "One of those layers is the law. Where is regulation today?", fr: "L'une de ces couches, c'est la loi. Où en est la régulation ?" },
    evidenceLevel: "none",
    sourceIds: ["cg-reason-2000-swiss-cheese", "cg-iasr-2025-key-update-2"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "05-governance",
    code: "laws",
    steps: 7,
    chapter: "05",
    number: "5.2",
    title: { en: "Where is regulation today?", fr: "Où en est la régulation ?" },
    objective: {
      en: "Show where regulation stands today (a law, test labs, international science, company promises, rules keyed on compute), who outside governments pushes and pays for more safety, and how little it is next to the pace of the technology.",
      fr: "Montrer où en est la régulation (une loi, des laboratoires de test, une science internationale, des promesses d'entreprises, des règles fondées sur le calcul), qui hors des États pousse et paie pour plus de sûreté, et combien c'est peu face au rythme de la technologie.",
    },
    takeaway: {
      en: "Some rules exist, but most of what governs frontier AI today is voluntary.",
      fr: "Quelques règles existent, mais l'essentiel de ce qui encadre l'IA de pointe aujourd'hui est volontaire.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Where is regulation today?", fr: "Où en est la régulation ?" },
        cards: [
          {
            picture: "law",
            title: { en: "European Union", fr: "Union européenne" },
            line: {
              en: "A first broad AI law. Some parts apply, others were pushed back.",
              fr: "Une première grande loi sur l'IA. Certaines parties s'appliquent, d'autres ont été repoussées.",
            },
            evidence: "observed",
            sourceIds: ["cg-ec-ai-act", "sc-ec-2026-omnibus-in-force"],
          },
          {
            picture: "test-lab",
            flags: ["gb", "us"],
            title: { en: "Test labs", fr: "Des laboratoires de test" },
            line: {
              en: "Government institutes and non-profits test top models, ideally before release, when companies give access.",
              fr: "Des instituts publics et des ONG testent les grands modèles, idéalement avant leur sortie, quand les entreprises donnent accès.",
            },
            evidence: "observed",
            sourceIds: ["tk-uk-aisi-about", "tk-nist-caissi", "tk-metr-about", "tk-metr-2025-gpt5-predeployment", "tk-apollo-home"],
          },
          {
            picture: "summit",
            title: { en: "International", fr: "À l'international" },
            line: {
              en: "Summits, a shared science report, a UN scientific panel. Advice, not rules.",
              fr: "Des sommets, un rapport scientifique commun, un panel de l'ONU. Des avis, pas des règles.",
            },
            evidence: "observed",
            sourceIds: ["tk-iasr-about", "tk-un-panel-about"],
          },
          {
            picture: "promise",
            title: { en: "Promises", fr: "Des promesses" },
            line: {
              en: "Companies publish their own safety plans, mostly on a voluntary basis.",
              fr: "Les entreprises publient leurs propres plans de sécurité, surtout sur une base volontaire.",
            },
            evidence: "observed",
            sourceIds: ["tk-seoul-2024-frontier-commitments", "tk-california-2025-sb53"],
          },
          {
            picture: "chips",
            title: { en: "Govern the compute", fr: "Encadrer le calcul" },
            line: {
              en: "Chips can be counted; research aims to count their operations too.",
              fr: "Les puces se comptent ; des chercheurs veulent aussi compter leurs opérations.",
            },
            evidence: "observed",
            sourceIds: [
              "tk-bis-2022-export-controls",
              "tk-nl-2024-export-expansion",
              "tk-eu-ai-act-art51",
              "tk-fpf-2025-sb53-thresholds",
              "tk-chip-security-act-2025",
              "tk-ansari-2026-hardware-governance",
              "tk-petrie-2025-flexheg",
            ],
          },
        ],
        orgs: {
          label: { en: "Outside governments: campaigners and donors", fr: "Hors des États : militants et donateurs" },
          names: [
            "PauseAI",
            "ControlAI",
            "Future of Life Institute",
            "Center for AI Safety",
            "Coefficient Giving",
            "Survival and Flourishing Fund",
          ],
        },
        takeaway: {
          line: {
            en: "Some rules, a few test labs, many promises. Far less than the pace of the technology.",
            fr: "Quelques règles, quelques laboratoires de test, beaucoup de promesses. Bien moins que le rythme de la technologie.",
          },
          attribution: { en: "My assessment", fr: "Mon appréciation" },
        },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- **Do:** EU AI Act: in force since August 2024; bans and rules for big models apply; a July 2026 amendment pushed the high-risk rules to 2027 and 2028
- **Do:** test labs and science: the UK AI Security Institute and the US centre at NIST test models before release, by agreement with the companies; so do independent non-profits such as METR (GPT-5: access four weeks before launch, August 2025) and Apollo Research; ideally before release, but access depends on each company; the International AI Safety Report (over 100 experts, led by Yoshua Bengio) and the UN scientific panel (August 2025) assess the science and make no rules
- **Do:** promises: at Seoul (May 2024), 20 companies pledged safety frameworks, voluntarily; California's SB 53 (September 2025) now requires big labs to publish them; China has had rules for generative AI services since August 2023
- **Do:** compute: chips are physical and countable, so rules can key on them: US export controls since October 2022, Dutch licences for chipmaking machines (2023, 2024); the EU presumes "high impact capabilities" above 10^25 operations of training (AI Act, art. 51), California's SB 53 starts at 10^26
- Research and proposals, not yet real: H100 chips already count operations and power for performance tools, and a RAND analysis (2024) says these counters could be adapted; a 2025 proposal puts a tamper-proof "guarantee processor" next to each chip to enforce compute limits; a US bill (May 2025) would add location verification; reviews rate on-chip mechanisms low readiness, with no working prototype
- **Do:** campaigners: PauseAI (an international pause treaty), ControlAI and the Future of Life Institute (prohibit superintelligence until shown safe), the Center for AI Safety (extinction risk a global priority); the other way: the "Leading the Future" PACs, over $100 million, against strict rules (2025)
- Donors: Coefficient Giving (formerly Open Philanthropy) directed over $650 million in grants in 2024, of which about $64 million went to AI safety by an independent estimate: roughly a tenth (rough, our arithmetic on an estimate); all major AI safety funders together about $111 million (2024), against $109 billion of private AI investment in the US alone: about a thousandth. The last line is my assessment`,
      fr: `- **Faire :** AI Act européen : en vigueur depuis août 2024 ; les interdictions et les règles pour les grands modèles s'appliquent ; un amendement de juillet 2026 a repoussé les règles « haut risque » à 2027 et 2028
- **Faire :** laboratoires de test et science : l'AI Security Institute britannique et le centre américain du NIST testent les modèles avant leur sortie, par accord avec les entreprises ; des ONG indépendantes aussi, comme METR (GPT-5 : accès quatre semaines avant le lancement, août 2025) et Apollo Research ; idéalement avant la sortie, mais l'accès dépend de chaque entreprise ; le rapport international sur la sûreté de l'IA (plus de 100 experts, dirigé par Yoshua Bengio) et le panel scientifique de l'ONU (août 2025) évaluent la science et ne font pas de règles
- **Faire :** promesses : à Séoul (mai 2024), 20 entreprises se sont engagées à publier des cadres de sécurité, volontairement ; la loi californienne SB 53 (septembre 2025) l'impose désormais aux grands laboratoires ; la Chine encadre les services d'IA générative depuis août 2023
- **Faire :** le calcul : les puces sont physiques et se comptent, donc les règles peuvent s'y accrocher : contrôles américains à l'export depuis octobre 2022, licences néerlandaises pour les machines de fabrication (2023, 2024) ; l'UE présume des « capacités à fort impact » au-delà de 10^25 opérations d'entraînement (AI Act, art. 51), la loi californienne SB 53 commence à 10^26 
- Recherche et propositions, pas encore une réalité : les puces H100 comptent déjà opérations et consommation pour leurs outils de performance, et une analyse de RAND (2024) estime qu'on pourrait les adapter ; une proposition de 2025 place un « processeur de garantie » inviolable à côté de chaque puce pour faire respecter des limites de calcul ; un projet de loi américain (mai 2025) ajouterait une vérification de localisation ; les revues jugent ces mécanismes peu mûrs, sans prototype fonctionnel
- **Faire :** les militants : PauseAI (un traité international de pause), ControlAI et le Future of Life Institute (interdire la superintelligence tant qu'elle n'est pas prouvée sûre), le Center for AI Safety (le risque d'extinction, priorité mondiale) ; dans l'autre sens : les comités « Leading the Future », plus de 100 millions de dollars, contre des règles strictes (2025)
- Les donateurs : Coefficient Giving (ex-Open Philanthropy) a distribué plus de 650 millions de dollars de subventions en 2024, dont environ 64 millions pour la sûreté de l'IA selon une estimation indépendante : à peu près un dixième (calcul approximatif de notre part sur une estimation) ; tous les grands financeurs de la sûreté de l'IA réunis, environ 111 millions (2024), face à 109 milliards d'investissement privé dans l'IA aux États-Unis seuls : environ un millième. La dernière phrase est mon appréciation`,
    },
    transitionIn: { en: "Laws and governance are one of those layers. Where is regulation today?", fr: "Les lois et la gouvernance sont l'une de ces couches. Où en est la régulation ?" },
    transitionOut: { en: "Which leaves the real question.", fr: "Ce qui laisse la vraie question." },
    evidenceLevel: "observed",
    sourceIds: [
      "cg-ec-ai-act",
      "sc-ec-2026-omnibus-in-force",
      "tk-uk-aisi-about",
      "tk-nist-caissi",
      "tk-metr-about",
      "tk-metr-2025-gpt5-predeployment",
      "tk-apollo-home",
      "tk-iasr-about",
      "tk-un-panel-about",
      "tk-seoul-2024-frontier-commitments",
      "tk-california-2025-sb53",
      "tk-bis-2022-export-controls",
      "tk-nl-2024-export-expansion",
      "tk-chip-security-act-2025",
      "tk-eu-ai-act-art51",
      "tk-fpf-2025-sb53-thresholds",
      "tk-ansari-2026-hardware-governance",
      "tk-petrie-2025-flexheg",
      "tk-ogara-2025-hardware-mechanisms",
      "cg-china-2023-genai-measures",
      "tk-pauseai-proposal",
      "tk-controlai-home",
      "tk-fli-superintelligence-statement",
      "tk-cais-statement-ai-risk",
      "tk-techcrunch-2025-leading-the-future",
      "tk-mcaleese-2025-ai-safety-funding",
      "tk-coefficient-giving-wiki",
      "tk-stanford-2025-ai-index",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "Name the organisations neutrally, as examples of campaigners and donors outside governments, never as endorsements; mention the groups pushing the other way. Funding totals are estimates: say so. Say every date out loud from the notes.",
  },
  {
    id: "05-closing-question",
    code: "close",
    chapter: "05",
    number: "5.3",
    title: { en: "Closing question", fr: "La question de clôture" },
    objective: {
      en: "Open the discussion on who should decide how these systems are built and deployed, without prescribing an answer.",
      fr: "Ouvrir la discussion sur qui devrait décider de la manière dont ces systèmes sont construits et déployés, sans prescrire de réponse.",
    },
    takeaway: {
      en: "The answer is not technical; it belongs to all of us.",
      fr: "La réponse n'est pas technique ; elle nous appartient à tous.",
    },
    visual: {
      layout: "question",
      question: {
        en: "Who should decide how these systems are built and deployed?",
        fr: "Qui devrait décider de la manière dont ces systèmes sont construits et déployés ?",
      },
    },
    interaction: "none",
    speakerNotes: {
      en: `- Read the question slowly, then leave it on screen
- Companies? Governments? International bodies? Experts? Citizens?
- Each answer has strengths and weaknesses; I won't pick one
- My job today: give you something to think with
- Thank you; over to your questions`,
      fr: `- Lire la question lentement, puis la laisser à l'écran
- Les entreprises ? Les gouvernements ? Des organismes internationaux ? Les experts ? Les citoyens ?
- Chaque réponse a ses forces et ses faiblesses ; je ne choisis pas
- Mon rôle aujourd'hui : vous donner de quoi y réfléchir
- Merci ; place à vos questions`,
    },
    transitionIn: { en: "From the story told to the question left open.", fr: "De l'histoire racontée à la question laissée ouverte." },
    transitionOut: { en: "Before your questions, where to go further.", fr: "Avant vos questions, où aller plus loin." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static question." },
    durationSec: 90,
    optional: false,
    localizationNotes: "List the candidate deciders neutrally and in a locally meaningful order; never add a recommended answer.",
  },
  {
    id: "05-resources",
    code: "more",
    steps: 0,
    chapter: "05",
    number: "5.4",
    title: { en: "Resources", fr: "Pour aller plus loin" },
    objective: {
      en: "Leave the room with a few places to keep learning, the same list as on the audience glossary page.",
      fr: "Laisser à la salle quelques pistes pour continuer à apprendre, la même liste que sur la page lexique du public.",
    },
    takeaway: {
      en: "The talk ends here; the learning does not have to.",
      fr: "La conférence s'arrête ici ; l'apprentissage, pas forcément.",
    },
    visual: { layout: "component", component: "ResourceList", props: {} },
    interaction: "none",
    speakerNotes: {
      en: `- Leave this up during questions
- Pointers, not endorsements: a video channel, a free course, and a petition by PauseAI for those who want to act
- The QR code opens the glossary on their phones, with the same links under Resources`,
      fr: `- Laisser affiché pendant les questions
- Des pistes, pas des recommandations : une chaîne vidéo, un cours gratuit, et une pétition de PauseAI pour ceux qui veulent agir
- Le QR code ouvre le lexique sur leur téléphone, avec les mêmes liens dans la rubrique Ressources`,
    },
    transitionIn: { en: "For those who want to go further.", fr: "Pour ceux qui veulent aller plus loin." },
    transitionOut: { en: "Thank you.", fr: "Merci." },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static list read from content/glossary/resources.ts." },
    durationSec: 30,
    optional: false,
    localizationNotes: "Titles stay as their publishers write them. Name the petition as a petition by PauseAI, without recommending it.",
  },
];
