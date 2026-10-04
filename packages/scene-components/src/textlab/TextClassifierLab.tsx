import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { intlLocale, pick, tr } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps, SceneRole } from "../contract.ts";
import { Rich } from "../primitives/Rich.tsx";
import { useSceneState } from "../learning/shared/sceneState.ts";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { ControlBar, SceneButton, SceneHeading, cx, l, type L10n, type Locale } from "../learning/shared/ui.tsx";
import { roundSimple, simpleActivity, simpleSelect, simpleView, type SimpleActivity, type SimpleView } from "./data/simple.ts";
import { accuracyCurve, learningBeat } from "./data/learning.ts";
import { displayWord, NET_FAIL, SCORES, textTree } from "./data/examples.ts";
import { netParameterCount, textNet, TextNetTraining } from "./data/net.ts";
import { applyRule } from "./data/rule.ts";
import { RULE, RULE_FAIL, RULE_RIGHT, SMALL_SET, TASK, TREE_EXAMPLE, TREE_TRAP } from "./data/small.ts";
import { tokenize, wordSet, type LabelledSentence, type Sport } from "./data/text.ts";
import { treePath, type TreeStep } from "./data/tree.ts";
import { CheckIcon, CrossIcon, SportGlyph } from "./parts/glyphs.tsx";
import { SimpleNet, type LineLabel } from "./parts/SimpleNet.tsx";
import { Sentence, withoutTokens, type Tone } from "./parts/Sentence.tsx";
import { TreeDiagram, yesTone, type TreeText } from "./parts/TreeDiagram.tsx";
import styles from "./TextClassifierLab.module.css";

export type TextStage = "task" | "rules" | "tree" | "tree-unseen" | "learning" | "network" | "network-fail";

export interface TextClassifierLabProps {
  stage: TextStage;
  heading?: L10n;
}

export interface TextClassifierLabState {
  /** Tree scene: which of the 24 examples walks through the tree. */
  example?: number;
  /** tree-unseen / network-fail: token indices the presenter removed from the sentence. */
  removed?: number[];
  /** learning, step 4: the training as last published by the controller. */
  train?: TrainSnapshot;
  /** learning, step 4: bumped to restart the training, or to jump to its end. */
  trainRun?: number;
  trainSkip?: number;
}

/** Highest reveal step per stage. */
export const TEXT_STEPS: Record<TextStage, number> = {
  task: 1,
  rules: 1,
  tree: 2,
  "tree-unseen": 1,
  network: 3,
  learning: 4,
  "network-fail": 2,
};

const T = {
  football: { en: "Football" },
  basketball: { en: "Basketball" },
  right: { en: "Right" },
  wrong: { en: "Wrong" },
  toUs: { en: "To us" },
  task: {
    heading: { en: "Football or basketball?" },
    subs: [
      { en: "Which sport is this sentence about?" },
      { en: "Easy for us. But how can a machine decide?" },
    ],
  },
  rules: {
    heading: { en: "Classic AI: a person writes the rule" },
    subs: [
      { en: "Written by hand: a few keywords for each sport." },
      { en: "A new sentence. The rule stops at the first keyword it finds." },
    ],
    says: { en: "The rule says" },
  },
  tree: {
    heading: { en: "Machine learning: the rule comes from examples" },
    subs: [
      { en: "24 sentences, each labelled by a person." },
      { en: "The machine picked these questions by itself, from the examples." },
      { en: "One example at a time, down the tree." },
    ],
    read: { en: "Each box asks: does the sentence contain this word? Follow yes or no down to an answer." },
    says: { en: "The tree says" },
    prev: { en: "Previous example" },
    next: { en: "Next example" },
  },
  unseen: {
    heading: { en: "What the tree learned" },
    subs: [
      { en: "A new sentence. What will the tree answer?" },
      { en: "It learned this by itself. And we can read it and spot the problem." },
    ],
  },
  learning: {
    heading: { en: "How a neural network learns" },
    phases: [
      { en: "At first, the connections are random" },
      { en: "Compare with the right answer" },
      { en: "Nudge every connection, a tiny bit" },
      { en: "The same sentence again: a bit better" },
      { en: "Again and again, over thousands of sentences" },
    ],
    words: [{ en: "Guess" }, { en: "Compare" }, { en: "Nudge" }, { en: "Again" }],
    loop: { en: "The learning loop" },
    itsGuess: { en: "Its guess" },
    afterNudge: { en: "After one nudge" },
    randomNote: { en: "Random connections: a random guess." },
    gave: (sport: string, p: string) =>
      l(`La bonne réponse était ${sport}. Il lui donnait ${p} ; il faudrait 100 %.`, `The right answer was ${sport}. It gave it ${p}; it should be 100%.`),
    wrongBy: { en: "Wrong by this much." },
    nudgeNote: l(
      "Chaque connexion bouge un peu, dans le sens qui aurait aidé.",
      "Each connection moves a little, in the direction that would have helped.",
    ),
    better: (a: string, b: string) => l(`Un peu mieux : ${a} → ${b}. Il en faut des milliers.`, `A bit better: ${a} → ${b}. It takes thousands of these.`),
    randomNet: { en: "Its connections, random" },
    net: { en: "Its connections" },
    seen: { en: "Sentences seen" },
    of: (n: string) => l(`sur ${n}`, `of ${n}`),
    curve: { en: "Right on 200 new sentences:" },
    start: { en: "start" },
    end: { en: "end" },
    real: { en: "Real numbers from this small network" },
  },
  network: {
    heading: { en: "What is inside a neural network" },
    chips: [{ en: "Words" }, { en: "Weights" }, { en: "Neurons" }, { en: "Scores" }],
    headlines: [
      { en: "Words go in" },
      { en: "Every connection is a number: a weight" },
      { en: "Each neuron adds up what reaches it" },
      { en: "Out come two scores, as percentages" },
    ],
    captions: [
      { en: "Each word it knows is an input: 1 if the sentence has it." },
      { en: "Thickness: how big the number is. Colour: the sport it pushes toward." },
      { en: "The more thick lines reach it from lit words, the more it lights up." },
    ],
    compare: (tree: string, net: string) =>
      l(`Sur 200 phrases nouvelles : arbre ${tree}, réseau ${net}. Et il ne tombe pas dans le piège.`, `On 200 new sentences: tree ${tree}, network ${net}. And it gets the trap sentence right.`),
    restart: { en: "Train again" },
    skip: { en: "Skip to the end" },
  },
  simplified: (words: string, conns: string) =>
    l(`Vue simplifiée du vrai réseau : ${words} mots, 16 neurones, ${conns} connexions. Vrais nombres.`, `Simplified view of the real network: ${words} words, 16 neurons, ${conns} connections. Real numbers.`),
  fail: {
    heading: { en: "It still gets some sentences wrong" },
    headlines: [
      { en: "A new sentence, written like the others" },
      { en: "Open the hood" },
      { en: "Open the hood" },
    ],
    sure: { en: "Confident, and wrong." },
    neuron: (n: number) => l(`neurone ${n}`, `neuron ${n}`),
    toOutput: { en: "\u2192 basketball" },
    hood: { en: "All the lines and numbers are there. None of them says why." },
    takeaway1: { en: "We can test it." },
    takeaway2: { en: "We cannot know in advance where it will fail." },
  },
  edit: {
    hint: { en: "Click a word to remove or put it back." },
    restore: { en: "Restore the sentence" },
  },
};

type Tr = (x: L10n) => string;

const fmtInt = (n: number, locale: Locale) => n.toLocaleString(intlLocale(locale));
const fmtPct = (v: number, locale: Locale) => {
  const p = Math.round(v * 1000) / 10;
  const s = p.toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 });
  return locale === "fr" ? `${s}\u202f%` : `${s}%`;
};
const sportName = (t: Tr, s: Sport) => t(s === "football" ? T.football : T.basketball);
const toneClass = (s: Sport) => (s === "football" ? styles.toneFootball : styles.toneBasketball);

type LabAction =
  | { type: "example"; delta: number }
  | { type: "toggle"; index: number }
  | { type: "restore" }
  | { type: "restart" }
  | { type: "skip" };

export function TextClassifierLab({ props, ctx }: SceneComponentProps<TextClassifierLabProps, TextClassifierLabState>) {
  const { locale, role } = ctx;
  const stage: TextStage = props.stage in TEXT_STEPS ? props.stage : "task";
  const step = Math.max(0, Math.min(TEXT_STEPS[stage], ctx.revealStep));
  const [state, setState] = useSceneState<TextClassifierLabState>(ctx, () => ({}), { throttleMs: 100 });
  const t = useCallback((x: L10n) => tr(x, locale), [locale]);
  // Controls show in every interactive window; the stage owner applies them.
  const interactive = canInteract(ctx);
  const act = useSceneActions<LabAction, TextClassifierLabState>(ctx, (a) => {
    switch (a.type) {
      case "example":
        setState((s) => ({ ...s, example: (s.example ?? TREE_EXAMPLE) + a.delta }));
        return;
      case "toggle":
        setState((s) => {
          const next = new Set(s.removed ?? []);
          if (next.has(a.index)) next.delete(a.index);
          else next.add(a.index);
          return { ...s, removed: [...next].sort((x, y) => x - y) };
        });
        return;
      case "restore":
        setState((s) => ({ ...s, removed: undefined }));
        return;
      case "restart":
        setState((s) => ({ ...s, train: undefined, trainRun: (s.trainRun ?? 0) + 1 }));
        return;
      case "skip":
        setState((s) => ({ ...s, trainSkip: (s.trainSkip ?? 0) + 1 }));
        return;
    }
  });

  const sub: L10n = (() => {
    switch (stage) {
      case "task":
        return T.task.subs[step]!;
      case "rules":
        return T.rules.subs[step]!;
      case "tree":
        return T.tree.subs[step]!;
      case "tree-unseen":
        return T.unseen.subs[step]!;
      case "learning":
        return T.learning.phases[step]!;
      case "network":
        return T.network.headlines[step]!;
      case "network-fail":
        return T.fail.headlines[step]!;
    }
  })();
  const heading = {
    task: T.task.heading,
    rules: T.rules.heading,
    tree: T.tree.heading,
    "tree-unseen": T.unseen.heading,
    learning: T.learning.heading,
    network: T.network.heading,
    "network-fail": T.fail.heading,
  }[stage];

  let body: ReactNode;
  let controls: ReactNode = null;
  switch (stage) {
    case "task":
      body = <TaskStage step={step} t={t} locale={locale} />;
      break;
    case "rules":
      body = <RulesStage step={step} t={t} locale={locale} />;
      break;
    case "tree": {
      const n = pick(SMALL_SET, locale).length;
      const example = (((state.example ?? TREE_EXAMPLE) % n) + n) % n;
      body = <TreeStage step={step} t={t} locale={locale} example={example} />;
      if (interactive && step >= 2) {
        controls = (
          <>
            <SceneButton onClick={() => act({ type: "example", delta: -1 })}>{t(T.tree.prev)}</SceneButton>
            <SceneButton onClick={() => act({ type: "example", delta: 1 })}>{t(T.tree.next)}</SceneButton>
          </>
        );
      }
      break;
    }
    case "tree-unseen":
    case "network-fail": {
      const picked = stage === "tree-unseen" ? pick(TREE_TRAP, locale) : pick(NET_FAIL, locale);
      const nTokens = tokenize(picked.text, locale).length;
      const removed = new Set((state.removed ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < nTokens));
      const editable = interactive && (stage === "tree-unseen" ? step >= 1 : step === 0);
      const toggle = editable ? (i: number) => act({ type: "toggle", index: i }) : undefined;
      if (stage === "network-fail") {
        return (
          <NetFailStage
            step={step}
            t={t}
            locale={locale}
            sentence={picked}
            removed={removed}
            onToken={toggle}
            still={ctx.reducedMotion || role === "preview"}
            controls={
              editable ? (
                <ControlBar>
                  <SceneButton disabled={removed.size === 0} onClick={() => act({ type: "restore" })}>
                    {t(T.edit.restore)}
                  </SceneButton>
                  <p className={styles.hint}>{t(T.edit.hint)}</p>
                </ControlBar>
              ) : null
            }
          />
        );
      }
      body = <UnseenStage step={step} t={t} locale={locale} sentence={picked} removed={removed} onToken={toggle} />;
      if (editable) {
        controls = (
          <>
            <SceneButton disabled={removed.size === 0} onClick={() => act({ type: "restore" })}>
              {t(T.edit.restore)}
            </SceneButton>
            <p className={styles.hint}>{t(T.edit.hint)}</p>
          </>
        );
      }
      break;
    }
    case "learning":
      // Its own frame, like TrainingLoop: a headline per phase instead of the usual heading.
      return (
        <LearningStage
          step={step}
          t={t}
          locale={locale}
          role={role}
          reducedMotion={ctx.reducedMotion}
          state={state}
          setState={setState}
          interactive={interactive}
          act={act}
        />
      );
    case "network":
      return <NetworkStage step={step} t={t} locale={locale} still={ctx.reducedMotion || role === "preview"} />;
  }

  return (
    <div className={cx(styles.root, styles[`stage-${stage}`])} data-step={step}>
      <SceneHeading sub={t(sub)}>{t(props.heading ?? heading)}</SceneHeading>
      <div className={styles.body}>{body}</div>
      {controls && (
        <div className={styles.controls}>
          <ControlBar>{controls}</ControlBar>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ verdicts */

function Verdict({ who, sport, right, t, sure }: { who: string; sport: Sport; right?: boolean | null; t: Tr; sure?: string }) {
  return (
    <div className={cx(styles.verdict, toneClass(sport), right === true && styles.verdictRight, right === false && styles.verdictWrong)}>
      <span className={styles.verdictWho}>{who}</span>
      <span className={styles.verdictAnswer}>
        <span className={styles.verdictGlyph}>
          <SportGlyph sport={sport} size={58} />
        </span>
        {sportName(t, sport)}
        {right != null && (
          <span className={styles.verdictMark} aria-label={t(right ? T.right : T.wrong)}>
            {right ? <CheckIcon /> : <CrossIcon />}
          </span>
        )}
      </span>
      {sure && <span className={styles.verdictSure}>{sure}</span>}
    </div>
  );
}

function Truth({ sport, t }: { sport: Sport; t: Tr }) {
  return (
    <p className={cx(styles.truth, toneClass(sport))}>
      {t(T.toUs)}
      <span className={styles.truthGlyph}>
        <SportGlyph sport={sport} size={40} />
      </span>
      <strong>{sportName(t, sport).toLowerCase()}</strong>
    </p>
  );
}

/** A labelled sentence in a list: the sport's glyph, then the sentence. */
function Labelled({ s, locale, className }: { s: LabelledSentence; locale: Locale; className?: string }) {
  return (
    <li className={cx(styles.labelled, toneClass(s.label), className)}>
      <span className={styles.labelledGlyph}>
        <SportGlyph sport={s.label} size={34} />
      </span>
      <Sentence text={s.text} locale={locale} className={styles.labelledText} />
    </li>
  );
}

/* ---------------------------------------------------------------- task */

function TaskStage({ step, t, locale }: { step: number; t: Tr; locale: Locale }) {
  const set = pick(SMALL_SET, locale);
  if (step === 0) {
    return (
      <div className={styles.taskHero}>
        <Sentence text={set[TASK.hero]!.text} locale={locale} className={styles.heroSentence} />
        <div className={styles.choices}>
          <span className={cx(styles.choice, styles.toneFootball)}>
            <SportGlyph sport="football" size={96} />
            {t(T.football)}
          </span>
          <span className={styles.choiceOr}>?</span>
          <span className={cx(styles.choice, styles.toneBasketball)}>
            <SportGlyph sport="basketball" size={96} />
            {t(T.basketball)}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.columns}>
      {(["football", "basketball"] as const).map((sport) => (
        <section key={sport} className={cx(styles.column, toneClass(sport))}>
          <h3 className={styles.columnHead}>
            <SportGlyph sport={sport} size={56} />
            {sportName(t, sport)}
          </h3>
          <ul className={styles.taskList}>
            {TASK[sport].map((i) => (
              <li key={i} className={styles.taskItem}>
                <Sentence text={set[i]!.text} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- rules */

function KeywordList({ words, sport, locale }: { words: string[]; sport: Sport; locale: Locale }) {
  const or = locale === "fr" ? " ou " : " or ";
  return (
    <>
      {words.map((w, k) => (
        <span key={w}>
          {k > 0 && (k === words.length - 1 ? or : ", ")}
          <span className={cx(styles.word, styles.marked, toneClass(sport))}>{w}</span>
        </span>
      ))}
    </>
  );
}

function RulesStage({ step, t, locale }: { step: number; t: Tr; locale: Locale }) {
  const rule = pick(RULE, locale);
  const failing = step >= 1;
  const sentence = failing ? pick(RULE_FAIL, locale) : pick(SMALL_SET, locale)[RULE_RIGHT]!;
  const trace = applyRule(sentence.text, locale);
  // The deciding keyword, and (faint) any other keyword the rule never got to.
  const marks = new Map<number, Tone>();
  const faint = new Set<number>();
  tokenize(sentence.text, locale).forEach((tok, i) => {
    const lower = tok.surface.toLowerCase();
    const sport: Sport | null = rule.football.some((k) => lower.startsWith(k))
      ? "football"
      : rule.basketball.some((k) => lower.startsWith(k))
        ? "basketball"
        : null;
    if (!sport) return;
    marks.set(i, sport);
    if (i !== trace.token) faint.add(i);
  });
  const fr = locale === "fr";
  const lines: ReactNode[] = [
    <>
      {fr ? "Si la phrase contient " : "If the sentence contains "}
      <KeywordList words={rule.football} sport="football" locale={locale} />
      {fr ? " : " : ": "}
      <strong>{t(T.football).toLowerCase()}</strong>.
    </>,
    <>
      {fr ? "Sinon, si elle contient " : "Otherwise, if it contains "}
      <KeywordList words={rule.basketball} sport="basketball" locale={locale} />
      {fr ? " : " : ": "}
      <strong>{t(T.basketball).toLowerCase()}</strong>.
    </>,
    <>
      {fr ? "Sinon : " : "Otherwise: "}
      <strong>{sportName(t, rule.fallback).toLowerCase()}</strong>.
    </>,
  ];
  return (
    <div className={styles.rulesGrid}>
      <div className={styles.ruleCol}>
        <ol className={styles.ruleList}>
          {lines.map((line, k) => (
            <li key={k} className={cx(styles.ruleLine, k === trace.line && styles.ruleLineOn)}>
              {line}
            </li>
          ))}
        </ol>
        <p className={styles.score}>
          {fr
            ? `Testée sur les 24 phrases d'exemple : juste pour ${SCORES.fr.ruleSmall}.`.replace(" :", " :")
            : `Tested on the 24 example sentences: right on ${SCORES.en.ruleSmall}.`}
        </p>
      </div>
      <div className={styles.judgedCol}>
        <Sentence text={sentence.text} locale={locale} marks={marks} faint={faint} className={styles.bigSentence} />
        {failing && <Truth sport={sentence.label} t={t} />}
        <Verdict who={t(T.rules.says)} sport={trace.verdict} right={trace.verdict === sentence.label} t={t} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- tree */

function treeText(t: Tr, locale: Locale): TreeText {
  return {
    question: locale === "fr" ? ["Contient « ", " » ?"] : ["Contains “", "”?"],
    yes: locale === "fr" ? "oui" : "yes",
    no: locale === "fr" ? "non" : "no",
    label: (s) => sportName(t, s),
    word: (w) => displayWord(w, locale),
  };
}

/** Words of the sentence that answered "yes" on the path, toned like the sport that answer points to. */
function pathMarks(text: string, locale: Locale, steps: TreeStep[]): Map<number, Tone> {
  const tested = new Map<string, Tone>();
  for (const s of steps) if (s.answer) tested.set(s.node.word, yesTone(s.node));
  const out = new Map<number, Tone>();
  tokenize(text, locale).forEach((tok, i) => {
    const tone = tok.stop ? undefined : tested.get(tok.word);
    if (tone) out.set(i, tone);
  });
  return out;
}

/**
 * 0 the 24 labelled sentences, 1 the learned tree alone (no sentence, no
 * path), 2 one example walks down the tree (previous / next on the controller).
 *
 * Steps 1 and 2 return one layout keyed by the example: going from the tree
 * alone to the first walk keeps the DOM, so the path lights up smoothly, while
 * a new example mounts fresh. Reusing the DOM across examples made the CSS
 * transitions start from the previous example: its highlight slid onto
 * whatever word of the new sentence sat at the same position, and its leaf
 * stayed lit while the new verdict was already printed.
 */
export function TreeStage({ step, t, locale, example }: { step: number; t: Tr; locale: Locale; example: number }) {
  const set = pick(SMALL_SET, locale);
  if (step === 0) {
    return (
      <div className={styles.columns}>
        {(["football", "basketball"] as const).map((sport) => (
          <ul key={sport} className={styles.exampleList}>
            {set
              .filter((s) => s.label === sport)
              .map((s) => (
                <Labelled key={s.text} s={s} locale={locale} />
              ))}
          </ul>
        ))}
      </div>
    );
  }
  const tree = textTree(locale);
  const walk = step >= 2;
  const s = set[example]!;
  const { steps, verdict } = treePath(tree, wordSet(s.text, locale));
  return (
    <div className={styles.treeLayout} key={`example-${example}`} data-example={walk ? example : undefined}>
      <div className={styles.treeTop}>
        {walk ? (
          <Sentence text={s.text} locale={locale} marks={pathMarks(s.text, locale, steps)} className={styles.bigSentence} />
        ) : (
          <p className={styles.treeRead}>{t(T.tree.read)}</p>
        )}
      </div>
      <div className={styles.treeRow}>
        <div className={styles.treeCol}>
          <TreeDiagram
            tree={tree}
            width={1100}
            levelH={190}
            text={treeText(t, locale)}
            path={walk ? steps : undefined}
            verdictWrong={walk && verdict !== s.label}
          />
        </div>
        <div className={styles.treeSide}>
          {walk && <Truth sport={s.label} t={t} />}
          {walk && <Verdict who={t(T.tree.says)} sport={verdict} right={verdict === s.label} t={t} />}
          <p className={styles.score}>
            {locale === "fr"
              ? `Apprises sur 24 exemples. Juste pour ${SCORES.fr.treeSmall} d'entre eux.`
              : `Learned from 24 examples. Right on ${SCORES.en.treeSmall} of them.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function UnseenStage({
  step,
  t,
  locale,
  sentence,
  removed,
  onToken,
}: {
  step: number;
  t: Tr;
  locale: Locale;
  sentence: LabelledSentence;
  removed: ReadonlySet<number>;
  onToken?: (i: number) => void;
}) {
  const tree = textTree(locale);
  // Step 0: the tree and the sentence, posed as a question (nothing revealed). Step 1: everything at once.
  const open = step >= 1;
  const read = open ? withoutTokens(sentence.text, locale, removed) : sentence.text;
  const { steps, verdict } = treePath(tree, wordSet(read, locale));
  const edited = open && removed.size > 0;
  return (
    <div className={styles.treeLayout}>
      <div className={styles.treeTop}>
        <Sentence
          text={sentence.text}
          locale={locale}
          marks={open ? pathMarks(read, locale, steps) : undefined}
          removed={open ? removed : undefined}
          onToken={open ? onToken : undefined}
          className={styles.bigSentence}
        />
      </div>
      <div className={styles.treeRow}>
        <div className={styles.treeCol}>
          <TreeDiagram
            tree={tree}
            width={1100}
            levelH={190}
            text={treeText(t, locale)}
            path={open ? steps : undefined}
            verdictWrong={open && !edited && verdict !== sentence.label}
          />
        </div>
        <div className={styles.treeSide}>
          {open ? (
            <>
              {!edited && <Truth sport={sentence.label} t={t} />}
              <Verdict who={t(T.tree.says)} sport={verdict} right={edited ? null : verdict === sentence.label} t={t} />
            </>
          ) : (
            <div className={styles.verdict}>
              <span className={styles.verdictWho}>{t(T.tree.says)}</span>
              <span className={styles.verdictPending}>?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- network frame */

/** Line-thickness references: a high percentile of each layer's weights in the trained network. */
function netScale(locale: Locale): [number, number] {
  const net = textNet(locale);
  const pct = (xs: number[], q: number) => {
    const a = xs.map(Math.abs).sort((x, y) => x - y);
    return a[Math.floor(q * (a.length - 1))] || 1;
  };
  return [pct(net.W[0]!.flat(), 0.97), pct(net.W[1]!.flat(), 1)];
}

/** "Simplified view of the real network: 201 words, 16 neurons, 3,249 connections." */
function simplifiedNote(t: Tr, locale: Locale): string {
  const net = textNet(locale);
  return t(T.simplified(fmtInt(net.vocab.length, locale), fmtInt(netParameterCount(locale), locale)));
}

/**
 * The frame the three network scenes share, like llm/TrainingLoop: optional
 * phase chips, a big headline per step, the sentence on a card (with the right
 * answer stamped when known), the big diagram, a caption, small print.
 */
function NetFrame({
  chips,
  now,
  headline,
  still,
  children,
  footnote,
  controls,
  overlay,
  dim,
}: {
  chips?: string[];
  now?: number;
  headline: string;
  still: boolean;
  children: ReactNode;
  footnote: string;
  controls?: ReactNode;
  overlay?: ReactNode;
  dim?: boolean;
}) {
  return (
    <div className={cx(styles.learn, still && styles.still)}>
      <div className={cx(styles.frameContent, dim && styles.frameDim)}>
        {chips && (
          <ol className={styles.phases}>
            {chips.map((c, k) => (
              <li key={k} className={cx(styles.phase, k === now && styles.phaseNow, now !== undefined && k > now && styles.phaseLater)}>
                {c}
              </li>
            ))}
          </ol>
        )}
        <h2 className={styles.learnHeadline} key={headline}>
          <Rich text={headline} />
        </h2>
        {children}
      </div>
      <div className={styles.learnFooter}>
        <span className={styles.smallPrint}>{footnote}</span>
        {controls}
      </div>
      {overlay}
    </div>
  );
}

function SentenceCard({
  text,
  locale,
  t,
  stamp,
  removed,
  onToken,
  fast,
}: {
  text: string;
  locale: Locale;
  t: Tr;
  /** The right answer, stamped next to the sentence; "?" when null; nothing when undefined. */
  stamp?: Sport | null;
  removed?: ReadonlySet<number>;
  onToken?: (i: number) => void;
  fast?: boolean;
}) {
  return (
    <figure className={styles.card}>
      <Sentence text={text} locale={locale} removed={removed} onToken={onToken} className={cx(styles.cardSentence, fast && styles.cardFast)} key={text} />
      {stamp !== undefined && (
        <span className={cx(styles.stamp, stamp && toneClass(stamp), stamp && styles.stampOn)}>
          {stamp ? (
            <>
              <SportGlyph sport={stamp} size={44} />
              {sportName(t, stamp)}
            </>
          ) : (
            "?"
          )}
        </span>
      )}
    </figure>
  );
}

function VerdictMark({ right, t }: { right: boolean; t: Tr }) {
  return (
    <span className={cx(styles.netMark, right ? styles.netMarkRight : styles.netMarkWrong)} aria-label={t(right ? T.right : T.wrong)}>
      {right ? <CheckIcon /> : <CrossIcon />}
    </span>
  );
}

/** Three of the biggest weights, one per word, labelled with their real value. */
function biggestLines(view: SimpleView, locale: Locale, n = 3): LineLabel[] {
  const all = view.w1.flatMap((row, i) => row.map((w, k) => ({ n: i, k, w }))).sort((a, b) => Math.abs(b.w) - Math.abs(a.w));
  const picked: typeof all = [];
  for (const x of all) {
    if (picked.length >= n) break;
    if (!picked.some((p) => Math.abs(p.k - x.k) < 2)) picked.push(x);
  }
  return picked.map((x) => ({ n: x.n, k: x.k, text: fmtSigned(x.w, locale) }));
}

const fmtSigned = (v: number, locale: Locale) => {
  const s = Math.abs(v).toLocaleString(intlLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return Math.abs(v) < 0.005 ? s : v < 0 ? `−${s}` : s;
};

/* -------------------------------------------------------------- network */

/**
 * What is inside a network, one idea per step, on the trained network and the
 * trap sentence: 0 words go in, 1 every connection is a weight, 2 each neuron
 * adds up what reaches it, 3 two scores as percentages (and tree vs network).
 */
function NetworkStage({ step, t, locale, still }: { step: number; t: Tr; locale: Locale; still: boolean }) {
  const net = textNet(locale);
  const s = pick(TREE_TRAP, locale);
  const scale = useMemo(() => netScale(locale), [locale]);
  const view = useMemo(() => simpleView(net, simpleSelect(net, s.text, locale)), [net, s.text, locale]);
  const act = useMemo(() => simpleActivity(net, view, s.text, locale), [net, view, s.text, locale]);
  const sc = pick(SCORES, locale);
  const verdict: Sport = act.p >= 0.5 ? "basketball" : "football";
  return (
    <NetFrame
      chips={T.network.chips.map(t)}
      now={step}
      headline={t(T.network.headlines[step]!)}
      still={still}
      footnote={simplifiedNote(t, locale)}
    >
      <SentenceCard text={s.text} locale={locale} t={t} />
      <SimpleNet
        locale={locale}
        view={view}
        act={act}
        width={1728}
        height={520}
        scale={scale}
        show={{ inputs: true, weights: step >= 1, neurons: step >= 2, outputs: step >= 3 }}
        label={(x) => sportName(t, x)}
        lineLabels={step === 1 ? biggestLines(view, locale) : []}
        bars
        verdictMark={<VerdictMark right={verdict === s.label} t={t} />}
        animate={!still}
      />
      <p className={styles.netCaption}>
        {step < 3
          ? t(T.network.captions[step]!)
          : t(T.network.compare(fmtPct(sc.treeTest / sc.testTotal, locale), fmtPct(sc.netTest / sc.testTotal, locale)))}
      </p>
    </NetFrame>
  );
}

/* ------------------------------------------------------------- learning */

/** What the stream shows at one moment; computed by the controller, published as scene state. */
export interface TrainSnapshot {
  steps: number;
  seen: number;
  done: boolean;
  text: string;
  label: Sport;
  view: SimpleView;
  act: SimpleActivity;
}

function snapshotOf(tr: TextNetTraining): TrainSnapshot {
  const s = tr.data[tr.lastBatch[0] ?? 0]!;
  const sel = simpleSelect(tr.model, s.text, tr.locale);
  const view = simpleView(tr.model, sel);
  const act = simpleActivity(tr.model, sel, s.text, tr.locale);
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    steps: tr.steps,
    seen: tr.seen,
    done: tr.done,
    text: s.text,
    label: s.label,
    view: roundSimple(view),
    act: { inputs: act.inputs, hidden: act.hidden.map(r), p: r(act.p) },
  };
}

/** Pace of a live training: after `steps` mini-batches, how many to do next and after how long (ms). */
type Pace = (steps: number) => { batches: number; delay: number };

/** The stream: a few readable sentences, then faster and faster (more mini-batches per tick). */
const streamPace: Pace = (steps) => (steps < 4 ? { batches: 1, delay: 1300 } : { batches: 1 + Math.floor(steps * 0.09), delay: steps < 12 ? 500 : 140 });

/**
 * Runs the real seeded training on the controller only, publishing a small
 * snapshot after each tick; the display only draws the snapshots. Resumes
 * from `startSteps` (same seed, same numbers), restarts when `run` changes,
 * jumps to the end when `skip` changes or motion is reduced.
 */
function useLiveTraining({
  isController,
  locale,
  startSteps,
  run,
  skip,
  reducedMotion,
  publish,
  next,
}: {
  isController: boolean;
  locale: Locale;
  startSteps: number;
  run: number;
  skip: number;
  reducedMotion: boolean;
  publish: (s: TrainSnapshot) => void;
  next: Pace;
}) {
  const publishRef = useRef(publish);
  publishRef.current = publish;
  const startAt = useRef(startSteps);
  startAt.current = startSteps;
  const skipRef = useRef(skip);
  useEffect(() => {
    if (!isController) return;
    const tr = new TextNetTraining(locale);
    while (tr.steps < startAt.current && tr.step());
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (reducedMotion || skipRef.current !== skip) {
      skipRef.current = skip;
      while (tr.step());
      publishRef.current(snapshotOf(tr));
      return;
    }
    const tick = () => {
      const { batches } = next(tr.steps);
      for (let k = 0; k < batches && tr.step(); k++);
      publishRef.current(snapshotOf(tr));
      if (!tr.done) timer = setTimeout(tick, next(tr.steps).delay);
    };
    if (!tr.done) timer = setTimeout(tick, tr.steps === 0 ? 600 : next(tr.steps).delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isController, locale, run, skip, reducedMotion]);
}

/** The lines that moved most in the nudge (one per word, so labels do not pile up), labelled "before → after" with an arrow. */
function movedLines(before: SimpleView, after: SimpleView, locale: Locale, n = 4): LineLabel[] {
  const all = after.w1
    .flatMap((row, i) => row.map((w, k) => ({ n: i, k, a: before.w1[i]![k]!, b: w })))
    .sort((x, y) => Math.abs(y.b - y.a) - Math.abs(x.b - x.a));
  const picked: typeof all = [];
  for (const x of all) {
    if (picked.length >= n) break;
    if (!picked.some((p) => Math.abs(p.k - x.k) < 2)) picked.push(x);
  }
  return picked
    .sort((x, y) => x.k - y.k)
    .map((x) => ({ n: x.n, k: x.k, text: `${fmtSigned(x.a, locale)} \u2192 ${fmtSigned(x.b, locale)}`, dir: x.b >= x.a ? ("up" as const) : ("down" as const) }));
}

/**
 * How the network learns, on the same big diagram: 0 guess (random weights),
 * 1 compare (the right answer stamped, the gap), 2 nudge (real gradient step:
 * lines change, the most-moved labelled before → after), 3 again (a bit
 * better), 4 again and again (the real seeded training streams on the
 * controller, sentences seen, accuracy on new sentences).
 */
function LearningStage({
  step,
  t,
  locale,
  role,
  reducedMotion,
  state,
  setState,
  interactive,
  act: onAction,
}: {
  step: number;
  t: Tr;
  locale: Locale;
  role: SceneRole;
  reducedMotion: boolean;
  state: TextClassifierLabState;
  setState: (next: TextClassifierLabState | ((prev: TextClassifierLabState) => TextClassifierLabState)) => void;
  interactive: boolean;
  act: (a: LabAction) => void;
}) {
  const beat = learningBeat(locale);
  const isController = role === "controller";
  const still = reducedMotion || role === "preview";
  const scale = useMemo(() => netScale(locale), [locale]);
  const streaming = step >= 4;
  const initial = useMemo(() => snapshotOf(new TextNetTraining(locale)), [locale]);
  useLiveTraining({
    isController: isController && streaming,
    locale,
    startSteps: state.train?.steps ?? 0,
    run: state.trainRun ?? 0,
    skip: state.trainSkip ?? 0,
    reducedMotion: still,
    publish: (train) => setState((prev) => ({ ...prev, train })),
    next: streamPace,
  });
  const snap = state.train ?? initial;

  // One selection (words, neurons) for the whole single-sentence beat, from the starting network.
  const sel = useMemo(() => simpleSelect(beat.before, beat.sentence.text, locale), [beat, locale]);
  const before = useMemo(() => simpleView(beat.before, sel), [beat, sel]);
  const after = useMemo(() => simpleView(beat.after, sel), [beat, sel]);
  const actBefore = useMemo(() => simpleActivity(beat.before, sel, beat.sentence.text, locale), [beat, sel, locale]);
  const actAfter = useMemo(() => simpleActivity(beat.after, sel, beat.sentence.text, locale), [beat, sel, locale]);

  const s: LabelledSentence = streaming ? { text: snap.text, label: snap.label } : beat.sentence;
  const view = streaming ? snap.view : step >= 2 ? after : before;
  const act = streaming ? snap.act : step >= 3 ? actAfter : actBefore;
  const said: Sport = act.p >= 0.5 ? "basketball" : "football";
  const right = beat.sentence.label;
  const pRight = (p: number) => (right === "basketball" ? p : 1 - p);
  const pct = (p: number) => fmtPct(Math.round(p * 100) / 100, locale);
  const curve = accuracyCurve(locale);
  const totalSeen = useMemo(() => {
    const tr = new TextNetTraining(locale);
    return tr.epochs * tr.data.length;
  }, [locale]);

  let caption: ReactNode = null;
  if (step === 0) caption = t(T.learning.randomNote);
  if (step === 1)
    caption = (
      <>
        {t(T.learning.gave(sportName(t, right).toLowerCase(), pct(pRight(beat.pBefore))))} <strong className={styles.errorText}>{t(T.learning.wrongBy)}</strong>
      </>
    );
  if (step === 2) caption = <strong>{t(T.learning.nudgeNote)}</strong>;
  if (step === 3) caption = <strong className={styles.betterText}>{t(T.learning.better(pct(pRight(beat.pBefore)), pct(pRight(beat.pAfter))))}</strong>;

  const diagram = (
    <SimpleNet
      locale={locale}
      view={view}
      act={act}
      width={streaming ? 1080 : 1728}
      height={streaming ? 560 : 500}
      scale={scale}
      show={{ inputs: true, weights: true, neurons: true, outputs: true }}
      label={(x) => sportName(t, x)}
      lineLabels={step === 2 ? movedLines(before, after, locale) : []}
      movedFrom={step === 2 ? before : undefined}
      bars={!streaming}
      gapFor={step === 1 || step === 2 ? right : null}
      verdictMark={streaming ? undefined : <VerdictMark right={said === right} t={t} />}
      animate={!still}
    />
  );

  return (
    <NetFrame
      chips={T.learning.words.map(t)}
      now={Math.min(step, 3)}
      headline={t(T.learning.phases[step]!)}
      still={still}
      footnote={simplifiedNote(t, locale)}
      controls={
        interactive && streaming ? (
          <ControlBar>
            <SceneButton onClick={() => onAction({ type: "restart" })}>{t(T.network.restart)}</SceneButton>
            <SceneButton disabled={state.train?.done} onClick={() => onAction({ type: "skip" })}>
              {t(T.network.skip)}
            </SceneButton>
          </ControlBar>
        ) : null
      }
    >
      <SentenceCard text={s.text} locale={locale} t={t} stamp={step >= 1 || streaming ? s.label : null} fast={streaming} />
      {streaming ? (
        <div className={styles.streamRow}>
          {diagram}
          <div className={styles.counterPanel}>
            <h3 className={styles.panelTitle}>{t(T.learning.seen)}</h3>
            <p className={styles.count}>
              {fmtInt(snap.seen, locale)}
              <span className={styles.countOf}> {t(T.learning.of(fmtInt(totalSeen, locale)))}</span>
            </p>
            <h3 className={styles.panelTitle}>
              {t(T.learning.curve)} <span className={styles.curveNow}>{fmtPct(curve[Math.min(snap.steps, curve.length - 1)]!, locale)}</span>
            </h3>
            <AccuracyCurve curve={curve} upTo={snap.steps} locale={locale} t={t} />
          </div>
        </div>
      ) : (
        <>
          {diagram}
          <p className={styles.netCaption}>{caption}</p>
        </>
      )}
    </NetFrame>
  );
}

/** Share of the 200 new sentences it gets right, after each mini-batch (log scale of progress, like TrainingLoop's curve). */
function AccuracyCurve({ curve, upTo, locale, t }: { curve: number[]; upTo: number; locale: Locale; t: Tr }) {
  const W = 560;
  const H = 260;
  const n = curve.length - 1;
  const x = (k: number) => 70 + (Math.log1p(k) / Math.log1p(n)) * (W - 90);
  const y = (v: number) => 14 + (1 - v) * (H - 54);
  const last = Math.max(0, Math.min(n, upTo));
  const d = curve
    .slice(0, last + 1)
    .map((v, k) => `${k === 0 ? "M" : "L"}${x(k).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg className={styles.curve} viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line className={styles.curveGrid} x1={x(0)} x2={x(n)} y1={y(v)} y2={y(v)} />
          <text className={styles.curveTick} x={x(0) - 12} y={y(v) + 6} textAnchor="end">
            {fmtPct(v, locale)}
          </text>
        </g>
      ))}
      <path className={styles.curveLine} d={d} />
      <circle className={styles.curveDot} cx={x(last)} cy={y(curve[last]!)} r={9} />
      <text className={styles.curveTick} x={x(0)} y={H - 8}>
        {t(T.learning.start)}
      </text>
      <text className={styles.curveTick} x={x(n)} y={H - 8} textAnchor="end">
        {t(T.learning.end)}
      </text>
    </svg>
  );
}

/* --------------------------------------------------------- network-fail */

/**
 * The trained network on a new sentence it gets wrong with confidence:
 * 0 the sentence goes through (words removable on the controller), 1 the
 * hood: every drawn line and neuron with its number, none says why,
 * 2 we can test it, we cannot know in advance.
 */
function NetFailStage({
  step,
  t,
  locale,
  sentence,
  removed,
  onToken,
  still,
  controls,
}: {
  step: number;
  t: Tr;
  locale: Locale;
  sentence: LabelledSentence;
  removed: ReadonlySet<number>;
  onToken?: (i: number) => void;
  still: boolean;
  controls: ReactNode;
}) {
  const net = textNet(locale);
  const scale = useMemo(() => netScale(locale), [locale]);
  // The drawing is chosen on the whole sentence and stays put while words are removed.
  const view = useMemo(() => simpleView(net, simpleSelect(net, sentence.text, locale)), [net, sentence.text, locale]);
  const read = withoutTokens(sentence.text, locale, removed);
  const act = simpleActivity(net, view, read, locale);
  const verdict: Sport = act.p >= 0.5 ? "basketball" : "football";
  const edited = removed.size > 0;
  const hood = step >= 1;
  return (
    <NetFrame
      headline={t(T.fail.headlines[step]!)}
      still={still}
      footnote={simplifiedNote(t, locale)}
      controls={controls}
      dim={step >= 2}
      overlay={
        step >= 2 ? (
          <div className={styles.takeaway}>
            <p>{t(T.fail.takeaway1)}</p>
            <p>{t(T.fail.takeaway2)}</p>
          </div>
        ) : null
      }
    >
      <SentenceCard text={sentence.text} locale={locale} t={t} stamp={edited ? undefined : sentence.label} removed={removed} onToken={onToken} />
      {(() => {
        const diagram = (
          <SimpleNet
            locale={locale}
            view={view}
            act={act}
            width={hood ? 1000 : 1728}
            height={hood ? 540 : 520}
            scale={scale}
            show={{ inputs: true, weights: true, neurons: true, outputs: true }}
            label={(x) => sportName(t, x)}
            allNumbers={hood}
            bars={!hood}
            verdictMark={edited || hood ? undefined : <VerdictMark right={verdict === sentence.label} t={t} />}
            animate={!still}
          />
        );
        return hood ? (
          <div className={styles.hoodRow}>
            {diagram}
            <WeightTable view={view} scale={scale} locale={locale} t={t} />
          </div>
        ) : (
          diagram
        );
      })()}
      <p className={styles.netCaption}>{hood ? t(T.fail.hood) : edited ? " " : <strong className={styles.errorText}>{t(T.fail.sure)}</strong>}</p>
    </NetFrame>
  );
}

/** Every weight drawn in the diagram, as a table: one row per word, one column per neuron, and the neurons' weights to the output. */
function WeightTable({ view, scale, locale, t }: { view: SimpleView; scale: [number, number]; locale: Locale; t: Tr }) {
  const cell = (w: number, toB: boolean, ref: number, key: string) => (
    <td key={key} className={cx(styles.weightCell, toB ? styles.toneBasketball : styles.toneFootball)} style={{ ["--w" as string]: `${Math.round(Math.min(1, Math.abs(w) / ref) * 60)}%` }}>
      {fmtSigned(w, locale)}
    </td>
  );
  return (
    <table className={styles.weightTable}>
      <thead>
        <tr>
          <th />
          {view.neurons.map((_, n) => (
            <th key={n}>{t(T.fail.neuron(n + 1))}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {view.words.map((w, k) => (
          <tr key={k}>
            <th>{w.label}</th>
            {view.neurons.map((_, n) => cell(view.w1[n]![k]!, view.w1[n]![k]! * view.w2[n]! >= 0, scale[0], `${n}`))}
          </tr>
        ))}
        <tr>
          <th>{t(T.fail.toOutput)}</th>
          {view.w2.map((w, n) => cell(w, w >= 0, scale[1], `o${n}`))}
        </tr>
      </tbody>
    </table>
  );
}
