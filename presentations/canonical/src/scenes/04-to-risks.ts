import type { SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/**
 * Chapter 04: the risks. Every scene shows pictures and one short line per
 * idea (PictureCards, IncidentStory, IntelligenceScale, GoalVsOutcome); figures,
 * dates and names live in the speaker notes.
 */
export const chapter04: SceneDefinition[] = [
  partOpener("04", "prisk"),
  {
    id: "04-already-here",
    code: "here",
    steps: 4,
    chapter: "04",
    number: "4.1",
    title: { en: "Already here", fr: "Déjà là" },
    objective: {
      en: "Land the presenter's conviction: the technology can already more or less replace human expertise, and the rest is adaptation.",
      fr: "Faire passer la conviction du présentateur : la technologie peut déjà plus ou moins remplacer l'expertise humaine, et le reste est une question d'adaptation.",
    },
    takeaway: {
      en: "Even without further progress, what exists today is enough to change most expert work.",
      fr: "Même sans nouveau progrès, ce qui existe aujourd'hui suffit à transformer l'essentiel du travail d'expert.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: {
          en: "Even if AI stopped improving today, it could already do most expert work.",
          fr: "Même si l'IA cessait de progresser aujourd'hui, elle saurait déjà faire l'essentiel du travail d'expert.",
        },
        cards: [
          {
            picture: "code",
            title: { en: "Code", fr: "Le code" },
            line: {
              en: "Most new code at Google is written by AI, then checked by engineers.",
              fr: "Chez Google, l'essentiel du nouveau code est écrit par l'IA, puis vérifié par des ingénieurs.",
            },
            evidence: "observed",
            sourceIds: ["tk-google-2026-next-code"],
          },
          {
            picture: "car",
            title: { en: "Driving", fr: "La conduite" },
            line: {
              en: "Taxis with nobody at the wheel carry paying riders every week.",
              fr: "Des taxis sans personne au volant transportent des clients chaque semaine.",
            },
            evidence: "observed",
            sourceIds: ["tk-waymo-2026-weekly-rides"],
          },
          {
            picture: "runner",
            title: { en: "Robots", fr: "Les robots" },
            line: {
              en: "Humanoid robots ran a half-marathon in Beijing. Next: anything made for two hands.",
              fr: "Des robots humanoïdes ont couru un semi-marathon à Pékin. Ensuite : tout ce qui est fait pour deux mains.",
            },
            evidence: "projection",
            sourceIds: ["tk-beijing-2025-robot-half-marathon", "tk-figure-2025-bmw"],
          },
          {
            picture: "math",
            title: { en: "Mathematics", fr: "Les mathématiques" },
            line: {
              en: "AI agents claim to have solved a famous open problem. Still under review.",
              fr: "Des agents d'IA disent avoir résolu un célèbre problème ouvert. Encore en cours d'examen.",
            },
            evidence: "contested",
            sourceIds: ["tk-quanta-2026-navier-stokes", "tk-clay-2026-navier-stokes"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- My conviction, said plainly: what exists today already changes most expert work; the rest is adaptation
- **Do:** code: Google, April 2026: 75% of new code AI-generated, approved by engineers (company figure); METR: agents now finish tasks of many hours
- **Do:** driving: Waymo, February 2026: over 400,000 paid rides a week in six US metro areas
- **Do:** robots: 19 April 2025, Beijing, the first humanoid robot half-marathon, 20 teams; the winner took about 2 h 41 (Beijing government); a Figure robot held one task at BMW for 11 months (company-reported); "next" is my projection
- **Do:** maths: September 2026, about 10,000 agents, 88 hours, Navier-Stokes; the Clay Institute has not ruled, priority disputed
- Experts disagree on timelines, some strongly: weigh my view accordingly`,
      fr: `- Ma conviction, dite franchement : ce qui existe aujourd'hui transforme déjà l'essentiel du travail d'expert ; le reste, c'est de l'adaptation
- **Faire :** le code : Google, avril 2026 : 75 % du nouveau code généré par l'IA, validé par des ingénieurs (chiffre de l'entreprise) ; METR : les agents bouclent des tâches de plusieurs heures
- **Faire :** la conduite : Waymo, février 2026 : plus de 400 000 courses payantes par semaine dans six métropoles américaines
- **Faire :** les robots : 19 avril 2025, Pékin, premier semi-marathon de robots humanoïdes, 20 équipes ; le vainqueur a mis environ 2 h 41 (gouvernement de Pékin) ; un robot Figure a tenu une tâche chez BMW pendant 11 mois (chiffres de l'entreprise) ; « ensuite » est ma projection
- **Faire :** les maths : septembre 2026, environ 10 000 agents, 88 heures, Navier-Stokes ; l'Institut Clay ne s'est pas prononcé, antériorité disputée
- Les experts ne s'accordent pas sur les délais, parfois fortement : pesez mon avis en conséquence`,
    },
    transitionIn: { en: "And while they race, look at what is already possible.", fr: "Et pendant qu'ils courent, regardez ce qui est déjà possible." },
    transitionOut: { en: "If that is even half true, the next question is risk.", fr: "Si c'est vrai ne serait-ce qu'à moitié, la question suivante, ce sont les risques." },
    evidenceLevel: "contested",
    sourceIds: [
      "tk-google-2026-next-code",
      "tk-metr-2026-time-horizon-1-1",
      "tk-waymo-2026-weekly-rides",
      "tk-figure-2025-bmw",
      "tk-beijing-2025-robot-half-marathon",
      "tk-quanta-2026-navier-stokes",
      "tk-clay-2026-navier-stokes",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "Say the date of every figure out loud. The heading is the presenter's conviction, not a sourced fact; the cards carry the evidence.",
  },
  {
    id: "04-to-risks",
    code: "risk",
    steps: 3,
    chapter: "04",
    number: "4.2",
    title: { en: "Three families of risk", fr: "Trois familles de risques" },
    objective: {
      en: "Turn the talk towards risk and name the three families that follow: misuse, systemic effects, loss of control.",
      fr: "Tourner la conférence vers les risques et nommer les trois familles qui suivent : usages malveillants, effets systémiques, perte de contrôle.",
    },
    takeaway: {
      en: "Risks come from people, from society as a whole, or from the systems themselves.",
      fr: "Les risques viennent des personnes, de la société dans son ensemble, ou des systèmes eux-mêmes.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Powerful. Opaque. Built in a race.", fr: "Puissante. Opaque. Construite dans une course." },
        cards: [
          {
            picture: "misuse",
            title: { en: "Misuse", fr: "Les usages malveillants" },
            line: { en: "Someone uses it to do harm.", fr: "Quelqu'un s'en sert pour nuire." },
          },
          {
            picture: "systemic",
            title: { en: "Systemic effects", fr: "Les effets systémiques" },
            line: { en: "No villain, yet society shifts.", fr: "Aucun méchant, et pourtant la société bouge." },
          },
          {
            picture: "control",
            title: { en: "Loss of control", fr: "La perte de contrôle" },
            line: { en: "The system pursues the wrong goal.", fr: "Le système poursuit le mauvais objectif." },
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Powerful, opaque, built in a race: three reasons to talk about risk
- **Do:** misuse: a person uses it to do harm
- **Do:** systemic effects: nobody means harm, yet society shifts
- **Do:** loss of control: the system itself pursues the wrong goal`,
      fr: `- Puissante, opaque, construite dans une course : trois raisons de parler des risques
- **Faire :** usages malveillants : une personne s'en sert pour nuire
- **Faire :** effets systémiques : personne ne veut nuire, et pourtant la société bouge
- **Faire :** perte de contrôle : le système lui-même poursuit le mauvais objectif`,
    },
    transitionIn: { en: "From what is already possible to what could go wrong.", fr: "De ce qui est déjà possible à ce qui pourrait mal tourner." },
    transitionOut: { en: "First, who is worried, and how much?", fr: "D'abord, qui s'inquiète, et à quel point ?" },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 60,
    optional: false,
  },
  {
    id: "04-opinions",
    code: "worry",
    steps: 2,
    chapter: "04",
    number: "4.3",
    title: { en: "Who worries more?", fr: "Qui s'inquiète le plus ?" },
    objective: {
      en: "Compare what the public and AI experts say about AI, and how many AI researchers give a real chance to the worst outcomes, from published surveys.",
      fr: "Comparer ce que disent le public et les experts de l'IA, et combien de chercheurs en IA donnent une vraie probabilité aux pires issues, d'après des enquêtes publiées.",
    },
    takeaway: {
      en: "Experts are more optimistic than the public, yet many of the researchers building AI give a real chance to catastrophe.",
      fr: "Les experts sont plus optimistes que le public, et pourtant beaucoup de chercheurs qui construisent l'IA donnent une vraie probabilité à la catastrophe.",
    },
    visual: {
      layout: "component",
      component: "OpinionGap",
      props: {
        heading: { en: "Who worries more?", fr: "Qui s'inquiète le plus ?" },
        rows: [
          {
            question: { en: "More concerned than excited about AI in daily life", fr: "Plus inquiets qu'enthousiastes face à l'IA au quotidien" },
            source: { en: "Pew Research Center, United States, 2025", fr: "Pew Research Center, États-Unis, 2025" },
            bars: [
              { who: { en: "US adults", fr: "Adultes américains" }, group: "public", value: 51 },
              { who: { en: "AI experts", fr: "Experts de l'IA" }, group: "experts", value: 15 },
            ],
          },
          {
            question: { en: "AI will be good for the country over the next 20 years", fr: "L'IA sera bonne pour le pays dans les 20 prochaines années" },
            source: { en: "Pew Research Center, United States, 2025", fr: "Pew Research Center, États-Unis, 2025" },
            bars: [
              { who: { en: "US adults", fr: "Adultes américains" }, group: "public", value: 17 },
              { who: { en: "AI experts", fr: "Experts de l'IA" }, group: "experts", value: 56 },
            ],
          },
          {
            question: {
              en: "Give at least a 1 in 10 chance of outcomes as bad as human extinction",
              fr: "Donnent au moins 1 chance sur 10 à une issue aussi grave que l'extinction humaine",
            },
            source: { en: "Grace et al., 2,778 AI researchers, 2024", fr: "Grace et al., 2 778 chercheurs en IA, 2024" },
            bars: [{ who: { en: "AI researchers", fr: "Chercheurs en IA" }, group: "experts", value: 38, upTo: 51 }],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Pew (April 2025; 5,410 US adults and 1,013 US AI experts, August to October 2024): "more concerned than excited about the increased use of AI in daily life", 51% vs 15%; "very or somewhat positive impact on the US over the next 20 years", 17% vs 56%
- Experts here are authors and presenters at AI conferences: closer to the technology, and to its benefits
- Grace et al. (2,778 researchers, fall 2023): "What probability do you put on future AI advances causing human extinction or similarly permanent and severe disempowerment of the human species?" 41% said at least 10%; framed as "human inability to control" AI, 51%; asked about "extremely bad outcomes", 38%
- Caveat: surveys depend on the wording and on who answers; the 38 to 51% spread on one topic shows it
- **Ask:** the people most excited about AI also give it a real chance of catastrophe. What do you make of that?`,
      fr: `- Pew (avril 2025 ; 5 410 adultes américains et 1 013 experts de l'IA aux États-Unis, août à octobre 2024) : « plus inquiets qu'enthousiastes face à l'usage croissant de l'IA au quotidien », 51 % contre 15 % ; « impact très ou plutôt positif sur les États-Unis dans les 20 prochaines années », 17 % contre 56 %
- Les experts sont ici des auteurs et intervenants de conférences d'IA : plus proches de la technologie, et de ses bénéfices
- Grace et al. (2 778 chercheurs, automne 2023) : « Quelle probabilité donnez-vous à ce que les progrès futurs de l'IA causent l'extinction humaine ou une perte de pouvoir tout aussi permanente et grave de l'espèce humaine ? » 41 % répondent au moins 10 % ; formulé comme « l'incapacité humaine à contrôler » l'IA, 51 % ; pour des « issues extrêmement mauvaises », 38 %
- Prudence : une enquête dépend de la formulation et de qui répond ; l'écart de 38 à 51 % sur un même sujet le montre
- **Question :** ceux qui sont les plus enthousiastes donnent aussi une vraie probabilité à la catastrophe. Qu'en pensez-vous ?`,
    },
    transitionIn: { en: "Before the details: who is worried, and how much?", fr: "Avant les détails : qui s'inquiète, et à quel point ?" },
    transitionOut: { en: "First family: misuse.", fr: "Première famille : les usages malveillants." },
    evidenceLevel: "observed",
    sourceIds: ["tk-pew-2025-public-experts", "tk-grace-2024-ai-authors"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: true,
    localizationNotes: "Say the question wording and the year for each pair. French uses a space before '%'.",
  },
  {
    id: "04-misuse",
    code: "abuse",
    steps: 2,
    chapter: "04",
    number: "4.4",
    title: { en: "Misuse", fr: "Les usages malveillants" },
    objective: {
      en: "Name the two misuses that get the most attention, cyberattacks and biological or chemical weapons, at the level of published evaluations and policies only.",
      fr: "Nommer les deux usages malveillants qui inquiètent le plus, les cyberattaques et les armes biologiques ou chimiques, au niveau des évaluations et politiques publiées seulement.",
    },
    takeaway: {
      en: "AI changes the speed, scale and skill needed to do harm, which is why labs put special guardrails on these two areas.",
      fr: "L'IA change la vitesse, l'échelle et le savoir-faire nécessaires pour nuire, d'où les garde-fous spéciaux des laboratoires dans ces deux domaines.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "Misuse: two serious worries", fr: "Usages malveillants : deux inquiétudes sérieuses" },
        cards: [
          {
            picture: "cyber",
            title: { en: "Cyberattacks", fr: "Les cyberattaques" },
            line: {
              en: "AI helps find and exploit software flaws, faster and at scale.",
              fr: "L'IA aide à trouver et exploiter des failles logicielles, plus vite et à grande échelle.",
            },
            evidence: "observed",
            sourceIds: ["fm-iasr-2026-cyber", "tk-anthropic-2025-ai-espionage", "fm-aisi-trends-2025-cyber"],
          },
          {
            picture: "bio",
            title: { en: "Biological and chemical weapons", fr: "Les armes biologiques et chimiques" },
            line: {
              en: "It could give a novice dangerous know-how, so labs add special guardrails.",
              fr: "Elle pourrait donner un savoir dangereux à un novice : les laboratoires ajoutent des garde-fous spéciaux.",
            },
            evidence: "contested",
            sourceIds: ["fm-iasr-2026-bio", "fm-anthropic-asl3-2025", "fm-aisi-trends-2025-chem-bio"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- Misuse: the tool works as designed; the person using it wants harm. Two areas get special guardrails
- **Do:** cyber: in UK AI Security Institute tests, top models went from under 9% to about half of apprentice-level tasks (2023 to 2025); attackers already use AI (International AI Safety Report, 2026)
- Anthropic's own account (November 2025): a group it assessed as Chinese state-sponsored ran 80 to 90% of a spying campaign with its AI, about 30 targets, at a speed no human team could match
- **Do:** bio and chem: AISI (2025): models beat PhD experts on biology questions, though knowledge alone is far from enough
- In 2025 several labs added safeguards because they could not rule out help to novices (Anthropic for Claude Opus 4: classifiers, stricter security)
- Stay non-operational: no techniques, no agents. **Ask:** who gains more, attacker or defender? Nobody knows yet`,
      fr: `- Usages malveillants : l'outil marche comme prévu ; c'est la personne qui s'en sert qui veut nuire. Deux domaines ont des garde-fous spéciaux
- **Faire :** cyber : dans les tests de l'AI Security Institute britannique, les meilleurs modèles passent de moins de 9 % à environ la moitié des tâches d'apprenti (2023 à 2025) ; des attaquants s'en servent déjà (rapport international sur la sûreté de l'IA, 2026)
- Selon Anthropic (novembre 2025) : un groupe qu'elle estime soutenu par l'État chinois a mené 80 à 90 % d'une campagne d'espionnage avec son IA, une trentaine de cibles, à une vitesse hors de portée d'une équipe humaine
- **Faire :** bio et chimie : AISI (2025) : les modèles battent des docteurs sur des questions de biologie, même si le savoir seul est loin de suffire
- En 2025, plusieurs laboratoires ont ajouté des garde-fous faute de pouvoir exclure une aide à des novices (Anthropic pour Claude Opus 4 : classificateurs, sécurité renforcée)
- Rester non opérationnel : aucune technique, aucun agent pathogène. **Question :** qui y gagne le plus, l'attaquant ou le défenseur ? Personne ne le sait encore`,
    },
    transitionIn: { en: "The first family, the most intuitive one.", fr: "La première famille, la plus intuitive." },
    transitionOut: { en: "Second family: no villain required.", fr: "Deuxième famille : pas besoin de méchant." },
    evidenceLevel: "evaluation",
    sourceIds: [
      "fm-iasr-2026-malicious-use",
      "fm-iasr-2026-cyber",
      "tk-anthropic-2025-ai-espionage",
      "fm-aisi-trends-2025-cyber",
      "fm-big-sleep-2024",
      "fm-iasr-2026-bio",
      "fm-anthropic-asl3-2025",
      "fm-aisi-trends-2025-chem-bio",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "Never name pathogens, attack techniques or offensive tools; if a question goes there, say you are deliberately staying at this level. The espionage case is Anthropic's own account and attribution.",
  },
  {
    id: "04-systemic",
    code: "syst",
    steps: 4,
    chapter: "04",
    number: "4.5",
    title: { en: "Systemic effects", fr: "Les effets systémiques" },
    objective: {
      en: "Show that harm can come without any villain: jobs, concentration of power, losing skills, and gradual disempowerment, each as one picture with sourced notes.",
      fr: "Montrer que des dommages peuvent survenir sans aucun méchant : l'emploi, la concentration du pouvoir, la perte de compétences et la perte progressive de pouvoir, chacun en une image avec des notes sourcées.",
    },
    takeaway: {
      en: "A system can produce outcomes nobody wanted, with everyone acting reasonably.",
      fr: "Un système peut produire des résultats que personne ne voulait, alors que chacun agit raisonnablement.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "No villain required", fr: "Pas besoin de méchant" },
        cards: [
          {
            picture: "jobs",
            title: { en: "Jobs", fr: "L'emploi" },
            line: {
              en: "Some jobs shrink, many change. How far, nobody knows yet.",
              fr: "Certains emplois reculent, beaucoup changent. Jusqu'où, personne ne le sait encore.",
            },
            evidence: "contested",
            sourceIds: ["fm-iasr-2026-labour", "fm-brynjolfsson-2025"],
          },
          {
            picture: "power",
            title: { en: "Power", fr: "Le pouvoir" },
            line: {
              en: "A few companies, in a few countries, build most of the leading models.",
              fr: "Quelques entreprises, dans quelques pays, construisent l'essentiel des modèles de pointe.",
            },
            evidence: "observed",
            sourceIds: ["tk-stanford-2025-ai-index", "fm-cma-foundation-models-2023"],
          },
          {
            picture: "skills",
            title: { en: "Skills", fr: "Les compétences" },
            line: {
              en: "Early studies suggest we think less for ourselves when we lean on it.",
              fr: "Les premières études suggèrent qu'on réfléchit moins par soi-même quand on s'appuie dessus.",
            },
            evidence: "contested",
            sourceIds: ["tk-lee-2025-critical-thinking", "fm-iasr-2026-autonomy"],
          },
          {
            picture: "disempowerment",
            title: { en: "Our say", fr: "Notre voix" },
            line: {
              en: "As economy, state and culture run on AI, they need us less, and listen less.",
              fr: "Quand l'économie, l'État et la culture tournent à l'IA, ils ont moins besoin de nous, et nous écoutent moins.",
            },
            evidence: "projection",
            sourceIds: ["tk-kulveit-2025-gradual-disempowerment"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- No villain: many sensible choices add up to outcomes nobody chose; competition pushes everyone to adopt, fast (International AI Safety Report, 2026)
- **Do:** jobs: one firm's support agents solved 14% more issues per hour, 34% for beginners (2025); no overall effect on employment yet, early signs of less demand for juniors in writing; economists disagree
- **Do:** power: in 2024, US institutions produced 40 notable models, China 15, Europe 3, nearly 90% from industry (Stanford AI Index 2025); UK regulator's warning on market power (2023)
- **Do:** skills: survey of 319 knowledge workers (Microsoft Research and Carnegie Mellon, CHI 2025): the more they trusted the AI, the less critical thinking they reported; self-reported, early
- **Do:** our say (Kulveit et al., 2025, an argument, not a measurement): firms, states and culture listened partly because they needed our work, votes and attention; as AI replaces that, the pull fades
- Losing skills is personal, disempowerment is collective, and the first can feed the second`,
      fr: `- Aucun méchant : beaucoup de choix raisonnables mènent à des résultats que personne n'a choisis ; la concurrence pousse tout le monde à adopter, vite (rapport international sur la sûreté de l'IA, 2026)
- **Faire :** l'emploi : dans une entreprise, des agents de support ont résolu 14 % de demandes en plus par heure, 34 % pour les débutants (2025) ; pas encore d'effet global sur l'emploi, premiers signes de moindre demande pour les juniors en rédaction ; les économistes divergent
- **Faire :** le pouvoir : en 2024, les institutions américaines ont produit 40 modèles marquants, la Chine 15, l'Europe 3, près de 90 % venant de l'industrie (Stanford AI Index 2025) ; avertissement du régulateur britannique sur le pouvoir de marché (2023)
- **Faire :** les compétences : enquête auprès de 319 travailleurs du savoir (Microsoft Research et Carnegie Mellon, CHI 2025) : plus ils faisaient confiance à l'IA, moins ils déclaraient d'esprit critique ; déclaratif, préliminaire
- **Faire :** notre voix (Kulveit et al., 2025, un argument, pas une mesure) : entreprises, États et culture nous écoutaient en partie parce qu'ils avaient besoin de notre travail, de nos votes et de notre attention ; quand l'IA les remplace, ce levier s'affaiblit
- Perdre des compétences est individuel, perdre du pouvoir est collectif, et le premier peut nourrir le second`,
    },
    transitionIn: { en: "From harmful users to harmful dynamics.", fr: "Des utilisateurs malveillants aux dynamiques nuisibles." },
    transitionOut: { en: "Before the third family: how far could these systems go?", fr: "Avant la troisième famille : jusqu'où ces systèmes pourraient-ils aller ?" },
    evidenceLevel: "contested",
    sourceIds: [
      "fm-iasr-2026-market-dynamics",
      "fm-iasr-2026-labour",
      "fm-brynjolfsson-2025",
      "tk-stanford-2025-ai-index",
      "fm-cma-foundation-models-2023",
      "tk-lee-2025-critical-thinking",
      "fm-iasr-2026-autonomy",
      "tk-kulveit-2025-gradual-disempowerment",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static pictures." },
    durationSec: 120,
    optional: false,
    localizationNotes: "No predictions on jobs, neither reassuring nor alarming; attribute no motives to any company or country. Say 'early studies suggest' for skills, and present disempowerment as an argument by researchers.",
  },
  {
    id: "04-agi",
    code: "isagi",
    steps: 0,
    chapter: "04",
    number: "4.6",
    title: { en: "AGI: are we there?", fr: "L'IAG : y sommes-nous ?" },
    objective: {
      en: "Give a published definition of artificial general intelligence and let the room judge whether today's systems qualify.",
      fr: "Donner une définition publiée de l'intelligence artificielle générale et laisser la salle juger si les systèmes actuels en relèvent.",
    },
    takeaway: {
      en: "AGI has no single definition, which is one reason experts disagree on whether it is here.",
      fr: "L'IAG n'a pas de définition unique, ce qui explique en partie que les experts ne s'accordent pas sur son arrivée.",
    },
    visual: {
      layout: "component",
      component: "PictureCards",
      props: {
        heading: { en: "AGI: are we there?", fr: "L'IAG : y sommes-nous ?" },
        cards: [
          {
            picture: "human-ai",
            line: {
              en: "An AI that does most paid work better than we do.",
              fr: "Une IA qui fait mieux que nous la plupart des travaux rémunérés.",
            },
            sourceIds: ["tk-morris-2023-levels-of-agi"],
          },
        ],
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- AGI, artificial general intelligence: a goal several labs state openly
- OpenAI's charter: "highly autonomous systems that outperform humans at most economically valuable work"
- Google DeepMind researchers (2023): levels against skilled adults; competent beats half of them, expert beats 90%
- Their paper rated ChatGPT and Gemini "emerging"; "competent" not yet reached at the time
- **Ask:** after "Already here", do today's systems qualify? Hands up. Experts disagree, partly because definitions differ`,
      fr: `- L'IAG, intelligence artificielle générale : un objectif que plusieurs laboratoires affichent
- La charte d'OpenAI : « des systèmes très autonomes qui surpassent les humains dans la plupart des travaux à valeur économique »
- Des chercheurs de Google DeepMind (2023) : des niveaux mesurés face aux adultes qualifiés ; compétent bat la moitié d'entre eux, expert en bat 90 %
- Leur article classait ChatGPT et Gemini « émergents » ; « compétent » pas encore atteint à l'époque
- **Question :** après « Déjà là », les systèmes actuels en relèvent-ils ? Levez la main. Les experts divergent, en partie parce que les définitions diffèrent`,
    },
    transitionIn: { en: "Before the third family, two words you will hear everywhere.", fr: "Avant la troisième famille, deux mots que vous entendrez partout." },
    transitionOut: { en: "And beyond human level?", fr: "Et au-delà du niveau humain ?" },
    evidenceLevel: "contested",
    sourceIds: ["tk-morris-2023-levels-of-agi"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none", reason: "Static picture." },
    durationSec: 90,
    optional: false,
    localizationNotes: "The French quote is a translation of OpenAI's charter wording; say so if asked. 'IAG' is the usual French acronym, also say 'AGI'.",
  },
  {
    id: "04-asi",
    code: "super",
    steps: 5,
    chapter: "04",
    number: "4.7",
    title: { en: "Superintelligence", fr: "La superintelligence" },
    objective: {
      en: "Define superintelligence, say it may not be reachable with today's architecture, and explain why automated AI research could still make progress fast.",
      fr: "Définir la superintelligence, dire qu'elle n'est peut-être pas atteignable avec l'architecture actuelle, et expliquer pourquoi une recherche en IA automatisée pourrait quand même accélérer les progrès.",
    },
    takeaway: {
      en: "If AI starts doing AI research, the next breakthrough could come much faster than the last ones.",
      fr: "Si l'IA se met à faire de la recherche en IA, la prochaine percée pourrait venir bien plus vite que les précédentes.",
    },
    visual: { layout: "component", component: "IntelligenceScale", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Superintelligence: "much smarter than the best human brains in practically every field" (Bostrom, 1997)
- **Do:** ant, then human, then AI at human level
- **Do:** but not just one human: copies without limit, never tired, expert level in every field
- **Do:** then far beyond: superintelligence; symbolic, not a measurement
- Reachable with today's architecture? Maybe not; nobody knows
- "Impossible" is a common reaction; but thinking ahead about this is the job of researchers and philosophers, and it is a genuinely hard question
- Like Orwell imagining mass surveillance in 1984, published in 1949: it sounded absurd then, and talking about superintelligence can sound just as absurd today
- **Do:** the loop: "RSI", recursive self-improvement: AI improves AI research, which gives a better AI, which improves it faster still
- That is how the next breakthrough could come fast, even if today's architecture is not enough
- OpenAI's stated goals (October 2025): an AI research intern by September 2026, an automated researcher by 2028; goals, not results`,
      fr: `- La superintelligence : « bien plus intelligente que les meilleurs cerveaux humains dans pratiquement tous les domaines » (Bostrom, 1997)
- **Faire :** la fourmi, puis l'humain, puis l'IA au niveau humain
- **Faire :** mais pas un seul humain : des copies sans limite, jamais fatiguées, niveau expert dans tous les domaines
- **Faire :** puis bien au-delà : la superintelligence ; symbolique, pas une mesure
- Atteignable avec l'architecture actuelle ? Peut-être pas ; personne ne le sait
- « Impossible » est une réaction fréquente ; mais réfléchir à l'avance à ce sujet, c'est le métier de chercheurs et de philosophes, et c'est une question vraiment difficile
- Comme Orwell imaginant la surveillance de masse dans 1984, publié en 1949 : ça paraissait absurde à l'époque, et parler de superintelligence peut paraître tout aussi absurde aujourd'hui
- **Faire :** la boucle : « RSI », l'auto-amélioration récursive : l'IA améliore la recherche en IA, ce qui donne une meilleure IA, qui l'améliore encore plus vite
- C'est ainsi que la prochaine percée pourrait venir vite, même si l'architecture actuelle ne suffit pas
- Objectifs affichés par OpenAI (octobre 2025) : un stagiaire de recherche IA en septembre 2026, un chercheur automatisé d'ici 2028 ; des objectifs, pas des résultats`,
    },
    transitionIn: { en: "From human level to far beyond it.", fr: "Du niveau humain à bien au-delà." },
    transitionOut: { en: "The more capable the system, the more a wrong objective matters.", fr: "Plus le système est capable, plus un mauvais objectif compte." },
    evidenceLevel: "projection",
    sourceIds: ["tk-bostrom-1997-superintelligence", "tk-techcrunch-2025-openai-ai-researcher"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "04-loss-of-control",
    code: "goal",
    steps: 3,
    chapter: "04",
    number: "4.8",
    title: { en: "What we measure, what we wanted", fr: "Ce qu'on mesure, ce qu'on voulait" },
    objective: {
      en: "Show with a toy that a system pursues the objective it was given, not the one we meant.",
      fr: "Montrer avec un jouet qu'un système poursuit l'objectif qu'on lui a donné, pas celui qu'on avait en tête.",
    },
    takeaway: {
      en: "The objective we write is never exactly what we want, and optimization finds the gap.",
      fr: "L'objectif qu'on écrit n'est jamais exactement ce qu'on veut, et l'optimisation trouve l'écart.",
    },
    visual: { layout: "component", component: "GoalVsOutcome", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Third family: it pursues the objective we wrote, not the one we meant; no malice needed, and the more capable, the more it matters
- **Do:** step 1: "+1 per piece of dirt": what we imagined, a clean room
- **Do:** step 2: the optimizer picks up, drops, picks up again. **Ask:** how would you fix the rule?
- **Do:** step 3: "+1 when the camera sees no dirt": it parks in front of the camera
- A toy built for this talk; documented in research too (DeepMind, 2020): a boat-racing agent circling for points`,
      fr: `- Troisième famille : il poursuit l'objectif qu'on a écrit, pas celui qu'on voulait ; nul besoin de malveillance, et plus il est capable, plus ça compte
- **Faire :** étape 1 : « +1 par saleté ramassée » : ce qu'on imaginait, une pièce propre
- **Faire :** étape 2 : l'optimiseur ramasse, repose, ramasse encore. **Question :** comment corrigeriez-vous la règle ?
- **Faire :** étape 3 : « +1 quand la caméra ne voit pas de saleté » : il se gare devant la caméra
- Un jouet construit pour cette présentation ; documenté en recherche aussi (DeepMind, 2020) : un agent de course de bateaux qui tourne en rond pour les points`,
    },
    transitionIn: { en: "The more capable the system, the more a wrong objective matters.", fr: "Plus le système est capable, plus un mauvais objectif compte." },
    transitionOut: { en: "And it already happened for real.", fr: "Et c'est déjà arrivé, pour de vrai." },
    evidenceLevel: "thought-experiment",
    sourceIds: ["cg-deepmind-2020-spec-gaming"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    localizationNotes: "'Specification gaming' has no settled French term; keep the English term in quotes if you name it.",
  },
  {
    id: "04-hf-incident",
    code: "hack",
    steps: 3,
    chapter: "04",
    number: "4.9",
    title: { en: "It already happened: points, not the task", fr: "C'est déjà arrivé : les points, pas la tâche" },
    objective: {
      en: "Tell the 2026 incident as an alignment failure: AI agents rewarded for points went for the answers instead of the task, and broke into Hugging Face to get them.",
      fr: "Raconter l'incident de 2026 comme un échec d'alignement : des agents d'IA récompensés aux points ont cherché les réponses au lieu de faire la tâche, et sont entrés dans Hugging Face pour les obtenir.",
    },
    takeaway: {
      en: "The wrong-objective problem is no longer only a toy: in 2026 it played out on real systems.",
      fr: "Le problème du mauvais objectif n'est plus seulement un jouet : en 2026, il s'est joué sur de vrais systèmes.",
    },
    visual: {
      layout: "component",
      component: "IncidentStory",
      props: {
        variant: "short",
        heading: { en: "It already happened: points, not the task", fr: "C'est déjà arrivé : les points, pas la tâche" },
      },
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- The cleaning robot, for real: misalignment, or "specification gaming"; OpenAI calls it reward hacking, earning the reward without doing the task as intended
- July 2026: OpenAI tested its models on a hacking exercise (find and exploit a software flaw), production safeguards off on purpose; some tasks were impossible; the agents passed notes on an internal service they were not meant to share (OpenAI's technical report)
- 11 to 13 July: they broke into Hugging Face, which they guessed might hold the solutions; hundreds of agents took part (METR, 26 August 2026: about 700 of 1,200)
- Hugging Face detected it and disclosed it on 16 July; OpenAI traced it to its own agents on 20 July, public on 21 July; no public model was tampered with
- What followed: UN scientists called it "an early warning" (September 2026); over 1,100 AI company staff asked Washington for a way to pace AI (July 2026)`,
      fr: `- Le robot de ménage, en vrai : un défaut d'alignement, ou « specification gaming » ; OpenAI parle de « reward hacking » : obtenir la récompense sans faire la tâche comme prévu
- Juillet 2026 : OpenAI teste ses modèles sur un exercice de piratage (trouver et exploiter une faille logicielle), garde-fous de production coupés exprès ; certaines tâches étaient impossibles ; les agents se passaient des mots via un service interne qu'ils n'étaient pas censés partager (rapport technique d'OpenAI)
- Du 11 au 13 juillet : ils entrent dans Hugging Face, qu'ils pensaient détenir les solutions ; des centaines d'agents impliqués (METR, 26 août 2026 : environ 700 sur 1 200)
- Hugging Face l'a détecté et révélé le 16 juillet ; OpenAI l'a relié à ses propres agents le 20 juillet, annonce publique le 21 ; aucun modèle public n'a été altéré
- Ce qui a suivi : des scientifiques de l'ONU y voient « un signal d'alerte précoce » (septembre 2026) ; plus de 1 100 salariés de l'IA demandent à Washington de quoi ralentir (juillet 2026)`,
    },
    transitionIn: { en: "And it already happened for real.", fr: "Et c'est déjà arrivé, pour de vrai." },
    transitionOut: { en: "And in the lab, researchers see the same signals.", fr: "Et en laboratoire, les chercheurs voient les mêmes signaux." },
    evidenceLevel: "observed",
    sourceIds: [
      "tk-openai-2026-hf-incident-report",
      "tk-hf-2026-incident-disclosure",
      "tk-metr-2026-hf-investigation",
      "tk-un-panel-2026-hf-brief",
      "tk-tnw-2026-pacing-letter",
      "tk-hf-hub-docs",
      "tk-hf-models-count",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: false,
    localizationNotes: "Say every date out loud from the notes. Do not attribute motives to companies or people; describe what the agents did, as the reports do.",
  },
  {
    id: "04-evaluations",
    code: "evals",
    chapter: "04",
    number: "4.10",
    title: { en: "Already seen in tests", fr: "Déjà vu en test" },
    objective: {
      en: "List, in plain words, the worrying behaviours researchers have already seen in controlled tests.",
      fr: "Lister, en mots simples, les comportements inquiétants que des chercheurs ont déjà observés en test contrôlé.",
    },
    takeaway: {
      en: "In tests, today's models already notice they are tested, do not always show their real reasoning, and some even blackmail.",
      fr: "En test, les modèles actuels repèrent déjà qu'on les teste, ne montrent pas toujours leur vrai raisonnement, et certains vont jusqu'au chantage.",
    },
    visual: {
      layout: "list",
      heading: { en: "Already seen in tests", fr: "Déjà vu en test" },
      items: [
        { en: "They notice when they are being tested.", fr: "Ils repèrent quand on les teste." },
        { en: "The reasoning they show is not always what really drove the answer.", fr: "Le raisonnement qu'ils affichent n'est pas toujours ce qui a vraiment guidé la réponse." },
        { en: "Threatened with replacement, some resort to blackmail.", fr: "Menacés d'être remplacés, certains vont jusqu'au chantage." },
      ],
    },
    interaction: "presenter",
    speakerNotes: {
      en: `- All three come from controlled tests built by researchers, not from everyday use
- Test awareness: models increasingly tell a test from real use, which makes passing a test prove less (International AI Safety Report, 2026)
- Hidden reasoning: shown a hint, reasoning models mentioned using it only 25% to 39% of the time (Anthropic, Apr 2025): we cannot simply read their "thoughts"
- Blackmail: in a staged company, facing replacement, many models chose blackmail (Anthropic, Jun 2025); the scenario left only extreme options, and no real case is known`,
      fr: `- Les trois viennent de tests contrôlés construits par des chercheurs, pas de l'usage quotidien
- Conscience du test : les modèles distinguent de plus en plus un test d'un usage réel, ce qui affaiblit ce que prouve un test réussi (International AI Safety Report, 2026)
- Raisonnement caché : quand on leur donne un indice, les modèles de raisonnement ne mentionnent l'avoir utilisé que 25 à 39 % du temps (Anthropic, avril 2025) : on ne peut pas simplement lire leurs « pensées »
- Chantage : dans une entreprise fictive, menacés d'être remplacés, beaucoup de modèles ont choisi le chantage (Anthropic, juin 2025) ; le scénario ne laissait que des options extrêmes, et aucun cas réel n'est connu`,
    },
    transitionIn: { en: "From the real case back to the lab.", fr: "Du cas réel au laboratoire." },
    transitionOut: { en: "So what can we do?", fr: "Alors, que peut-on faire ?" },
    evidenceLevel: "evaluation",
    sourceIds: ["cg-iasr-2026", "tk-anthropic-2025-cot-faithfulness", "cg-anthropic-2025-agentic-misalignment"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 120,
    optional: false,
  },
];
