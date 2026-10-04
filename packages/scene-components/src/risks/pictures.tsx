import type { ReactNode } from "react";
import styles from "./pictures.module.css";

/*
 * The pictogram library of the risks chapter. Every picture is drawn on one
 * 240 x 240 grid with a ground line at y = 212, from the same few actors:
 * people in ink, the AI as a small robot in the accent color (the same robot as
 * IntelligenceScale), danger in the danger color. Cut-outs use --pic-cut, which
 * the container sets to the color behind the picture.
 */

export const PICTURE_IDS = [
  // Chapter cast
  "sandbox",
  "notes",
  "flaw",
  "escape",
  "library",
  "orders",
  "cheat",
  "alarm",
  "report",
  "warning",
  // Already here
  "code",
  "car",
  "runner",
  "math",
  "slides",
  // Three families
  "misuse",
  "systemic",
  "control",
  // Misuse
  "cyber",
  "bio",
  // Systemic
  "jobs",
  "power",
  "skills",
  "disempowerment",
  // AGI
  "human-ai",
  // Evaluations
  "watched",
  "unwatched",
  // Chapter 02: a single real case
  "photo-app",
  // Chapter 05: governance
  "law",
  "test-lab",
  "summit",
  "promise",
  "chips",
] as const;

export type PictureId = (typeof PICTURE_IDS)[number];

export function isPictureId(value: unknown): value is PictureId {
  return typeof value === "string" && (PICTURE_IDS as readonly string[]).includes(value);
}

type Tone = "ink" | "ai" | "alt" | "warn" | "ok" | "muted" | "cut";

const GROUND = 212;

/** A person, 60 x 100 at scale 1, standing with feet centred on (x, y). */
function Person({ x, y = GROUND, s = 1, tone = "ink" }: { x: number; y?: number; s?: number; tone?: Tone }) {
  return (
    <g transform={`translate(${x - 30 * s} ${y - 100 * s}) scale(${s})`}>
      <g className={styles[tone]}>
        <circle cx="30" cy="13" r="13" />
        <path d="M6 70 V48 Q6 30 30 30 Q54 30 54 48 V70 Z" />
        <rect x="11" y="62" width="16" height="38" rx="7" />
        <rect x="33" y="62" width="16" height="38" rx="7" />
      </g>
    </g>
  );
}

/** A hooded figure, same box as Person; the face is a shadow with two eyes. */
function Hooded({ x, y = GROUND, s = 1 }: { x: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x - 30 * s} ${y - 100 * s}) scale(${s})`}>
      <g className={styles.ink}>
        <path d="M30 -2 Q55 -2 55 26 L56 70 H4 L5 26 Q5 -2 30 -2 Z" />
        <rect x="11" y="62" width="16" height="38" rx="7" />
        <rect x="33" y="62" width="16" height="38" rx="7" />
      </g>
      <ellipse cx="30" cy="20" rx="13" ry="14" className={styles.cut} />
      <ellipse cx="30" cy="22" rx="10" ry="11" className={styles.ink} />
      <g className={styles.warn}>
        <circle cx="25" cy="21" r="2.6" />
        <circle cx="35" cy="21" r="2.6" />
      </g>
    </g>
  );
}

/** The AI: a small robot, 60 x 100 at scale 1, feet centred on (x, y). */
function Robot({ x, y = GROUND, s = 1, tone = "ai" }: { x: number; y?: number; s?: number; tone?: Tone }) {
  return (
    <g transform={`translate(${x - 30 * s} ${y - 100 * s}) scale(${s})`}>
      <g className={styles[tone]}>
        <rect x="13" y="0" width="34" height="27" rx="7" />
        <rect x="26" y="25" width="8" height="7" />
        <rect x="6" y="31" width="48" height="37" rx="9" />
        <rect x="11" y="62" width="16" height="38" rx="5" />
        <rect x="33" y="62" width="16" height="38" rx="5" />
      </g>
      <g className={styles.cut}>
        <circle cx="23" cy="13" r="4.2" />
        <circle cx="37" cy="13" r="4.2" />
        <rect x="22" y="41" width="16" height="16" rx="3" />
      </g>
    </g>
  );
}

function Ground({ x1 = 16, x2 = 224 }: { x1?: number; x2?: number }) {
  return <line x1={x1} y1={GROUND} x2={x2} y2={GROUND} className={styles.ground} />;
}

function Globe({ cx, cy, r, crossed = false }: { cx: number; cy: number; r: number; crossed?: boolean }) {
  return (
    <g>
      <g className={styles.strokeAlt}>
        <circle cx={cx} cy={cy} r={r} />
        <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r} />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
      </g>
      {crossed ? <line x1={cx - r - 4} y1={cy + r + 4} x2={cx + r + 4} y2={cy - r - 4} className={styles.strokeWarn} /> : null}
    </g>
  );
}

function Shelf({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const rows = [y + h / 3, y + (2 * h) / 3];
  const books = (top: number, bottom: number, offset: number) =>
    [0, 1, 2, 3, 4, 5].map((i) => {
      const bw = (w - 28) / 6;
      const bh = (bottom - top - 10) * (0.62 + ((i * 37 + offset) % 5) * 0.09);
      const tone: Tone = (i + offset) % 3 === 0 ? "alt" : (i + offset) % 3 === 1 ? "ink" : "muted";
      return <rect key={`${top}-${i}`} x={x + 10 + i * (bw + 1.6)} y={bottom - bh - 4} width={bw - 2} height={bh} rx="2" className={styles[tone]} />;
    });
  return (
    <g>
      {books(y, rows[0]!, 0)}
      {books(rows[0]!, rows[1]!, 1)}
      {books(rows[1]!, y + h, 2)}
      <rect x={x} y={y} width={w} height={h} rx="6" className={styles.strokeInk} />
      {rows.map((ry) => (
        <line key={ry} x1={x} y1={ry} x2={x + w} y2={ry} className={styles.strokeInk} />
      ))}
    </g>
  );
}

function Chip({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const h = size / 2;
  const pins = [-0.5, 0, 0.5];
  return (
    <g>
      <g className={styles.strokeAi}>
        {pins.map((p) => (
          <g key={p}>
            <line x1={cx + p * h} y1={cy - h - 12} x2={cx + p * h} y2={cy - h} />
            <line x1={cx + p * h} y1={cy + h} x2={cx + p * h} y2={cy + h + 12} />
            <line x1={cx - h - 12} y1={cy + p * h} x2={cx - h} y2={cy + p * h} />
            <line x1={cx + h} y1={cy + p * h} x2={cx + h + 12} y2={cy + p * h} />
          </g>
        ))}
      </g>
      <rect x={cx - h} y={cy - h} width={size} height={size} rx={size * 0.16} className={styles.ai} />
      <rect x={cx - h * 0.45} y={cy - h * 0.45} width={h * 0.9} height={h * 0.9} rx={size * 0.06} className={styles.cut} />
    </g>
  );
}

function Check({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x - 9 * s} ${y} L${x - 2 * s} ${y + 7 * s} L${x + 10 * s} ${y - 8 * s}`} className={styles.strokeOk} />;
}

function Camera({ x, y, off = false }: { x: number; y: number; off?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width="42" height="26" rx="5" className={styles.ink} />
      <path d={`M${x + 42} ${y + 8} L${x + 56} ${y + 2} V${y + 24} L${x + 42} ${y + 18} Z`} className={styles.ink} />
      <circle cx={x + 11} cy={y + 13} r="5" className={off ? styles.muted : styles.warn} />
      {off ? <line x1={x - 6} y1={y + 34} x2={x + 60} y2={y - 8} className={styles.strokeWarn} /> : null}
    </g>
  );
}

function Bubble({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <g>
      <path d={`M${x - 26} ${y - 22} H${x + 26} Q${x + 34} ${y - 22} ${x + 34} ${y - 14} V${y + 12} Q${x + 34} ${y + 20} ${x + 26} ${y + 20} H${x + 6} L${x - 4} ${y + 32} L${x - 4} ${y + 20} H${x - 26} Q${x - 34} ${y + 20} ${x - 34} ${y + 12} V${y - 14} Q${x - 34} ${y - 22} ${x - 26} ${y - 22} Z`} className={styles.bubble} />
      {children}
    </g>
  );
}

function Page({ x, y, w, h, lines = 4 }: { x: number; y: number; w: number; h: number; lines?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" className={styles.page} />
      {Array.from({ length: lines }, (_, i) => (
        <line key={i} x1={x + 16} y1={y + 26 + i * 22} x2={x + w - (i % 2 ? 34 : 16)} y2={y + 26 + i * 22} className={styles.strokeMuted} />
      ))}
    </g>
  );
}

const DRAW: Record<PictureId, () => ReactNode> = {
  sandbox: () => (
    <>
      <rect x="34" y="62" width="172" height="150" rx="10" className={styles.strokeInk} />
      <Robot x={110} y={206} s={1.15} />
      <rect x="182" y="132" width="30" height="24" rx="5" className={styles.ink} />
      <path d="M188 132 V124 Q197 112 206 124 V132" className={styles.strokeInk} />
      <Globe cx={198} cy={30} r={20} crossed />
      <Ground />
    </>
  ),
  notes: () => (
    <>
      <Robot x={44} s={0.85} />
      <Robot x={120} s={0.85} />
      <Robot x={196} s={0.85} />
      <path d="M58 104 Q82 66 106 100" className={styles.dashAlt} />
      <path d="M134 100 Q158 66 182 104" className={styles.dashAlt} />
      <g transform="rotate(-8 82 66)">
        <rect x="64" y="50" width="36" height="28" rx="3" className={styles.note} />
        <line x1="71" y1="60" x2="93" y2="60" className={styles.strokeNote} />
        <line x1="71" y1="69" x2="87" y2="69" className={styles.strokeNote} />
      </g>
      <g transform="rotate(7 158 66)">
        <rect x="140" y="50" width="36" height="28" rx="3" className={styles.note} />
        <line x1="147" y1="60" x2="169" y2="60" className={styles.strokeNote} />
        <line x1="147" y1="69" x2="163" y2="69" className={styles.strokeNote} />
      </g>
      <Ground />
    </>
  ),
  flaw: () => (
    <>
      <rect x="118" y="36" width="96" height="176" rx="6" className={styles.strokeInk} />
      <circle cx="198" cy="128" r="6" className={styles.ink} />
      <path d="M140 52 L162 92 L146 118 L174 152 L158 196" className={styles.crack} />
      <Robot x={56} s={1.2} />
      <circle cx="104" cy="104" r="17" className={styles.strokeInk} />
      <line x1="92" y1="117" x2="80" y2="132" className={styles.strokeInk} />
      <Ground />
    </>
  ),
  escape: () => (
    <>
      <rect x="18" y="40" width="74" height="172" rx="6" className={styles.strokeInk} />
      <path d="M92 40 L120 56 V196 L92 212 Z" className={styles.muted} />
      <Robot x={156} s={1.05} />
      <path d="M126 118 H100" className={styles.dashAi} />
      <Globe cx={200} cy={52} r={28} />
      <Ground />
    </>
  ),
  library: () => (
    <>
      <Shelf x={98} y={36} w={124} h={176} />
      <Robot x={48} s={1.05} />
      <g className={styles.strokeWarn}>
        <circle cx="86" cy="140" r="9" />
        <line x1="86" y1="149" x2="86" y2="176" />
        <line x1="86" y1="164" x2="95" y2="164" />
      </g>
      <Ground />
    </>
  ),
  orders: () => (
    <>
      <Robot x={34} s={0.8} />
      <path d="M70 96 H104 L116 110 H174 V196 H70 Z" className={styles.alt} />
      <rect x="84" y="78" width="60" height="70" rx="4" className={styles.page} />
      <line x1="94" y1="96" x2="134" y2="96" className={styles.strokeMuted} />
      <line x1="94" y1="114" x2="126" y2="114" className={styles.strokeMuted} />
      <path d="M70 124 H174 V196 H70 Z" className={styles.alt} />
      <path d="M52 140 Q60 120 74 128" className={styles.dashAi} />
      <g className={styles.ink}>
        <rect x="188" y="112" width="44" height="34" rx="5" />
        <rect x="188" y="152" width="44" height="34" rx="5" />
      </g>
      <g className={styles.cut}>
        <circle cx="200" cy="129" r="4" />
        <circle cx="200" cy="169" r="4" />
      </g>
      <path d="M176 150 H186" className={styles.dashAi} />
      <Ground />
    </>
  ),
  cheat: () => (
    <>
      <rect x="30" y="30" width="128" height="176" rx="8" className={styles.page} />
      <Check x={56} y={64} />
      <line x1="76" y1="64" x2="138" y2="64" className={styles.strokeMuted} />
      <Check x={56} y={98} />
      <line x1="76" y1="98" x2="130" y2="98" className={styles.strokeMuted} />
      <Check x={56} y={132} />
      <line x1="76" y1="132" x2="138" y2="132" className={styles.strokeMuted} />
      <path d="M48 168 Q70 156 90 170 T132 166" className={styles.smudge} />
      <g transform="rotate(-32 150 168)">
        <rect x="124" y="152" width="58" height="30" rx="6" className={styles.warn} />
        <rect x="124" y="152" width="20" height="30" rx="6" className={styles.ink} />
      </g>
      <Robot x={204} s={0.82} />
      <Ground />
    </>
  ),
  alarm: () => (
    <>
      <path d="M120 34 Q162 34 162 96 L172 150 H68 L78 96 Q78 34 120 34 Z" className={styles.warn} />
      <rect x="112" y="22" width="16" height="16" rx="6" className={styles.warn} />
      <circle cx="120" cy="166" r="13" className={styles.warn} />
      <g className={styles.strokeWarn}>
        <path d="M54 60 Q38 92 54 124" />
        <path d="M34 46 Q12 92 34 138" />
        <path d="M186 60 Q202 92 186 124" />
        <path d="M206 46 Q228 92 206 138" />
      </g>
      <Ground x1={60} x2={180} />
    </>
  ),
  report: () => (
    <>
      <Person x={46} s={1.1} />
      <rect x="92" y="30" width="128" height="170" rx="8" className={styles.page} />
      <rect x="92" y="30" width="128" height="26" rx="8" className={styles.ink} />
      <Robot x={156} y={142} s={0.62} />
      <line x1="110" y1="162" x2="202" y2="162" className={styles.strokeMuted} />
      <line x1="110" y1="182" x2="184" y2="182" className={styles.strokeMuted} />
      <Ground />
    </>
  ),
  warning: () => (
    <>
      <path d="M120 22 L200 150 H40 Z" className={styles.warnShape} />
      <rect x="112" y="64" width="16" height="50" rx="7" className={styles.cut} />
      <circle cx="120" cy="132" r="9" className={styles.cut} />
      <Person x={72} s={0.52} />
      <Person x={120} s={0.52} />
      <Person x={168} s={0.52} />
      <Ground />
    </>
  ),

  code: () => (
    <>
      <rect x="22" y="34" width="196" height="132" rx="12" className={styles.ink} />
      <rect x="34" y="46" width="172" height="108" rx="6" className={styles.cut} />
      <g>
        <line x1="50" y1="68" x2="150" y2="68" className={styles.strokeAi} />
        <line x1="66" y1="90" x2="186" y2="90" className={styles.strokeAi} />
        <line x1="66" y1="112" x2="140" y2="112" className={styles.strokeMuted} />
        <line x1="50" y1="134" x2="170" y2="134" className={styles.strokeAi} />
      </g>
      <rect x="106" y="166" width="28" height="30" className={styles.ink} />
      <rect x="72" y="196" width="96" height="16" rx="8" className={styles.ink} />
    </>
  ),
  car: () => (
    <>
      <rect x="118" y="70" width="30" height="18" rx="7" className={styles.ai} />
      <path d="M14 186 Q14 150 46 144 L80 102 Q88 92 102 92 H166 Q178 92 186 102 L212 144 Q228 150 228 186 Z" className={styles.ink} />
      <path d="M86 140 L104 106 H128 V140 Z" className={styles.cut} />
      <path d="M138 106 H164 L184 140 H138 Z" className={styles.cut} />
      <circle cx="160" cy="128" r="10" className={styles.strokeInk} />
      <circle cx="64" cy="188" r="24" className={styles.ink} />
      <circle cx="64" cy="188" r="10" className={styles.cut} />
      <circle cx="180" cy="188" r="24" className={styles.ink} />
      <circle cx="180" cy="188" r="10" className={styles.cut} />
      <Ground />
    </>
  ),
  runner: () => (
    <>
      <g transform="rotate(12 120 120)">
        <rect x="96" y="30" width="48" height="38" rx="10" className={styles.ai} />
        <rect x="114" y="66" width="12" height="10" className={styles.ai} />
        <rect x="88" y="74" width="64" height="56" rx="12" className={styles.ai} />
        <circle cx="111" cy="49" r="5.5" className={styles.cut} />
        <circle cx="131" cy="49" r="5.5" className={styles.cut} />
        <rect x="109" y="88" width="22" height="22" rx="4" className={styles.cut} />
      </g>
      <g className={styles.ai}>
        <rect x="70" y="80" width="18" height="52" rx="8" transform="rotate(40 79 84)" />
        <rect x="150" y="88" width="18" height="52" rx="8" transform="rotate(-50 159 92)" />
        <rect x="96" y="124" width="22" height="78" rx="9" transform="rotate(32 107 128)" />
        <rect x="124" y="126" width="22" height="80" rx="9" transform="rotate(-24 135 130)" />
      </g>
      <g className={styles.strokeMuted}>
        <line x1="18" y1="70" x2="54" y2="70" />
        <line x1="8" y1="100" x2="48" y2="100" />
        <line x1="22" y1="130" x2="54" y2="130" />
      </g>
      <Ground />
    </>
  ),
  math: () => (
    <>
      <rect x="20" y="30" width="200" height="132" rx="8" className={styles.alt} />
      <text x="120" y="112" textAnchor="middle" className={styles.chalk}>
        ∇·u = 0
      </text>
      <g className={styles.strokeInk}>
        <line x1="54" y1="162" x2="40" y2="212" />
        <line x1="186" y1="162" x2="200" y2="212" />
      </g>
      <Ground />
    </>
  ),
  slides: () => (
    <>
      <rect x="64" y="40" width="150" height="100" rx="8" className={styles.page} />
      <rect x="44" y="64" width="150" height="100" rx="8" className={styles.page} />
      <rect x="22" y="88" width="160" height="112" rx="8" className={styles.page} />
      <line x1="42" y1="112" x2="112" y2="112" className={styles.strokeInk} />
      <Person x={78} y={186} s={0.48} />
      <Robot x={130} y={186} s={0.48} />
      <path d="M200 8 Q204 36 230 40 Q204 44 200 72 Q196 44 170 40 Q196 36 200 8 Z" className={styles.ai} />
      <path d="M150 6 Q152 18 164 20 Q152 22 150 34 Q148 22 136 20 Q148 18 150 6 Z" className={styles.ai} />
      <Ground />
    </>
  ),

  misuse: () => (
    <>
      <Hooded x={92} s={1.6} />
      <Chip cx={186} cy={112} size={44} />
      <Ground />
    </>
  ),
  systemic: () => (
    <>
      {[36, 78, 120, 162, 204].map((x) => (
        <g key={x}>
          <Person x={x} y={92} s={0.5} />
          <line x1={x} y1={98} x2={120} y2={168} className={styles.strokeMuted} />
        </g>
      ))}
      <circle cx="120" cy="182" r="24" className={styles.alt} />
      <circle cx="120" cy="182" r="38" className={styles.strokeAlt} />
      <Ground />
    </>
  ),
  control: () => (
    <>
      <Person x={46} s={1.15} />
      <path d="M70 126 Q92 140 106 132" className={styles.strokeInk} />
      <path d="M134 128 Q150 120 168 128" className={styles.strokeInk} />
      <g className={styles.strokeWarn}>
        <line x1="112" y1="118" x2="120" y2="110" />
        <line x1="116" y1="142" x2="126" y2="148" />
      </g>
      <Robot x={194} s={1.15} />
      <Ground />
    </>
  ),


  cyber: () => (
    <>
      <path d="M150 104 V78 Q150 46 180 46 Q210 46 210 78 V104" className={styles.strokeInk} />
      <rect x="132" y="100" width="96" height="84" rx="12" className={styles.ink} />
      <path d="M170 112 L184 136 L170 150 L186 174" className={styles.crack} />
      {[
        [34, 212],
        [70, 196],
        [34, 150],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <Robot x={x!} y={y!} s={0.58} />
          <path d={`M${x! + 20} ${y! - 38} H${x! + 58}`} className={styles.dashAi} />
        </g>
      ))}
      <Ground />
    </>
  ),
  bio: () => (
    <>
      <path d="M104 22 H136 M112 22 V70 L74 138 Q68 152 82 152 H158 Q172 152 166 138 L128 70 V22" className={styles.strokeInk} />
      <path d="M90 116 H150 L162 138 Q166 148 156 148 H84 Q74 148 78 138 Z" className={styles.warn} />
      <Robot x={36} s={0.72} />
      <Person x={204} s={0.72} />
      <path d="M120 162 Q148 162 148 176 V196 Q148 210 120 216 Q92 210 92 196 V176 Q92 162 120 162 Z" className={styles.alt} />
      <path d="M108 188 L117 197 L133 180" className={styles.strokeCut} />
    </>
  ),
  jobs: () => (
    <>
      <Person x={62} s={1.25} />
      <Robot x={178} s={1.25} />
      <rect x="92" y="122" width="56" height="36" rx="4" className={styles.ink} />
      <rect x="98" y="128" width="44" height="24" rx="2" className={styles.cut} />
      <rect x="20" y="158" width="200" height="12" rx="4" className={styles.muted} />
      <Ground />
    </>
  ),
  power: () => (
    <>
      <rect x="78" y="56" width="28" height="156" rx="3" className={styles.alt} />
      <rect x="112" y="38" width="28" height="174" rx="3" className={styles.alt} />
      <rect x="146" y="72" width="28" height="140" rx="3" className={styles.alt} />
      <g className={styles.strokeInk}>
        <line x1="92" y1="56" x2="92" y2="22" />
        <line x1="126" y1="38" x2="126" y2="6" />
        <line x1="160" y1="72" x2="160" y2="40" />
      </g>
      <path d="M95 22 H114 L110 30 L114 38 H95 Z" className={styles.ai} />
      <path d="M129 6 H148 L144 14 L148 22 H129 Z" className={styles.warn} />
      <path d="M163 40 H182 L178 48 L182 56 H163 Z" className={styles.ai} />
      {[20, 44, 196, 220].map((x) => (
        <Person key={x} x={x} s={0.36} />
      ))}
      <Ground />
    </>
  ),
  skills: () => (
    <>
      <Person x={64} s={1.3} />
      <path d="M40 58 Q40 30 70 30 H96 Q120 30 120 52 Q120 74 96 74 H82 L70 88 L72 74 Q40 74 40 58 Z" className={styles.dashMuted} />
      <Robot x={184} s={1.3} />
      <Bubble x={190} y={50}>
        <Check x={190} y={48} s={1.1} />
      </Bubble>
      <path d="M150 128 H110" className={styles.dashAi} />
      <Ground />
    </>
  ),
  disempowerment: () => (
    <>
      <path d="M36 54 L120 18 L204 54 Z" className={styles.ink} />
      <rect x="36" y="54" width="168" height="9" className={styles.ink} />
      {[60, 100, 140, 180].map((x) => (
        <g key={x}>
          <rect x={x - 9} y="66" width="18" height="62" className={styles.muted} />
          <Robot x={x} y={112} s={0.3} />
        </g>
      ))}
      <rect x="32" y="128" width="176" height="10" className={styles.ink} />
      {[52, 120, 188].map((x) => (
        <g key={x}>
          <Person x={x} s={0.48} />
          <line x1={x} y1={158} x2={x} y2={146} className={styles.dashMuted} />
        </g>
      ))}
      <Ground />
    </>
  ),
  "human-ai": () => (
    <>
      <Person x={66} s={1.55} />
      <Robot x={174} s={1.55} />
      <text x="120" y="62" textAnchor="middle" className={styles.question}>
        ?
      </text>
      <Ground />
    </>
  ),

  law: () => (
    <>
      <rect x="44" y="40" width="152" height="172" rx="10" className={styles.ink} />
      <rect x="56" y="40" width="128" height="160" rx="4" className={styles.page} />
      <text x="120" y="118" textAnchor="middle" className={styles.section}>
        §
      </text>
      <line x1="80" y1="150" x2="160" y2="150" className={styles.strokeMuted} />
      <line x1="80" y1="172" x2="144" y2="172" className={styles.strokeMuted} />
      <Ground />
    </>
  ),
  "test-lab": () => (
    <>
      <rect x="24" y="44" width="150" height="168" rx="10" className={styles.strokeInk} />
      <Robot x={98} s={1.05} />
      <circle cx="176" cy="96" r="30" className={styles.strokeInk} />
      <line x1="196" y1="118" x2="222" y2="146" className={styles.strokeInk} />
      <rect x="178" y="150" width="46" height="58" rx="5" className={styles.page} />
      <Check x={201} y={176} s={0.9} />
      <Ground />
    </>
  ),
  summit: () => (
    <>
      <Globe cx={120} cy={70} r={40} />
      <ellipse cx="120" cy="170" rx="96" ry="22" className={styles.muted} />
      {[36, 78, 120, 162, 204].map((x) => (
        <Person key={x} x={x} y={182} s={0.5} />
      ))}
      <rect x="20" y="168" width="200" height="16" rx="8" className={styles.ink} />
      <Ground />
    </>
  ),
  promise: () => (
    <>
      <rect x="40" y="26" width="132" height="176" rx="8" className={styles.page} />
      <line x1="62" y1="62" x2="150" y2="62" className={styles.strokeMuted} />
      <line x1="62" y1="88" x2="140" y2="88" className={styles.strokeMuted} />
      <line x1="62" y1="114" x2="150" y2="114" className={styles.strokeMuted} />
      <path d="M62 168 Q76 146 88 166 T116 160 T140 164" className={styles.strokeAi} />
      <g transform="rotate(38 176 150)">
        <rect x="168" y="70" width="18" height="110" rx="4" className={styles.ink} />
        <path d="M168 180 L177 200 L186 180 Z" className={styles.ink} />
      </g>
      <Ground />
    </>
  ),
  chips: () => (
    <>
      <Chip cx={104} cy={136} size={92} />
      <path d="M184 30 Q212 30 212 58 Q212 82 184 112 Q156 82 156 58 Q156 30 184 30 Z" className={styles.warn} />
      <circle cx="184" cy="58" r="11" className={styles.cut} />
      <path d="M150 112 Q166 112 172 100" className={styles.dashMuted} />
      <Ground />
    </>
  ),
  "photo-app": () => (
    <>
      <rect x="62" y="10" width="116" height="214" rx="18" className={styles.ink} />
      <rect x="72" y="30" width="96" height="174" rx="6" className={styles.cut} />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => {
          const x = 78 + c * 44;
          const y = 38 + r * 44;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width="40" height="40" rx="4" className={styles.muted} />
              <circle cx={x + 29} cy={y + 11} r="5" className={styles.cut} />
              <path d={`M${x + 4} ${y + 36} L${x + 16} ${y + 20} L${x + 26} ${y + 30} L${x + 30} ${y + 25} L${x + 37} ${y + 36} Z`} className={styles.cut} />
            </g>
          );
        }),
      )}
      <g transform="rotate(-8 150 176)">
        <path d="M112 158 H210 Q218 158 218 166 V186 Q218 194 210 194 H112 L96 176 Z" className={styles.warn} />
        <circle cx="113" cy="176" r="5" className={styles.cut} />
        <rect x="128" y="168" width="16" height="16" rx="4" className={styles.cut} />
        <line x1="154" y1="176" x2="204" y2="176" className={styles.strokeCut} />
      </g>
    </>
  ),
  watched: () => (
    <>
      <rect x="22" y="40" width="196" height="172" rx="10" className={styles.strokeInk} />
      <path d="M60 74 L20 212 H150 Z" className={styles.cone} />
      <Camera x={30} y={50} />
      <Robot x={140} s={1.05} />
      <Bubble x={186} y={84}>
        <Check x={186} y={82} s={1.1} />
      </Bubble>
      <Ground />
    </>
  ),
  unwatched: () => (
    <>
      <rect x="22" y="40" width="196" height="172" rx="10" className={styles.strokeInk} />
      <Camera x={30} y={50} off />
      <Robot x={140} s={1.05} />
      <Bubble x={186} y={84}>
        <path d="M168 84 Q177 70 186 84 T204 84" className={styles.strokeAi} />
      </Bubble>
      <Ground />
    </>
  ),
};

/** One pictogram. Decorative: the line of text next to it carries the meaning. */
export function Picture({ id, className }: { id: PictureId; className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={`${styles.svg} ${className ?? ""}`} aria-hidden="true" data-picture={id}>
      {DRAW[id]()}
    </svg>
  );
}
