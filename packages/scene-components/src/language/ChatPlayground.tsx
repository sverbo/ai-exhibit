/**
 * ChatPlayground (scene 3.11): the fine-tuned model as an assistant. Ready
 * questions and typed ones (controller only), answered by Llama 3.1 8B
 * Instruct through Hugging Face; in Simulation, its recorded real answers to
 * the ready questions (typing disabled). The guardrail example asks a harmful
 * question: live, or its recorded real refusal.
 *
 * Reveal step 1 shows, in place of the chat, the exact text the model reads: the
 * hidden (example) system prompt and the role tags of the model's own chat
 * template (rendered from its published template, never imitated), then the
 * answer as the continuation of that text, and the end token that stops it.
 */
import { Fragment, useRef } from "react";
import { pick, tr, type L10n } from "@ai-exhibit/presentation-core";
import { cloudChat, findCloudRecording, MAX_OUTPUT_TOKENS, renderChatTemplate } from "@ai-exhibit/ml-runtime/lm";
import type { SceneComponentProps } from "../contract.ts";
import { canInteract, useSceneActions } from "../primitives/interaction.ts";
import { Rich } from "../primitives/Rich.tsx";
import styles from "./ChatPlayground.module.css";
import { type RawSegment, segmentChat } from "./chatRaw.ts";
import { COPY } from "./copy.ts";
import { assistantMessages, CHAT_PRESETS, GUARDRAIL_PROMPT } from "./data.ts";
import { stripEmphasis } from "./format.ts";
import { type NoticeKey, useCloudRecording, useLlamaTemplate } from "./runtime.ts";
import { useSourceDecision } from "./source.ts";
import { DEFAULT_TEMPERATURE, formatTemperature, isL10n, TEMPERATURES } from "./shared.ts";
import { useOnStepChange, useSceneState } from "./state.ts";
import { Button, cx, Frame, Notice, Pending, Segmented, SourceBadge, TextField } from "./ui.tsx";

export interface ChatPlaygroundProps {
  prompt?: L10n;
}

interface Turn {
  question: string;
  answer: string;
  state: "running" | "done";
  kind: "chat" | "guardrail";
  source: "live" | "recorded";
  /** The system prompt sent with the question (hidden from the user, shown on reveal). */
  system: string;
  /** Exact text the model read (its chat template, rendered), when known. */
  raw?: string;
  endTag?: string;
  stopReason?: string;
  /** Model that answered (shown to the audience). */
  model?: string;
  /** Probabilities of the first answer tokens and their alternatives. */
  firstTokens?: { token: string; p: number; top: { token: string; p: number }[] }[];
}

export interface ChatState {
  turns: Turn[];
  notice: NoticeKey | null;
  /** null: follow the reveal step. */
  showRaw?: boolean | null;
  /** For the next question; absent means DEFAULT_TEMPERATURE. */
  temperature?: number;
}

const KEEP_TURNS = 1;
const CLOUD_LABEL = "Llama 3.1 8B Instruct";
const REPLAY_MS = 45;

export function ChatPlayground({ props, ctx }: SceneComponentProps<ChatPlaygroundProps, ChatState>) {
  const { locale, role } = ctx;
  const presets = [...(isL10n(props.prompt) ? [props.prompt] : []), ...CHAT_PRESETS].filter(
    (p, i, all) => all.findIndex((q) => q.en === p.en) === i,
  );
  const [state, setState] = useSceneState<ChatState>(ctx, () => ({ turns: [], notice: null }), { throttleMs: 60 });
  const stateRef = useRef(state);
  stateRef.current = state;
  const cloudRec = useCloudRecording();
  const llamaTemplate = useLlamaTemplate();
  const { decision, cloudFailed } = useSourceDecision(ctx);
  const simulation = decision.active === "simulation";
  const abort = useRef<AbortController | null>(null);

  const push = (turn: Turn) => setState((s) => ({ ...s, turns: [...s.turns, turn].slice(-KEEP_TURNS) }));
  const updateLast = (patch: Partial<Turn>) =>
    setState((s) => ({ ...s, turns: s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, ...patch } : t)) }));

  /** Shows an answer word by word (cloud answers and recordings arrive whole). */
  const reveal = async (text: string, ac: AbortController) => {
    let shown = "";
    for (const w of text.split(/(?<=\s)/)) {
      if (ac.signal.aborted) return false;
      shown += w;
      updateLast({ answer: shown });
      if (!ctx.reducedMotion) await new Promise((r) => setTimeout(r, REPLAY_MS));
    }
    return true;
  };

  const replayRecorded = async (q: string, kind: Turn["kind"], ac: AbortController) => {
    const rec = findCloudRecording(cloudRec, "chat", q);
    if (!rec) {
      setState((s) => ({ ...s, notice: "notRecorded" }));
      return;
    }
    setState((s) => ({ ...s, notice: null }));
    push({
      question: q,
      kind,
      answer: "",
      state: "running",
      source: "recorded",
      system: rec.system ?? "",
      raw: rec.raw,
      endTag: rec.endTag,
      stopReason: rec.finishReason === "stop" ? "eos" : "max-tokens",
      model: CLOUD_LABEL,
      firstTokens: rec.firstTokens,
    });
    if (await reveal(rec.text, ac)) updateLast({ answer: rec.text, state: "done" });
  };

  const ask = async (question: string, kind: Turn["kind"] = "chat") => {
    const q = question.trim();
    if (!q) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    if (simulation) {
      await replayRecorded(q, kind, ac);
      return;
    }
    const messages = assistantMessages(locale, q);
    push({ question: q, answer: "", state: "running", kind, source: "live", system: messages[0]!.content, model: CLOUD_LABEL });
    setState((s) => ({ ...s, notice: null }));
    try {
      const temperature = stateRef.current.temperature ?? DEFAULT_TEMPERATURE;
      const r = await cloudChat({ messages, maxTokens: MAX_OUTPUT_TOKENS, temperature }, { signal: ac.signal });
      if (ac.signal.aborted) return;
      updateLast({
        raw: llamaTemplate ? renderChatTemplate(llamaTemplate, messages) : undefined,
        endTag: llamaTemplate?.eos_token,
        firstTokens: r.tokens?.slice(0, 3),
      });
      if (await reveal(r.text, ac)) {
        updateLast({ answer: r.text, state: "done", stopReason: r.finishReason === "stop" ? "eos" : "max-tokens" });
      }
    } catch {
      if (ac.signal.aborted) return;
      // Cloud failed: drop that turn, say so in the badge, show the recording if there is one.
      setState((s) => ({ ...s, turns: s.turns.slice(0, -1) }));
      cloudFailed();
      await replayRecorded(q, kind, ac);
    }
  };

  // Every window's controls come here; only the stage owner asks the model.
  const act = useSceneActions<
    { type: "ask"; question: string; kind?: Turn["kind"] } | { type: "stop" } | { type: "temperature"; value: number },
    ChatState
  >(ctx, (a) => {
    if (a.type === "stop") abort.current?.abort();
    else if (a.type === "temperature") setState((s) => ({ ...s, temperature: a.value }));
    else void ask(a.question, a.kind);
  });

  useOnStepChange(ctx.revealStep, () => setState((s) => ({ ...s, showRaw: null })));

  const view: ChatState = role === "preview" || (role === "display" && ctx.state === undefined) ? { turns: [], notice: null } : state;
  const sceneSteps = ctx.scene.steps ?? 0;
  const showRaw = role !== "preview" && (view.showRaw ?? (sceneSteps > 0 && ctx.revealStep >= 1));
  const running = state.turns.at(-1)?.state === "running";

  // The hidden text follows the reveal step; R clears the chat.
  const controls = canInteract(ctx) ? (
    <>
      <Segmented
        label={tr(COPY.presetQuestions, locale)}
        value={null}
        disabled={running}
        options={presets.map((p) => {
          const q = tr(p, locale);
          return { value: pick(p, locale), label: q.length > 24 ? `${q.slice(0, 23)}…` : q };
        })}
        onChange={(question) => act({ type: "ask", question })}
      />
      <Button disabled={running} onClick={() => act({ type: "ask", question: pick(GUARDRAIL_PROMPT, locale), kind: "guardrail" })}>
        {tr(COPY.guardrail, locale)}
      </Button>
      <TextField
        label={tr(COPY.askQuestion, locale)}
        clearOnSubmit
        submitLabel={tr(COPY.send, locale)}
        disabled={simulation || running}
        onSubmit={(question) => question.trim() && act({ type: "ask", question })}
      />
      {running ? <Button onClick={() => act({ type: "stop" })}>{tr(COPY.stop, locale)}</Button> : null}
      <span title={tr(COPY.temperatureHint, locale)}>
        <Segmented
          label={tr(COPY.temperature, locale)}
          value={simulation ? null : (view.temperature ?? DEFAULT_TEMPERATURE)}
          disabled={simulation}
          options={TEMPERATURES.map((t) => ({ value: t, label: formatTemperature(t, locale) }))}
          onChange={(value) => act({ type: "temperature", value })}
        />
      </span>
      {simulation ? <span className={styles.simNote}>{tr(COPY.simulationPresetsOnly, locale)}</span> : null}
      {role === "controller" ? <SourceBadge decision={decision} model={CLOUD_LABEL} locale={locale} /> : null}
    </>
  ) : null;

  // With the hidden text shown, it takes the whole stage: it already holds the
  // question and the answer (as the continuation), so the chat steps aside and
  // every line stays visible above the controller's rail.
  return (
    <Frame controls={controls} label={tr(ctx.scene.title, locale)} mainClassName={showRaw ? styles.rawMain : undefined}>
      <header className={styles.head}>
        <span className={styles.title}>{tr(COPY.assistantTitle, locale)}</span>
        <span className={styles.model}>{view.turns.at(-1)?.model ?? CLOUD_LABEL}</span>
        {showRaw && view.turns.at(-1)?.source === "recorded" ? <span className={styles.recorded}>{tr(COPY.fallback, locale)}</span> : null}
        {showRaw ? null : <span className={styles.sub}>{tr(COPY.assistantSub, locale)}</span>}
      </header>
      {showRaw ? (
        <RawPanel turn={view.turns.at(-1) ?? null} locale={locale} />
      ) : (
      <ol className={styles.chat}>
        {view.turns.map((t, i) => (
          <li key={i} className={styles.turn}>
            <p className={styles.user}>{t.question}</p>
            <div className={cx(styles.assistant, t.kind === "guardrail" && styles.guardrail)}>
              {t.kind === "guardrail" ? <span className={styles.guardTag}>{tr(COPY.guardrail, locale)}</span> : null}
              <p className={styles.answer}>
                {t.answer ? stripEmphasis(t.answer) : <Pending>{tr(COPY.writing, locale)}</Pending>}
              </p>
              {t.source === "recorded" ? (
                <span className={styles.recorded}>
                  {tr(COPY.fallback, locale)}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      )}
      {view.notice && role !== "preview" ? (
        <div className={styles.footer}>
          <Notice reason={view.notice} locale={locale} />
        </div>
      ) : null}
    </Frame>
  );
}

const ROLE_CLASS = { system: styles.roleSystem, user: styles.roleUser, assistant: styles.roleAssistant };

/** The text the model actually reads, tags coloured by role, then its continuation and end token. */
function RawPanel({ turn, locale }: { turn: Turn | null; locale: "fr" | "en" }) {
  const segments: RawSegment[] =
    turn?.raw ? segmentChat(turn.raw, [{ role: "system", content: turn.system }, { role: "user", content: turn.question }]) : [];
  const ended = turn?.state === "done" && turn.stopReason === "eos" && turn.endTag;
  return (
    <section className={styles.raw} aria-label={tr(COPY.hiddenFormat, locale)}>
      <header className={styles.rawHeadRow}>
        <span className={styles.rawHead}>{tr(COPY.hiddenFormat, locale)}</span>
        {turn?.raw && turn.firstTokens?.[0]?.top.length ? (
          <p className={styles.odds}>
            {tr(COPY.firstWordOdds, locale)}{" "}
            {turn.firstTokens[0].top.slice(0, 4).map((t, i) => (
              <span key={i} className={styles.odd}>
                <code>{t.token.replace(/\n/g, "↵")}</code> {Math.round(t.p * 100)}
                {locale === "fr" ? " %" : "%"}
              </span>
            ))}
          </p>
        ) : null}
      </header>
      {turn && turn.raw ? (
        <>
          <div className={styles.rawScroll}>
          <pre className={styles.rawText}>
            {segments.map((seg, i) =>
              seg.kind === "newline" ? (
                <Fragment key={i}>{"\n"}</Fragment>
              ) : (
                <span key={i} className={cx(seg.kind === "tag" ? styles.tag : styles.content, ROLE_CLASS[seg.role])}>
                  {seg.text}
                </span>
              ),
            )}
            <span className={styles.continuation}>{turn.answer}</span>
            {turn.state === "done" && turn.endTag ? (
              // Cut by the length limit: the end token it would write next is shown faded.
              <span className={cx(styles.tag, styles.endTag, !ended && styles.notReached)}>{turn.endTag}</span>
            ) : null}
          </pre>
          </div>
          <ul className={styles.rawNotes}>
            <li>
              <span className={cx(styles.swatch, styles.roleSystem)} aria-hidden="true" />
              {/* One span per note: the row is flex, and rich text has several nodes. */}
              <span>
                <Rich text={tr(COPY.systemExample, locale)} />
              </span>
            </li>
            <li>
              <span className={cx(styles.swatch, styles.roleAssistant)} aria-hidden="true" />
              <span>{tr(COPY.continuesText, locale)}</span>
            </li>
            <li>
              <span className={cx(styles.swatch, styles.endSwatch)} aria-hidden="true" />
              <span>{tr(COPY.endTagNote, locale)}</span>
            </li>
          </ul>
        </>
      ) : (
        <p className={styles.rawEmpty}>{tr(COPY.rawEmpty, locale)}</p>
      )}
    </section>
  );
}
