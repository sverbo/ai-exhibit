/**
 * Who made this talk: the one place the first slide (00-holding) and the
 * credits slide (05-credits) read their bylines from.
 *
 * Forks: you are welcome to present this talk under your own name. Set `fork`
 * to your name (and a link, if you want one): the slides then show your
 * byline first. The author asks that you keep the line "Original presentation
 * by Samuel Verboomen" with its link to ai-exhibit.samverbo.com, which both
 * slides show on their own whenever `fork` is set. The content license
 * (CC BY 4.0, LICENSE-CONTENT.md) asks for attribution anyway.
 */
export interface Person {
  /** Shown as written, in every language. */
  name: string;
  /** Optional link, opened in a new tab from the live screens. */
  url?: string;
}

export interface TalkCredits {
  /** The original author of the talk. Keep it as is in a fork. */
  original: Person & { url: string };
  /** A fork's own presenter or author; null in the original talk. */
  fork: Person | null;
}

export const credits: TalkCredits = {
  original: { name: "Samuel Verboomen", url: "https://ai-exhibit.samverbo.com" },
  fork: null,
};
