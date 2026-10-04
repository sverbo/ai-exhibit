import { tr } from "@ai-exhibit/presentation-core";
import type { ReactNode } from "react";
import { Rich } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { useSceneState } from "../../learning/shared/sceneState.ts";
import { Disclosure, SceneHeading, cx, l, type L10n } from "../../learning/shared/ui.tsx";
import { ControlBar, ControlChoice } from "../../primitives/Controls.tsx";
import { canInteract, useSceneActions } from "../../primitives/interaction.ts";
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
    question: { en: "Will the weather be nice in Lyon tomorrow?" },
    plainAnswer: l(
      "Je ne peux pas le savoir : je n'ai pas accès aux prévisions du jour. En général, le printemps est doux à Lyon.",
      "I can't know that: I have no access to today's forecast. Spring in Lyon is usually mild.",
    ),
    plainNote: { en: "The model only knows what it saw during training." },
    tool: "web_search",
    icon: "search",
    call: { en: '{\n  "tool": "web_search",\n  "query": "Lyon weather tomorrow"\n}' },
    result: { en: '{\n  "place": "Lyon",\n  "tomorrow": "afternoon rain, 14 °C"\n}' },
    answer: { en: "Not really: rain in the afternoon and 14 °C. Take an umbrella." },
  },
  calculator: {
    question: { en: "What is 4,837 × 2,916?" },
    plainAnswer: { en: "About 14 million." },
    plainNote: { en: "Plausible but approximate: the model predicts digits the way it predicts words." },
    tool: "calculator",
    icon: "calculator",
    call: { en: '{\n  "tool": "calculator",\n  "expression": "4837 * 2916"\n}' },
    result: { en: '{\n  "result": 14104692\n}' },
    answer: { en: "4,837 × 2,916 = 14,104,692." },
  },
  code: {
    question: { en: "What day of the week will 14 July 2030 be?" },
    plainAnswer: { en: "I think it will be a Saturday." },
    plainNote: { en: "A plausible answer, but a guess. Here, it is wrong." },
    tool: "run_code",
    icon: "code",
    call: l(
      '{\n  "tool": "run_code",\n  "code": "date(2030, 7, 14).strftime(\'%A\')"\n}',
      '{\n  "tool": "run_code",\n  "code": "date(2030, 7, 14).strftime(\'%A\')"\n}',
    ),
    result: { en: '{\n  "result": "Sunday"\n}' },
    answer: { en: "14 July 2030 will be a Sunday." },
  },
};

const TEXT = {
  heading: { en: "Text, or an action?" },
  plainTitle: { en: "A model on its own" },
  plainSub: { en: "text in, text out" },
  toolTitle: { en: "A model with tools" },
  toolSub: { en: "it can ask the software to act" },
  you: { en: "You" },
  model: { en: "Model" },
  callTag: { en: "This is not an answer for you: it is a request for the software." },
  runs: { en: "The software runs the tool" },
  back: { en: "The result goes back to the model" },
  example: { en: "Example" },
  search: l("Recherche", "Search"),
  calculator: { en: "Calculator" },
  code: { en: "Code" },
  weather: { en: "Weather (JSON)" },
  toolbox: { en: "Tools it can use" },
  tools: {
    search: { en: "Web search" },
    calculator: { en: "Calculator" },
    code: { en: "Run code" },
  } satisfies Record<CompareScenario, L10n>,
  illustrative: { en: "Illustrative exchange, written for this talk." },
};

export function ToolCallDemo({ props, ctx }: SceneComponentProps<ToolCallDemoProps, ToolCallState>) {
  const { locale, revealStep } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const [state, setState] = useSceneState<ToolCallState>(ctx, () => ({
    scenario: ALL_SCENARIOS.includes(props.scenario as ToolScenario) ? (props.scenario as ToolScenario) : "weather",
  }));
  const step = Math.max(0, Math.min(state.scenario === "search" ? 5 : 4, revealStep));
  const vis = (n: number) => cx(styles.reveal, step >= n && styles.on);

  // Every window's control comes here; only the stage owner changes the state.
  const act = useSceneActions<ToolScenario, ToolCallState>(ctx, (scenario) => {
    // A new example tells its story from the start: back to the scene's first step.
    setState({ scenario });
    ctx.sendCommand({ type: "goto", sceneId: ctx.scene.id, revealStep: 0 });
  });

  const controls = canInteract(ctx) && (
    <ControlBar className={styles.ctl}>
      <ControlChoice
        label={t(TEXT.example)}
        value={state.scenario}
        onChange={act}
        options={[
          { value: "weather", label: t(TEXT.weather) },
          { value: "search", label: t(TEXT.search) },
          { value: "calculator", label: t(TEXT.calculator) },
          { value: "code", label: t(TEXT.code) },
        ]}
      />
    </ControlBar>
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
        <SceneHeading><Rich text={t(props.heading ?? TEXT.heading)} /></SceneHeading>
        <Disclosure><Rich text={t(TEXT.illustrative)} /></Disclosure>
      </div>

      <div className={styles.cols}>
        {/* Text in, text out. */}
        <section className={styles.col}>
          <h3 className={styles.colTitle}><Rich text={t(TEXT.plainTitle)} /></h3>
          <p className={styles.colSub}><Rich text={t(TEXT.plainSub)} /></p>
          <Bubble who={t(TEXT.you)} side="user"><Rich text={t(script.question)} /></Bubble>
          <div className={vis(1)}>
            <Bubble who={t(TEXT.model)} side="model"><Rich text={t(script.plainAnswer)} /></Bubble>
            <p className={styles.note}><Rich text={t(script.plainNote)} /></p>
          </div>
        </section>

        {/* The model emits a structured call; the software runs it. */}
        <section className={cx(styles.col, styles.colTools)}>
          <h3 className={styles.colTitle}><Rich text={t(TEXT.toolTitle)} /></h3>
          <p className={styles.colSub}><Rich text={t(TEXT.toolSub)} /></p>
          <div className={styles.toolbox} aria-label={t(TEXT.toolbox)}>
            <span className={styles.toolboxLabel}><Rich text={t(TEXT.toolbox)} /></span>
            {SCENARIOS.map((sc) => (
              <span key={sc} className={cx(styles.toolChip, step >= 2 && sc === state.scenario && styles.toolChipOn)}>
                <Icon name={SCRIPTS[sc].icon} size={24} />
                <Rich text={t(TEXT.tools[sc])} />
              </span>
            ))}
          </div>
          <Bubble who={t(TEXT.you)} side="user"><Rich text={t(script.question)} /></Bubble>

          <div className={cx(styles.pipeline)}>
            <div className={vis(2)}>
              <div className={styles.callRow}>
                <span className={styles.who}><Rich text={t(TEXT.model)} /></span>
                <pre className={styles.call}><Rich text={t(script.call)} /></pre>
              </div>
              <p className={styles.callTag}><Rich text={t(TEXT.callTag)} /></p>
            </div>

            <div className={cx(vis(3), styles.toolRow)}>
              <div className={styles.toolBox}>
                <Icon name={script.icon} size={44} />
                <span className={styles.toolName}>{script.tool}</span>
              </div>
              <div className={styles.toolFlow}>
                <span className={styles.flowLabel}><Rich text={t(TEXT.runs)} /></span>
                <pre className={styles.result}><Rich text={t(script.result)} /></pre>
                <span className={styles.flowLabel}><Rich text={t(TEXT.back)} /></span>
              </div>
            </div>

            <div className={vis(4)}>
              <Bubble who={t(TEXT.model)} side="model" strong>
                <Rich text={t(script.answer)} />
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
  children: ReactNode;
}) {
  return (
    <div className={cx(styles.bubbleRow, side === "user" ? styles.userRow : styles.modelRow)}>
      <span className={styles.who}>{who}</span>
      <p className={cx(styles.bubble, side === "user" ? styles.user : styles.model, strong && styles.strong)}>{children}</p>
    </div>
  );
}
