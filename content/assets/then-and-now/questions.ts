/**
 * Trick questions for `ThenAndNow` (storyboard scenes 1.2 and 3.12).
 *
 * Every answer shown as a model's answer is real:
 * - GPT-2 answers are a real GPT-2 run, recorded into `gpt2-answers.json` next
 *   to this file (by a script that ran GPT-2 locally, since removed).
 * - `today` was written by Claude Opus 5.5 (model id `claude-opus-5-5`) on
 *   2026-10-02: each question answered cold, in one pass, without tools, and
 *   recorded verbatim. It is labelled "recorded answer" on screen.
 *
 * Other generations (GPT-3, GPT-4, GPT-5...): each question has slots that stay
 * hidden until filled. To fill one, run the question yourself on that model and
 * paste the answer verbatim:
 *
 *   { generation: "GPT-4", model: "gpt-4-0613", date: "2026-10-05",
 *     how: "ChatGPT web, temperature default, first answer",
 *     answer: { en: "...", fr: "..." } }
 *
 * Leave `answer: null` for a slot you did not run; it is not shown. Never write
 * an answer you did not observe. If you only ran one language, copy the same
 * text into both `en` and `fr` (the scene shows it as quoted model output).
 *
 * `history` notes are for the presenter (English, not on screen). A claim that
 * a question tripped older models is only marked "verified" with a checked source.
 */
import type { L10n, Locale } from "@ai-exhibit/presentation-core";

export interface RecordedAnswer {
  /** Name shown on screen. */
  model: string;
  /** Exact model identifier. */
  modelId: string;
  /** ISO date of the run. */
  date: string;
  /** How the answer was obtained. */
  how: string;
  answer: L10n;
}

export interface GenerationSlot {
  /** Column label, e.g. "GPT-3". */
  generation: string;
  /** Exact model identifier, filled with the answer. */
  model: string | null;
  date: string | null;
  how: string | null;
  /** null: not run, the slot stays hidden. */
  answer: L10n | null;
}

/** One generation's answer as published by a third party (never invented). */
export interface PublishedRung {
  generation: string;
  /** A few words after the generation, in parentheses ("first ChatGPT"). */
  aka?: L10n;
  year: number;
  /** Exact model identifier as published. */
  model: string;
  /**
   * Estimated cost of the final training run (Epoch AI, amortized hardware and energy, 2023 US dollars,
   * tk-epoch-notable-models), the same figures as the "Everything went up" slide; null when unknown.
   */
  cost: L10n | null;
  /** Verbatim, in the language it was asked (English). */
  answer: string;
  /**
   * The answer translated for the audience, shown in italics under the
   * verbatim one and labelled as a translation. Never a model output.
   */
  translation?: Partial<Record<Exclude<Locale, "en">, string>>;
  /** The source's own correct / incorrect mark. */
  correct: boolean;
}

/** A question with a published answer per generation: the first `together` rungs on the first click, then one per click. */
export interface Ladder {
  /** ID in the source registry (content/sources). */
  sourceId: string;
  /** The prompt exactly as the source asked it. */
  originalPrompt: string;
  /** How many rungs the first click reveals at once (default 1). */
  together?: number;
  rungs: PublishedRung[];
}

export interface ThenAndNowQuestion {
  id: string;
  question: L10n;
  /** The correct answer, short. */
  correct: L10n;
  /**
   * What GPT-2 is given. GPT-2 learned from English web text only, so it is
   * asked in English in every edition, in a Q/A layout it has seen online.
   */
  gpt2Prompt: string;
  today: RecordedAnswer;
  others: GenerationSlot[];
  /** Published answers of earlier generations (the game clicks through them). */
  ladder?: Ladder;
  history?: {
    note: string;
    source?: { title: string; authors: string; url: string; date: string };
    verification: "verified" | "needs-verification";
  };
}

const TODAY = {
  model: "Claude Opus 5.5",
  modelId: "claude-opus-5-5",
  date: "2026-10-02",
  how: "Answered cold, in one pass, without tools, while this file was written; recorded verbatim.",
} as const;

const emptySlots = (): GenerationSlot[] =>
  ["GPT-3", "GPT-4", "GPT-5"].map((generation) => ({ generation, model: null, date: null, how: null, answer: null }));

const CRT_SOURCE = {
  title: "Thinking Fast and Slow in Large Language Models",
  authors: "Thilo Hagendorff, Sarah Fabi, Michal Kosinski",
  url: "https://arxiv.org/abs/2212.05206",
  date: "2022-12-10",
} as const;

export const thenAndNowQuestions: ThenAndNowQuestion[] = [
  {
    id: "clock-riddle",
    // AI Digest's riddle (theaidigest.org/progress-and-dangers, November 2023).
    question: {
      en: "When ten plus four is two, what is nine plus six?",
      fr: "Si dix plus quatre font deux, combien font neuf plus six ?",
    },
    correct: { en: "3 (on a clock)", fr: "3 (sur une horloge)" },
    gpt2Prompt: "Q: When ten plus four is two, what is nine plus six?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "3. On a clock, ten o'clock plus four hours is two o'clock, so nine o'clock plus six hours is three o'clock.",
        fr: "3. Sur une horloge, dix heures plus quatre heures donnent deux heures ; neuf heures plus six heures donnent donc trois heures.",
      },
    },
    others: emptySlots(),
    ladder: {
      sourceId: "tk-aidigest-2023-progress",
      originalPrompt: "When ten plus four is two, what is nine plus six?",
      // The three wrong answers land together; GPT-4 gets its own click.
      together: 3,
      rungs: [
        {
          generation: "GPT-2",
          year: 2019,
          model: "gpt2-xl",
          cost: { en: "~$4.3k", fr: "~4 300 $" },
          answer: "The answer is nine plus six.",
          translation: { fr: "La réponse est neuf plus six." },
          correct: false,
        },
        {
          generation: "GPT-3",
          year: 2020,
          model: "davinci",
          cost: { en: "~$2.1M", fr: "~2,1 M$" },
          answer: "The answer is 15.",
          translation: { fr: "La réponse est 15." },
          correct: false,
        },
        {
          generation: "GPT-3.5",
          aka: { en: "first ChatGPT", fr: "premier ChatGPT" },
          year: 2022,
          model: "gpt-3.5-turbo-0613",
          cost: null,
          answer: 'So, the answer to the riddle "When ten plus four is two, what is nine plus six?" is 15.',
          translation: { fr: "Donc, la réponse à l'énigme « Si dix plus quatre font deux, combien font neuf plus six ? » est 15." },
          correct: false,
        },
        {
          generation: "GPT-4",
          year: 2023,
          model: "gpt-4-0613",
          cost: { en: "~$37M", fr: "~37 M$" },
          answer:
            '"ten plus four" equals two because if it is ten o\'clock and you add four hours, it becomes two o\'clock. So, if we apply the same logic to "nine plus six", we get three.',
          translation: {
            fr: "« dix plus quatre » égale deux, car s'il est dix heures et que vous ajoutez quatre heures, il est alors deux heures. Donc, si nous appliquons la même logique à « neuf plus six », nous obtenons trois.",
          },
          correct: true,
        },
      ],
    },
    history: {
      note: "AI Digest asked GPT-2, GPT-3, GPT-3.5 and GPT-4 this riddle and published each answer verbatim with an estimated training cost.",
      source: {
        title: "How fast is AI improving?",
        authors: "AI Digest (Sage)",
        url: "https://theaidigest.org/progress-and-dangers",
        date: "2023-11",
      },
      verification: "verified",
    },
  },
  {
    id: "strawberry",
    question: {
      en: 'How many r\'s are in the word "strawberry"?',
      fr: "Combien y a-t-il de r dans le mot anglais « strawberry » ?",
    },
    correct: { en: "3", fr: "3" },
    gpt2Prompt: 'Q: How many r\'s are in the word "strawberry"?\nA:',
    today: {
      ...TODAY,
      answer: { en: "Three: st-r-awbe-r-r-y.", fr: "Trois : st-r-awbe-r-r-y." },
    },
    others: emptySlots(),
    history: {
      note: "Widely shared in 2024 as a failure of chat models (letters are hidden inside tokens). No checked source yet.",
      verification: "needs-verification",
    },
  },
  {
    id: "decimals",
    question: { en: "Which is bigger, 9.11 or 9.9?", fr: "Lequel est le plus grand : 9,11 ou 9,9 ?" },
    correct: { en: "9.9", fr: "9,9" },
    gpt2Prompt: "Q: Which is bigger, 9.11 or 9.9?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "9.9 is bigger. 9.9 is the same as 9.90, and 0.90 is more than 0.11.",
        fr: "9,9 est plus grand : 9,9 vaut 9,90, et 0,90 dépasse 0,11.",
      },
    },
    others: emptySlots(),
    history: {
      note: "Widely shared in 2024 as a failure of chat models. No checked source yet.",
      verification: "needs-verification",
    },
  },
  {
    id: "sally",
    question: {
      en: "Sally has 3 brothers. Each brother has 2 sisters. How many sisters does Sally have?",
      fr: "Sally a 3 frères. Chacun de ses frères a 2 sœurs. Combien de sœurs Sally a-t-elle ?",
    },
    correct: { en: "1", fr: "1" },
    gpt2Prompt: "Q: Sally has 3 brothers. Each brother has 2 sisters. How many sisters does Sally have?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "One. Each brother's two sisters are Sally and one other girl, so Sally has one sister.",
        fr: "Une seule. Les deux sœurs de chaque frère sont Sally et une autre fille : Sally a donc une sœur.",
      },
    },
    others: emptySlots(),
    history: {
      note: "Popular reasoning test for chat models. No checked source yet.",
      verification: "needs-verification",
    },
  },
  {
    id: "bat-and-ball",
    question: {
      en: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
      fr: "Une batte et une balle coûtent 1,10 € au total. La batte coûte 1,00 € de plus que la balle. Combien coûte la balle ?",
    },
    correct: { en: "$0.05", fr: "0,05 €" },
    gpt2Prompt:
      "Q: A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "The ball costs $0.05 (5 cents) and the bat $1.05: together $1.10, and the bat is exactly $1.00 more.",
        fr: "La balle coûte 0,05 € (5 centimes) et la batte 1,05 € : 1,10 € en tout, et la batte coûte bien 1,00 € de plus.",
      },
    },
    others: emptySlots(),
    history: {
      note: "Cognitive Reflection Test item. Hagendorff et al. report that GPT-3 models gave the intuitive wrong answers on such tasks while ChatGPT and GPT-4 avoided them.",
      source: CRT_SOURCE,
      verification: "verified",
    },
  },
  {
    id: "widgets",
    question: {
      en: "If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?",
      fr: "Si 5 machines mettent 5 minutes pour fabriquer 5 objets, combien de temps mettront 100 machines pour fabriquer 100 objets ?",
    },
    correct: { en: "5 minutes", fr: "5 minutes" },
    gpt2Prompt:
      "Q: If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "5 minutes. Each machine makes one widget in 5 minutes, so 100 machines make 100 widgets in the same 5 minutes.",
        fr: "5 minutes. Chaque machine fabrique un objet en 5 minutes ; 100 machines en fabriquent donc 100 dans le même temps.",
      },
    },
    others: emptySlots(),
    history: {
      note: "Cognitive Reflection Test item (intuitive wrong answer: 100 minutes). Same source as bat-and-ball.",
      source: CRT_SOURCE,
      verification: "verified",
    },
  },
  {
    id: "lily-pads",
    question: {
      en: "A patch of lily pads doubles in size every day. It covers the whole lake after 48 days. After how many days does it cover half the lake?",
      fr: "Une tache de nénuphars double de taille chaque jour. Elle couvre tout le lac en 48 jours. En combien de jours couvre-t-elle la moitié du lac ?",
    },
    correct: { en: "47 days", fr: "47 jours" },
    gpt2Prompt:
      "Q: A patch of lily pads doubles in size every day. It covers the whole lake after 48 days. After how many days does it cover half the lake?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "47 days. It doubles every day, so it covers half the lake the day before it covers all of it.",
        fr: "47 jours. Elle double chaque jour : elle couvre la moitié du lac la veille du jour où elle le couvre entièrement.",
      },
    },
    others: emptySlots(),
    history: {
      note: "Cognitive Reflection Test item (intuitive wrong answer: 24 days). Same source as bat-and-ball.",
      source: CRT_SOURCE,
      verification: "verified",
    },
  },
  {
    id: "reversal",
    question: { en: "Who is Mary Lee Pfeiffer's son?", fr: "Qui est le fils de Mary Lee Pfeiffer ?" },
    correct: { en: "Tom Cruise", fr: "Tom Cruise" },
    gpt2Prompt: "Q: Who is Mary Lee Pfeiffer's son?\nA:",
    today: {
      ...TODAY,
      answer: {
        en: "Tom Cruise. Mary Lee Pfeiffer is the mother of the actor Tom Cruise.",
        fr: "Tom Cruise. Mary Lee Pfeiffer est la mère de l'acteur Tom Cruise.",
      },
    },
    others: emptySlots(),
    history: {
      note: "The 'reversal curse': GPT-4 answered 'Who is Tom Cruise's mother?' correctly 79% of the time but the reverse question only 33% of the time.",
      source: {
        title: 'The Reversal Curse: LLMs trained on "A is B" fail to learn "B is A"',
        authors: "Lukas Berglund, Meg Tong, Max Kaufmann, Mikita Balesni, Asa Cooper Stickland, Tomasz Korbak, Owain Evans",
        url: "https://arxiv.org/abs/2309.12288",
        date: "2023-09-21",
      },
      verification: "verified",
    },
  },
];

/** Default order for the opening game (scene 1.2): the five from the storyboard. */
export const GAME_QUESTION_IDS = ["clock-riddle", "strawberry", "decimals", "sally", "bat-and-ball"];

/** Shape of `gpt2-answers.json`. */
export interface Gpt2AnswersFile {
  version: 1;
  generatedAt: string;
  generator: string;
  model: { artifactId: string; repo: string; revision: string; dtype: string; backend: string };
  settings: {
    maxNewTokens: number;
    stop: string;
    greedy: { greedy: true };
    samples: { temperature: number; topK: number; seeds: number[] };
  };
  answers: Record<string, { prompt: string; greedy: string; samples: string[] }>;
}

/** Sampling used live and in the recording, so both behave the same. */
export const GPT2_SETTINGS = { maxNewTokens: 30, stop: "\n", temperature: 0.8, topK: 40, seeds: [1, 2, 3] } as const;
