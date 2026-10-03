import { describe, expect, it } from "vitest";
import { segmentChat } from "./chatRaw.ts";

const messages = [
  { role: "system" as const, content: "SYS" },
  { role: "user" as const, content: "Hi?" },
];
const compact = (raw: string) =>
  segmentChat(raw, messages)
    .filter((s) => s.kind !== "newline")
    .map((s) => `${s.kind}:${s.role}:${s.text}`);

describe("segmentChat", () => {
  it("colours the OLMo (Tulu) template tags by role", () => {
    expect(compact("<|system|>\nSYS\n<|user|>\nHi?\n<|assistant|>\n")).toEqual([
      "tag:system:<|system|>",
      "content:system:SYS",
      "tag:user:<|user|>",
      "content:user:Hi?",
      "tag:assistant:<|assistant|>",
    ]);
  });

  it("splits ChatML into closing and opening tags", () => {
    expect(
      compact("<|im_start|>system\nSYS<|im_end|>\n<|im_start|>user\nHi?<|im_end|>\n<|im_start|>assistant\n"),
    ).toEqual([
      "tag:system:<|im_start|>system",
      "content:system:SYS",
      "tag:system:<|im_end|>",
      "tag:user:<|im_start|>user",
      "content:user:Hi?",
      "tag:user:<|im_end|>",
      "tag:assistant:<|im_start|>assistant",
    ]);
  });

  it("keeps the text whole when a message is missing", () => {
    expect(segmentChat("unexpected", messages)).toEqual([{ kind: "content", role: "user", text: "unexpected" }]);
  });
});
