import { l, type L10n } from "../../learning/shared/ui.tsx";
import type { IconName } from "../shared/icons.tsx";

export type Permission = "read" | "write" | "terminal" | "browser" | "money";
export const PERMISSIONS: Permission[] = ["read", "write", "terminal", "browser", "money"];

export const PERMISSION_INFO: Record<Permission, { label: L10n; icon: IconName }> = {
  read: { label: { en: "Read files" }, icon: "file" },
  write: { label: { en: "Write files" }, icon: "file-edit" },
  terminal: { label: { en: "Terminal" }, icon: "terminal" },
  browser: { label: { en: "Web browser" }, icon: "browser" },
  money: { label: { en: "Money" }, icon: "money" },
};

export interface Capability {
  id: string;
  label: L10n;
  /** Every listed permission must be granted. Empty = a plain chatbot can do it. */
  requires: Permission[];
  /** Hard to undo, or acts on the world in your name. */
  risky: boolean;
}

export const CAPABILITIES: Capability[] = [
  { id: "answer", label: { en: "Answer your questions" }, requires: [], risky: false },
  { id: "summarize", label: { en: "Summarize your documents" }, requires: ["read"], risky: false },
  { id: "find-invoice", label: { en: "Find an invoice" }, requires: ["read"], risky: false },
  { id: "draft", label: { en: "Write and save a report" }, requires: ["write"], risky: false },
  { id: "delete", label: { en: "Delete or overwrite files" }, requires: ["write"], risky: true },
  { id: "install", label: { en: "Install software" }, requires: ["terminal"], risky: true },
  { id: "run-any", label: { en: "Run any program" }, requires: ["terminal"], risky: true },
  { id: "lookup", label: { en: "Look up current information" }, requires: ["browser"], risky: false },
  { id: "post", label: { en: "Post or write in your name" }, requires: ["browser"], risky: true },
  { id: "pay", label: { en: "Pay a bill" }, requires: ["money"], risky: true },
  { id: "leak", label: { en: "Send your documents to an outside website" }, requires: ["read", "browser"], risky: true },
  { id: "download-run", label: { en: "Download a program, then run it" }, requires: ["terminal", "browser"], risky: true },
  { id: "shop", label: { en: "Order online and pay" }, requires: ["browser", "money"], risky: true },
];

export function available(granted: readonly Permission[]): Capability[] {
  return CAPABILITIES.filter((c) => c.requires.every((p) => granted.includes(p)));
}

/** First `k` permissions in the board's order: what each reveal step grants. */
export function grantedAtStep(k: number): Permission[] {
  return PERMISSIONS.slice(0, Math.max(0, Math.min(PERMISSIONS.length, k)));
}

export function toggle(granted: readonly Permission[], p: Permission): Permission[] {
  const next = granted.includes(p) ? granted.filter((x) => x !== p) : [...granted, p];
  return PERMISSIONS.filter((x) => next.includes(x));
}

/** Sample risky actions the agent asks approval for, in approval mode. */
export interface ApprovalRequest {
  id: string;
  needs: Permission;
  action: L10n;
  ifApproved: L10n;
  ifDenied: L10n;
}

export const REQUESTS: ApprovalRequest[] = [
  {
    id: "pay-electricity",
    needs: "money",
    action: { en: "Pay the electricity bill: €84.20" },
    ifApproved: { en: "Payment sent." },
    ifDenied: { en: "Nothing is paid. The agent leaves the bill to you." },
  },
  {
    id: "delete-old",
    needs: "write",
    action: { en: "Delete 312 old files to free up space" },
    ifApproved: { en: "Files deleted." },
    ifDenied: { en: "Nothing is deleted. The agent offers a list to check." },
  },
  {
    id: "install-tool",
    needs: "terminal",
    action: { en: "Install a program found on a forum" },
    ifApproved: { en: "Program installed." },
    ifDenied: { en: "Install blocked. The agent looks for another way." },
  },
];
