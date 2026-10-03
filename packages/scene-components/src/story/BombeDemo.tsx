import { memo } from "react";
import { intlLocale, tr, type L10n, type Locale } from "@ai-exhibit/presentation-core";
import { candidateAt, DEMO_CIPHERTEXT, DEMO_CRIB, DEMO_PLAINTEXT, DEMO_SETTINGS, searchCrib } from "./enigma.ts";
import styles from "./BombeDemo.module.css";

/*
 * The Bletchley Park milestone: a crib search drawn as a Bombe.
 *
 * Behind the picture is a real search (enigma.ts): the intercepted message was
 * made with an Enigma I simulation, and the search tries every rotor start
 * position in order, rejecting each one where the crib does not fit, until the
 * one that fits. The counter and the "stop" show that genuine result.
 *
 * The cabinet is a drawing in the spirit of the British Bombe (108 drums in
 * three banks of 12 triplets, drums coloured by rotor type, the top drum of
 * each triplet turning fastest). Its spinning drums stand for many candidate
 * tests running in parallel; they are not a wiring-accurate model of the Bombe,
 * and the rows are not meant to match a particular rotor role.
 *
 * Everything is a pure function of `tick` (one tick every TICK_MS), which the
 * controller publishes so the projector follows.
 */

export const TICK_MS = 200;
export const SEARCH_TICKS = 30;
export const STOP_TICKS = 6;
export const BOMBE_TICKS = SEARCH_TICKS + STOP_TICKS + DEMO_PLAINTEXT.length;

const SEARCH = searchCrib(DEMO_CIPHERTEXT, DEMO_CRIB, { rotors: DEMO_SETTINGS.rotors, rings: DEMO_SETTINGS.rings });
/** The setting where the search stops (the first, and here the only, stop). */
export const FOUND_SETTING = SEARCH.stops[0]!;
/** How many settings were rejected before the stop. */
export const REJECTED_BEFORE_STOP = SEARCH.firstIndex;
const TOTAL_CANDIDATES = 26 ** 3;

export type BombePhase = "search" | "stop" | "decrypt";

export interface BombeFrame {
  phase: BombePhase;
  /** Settings tried so far (search order). */
  tried: number;
  /** Plaintext letters decoded so far. */
  decoded: number;
}

export function bombeFrame(tick: number): BombeFrame {
  const t = Math.max(0, Math.min(BOMBE_TICKS, Math.round(tick)));
  if (t < SEARCH_TICKS) {
    return { phase: "search", tried: Math.round((REJECTED_BEFORE_STOP * t) / SEARCH_TICKS), decoded: 0 };
  }
  if (t < SEARCH_TICKS + STOP_TICKS) return { phase: "stop", tried: REJECTED_BEFORE_STOP + 1, decoded: 0 };
  return {
    phase: "decrypt",
    tried: REJECTED_BEFORE_STOP + 1,
    decoded: Math.min(DEMO_PLAINTEXT.length, t - SEARCH_TICKS - STOP_TICKS + 1),
  };
}

const COPY = {
  crib: { en: "Guessed word" },
  cipher: { en: "Intercepted" },
  decoded: { en: "Decoded" },
  tried: { en: "settings tried" },
  of: { en: "of" },
  stop: { en: "Stop", fr: "Stop" },
  fits: { en: "the guessed word fits" },
  gloss: { en: "“Weather report, rain this evening”" },
} satisfies Record<string, L10n>;

const ROWS_PER_BANK = 3;
const COLUMNS = 12;
const BANKS = 3;

/** Deterministic letters for the drums that are not the highlighted triplet. */
function drumLetter(bank: number, column: number, row: number): string {
  return String.fromCharCode(65 + ((bank * 7 + column * 11 + row * 5 + 3) % 26));
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** One drum face: a ring with the 26 letters around it, used by reference 108 times. */
function DrumSymbol() {
  return (
    <svg className={styles.defs} aria-hidden="true">
      <defs>
        <symbol id="bombe-drum" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="var(--drum-color)" />
          {[...LETTERS].map((l, i) => {
            const a = (i / 26) * 2 * Math.PI;
            return (
              <text
                key={l}
                x={50 + 39.5 * Math.sin(a)}
                y={50 - 39.5 * Math.cos(a) + 4.2}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                fill="var(--color-on-accent)"
              >
                {l}
              </text>
            );
          })}
          <circle cx="50" cy="50" r="30" fill="var(--color-surface)" />
          {/* The marker: a bold notch on the ring and a hand towards it, so rotation reads from far away. */}
          <path d="M50 0 L60 15 L40 15 Z" fill="var(--color-text)" />
          <rect x="46.5" y="20" width="7" height="16" rx="3" fill="var(--color-text)" />
        </symbol>
      </defs>
    </svg>
  );
}

/** The cabinet only changes when the search starts or stops, so it is memoised. */
const Cabinet = memo(function Cabinet({ spinning, stopped }: { spinning: boolean; stopped: boolean }) {
  return (
    <div className={`${styles.cabinet} ${spinning ? styles.spinning : ""} ${stopped ? styles.stopped : ""}`} aria-hidden="true">
      <DrumSymbol />
      {Array.from({ length: BANKS }, (_, bank) => (
        <div key={bank} className={styles.bank}>
          {Array.from({ length: COLUMNS }, (_, column) => (
            <div key={column} className={`${styles.triplet} ${bank === 0 && column === 0 ? styles.found : ""}`}>
              {Array.from({ length: ROWS_PER_BANK }, (_, row) => {
                const letter = bank === 0 && column === 0 ? FOUND_SETTING[row]! : drumLetter(bank, column, row);
                return (
                  <div
                    key={row}
                    className={styles.drum}
                    data-row={row}
                    style={{ animationDelay: `${-((bank * 13 + column * 7 + row * 3) % 17) * 0.13}s` }}
                  >
                    <svg className={styles.ring} viewBox="0 0 100 100">
                      <use href="#bombe-drum" />
                    </svg>
                    <span className={styles.window}>{letter}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

function Cells({ text, shown, className, lit }: { text: string; shown: number; className?: string; lit?: number }) {
  return (
    <span className={`${styles.cells} ${className ?? ""}`}>
      {[...text].map((ch, i) => (
        <span key={i} className={`${styles.cell} ${i === lit ? styles.lamp : ""}`} data-gap={ch === " "}>
          {i < shown ? ch : ""}
        </span>
      ))}
    </span>
  );
}

const number = (n: number, locale: Locale) => new Intl.NumberFormat(intlLocale(locale)).format(n);

export function BombeDemo({ tick, locale }: { tick: number; locale: Locale }) {
  const frame = bombeFrame(tick);
  const searching = frame.phase === "search";
  const rejected = searching ? [3, 2, 1].map((k) => frame.tried - k).filter((i) => i >= 0).map(candidateAt) : [];
  // X stands for a space in Enigma messages; show it as a gap.
  const plain = DEMO_PLAINTEXT.replace(/X/g, " ");

  return (
    <div className={styles.root} data-phase={frame.phase}>
      <div className={styles.lines}>
        <span className={styles.lineLabel}>{tr(COPY.crib, locale)}</span>
        <Cells text={DEMO_CRIB} shown={DEMO_CRIB.length} className={styles.crib} />
        <span className={styles.lineLabel}>{tr(COPY.cipher, locale)}</span>
        <Cells text={DEMO_CIPHERTEXT} shown={DEMO_CIPHERTEXT.length} className={styles.cipher} />
      </div>

      <div className={styles.machine}>
        <Cabinet spinning={searching} stopped={!searching} />
        <div className={styles.status} aria-live="polite">
          {searching ? (
            <>
              <span className={styles.counter}>{number(frame.tried, locale)}</span>
              <span className={styles.counterLabel}>
                {tr(COPY.tried, locale)} {tr(COPY.of, locale)} {number(TOTAL_CANDIDATES, locale)}
              </span>
              <span className={styles.rejected}>
                {rejected.map((c) => (
                  <span key={c} className={styles.reject}>
                    {c} <span aria-hidden="true">✗</span>
                  </span>
                ))}
              </span>
            </>
          ) : (
            <>
              <span className={styles.stop}>
                {tr(COPY.stop, locale)} {[...FOUND_SETTING].join(" ")}
              </span>
              <span className={styles.counterLabel}>
                {tr(COPY.fits, locale)}, {number(frame.tried, locale)} {tr(COPY.tried, locale)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.lines}>
        <span className={styles.lineLabel}>{tr(COPY.decoded, locale)}</span>
        <Cells text={plain} shown={frame.decoded} className={styles.plain} lit={frame.phase === "decrypt" ? frame.decoded - 1 : undefined} />
        <span />
        <span className={`${styles.gloss} ${frame.decoded === plain.length ? styles.shown : ""}`}>{tr(COPY.gloss, locale)}</span>
      </div>
    </div>
  );
}
