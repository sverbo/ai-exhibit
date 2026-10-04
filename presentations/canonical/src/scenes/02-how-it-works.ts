import type { L10n, SceneDefinition } from "@ai-exhibit/presentation-core";
import { partOpener } from "../chapters.ts";

/**
 * Prompt shared by the base-model and chat scenes. The fallback recordings
 * (`recordings-next-token`) are made for exactly these strings. French editions
 * run Qwen2.5-0.5B, English ones SmolLM2-135M (see
 * scene-components/src/language/data.ts).
 */
const baseVsInstructPrompt: L10n = {  en: "How can I sleep better?" };

/**
 * Chapter 02: history and how it works (storyboard v1, scenes 2.1 to 2.19).
 * A very short history first, then the words (AI, machine learning, neural
 * networks), then those eras through one running example (is a
 * sentence about football or basketball?), then language models with the same
 * vocabulary. Numbers and network diagrams appear only in the text classifier
 * scenes and the training scene.
 */
export const chapter02: SceneDefinition[] = [
  partOpener("02", "phow"),
  {
    id: "02-short-history",
    code: "hist",
    steps: 10,
    chapter: "02",
    number: "2.1",
    title: { en: "A very short history" },
    objective: {
      en: "Give a very short history of the field, from Turing's universal machine to Go, the Transformer, GPT-2 and GPT-3.",
    },
    takeaway: {
      en: "AI is an old idea; what changed recently is learning from huge amounts of data.",
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
- Click 7, 2016: AlphaGo beats Lee Sedol at Go, 4 games to 1. Contrast with Deep Blue: Deep Blue followed rules and search written by people; AlphaGo learned from games, first thousands of human games, then games against itself
- Click 8, 2017: the Transformer, the T in GPT: it reads all the words at once, so training spreads over thousands of chips; far faster, but hungry for electricity. Clicks 9 and 10: GPT-2 (2019) and GPT-3 (2020), models only, no company names yet`,
    },
    transitionIn: { en: "Before opening the box, where it comes from." },
    transitionOut: { en: "These eras left us a few words. How do they fit together?" },
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
      "st-deepmind-alphago",
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
    id: "02-envelopes",
    code: "nest",
    steps: 3,
    chapter: "02",
    number: "2.2",
    title: { en: "AI, machine learning, neural networks" },
    objective: {
      en: "Place the words: AI contains machine learning, which contains neural networks, which contain language models.",
    },
    takeaway: {
      en: "AI is the big family; language models are one small, recent branch of it.",
    },
    visual: { layout: "component", component: "AIEnvelopes", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- AI: anything that imitates human intelligence, even rules written by people
- Machine learning: the rules are learned from examples
- Neural networks, also called "deep learning" (many layers): one way of learning, loosely inspired by the brain
- Language models (LLMs): neural networks trained on text
- Each circle sits inside the previous one`,
    },
    transitionIn: { en: "From the history to the words it left us." },
    transitionOut: {
      en: "To see the difference between these words, one simple example.",
    },
    evidenceLevel: "none",
    sourceIds: [],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
  },
  {
    id: "02-text-task",
    code: "ball",
    steps: 1,
    chapter: "02",
    number: "2.3",
    title: { en: "Football or basketball?" },
    objective: {
      en: "Introduce the running example: decide whether a short sentence is about football or basketball.",
    },
    takeaway: {
      en: "Obvious for us, and surprisingly hard to explain to a computer.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "task" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Our running example: short sentences about sport
- The task: is this sentence about football or basketball?
- **Ask:** which words give it away?
- **Do:** next: a few labelled sentences for each sport
- Obvious for us; how would you explain it to a computer?`,
    },
    transitionIn: { en: "From the words to one concrete task." },
    transitionOut: { en: "First idea: write the rule ourselves." },
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
    code: "rule",
    steps: 1,
    chapter: "02",
    number: "2.4",
    title: { en: "Write the rule" },
    objective: {
      en: "Show classic AI: a person writes a keyword rule, which works on many sentences and fails on others.",
    },
    takeaway: {
      en: "Rules written by hand work until they meet a case nobody thought of.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "rules" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Classic AI: a person writes the rule
- Here: a list of keywords for each sport
- Right on 18 of the 24 examples
- **Do:** a basketball sentence with "kicked" in it: the rule says football
- Every exception needs a new rule, written by hand`,
    },
    transitionIn: { en: "The first answer to the question." },
    transitionOut: { en: "What if the computer found the rule itself?" },
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
    code: "tree",
    steps: 2,
    chapter: "02",
    number: "2.5",
    title: { en: "Learn the rule" },
    objective: {
      en: "Show machine learning: a decision tree learns its questions from labelled sentences.",
    },
    takeaway: {
      en: "In machine learning, people give examples and the computer finds the rule.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "tree" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- We give 24 sentences, each labelled by a person
- **Do:** the learned tree, alone. Its only question: "does the sentence contain the word X?"
- It picked the question that best separates the examples, then repeated: "net"? basketball. Else "hoop"? basketball. Else football
- **Do:** one example goes down the tree: path lit, word found marked, answer on the right
- **Do:** "Next example" for more. "Previous example" from the first jumps to its one mistake (a dunk: no net, no hoop)
- Right on 23 of 24, and nobody wrote this rule`,
    },
    transitionIn: { en: "From writing rules to learning them." },
    transitionOut: { en: "Let's look at what it actually learned." },
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
    code: "weird",
    steps: 1,
    chapter: "02",
    number: "2.6",
    title: { en: "A strange rule" },
    objective: {
      en: "Let the room spot the odd rule the tree learned by itself, then show a new sentence falling into it.",
    },
    takeaway: {
      en: "A learned rule can be odd; with a tree, at least, we can open the hood and see it.",
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
    },
    transitionIn: { en: "The learned rule, looked at closely." },
    transitionOut: { en: "To do better: a neural network." },
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
    code: "nnet",
    steps: 3,
    chapter: "02",
    number: "2.7",
    title: { en: "A neural network" },
    objective: {
      en: "Show that a small neural network trained on many more sentences is far more accurate, and that its rule is thousands of numbers.",
    },
    takeaway: {
      en: "A neural network is far better, and its rule is a block of numbers nobody wrote.",
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
    },
    transitionIn: { en: "To do better: a neural network." },
    transitionOut: { en: "But where do those weights come from?" },
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
    code: "learn",
    steps: 4,
    chapter: "02",
    number: "2.8",
    title: { en: "How a network learns" },
    objective: {
      en: "Show the learning loop on one sentence: guess, compare with the right answer, nudge every connection a little, try again.",
    },
    takeaway: {
      en: "Learning is a tiny correction after each mistake, repeated thousands of times.",
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
    },
    transitionIn: { en: "But where do those weights come from?" },
    transitionOut: { en: "Trained, accurate. And yet." },
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
    code: "nums",
    steps: 2,
    chapter: "02",
    number: "2.9",
    title: { en: "Only numbers" },
    objective: {
      en: "Show the network failing on a new sentence, and that opening it shows only numbers: we can test it, not know in advance.",
    },
    takeaway: {
      en: "We can test a neural network; we cannot know in advance where it will fail.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "network-fail" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Excellent on average, and yet: a new football sentence, the network says basketball, 96% sure
- **Do:** open the hood: the same diagram, every weight is there
- No line says why, unlike the tree's odd "net" rule
- We can test it; we cannot know in advance where it will fail`,
    },
    transitionIn: { en: "Trained, accurate. And yet." },
    transitionOut: { en: "This is not just a toy problem." },
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
    code: "photo",
    steps: 1,
    chapter: "02",
    number: "2.10",
    title: { en: "Google Photos, 2015" },
    objective: {
      en: "Show a documented case where a powerful learned classifier produced a severe error nobody caught before release.",
    },
    takeaway: {
      en: "A very capable learned system can still fail badly, in ways nobody saw coming.",
    },
    visual: {
      layout: "component",
      component: "SingleCase",
      props: {
        picture: "photo-app",
        title: { en: "Google Photos" },
        line: {
          en: "A photo app labelled two Black people “gorillas”. Nobody wrote that rule; it came from learning.",
        },
        date: "2015",
        evidence: "observed",
        outcome: {
          en: "Often, neither the model nor the engineers are the problem: models learn from data that reflects our society, with its gaps and biases. Yet we want them to do better than that past.",
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
    },
    transitionIn: { en: "From our toy sentences to a real image classifier used by millions." },
    transitionOut: { en: "Now, the same ideas applied to language." },
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
    code: "next",
    steps: 4,
    chapter: "02",
    number: "2.11",
    title: { en: "Predict the next word" },
    objective: {
      en: "Show that a language model makes the same kind of choice as the sport classifier, but among every token of its vocabulary.",
    },
    takeaway: {
      en: "A language model is a classifier whose labels are every possible next word.",
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
    },
    transitionIn: { en: "From labelling sentences to predicting words." },
    transitionOut: { en: "This simple change gives two superpowers." },
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
    code: "scale",
    steps: 3,
    chapter: "02",
    number: "2.12",
    title: { en: "Two superpowers, one bet" },
    objective: {
      en: "Explain why next-word prediction changed everything: it generates, it needs no human labels, and it rewards sheer scale.",
    },
    takeaway: {
      en: "Almost unlimited data plus one simple task: the bet was to scale it up, and it paid off.",
    },
    visual: {
      layout: "cards",
      heading: { en: "Two superpowers, one bet" },
      cards: [
        {
          title: { en: "It writes" },
          body: {
            en: "A classifier stops at its answer. Here the answer goes back in: add the word, predict again.",
          },
        },
        {
          title: { en: "Almost unlimited data" },
          body: {
            en: "Sorting images needs people to label them. Here the label is the next word, already in the text.",
          },
          sourceIds: ["tk-wiki-recaptcha"],
        },
        {
          title: { en: "The bet: scale" },
          body: {
            en: "Keep the same simple task; make the model and the data vastly bigger. GPT-2 rambles, GPT-3 stuns.",
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
    },
    transitionIn: { en: "Why this one change matters so much." },
    transitionOut: { en: "So how does it learn from all that text?" },
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
    code: "train",
    steps: 4,
    chapter: "02",
    number: "2.13",
    title: { en: "How training works" },
    objective: {
      en: "Explain training as a loop: read a text up to a point, let the model guess the next word, measure the error, nudge the numbers, move one word forward.",
    },
    takeaway: {
      en: "Training is a tiny correction on the next word, repeated trillions of times.",
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
    },
    transitionIn: { en: "Free labels, put to work: the training loop." },
    transitionOut: { en: "But a computer does not read words: what does it really see?" },
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
    code: "tokn",
    steps: 1,
    chapter: "02",
    number: "2.14",
    title: { en: "Tokens" },
    objective: {
      en: "See live that a language model reads tokens, pieces of text with a number each, not words.",
    },
    takeaway: {
      en: "To the model, text is a sequence of numbered pieces.",
    },
    visual: { layout: "component", component: "TokenizerPlayground", props: { showIds: true } },
    interaction: "network",
    speakerNotes: {
      en: `- The model doesn't read words: it reads tokens
- A token: a whole word, part of a word, or a space and a letter
- **Ask:** give me a word or a sentence; type it
- **Do:** next step: each token has a number in a fixed dictionary
- The number says nothing about meaning yet`,
    },
    transitionIn: { en: "From words to what the model actually reads." },
    transitionOut: { en: "A number has no meaning. So how does meaning get in?" },
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
    code: "embed",
    steps: 2,
    chapter: "02",
    number: "2.15",
    title: { en: "Words as points" },
    objective: {
      en: "Show that each word becomes a list of numbers, a point in space, scattered before training and organized after.",
    },
    takeaway: {
      en: "Training moves words with related meanings close together.",
    },
    visual: { layout: "component", component: "EmbeddingExplorer", props: { mode: "training" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Our classifier only knew whether a word was there; richer: give each word a list of numbers
- That list is a point in space
- Before training: the points are scattered at random
- **Do:** play: the training loop we saw, repeated on huge amounts of text, gathers related words
- The animation is illustrative; the final map is real`,
    },
    transitionIn: { en: "From numbered pieces to points with meaning." },
    transitionOut: { en: "Let's explore the map with your words." },
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
    code: "play",
    steps: 0,
    chapter: "02",
    number: "2.16",
    title: { en: "Play with the map" },
    objective: {
      en: "Let the room suggest words, compute them live, and read their nearest neighbours.",
    },
    takeaway: {
      en: "Closeness of meaning becomes something we can measure.",
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
    },
    transitionIn: { en: "The prepared map becomes interactive." },
    transitionOut: { en: "So what comes out of all that training?" },
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
    code: "base",
    steps: 0,
    chapter: "02",
    number: "2.17",
    title: { en: "A base model" },
    objective: {
      en: "Show that a model straight out of pretraining just continues text, one token or several at a time.",
    },
    takeaway: {
      en: "Pretraining gives a text continuer, not an assistant.",
    },
    visual: { layout: "component", component: "BaseModelPlayground", props: { prompt: baseVsInstructPrompt } },
    interaction: "network",
    speakerNotes: {
      en: `- This is "pretraining": exactly the next-word loop we saw, on a huge amount of text, nothing more
- **Do:** ask a question; it continues the page instead of answering
- **Do:** one token: show the bars, raise the temperature, draw one
- **Do:** several tokens: let it write on
- Temperature (default 1, for the next press): 0 always takes the most likely token, higher picks more surprising ones
- Here: Llama 3.1 8B, Meta's base model; the bars come from a larger sibling, Llama 3.3 70B Instruct, reading the same raw text (the base model's provider gives no probabilities), and the screen says so
- This model runs on Hugging Face, the public library where AI models are shared: remember that name
- It is neither helpful nor harmful: it imitates plausible text`,
    },
    transitionIn: { en: "We run the result of pretraining." },
    transitionOut: { en: "So how does it become an assistant?" },
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
    code: "tuned",
    steps: 1,
    chapter: "02",
    number: "2.18",
    title: { en: "A fine-tuned assistant" },
    objective: {
      en: "Show that further training on questions and answers, plus guardrails, turns a base model into an assistant.",
    },
    takeaway: {
      en: "Fine-tuning is what turns a text continuer into an assistant.",
    },
    visual: { layout: "component", component: "ChatPlayground", props: { prompt: baseVsInstructPrompt } },
    interaction: "network",
    speakerNotes: {
      en: `- Same kind of model, trained further on questions and answers (here Llama 3.1 8B Instruct, the assistant version of the base model we just used)
- **Do:** same question as before: now it answers
- Temperature (default 1, for the next question): 0 always takes the most likely token, higher picks more surprising ones
- It also learned which of two answers is preferred
- Guardrails: it is trained to refuse some requests
- **Do:** show the guardrail example (a recorded real refusal)
- Refusals are trained, and training can fail: this one refuses the bomb question (recorded); large assistants add far more safety training and filters
- **Do:** next step: what the model really reads: a hidden system prompt, role tags, the question, then "assistant:" and it continues
- Still next-word prediction: it writes the answer, then an end tag that tells the software to stop (here "<|eot_id|>")
- This step is what makes a chatbot`,
    },
    transitionIn: { en: "From the base model to its assistant version." },
    transitionOut: { en: "But examples are not the only thing shaping it." },
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
    code: "shape",
    steps: 3,
    chapter: "02",
    number: "2.19",
    title: { en: "How an assistant is shaped" },
    objective: {
      en: "Show the three layers that shape an assistant: example conversations, written rules, and classifiers around the model.",
    },
    takeaway: {
      en: "An assistant is a pretrained model, taught a style and written rules, and watched by classifiers.",
    },
    visual: {
      layout: "cards",
      heading: { en: "Three layers around the same model" },
      cards: [
        {
          title: { en: "Example conversations" },
          body: {
            en: "Thousands of questions and good answers teach it the style of an assistant.",
          },
          sourceIds: ["fnd-instructgpt"],
        },
        {
          title: { en: "Written rules" },
          body: {
            en: "A \"constitution\" or \"model spec\" says what it must and must not do, for example: never help build chemical, biological or nuclear weapons.",
          },
          sourceIds: ["tk-openai-model-spec-2026", "tk-anthropic-constitution"],
        },
        {
          title: { en: "Classifiers around it" },
          body: {
            en: "Separate classifiers, like our football or basketball one, screen what goes in and what comes out, and block dangerous requests.",
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
    },
    transitionIn: { en: "But examples are not the only thing shaping it." },
    transitionOut: { en: "Who builds these models?" },
    evidenceLevel: "observed",
    sourceIds: ["fnd-instructgpt", "tk-openai-model-spec-2026", "tk-anthropic-constitution", "fnd-anthropic-constitutional-classifiers"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 120,
    optional: true,
  },
];
