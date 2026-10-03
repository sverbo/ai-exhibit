import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type ChatTemplateFile, renderChatTemplate } from "./chatTemplate.ts";

const llama = JSON.parse(
  readFileSync(new URL("../../../../content/assets/recordings/llama-3.1-8b-instruct.chat-template.json", import.meta.url), "utf8"),
) as ChatTemplateFile;

describe("renderChatTemplate (Llama 3.1)", () => {
  it("renders the system header, the turns and the assistant header", () => {
    const text = renderChatTemplate(llama, [
      { role: "system", content: "Be brief." },
      { role: "user", content: "Hi?" },
    ]);
    expect(text).toBe(
      "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n" +
        "Cutting Knowledge Date: December 2023\nToday Date: 26 Jul 2024\n\n" +
        "Be brief.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nHi?<|eot_id|>" +
        "<|start_header_id|>assistant<|end_header_id|>\n\n",
    );
    expect(llama.eos_token).toBe("<|eot_id|>");
  });
});
