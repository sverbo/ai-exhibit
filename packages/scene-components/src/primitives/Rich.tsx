import { Fragment } from "react";
import { termRuns } from "@ai-exhibit/presentation-core";

/**
 * Renders text with the term markup: `deep learning (*apprentissage profond*)`
 * shows the translation in italics. Every component that shows content text
 * renders it through here (or through Markdown for speaker notes), so the
 * markup never reaches the screen.
 */
export function Rich({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  if (!text.includes("(*")) return <>{text}</>;
  return (
    <>
      {termRuns(text).map((run, i) => (run.italic ? <em key={i}>{run.text}</em> : <Fragment key={i}>{run.text}</Fragment>))}
    </>
  );
}

/** For SVG text: the same runs, with tspans. */
export function RichTspans({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  if (!text.includes("(*")) return <>{text}</>;
  return (
    <>
      {termRuns(text).map((run, i) =>
        run.italic ? (
          <tspan key={i} fontStyle="italic">
            {run.text}
          </tspan>
        ) : (
          <Fragment key={i}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}
