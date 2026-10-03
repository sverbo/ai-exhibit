import { cx } from "../../learning/shared/ui.tsx";
import type { Sport } from "../data/text.ts";
import type { TreeNode, TreeStep } from "../data/tree.ts";
import styles from "../TextClassifierLab.module.css";
import { SportGlyphPaths } from "./glyphs.tsx";

interface Placed {
  node: TreeNode;
  x: number;
  y: number;
  /** Path of yes/no answers from the root, e.g. "yn". */
  key: string;
  parent?: { x: number; y: number; answer: boolean };
}

function place(tree: TreeNode, width: number, levelH: number): Placed[] {
  const leaves: string[] = [];
  const collect = (n: TreeNode, key: string) => {
    if (n.kind === "leaf") leaves.push(key);
    else {
      collect(n.yes, key + "y");
      collect(n.no, key + "n");
    }
  };
  collect(tree, "");
  const slot = width / leaves.length;
  const out: Placed[] = [];
  const walk = (n: TreeNode, key: string, depth: number): number => {
    const x = n.kind === "leaf" ? slot * (leaves.indexOf(key) + 0.5) : (walk(n.yes, key + "y", depth + 1) + walk(n.no, key + "n", depth + 1)) / 2;
    out.push({ node: n, x, y: depth * levelH, key });
    return x;
  };
  walk(tree, "", 0);
  const byKey = new Map(out.map((p) => [p.key, p]));
  for (const p of out) {
    if (p.key.length === 0) continue;
    const parent = byKey.get(p.key.slice(0, -1))!;
    p.parent = { x: parent.x, y: parent.y, answer: p.key.endsWith("y") };
  }
  return out;
}

/** The sport a "yes" to this question points to (majority of the examples that answered yes). */
export function yesTone(node: Extract<TreeNode, { kind: "split" }>): Sport {
  return node.yes.basketball >= node.yes.football ? "basketball" : "football";
}

export interface TreeText {
  /** The question, split around the word: [before, after]. */
  question: [string, string];
  yes: string;
  no: string;
  label: (s: Sport) => string;
  /** How a word is shown (the most common spelling in the examples). */
  word: (folded: string) => string;
}

const SPLIT_W = 460;
const SPLIT_H = 112;
const LEAF_W = 330;
const LEAF_H = 92;

/** The learned tree. With `path`, the questions asked for one sentence light up and the rest fades. */
export function TreeDiagram({
  tree,
  width,
  levelH = 210,
  text,
  path,
  verdictWrong,
}: {
  tree: TreeNode;
  width: number;
  levelH?: number;
  text: TreeText;
  path?: TreeStep[];
  /** Paint the reached leaf as a wrong answer. */
  verdictWrong?: boolean;
}) {
  const placed = place(tree, width, levelH);
  const depth = Math.max(...placed.map((p) => p.key.length));
  const height = depth * levelH + Math.max(SPLIT_H, LEAF_H);
  const pathKey = path ? path.map((s) => (s.answer ? "y" : "n")).join("") : null;
  const onPath = (key: string) => pathKey !== null && pathKey.startsWith(key);

  return (
    <svg className={styles.tree} viewBox={`0 -6 ${width} ${height + 12}`} width={width} height={height + 12} role="img">
      {placed.map((p) =>
        p.parent ? (
          <g key={`e-${p.key}`} className={cx(styles.edge, onPath(p.key) && styles.edgeOn, pathKey !== null && !onPath(p.key) && styles.faded)}>
            <path d={`M${p.parent.x} ${p.parent.y + SPLIT_H} C ${p.parent.x} ${p.parent.y + SPLIT_H + 56}, ${p.x} ${p.y - 56}, ${p.x} ${p.y}`} />
            <text x={(p.parent.x + p.x) / 2} y={(p.parent.y + SPLIT_H + p.y) / 2 + 10} className={styles.edgeLabel}>
              {p.parent.answer ? text.yes : text.no}
            </text>
          </g>
        ) : null,
      )}
      {placed.map((p) => {
        const n = p.node;
        const faded = pathKey !== null && !onPath(p.key);
        if (n.kind === "leaf") {
          const reached = pathKey !== null && pathKey === p.key;
          return (
            <g
              key={`n-${p.key}`}
              className={cx(
                styles.leaf,
                n.label === "football" ? styles.toneFootball : styles.toneBasketball,
                faded && styles.faded,
                reached && styles.leafOn,
                reached && verdictWrong && styles.leafWrong,
              )}
              transform={`translate(${p.x - LEAF_W / 2} ${p.y})`}
            >
              <rect width={LEAF_W} height={LEAF_H} rx={LEAF_H / 2} />
              <g transform={`translate(26 ${LEAF_H / 2 - 22})`} className={styles.leafGlyph}>
                <g transform="scale(1.1)">
                  <SportGlyphPaths sport={n.label} />
                </g>
              </g>
              <text x={92} y={LEAF_H / 2 + 13} className={styles.leafText}>
                {text.label(n.label)}
              </text>
            </g>
          );
        }
        const answeredYes = path?.find((s) => s.node === n)?.answer === true;
        const tone = yesTone(n);
        return (
          <g
            key={`n-${p.key}`}
            className={cx(styles.split, faded && styles.faded, onPath(p.key) && pathKey !== null && styles.splitOn)}
            transform={`translate(${p.x - SPLIT_W / 2} ${p.y})`}
          >
            <rect width={SPLIT_W} height={SPLIT_H} rx={20} className={styles.splitBox} />
            <foreignObject x={0} y={0} width={SPLIT_W} height={SPLIT_H}>
              <div className={styles.splitInner}>
                {text.question[0]}
                <span
                  className={cx(
                    styles.word,
                    styles.marked,
                    tone === "football" ? styles.toneFootball : styles.toneBasketball,
                    answeredYes && styles.markedStrong,
                  )}
                >
                  {text.word(n.word)}
                </span>
                {text.question[1]}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

