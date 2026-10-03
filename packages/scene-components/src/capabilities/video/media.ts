/**
 * Local media files for VideoScene, found at build time.
 *
 * Vite resolves the glob when it compiles this module: every matching file in
 * `content/assets/media/` (top level only) gets a URL, served from the package
 * source in dev and copied into `dist/assets/` by `pnpm build`. A file that is
 * not there simply has no URL, and the scene shows its placeholder instead.
 * Nothing is fetched from the internet. In dev, Vite watches the folder, so a
 * video dropped in while the server runs appears after a reload.
 */
const FILES = import.meta.glob("../../../../../content/assets/media/*.{mp4,webm,m4v,mov,jpg,jpeg,png,webp,vtt}", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const PREFIX = "content/assets/media/";

/** Normalizes a scene's `src` ("personal-demo.mp4" or "media/personal-demo.mp4") to a file name. */
export function mediaName(src: string): string {
  return src
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.?\/+/, "")
    .replace(/^(content\/)?(assets\/)?media\//, "");
}

/** Repository path where the presenter must put the file, for the placeholder. */
export function expectedPath(src: string): string {
  return PREFIX + mediaName(src);
}

/** Builds a lookup over a glob result (exported for tests). */
export function makeLookup(files: Record<string, string>): (name: string) => string | undefined {
  const byName = new Map<string, string>();
  for (const [path, url] of Object.entries(files)) {
    const name = path.slice(path.lastIndexOf("/") + 1);
    byName.set(name, url);
  }
  return (name) => byName.get(mediaName(name));
}

/** URL of a media file, or undefined when it is not in the folder. */
export const mediaUrl = makeLookup(FILES);

/** Caption track next to a video: same base name with `.vtt` (e.g. personal-demo.vtt). */
export function captionsName(src: string): string {
  return mediaName(src).replace(/\.[^.]+$/, "") + ".vtt";
}
