/**
 * A real (small) Enigma I simulation and a crib search, for the Bletchley Park
 * milestone of AITimeline.
 *
 * Machine: Wehrmacht Enigma I, rotors I, II and III (left to right), reflector
 * B, ring settings AAA, no plugboard. Stepping includes the middle rotor's
 * double step. Checked against the classic test vector (start AAA: AAAAA
 * encrypts to BDZGO).
 *
 * Search: the demo searches ONLY the three rotor start positions (26^3 =
 * 17,576 candidates), in alphabetical order, with the crib placed at the start
 * of the message. A candidate is rejected as soon as one crib letter does not
 * match. The real Bombe was very different in mechanics (36 Enigma equivalents
 * wired by a "menu" drawn from the crib, also searching wheel orders, with a
 * plugboard) but the idea is the same: try settings, reject contradictions,
 * stop where the guessed word fits.
 */

const A = 65;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface RotorSpec {
  wiring: string;
  notch: string;
}

export const ROTORS: Record<"I" | "II" | "III", RotorSpec> = {
  I: { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q" },
  II: { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E" },
  III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V" },
};

export const REFLECTOR_B = "YRUHQSLDPXNGOKMIEBFZCWVJAT";

export interface EnigmaSettings {
  /** Left, middle, right. */
  rotors: ["I" | "II" | "III", "I" | "II" | "III", "I" | "II" | "III"];
  /** Ring settings as letters, left to right (A = 01). */
  rings: string;
  /** Start positions shown in the windows, left to right. */
  start: string;
}

const code = (c: string) => c.charCodeAt(0) - A;
const mod = (n: number) => ((n % 26) + 26) % 26;

interface Wheel {
  forward: number[];
  backward: number[];
  notch: number;
  ring: number;
}

function wheel(name: "I" | "II" | "III", ring: string): Wheel {
  const spec = ROTORS[name];
  const forward = [...spec.wiring].map(code);
  const backward = new Array<number>(26);
  forward.forEach((out, i) => {
    backward[out] = i;
  });
  return { forward, backward, notch: code(spec.notch), ring: code(ring) };
}

function through(c: number, map: number[], pos: number, ring: number): number {
  const shift = pos - ring;
  return mod(map[mod(c + shift)]! - shift);
}

/** One key press: step the rotors, then send the letter through. Returns [output, positions after stepping]. */
function press(wheels: Wheel[], pos: number[], c: number, reflector: number[]): number {
  const [l, m, r] = wheels as [Wheel, Wheel, Wheel];
  // Stepping (with the middle rotor's double step), before the current flows.
  if (pos[1] === m.notch) {
    pos[0] = mod(pos[0]! + 1);
    pos[1] = mod(pos[1]! + 1);
  } else if (pos[2] === r.notch) {
    pos[1] = mod(pos[1]! + 1);
  }
  pos[2] = mod(pos[2]! + 1);

  let x = through(c, r.forward, pos[2]!, r.ring);
  x = through(x, m.forward, pos[1]!, m.ring);
  x = through(x, l.forward, pos[0]!, l.ring);
  x = reflector[x]!;
  x = through(x, l.backward, pos[0]!, l.ring);
  x = through(x, m.backward, pos[1]!, m.ring);
  x = through(x, r.backward, pos[2]!, r.ring);
  return x;
}

const REFLECTOR = [...REFLECTOR_B].map(code);

/** Encrypts or decrypts (Enigma is its own inverse). Letters A to Z only. */
export function enigma(text: string, settings: EnigmaSettings): string {
  const wheels = settings.rotors.map((r, i) => wheel(r, settings.rings[i]!));
  const pos = [...settings.start].map(code);
  let out = "";
  for (const ch of text) out += ALPHABET[press(wheels, pos, code(ch), REFLECTOR)];
  return out;
}

/** The candidate start position at a given index of the alphabetical search order (AAA, AAB, ...). */
export function candidateAt(index: number): string {
  return ALPHABET[Math.floor(index / 676) % 26]! + ALPHABET[Math.floor(index / 26) % 26]! + ALPHABET[index % 26]!;
}

export interface CribSearchResult {
  /** Start positions that make the crib fit, in search order. */
  stops: string[];
  /** Index (in search order) of the first stop: how many candidates were tried before it. */
  firstIndex: number;
}

/** Tries every start position; keeps those where the ciphertext decrypts to the crib at its start. */
export function searchCrib(ciphertext: string, crib: string, base: Omit<EnigmaSettings, "start">): CribSearchResult {
  const wheels = base.rotors.map((r, i) => wheel(r, base.rings[i]!));
  const target = [...crib].map(code);
  const cipher = [...ciphertext.slice(0, crib.length)].map(code);
  const stops: string[] = [];
  let firstIndex = -1;
  for (let i = 0; i < 26 ** 3; i++) {
    const start = candidateAt(i);
    const pos = [...start].map(code);
    let fits = true;
    for (let k = 0; k < cipher.length; k++) {
      if (press(wheels, pos, cipher[k]!, REFLECTOR) !== target[k]) {
        fits = false; // a contradiction: reject this setting at once
        break;
      }
    }
    if (fits) {
      if (firstIndex < 0) firstIndex = i;
      stops.push(start);
    }
  }
  return { stops, firstIndex };
}

/* -------------------------------------------------------------------------- */
/* The demo message                                                            */
/* -------------------------------------------------------------------------- */

/** Wheel order, rings and (secret) start used to make the intercepted message. */
export const DEMO_SETTINGS: EnigmaSettings = { rotors: ["I", "II", "III"], rings: "AAA", start: "NKV" };

/** The guessed word: weather reports ("Wetterbericht") were typical cribs. */
export const DEMO_CRIB = "WETTERBERICHT";

/** Plaintext; X stands for a space, as Enigma operators did. "Weather report, rain this evening." */
export const DEMO_PLAINTEXT = "WETTERBERICHTXREGENABENDS";

/** The intercepted message (computed, so it is always consistent with the machine). */
export const DEMO_CIPHERTEXT = enigma(DEMO_PLAINTEXT, DEMO_SETTINGS);
