import { useSyncExternalStore } from "react";
import { parseLocale, tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";

/** Presenter-side interface strings (chrome, not talk content). */
const UI = {
  // Views
  viewPresent: { fr: "Répétition", en: "Rehearsal" },
  viewProjector: { fr: "Projecteur", en: "Projector" },
  linkedToPresenter: { fr: "Lié à la vue présentateur", en: "Linked to the presenter view" },
  runsScenes: { fr: "cette fenêtre fait tourner les scènes", en: "this window runs the scenes" },
  linkedElsewhere: { fr: "une autre fenêtre fait tourner les scènes", en: "another window runs the scenes" },
  viewPresenter: { fr: "Vue présentateur", en: "Presenter view" },
  openProjector: { fr: "Ouvrir le projecteur ↗", en: "Open the projector ↗" },
  openPresenter: { fr: "Ouvrir le présentateur ↗", en: "Open the presenter ↗" },
  openOtherHint: {
    fr: "Dans un autre onglet du même navigateur : les deux restent liés.",
    en: "In another tab of the same browser: the two stay linked.",
  },
  viewOverview: { fr: "Vue d'ensemble", en: "Overview" },
  viewHandout: { fr: "Document public", en: "Handout" },
  viewLab: { fr: "Atelier des composants", en: "Component lab" },
  // Launcher
  edition: { fr: "Édition", en: "Edition" },
  scenesCount: { fr: "scènes", en: "scenes" },
  planned: { fr: "prévu", en: "planned" },
  target: { fr: "cible", en: "target" },
  rangeTo: { fr: "à", en: "to" },
  todos: { fr: "points à vérifier", en: "items to check" },
  noScenes: {
    fr: "Cette édition n'a encore aucune scène.",
    en: "This edition has no scenes yet.",
  },
  cloudModels: { fr: "Hugging Face", en: "Hugging Face" },
  interfaceLanguage: { fr: "Langue de l'interface", en: "Interface language" },
  theme: { fr: "Thème", en: "Theme" },
  themeLight: { fr: "Clair", en: "Light" },
  themeDark: { fr: "Sombre", en: "Dark" },
  modelSource: { fr: "Modèles", en: "Models" },
  modelSourceHint: {
    fr: "Source des démos de langage : Hugging Face (en ligne) ou simulation (sorties réelles enregistrées, hors ligne).",
    en: "Where language demos get their model: Hugging Face (online) or simulation (recorded real outputs, offline).",
  },
  modelSourceHf: { fr: "Hugging Face", en: "Hugging Face" },
  modelSourceSimulation: { fr: "Simulation", en: "Simulation" },
  accessCode: { fr: "Code d'accès", en: "Access code" },
  accessCodeHint: {
    fr: "Ce site demande un code pour utiliser Hugging Face. Il est vérifié par le serveur puis gardé dans ce navigateur.",
    en: "This site asks for a code before using Hugging Face. The server checks it, then this browser remembers it.",
  },
  accessCodeWrong: { fr: "Code refusé", en: "Wrong code" },
  accessCodeUnchecked: { fr: "Serveur injoignable, code non vérifié", en: "Server unreachable, code not checked" },
  accessCodeCancel: { fr: "Annuler", en: "Cancel" },
  // Projector
  waitingSession: { fr: "En attente de la présentation…", en: "Waiting for the presentation…" },
  fullscreen: { fr: "Plein écran", en: "Full screen" },
  emptyEdition: { fr: "Aucune scène dans cette édition.", en: "No scenes in this edition." },
  // Presenter
  onAir: { fr: "À l'écran", en: "On screen" },
  projectorLive: { fr: "Le projecteur montre cette scène", en: "Projector shows this scene" },
  projectorFrozen: { fr: "Projecteur figé sur", en: "Projector frozen on" },
  projectorFrozenShort: { fr: "Projecteur figé", en: "Projector frozen" },
  projectorBlack: { fr: "Projecteur noir", en: "Projector black" },
  privateNav: { fr: "Navigation privée : le public ne voit pas cette scène", en: "Private navigation: the audience does not see this scene" },
  next: { fr: "Suivant", en: "Next" },
  prev: { fr: "Précédent", en: "Previous" },
  nextScene: { fr: "Scène suivante", en: "Next scene" },
  prevScene: { fr: "Scène précédente", en: "Previous scene" },
  reveal: { fr: "Révéler", en: "Reveal" },
  sceneEnd: { fr: "Fin de scène", en: "End of scene" },
  reset: { fr: "Réinitialiser", en: "Reset" },
  fallback: { fr: "Secours", en: "Fallback" },
  fallbackOn: { fr: "Mode de secours actif", en: "Fallback active" },
  freeze: { fr: "Figer", en: "Freeze" },
  unfreeze: { fr: "Libérer", en: "Unfreeze" },
  blackout: { fr: "Écran noir", en: "Blackout" },
  unblack: { fr: "Rallumer", en: "Show" },
  skip: { fr: "Passer", en: "Skip" },
  notes: { fr: "Notes", en: "Notes" },
  smallerText: { fr: "Texte plus petit", en: "Smaller text" },
  largerText: { fr: "Texte plus grand", en: "Larger text" },
  moreNotesOne: { fr: "1 note de plus en dessous", en: "1 more note below" },
  moreNotes: { fr: "{n} notes de plus en dessous", en: "{n} more notes below" },
  takeaway: { fr: "À retenir", en: "Takeaway" },
  transitionOut: { fr: "Transition", en: "Transition" },
  objective: { fr: "Objectif", en: "Objective" },
  sources: { fr: "Sources", en: "Sources" },
  noSources: { fr: "Aucune source pour cette scène.", en: "No sources for this scene." },
  verified: { fr: "vérifiée", en: "verified" },
  needsVerification: { fr: "à vérifier", en: "needs verification" },
  todo: { fr: "À faire", en: "TODO" },
  noTodo: { fr: "Rien à signaler.", en: "Nothing pending." },
  upNext: { fr: "Ensuite", en: "Up next" },
  endOfTalk: { fr: "Fin de la présentation", en: "End of the talk" },
  timer: { fr: "Minuteur", en: "Timer" },
  start: { fr: "Démarrer", en: "Start" },
  pause: { fr: "Pause", en: "Pause" },
  paceAhead: { fr: "en avance", en: "ahead" },
  paceOnTrack: { fr: "dans les temps", en: "on time" },
  paceBehind: { fr: "en retard", en: "behind" },
  finishAt: { fr: "fin estimée", en: "finish at" },
  overTarget: { fr: "au-delà de la cible", en: "over target" },
  step: { fr: "étape", en: "step" },
  steps: { fr: "étapes", en: "steps" },
  scene: { fr: "Scène", en: "Scene" },
  chapter: { fr: "Chapitre", en: "Chapter" },
  health: { fr: "État", en: "Health" },
  session: { fr: "Session", en: "Session" },
  statusOpen: { fr: "connectée", en: "connected" },
  statusConnecting: { fr: "connexion…", en: "connecting…" },
  statusOffline: { fr: "hors ligne", en: "offline" },
  viaBrowser: { fr: "dans ce navigateur", en: "in this browser" },
  clients: { fr: "Écrans connectés", en: "Connected screens" },
  pauseMotion: { fr: "Animations en pause", en: "Animations paused" },
  gotoScene: { fr: "Aller à la scène", en: "Go to scene" },
  gotoPlaceholder: { fr: "Numéro, code ou titre…", en: "Number, code or title…" },
  noMatch: { fr: "Aucune scène ne correspond.", en: "No scene matches." },
  // Personal config
  config: { fr: "Config", en: "Config" },
  configTitle: { fr: "Votre version de la présentation", en: "Your version of the talk" },
  configHint: {
    fr: "Réordonnez, masquez et annotez les scènes. Enregistré dans ce navigateur, appliqué au projecteur aussi.",
    en: "Reorder, hide and annotate scenes. Saved in this browser, applied to the projector too.",
  },
  configPlanned: { fr: "Durée prévue", en: "Planned" },
  configScenes: { fr: "scènes visibles", en: "visible scenes" },
  configDefaultTotal: { fr: "par défaut", en: "default" },
  configHide: { fr: "Masquer", en: "Hide" },
  configShow: { fr: "Afficher", en: "Show" },
  configHidden: { fr: "masquée", en: "hidden" },
  configHiddenCurrent: { fr: "Masquée : sautée dès que vous avancez", en: "Hidden: skipped once you move on" },
  configMoveUp: { fr: "Monter", en: "Move up" },
  configMoveDown: { fr: "Descendre", en: "Move down" },
  configDrag: { fr: "Glisser pour déplacer (ou Alt+↑ / Alt+↓)", en: "Drag to move (or Alt+↑ / Alt+↓)" },
  configNote: { fr: "Note", en: "Note" },
  configNotePlaceholder: {
    fr: "Votre note, affichée en premier dans les notes de cette scène (jamais à l'écran).",
    en: "Your note, shown first in this scene's notes (never on screen).",
  },
  configExport: { fr: "Exporter", en: "Export" },
  configImport: { fr: "Importer", en: "Import" },
  configReset: { fr: "Revenir à la présentation par défaut", en: "Reset to the default talk" },
  configConfirmReset: {
    fr: "Effacer votre ordre, vos scènes masquées et vos notes pour cette présentation ?",
    en: "Clear your order, hidden scenes and notes for this talk?",
  },
  configUnknown: { fr: "Codes inconnus, ignorés", en: "Unknown codes, ignored" },
  configForget: { fr: "Les oublier", en: "Forget them" },
  configImported: { fr: "Configuration importée.", en: "Configuration imported." },
  configDropped: { fr: "entrées invalides ignorées", en: "invalid entries ignored" },
  configErrorJson: { fr: "Ce fichier n'est pas du JSON valide.", en: "This file is not valid JSON." },
  configErrorShape: { fr: "Ce fichier n'est pas une configuration.", en: "This file is not a configuration." },
  configErrorSchema: {
    fr: "Configuration créée par une version plus récente : mettez l'application à jour.",
    en: "Configuration made by a newer version: update the app.",
  },
  configErrorTalk: { fr: "Cette configuration est celle d'une autre présentation.", en: "This configuration belongs to another talk." },
  configPersonal: { fr: "personnalisée", en: "personalised" },
  personalNoteCue: { fr: "Moi", en: "Mine" },
  close: { fr: "Fermer", en: "Close" },
  hud: { fr: "Afficher l'aide", en: "Show help" },
  hideHud: { fr: "Masquer", en: "Hide" },
  hudRegion: { fr: "Commandes de répétition", en: "Rehearsal controls" },
  hudCollapse: { fr: "Masquer les notes", en: "Hide notes" },
  hudExpand: { fr: "Afficher les notes", en: "Show notes" },
  cannotControl: {
    fr: "Lecture seule : ce lien n'a pas de jeton valide. Rescannez le QR code de la vue présentateur.",
    en: "Read only: this link has no valid token. Scan the QR code from the presenter view again.",
  },
  sceneLoading: { fr: "La démo charge encore", en: "Demo still loading" },
  outOfDate: {
    fr: "Cette fenêtre n'est plus à jour : les scènes ont changé depuis son ouverture. Rechargez-la avant de continuer.",
    en: "This window is out of date: the scenes changed since it was opened. Reload it before going on.",
  },
  reload: { fr: "Recharger", en: "Reload" },
  restartTalk: { fr: "Recommencer la présentation", en: "Restart the talk" },
  confirmRestart: {
    fr: "Recommencer ? Le minuteur, les votes et l'état des scènes seront effacés.",
    en: "Restart? The timer, votes and scene states will be cleared.",
  },
  // Overview
  optional: { fr: "facultative", en: "optional" },
  runtimeClass: { fr: "exécution", en: "runtime" },
  duration: { fr: "durée", en: "duration" },
  evidence: { fr: "preuve", en: "evidence" },
  rehearseFromHere: { fr: "Répéter à partir d'ici", en: "Rehearse from here" },
  // Handout
  retrieved: { fr: "consultée le", en: "retrieved" },
  // Lab
  labComponents: { fr: "Composants enregistrés", en: "Registered components" },
  labNotBuilt: { fr: "Cités par le contenu, pas encore construits", en: "Used by content, not built yet" },
  labLayouts: { fr: "Mises en page génériques", en: "Generic layouts" },
  labProps: { fr: "Propriétés (JSON)", en: "Props (JSON)" },
  labApply: { fr: "Appliquer", en: "Apply" },
  labInvalidJson: { fr: "JSON invalide", en: "Invalid JSON" },
  labController: { fr: "Contrôleur", en: "Controller" },
  labDisplay: { fr: "Projecteur (display)", en: "Projector (display)" },
  labPreview: { fr: "Aperçu (preview)", en: "Preview" },
  labState: { fr: "État partagé", en: "Shared state" },
  labCommands: { fr: "Commandes envoyées", en: "Commands sent" },
  labPickOne: { fr: "Choisissez un composant à gauche.", en: "Pick a component on the left." },
  labFromScene: { fr: "Propriétés de la scène", en: "Props from scene" },
  labLocale: { fr: "Langue de la scène", en: "Scene language" },
  labSteps: { fr: "Étapes", en: "Steps" },
  labResetState: { fr: "Effacer l'état", en: "Clear state" },
} satisfies Record<string, L10n>;

export type UiKey = keyof typeof UI;

/** One interface string in a given language, for pages pinned to a language. */
export function uiString(key: UiKey, locale: Locale): string {
  return tr(UI[key], locale);
}

const STORAGE_KEY = "ai-exhibit:ui-locale";
const listeners = new Set<() => void>();

function readLocale(): Locale {
  const fromUrl = parseLocale(new URLSearchParams(window.location.search).get("ui"));
  if (fromUrl) return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const known = parseLocale(stored);
    if (known) return known;
  } catch {
    // storage unavailable
  }
  return "en";
}

let current: Locale = typeof window === "undefined" ? "en" : readLocale();

export function setUiLocale(locale: Locale): void {
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // storage unavailable
  }
  document.documentElement.lang = locale;
  for (const l of listeners) l();
}

/** Interface strings in the presenter's chosen language (default English). */
export function useUi(): { t: (key: UiKey) => string; locale: Locale; setLocale: (l: Locale) => void } {
  const locale = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  return { t: (key) => tr(UI[key], locale), locale, setLocale: setUiLocale };
}
