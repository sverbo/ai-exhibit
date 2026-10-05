/**
 * The "Try it" tab of the audience page: the talk's interactive demos, solo, on
 * the phone (docs/specs/2026-10-04-audience-play.md). This module is its own
 * chunk, and each demo is another one, loaded when opened. Live calls carry
 * this phone's device id, so they never count in the presenter's budget; the
 * phone counts its own asks per demo (asks.ts). When a demo's asks are spent,
 * or live calls cannot run, the demos show recorded examples.
 */
import { type ComponentType, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { installCatalogs, tr, type Locale } from "@ai-exhibit/presentation-core";
import { cloudStatus, type CloudStatus } from "@ai-exhibit/ml-runtime/lm";
import { type SoloEnv, troubleOf } from "@ai-exhibit/scene-components/solo/env.ts";
import { ASKS_PER_HOUR, createAskQuota } from "./asks.ts";
import { decidePlay, deviceId, type RecordedWhy } from "./play.ts";
import styles from "./Play.module.css";

const COPY = {
  intro: {
    en: "Try the talk's demos yourself. What you type is sent to the server that runs the models: type nothing personal.",
    fr: "Essayez vous-même les démonstrations de la présentation. Ce que vous tapez est envoyé au serveur qui fait tourner les modèles : n'y mettez rien de personnel.",
  },
  checking: { en: "Checking the live models…", fr: "Vérification des modèles en direct…" },
  asks: {
    en: "Each demo answers live {n} times per phone and hour; tokenizing is free.",
    fr: "Chaque démo répond en direct {n} fois par téléphone et par heure ; le découpage en tokens est gratuit.",
  },
  off: {
    en: "Live models are off right now: these are recorded real examples.",
    fr: "Les modèles en direct ne sont pas disponibles pour l'instant : voici des exemples réels enregistrés.",
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
};

type Demo = ComponentType<{ env: SoloEnv }>;

/** In the order the talk shows them. */
export const DEMOS: { id: string; title: Record<Locale, string>; blurb: Record<Locale, string>; component: Demo }[] = [
  {
    id: "ladder",
    title: { en: "Model progression", fr: "La progression des modèles" },
    blurb: {
      en: "Ask one question to three models of increasing size.",
      fr: "Posez une question à trois modèles de plus en plus grands.",
    },
    component: lazy(() => import("@ai-exhibit/scene-components/solo/LadderSolo.tsx")),
  },
  {
    id: "tokens",
    title: { en: "Tokens", fr: "Les tokens" },
    blurb: { en: "Type a sentence, see how a model cuts it.", fr: "Tapez une phrase, voyez comment un modèle la découpe." },
    component: lazy(() => import("@ai-exhibit/scene-components/solo/TokensSolo.tsx")),
  },
  {
    id: "words",
    title: { en: "From tokens to embeddings", fr: "Des tokens aux embeddings" },
    blurb: {
      en: "Search a word on the map of meanings, or turn the 3D cloud.",
      fr: "Cherchez un mot sur la carte des sens, ou faites tourner le nuage en 3D.",
    },
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
  const quota = useMemo(() => createAskQuota(), []);
  // Bumped when the asks change (one spent, or one freed by time), so demos show the new count.
  const [asksVersion, setAsksVersion] = useState(0);
  const [stopped, setStopped] = useState<"failed" | null>(null);
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
      },
      () => alive && setStatus("error"),
    );
    return () => {
      alive = false;
    };
  }, [device]);

  const play = decidePlay(status, stopped);

  // A spent demo comes back live when its oldest ask is an hour old.
  useEffect(() => {
    const at = quota.nextFree();
    if (at === null) return;
    const timer = setTimeout(() => setAsksVersion((v) => v + 1), Math.max(1000, at - Date.now() + 500));
    return () => clearTimeout(timer);
  }, [quota, asksVersion]);

  const env: SoloEnv = useMemo(
    () => ({
      locale,
      live: play.mode === "live",
      cloud: { audience: device, accessCode: null },
      left: (demo) => quota.left(demo),
      perHour: ASKS_PER_HOUR,
      spend: (demo) => {
        quota.spend(demo);
        setAsksVersion((v) => v + 1);
      },
      report: (err) => {
        const trouble = troubleOf(err);
        if (trouble === "failed") setStopped("failed");
        return trouble;
      },
      reducedMotion,
    }),
    // asksVersion: a new env object makes the demos read the asks again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, play.mode, device, reducedMotion, quota, asksVersion],
  );

  useEffect(() => {
    if (open) openRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
  }, [open, reducedMotion]);

  return (
    <section className={styles.play} aria-label={tr(COPY.demos, locale)}>
      <p className={styles.intro}>{tr(COPY.intro, locale)}</p>
      {play.mode === "checking" ? <p className={styles.status}>{tr(COPY.checking, locale)}</p> : null}
      {play.mode === "live" ? <p className={styles.status}>{tr(COPY.asks, locale).replace("{n}", String(ASKS_PER_HOUR))}</p> : null}
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
                      <Demo env={env} />
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
