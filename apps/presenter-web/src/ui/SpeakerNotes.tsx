import { useMemo } from "react";
import { marked } from "marked";
import { useUi } from "../i18n.ts";
import { Markdown } from "./Markdown.tsx";
import { parseNotes, plainInline, withPersonalNote, type NoteBullet } from "./notes.ts";
import styles from "./SpeakerNotes.module.css";

/**
 * Speaker notes as a numbered run of talking points. "Ask" and "Do" bullets
 * carry their cue word in the gutter and a tinted band, so they stand out at
 * arm's length; the presenter's own note (personal config) comes first, with
 * a dashed edge. Three densities: the presenter desk, the phone remote, and
 * the compact /present HUD.
 */
export function SpeakerNotes({
  markdown,
  variant,
  personal,
  className,
}: {
  markdown: string;
  variant: "desk" | "phone" | "hud";
  /** The presenter's personal note for this scene, plain text. */
  personal?: string;
  className?: string;
}) {
  const { t } = useUi();
  const parsed = useMemo(() => withPersonalNote(parseNotes(markdown), personal), [markdown, personal]);
  const hasContentBullets = parsed.bullets.some((b) => b.kind !== "personal");
  let n = 0;
  return (
    <div className={`${styles.notes} ${styles[variant]} ${className ?? ""}`}>
      {parsed.bullets.length ? (
        <ol className={styles.list}>
          {parsed.bullets.map((b, i) => {
            if (b.kind === "point") n += 1;
            return <Bullet key={i} bullet={b} number={n} plain={variant === "hud"} mine={t("personalNoteCue")} />;
          })}
        </ol>
      ) : null}
      {parsed.prose && variant !== "hud" ? <Markdown className={styles.prose} text={parsed.prose} /> : null}
      {parsed.prose && variant === "hud" && !hasContentBullets ? <p className={styles.prose}>{plainInline(parsed.prose)}</p> : null}
    </div>
  );
}

function Bullet({ bullet, number, plain, mine }: { bullet: NoteBullet; number: number; plain: boolean; mine: string }) {
  if (bullet.kind === "personal") {
    // Plain text only: a personal note may come from an imported file.
    return (
      <li className={`${styles.item} ${styles.personal}`} data-note-kind="personal">
        <span className={styles.gutter}>{mine}</span>
        <div className={`${styles.body} ${styles.personalText}`}>{bullet.text}</div>
      </li>
    );
  }
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
