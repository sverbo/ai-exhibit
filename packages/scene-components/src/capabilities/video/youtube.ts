import type { SceneRole } from "../../contract.ts";

/**
 * YouTube embedding for YouTubeScene: player options, the IFrame Player API
 * loader, and who plays what. Pure except the loader.
 *
 * What YouTube lets an embed choose (IFrame Player API, documented parameters):
 * - captions on: `cc_load_policy=1`; preferred caption language: `cc_lang_pref`;
 *   player interface language: `hl`. Whether captions exist in that language
 *   (uploaded, automatic, or auto-translated) is YouTube's decision.
 * - The audio track cannot be chosen. There is no documented player parameter
 *   or API method for it (getAvailableAudioTracks / setAudioTrack exist only
 *   inside YouTube's own player, not in the public API). A video with
 *   auto-dubbed tracks may play a dubbed voice, chosen by YouTube from the
 *   viewer's language settings; test on the projector machine before the talk.
 */

export const YOUTUBE_API_URL = "https://www.youtube.com/iframe_api";
/** Privacy-enhanced mode: the player itself is served from this host. */
export const YOUTUBE_PLAYER_HOST = "https://www.youtube-nocookie.com";
/** Hosts an embedded YouTube player may call (scene `online.hosts`). */
export const YOUTUBE_HOSTS = [
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "youtube.com",
  "i.ytimg.com",
  "s.ytimg.com",
  "googlevideo.com",
  "yt3.ggpht.com",
  "www.google.com",
  "static.doubleclick.net",
  "jnn-pa.googleapis.com",
];

/** How long to wait for the API and the player before showing the offline card. */
export const LOAD_TIMEOUT_MS = 10_000;
/** After the script loaded, how long the player may take before the card shows (a late player still takes over). */
export const PLAYER_TIMEOUT_MS = 20_000;

export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

/** Player parameters: no YouTube controls (the presenter drives), captions in the slide's language. */
export function playerVars(locale: string, origin?: string): Record<string, string | number> {
  return {
    autoplay: 0,
    controls: 0,
    disablekb: 1,
    fs: 0,
    playsinline: 1,
    rel: 0,
    iv_load_policy: 3,
    cc_load_policy: 1,
    cc_lang_pref: locale,
    hl: locale,
    ...(origin ? { origin } : {}),
  };
}

/**
 * Which window holds a real player: the audience screen only. Every other
 * stage (the presenter view, its projector mirror, previews) shows a still card,
 * so sound can come from one window at most and the presenter's machine never
 * loads YouTube when a projector window is open.
 */
export function hasPlayer(role: SceneRole, audienceScreen: boolean | undefined): boolean {
  return role !== "preview" && Boolean(audienceScreen);
}

/** While playing, a streamed player drifts more than a local file: tolerate 2 s before seeking. */
export function needsYouTubeSeek(current: number, expected: number, playing: boolean): boolean {
  return Math.abs(current - expected) > (playing ? 2 : 0.5);
}

/* ---------- The IFrame Player API, minimal types ---------- */

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

export interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      host?: string;
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loading: Promise<YTNamespace> | null = null;

/** Loads the IFrame Player API once; rejects offline or after LOAD_TIMEOUT_MS (and lets a later call retry). */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YTNamespace>((resolve, reject) => {
    const timer = setTimeout(() => fail(new Error("YouTube API timeout")), LOAD_TIMEOUT_MS);
    const previous = window.onYouTubeIframeAPIReady;
    const fail = (err: Error) => {
      clearTimeout(timer);
      loading = null;
      reject(err);
    };
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else fail(new Error("YouTube API incomplete"));
    };
    const script = document.createElement("script");
    script.src = YOUTUBE_API_URL;
    script.async = true;
    script.onerror = () => {
      script.remove();
      fail(new Error("YouTube API unreachable"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
