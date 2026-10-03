import { tr } from "@ai-exhibit/presentation-core";
import { Rich, RichTspans } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { cx, l, type L10n, type Locale } from "../../learning/shared/ui.tsx";
import { shortSourceLabel } from "../../primitives/sourceLabel.ts";
import { EvidenceBadge } from "../../primitives/EvidenceBadge.tsx";
import {
  type Chart,
  type ChartPoint,
  PROJECTION_X,
  X_FROM,
  X_TICKS,
  X_TO,
  ALL_SOURCE_IDS,
  COLUMNS,
  COLUMN_TITLES,
  LAST_STEP,
  PROJECTION,
  PROJECTION_SOURCE_IDS,
  ROWS,
  CHARTS,
  STEP_CHARTS,
  STEP_PROJECTION,
} from "./comparison.ts";
import styles from "./ModelComparison.module.css";

export type ModelComparisonProps = Record<string, never>;

const TEXT = {
  heading: { en: "Then and now, in numbers" },
  model: { en: "Model" },
  basis: l(
    "Calcul de la projection (écran du présentateur seulement)",
    "How the projection is computed (presenter screen only)",
  ),
  projection: { en: "projection" },
  missingMark: { en: "not published or not tested" },
  footnote: l(
    "Estimations : Epoch AI et Patterson et al. Pages : 1 token ≈ 0,75 mot, 500 mots par page. Grok 3 : le frontier model (*modèle de pointe*) récent pour lequel le plus de chiffres sont publiés ou estimés.",
    "Estimates: Epoch AI and Patterson et al. Pages: 1 token ≈ 0.75 words, 500 words a page. Grok 3: the recent frontier model with the most published or estimated figures.",
  ),
};

export function ModelComparison({
  ctx,
}: SceneComponentProps<ModelComparisonProps>) {
  const { locale, role, reducedMotion } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const step = Math.max(0, Math.min(LAST_STEP, Math.floor(ctx.revealStep)));
  const animate = role !== "preview" && !reducedMotion;
  const projected = step >= STEP_PROJECTION;
  const charts = step >= STEP_CHARTS;
  const ids = projected
    ? [...new Set([...ALL_SOURCE_IDS, ...PROJECTION_SOURCE_IDS])]
    : ALL_SOURCE_IDS;
  const sources = ids
    .map((id) => ctx.getSource(id))
    .filter((s) => s !== undefined)
    .map((s) => shortSourceLabel(s))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join("   ");

  return (
    <div className={cx(styles.root, animate && styles.animate, charts && styles.compact)}>
      <h2 className={styles.h}><Rich text={t(TEXT.heading)} /></h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.modelHead} scope="col">
              <Rich text={t(TEXT.model)} />
            </th>
            {COLUMNS.map((c) => (
              <th key={c} scope="col" className={styles.colHead}>
                <span className={styles.colTitle}>
                  <Rich text={t(COLUMN_TITLES[c].title)} />
                </span>
                <span className={styles.colSub}><Rich text={t(COLUMN_TITLES[c].sub)} /></span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={row.id}
              className={cx(
                styles.row,
                i > step && styles.hidden,
                i === step && styles.current,
              )}
            >
              <th scope="row" className={styles.modelCell}>
                <span className={styles.model}>{row.model}</span>
                <span className={styles.year}>{row.year}</span>
              </th>
              {COLUMNS.map((c) => {
                const cell = row.cells[c];
                return (
                  <td
                    key={c}
                    className={cx(
                      styles.cell,
                      cell.kind === "missing" && styles.missing,
                      cell.kind === "reference" && styles.reference,
                    )}
                  >
                    <span className={styles.main}><Rich text={t(cell.main)} /></span>
                    {cell.small && (
                      <span className={styles.small}><Rich text={t(cell.small)} /></span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className={cx(styles.projRow, !projected && styles.hidden)}>
            <th scope="row" className={styles.modelCell}>
              <span className={styles.projLabel}><Rich text={t(PROJECTION.label)} /></span>
              <EvidenceBadge level="projection" locale={locale} size="sm" />
            </th>
            {COLUMNS.map((c) => {
              const cell = PROJECTION.cells[c];
              return (
                <td key={c} className={cx(styles.cell, styles.projCell)}>
                  <span className={styles.projMain}><Rich text={t(cell.main)} /></span>
                  {cell.small && (
                    <span className={styles.small}><Rich text={t(cell.small)} /></span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {charts && (
        <div className={styles.charts}>
          {CHARTS.map((ch) => (
            <ChartView key={ch.id} chart={ch} locale={locale} />
          ))}
        </div>
      )}

      {role === "controller" && projected && !charts && (
        <aside className={cx(styles.basis, styles.foot)}>
          <span className={styles.basisTitle}><Rich text={t(TEXT.basis)} /></span>
          <ul>
            {COLUMNS.map((c) => (
              <li key={c}>
                <b><Rich text={t(COLUMN_TITLES[c].title)} /></b>{" "}
                <Rich text={t(PROJECTION.cells[c].basis)} />
              </li>
            ))}
          </ul>
        </aside>
      )}

      {!(role === "controller" && projected && !charts) && (
        <footer className={styles.foot}>
          <p><Rich text={t(TEXT.footnote)} /></p>
          <p className={styles.sources}>{sources}</p>
        </footer>
      )}
    </div>
  );
}

/* ---------- Small linear charts ---------- */

const CW = 560;
const CH = 400;
const PAD = { l: 120, r: 34, t: 34, b: 48 };
const cxOf = (x: number) => PAD.l + ((x - X_FROM) / (X_TO - X_FROM)) * (CW - PAD.l - PAD.r);
const cyOf = (y: number, max: number) => CH - PAD.b - (y / max) * (CH - PAD.t - PAD.b);

function ChartView({ chart, locale }: { chart: Chart; locale: Locale }) {
  const t = (x: L10n) => tr(x, locale);
  const measured = chart.points.filter((p) => p.y !== null && !p.projection && !p.reference);
  const proj = chart.points.find((p) => p.projection && p.y !== null);
  const pathOf = (pts: ChartPoint[]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${cxOf(p.x).toFixed(1)},${cyOf(p.y!, chart.max).toFixed(1)}`).join(" ");
  const lastMeasured = measured[measured.length - 1];
  const topTickY = cyOf(chart.id === "science" ? 100 : chart.id === "cost" ? 1e9 : 1000, chart.max);
  const base = CH - PAD.b;
  return (
    <figure className={styles.chartFig}>
      <figcaption className={styles.chartTitle}><Rich text={t(chart.title)} /></figcaption>
      <svg viewBox={`0 0 ${CW} ${CH}`} className={styles.chart} aria-hidden="true">
        {/* axes and the two ticks: zero and one round value in words */}
        <line x1={PAD.l} x2={CW - PAD.r} y1={base} y2={base} className={styles.axis} />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t - 10} y2={base} className={styles.axis} />
        <line x1={PAD.l - 6} x2={CW - PAD.r} y1={topTickY} y2={topTickY} className={styles.grid} />
        <text x={PAD.l - 12} y={topTickY + 7} textAnchor="end" className={styles.yTick}>
          <RichTspans text={t(chart.topTick)} />
        </text>
        <text x={PAD.l - 12} y={base + 7} textAnchor="end" className={styles.yTick}>
          0
        </text>
        {X_TICKS.map((x) => (
          <text key={x} x={cxOf(x)} y={base + 36} textAnchor="middle" className={styles.xTick}>
            {x}
          </text>
        ))}

        {chart.expert && (
          <g>
            <line x1={PAD.l} x2={CW - PAD.r} y1={cyOf(chart.expert.y, chart.max)} y2={cyOf(chart.expert.y, chart.max)} className={styles.expert} />
            <text x={PAD.l + 8} y={cyOf(chart.expert.y, chart.max) - 8} className={styles.expertLabel}>
              <RichTspans text={t(chart.expert.label)} />
            </text>
          </g>
        )}

        {chart.ceilingBand && (
          <g>
            <rect
              x={cxOf(PROJECTION_X) - 34}
              y={cyOf(100, chart.max)}
              width={68}
              height={cyOf(90, chart.max) - cyOf(100, chart.max)}
              className={styles.band}
            />
            <text
              x={cxOf(PROJECTION_X) - 44}
              y={(cyOf(100, chart.max) + cyOf(90, chart.max)) / 2 + 8}
              textAnchor="end"
              className={styles.projLabelSvg}
            >
              <RichTspans text={t(chart.ceilingBand)} />
            </text>
          </g>
        )}

        {measured.length > 1 && <path d={pathOf(measured)} className={styles.cLine} />}
        {proj && lastMeasured && <path d={pathOf([lastMeasured, proj])} className={styles.cProjLine} />}

        {chart.points.map((p) => {
          const x = cxOf(p.x);
          if (p.y === null) {
            return (
              <g key={p.model}>
                <text x={x} y={base - 12} textAnchor="middle" className={styles.missingMark}>
                  ×
                </text>
              </g>
            );
          }
          const y = cyOf(p.y, chart.max);
          const anchor = p.projection ? "end" : (p.align ?? "middle");
          const lx = p.projection || p.align === "end" ? x - 14 : p.align === "start" ? x + 12 : x;
          const dot = p.projection ? styles.cProjDot : p.reference ? styles.cRefDot : styles.cDot;
          const val = p.projection ? styles.cProjVal : p.reference ? styles.cRefVal : styles.cVal;
          return (
            <g key={p.model || "projection"}>
              <circle cx={x} cy={y} r={p.projection ? 9 : 8} className={dot} />
              <text x={lx} y={y - 16 - (p.lift ?? 0)} textAnchor={anchor} className={val}>
                <RichTspans text={t(p.label)} />
              </text>
            </g>
          );
        })}
      </svg>
      <p className={styles.chartNote}>
        {chart.points.some((p) => p.y === null) && <span>× <Rich text={t(TEXT.missingMark)} />   </span>}
        <span className={styles.projKey}>
          <svg viewBox="0 0 44 16" width="44" height="16" aria-hidden="true">
            <line x1="2" x2="30" y1="8" y2="8" className={styles.cProjLine} />
            <circle cx="36" cy="8" r="5" className={styles.cProjDot} />
          </svg>
          <Rich text={t(TEXT.projection)} />
        </span>
      </p>
    </figure>
  );
}
