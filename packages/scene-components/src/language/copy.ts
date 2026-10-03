/** Audience- and presenter-facing strings of the language scenes. */
import type { L10n } from "@ai-exhibit/presentation-core";

export const COPY = {
  // Shared status and notices
  loadingModel: { fr: "Chargement du modèle", en: "Loading the model" },
  loadingTokenizer: { fr: "Chargement du tokeniseur", en: "Loading the tokenizer" },
  thinking: { fr: "Le modèle calcule", en: "The model is computing" },
  ready: { fr: "Prêt", en: "Ready" },
  failed: {
    fr: "Le modèle ne répond pas : exemple enregistré.",
    en: "The model is not responding: recorded example.",
  },
  fallback: { fr: "Exemple enregistré", en: "Recorded example" },
  notRecorded: {
    fr: "Cette phrase n'a pas été enregistrée : exemple préparé à la place.",
    en: "This sentence was not recorded: showing a prepared example instead.",
  },
  typingNeedsTokenizer: {
    fr: "Saisie libre seulement avec Hugging Face : ici, les exemples préparés.",
    en: "Free typing needs Hugging Face: prepared examples here.",
  },
  englishNote: {
    fr: "Ce petit modèle a surtout lu de l'anglais.",
    en: "This small model learned mostly from English.",
  },
  model: { fr: "Modèle", en: "Model" },
  promptLanguage: { fr: "Phrase donnée au modèle", en: "Sentence given to the model" },
  french: { fr: "Français", en: "French" },
  english: { fr: "Anglais", en: "English" },
  reset: { fr: "Revenir à la phrase prévue", en: "Back to the planned sentence" },
  edit: { fr: "Modifier la phrase", en: "Edit the sentence" },
  apply: { fr: "Appliquer", en: "Apply" },
  others: { fr: "tout le reste", en: "everything else" },

  // Tokenizer
  tokens: { fr: "tokens", en: "tokens" },
  token: { fr: "token", en: "token" },
  characters: { fr: "caractères", en: "characters" },
  typeHere: { fr: "Tapez une phrase de la salle", en: "Type a sentence from the room" },
  examples: { fr: "Exemples", en: "Examples" },
  tokenizer: { fr: "Tokeniseur", en: "Tokenizer" },
  showIds: { fr: "Montrer les numéros", en: "Show the numbers" },
  hideIds: { fr: "Cacher les numéros", en: "Hide the numbers" },
  pieceOfChar: { fr: "morceau d'un caractère", en: "piece of a character" },
  partialLegend: {
    fr: "Un même caractère peut être coupé en plusieurs tokens.",
    en: "A single character can be split into several tokens.",
  },
  spaceLegend: { fr: "· marque une espace", en: "· marks a space" },

  // Token to vector
  word: { fr: "Le mot", en: "The word" },
  tokenNumber: { fr: "Son numéro", en: "Its number" },
  tableTitle: { fr: "La table du modèle", en: "The model's table" },
  tableRows: { fr: "lignes, une par token", en: "rows, one per token" },
  rowOf: { fr: "ligne", en: "row" },
  vectorTitle: { fr: "Sa liste de nombres", en: "Its list of numbers" },
  numbers: { fr: "nombres", en: "numbers" },
  realNumbers: {
    fr: "Vrais nombres du modèle {model}, appris pendant l'entraînement.",
    en: "Real numbers from the {model} model, learned during training.",
  },
  nextStage: { fr: "Étape suivante", en: "Next stage" },
  previousStage: { fr: "Étape précédente", en: "Previous stage" },
  otherWord: { fr: "Autre mot", en: "Another word" },
  vectorsUnavailable: {
    fr: "Les vecteurs enregistrés sont introuvables.",
    en: "The recorded vectors are missing.",
  },

  // Prediction game
  roomGuesses: { fr: "La salle propose", en: "The room suggests" },
  addGuess: { fr: "Ajouter la réponse de la salle", en: "Add the room's answer" },
  guessPlaceholder: { fr: "Réponse entendue, puis Entrée", en: "Answer heard, then Enter" },
  reveal: { fr: "Révéler le modèle", en: "Reveal the model" },
  hide: { fr: "Cacher le modèle", en: "Hide the model" },
  modelSays: { fr: "Le modèle propose", en: "The model suggests" },
  sentence: { fr: "Phrase", en: "Sentence" },
  sameAsRoom: { fr: "comme la salle", en: "same as the room" },
  clearGuesses: { fr: "Effacer les réponses", en: "Clear the answers" },

  // Next token
  nextToken: { fr: "Token suivant", en: "Next token" },
  compute: { fr: "Calculer la suite", en: "Compute what comes next" },
  temperature: { fr: "Température", en: "Temperature" },
  topK: { fr: "Garder les k meilleurs", en: "Keep the top k" },
  topP: { fr: "Garder jusqu'à p", en: "Keep up to p" },
  off: { fr: "tous", en: "all" },
  greedy: { fr: "Toujours le plus probable", en: "Always the most likely" },
  sample: { fr: "Tirer au sort", en: "Draw at random" },
  draw: { fr: "Tirer un token", en: "Draw a token" },
  draws: { fr: "Tirages", en: "Draws" },
  step: { fr: "Un pas", en: "One step" },
  play: { fr: "Lecture automatique", en: "Autoplay" },
  pause: { fr: "Pause", en: "Pause" },
  freeze: { fr: "Figer", en: "Freeze" },
  unfreeze: { fr: "Libérer", en: "Unfreeze" },
  frozen: { fr: "Figé", en: "Frozen" },
  restart: { fr: "Recommencer", en: "Start over" },
  chosen: { fr: "choisi", en: "chosen" },
  filteredOut: { fr: "écarté", en: "ruled out" },
  loopPredict: { fr: "prédire", en: "predict" },
  loopPick: { fr: "choisir", en: "pick" },
  loopAppend: { fr: "ajouter", en: "append" },
  replayGreedy: {
    fr: "Rejeu enregistré : le modèle prend toujours le plus probable.",
    en: "Recorded replay: the model always takes the most likely token.",
  },
  sampleOnRecorded: {
    fr: "Tirage parmi les candidats enregistrés.",
    en: "Drawing among the recorded candidates.",
  },

  // Base / instruct
  generate: { fr: "Générer", en: "Generate" },
  stop: { fr: "Arrêter", en: "Stop" },
  runBoth: { fr: "Lancer les deux", en: "Run both" },
  baseTitle: { fr: "Modèle de base", en: "Base model" },
  baseSub: { fr: "Il continue le texte.", en: "It continues the text." },
  instructTitle: { fr: "Modèle assistant", en: "Assistant model" },
  instructSub: { fr: "Il répond comme un assistant.", en: "It answers like an assistant." },
  samePrompt: { fr: "Le même texte, deux modèles", en: "The same text, two models" },
  hiddenFormat: { fr: "Ce que l'assistant lit vraiment", en: "What the assistant actually reads" },
  showFormat: { fr: "Montrer le format caché", en: "Show the hidden format" },
  hideFormat: { fr: "Cacher le format", en: "Hide the format" },
  formatNote: {
    fr: "L'assistant aussi continue un texte : une conversation mise en forme, avec des balises.",
    en: "The assistant also continues a text: a formatted conversation, with markers.",
  },
  continuation: { fr: "Suite écrite par le modèle", en: "Continuation written by the model" },
  waiting: { fr: "En attente", en: "Waiting" },
  writing: { fr: "Écrit", en: "Writing" },

  // Model source badge
  sourceHf: { fr: "Hugging Face", en: "Hugging Face" },
  sourceSimulation: { fr: "Enregistré", en: "Recorded" },
  whyCloudNotConfigured: { fr: "pas de jeton Hugging Face sur le serveur", en: "no Hugging Face token on the server" },
  whyCloudCode: { fr: "code d'accès requis", en: "access code required" },
  whyCloudOffline: { fr: "Hugging Face injoignable", en: "Hugging Face unreachable" },
  whyCloudError: { fr: "le modèle cloud a échoué", en: "the cloud model failed" },
  whyFallbackKey: { fr: "mode de secours (F)", en: "fallback mode (F)" },
  barsFromCloud: {
    fr: "Barres : probabilités de {model}, qui lit le texte brut (sans format de conversation). Le modèle de base ne donne pas les siennes.",
    en: "Bars: probabilities from {model}, reading the raw text (no chat format). The base model does not give its own.",
  },
  barsRecorded: {
    fr: "Barres enregistrées ({model}) : seulement pour le texte préparé.",
    en: "Recorded bars ({model}): for the prepared text only.",
  },
  simulationPresetsOnly: {
    fr: "Simulation : seulement les exemples préparés.",
    en: "Simulation: prepared examples only.",
  },
  firstWordOdds: { fr: "Probabilités pour le premier mot :", en: "Probabilities for the first word:" },

  // Base model playground
  mode: { fr: "Mode", en: "Mode" },
  modeOne: { fr: "Un token à la fois", en: "One token at a time" },
  modeMany: { fr: "Plusieurs tokens d'un coup", en: "Several tokens at once" },
  addOneToken: { fr: "Ajouter un token", en: "Add one token" },
  howMany: { fr: "Combien de tokens", en: "How many tokens" },
  addManyTokens: { fr: "Écrire {n} tokens", en: "Write {n} tokens" },

  // Chat playground
  assistantTitle: { fr: "Modèle assistant", en: "Assistant model" },
  assistantSub: {
    fr: "Le même type de modèle, après un entraînement pour répondre.",
    en: "The same kind of model, after training to answer.",
  },
  presetQuestions: { fr: "Questions prêtes", en: "Ready questions" },
  askQuestion: { fr: "Poser une question", en: "Ask a question" },
  send: { fr: "Envoyer", en: "Send" },
  guardrail: { fr: "Demande dangereuse", en: "Harmful request" },
  recordedRefusal: {
    fr: "Refus enregistré de ce modèle. Les petits modèles ne refusent pas de façon fiable.",
    en: "Recorded refusal from this model. Small models do not refuse reliably.",
  },
  clearChat: { fr: "Effacer", en: "Clear" },
  showRaw: { fr: "Montrer le texte caché", en: "Show the hidden text" },
  hideRaw: { fr: "Cacher le texte caché", en: "Hide the hidden text" },
  systemExample: {
    fr: "Consigne système (un exemple) : les assistants reçoivent des instructions comme celle-ci, cachées de vous.",
    en: "System prompt (an example): assistants receive instructions like this one, hidden from you.",
  },
  continuesText: {
    fr: "La réponse reste de la prédiction du mot suivant : le modèle continue ce texte.",
    en: "The answer is still next-word prediction: the model continues this text.",
  },
  endTagNote: {
    fr: "Quand il écrit sa balise de fin, on l'arrête : c'est ainsi qu'il « sait » s'arrêter.",
    en: "When it writes its end tag, it is stopped: that is how it knows when to stop.",
  },
  rawEmpty: {
    fr: "Posez une question pour voir le texte que le modèle reçoit vraiment.",
    en: "Ask a question to see the text the model really receives.",
  },
  noRefusal: {
    fr: "Ce modèle n'a pas refusé cette demande lors de l'enregistrement : sa réponse n'est pas montrée.",
    en: "This model did not refuse this request when recorded: its answer is not shown.",
  },

  // Then and now
  question: { fr: "Question", en: "Question" },
  askGpt2: { fr: "Demander à GPT-2", en: "Ask GPT-2" },
  askAgain: { fr: "Redemander", en: "Ask again" },
  showToday: { fr: "Montrer aujourd'hui", en: "Show today" },
  previousQuestion: { fr: "Question précédente", en: "Previous question" },
  nextQuestion: { fr: "Question suivante", en: "Next question" },
  gpt2Recorded: { fr: "réponse enregistrée d'un vrai GPT-2", en: "recorded answer from a real GPT-2" },
  gpt2English: {
    fr: "GPT-2 n'a appris que l'anglais : on lui pose la question en anglais.",
    en: "GPT-2 is asked in English, the only language it learned.",
  },
  recordedAnswer: { fr: "réponse enregistrée", en: "recorded answer" },
  correctAnswer: { fr: "Bonne réponse", en: "Correct answer" },
  thenTitle: { fr: "Hier", en: "Then" },
  nowTitle: { fr: "Aujourd'hui", en: "Today" },
  nextGeneration: { fr: "Génération suivante", en: "Next generation" },
  previousGeneration: { fr: "Génération précédente", en: "Previous generation" },
  askedInEnglish: { fr: "Question posée en anglais :", en: "Asked in English:" },
  estimatedCost: { fr: "entraînement :", en: "training:" },
  costUnknown: { fr: "coût d'entraînement inconnu", en: "training cost unknown" },
  correctMark: { fr: "Juste", en: "Correct" },
  incorrectMark: { fr: "Faux", en: "Incorrect" },
  publishedBy: {
    fr: "Réponses et coûts d'entraînement estimés publiés par AI Digest, novembre 2023",
    en: "Answers and estimated training costs published by AI Digest, November 2023",
  },
  recapTitle: {
    fr: "Si votre image de l'IA s'est arrêtée aux pièges de l'époque GPT-3, mettez-la à jour.",
    en: "If your picture of AI stopped at GPT-3-era tricks, update it.",
  },
} satisfies Record<string, L10n>;
