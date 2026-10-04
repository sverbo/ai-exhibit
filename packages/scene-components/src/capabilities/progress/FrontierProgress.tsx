import { tr } from "@ai-exhibit/presentation-core";
import { Rich, RichTspans } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { cx, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { shortSourceLabel } from "../../primitives/sourceLabel.ts";
import { EvidenceBadge } from "../../primitives/EvidenceBadge.tsx";
import {
  BENCH_X,
  FOOTER_SOURCE_IDS,
  GPQA_EXPERTS,
  IMO_GOLD,
  LAST_STEP,
  PANELS,
  PROJECTION_DATE,
  SERIES,
  STEP_GPQA,
  STEP_PROJECTION,
  TOP_X,
  pct,
  yearOf,
  type Kind,
  type Panel,
  type Point,
  type Series,
} from "./progress.ts";
import styles from "./FrontierProgress.module.css";

export type FrontierProgressProps = Record<string, never>;

const TEXT = {
  heading: { en: "From GPT-2 (2019) to today, everything went up" },
  bench: { en: "The hardest tests, best score so far" },
  basis: { en: "How the projection is computed (presenter screen only)" },
  footnote: {
    en: "Estimates: Epoch AI. Measured: METR, Epoch AI, ARC Prize. Pages: 1 token ≈ 0.75 words, 500 words a page.",
  },
};

const KIND_LABEL: Record<Kind, L10n> = {
  estimate: { en: "estimate" },
  published: { en: "published" },
  measured: { en: "measured" },
};

export function FrontierProgress({ ctx }: SceneComponentProps<FrontierProgressProps>) {
  const { locale, role, reducedMotion } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const step = Math.max(0, Math.min(LAST_STEP, Math.floor(ctx.revealStep)));
  const animate = role !== "preview" && !reducedMotion;
  const projected = step >= STEP_PROJECTION;
  const showBasis = role === "controller" && projected;
  const sources = FOOTER_SOURCE_IDS.map((id) => ctx.getSource(id))
    .filter((s) => s !== undefined)
    .map((s) => shortSourceLabel(s))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join("   ");

  return (
    <div className={cx(styles.root, animate && styles.animate)}>
      <h2 className={styles.h}>
        <Rich text={t(TEXT.heading)} />
      </h2>

      <div className={styles.panels}>
        {PANELS.map((p) => (
          <PanelView key={p.id} panel={p} locale={locale} shown={step >= p.step} current={step === p.step} projected={projected} />
        ))}
      </div>

      <figure className={cx(styles.benchFig, step < STEP_GPQA && styles.waiting)}>
        <figcaption className={styles.benchTitle}>
          <Rich text={t(TEXT.bench)} />
          <span className={styles.kind}>
            <Rich text={t(KIND_LABEL.measured)} />
          </span>
        </figcaption>
        <BenchChart step={step} locale={locale} />
      </figure>

      {showBasis ? (
        <aside className={cx(styles.foot, styles.basis)}>
          <span className={styles.basisTitle}>
            <Rich text={t(TEXT.basis)} />
          </span>
          <ul>
            {PANELS.filter((p) => p.projection).map((p) => (
              <li key={p.id}>
                <b>
                  <Rich text={t(p.title)} />
                </b>{" "}
                <Rich text={t(p.projection!.basis)} />
              </li>
            ))}
          </ul>
        </aside>
      ) : (
        <footer className={styles.foot}>
          <p>
            <Rich text={t(TEXT.footnote)} />
          </p>
          <p className={styles.sources}>{sources}</p>
        </footer>
      )}
    </div>
  );
}

/* ---------- Top row: one small linear chart ---------- */

const PW = 424;
const PH = 236;
const PP = { l: 92, r: 16, t: 34, b: 34 };
const pxOf = (year: number) => PP.l + ((year - TOP_X.from) / (TOP_X.to - TOP_X.from)) * (PW - PP.l - PP.r);
const pyOf = (v: number, max: number) => PH - PP.b - (v / max) * (PH - PP.t - PP.b);

function PanelView({
  panel,
  locale,
  shown,
  current,
  projected,
}: {
  panel: Panel;
  locale: Locale;
  shown: boolean;
  current: boolean;
  projected: boolean;
}) {
  const t = (x: L10n) => tr(x, locale);
  const base = PH - PP.b;
  const top = PP.t;
  const pts = panel.points.map((p) => ({ p, x: pxOf(yearOf(p.date)), y: pyOf(p.value, panel.max) }));
  const path = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const end = pts[pts.length - 1]!;
  const proj = panel.projection;
  const projX = pxOf(yearOf(PROJECTION_DATE));
  const tickY = pyOf(panel.tick.value, panel.max);
  return (
    <figure className={cx(styles.panel, !shown && styles.waiting, current && styles.current)}>
      <figcaption className={styles.panelHead}>
        <span className={styles.panelTitle}>
          <Rich text={t(panel.title)} />
          {/* Always laid out (hidden until its step) so the row never changes height. */}
          <span className={cx(styles.growth, shown ? styles.reveal : styles.invisible)} aria-hidden={!shown}>
            <Rich text={t(panel.growth.label)} />
          </span>
        </span>
        <span className={styles.panelSub}>
          <Rich text={t(panel.sub)} />
          <span className={styles.kind}>
            <Rich text={t(KIND_LABEL[panel.kind])} />
          </span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${PW} ${PH}`} className={styles.svg} aria-hidden="true">
        <line x1={PP.l} x2={PW - PP.r} y1={base} y2={base} className={styles.axis} />
        <line x1={PP.l} x2={PP.l} y1={top - 6} y2={base} className={styles.axis} />
        <line x1={PP.l - 6} x2={PW - PP.r} y1={tickY} y2={tickY} className={styles.grid} />
        <text x={PP.l - 10} y={tickY + 6} textAnchor="end" className={styles.tick}>
          <RichTspans text={t(panel.tick.label)} />
        </text>
        <text x={PP.l - 10} y={base + 6} textAnchor="end" className={styles.tick}>
          0
        </text>
        {TOP_X.ticks.map((x) => (
          <text key={x} x={pxOf(x)} y={base + 28} textAnchor="middle" className={styles.tick}>
            {x}
          </text>
        ))}

        {shown && (
          <g className={styles.reveal}>
            <path d={path} className={styles.line} />
            {pts.map((q) => (
              <circle key={q.p.date} cx={q.x} cy={q.y} r={q === end || q === pts[0] ? 7 : 5} className={styles.dot} />
            ))}
            {pts.filter((q) => q.p.label).map((q) => (
              <PointLabel key={q.p.date} x={q.x} y={q.y} point={q.p} locale={locale} />
            ))}
          </g>
        )}

        {shown && projected && proj && (
          <g className={styles.reveal}>
            <path d={`M${end.x.toFixed(1)},${end.y.toFixed(1)} L${projX.toFixed(1)},${top - 8}`} className={styles.projLine} />
            <path d={`M${projX - 9},${top + 4} L${projX},${top - 12} L${projX + 9},${top + 4}`} className={styles.projArrow} />
            <text x={projX + 4} y={top - 18} textAnchor="end" className={styles.projVal}>
              <RichTspans text={t(proj.label)} />
            </text>
          </g>
        )}
      </svg>
      <p className={styles.panelNote}>
        {shown && panel.note && (
          <span>
            <Rich text={t(panel.note)} />
          </span>
        )}
        {projected && proj && (
          <EvidenceBadge level="projection" locale={locale} size="sm" />
        )}
      </p>
    </figure>
  );
}

function PointLabel({ x, y, point, locale }: { x: number; y: number; point: Point; locale: Locale }) {
  const t = (v: L10n) => tr(v, locale);
  const below = point.place === "below-left";
  const extra = point.detail ? 18 : 0;
  const [dx, dy] = point.offset ?? (below ? [-26, 28] : [10, -34 - extra]);
  const lx = x + dx;
  const ly = y + dy;
  const anchor = below ? "end" : "start";
  return (
    <g>
      <text x={lx} y={ly} textAnchor={anchor} className={styles.val}>
        <RichTspans text={t(point.label!)} />
      </text>
      <text x={lx} y={ly + 20} textAnchor={anchor} className={styles.model}>
        {point.model}
      </text>
      {/* How the value was obtained, when it says (e.g. "110 MW for 90 days"). */}
      {point.detail && (
        <text x={lx} y={ly + 20 + extra} textAnchor={anchor} className={styles.model}>
          <RichTspans text={t(point.detail)} />
        </text>
      )}
    </g>
  );
}

/* ---------- Bottom row: the benchmark chart ---------- */

const BW = 1776;
const BH = 420;
const BP = { l: 74, r: 400, t: 46, b: 40 };
const bx = (year: number) => BP.l + ((year - BENCH_X.from) / (BENCH_X.to - BENCH_X.from)) * (BW - BP.l - BP.r);
const by = (v: number) => BH - BP.b - (v / 100) * (BH - BP.t - BP.b);
const LABEL_GAP = 62;

/** End labels in the right column, top to bottom, kept LABEL_GAP apart. */
export function placeEndLabels(desired: number[], top: number, bottom: number, gap = LABEL_GAP): number[] {
  const order = desired.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const out = new Array<number>(desired.length);
  let prev = -Infinity;
  for (const o of order) {
    const y = Math.max(o.y, prev + gap, top);
    out[o.i] = y;
    prev = y;
  }
  const overflow = prev - bottom;
  if (overflow > 0) for (let i = 0; i < out.length; i++) out[i] = out[i]! - overflow;
  return out;
}

function BenchChart({ step, locale }: { step: number; locale: Locale }) {
  const t = (x: L10n) => tr(x, locale);
  const base = BH - BP.b;
  const right = BW - BP.r;
  const visible = SERIES.filter((s) => step >= s.step);
  const newest = visible.length ? Math.max(...visible.map((s) => s.step)) : -1;
  const fading = step < STEP_PROJECTION;
  const endY = visible.map((s) => by(s.points[s.points.length - 1]!.value));
  const labelY = placeEndLabels(endY, BP.t + 4, base - 30);
  const imoX = bx(yearOf(IMO_GOLD.date));
  const showImo = step >= IMO_GOLD.step;
  const showExperts = step >= STEP_GPQA;
  return (
    <svg viewBox={`0 0 ${BW} ${BH}`} className={styles.svg} aria-hidden="true">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={BP.l} x2={right} y1={by(v)} y2={by(v)} className={v === 0 ? styles.axis : styles.grid} />
          <text x={BP.l - 12} y={by(v) + 7} textAnchor="end" className={styles.tick}>
            {pct(v)}
          </text>
        </g>
      ))}
      {BENCH_X.ticks.map((x) => (
        <text key={x} x={bx(x)} y={base + 32} textAnchor="middle" className={styles.tick}>
          {x}
        </text>
      ))}

      {showExperts && (
        <g className={styles.reveal}>
          <line x1={BP.l} x2={right} y1={by(GPQA_EXPERTS.value)} y2={by(GPQA_EXPERTS.value)} className={styles.expert} />
          <text x={BP.l + 10} y={by(GPQA_EXPERTS.value) - 10} className={styles.expertLabel}>
            <RichTspans text={t(GPQA_EXPERTS.label)} />
          </text>
        </g>
      )}

      {showImo && (
        <g className={styles.reveal}>
          <line x1={imoX} x2={imoX} y1={BP.t - 4} y2={base} className={styles.imoLine} />
          <circle cx={imoX} cy={BP.t - 22} r={13} className={styles.medal} />
          <text x={imoX - 22} y={BP.t - 24} textAnchor="end" className={styles.imoTitle}>
            <RichTspans text={t(IMO_GOLD.title)} />
          </text>
          <text x={imoX - 22} y={BP.t - 2} textAnchor="end" className={styles.imoSub}>
            <RichTspans text={t(IMO_GOLD.sub)} />
          </text>
        </g>
      )}

      {visible.map((s, i) => (
        <SeriesView
          key={s.id}
          series={s}
          locale={locale}
          dim={fading && s.step < newest}
          labelY={labelY[i]!}
          labelX={right + 26}
        />
      ))}
    </svg>
  );
}

function SeriesView({
  series,
  locale,
  dim,
  labelX,
  labelY,
}: {
  series: Series;
  locale: Locale;
  dim: boolean;
  labelX: number;
  labelY: number;
}) {
  const t = (x: L10n) => tr(x, locale);
  const pts = series.points.map((p) => ({ x: bx(yearOf(p.date)), y: by(p.value), v: p.value }));
  const path = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const first = pts[0]!;
  const end = pts[pts.length - 1]!;
  const style = { "--series": series.color } as React.CSSProperties;
  return (
    <g className={cx(styles.series, dim && styles.dim)} style={style}>
      <g className={styles.reveal}>
      <path d={path} className={styles.sLine} />
      {pts.map((q, i) => (
        <circle key={i} cx={q.x} cy={q.y} r={i === 0 || q === end ? 7 : 4.5} className={styles.sDot} />
      ))}
      <text x={first.x - 10} y={first.y - 14} textAnchor="end" className={styles.sStart}>
        {pct(first.v)}
      </text>
      <path d={`M${end.x + 10},${end.y} L${labelX - 8},${labelY - 8}`} className={styles.leader} />
      <text x={labelX} y={labelY} className={styles.sName}>
        <tspan className={styles.sValue}>{pct(end.v)}</tspan>
        <tspan dx={12}>{series.name}</tspan>
      </text>
      <text x={labelX} y={labelY + 24} className={styles.sWhat}>
        <RichTspans text={t(series.what)} />
      </text>
      </g>
    </g>
  );
}
