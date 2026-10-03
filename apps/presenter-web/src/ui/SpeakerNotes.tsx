import { useMemo } from "react";
import { marked } from "marked";
import { Markdown } from "./Markdown.tsx";
import { parseNotes, plainInline, type NoteBullet } from "./notes.ts";
import styles from "./SpeakerNotes.module.css";

/**
 * Speaker notes as a numbered run of talking points. "Ask" and "Do" bullets
 * carry their cue word in the gutter and a tinted band, so they stand out at
 * arm's length. Three densities: the presenter desk, the phone remote, and
 * the compact /present HUD.
 */
export function SpeakerNotes({
  markdown,
  variant,
  className,
}: {
  markdown: string;
  variant: "desk" | "phone" | "hud";
  className?: string;
}) {
  const parsed = useMemo(() => parseNotes(markdown), [markdown]);
  let n = 0;
  return (
    <div className={`${styles.notes} ${styles[variant]} ${className ?? ""}`}>
      {parsed.bullets.length ? (
        <ol className={styles.list}>
          {parsed.bullets.map((b, i) => {
            if (b.kind === "point") n += 1;
            return <Bullet key={i} bullet={b} number={n} plain={variant === "hud"} />;
          })}
        </ol>
      ) : null}
      {parsed.prose && variant !== "hud" ? <Markdown className={styles.prose} text={parsed.prose} /> : null}
      {parsed.prose && variant === "hud" && !parsed.bullets.length ? <p className={styles.prose}>{plainInline(parsed.prose)}</p> : null}
    </div>
  );
}

function Bullet({ bullet, number, plain }: { bullet: NoteBullet; number: number; plain: boolean }) {
  return (
    <li className={`${styles.item} ${styles[bullet.kind]}`} data-note-kind={bullet.kind}>
      <span className={styles.gutter} aria-hidden={bullet.kind === "point" ? true : undefined}>
        {bullet.kind === "point" ? number : bullet.cue}
      </span>
      <div className={styles.body}>
        {plain ? <span>{plainInline(bullet.text)}</span> : <Inline text={bullet.text} />}
        {bullet.sub.length && !plain ? (
          <ul className={styles.sub}>
            {bullet.sub.map((s, i) => (
              <li key={i}>
                <Inline text={s} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

/** Notes come from the repository's own content, never from users. */
function Inline({ text }: { text: string }) {
  const html = useMemo(() => marked.parseInline(text, { async: false, gfm: true }) as string, [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
