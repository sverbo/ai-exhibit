/**
 * Hosted versions of the talk listed on the home page ("Exhibits"). People who
 * fork and host their own version send the author a link and a description;
 * add it here. Links are absolute: the list must work from any copy.
 */
export interface Exhibit {
  url: string;
  /** Who runs it, or what makes this version different. */
  title: string;
  description: string;
  /** Languages the audience can get it in, in English. */
  languages: string[];
}

export const exhibits: Exhibit[] = [
  {
    url: "https://ai-exhibit.samverbo.com",
    title: "The original, by Samuel Verboomen",
    description: "Full talk for a non-technical audience with a general knowledge of new technologies; about two hours.",
    languages: ["English", "French"],
  },
];
