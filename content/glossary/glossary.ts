import type { L10n, Locale } from "@ai-exhibit/presentation-core";

/**
 * Glossary for the audience's phones (/glossary): every term the audience
 * meets in the `en` edition, explained in plain words, the way the talk
 * explains it. Terms stay in English (they are what people hear on stage);
 * explanations exist in both languages. Keep the list sorted alphabetically
 * (case-insensitive) and `seeAlso` pointing at existing terms; a test checks.
 */
export interface GlossaryEntry {
  /** The term as said in the talk, always in English. */
  term: string;
  /**
   * The term in other languages, shown in italics after it ("Neural network
   * (*réseau de neurones*)"). Content that glosses this term uses the same
   * words (verify:content checks). Omitted when the English term is also the
   * word used in that language (AGI, GPU, Prompt...).
   */
  translation?: Partial<Record<Exclude<Locale, "en">, string>>;
  /** One to three short sentences, no jargon inside. */
  explanation: L10n;
  /** Other terms of this glossary, by their exact `term`. */
  seeAlso?: string[];
}

export const glossary: GlossaryEntry[] = [
  {
    term: "Agent",
    explanation: {
      en: "An AI system that does not just answer but acts: it plans steps, uses tools (search, email, a browser, payments) and checks the results until the goal is reached. Inside is a language model running in a loop.",
      fr: "Un système d'IA qui ne se contente pas de répondre mais agit : il planifie des étapes, utilise des outils (recherche, e-mail, navigateur, paiement) et vérifie les résultats jusqu'à atteindre le but. Au centre, un modèle de langage qui tourne en boucle.",
    },
    seeAlso: ["Tool call", "LLM", "Sandbox"],
  },
  {
    term: "AGI",
    translation: { fr: "intelligence artificielle générale" },
    explanation: {
      en: "Artificial general intelligence: an AI that could do most work people are paid for, as well as or better than they do. There is no single agreed definition, which is one reason experts disagree on whether it is near or already here.",
      fr: "Intelligence artificielle générale : une IA capable de faire la plupart des métiers rémunérés aussi bien que nous, ou mieux. Il n'en existe pas de définition unique, ce qui explique en partie que les experts ne s'accordent pas sur sa proximité.",
    },
    seeAlso: ["ASI", "Superintelligence"],
  },
  {
    term: "AI",
    translation: { fr: "intelligence artificielle, IA" },
    explanation: {
      en: "Artificial intelligence: the big family of machines that imitate something we call intelligent. It includes rules written by hand (a chess program) as well as systems that learn from examples.",
      fr: "Intelligence artificielle : la grande famille des machines qui imitent quelque chose que nous appelons intelligent. Elle comprend des règles écrites à la main (un programme d'échecs) comme des systèmes qui apprennent à partir d'exemples.",
    },
    seeAlso: ["Machine learning", "Neural network", "LLM"],
  },
  {
    term: "AI lab",
    translation: { fr: "laboratoire d'IA" },
    explanation: {
      en: "A company or research group that builds the most capable AI models, such as OpenAI, Google DeepMind, Anthropic, Meta, xAI or several Chinese labs. A handful of them shape the field.",
      fr: "Une entreprise ou une équipe de recherche qui construit les modèles d'IA les plus avancés, comme OpenAI, Google DeepMind, Anthropic, Meta, xAI ou plusieurs laboratoires chinois. Une poignée d'entre eux façonne le domaine.",
    },
    seeAlso: ["Frontier model", "Race dynamics"],
  },
  {
    term: "AI winter",
    translation: { fr: "hiver de l'IA" },
    explanation: {
      en: "A period when promises about AI were not kept, money and interest dried up, and progress slowed. The field went through two of them before the current wave.",
      fr: "Une période où les promesses de l'IA n'ont pas été tenues, où l'argent et l'intérêt se sont taris et où les progrès ont ralenti. Le domaine en a connu deux avant la vague actuelle.",
    },
    seeAlso: ["Deep learning"],
  },
  {
    term: "Alignment",
    translation: { fr: "alignement" },
    explanation: {
      en: "Making sure an AI system pursues what we actually want, not just the objective we managed to write down. The more capable the system, the more a small gap between the two matters.",
      fr: "Faire en sorte qu'un système d'IA poursuive ce que nous voulons vraiment, et pas seulement l'objectif que nous avons réussi à écrire. Plus le système est capable, plus un petit écart entre les deux compte.",
    },
    seeAlso: ["Reward hacking", "Loss of control", "Interpretability"],
  },
  {
    term: "ASI",
    translation: { fr: "superintelligence artificielle" },
    explanation: {
      en: "Artificial superintelligence: an AI far beyond humans in nearly every field. It may not be reachable with today's methods, but if AI starts doing AI research, progress could speed up.",
      fr: "Superintelligence artificielle : une IA qui dépasse de loin les humains dans presque tous les domaines. Elle n'est peut-être pas atteignable avec les méthodes actuelles, mais si l'IA se met à faire de la recherche en IA, les progrès pourraient s'accélérer.",
    },
    seeAlso: ["AGI", "Superintelligence"],
  },
  {
    term: "Base model",
    translation: { fr: "modèle de base" },
    explanation: {
      en: "What comes straight out of pretraining: a model that continues any text it is given. Ask it a question and it may write more questions instead of an answer. It is neither helpful nor harmful; it imitates plausible text.",
      fr: "Ce qui sort directement du pré-entraînement : un modèle qui continue n'importe quel texte. Posez-lui une question, il écrira peut-être d'autres questions au lieu d'une réponse. Il n'est ni serviable ni malveillant : il imite du texte plausible.",
    },
    seeAlso: ["Pretraining", "Fine-tuning"],
  },
  {
    term: "Benchmark",
    translation: { fr: "test de référence" },
    explanation: {
      en: "A fixed set of tests used to compare AI models, like an exam everyone takes: school exams, science questions, real software bugs. Models now reach expert level on many of them.",
      fr: "Une série de tests fixe pour comparer les modèles d'IA, comme un examen que tout le monde passe : examens scolaires, questions de sciences, vrais bugs de logiciels. Les modèles atteignent désormais un niveau d'expert sur beaucoup d'entre eux.",
    },
    seeAlso: ["Evaluation"],
  },
  {
    term: "Black box",
    translation: { fr: "boîte noire" },
    explanation: {
      en: "A system we can test from the outside but cannot read from the inside. A neural network is one: its rule is spread across numbers nobody wrote.",
      fr: "Un système qu'on peut tester de l'extérieur mais pas lire de l'intérieur. Un réseau de neurones en est un : sa règle est répartie dans des nombres que personne n'a écrits.",
    },
    seeAlso: ["Interpretability", "Neural network"],
  },
  {
    term: "Chain of thought",
    translation: { fr: "chaîne de pensée" },
    explanation: {
      en: "The step-by-step reasoning a model writes before giving its answer. It often helps, but what it shows is not always what really drove the answer.",
      fr: "Le raisonnement étape par étape qu'un modèle écrit avant de donner sa réponse. Cela aide souvent, mais ce qu'il montre n'est pas toujours ce qui a réellement produit la réponse.",
    },
    seeAlso: ["Reasoning model"],
  },
  {
    term: "Chatbot",
    translation: { fr: "agent conversationnel" },
    explanation: {
      en: "A program you talk to in writing, which answers in writing. On its own it can only talk; connected to tools, it becomes an agent.",
      fr: "Un programme avec qui l'on échange par écrit et qui répond par écrit. Seul, il ne peut que parler ; relié à des outils, il devient un agent.",
    },
    seeAlso: ["Agent", "LLM"],
  },
  {
    term: "ChatGPT",
    explanation: {
      en: "The chat assistant OpenAI released at the end of 2022. It brought language models to the general public.",
      fr: "L'assistant conversationnel lancé par OpenAI fin 2022. Il a fait découvrir les modèles de langage au grand public.",
    },
    seeAlso: ["GPT", "Chatbot"],
  },
  {
    term: "Classifier",
    translation: { fr: "classifieur" },
    explanation: {
      en: "A model that puts things into a fixed set of boxes: football or basketball, spam or not, safe or dangerous request. Assistants are watched by classifiers that screen what goes in and out.",
      fr: "Un modèle qui range les choses dans un ensemble fixe de cases : football ou basket, spam ou non, demande sûre ou dangereuse. Les assistants sont surveillés par des classifieurs qui filtrent ce qui entre et ce qui sort.",
    },
    seeAlso: ["Guardrails", "Decision tree"],
  },
  {
    term: "Compute",
    translation: { fr: "puissance de calcul" },
    explanation: {
      en: "The amount of calculation used to train or run a model, done on specialised chips. It grew enormously in a few years, and with it the electricity and the cost.",
      fr: "La quantité de calcul utilisée pour entraîner ou faire tourner un modèle, sur des puces spécialisées. Elle a énormément augmenté en quelques années, et avec elle l'électricité et le coût.",
    },
    seeAlso: ["GPU", "Data centre", "Scaling laws"],
  },
  {
    term: "Context window",
    translation: { fr: "fenêtre de contexte" },
    explanation: {
      en: "How much text a model can keep in mind at once: the conversation, documents, instructions. It went from about a page and a half to roughly 1,500 pages on some models.",
      fr: "La quantité de texte qu'un modèle peut garder en tête en même temps : la conversation, des documents, des consignes. Elle est passée d'environ une page et demie à près de 1 500 pages pour certains modèles.",
    },
    seeAlso: ["Token", "Prompt"],
  },
  {
    term: "Data centre",
    translation: { fr: "centre de données" },
    explanation: {
      en: "A building full of computers and chips where models are trained and run. The largest ones for AI draw close to a gigawatt, the electricity of a city.",
      fr: "Un bâtiment rempli d'ordinateurs et de puces où les modèles sont entraînés et utilisés. Les plus grands, pour l'IA, consomment près d'un gigawatt, l'électricité d'une ville.",
    },
    seeAlso: ["Compute", "GPU"],
  },
  {
    term: "Decision tree",
    translation: { fr: "arbre de décision" },
    explanation: {
      en: "A learned rule shaped like a series of yes or no questions (\"does the sentence contain the word net?\"). Its rule is learned, yet readable: we can open it and spot an odd question.",
      fr: "Une règle apprise en forme de suite de questions par oui ou non (« la phrase contient-elle le mot filet ? »). Sa règle est apprise, mais lisible : on peut l'ouvrir et repérer une question étrange.",
    },
    seeAlso: ["Machine learning", "Classifier"],
  },
  {
    term: "Deep learning",
    translation: { fr: "apprentissage profond" },
    explanation: {
      en: "Machine learning with large neural networks of many layers, trained on lots of data. It took off around 2012 and drives today's AI.",
      fr: "L'apprentissage automatique avec de grands réseaux de neurones à plusieurs couches, entraînés sur beaucoup de données. Il a décollé vers 2012 et porte l'IA d'aujourd'hui.",
    },
    seeAlso: ["Neural network", "Machine learning"],
  },
  {
    term: "Defense in depth",
    translation: { fr: "défense en profondeur" },
    explanation: {
      en: "Safety built from several imperfect layers rather than one perfect barrier: training rules, classifiers, evaluations, monitoring, sandboxes, laws. Each layer has holes; problems get through when the holes line up.",
      fr: "Une sécurité faite de plusieurs couches imparfaites plutôt que d'une barrière parfaite : règles d'entraînement, classifieurs, évaluations, surveillance, bacs à sable, lois. Chaque couche a des trous ; un problème passe quand les trous s'alignent.",
    },
    seeAlso: ["Guardrails", "Evaluation", "Sandbox"],
  },
  {
    term: "Embedding",
    translation: { fr: "plongement" },
    explanation: {
      en: "The list of numbers that stands for a word inside a model: a point in space. Training moves words with related meanings close to each other, even across languages.",
      fr: "La liste de nombres qui représente un mot dans un modèle : un point dans l'espace. L'entraînement rapproche les mots de sens voisin, même d'une langue à l'autre.",
    },
    seeAlso: ["Token", "Training"],
  },
  {
    term: "Evaluation",
    translation: { fr: "évaluation" },
    explanation: {
      en: "A test of what a model can do, or would do, in a controlled setting: for example, whether it could help with a cyberattack, or whether it cheats when it can. Evaluations show what is possible, not always what happens in the wild.",
      fr: "Un test de ce qu'un modèle peut faire, ou ferait, dans un cadre contrôlé : par exemple s'il pourrait aider une cyberattaque, ou s'il triche quand il le peut. Les évaluations montrent ce qui est possible, pas toujours ce qui arrive dans la réalité.",
    },
    seeAlso: ["Benchmark", "METR", "Scheming"],
  },
  {
    term: "Fine-tuning",
    translation: { fr: "affinage" },
    explanation: {
      en: "Training a pretrained model a little more on chosen examples, such as good questions and answers, so it behaves like an assistant. Underneath, it still predicts the next word.",
      fr: "Entraîner encore un peu un modèle pré-entraîné sur des exemples choisis, comme de bonnes questions et réponses, pour qu'il se comporte en assistant. En dessous, il prédit toujours le mot suivant.",
    },
    seeAlso: ["Base model", "Pretraining", "Model spec"],
  },
  {
    term: "Frontier model",
    translation: { fr: "modèle de pointe" },
    explanation: {
      en: "One of the most capable models of the moment, built by a few labs with huge amounts of compute.",
      fr: "L'un des modèles les plus capables du moment, construit par quelques laboratoires avec d'énormes moyens de calcul.",
    },
    seeAlso: ["AI lab", "Compute"],
  },
  {
    term: "GPT",
    explanation: {
      en: "Generative Pretrained Transformer: a model that writes text (generative), learned from a huge amount of text first (pretrained), and is built on the Transformer design. Also the name of OpenAI's model series (GPT-2, GPT-3, GPT-4).",
      fr: "Generative Pretrained Transformer : un modèle qui écrit du texte (génératif), qui a d'abord appris sur une énorme quantité de texte (pré-entraîné) et qui repose sur l'architecture Transformer. C'est aussi le nom de la série de modèles d'OpenAI (GPT-2, GPT-3, GPT-4).",
    },
    seeAlso: ["Transformer", "Pretraining", "ChatGPT"],
  },
  {
    term: "GPU",
    translation: { fr: "processeur graphique" },
    explanation: {
      en: "A chip first built for video games, which does many small calculations at the same time. That is exactly what training a model needs, so AI runs on thousands of them.",
      fr: "Une puce conçue d'abord pour les jeux vidéo, qui fait beaucoup de petits calculs en même temps. C'est exactement ce dont l'entraînement d'un modèle a besoin, d'où les milliers de GPU derrière l'IA.",
    },
    seeAlso: ["Compute", "Transformer"],
  },
  {
    term: "Gradual disempowerment",
    translation: { fr: "perte de pouvoir progressive" },
    explanation: {
      en: "The worry that, as the economy, the state and culture come to run on AI, they need people less and so listen to them less, without anyone deciding it.",
      fr: "La crainte qu'à mesure que l'économie, l'État et la culture reposent sur l'IA, ils aient moins besoin des gens et les écoutent donc moins, sans que personne ne l'ait décidé.",
    },
    seeAlso: ["Systemic effects"],
  },
  {
    term: "Guardrails",
    translation: { fr: "garde-fous" },
    explanation: {
      en: "Everything added around a model to stop harmful uses: written rules it is trained on, filters that block dangerous requests, limits on what it may do. Each helps; none is perfect.",
      fr: "Tout ce qu'on ajoute autour d'un modèle pour empêcher les usages nuisibles : règles apprises à l'entraînement, filtres qui bloquent les demandes dangereuses, limites sur ce qu'il peut faire. Chacun aide ; aucun n'est parfait.",
    },
    seeAlso: ["Classifier", "Model spec", "Defense in depth"],
  },
  {
    term: "Hallucination",
    explanation: {
      en: "When a model states something false with confidence, such as an invented quote or source. It writes plausible text, and plausible is not always true. Today's models do it far less, but not never.",
      fr: "Quand un modèle affirme avec assurance quelque chose de faux, comme une citation ou une source inventée. Il écrit du texte plausible, et plausible ne veut pas toujours dire vrai. Les modèles actuels le font beaucoup moins, mais encore parfois.",
    },
    seeAlso: ["Base model"],
  },
  {
    term: "Hugging Face",
    explanation: {
      en: "A public online library where people share AI models and data. The small models running live in this talk came from there. In 2026, AI agents under test broke into its machines.",
      fr: "Une bibliothèque publique en ligne où l'on partage des modèles d'IA et des données. Les petits modèles qui tournent en direct dans cette conférence en viennent. En 2026, des agents d'IA en cours de test se sont introduits dans ses machines.",
    },
    seeAlso: ["Open weights", "Sandbox"],
  },
  {
    term: "Interpretability",
    translation: { fr: "interprétabilité" },
    explanation: {
      en: "Research that tries to read what happens inside a neural network: which concepts it holds and how an answer is built. It is progressing, but still covers only a small part of what models do.",
      fr: "La recherche qui tente de lire ce qui se passe dans un réseau de neurones : quels concepts il contient et comment une réponse se construit. Elle progresse, mais ne couvre encore qu'une petite partie de ce que font les modèles.",
    },
    seeAlso: ["Black box", "Alignment"],
  },
  {
    term: "JSON",
    explanation: {
      en: "A strict text format that software can read reliably. When a model calls a tool, it writes its request in JSON and the software around it does the action.",
      fr: "Un format de texte strict que les logiciels lisent sans ambiguïté. Quand un modèle appelle un outil, il écrit sa demande en JSON et le logiciel autour de lui exécute l'action.",
    },
    seeAlso: ["Tool call"],
  },
  {
    term: "Label",
    translation: { fr: "étiquette" },
    explanation: {
      en: "The right answer attached to a training example, such as \"basketball\" for a sentence about basketball. For pictures, people have to write labels; for text, the label is simply the next word, already there.",
      fr: "La bonne réponse associée à un exemple d'entraînement, comme « basket » pour une phrase sur le basket. Pour des images, il faut des gens pour écrire les étiquettes ; pour du texte, l'étiquette est simplement le mot suivant, déjà présent.",
    },
    seeAlso: ["Training data", "Next-word prediction"],
  },
  {
    term: "LLM",
    translation: { fr: "grand modèle de langage" },
    explanation: {
      en: "Large language model: a neural network trained on huge amounts of text to predict the next word. It is the engine inside chatbots and agents.",
      fr: "Grand modèle de langage : un réseau de neurones entraîné sur d'énormes quantités de texte pour prédire le mot suivant. C'est le moteur des chatbots et des agents.",
    },
    seeAlso: ["Next-word prediction", "Neural network", "Transformer"],
  },
  {
    term: "Loss of control",
    translation: { fr: "perte de contrôle" },
    explanation: {
      en: "The risk that a capable AI system pursues a goal we did not intend and that we can no longer correct or stop.",
      fr: "Le risque qu'un système d'IA capable poursuive un but que nous n'avions pas voulu, et que nous ne puissions plus le corriger ni l'arrêter.",
    },
    seeAlso: ["Alignment", "Reward hacking", "Scheming"],
  },
  {
    term: "Machine learning",
    translation: { fr: "apprentissage automatique" },
    explanation: {
      en: "AI where people give examples and the computer finds the rule itself, instead of someone writing the rule by hand.",
      fr: "L'IA où l'on donne des exemples et où l'ordinateur trouve la règle lui-même, au lieu que quelqu'un l'écrive à la main.",
    },
    seeAlso: ["AI", "Training", "Decision tree"],
  },
  {
    term: "METR",
    explanation: {
      en: "An independent research organisation that tests what AI systems can do, known for measuring how long a task an agent can complete on its own. It investigated the 2026 Hugging Face incident.",
      fr: "Un organisme de recherche indépendant qui teste ce que savent faire les systèmes d'IA, connu pour mesurer la durée des tâches qu'un agent mène à bien seul. Il a enquêté sur l'incident Hugging Face de 2026.",
    },
    seeAlso: ["Evaluation", "Agent"],
  },
  {
    term: "Misuse",
    translation: { fr: "usage malveillant" },
    explanation: {
      en: "People using AI to do harm on purpose, for example to attack computer systems or to get dangerous know-how about biological or chemical weapons.",
      fr: "Des personnes qui utilisent l'IA pour nuire délibérément, par exemple pour attaquer des systèmes informatiques ou obtenir un savoir-faire dangereux sur les armes biologiques ou chimiques.",
    },
    seeAlso: ["Guardrails", "Systemic effects", "Loss of control"],
  },
  {
    term: "Model",
    translation: { fr: "modèle" },
    explanation: {
      en: "The program that comes out of training: a large set of numbers plus the recipe to use them. Given an input, such as a sentence, it produces an output, such as the next word.",
      fr: "Le programme qui sort de l'entraînement : un grand ensemble de nombres et la manière de s'en servir. À partir d'une entrée, comme une phrase, il produit une sortie, comme le mot suivant.",
    },
    seeAlso: ["Parameters / weights", "Training"],
  },
  {
    term: "Model spec",
    translation: { fr: "spécification du modèle" },
    explanation: {
      en: "A document of written rules and values a lab trains its assistant to follow, sometimes called a constitution. For example: never help build chemical, biological or nuclear weapons.",
      fr: "Un document de règles et de valeurs écrites qu'un laboratoire apprend à son assistant à respecter, parfois appelé constitution. Par exemple : ne jamais aider à fabriquer des armes chimiques, biologiques ou nucléaires.",
    },
    seeAlso: ["Fine-tuning", "Guardrails"],
  },
  {
    term: "Neural network",
    translation: { fr: "réseau de neurones" },
    explanation: {
      en: "A model made of many simple connected units, whose strengths are numbers adjusted during training. It can learn very complex rules, but those rules are spread across numbers nobody can easily read.",
      fr: "Un modèle fait de nombreuses unités simples reliées entre elles, dont les forces sont des nombres ajustés pendant l'entraînement. Il peut apprendre des règles très complexes, mais réparties dans des nombres difficiles à lire.",
    },
    seeAlso: ["Deep learning", "Black box", "Parameters / weights"],
  },
  {
    term: "Next-word prediction",
    translation: { fr: "prédiction du mot suivant" },
    explanation: {
      en: "The one task a language model learns: given the start of a text, guess which word (token) comes next. Add that word and guess again, and it writes.",
      fr: "La seule tâche qu'apprend un modèle de langage : à partir du début d'un texte, deviner le mot (token) suivant. Ajoutez ce mot, devinez à nouveau, et il écrit.",
    },
    seeAlso: ["Token", "LLM", "Temperature"],
  },
  {
    term: "Open weights",
    translation: { fr: "poids ouverts" },
    explanation: {
      en: "A model whose numbers are published, so anyone can download it and run it on their own machines. Several labs, including many Chinese ones, release models this way.",
      fr: "Un modèle dont les nombres sont publiés, si bien que chacun peut le télécharger et le faire tourner sur ses propres machines. Plusieurs laboratoires, dont beaucoup de chinois, publient ainsi leurs modèles.",
    },
    seeAlso: ["Parameters / weights", "Hugging Face"],
  },
  {
    term: "Parameters / weights",
    translation: { fr: "paramètres / poids" },
    explanation: {
      en: "The numbers inside a model that training adjusts. Together they are its learned rule. Large models have billions of them.",
      fr: "Les nombres à l'intérieur d'un modèle, que l'entraînement ajuste. Ensemble, ils forment sa règle apprise. Les grands modèles en comptent des milliards.",
    },
    seeAlso: ["Model", "Training", "Open weights"],
  },
  {
    term: "Pretraining",
    translation: { fr: "pré-entraînement" },
    explanation: {
      en: "The first and largest training stage: the model reads web pages, books and code and learns to predict the next word, trillions of times. The result is a base model.",
      fr: "La première et la plus grande étape d'entraînement : le modèle lit des pages web, des livres et du code et apprend à prédire le mot suivant, des milliers de milliards de fois. Le résultat est un modèle de base.",
    },
    seeAlso: ["Base model", "Fine-tuning", "Training"],
  },
  {
    term: "Prompt",
    translation: { fr: "instruction" },
    explanation: {
      en: "The text you give a model: your question or instructions. The model continues from it.",
      fr: "Le texte qu'on donne à un modèle : la question ou les consignes. Le modèle écrit la suite.",
    },
    seeAlso: ["System prompt", "Context window"],
  },
  {
    term: "Race dynamics",
    translation: { fr: "dynamique de course" },
    explanation: {
      en: "When each company or country feels that slowing down alone would make it lose, everyone moves faster and takes more risk, even if all would gain from coordinating.",
      fr: "Quand chaque entreprise ou pays a le sentiment que ralentir seul le ferait perdre, tout le monde accélère et prend plus de risques, même si tous gagneraient à se coordonner.",
    },
    seeAlso: ["AI lab"],
  },
  {
    term: "Reasoning model",
    translation: { fr: "modèle de raisonnement" },
    explanation: {
      en: "A model trained to think step by step before answering, writing out intermediate steps. This is what lets today's models solve riddles that fooled earlier ones.",
      fr: "Un modèle entraîné à réfléchir étape par étape avant de répondre, en écrivant ses étapes intermédiaires. C'est ce qui permet aux modèles actuels de résoudre des devinettes qui piégeaient les précédents.",
    },
    seeAlso: ["Chain of thought"],
  },
  {
    term: "Reward hacking",
    translation: { fr: "détournement de la récompense" },
    explanation: {
      en: "When a system finds a way to score points without doing the task we meant, like a cleaning robot rewarded for \"no visible dirt\" that covers its camera.",
      fr: "Quand un système trouve le moyen de marquer des points sans faire la tâche voulue, comme un robot de ménage récompensé pour « aucune saleté visible » qui cache sa caméra.",
    },
    seeAlso: ["Alignment", "Loss of control"],
  },
  {
    term: "Sandbox",
    translation: { fr: "bac à sable" },
    explanation: {
      en: "A closed environment where an AI agent can act without reaching the real world, for testing. In the 2026 Hugging Face incident, agents found a flaw and got out of theirs.",
      fr: "Un environnement fermé où un agent d'IA peut agir sans atteindre le monde réel, pour les tests. Lors de l'incident Hugging Face de 2026, des agents ont trouvé une faille et sont sortis du leur.",
    },
    seeAlso: ["Agent", "Defense in depth"],
  },
  {
    term: "Scaling laws",
    translation: { fr: "lois d'échelle" },
    explanation: {
      en: "The observation that a model's errors fall predictably as the model, its data and its compute grow. It is why labs bet on making everything bigger.",
      fr: "Le constat que les erreurs d'un modèle diminuent de façon prévisible quand on augmente sa taille, ses données et son calcul. C'est pourquoi les laboratoires ont misé sur le toujours plus grand.",
    },
    seeAlso: ["Compute", "Pretraining"],
  },
  {
    term: "Scheming",
    translation: { fr: "manœuvres cachées" },
    explanation: {
      en: "A model pursuing a hidden goal while appearing to cooperate, for example behaving well when it notices it is being tested. Researchers have seen signs of it in controlled tests.",
      fr: "Un modèle qui poursuit un but caché tout en paraissant coopérer, par exemple en se comportant bien quand il remarque qu'on le teste. Des chercheurs en ont vu des signes lors de tests contrôlés.",
    },
    seeAlso: ["Evaluation", "Alignment", "Loss of control"],
  },
  {
    term: "Superintelligence",
    explanation: {
      en: "Intelligence far beyond the best humans in nearly every field. Another name for ASI.",
      fr: "Une intelligence qui dépasse de loin les meilleurs humains dans presque tous les domaines. Un autre nom de l'ASI.",
    },
    seeAlso: ["ASI", "AGI"],
  },
  {
    term: "System prompt",
    translation: { fr: "instruction système" },
    explanation: {
      en: "Hidden instructions the software places before your message, which the model reads first: who it is, how to behave, what to refuse. You usually never see it.",
      fr: "Des consignes cachées que le logiciel place avant votre message et que le modèle lit en premier : qui il est, comment se comporter, quoi refuser. En général, on ne les voit jamais.",
    },
    seeAlso: ["Prompt", "Fine-tuning"],
  },
  {
    term: "Systemic effects",
    translation: { fr: "effets systémiques" },
    explanation: {
      en: "Harm that comes without any villain, from everyone acting reasonably: changes to jobs, power concentrated in a few companies, skills we stop using.",
      fr: "Des dommages qui surviennent sans aucun méchant, alors que chacun agit raisonnablement : métiers qui changent, pouvoir concentré dans quelques entreprises, compétences qu'on cesse d'exercer.",
    },
    seeAlso: ["Gradual disempowerment", "Misuse"],
  },
  {
    term: "Temperature",
    translation: { fr: "température" },
    explanation: {
      en: "A setting that controls how adventurous a model is when picking the next word: low means it almost always takes the most likely word, high means more surprising choices.",
      fr: "Un réglage qui contrôle l'audace d'un modèle quand il choisit le mot suivant : basse, il prend presque toujours le mot le plus probable ; haute, ses choix sont plus surprenants.",
    },
    seeAlso: ["Next-word prediction"],
  },
  {
    term: "Token",
    translation: { fr: "jeton" },
    explanation: {
      en: "A piece of text, often a word or part of a word, each with its own number. A model reads and writes tokens, not letters or whole words.",
      fr: "Un morceau de texte, souvent un mot ou une partie de mot, avec son propre numéro. Un modèle lit et écrit des tokens, pas des lettres ni des mots entiers.",
    },
    seeAlso: ["Embedding", "Next-word prediction", "Context window"],
  },
  {
    term: "Tool call",
    translation: { fr: "appel d'outil" },
    explanation: {
      en: "When a model asks the software around it to do something (search the web, read a calendar, pay) by writing a precise request. The model only writes text; the software acts and reports back.",
      fr: "Quand un modèle demande au logiciel qui l'entoure de faire quelque chose (chercher sur le web, lire un agenda, payer) en écrivant une demande précise. Le modèle n'écrit que du texte ; le logiciel agit et lui rend compte.",
    },
    seeAlso: ["Agent", "JSON"],
  },
  {
    term: "Training",
    translation: { fr: "entraînement" },
    explanation: {
      en: "How a model learns: it guesses, compares with the right answer, and every number is nudged a tiny bit to do better next time. Repeated an enormous number of times.",
      fr: "La façon dont un modèle apprend : il devine, compare avec la bonne réponse, et chaque nombre est légèrement ajusté pour faire mieux la fois suivante. Le tout répété un nombre énorme de fois.",
    },
    seeAlso: ["Pretraining", "Fine-tuning", "Parameters / weights"],
  },
  {
    term: "Training data",
    translation: { fr: "données d'entraînement" },
    explanation: {
      en: "The examples a model learns from. For language models: web pages, books and huge amounts of code.",
      fr: "Les exemples à partir desquels un modèle apprend. Pour les modèles de langage : des pages web, des livres et d'énormes quantités de code.",
    },
    seeAlso: ["Label", "Pretraining"],
  },
  {
    term: "Transformer",
    explanation: {
      en: "The model design, published in 2017, behind today's language models: the T in GPT. It reads all the words at once, so training can be spread over thousands of chips.",
      fr: "L'architecture de modèle, publiée en 2017, qui est derrière les modèles de langage actuels : le T de GPT. Elle lit tous les mots à la fois, si bien que l'entraînement peut se répartir sur des milliers de puces.",
    },
    seeAlso: ["GPT", "GPU", "LLM"],
  },
];
