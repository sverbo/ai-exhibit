/**
 * Projector citations for the llm scenes. These scenes come before the talk
 * names any company (storyboard v1), so labels use authors or document titles
 * instead of a lab as publisher. Full records stay in Presenter View and /handout.
 */
import type { SourceRecord } from "@ai-exhibit/presentation-core";
import { shortSourceLabel } from "../primitives/sourceLabel.ts";
import labelStyles from "../primitives/SourceLabel.module.css";

const LABELS: Record<string, string> = {
  "llm-vaswani-2017": "Vaswani et al., 2017",
  "llm-gpt2-paper": "Radford et al., 2019",
  "llm-gpt3-paper": "Brown et al., 2020",
  "llm-patterson-2021": "Patterson et al., 2021",
  "llm-patterson-2022": "Patterson et al., 2022",
  "llm-wu-2022": "Wu et al., 2022",
  "llm-aryabumi-2024": "Aryabumi et al., 2024",
  "llm-gpt4-report": "GPT-4 Technical Report, 2023",
  "llm-llama3-paper": "The Llama 3 Herd of Models, 2024",
  "llm-llama31-model-card": "Llama 3.1 model card, 2024",
  "llm-nvidia-cpu-vs-gpu": "Krewell & Caulfield, 2009",
  "llm-amd-olmo-1b-config": "AMD-OLMo-1B config",
  "fnd-smollm2-model-card": "SmolLM2 model card",
  "fnd-smollm2-135m-config": "SmolLM2-135M config",
  "fnd-qwen25-config": "Qwen2.5-0.5B config",
  "fnd-qwen25-model-card": "Qwen2.5-0.5B model card",
  "tk-amd-olmo-1b-model-card": "AMD-OLMo-1B model card",
};

export function neutralLabel(id: string, source: SourceRecord | undefined): string {
  return LABELS[id] ?? (source ? shortSourceLabel(source) : id);
}

export function NeutralSources({
  ids,
  getSource,
  className,
}: {
  ids: string[];
  getSource: (id: string) => SourceRecord | undefined;
  className?: string;
}) {
  if (!ids.length) return null;
  return (
    <span className={`${labelStyles.sources} ${className ?? ""}`}>
      {[...new Set(ids)].map((id) => (
        <span key={id} className={labelStyles.source}>
          {neutralLabel(id, getSource(id))}
        </span>
      ))}
    </span>
  );
}
