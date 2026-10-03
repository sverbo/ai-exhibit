import type { SourceRecord } from "@ai-exhibit/presentation-core";
import { controlAndGovernanceSources } from "./control-and-governance.ts";
import { failuresAndMisuseSources } from "./failures-and-misuse.ts";
import { foundationsSources } from "./foundations.ts";
import { llmSources } from "./llm.ts";
import { supplyChainSources } from "./supply-chain.ts";
import { storySources } from "./story.ts";
import { talkSources } from "./talk.ts";

/** Source registry. One file per content area; IDs must be globally unique. */
export const sources: SourceRecord[] = [
  ...foundationsSources,
  ...failuresAndMisuseSources,
  ...controlAndGovernanceSources,
  ...supplyChainSources,
  ...storySources,
  ...talkSources,
  ...llmSources,
];
