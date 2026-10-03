import type { SceneComponentProps } from "../../contract.ts";
import { useSceneState } from "../../learning/shared/sceneState.ts";
import { ControlBar, Disclosure, SceneHeading, Segmented, cx, l, type L10n } from "../../learning/shared/ui.tsx";
import { Icon, type IconName } from "../shared/icons.tsx";
import { SearchCompare } from "./SearchCompare.tsx";
import { WeatherWalkthrough } from "./WeatherWalkthrough.tsx";
import styles from "./ToolCallDemo.module.css";

export type ToolScenario = "weather" | "search" | "calculator" | "code";
/** Side-by-side scenarios (text-only model vs model with tools). "weather" is the JSON walkthrough. */
type CompareScenario = Exclude<ToolScenario, "weather">;
const SCENARIOS: CompareScenario[] = ["search", "calculator", "code"];
const ALL_SCENARIOS: ToolScenario[] = ["weather", ...SCENARIOS];

export interface ToolCallDemoProps {
  /** Which example opens the scene; the presenter can switch live. */
  scenario?: ToolScenario;
  heading?: L10n;
}

export interface ToolCallState {
  scenario: ToolScenario;
}

interface Script {
  question: L10n;
  plainAnswer: L10n;
  plainNote: L10n;
  tool: string;
  icon: IconName;
  call: L10n;
  result: L10n;
  answer: L10n;
}

const SCRIPTS: Record<CompareScenario, Script> = {
  search: {
    question: l("Il fera beau demain à Lyon ?", "Will the weather be nice in Lyon tomorrow?"),
    plainAnswer: l(
      "Je ne peux pas le savoir : je n'ai pas accès aux prévisions du jour. En général, le printemps est doux à Lyon.",
      "I can't know that: I have no access to today's forecast. Spring in Lyon is usually mild.",
    ),
    plainNote: l("Le modèle ne connaît que ce qu'il a vu pendant son entraînement.", "The model only knows what it saw during training."),
    tool: "web_search",
    icon: "search",
    call: l('{\n  "tool": "web_search",\n  "query": "météo Lyon demain"\n}', '{\n  "tool": "web_search",\n  "query": "Lyon weather tomorrow"\n}'),
    result: l('{\n  "lieu": "Lyon",\n  "demain": "pluie l\'après-midi, 14 °C"\n}', '{\n  "place": "Lyon",\n  "tomorrow": "afternoon rain, 14 °C"\n}'),
    answer: l("Pas vraiment : pluie l'après-midi et 14 °C. Prenez un parapluie.", "Not really: rain in the afternoon and 14 °C. Take an umbrella."),
  },
  calculator: {
    question: l("Combien font 4 837 × 2 916 ?", "What is 4,837 × 2,916?"),
    plainAnswer: l("Environ 14 millions.", "About 14 million."),
    plainNote: l("Plausible, mais approximatif : le modèle prédit des chiffres comme il prédit des mots.", "Plausible but approximate: the model predicts digits the way it predicts words."),
    tool: "calculator",
    icon: "calculator",
    call: l('{\n  "tool": "calculator",\n  "expression": "4837 * 2916"\n}', '{\n  "tool": "calculator",\n  "expression": "4837 * 2916"\n}'),
    result: l('{\n  "result": 14104692\n}', '{\n  "result": 14104692\n}'),
    answer: l("4 837 × 2 916 = 14 104 692.", "4,837 × 2,916 = 14,104,692."),
  },
  code: {
    question: l("Quel jour de la semaine tombera le 14 juillet 2030 ?", "What day of the week will 14 July 2030 be?"),
    plainAnswer: l("Je pense que ce sera un samedi.", "I think it will be a Saturday."),
    plainNote: l("Une réponse plausible, mais devinée. Ici, elle est fausse.", "A plausible answer, but a guess. Here, it is wrong."),
    tool: "run_code",
    icon: "code",
    call: l(
      '{\n  "tool": "run_code",\n  "code": "date(2030, 7, 14).strftime(\'%A\')"\n}',
      '{\n  "tool": "run_code",\n  "code": "date(2030, 7, 14).strftime(\'%A\')"\n}',
    ),
    result: l('{\n  "result": "Sunday"\n}', '{\n  "result": "Sunday"\n}'),
    answer: l("Le 14 juillet 2030 tombera un dimanche.", "14 July 2030 will be a Sunday."),
  },
};

const TEXT = {
  heading: l("Du texte, ou une action ?", "Text, or an action?"),
  plainTitle: l("Un modèle seul", "A model on its own"),
  plainSub: l("du texte entre, du texte sort", "text in, text out"),
  toolTitle: l("Un modèle avec des outils", "A model with tools"),
  toolSub: l("il peut demander au logiciel d'agir", "it can ask the software to act"),
  you: l("Vous", "You"),
  model: l("Modèle", "Model"),
  callTag: l("Ce n'est pas une réponse pour vous : c'est une demande pour le logiciel.", "This is not an answer for you: it is a request for the software."),
  runs: l("Le logiciel exécute l'outil", "The software runs the tool"),
  back: l("Le résultat revient au modèle", "The result goes back to the model"),
  example: l("Exemple", "Example"),
  search: l("Recherche", "Search"),
  calculator: l("Calculatrice", "Calculator"),
  code: l("Code", "Code"),
  weather: l("Météo (JSON)", "Weather (JSON)"),
  toolbox: l("Outils à sa disposition", "Tools it can use"),
  tools: {
    search: l("Recherche web", "Web search"),
    calculator: l("Calculatrice", "Calculator"),
    code: l("Exécuter du code", "Run code"),
  } satisfies Record<CompareScenario, L10n>,
  illustrative: l("Échange illustratif, écrit pour l'exposé.", "Illustrative exchange, written for this talk."),
};

export function ToolCallDemo({ props, ctx }: SceneComponentProps<ToolCallDemoProps, ToolCallState>) {
  const { locale, revealStep, role } = ctx;
  const t = (x: L10n) => x[locale];
  const [state, setState] = useSceneState<ToolCallState>(ctx, () => ({
    scenario: ALL_SCENARIOS.includes(props.scenario as ToolScenario) ? (props.scenario as ToolScenario) : "weather",
  }));
  const step = Math.max(0, Math.min(state.scenario === "search" ? 5 : 4, revealStep));
  const vis = (n: number) => cx(styles.reveal, step >= n && styles.on);

  const controls = role === "controller" && (
    <div className={styles.ctl}>
      <ControlBar>
        <Segmented
          label={t(TEXT.example)}
          value={state.scenario}
          onChange={(scenario) => {
            // A new example tells its story from the start: back to the scene's first step.
            setState({ scenario });
            ctx.sendCommand({ type: "goto", sceneId: ctx.scene.id, revealStep: 0 });
          }}
          options={[
            { value: "weather", label: t(TEXT.weather) },
            { value: "search", label: t(TEXT.search) },
            { value: "calculator", label: t(TEXT.calculator) },
            { value: "code", label: t(TEXT.code) },
          ]}
        />
      </ControlBar>
    </div>
  );

  if (state.scenario === "weather" || !(state.scenario in SCRIPTS)) {
    return (
      <div className={styles.frame}>
        <WeatherWalkthrough step={step} locale={locale} heading={props.heading} />
        {controls}
      </div>
    );
  }
  if (state.scenario === "search") {
    return (
      <div className={styles.frame}>
        <SearchCompare step={step} locale={locale} heading={props.heading} />
        {controls}
      </div>
    );
  }
  const script = SCRIPTS[state.scenario as CompareScenario];

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <SceneHeading>{t(props.heading ?? TEXT.heading)}</SceneHeading>
        <Disclosure>{t(TEXT.illustrative)}</Disclosure>
      </div>

      <div className={styles.cols}>
        {/* Text in, text out. */}
        <section className={styles.col}>
          <h3 className={styles.colTitle}>{t(TEXT.plainTitle)}</h3>
          <p className={styles.colSub}>{t(TEXT.plainSub)}</p>
          <Bubble who={t(TEXT.you)} side="user">{t(script.question)}</Bubble>
          <div className={vis(1)}>
            <Bubble who={t(TEXT.model)} side="model">{t(script.plainAnswer)}</Bubble>
            <p className={styles.note}>{t(script.plainNote)}</p>
          </div>
        </section>

        {/* The model emits a structured call; the software runs it. */}
        <section className={cx(styles.col, styles.colTools)}>
          <h3 className={styles.colTitle}>{t(TEXT.toolTitle)}</h3>
          <p className={styles.colSub}>{t(TEXT.toolSub)}</p>
          <div className={styles.toolbox} aria-label={t(TEXT.toolbox)}>
            <span className={styles.toolboxLabel}>{t(TEXT.toolbox)}</span>
            {SCENARIOS.map((sc) => (
              <span key={sc} className={cx(styles.toolChip, step >= 2 && sc === state.scenario && styles.toolChipOn)}>
                <Icon name={SCRIPTS[sc].icon} size={24} />
                {t(TEXT.tools[sc])}
              </span>
            ))}
          </div>
          <Bubble who={t(TEXT.you)} side="user">{t(script.question)}</Bubble>

          <div className={cx(styles.pipeline)}>
            <div className={vis(2)}>
              <div className={styles.callRow}>
                <span className={styles.who}>{t(TEXT.model)}</span>
                <pre className={styles.call}>{t(script.call)}</pre>
              </div>
              <p className={styles.callTag}>{t(TEXT.callTag)}</p>
            </div>

            <div className={cx(vis(3), styles.toolRow)}>
              <div className={styles.toolBox}>
                <Icon name={script.icon} size={44} />
                <span className={styles.toolName}>{script.tool}</span>
              </div>
              <div className={styles.toolFlow}>
                <span className={styles.flowLabel}>{t(TEXT.runs)}</span>
                <pre className={styles.result}>{t(script.result)}</pre>
                <span className={styles.flowLabel}>{t(TEXT.back)}</span>
              </div>
            </div>

            <div className={vis(4)}>
              <Bubble who={t(TEXT.model)} side="model" strong>
                {t(script.answer)}
              </Bubble>
            </div>
          </div>
        </section>
      </div>

      {controls}
    </div>
  );
}

function Bubble({
  who,
  side,
  strong,
  children,
}: {
  who: string;
  side: "user" | "model";
  strong?: boolean;
  children: string;
}) {
  return (
    <div className={cx(styles.bubbleRow, side === "user" ? styles.userRow : styles.modelRow)}>
      <span className={styles.who}>{who}</span>
      <p className={cx(styles.bubble, side === "user" ? styles.user : styles.model, strong && styles.strong)}>{children}</p>
    </div>
  );
}
