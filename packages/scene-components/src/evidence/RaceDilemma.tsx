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
    fr: "Une analogie (le dilemme du prisonnier), pas un modèle d'entreprises ou de pays réels",
  },
  a: { en: "Developer A", fr: "Développeur A" },
  b: { en: "Developer B", fr: "Développeur B" },
  careful: { en: "Take time for safety", fr: "Prendre le temps de la sécurité" },
  race: { en: "Race ahead", fr: "Accélérer" },
  ranks: {
    en: "Rankings illustrate the structure of the dilemma. They are not measurements.",
    fr: "Les classements illustrent la structure du dilemme. Ce ne sont pas des mesures.",
  },
  levers: { en: "What can change the game", fr: "Ce qui peut changer la donne" },
  limits: { en: "Where the analogy breaks", fr: "Les limites de l'analogie" },
} as const;

const RANK_WORD = {
  4: { en: "best", fr: "le mieux" },
  3: { en: "good", fr: "bien" },
  2: { en: "poor", fr: "médiocre" },
  1: { en: "worst", fr: "le pire" },
} as const;

const OUTCOME: Record<CellId, { en: string; fr: string }> = {
  "careful-careful": { en: "Both take precautions. Nobody falls behind.", fr: "Les deux prennent leurs précautions. Personne ne prend de retard." },
  "careful-race": { en: "B pulls ahead. A falls behind.", fr: "B prend l'avantage. A prend du retard." },
  "race-careful": { en: "A pulls ahead. B falls behind.", fr: "A prend l'avantage. B prend du retard." },
  "race-race": { en: "Both rush. Risks rise for everyone.", fr: "Les deux se précipitent. Les risques montent pour tous." },
};

const CAPTIONS = [
  { en: "Two developers each choose, without knowing the other's choice.", fr: "Deux développeurs choisissent chacun, sans connaître le choix de l'autre." },
  { en: "Each outcome, as each side might rank it.", fr: "Chaque issue, telle que chaque camp pourrait la classer." },
  { en: "If A takes its time, B does better by racing.", fr: "Si A prend son temps, B a intérêt à accélérer." },
  { en: "If A races, B still does better by racing.", fr: "Si A accélère, B a encore intérêt à accélérer." },
  { en: "Both race, and both end up worse off than if they had coordinated.", fr: "Les deux accélèrent, et finissent moins bien lotis que s'ils s'étaient coordonnés." },
  { en: "The trap is in the structure, not in anyone's character.", fr: "Le piège tient à la structure, pas au caractère de quiconque." },
] as const;

const LEVERS = [
  { en: "Agreements that can be checked", fr: "Des accords vérifiables" },
  { en: "Shared rules that apply to everyone", fr: "Des règles communes qui s'appliquent à tous" },
  { en: "Repeated interaction and trust", fr: "Des interactions répétées et de la confiance" },
  { en: "Making safety cheaper, or rewarding it", fr: "Rendre la sécurité moins coûteuse, ou la récompenser" },
];

const LIMITS = [
  { en: "Many players, not two", fr: "Beaucoup d'acteurs, pas deux" },
  { en: "Payoffs are uncertain and disputed", fr: "Les gains sont incertains et discutés" },
  { en: "Not every actor sees it as a race", fr: "Tous les acteurs ne voient pas cela comme une course" },
];

function Rank({ value, who, locale }: { value: number; who: string; locale: "fr" | "en" }) {
  const word = RANK_WORD[value as 1 | 2 | 3 | 4][locale];
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
  const label = (c: Choice) => (c === "careful" ? COPY.careful[locale] : COPY.race[locale]);

  const choose = (id: CellId) => {
    if (interactive) ctx.setState({ cell: picked === id ? null : id, atStep: ctx.revealStep });
  };

  return (
    <div className={`${styles.root} ${ctx.reducedMotion || role === "preview" ? common.still : ""}`}>
      <header className={styles.header}>
        <EvidenceBadge level="thought-experiment" locale={locale} size="md" />
        <span className={styles.analogy}>{COPY.analogy[locale]}</span>
      </header>

      <div className={styles.matrix}>
        <span className={styles.playerB}>{COPY.b[locale]}</span>
        <span className={styles.playerA}>{COPY.a[locale]}</span>
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
                  <span className={styles.outcome}>{OUTCOME[id][locale]}</span>
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
        <p className={styles.caption} key={step}>{CAPTIONS[step]![locale]}</p>
        {step >= 1 && step < STEP_COUNT ? <p className={styles.note}>{COPY.ranks[locale]}</p> : null}
        {step >= STEP_COUNT ? (
          <div className={styles.lists}>
            <section>
              <h3>{COPY.levers[locale]}</h3>
              <ul>{LEVERS.map((l) => <li key={l.en}>{l[locale]}</li>)}</ul>
            </section>
            <section className={styles.limits}>
              <h3>
                <EvidenceBadge level="contested" locale={locale} size="sm" /> {COPY.limits[locale]}
              </h3>
              <ul>{LIMITS.map((l) => <li key={l.en}>{l[locale]}</li>)}</ul>
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
