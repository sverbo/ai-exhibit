import { useMemo } from "react";
import { marked } from "marked";

/** Renders speaker notes. Notes come from the repository's own content, never from users. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => marked.parse(text, { async: false, gfm: true, breaks: false }) as string, [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
