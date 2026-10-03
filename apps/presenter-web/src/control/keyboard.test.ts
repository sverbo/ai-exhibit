import { describe, expect, it } from "vitest";
import { isEditableTarget, keyAction } from "./keyboard.ts";

describe("keyAction", () => {
  it("maps step navigation", () => {
    expect(keyAction({ key: "ArrowRight" })).toBe("next");
    expect(keyAction({ key: " " })).toBe("next");
    expect(keyAction({ key: "PageDown" })).toBe("next");
    expect(keyAction({ key: "ArrowLeft" })).toBe("prev");
    expect(keyAction({ key: "PageUp" })).toBe("prev");
  });
  it("maps scene navigation with Shift", () => {
    expect(keyAction({ key: "ArrowRight", shiftKey: true })).toBe("nextScene");
    expect(keyAction({ key: "ArrowLeft", shiftKey: true })).toBe("prevScene");
  });
  it("maps letters in either case", () => {
    expect(keyAction({ key: "f" })).toBe("fallback");
    expect(keyAction({ key: "F", shiftKey: true })).toBe("fallback");
    expect(keyAction({ key: "r" })).toBe("reset");
    expect(keyAction({ key: "b" })).toBe("blackout");
    expect(keyAction({ key: "z" })).toBe("freeze");
    expect(keyAction({ key: "t" })).toBe("timer");
    expect(keyAction({ key: "n" })).toBe("notes");
    expect(keyAction({ key: "g" })).toBe("goto");
    expect(keyAction({ key: "L", shiftKey: true })).toBe("theme");
    expect(keyAction({ key: "Escape" })).toBe("escape");
  });
  it("leaves browser shortcuts alone", () => {
    expect(keyAction({ key: "r", metaKey: true })).toBeNull();
    expect(keyAction({ key: "r", ctrlKey: true })).toBeNull();
    expect(keyAction({ key: "ArrowRight", altKey: true })).toBeNull();
  });
  it("ignores unmapped keys", () => {
    expect(keyAction({ key: "x" })).toBeNull();
    expect(keyAction({ key: "Enter" })).toBeNull();
    expect(keyAction({ key: "F5" })).toBeNull();
  });
});

describe("isEditableTarget", () => {
  it("detects form fields and editors", () => {
    expect(isEditableTarget({ tagName: "INPUT" })).toBe(true);
    expect(isEditableTarget({ tagName: "textarea" })).toBe(true);
    expect(isEditableTarget({ tagName: "SELECT" })).toBe(true);
    expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });
  it("honours data-keys-local regions", () => {
    expect(isEditableTarget({ tagName: "DIV", closest: (s: string) => (s === "[data-keys-local]" ? {} : null) })).toBe(true);
  });
  it("lets other targets through", () => {
    expect(isEditableTarget({ tagName: "BUTTON", closest: () => null })).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
  it("maps Down and Up to the end and start of the scene", () => {
    expect(keyAction({ key: "ArrowDown" })).toBe("sceneEnd");
    expect(keyAction({ key: "ArrowUp" })).toBe("sceneStart");
  });
});
