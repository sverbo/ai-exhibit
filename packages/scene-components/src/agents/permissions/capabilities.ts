import { l, type L10n } from "../../learning/shared/ui.tsx";
import type { IconName } from "../shared/icons.tsx";

export type Permission = "read" | "write" | "terminal" | "browser" | "money";
export const PERMISSIONS: Permission[] = ["read", "write", "terminal", "browser", "money"];

export const PERMISSION_INFO: Record<Permission, { label: L10n; icon: IconName }> = {
  read: { label: l("Lire des fichiers", "Read files"), icon: "file" },
  write: { label: l("Écrire des fichiers", "Write files"), icon: "file-edit" },
  terminal: { label: l("Terminal", "Terminal"), icon: "terminal" },
  browser: { label: l("Navigateur web", "Web browser"), icon: "browser" },
  money: { label: l("Argent", "Money"), icon: "money" },
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
  { id: "answer", label: l("Répondre à vos questions", "Answer your questions"), requires: [], risky: false },
  { id: "summarize", label: l("Résumer vos documents", "Summarize your documents"), requires: ["read"], risky: false },
  { id: "find-invoice", label: l("Retrouver une facture", "Find an invoice"), requires: ["read"], risky: false },
  { id: "draft", label: l("Rédiger et enregistrer un rapport", "Write and save a report"), requires: ["write"], risky: false },
  { id: "delete", label: l("Effacer ou écraser des fichiers", "Delete or overwrite files"), requires: ["write"], risky: true },
  { id: "install", label: l("Installer des logiciels", "Install software"), requires: ["terminal"], risky: true },
  { id: "run-any", label: l("Lancer n'importe quel programme", "Run any program"), requires: ["terminal"], risky: true },
  { id: "lookup", label: l("Chercher des informations à jour", "Look up current information"), requires: ["browser"], risky: false },
  { id: "post", label: l("Publier ou écrire en votre nom", "Post or write in your name"), requires: ["browser"], risky: true },
  { id: "pay", label: l("Payer une facture", "Pay a bill"), requires: ["money"], risky: true },
  { id: "leak", label: l("Envoyer vos documents à un site extérieur", "Send your documents to an outside website"), requires: ["read", "browser"], risky: true },
  { id: "download-run", label: l("Télécharger un programme, puis l'exécuter", "Download a program, then run it"), requires: ["terminal", "browser"], risky: true },
  { id: "shop", label: l("Commander en ligne et payer", "Order online and pay"), requires: ["browser", "money"], risky: true },
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
    action: l("Payer la facture d'électricité : 84,20 €", "Pay the electricity bill: €84.20"),
    ifApproved: l("Paiement envoyé.", "Payment sent."),
    ifDenied: l("Rien n'est payé. L'agent vous laisse la facture.", "Nothing is paid. The agent leaves the bill to you."),
  },
  {
    id: "delete-old",
    needs: "write",
    action: l("Supprimer 312 vieux fichiers pour faire de la place", "Delete 312 old files to free up space"),
    ifApproved: l("Fichiers supprimés.", "Files deleted."),
    ifDenied: l("Rien n'est supprimé. L'agent propose une liste à vérifier.", "Nothing is deleted. The agent offers a list to check."),
  },
  {
    id: "install-tool",
    needs: "terminal",
    action: l("Installer un programme trouvé sur un forum", "Install a program found on a forum"),
    ifApproved: l("Programme installé.", "Program installed."),
    ifDenied: l("Installation bloquée. L'agent cherche une autre méthode.", "Install blocked. The agent looks for another way."),
  },
];
