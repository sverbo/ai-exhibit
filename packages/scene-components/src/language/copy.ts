/** Audience- and presenter-facing strings of the language scenes. */
import type { L10n } from "@ai-exhibit/presentation-core";

export const COPY = {
  // Shared status and notices
  loadingModel: {  en: "Loading the model" },
  loadingTokenizer: {  en: "Loading the tokenizer" },
  thinking: {  en: "The model is computing" },
  ready: {  en: "Ready" },
  failed: {
    en: "The model is not responding: recorded example.",
  },
  fallback: {  en: "Recorded example" },
  notRecorded: {
    en: "This sentence was not recorded: showing a prepared example instead.",
  },
  typingNeedsTokenizer: {
    en: "Free typing needs Hugging Face: prepared examples here.",
  },
  englishNote: {
    en: "This small model learned mostly from English.",
  },
  model: {  en: "Model" },
  promptLanguage: {  en: "Sentence given to the model" },
  french: { fr: "Français", en: "French" },
  english: { fr: "Anglais", en: "English" },
  reset: {  en: "Back to the planned sentence" },
  edit: {  en: "Edit the sentence" },
  apply: {  en: "Apply" },
  others: {  en: "everything else" },

  // Tokenizer
  tokens: {  en: "tokens" },
  token: {  en: "token" },
  characters: {  en: "characters" },
  typeHere: {  en: "Type a sentence from the room" },
  examples: {  en: "Examples" },
  tokenizer: {  en: "Tokenizer" },
  showIds: {  en: "Show the numbers" },
  hideIds: {  en: "Hide the numbers" },
  pieceOfChar: {  en: "piece of a character" },
  partialLegend: {
    en: "A single character can be split into several tokens.",
  },
  spaceLegend: {  en: "· marks a space" },

  // Token to vector
  word: {  en: "The word" },
  tokenNumber: {  en: "Its number" },
  tableTitle: {  en: "The model's table" },
  tableRows: {  en: "rows, one per token" },
  rowOf: {  en: "row" },
  vectorTitle: {  en: "Its list of numbers" },
  numbers: {  en: "numbers" },
  realNumbers: {
    en: "Real numbers from the {model} model, learned during training.",
  },
  nextStage: {  en: "Next stage" },
  previousStage: {  en: "Previous stage" },
  otherWord: {  en: "Another word" },
  vectorsUnavailable: {
    en: "The recorded vectors are missing.",
  },

  // Prediction game
  reveal: {  en: "Reveal the model" },
  hide: {  en: "Hide the model" },
  modelSays: {  en: "The model suggests" },
  sentence: {  en: "Sentence" },
  sameAsRoom: {  en: "same as the room" },
  clearGuesses: {  en: "Clear the answers" },

  // Next token
  nextToken: {  en: "Next token" },
  compute: {  en: "Compute what comes next" },
  temperature: {  en: "Temperature" },
  topK: {  en: "Keep the top k" },
  topP: {  en: "Keep up to p" },
  off: {  en: "all" },
  greedy: {  en: "Always the most likely" },
  sample: {  en: "Draw at random" },
  draw: {  en: "Draw a token" },
  draws: {  en: "Draws" },
  step: {  en: "One step" },
  play: {  en: "Autoplay" },
  pause: {  en: "Pause" },
  freeze: {  en: "Freeze" },
  unfreeze: {  en: "Unfreeze" },
  frozen: {  en: "Frozen" },
  restart: {  en: "Start over" },
  chosen: { fr: "choisi", en: "chosen" },
  filteredOut: {  en: "ruled out" },
  loopPredict: {  en: "predict" },
  loopPick: {  en: "pick" },
  loopAppend: {  en: "append" },
  replayGreedy: {
    en: "Recorded replay: the model always takes the most likely token.",
  },
  sampleOnRecorded: {
    en: "Drawing among the recorded candidates.",
  },

  // Base / instruct
  generate: {  en: "Generate" },
  stop: { fr: "Arrêter", en: "Stop" },
  runBoth: {  en: "Run both" },
  baseTitle: {  en: "Base model" },
  baseSub: {  en: "It continues the text." },
  instructTitle: {  en: "Assistant model" },
  instructSub: {  en: "It answers like an assistant." },
  samePrompt: {  en: "The same text, two models" },
  hiddenFormat: {  en: "What the assistant actually reads" },
  showFormat: {  en: "Show the hidden format" },
  hideFormat: {  en: "Hide the format" },
  formatNote: {
    en: "The assistant also continues a text: a formatted conversation, with markers.",
  },
  continuation: {  en: "Continuation written by the model" },
  waiting: {  en: "Waiting" },
  writing: {  en: "Writing" },

  // Model source badge
  sourceHf: {  en: "Hugging Face" },
  sourceSimulation: {  en: "Recorded" },
  whyCloudNotConfigured: {  en: "no Hugging Face token on the server" },
  whyCloudCode: {  en: "access code required" },
  whyCloudOffline: {  en: "Hugging Face unreachable" },
  whyCloudError: {  en: "the cloud model failed" },
  whyFallbackKey: {  en: "fallback mode (F)" },
  barsFromCloud: {
    en: "Bars: probabilities from {model}, reading the raw text (no chat format). The base model does not give its own.",
  },
  barsRecorded: {
    en: "Recorded bars ({model}): for the prepared text only.",
  },
  simulationPresetsOnly: {
    en: "Simulation: prepared examples only.",
  },
  firstWordOdds: {  en: "Probabilities for the first word:" },

  // Base model playground
  mode: {  en: "Mode" },
  modeOne: {  en: "One token at a time" },
  modeMany: {  en: "Several tokens at once" },
  addOneToken: {  en: "Add one token" },
  howMany: {  en: "How many tokens" },
  addManyTokens: {  en: "Write {n} tokens" },

  // Chat playground
  assistantTitle: {  en: "Assistant model" },
  assistantSub: {
    en: "The same kind of model, after training to answer.",
  },
  presetQuestions: {  en: "Ready questions" },
  askQuestion: {  en: "Ask a question" },
  send: {  en: "Send" },
  guardrail: {  en: "Harmful request" },
  recordedRefusal: {
    en: "Recorded refusal from this model. Small models do not refuse reliably.",
  },
  clearChat: {  en: "Clear" },
  showRaw: {  en: "Show the hidden text" },
  hideRaw: {  en: "Hide the hidden text" },
  systemExample: {
    en: "System prompt (an example): assistants receive instructions like this one, hidden from you.",
  },
  continuesText: {
    en: "The answer is still next-word prediction: the model continues this text.",
  },
  endTagNote: {
    en: "When it writes its end tag, it is stopped: that is how it knows when to stop.",
  },
  rawEmpty: {
    en: "Ask a question to see the text the model really receives.",
  },
  noRefusal: {
    en: "This model did not refuse this request when recorded: its answer is not shown.",
  },

  // Then and now
  question: {  en: "Question" },
  previousQuestion: {  en: "Previous question" },
  nextQuestion: {  en: "Next question" },
  gpt2Recorded: {  en: "recorded answer from a real GPT-2" },
  recordedAnswer: {  en: "recorded answer" },
  thenTitle: {  en: "Then" },
  nowTitle: {  en: "Today" },
  askedInEnglish: {  en: "Asked in English:" },
  /** Label before the translation of an English model answer (never a model output itself). */
  translation: {  en: "Translation:" },
  estimatedCost: {  en: "training:" },
  costUnknown: {  en: "training cost unknown" },
  correctMark: {  en: "Correct" },
  incorrectMark: {  en: "Incorrect" },
  publishedBy: {
    en: "Answers and estimated training costs published by AI Digest, November 2023",
  },
  recapTitle: {
    en: "If your picture of AI stopped at GPT-3-era tricks, update it.",
  },
  // Then and now, live step
  liveQuestion: { en: "Question for the live models" },
  liveAsk: { en: "Ask" },
  livePlaceholder: { en: "How many r's are in strawberry?" },
  liveWaiting: { en: "Waiting" },
  liveThinking: { en: "Thinking" },
  liveCut: { en: "cut at the length limit" },
  liveStreamCut: { en: "the connection ended before this answer did" },
  liveNoAnswer: { en: "No answer:" },
  liveEmpty: { en: "(empty answer)" },
  billionParams: { en: "billion parameters" },
} satisfies Record<string, L10n>;
