/**
 * The Play tab of the audience page: the talk's interactive demos, solo, on
 * the phone (docs/specs/2026-10-04-audience-play.md). This module is its own
 * chunk, and each demo is another one, loaded when opened. Live calls carry
 * this phone's device id and count in the audience budget, never in the
 * presenter's; when they cannot run, the demos show recorded examples.
 */
import { type ComponentType, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { installCatalogs, tr, type Locale } from "@ai-exhibit/presentation-core";
import { cloudStatus, type CloudStatus } from "@ai-exhibit/ml-runtime/lm";
import { type SoloEnv, troubleOf } from "@ai-exhibit/scene-components/solo/env.ts";
import { decidePlay, deviceId, type RecordedWhy } from "./play.ts";
import styles from "./Play.module.css";

const COPY = {
  intro: {
    en: "Try the talk's demos yourself. What you type is sent to the server that runs the models: type nothing personal.",
    fr: "Essayez vous-même les démonstrations de la présentation. Ce que vous tapez est envoyé au serveur qui fait tourner les modèles : n'y mettez rien de personnel.",
  },
  checking: { en: "Checking the live models…", fr: "Vérification des modèles en direct…" },
  left: {
    en: "{n} of {m} live answers left on this phone this hour.",
    fr: "Encore {n} réponses en direct sur {m} pour ce téléphone cette heure-ci.",
  },
  off: {
    en: "Live models are off right now: these are recorded real examples.",
    fr: "Les modèles en direct ne sont pas disponibles pour l'instant : voici des exemples réels enregistrés.",
  },
  usedUp: {
    en: "This phone has used its live answers for this hour. Here are recorded real examples; try again later.",
    fr: "Ce téléphone a utilisé ses réponses en direct pour cette heure. Voici des exemples réels enregistrés ; réessayez plus tard.",
  },
  failed: {
    en: "The live models did not answer. Here are recorded real examples.",
    fr: "Les modèles en direct n'ont pas répondu. Voici des exemples réels enregistrés.",
  },
  loading: { en: "Loading…", fr: "Chargement…" },
  demos: { en: "Demos", fr: "Démonstrations" },
} satisfies Record<string, Record<Locale, string>>;

const WHY: Record<RecordedWhy, keyof typeof COPY> = {
  "no-token": "off",
  code: "off",
  offline: "off",
  failed: "failed",
  "used-up": "usedUp",
};

type Demo = ComponentType<{ env: SoloEnv; remaining?: number | null }>;

export const DEMOS: { id: string; title: Record<Locale, string>; blurb: Record<Locale, string>; component: Demo }[] = [
  {
    id: "tokens",
    title: { en: "Tokens", fr: "Les tokens" },
    blurb: { en: "Type a sentence, see how a model cuts it.", fr: "Tapez une phrase, voyez comment un modèle la découpe." },
    component: lazy(() => import("@ai-exhibit/scene-components/solo/TokensSolo.tsx")),
  },
  {
    id: "words",
    title: { en: "Words as points", fr: "Les mots deviennent des points" },
    blurb: { en: "Search a word on the map of meanings.", fr: "Cherchez un mot sur la carte des sens." },
    component: lazy(() => import("@ai-exhibit/scene-components/solo/WordsSolo.tsx")),
  },
  {
    id: "models",
    title: { en: "Base model and assistant", fr: "Modèle de base et assistant" },
    blurb: {
      en: "One continues your text, the other answers your question.",
      fr: "L'un continue votre texte, l'autre répond à votre question.",
    },
    component: lazy(() => import("@ai-exhibit/scene-components/solo/ModelsSolo.tsx")),
  },
  {
    id: "ladder",
    title: { en: "Then and now", fr: "Hier et aujourd'hui" },
    blurb: {
      en: "Ask one question to three models of increasing size.",
      fr: "Posez une question à trois modèles de plus en plus grands.",
    },
    component: lazy(() => import("@ai-exhibit/scene-components/solo/LadderSolo.tsx")),
  },
];

/** The scenes' copy is translated in the talk's catalog: load it once, with this tab. */
let catalogsReady: Promise<void> | null = null;
function loadCatalogs(): Promise<void> {
  catalogsReady ??= import("@ai-exhibit/canonical/locales").then((m) => installCatalogs(m.catalogs));
  return catalogsReady;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export default function Play({ locale, initialOpen = null }: { locale: Locale; initialOpen?: string | null }) {
  const device = useMemo(() => deviceId(), []);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<CloudStatus | null | "error">(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [stopped, setStopped] = useState<"used-up" | "failed" | null>(null);
  const [open, setOpen] = useState<string | null>(initialOpen);
  const reducedMotion = useReducedMotion();
  const openRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    let alive = true;
    loadCatalogs().then(
      () => alive && setReady(true),
      () => alive && setReady(true),
    );
    cloudStatus({ audience: device, accessCode: null }).then(
      (s) => {
        if (!alive) return;
        setStatus(s);
        if (s.audience) setRemaining(s.audience.remaining);
      },
      () => alive && setStatus("error"),
    );
    return () => {
      alive = false;
    };
  }, [device]);

  const play = decidePlay(status, stopped);
  const perHour = status && status !== "error" ? status.audience?.perHour : undefined;

  const env: SoloEnv = useMemo(
    () => ({
      locale,
      live: play.mode === "live",
      cloud: { audience: device, accessCode: null, onRemaining: setRemaining },
      report: (err) => {
        const trouble = troubleOf(err);
        const left = (err as { budget?: { remaining: number } }).budget?.remaining;
        if (typeof left === "number") setRemaining(left);
        // A ladder may be refused while a single answer still fits: stop only at zero.
        if (trouble === "used-up" && (left ?? 0) <= 0) setStopped("used-up");
        if (trouble === "failed") setStopped("failed");
        return trouble;
      },
      reducedMotion,
    }),
    [locale, play.mode, device, reducedMotion],
  );

  useEffect(() => {
    if (open) openRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
  }, [open, reducedMotion]);

  return (
    <section className={styles.play} aria-label={tr(COPY.demos, locale)}>
      <p className={styles.intro}>{tr(COPY.intro, locale)}</p>
      {play.mode === "checking" ? <p className={styles.status}>{tr(COPY.checking, locale)}</p> : null}
      {play.mode === "live" && remaining !== null && perHour ? (
        <p className={styles.status} role="status">
          {tr(COPY.left, locale).replace("{n}", String(remaining)).replace("{m}", String(perHour))}
        </p>
      ) : null}
      {play.mode === "recorded" ? (
        <p className={styles.notice} role="status">
          {tr(COPY[WHY[play.why]], locale)}
        </p>
      ) : null}
      <ul className={styles.demos}>
        {DEMOS.map((d) => {
          const isOpen = open === d.id;
          const Demo = d.component;
          return (
            <li key={d.id} className={`${styles.demo} ${isOpen ? styles.open : ""}`} ref={isOpen ? openRef : undefined}>
              <button
                type="button"
                className={styles.head}
                aria-expanded={isOpen}
                aria-controls={`play-${d.id}`}
                onClick={() => setOpen(isOpen ? null : d.id)}
              >
                <span className={styles.title}>{tr(d.title, locale)}</span>
                <span className={styles.blurb}>{tr(d.blurb, locale)}</span>
                <span className={styles.chevron} aria-hidden="true" />
              </button>
              {isOpen ? (
                <div className={styles.body} id={`play-${d.id}`}>
                  {ready && play.mode !== "checking" ? (
                    <Suspense fallback={<p className={styles.status}>{tr(COPY.loading, locale)}</p>}>
                      <Demo env={env} remaining={remaining} />
                    </Suspense>
                  ) : (
                    <p className={styles.status}>{tr(COPY.loading, locale)}</p>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
