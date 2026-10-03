/**
 * Renders a model's own chat template (the Jinja string from its
 * tokenizer_config.json) with the same engine Transformers.js uses, so the
 * "what the model actually reads" view shows the real text, not an imitation.
 * Pure: safe on the main thread.
 */
import { Template } from "@huggingface/jinja";
import type { ChatMessage } from "./types.ts";

export interface ChatTemplateFile {
  model: string;
  bos_token: string;
  eos_token: string;
  chat_template: string;
}

const cache = new Map<string, Template>();

export function renderChatTemplate(
  file: ChatTemplateFile,
  messages: ChatMessage[],
  options: { addGenerationPrompt?: boolean } = {},
): string {
  let template = cache.get(file.chat_template);
  if (!template) {
    template = new Template(file.chat_template);
    cache.set(file.chat_template, template);
  }
  return template.render({
    messages,
    bos_token: file.bos_token,
    eos_token: file.eos_token,
    add_generation_prompt: options.addGenerationPrompt ?? true,
  });
}
