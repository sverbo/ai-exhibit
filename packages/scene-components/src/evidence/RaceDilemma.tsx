import { tr, type L10n } from "@ai-exhibit/presentation-core";
import type { SceneComponentProps } from "../contract.ts";
import { EvidenceBadge } from "../primitives/EvidenceBadge.tsx";
import { type CellId, type Choice, CHOICES, cellId, PAYOFFS, STEP_COUNT, stepFocus } from "./raceDilemma.ts";
import { stopShellKeys } from "./shared.ts";
import common from "./common.module.css";
import styles from "./RaceDilemma.module.css";

export interface RaceDilemmaState {
  cell: CellId | null;
  atStep: number;
}

const COPY = {
  analogy: {
    en: "An analogy (the prisoner's dilemma), not a model of real companies or countries",
  },
  a: { en: "Developer A" },
  b: { en: "Developer B" },
  careful: { en: "Take time for safety" },
  race: { en: "Race ahead" },
  ranks: {
    en: "Rankings illustrate the structure of the dilemma. They are not measurements.",
  },
  levers: { en: "What can change the game" },
  limits: { en: "Where the analogy breaks" },
} as const;

const RANK_WORD = {
  4: { en: "best" },
  3: { en: "good" },
  2: { en: "poor" },
  1: { en: "worst" },
} as const;

const OUTCOME: Record<CellId, L10n> = {
  "careful-careful": { en: "Both take precautions. Nobody falls behind." },
  "careful-race": { en: "B pulls ahead. A falls behind." },
  "race-careful": { en: "A pulls ahead. B falls behind." },
  "race-race": { en: "Both rush. Risks rise for everyone." },
};

const CAPTIONS = [
  { en: "Two developers each choose, without knowing the other's choice." },
  { en: "Each outcome, as each side might rank it." },
  { en: "If A takes its time, B does better by racing." },
  { en: "If A races, B still does better by racing." },
  { en: "Both race, and both end up worse off than if they had coordinated." },
  { en: "The trap is in the structure, not in anyone's character." },
] as const;

const LEVERS = [
  { en: "Agreements that can be checked" },
  { en: "Shared rules that apply to everyone" },
  { en: "Repeated interaction and trust" },
  { en: "Making safety cheaper, or rewarding it" },
];

const LIMITS = [
  { en: "Many players, not two" },
  { en: "Payoffs are uncertain and disputed" },
  { en: "Not every actor sees it as a race" },
];

function Rank({ value, who, locale }: { value: number; who: string; locale: "fr" | "en" }) {
  const word = tr(RANK_WORD[value as 1 | 2 | 3 | 4], locale);
  return (
    <span className={styles.rank} data-rank={value}>
      <span className={styles.who}>{who}</span>
      <span className={styles.pips} aria-hidden="true">
        {[1, 2, 3, 4].map((p) => (
          <span key={p} className={p <= value ? styles.pipOn : styles.pip} />
        ))}
      </span>
      <span className={styles.rankWord}>{word}</span>
    </span>
  );
}

export function RaceDilemma({ ctx }: SceneComponentProps<Record<string, never>, RaceDilemmaState>) {
  const { locale, role } = ctx;
  const step = role === "preview" ? 1 : Math.min(ctx.revealStep, STEP_COUNT);
  const focus = stepFocus(step);
  const picked = ctx.state && ctx.state.atStep === ctx.revealStep ? ctx.state.cell : null;
  const emphasized = new Set<CellId>(picked ? [picked] : focus.cells);
  const interactive = role === "controller";
  const label = (c: Choice) => (c === "careful" ? tr(COPY.careful, locale) : tr(COPY.race, locale));

  const choose = (id: CellId) => {
    if (interactive) ctx.setState({ cell: picked === id ? null : id, atStep: ctx.revealStep });
  };

  return (
    <div className={`${styles.root} ${ctx.reducedMotion || role === "preview" ? common.still : ""}`}>
      <header className={styles.header}>
        <EvidenceBadge level="thought-experiment" locale={locale} size="md" />
        <span className={styles.analogy}>{tr(COPY.analogy, locale)}</span>
      </header>

      <div className={styles.matrix}>
        <span className={styles.playerB}>{tr(COPY.b, locale)}</span>
        <span className={styles.playerA}>{tr(COPY.a, locale)}</span>
        {CHOICES.map((b, j) => (
          <span key={b} className={styles.choiceCol} style={{ gridColumn: 3 + j }}>{label(b)}</span>
        ))}
        {CHOICES.map((a, i) => (
          <span key={a} className={styles.choiceRow} style={{ gridRow: 3 + i }}>{label(a)}</span>
        ))}
        {CHOICES.flatMap((a, i) =>
          CHOICES.map((b, j) => {
            const id = cellId(a, b);
            const p = PAYOFFS[id];
            const hi = emphasized.has(id);
            const dim = emphasized.size > 0 && !hi;
            const isEq = step >= 4 && id === "race-race";
            const content =
              step >= 1 ? (
                <>
                  <Rank value={p.a} who="A" locale={locale} />
                  <Rank value={p.b} who="B" locale={locale} />
                  <span className={styles.outcome}>{tr(OUTCOME[id], locale)}</span>
                </>
              ) : (
                <span className={styles.unknown} aria-hidden="true">?</span>
              );
            const focusB = !picked && focus.compareRowA !== undefined && hi;
            const cls = `${styles.cell} ${hi ? styles.hi : ""} ${dim ? styles.dim : ""} ${isEq ? styles.eq : ""} ${focusB ? styles.focusB : ""}`;
            const place = { gridRow: 3 + i, gridColumn: 3 + j };
            return interactive ? (
              <button key={id} type="button" className={cls} style={place} aria-pressed={picked === id} onClick={() => choose(id)} onKeyDown={stopShellKeys}>
                {content}
              </button>
            ) : (
              <div key={id} className={cls} style={place}>{content}</div>
            );
          }),
        )}
      </div>

      <aside className={styles.side}>
        <p className={styles.caption} key={step}>{tr(CAPTIONS[step]!, locale)}</p>
        {step >= 1 && step < STEP_COUNT ? <p className={styles.note}>{tr(COPY.ranks, locale)}</p> : null}
        {step >= STEP_COUNT ? (
          <div className={styles.lists}>
            <section>
              <h3>{tr(COPY.levers, locale)}</h3>
              <ul>{LEVERS.map((l) => <li key={l.en}>{tr(l, locale)}</li>)}</ul>
            </section>
            <section className={styles.limits}>
              <h3>
                <EvidenceBadge level="contested" locale={locale} size="sm" /> {tr(COPY.limits, locale)}
              </h3>
              <ul>{LIMITS.map((l) => <li key={l.en}>{tr(l, locale)}</li>)}</ul>
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
