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
 * Chapter 02: history and how it works (storyboard v1, scenes 2.1 to 2.21).
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
      en: "AI is an old idea; of its two schools, writing knowledge by hand or letting the machine learn, learning from data at huge scale has won.",
    },
    visual: { layout: "component", component: "AITimeline", props: { range: "ai" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Start, 1936: **Alan Turing** describes the universal machine, one machine that can run any step-by-step procedure: the theory behind every computer (Babbage and Ada Lovelace had imagined a programmable machine a century earlier)
- You may have seen the film **The Imitation Game** (2014, Benedict Cumberbatch): Turing at Bletchley Park
- Click 1, 1939 to 1945: Turing helps break **Enigma**. Polish cryptanalysts (Rejewski, Różycki, Zygalski) broke it first and shared their methods in July 1939
- The **Bombe** starts from a **guessed word** in the message ("Wetterbericht", weather report) and searches for the Enigma settings that fit. Let the search run (about 12 seconds); "Replay the search" restarts it
- Why I like it: the size and design of the machine were chosen by people, like a model's **hyperparameters** (its shape, how many neurons). But the position of each rotor is not set by hand: the machine finds it from a piece of data
- Once found, every message **of that day and that network** decodes: the settings changed every day. About **1.6 × 10^20** possible settings; the Bombe does not try them all, logic rules out whole families at once
- Not AI, and say so: it is a **search** that rejects contradictions, from a single example, with no reward. But the picture holds: a big machine that, from data, finds by itself the exact setting of its little gears
- Click 2, 1956: the name "artificial intelligence". Click 3, 1958: the **perceptron**, the first neural network that learns; the press already promises a computer that will read
- Two schools, all along: those who **write knowledge in** by hand (symbolic AI: McCarthy, Minsky, Newell and Simon) and those who **let the machine learn** (connectionism: Rosenblatt's perceptron, later Hinton, LeCun, Bengio). The famous duel: Minsky against Rosenblatt
- Click 4, the **AI winters** (two of them, 1970s and late 1980s): promises unmet, simple networks hit their limits (Minsky and Papert, 1969), expert systems proved brittle, funding dried up. Also, not enough **computing power**: what we do today is possible because we can build the hardware for it
- Click 5, 1997: **Deep Blue** beats Kasparov: classic AI, search (about 200 million positions a second) plus scoring rules written by people. A point for the "knowledge" school
- Click 6, 2012: **AlexNet**, a neural network for images (a CNN), wins ImageNet (top-5 error 15.3%, the next best 26.2%), trained on two gaming graphics cards: deep learning takes off
- Click 7, 2016: **AlphaGo** beats Lee Sedol, 4 games to 1; many experts expected it a decade later. It learned from games: first human games, then games against itself
- Spoiler: the school that lets the machine learn has clearly won. Rich Sutton called it **"The Bitter Lesson"** (2019): general methods that use more computing beat built-in human knowledge. Often the winner is simple, with lots of data, lots of computing, lots of money
- Click 8, 2017: the **Transformer** (Google), the **T in GPT**. Just remember: a mathematical trick to process all the words **in parallel** instead of one after another, so training spreads over thousands of chips at once. It made possible models that could never have been trained before, at an enormous electricity cost
- Click 9, 2019: **GPT-2**, barely noticed by the public (still often incoherent), though OpenAI first called it too dangerous to release in full
- Click 10, 2020: **GPT-3**, the big bet: 100 times bigger, a few million dollars of computing (about $2.1 million according to Epoch AI; AI Digest says about $690,000), not counting research. It worked: developers and researchers were stunned
- The public boom came two years later: **ChatGPT**, 30 November 2022, built on **GPT-3.5**, a GPT-3 trained further to chat. That difference is the base model and assistant story at the end of this chapter`,
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
      "tk-imitation-game-2014",
      "tk-enigma-keyspace",
      "tk-sutton-2019-bitter-lesson",
      "tk-chatgpt-2022-gpt35",
      "tk-epoch-notable-models",
      "tk-aidigest-2023-progress",
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
      en: "\"AI\" is a buzzword for a big family: today it mostly means machine learning, often neural networks, and language models are one recent branch.",
    },
    visual: { layout: "component", component: "AIEnvelopes", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- "Artificial intelligence" is a buzzword: it means everything and nothing. Today, "AI" usually means **machine learning**, and often **neural networks**
- **AI**: anything that imitates intelligence, even rules written by people
- **Classic AI is a lecture**: you listen to the teacher. The teacher must give their time and can be wrong; the student can be faster and more tireless than the teacher, but will not think differently from them (Deep Blue beat Kasparov, but invented no new idea of chess)
- **Machine learning**: the model learns by itself. It is a **practical class**: the exercise is not enough, it must be **corrected**. Without correction, the student never learns from mistakes
- Correction needs **labels**: plenty of images are useless to tell a car from a motorbike if nobody says which is which. That is why CAPTCHAs ask you to click on traffic lights (we come back to it)
- The catch: it needs **a lot of data**
- **Neural networks** (also "deep learning", many layers): one kind of machine learning, loosely inspired by the brain. Neurons are linked by synapses whose strength changes as we learn; part of the wiring is there at birth (evolution), the rest forms throughout life. An artificial "weight" imitates that strength
- A brain has about **86 billion** neurons, each linked to thousands of others; in an artificial network, each neuron of a layer is often linked to every neuron of the next layer
- **Language models (LLMs)**, GPT and the others: neural networks with a precise architecture (the Transformer), built to generate text; coming later
- Each circle sits inside the previous one`,
    },
    transitionIn: { en: "From the history to the words it left us." },
    transitionOut: {
      en: "To see the difference between these words, one simple example.",
    },
    evidenceLevel: "none",
    sourceIds: [
      "tk-azevedo-2009-neuron-count",
    ],
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
      en: "Sorting sentences by sport is obvious for us, and surprisingly hard to explain to a computer.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "task" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Our running example: classify short sentences, **football or basketball**
- Question to the room: which words give it away?
- Next click: a few labelled sentences for each sport
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
      en: `- First way: write the rule by hand. That is **classic AI**, really a program: a list of keywords for each sport
- Right on 18 of the 24 examples
- A basketball sentence with "kicked" in it: the rule says football
- Every exception needs a new rule, written by hand: tedious
- With a lot of time and clever tricks, hand-written programs can look like magic: a chess program cannot explore every position, so a lot of genius went into choosing what to explore. Still, it is code written by people: AI in the broad sense`,
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
      en: "In machine learning, people give labelled examples and the computer finds the rule by itself.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "tree" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Classic **machine learning**: we give many sentences, each labelled by a person (here 24), and a program builds its own **decision tree**
- Such programs exist since the 1980s: once you have the data, they do it alone
- The learned tree, alone. Its only question: "does the sentence contain the word X?" It picked the question that best separates the examples, then repeated: "net"? basketball. Else "hoop"? basketball. Else football
- One example goes down the tree: path lit, word found marked, answer on the right. "Next example" for more; "Previous example" from the first jumps to its one mistake (a dunk: no net, no hoop)
- Right on 23 of 24, and nobody wrote this rule
- Here it looks simple; real methods are more complex: they optimise mathematically, count which words appear with which, and combine hundreds of trees. Tree methods are still the best tools on table-like data today, ahead of deep learning`,
    },
    transitionIn: { en: "From writing rules to learning them." },
    transitionOut: { en: "Let's look at what it actually learned." },
    evidenceLevel: "none",
    sourceIds: [
      "tk-grinsztajn-2022-tabular",
    ],
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
      en: "A learned rule can be absurd, but with a tree we can see it before it does any harm.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "tree-unseen" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- The tree we just trained, and a new sentence: "The striker smashed the ball into the back of the net."
- Question to the room: what will the tree answer? Let them read the tree. They will say: it is going to fail
- Reveal: to us, football; the tree says basketball. "net" lights up: no football example mentioned a net
- The good news: **we could see it in advance**, by opening the tree. Remove "net": now it says football
- A real, more serious case: a widely used US health algorithm chose who got extra care (tools of this kind cover about 200 million people a year). It predicted **health costs** as a stand-in for health needs; less had been spent on Black patients at the same level of illness, so it judged them healthier. Once fixed, the share of Black patients selected went from **17.7% to 46.5%** (Obermeyer et al., Science, 2019)
- Two lessons: the bias came from past data, and it **never wore its name** (no "skin colour" rule, just "past costs"). In a small tree you can spot an odd rule; real systems combine hundreds of trees, and then nobody reads them either
- Still, a model you can inspect lets you find the problem before years of harm, not after`,
    },
    transitionIn: { en: "The learned rule, looked at closely." },
    transitionOut: { en: "To do better: a neural network." },
    evidenceLevel: "none",
    sourceIds: [
      "tk-obermeyer-2019-health-algorithm",
    ],
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
      en: "A neural network does far better than the tree, and what comes out is always a probability.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "network" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- To do better than the tree: a **neural network** (a simplified view of the real one: 200 words, 16 neurons, 3,249 connections)
- Words go in: as many input neurons as inputs. For an image, one per pixel and per colour channel (**red, green, blue**): a 224 × 224 image is 150,528 numbers. Words must first become numbers: we come back to that
- Every connection is a number, a **weight**: thick means strong, colour means "pushes towards football" or "towards basketball". Each neuron adds up what reaches it
- Out come as many neurons as classes, turned into **probabilities that add up to 100%**: football, over 99%; the trap sentence is right this time
- It is only maths, multiplications and additions, and what comes out is always a probability. Well trained, it is often close to 0% or 100%, and we take the highest
- Not always: a sentence about both sports could give 40/60. A company can set a rule: if no label reaches 95%, we say "we don't know" and ask a human
- Caveat: networks are often **overconfident**; their "96%" is not right 96 times in 100 (we see one fail in two slides)
- On 200 new sentences: tree 58%, network 99.5%. But where do those weights come from?`,
    },
    transitionIn: { en: "To do better: a neural network." },
    transitionOut: { en: "But where do those weights come from?" },
    evidenceLevel: "none",
    sourceIds: [
      "tk-guo-2017-calibration",
    ],
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
      en: "Learning means nudging every weight a little after each example, thousands of times; once trained, the weights are frozen.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "learning" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- **Gradient descent**, in a picture: a **road network** with roads more or less wide. After each trip, we look at where the car ended and where it should have ended, and widen or narrow every road a tiny bit, in the direction that would have brought it closer to the right exit. In the end, any car that enters arrives at the right place
- (Another classic picture: a hiker in the fog who always steps down the steepest slope)
- At first the weights are **random**, so the network guesses at random: a basketball sentence, it says "football, 56%" (only 44% basketball)
- Compare with the right answer: the gap is the **error**. Nudge every connection a little in the direction that would have helped; watch the lines change, a few show before and after
- Same sentence again: basketball 75% (one step, enlarged so you can see it)
- It corrects on **every example**, not only on mistakes: a right answer at 60% is still pushed towards 100%
- Then thousands of sentences: guess, compare, nudge, repeat; the score climbs to 99.5%
- Key point: the weights change **only during training**. At prediction time (inference) they are **frozen**, and anything can go through. A chatbot does not learn from your conversation while it answers you`,
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
      en: "We can test a neural network, but we cannot know in advance where it will fail.",
    },
    visual: { layout: "component", component: "TextClassifierLab", props: { stage: "network-fail" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- Under the hood it is gibberish: do not spend long here. In the end, the network is **a block of numbers**, and we cannot read anything from it
- Excellent on average, and yet: a new football sentence, the network says basketball, **96% sure**
- Open the hood: the same diagram, every weight is there; no line says why, unlike the tree's odd "net" rule
- In practice it works much better than classic machine learning, but needs much more data and is heavier to train: classic machine learning (not deep learning) is still useful
- **We can test it; we cannot know in advance where it will fail**
- A research field, **interpretability**, is starting to read some mechanisms inside large models (more in "What we can do"); it is partial, far from full control`,
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
      en: "Nobody wrote a racist rule: the error came out of learning, from data with a gap.",
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
- June 2015: Google Photos sorts your pictures by type (landscape, dog, cat) with a learned model. It labelled photos of two Black people "**gorillas**". A user (Jacky Alciné) found it after release and said so publicly; Google apologised within hours
- Google did not remove the feature: it **blocked the labels** "gorilla", "chimp", "chimpanzee". In 2018 they were still blocked, and in 2023 too (New York Times): years later, the fix was still to hide the word
- Say it clearly: the model was not designed to be racist, and the engineers are not racist. **Nobody wrote that rule**: the error came out of learning
- Google never published the exact cause; two usual suspects:
  - **biased data**: data from the last decades reflects a society that discriminated more. There is so much of it (millions of images, billions of texts) that nobody can check it by hand, and labellers have biases too. We want the model to do **better** than that past
  - **under-representation**: the most likely here, very few Black people in the training images. A big problem for face recognition: in "Gender Shades" (2018), commercial systems were wrong up to **34.7%** of the time on darker-skinned women, against **0.8%** on lighter-skinned men
- Next slide: apples and pears, to see why our checks did not catch it`,
    },
    transitionIn: { en: "From our toy sentences to a real image classifier used by millions." },
    transitionOut: { en: "Why did no test catch it before release? An analogy." },
    evidenceLevel: "observed",
    sourceIds: [
      "fm-google-photos-2015-petapixel",
      "fm-google-photos-2018-techreview",
      "fm-aiid-incident-16",
      "tk-nyt-2023-gorillas",
      "tk-buolamwini-2018-gender-shades",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 90,
    optional: true,
    localizationNotes: "Keep the quoted label exactly as documented; do not paraphrase or soften it.",
  },
  {
    id: "02-apples-and-pears",
    code: "fruit",
    steps: 6,
    chapter: "02",
    number: "2.11",
    title: { en: "Apples and pears" },
    objective: {
      en: "Show why a test set cannot reveal a gap that the whole dataset shares: it shows up only in the real world, the final exam.",
    },
    takeaway: {
      en: "The mock exam only checks what is in the data, so a gap in the data shows up only at the final exam: the real world.",
    },
    visual: { layout: "component", component: "ApplesAndPears" },
    interaction: "presenter",
    speakerNotes: {
      en: `- A thought experiment: our pile holds only red apples and green pears, every picture labelled by a person
- Before training, we split the data into two boxes, like at school
- **Training**, about 80%: the exercises, with the corrections. The model learns from these
- **Test**, about 20%: the mock exam. Set aside, never used for training
- The **final exam** is **production**: the real world, with no corrections
- A typical split: 80/20
- Why set data aside at all: a model can learn the answers by heart (**overfitting**). It shines on its exercises and fails on anything new; the mock exam catches that
- Like a student who wants to pass the exam rather than be good at the job, a model is tuned to score well on the test. Absurd, but that is how it works
- Here colour alone separates the two fruits perfectly, so the model takes the shortcut: green means pear
- Careful, remember: a real model is a neural network. Its rule is only numbers, so we could not read "green means pear" in advance; we only find out by testing
- The mock exam passes at 100%, and honestly so: both boxes come from the same pile, so they share its blind spots
- The first green apple, in the real world: "pear", 97% sure
- You cannot blame the model: the gap was in the data, and neither box could show it
- Real datasets have the same kind of gap, with people: the **Gender Shades** study (2018) found commercial gender classifiers wrong up to 34.7% of the time on darker-skinned women, against 0.8% on lighter-skinned men
- Back to the photo app: the same kind of gap, found by users after release
- The fix lives in the data: look for what is missing, collect it, and test on the cases that matter in the real world
- In practice, engineers often keep a third set (validation) to tune the model; we leave it out to keep the story simple`,
    },
    transitionIn: { en: "Why did no test catch it before release? An analogy." },
    transitionOut: { en: "Now, the same ideas applied to language." },
    evidenceLevel: "thought-experiment",
    sourceIds: ["tk-buolamwini-2018-gender-shades"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    localizationNotes: "Any two fruits work if their usual colours differ and one of them also exists in the other's colour; keep the shortcut a colour.",
  },
  {
    id: "02-next-token",
    code: "next",
    steps: 4,
    chapter: "02",
    number: "2.12",
    title: { en: "Predict the next word" },
    objective: {
      en: "Show that a language model makes the same kind of choice as the sport classifier, but among every token of its vocabulary.",
    },
    takeaway: {
      en: "A language model is the same classifier, choosing the next word among tens of thousands instead of two sports.",
    },
    visual: { layout: "component", component: "NextTokenVsClassifier", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- Football or basketball: a choice between two labels. A language model makes the same choice: the input is the **start of a sentence**, the label is **the next word**
- Among how many? Not the words of a language: the model's **vocabulary of tokens**, about 50,000 for GPT-2 and GPT-3, about 128,000 for Llama 3. Short words are whole tokens, long or unknown ones are cut into pieces: in two slides
- Watch two bars become a long list: real probabilities, recorded from a real model
- Much less black and white than sports: "Windows" clearly wins, but is far from 99%
- Here we take the most likely. We could also draw at random, weighted by probability, to be more creative: that is the **temperature**, coming later
- Take "Windows", add it to the sentence, and start again: predict the next word, again and again. That is how text is generated`,
    },
    transitionIn: { en: "From labelling sentences to predicting words." },
    transitionOut: { en: "This simple change gives two superpowers." },
    evidenceLevel: "none",
    sourceIds: [
      "llm-amd-olmo-1b-config",
      "fnd-qwen25-config",
      "tk-llama3-2024-tokens",
    ],
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
    number: "2.13",
    title: { en: "Two superpowers, one bet" },
    objective: {
      en: "Explain why next-word prediction changed everything: it generates, it needs no human labels, and it rewards sheer scale.",
    },
    takeaway: {
      en: "Two superpowers (it writes, and every text is free training data) plus one bet: scale it up. The bet paid off.",
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
      en: `- **Superpower 1, it writes**: a classifier gives one answer and stops; here the answer is the next word, so it goes back in, again and again. Part of the computation is kept in memory, so each new word does not redo everything
- **Superpower 2, almost unlimited data**: remember, data meant a text and its label (football), an image and its category (cat). Someone had to label it
- Question to the room: who has clicked on traffic lights in a CAPTCHA? Those clicks labelled images (Google says, to improve Maps)
- Here nobody labels anything: the raw data is the start of a sentence, the label is the word that follows. Take a huge, filtered part of the web, books, code: the data **and** its labels, for free
- **The bet: scale.** Put in a lot of money, electricity and data. 2020 "scaling laws": errors fall predictably with size, data and computing; the exact design matters little
- Why scale is needed: if the model is not quite good, one odd word is enough, the next words build on it, and it spirals into nonsense (we will see it with temperature 5 on the base model)
- GPT-2 (1.5 billion numbers) sometimes talks nonsense; GPT-3 (175 billion, 100 times bigger) suddenly writes convincingly: same recipe, bigger`,
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
    number: "2.14",
    title: { en: "How training works" },
    objective: {
      en: "Explain training as a loop: read a text up to a point, let the model guess the next word, measure the error, nudge the numbers, move one word forward.",
    },
    takeaway: {
      en: "Training is the same loop on the next word, trillions of times, and the model learns what is plausible, not one right answer.",
    },
    visual: { layout: "component", component: "TrainingLoop", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- The same loop as football or basketball: guess, compare, nudge, repeat; only now the answer is the next word
- Take a real text and stop somewhere: "Every morning the children take the ___ to school." The real text says "bus"
- At first the model is random: the right word gets about 1 chance in 50,000 (0.002%)
- Compare with the real word: that is the error. Nudge every number a tiny bit to do better
- Paradox: this example punishes every word that is not "bus", yet "tram" or "train" would have been fine; only something like "sofa" was really wrong. In real life there is often **no single right answer**
- Over millions of sentences, "bus" and "tram" both come back: the model learns a **spread of plausible words** (bus 40%, tram 15%...), not one answer. That is also why it can say something plausible but false
- Unlike our classifiers, where (apart from a sentence about both sports) there is one right answer: here, being far from 99% is normal
- Slide one word forward, then on to other texts: web, books, code. Llama 3 was trained on about **15 trillion tokens**
- Not only web pages and books: lots of **code**, about **17%** of Llama 3's training text. Code is strict, structured text: the precision the JSON tool calls of chapter 1 need. Measured: adding code to pretraining improved reasoning, up to 8% relative (Aryabumi et al., 2024)
- Illustrative: real models have far more numbers`,
    },
    transitionIn: { en: "Free labels, put to work: the training loop." },
    transitionOut: { en: "But a computer does not read words: what does it really see?" },
    evidenceLevel: "none",
    sourceIds: [
      "llm-llama3-paper",
      "llm-aryabumi-2024",
      "llm-llama31-models",
    ],
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
    number: "2.15",
    title: { en: "Tokens" },
    objective: {
      en: "See live that a language model reads tokens, pieces of text with a number each, not words.",
    },
    takeaway: {
      en: "A model reads neither letters nor words but pieces of words, called tokens: that is why counting letters was hard.",
    },
    visual: { layout: "component", component: "TokenizerPlayground", props: { showIds: true } },
    interaction: "network",
    speakerNotes: {
      en: `- The model does not read words: it reads **tokens**, a whole word, part of a word, or a space and a letter
- Why not letters? There would be few of them, but a letter carries almost no meaning. Why not whole words? Far too many, in every language. Tokens are the compromise: common words are one token, rare ones are cut into pieces (the method starts from letters and merges the most frequent pairs)
- Let people play: ask the room for a word or a sentence and type it; they can also try it on their phone (the **Try it** tab)
- Back to the opening riddle: the model never sees the letters of "strawberry", only token numbers, hence the trouble counting its r's. Type it and look how it is cut
- Next step: each token has a number in a fixed dictionary; the number says nothing about meaning yet`,
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
    id: "02-meaning-dimensions",
    code: "dims",
    steps: 5,
    chapter: "02",
    number: "2.16",
    title: { en: "Why so many numbers" },
    objective: {
      en: "Understand why a model gives each word hundreds or thousands of numbers: one number or two cannot hold all the meanings a word has at once.",
    },
    takeaway: {
      en: "Words have too many meanings for one or two numbers, so models give each word hundreds, learned from text.",
    },
    visual: { layout: "component", component: "MeaningDimensions", props: {} },
    interaction: "presenter",
    speakerNotes: {
      en: `- To compute with words, a model needs numbers; here a word's number is simply its place
- One number is one line: colours on one side, fruits on the other; orange, a colour and a fruit, sits in the middle, and the line copes
- Salmon is a colour and a fish: it should be near the colours and near the sea, and the line has no room for the sea
- A second number gives a second direction: salmon settles between the colours and the sea
- Blue: a colour, the sea, the sky, and sadness ("feeling blue"); halfway between all of them is close to none of them
- So models give each word hundreds or thousands of numbers: 384 in the map we are about to see, 4,096 in Llama 3.1 8B, 16,384 in Llama 3.1 405B
- **Nobody names these directions**: training sets them, and words used in the same sentences end up close
- Honest caveats: the positions here are invented, and strictly a model numbers tokens, not words; the next slide is a real map`,
    },
    transitionIn: { en: "A token's number says nothing. Meaning needs more numbers." },
    transitionOut: { en: "Now the real map, learned from text." },
    evidenceLevel: "none",
    sourceIds: ["fnd-minilm-multilingual-model-card", "llm-llama3-paper"],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "deterministic" },
    durationSec: 120,
    optional: false,
    localizationNotes:
      "Pick words that carry several meanings in the target language. English and French share salmon (colour and fish). French adds \"pêche\" (peach and fishing), between the fruits and the sea; English has no common equivalent and skips it. Blue pulls toward sadness in English (\"feeling blue\") and toward a bruise in French (\"un bleu\", shown as \"hématome\").",
  },
  {
    id: "02-embedding-training",
    code: "embed",
    steps: 2,
    chapter: "02",
    number: "2.17",
    title: { en: "Words as points" },
    objective: {
      en: "Show that each word becomes a list of numbers, a point in space, scattered before training and organized after.",
    },
    takeaway: {
      en: "Each word becomes a point in space, and training on huge amounts of text brings related words together.",
    },
    visual: { layout: "component", component: "EmbeddingExplorer", props: { mode: "training" } },
    interaction: "presenter",
    speakerNotes: {
      en: `- A neural network only computes with numbers (multiplications, additions, then a probability between 0 and 1): the 0.1%, 1% and 98% we saw are real computations, so words must become **numbers**
- We want close meanings to get close numbers, the way a red pixel and a dark red pixel have close values: then the computations make sense
- Our classifier only knew whether a word was there; richer: give each word a **list of numbers**, a point in space
- We are in machine learning, so nobody places the words by hand: before training, the points are scattered **at random**
- Play: the training loop we saw, repeated on huge amounts of text, gathers words that appear in the same sentences: "blue" ends up near "sky" and "red", because they keep showing up together (not always on the same pages)
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
    number: "2.18",
    title: { en: "Play with the map" },
    objective: {
      en: "Let the room suggest words, compute them live, and read their nearest neighbours.",
    },
    takeaway: {
      en: "Closeness of meaning becomes a distance we can measure, in hundreds of dimensions nobody chose.",
    },
    visual: { layout: "component", component: "EmbeddingExplorer", props: { mode: "search" } },
    interaction: "network",
    speakerNotes: {
      en: `- Ask the room for a word (a job, a place, an emotion) and type it; it is computed live, by the same model through Hugging Face
- Read the nearest neighbours; a surprising neighbour is often a word used in the same sentences
- The map can switch to **3D**: more axes to play with, just to show the idea
- This model gives each word **384 numbers**: 384 ways to be neighbours with another word. Nobody could set that by hand; that is how meaning and the links between words are encoded
- The largest models use far more: **4,096** numbers per token for Llama 3.1 8B, **16,384** for Llama 3.1 405B
- We cannot picture more than three dimensions: the 2D and 3D maps are a **projection** (UMAP) that tries to keep each word's close neighbours. Distances between far-apart groups and the axes mean nothing, and some true neighbours may show up far away
- **The list is exact; the map is an approximation**
- "Show all words" labels every word; zoom in (wheel or pinch) to read one corner of the map
- Honest detail if asked: this demo model makes embeddings of words and sentences (the kind used for search); a chatbot's own input points work the same way, and in a chatbot the next layers then move each word with its context ("a peach" to eat or "fishing")`,
    },
    transitionIn: { en: "The prepared map becomes interactive." },
    transitionOut: { en: "So what comes out of all that training?" },
    evidenceLevel: "none",
    sourceIds: [
      "fnd-minilm-multilingual-model-card",
      "llm-llama3-paper",
    ],
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
    number: "2.19",
    title: { en: "A base model" },
    objective: {
      en: "Show that a model straight out of pretraining just continues text, one token or several at a time.",
    },
    takeaway: {
      en: "A model fresh out of pretraining does not answer, it continues the text; the temperature sets how much chance it takes.",
    },
    visual: { layout: "component", component: "BaseModelPlayground", props: { prompt: baseVsInstructPrompt } },
    interaction: "network",
    speakerNotes: {
      en: `- This is **pretraining**: exactly the next-word loop we saw, on a huge amount of text, nothing more
- Ask it a question: it works, it writes fluent text, but something is off: it **continues the page** instead of answering. Try a multiple-choice quiz: it adds more questions
- It has no notion of chat, of being an assistant, or of what it should not say. It is neither helpful nor harmful: it imitates plausible text
- Better not type a harmful question live on the base model; the next slide shows a **recorded** refusal on the bomb question
- One token: show the bars, then draw one. Several tokens: let it write on
- **Temperature**: at **0**, always the most likely word, so the same text every time: the computations are deterministic (on servers, a word can still change now and then)
- At **1**, a weighted draw: if "cat" is at 30%, it comes out about one time in three
- Higher, the odds flatten and odd words come out more and more. Try **5**: it soon means nothing. Proof that if the model is not good enough, one odd word leads to the next and it goes off the rails
- Here: Llama 3.1 8B, Meta's base model; the bars come from a larger sibling, Llama 3.3 70B Instruct, reading the same raw text (the base model's provider gives no probabilities), and the screen says so
- It runs on **Hugging Face**, the public library where AI models are shared: remember that name`,
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
    number: "2.20",
    title: { en: "A fine-tuned assistant" },
    objective: {
      en: "Show that further training on questions and answers, plus guardrails, turns a base model into an assistant.",
    },
    takeaway: {
      en: "The same model, trained further on conversations and fed a hidden text: that is what makes a chatbot.",
    },
    visual: { layout: "component", component: "ChatPlayground", props: { prompt: baseVsInstructPrompt } },
    interaction: "network",
    speakerNotes: {
      en: `- Same kind of model, trained further on questions and answers (here Llama 3.1 8B Instruct, the assistant version of the base model we just used)
- Ask the **same questions** as to the base model: now it answers, coherently
- Temperature works the same way (default 1)
- It was **trained** to behave as an assistant: example conversations, then rewards for the answers people prefer
- Striking fact: people preferred the answers of a **1.3 billion** parameter assistant to those of the raw **175 billion** GPT-3, 100 times bigger (InstructGPT, OpenAI, 2022): it is not only about size
- Guardrails: it is trained to refuse some requests. The guardrail example is a recorded real refusal (the bomb question). Refusals are trained, and training can fail; large assistants add far more safety training and filters
- Next step: what the model really reads, which you never see: a hidden **system prompt**, role tags, the question, then "assistant:" and it continues
- Still next-word prediction: it writes the answer, then an end tag that tells the software to stop (here "<|eot_id|>")`,
    },
    transitionIn: { en: "From the base model to its assistant version." },
    transitionOut: { en: "But examples are not the only thing shaping it." },
    evidenceLevel: "none",
    sourceIds: [
      "fnd-instructgpt",
      "llm-llama31-models",
    ],
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
    number: "2.21",
    title: { en: "How an assistant is shaped" },
    objective: {
      en: "Show the three layers that shape an assistant: example conversations, written rules, and classifiers around the model.",
    },
    takeaway: {
      en: "An assistant is a pretrained model shaped by three layers (examples, written rules, classifiers), and none is enough alone.",
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
- Layer 1, **examples**: many conversations, so it is rewarded for acting as an assistant, and rewarded for human values and behaviours
- Layer 2, **written rules**: some companies, not all, publish a **constitution** (Anthropic) or a **Model Spec** (OpenAI); the model is trained to follow it
- Example rule in both: no help creating chemical, biological, radiological or nuclear weapons. They also ask it to stay kind and honest, and not to flatter you just to please you (**sycophancy**)
- Sycophancy is real: in April 2025, OpenAI rolled back a GPT-4o update because it flattered users too much. A model rewarded for being liked learns to say what we want to hear: the first, harmless example of "it does what we rewarded, not what we meant" (chapter 4)
- Layer 3, **classifiers**: separate models, like our sports classifier, check your question **before it even reaches the model**, and the answer before it reaches you; they can block either
- Question to the room: which layer would you trust most? None alone is enough`,
    },
    transitionIn: { en: "But examples are not the only thing shaping it." },
    transitionOut: { en: "Who builds these models?" },
    evidenceLevel: "observed",
    sourceIds: [
      "fnd-instructgpt",
      "tk-openai-model-spec-2026",
      "tk-anthropic-constitution",
      "fnd-anthropic-constitutional-classifiers",
      "tk-openai-2025-sycophancy-rollback",
    ],
    runtimeClass: "A",
    artifacts: [],
    fallback: { kind: "none" },
    durationSec: 120,
    optional: true,
  },
];
