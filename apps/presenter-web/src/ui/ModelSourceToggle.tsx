import { type FormEvent, useState } from "react";
import { cloudStatus, getAccessCode, setAccessCode } from "@ai-exhibit/ml-runtime/lm";
import { MODEL_SOURCES, type ModelSource, resetCloudStatus } from "@ai-exhibit/scene-components";
import { useUi } from "../i18n.ts";
import { useDefaultModelSource } from "../talk/modelSourceDefault.ts";
import { modelSourceOf, type ShellState } from "../talk/shell.ts";
import chrome from "./chrome.module.css";

const LABEL = { hf: "modelSourceHf", simulation: "modelSourceSimulation" } as const;

/**
 * Where the language demos get their model, for every screen of the talk:
 * Hugging Face (cloud, through the server) or Simulation (recorded real
 * outputs). Scenes fall back to Simulation on their own and show why in a badge.
 *
 * A public deployment may require an access code (AI_EXHIBIT_ACCESS_CODE)
 * before Hugging Face can be chosen: asked once, checked by the server, then
 * remembered in this browser.
 */
export function ModelSourceToggle({ shell, onChange, className }: { shell: ShellState; onChange: (s: ModelSource) => void; className?: string }) {
  const { t } = useUi();
  const value = modelSourceOf(shell, useDefaultModelSource());
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (s: ModelSource) => {
    if (s !== "hf") {
      setAsking(false);
      onChange(s);
      return;
    }
    const status = await cloudStatus({ accessCode: null }).catch(() => null);
    if (status?.codeRequired && !getAccessCode()) {
      setError(null);
      setAsking(true);
      return;
    }
    onChange("hf");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const typed = code.trim();
    if (!typed) return;
    setBusy(true);
    const status = await cloudStatus({ accessCode: typed }).catch(() => null);
    setBusy(false);
    if (status?.codeAccepted) {
      setAccessCode(typed);
      resetCloudStatus();
      setAsking(false);
      setCode("");
      onChange("hf");
    } else {
      setError(status ? t("accessCodeWrong") : t("accessCodeUnchecked"));
    }
  };

  return (
    <>
      <span className={`${chrome.segmented} ${className ?? ""}`} role="radiogroup" aria-label={t("modelSource")} title={t("modelSourceHint")}>
        {MODEL_SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            className={`${chrome.segment} ${value === s ? chrome.segmentOn : ""}`}
            onClick={() => void choose(s)}
          >
            {t(LABEL[s])}
          </button>
        ))}
      </span>
      {asking ? (
        <form className={chrome.inlineForm} onSubmit={submit} onKeyDown={(e) => e.stopPropagation()}>
          <input
            className={chrome.select}
            type="password"
            autoFocus
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("accessCode")}
            aria-label={t("accessCode")}
            title={t("accessCodeHint")}
          />
          <button type="submit" className={chrome.btn} disabled={busy || !code.trim()}>
            OK
          </button>
          <button type="button" className={chrome.btn} onClick={() => setAsking(false)}>
            {t("accessCodeCancel")}
          </button>
          {error ? <span className={chrome.inlineError}>{error}</span> : null}
        </form>
      ) : null}
    </>
  );
}
