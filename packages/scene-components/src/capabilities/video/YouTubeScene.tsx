import { tr } from "@ai-exhibit/presentation-core";
import { useEffect, useRef, useState } from "react";
import { Rich } from "../../primitives/Rich.tsx";
import type { SceneComponentProps } from "../../contract.ts";
import { useSceneState } from "../../learning/shared/sceneState.ts";
import { canInteract, useSceneActions } from "../../primitives/interaction.ts";
import { ControlBar, SceneButton, cx, type L10n } from "../../learning/shared/ui.tsx";
import { CapIcon } from "../shared/icons.tsx";
import {
  HEARTBEAT_MS,
  expectedPosition,
  formatTime,
  initialVideoState,
  seekTo,
  setPlaying,
  type VideoState,
} from "./sync.ts";
import {
  PLAYER_TIMEOUT_MS,
  YOUTUBE_PLAYER_HOST,
  hasPlayer,
  loadYouTubeApi,
  needsYouTubeSeek,
  playerVars,
  watchUrl,
  type YTPlayer,
} from "./youtube.ts";
import styles from "./YouTubeScene.module.css";

export interface YouTubeSceneProps {
  /** The 11-character YouTube id, e.g. "uX-Cq-rvlv8". */
  videoId: string;
  /** Video length in seconds: ends playback on the presenter's clock when no player reports it. */
  durationSec: number;
  kicker?: L10n;
  heading?: L10n;
  /** Title, channel and length, under the player. */
  caption?: L10n;
}

const TEXT = {
  play: { en: "Play" },
  pause: { en: "Pause" },
  restart: { en: "Back to start" },
  seek: { en: "Position" },
  onProjector: { en: "Plays with sound on the projector only" },
  offline: { en: "This video needs the internet, which is not available here." },
  offlineHint: { en: "Watch it later at this address:" },
  blocked: { en: "The browser blocks sound: click once in this window." },
};

/** What any interactive window can ask; the stage owner applies it (interaction from any window). */
type VideoAction = { type: "toggle"; at: number } | { type: "restart" } | { type: "seek"; to: number };

const PLAYING = 1;
const BUFFERING = 3;
const ENDED = 0;
/** Still not playing this long after Play (and not loading): assume the browser blocked sound, play muted and ask for a click. */
const BLOCKED_AFTER_MS = 6000;
type Status = "loading" | "ready" | "offline";

export function YouTubeScene({ props, ctx }: SceneComponentProps<YouTubeSceneProps, VideoState>) {
  const { locale, role } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const isController = role === "controller";
  const withPlayer = hasPlayer(role, ctx.audienceScreen);
  const duration = props.durationSec > 0 ? props.durationSec : undefined;

  const [state, setState] = useSceneState<VideoState>(ctx, initialVideoState, { throttleMs: 150 });
  const stateRef = useRef(state);
  stateRef.current = state;
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [blocked, setBlocked] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // The player: only on the audience screen. Offline or blocked, the card below takes over.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!withPlayer || !wrap) return;
    let cancelled = false;
    let player: YTPlayer | null = null;
    setStatus("loading");
    const host = document.createElement("div");
    wrap.appendChild(host);
    let giveUp: ReturnType<typeof setTimeout> | undefined;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        // The script came, the player is slow: show the card meanwhile; a late onReady still takes over.
        giveUp = setTimeout(() => {
          if (!cancelled && !playerRef.current) setStatus("offline");
        }, PLAYER_TIMEOUT_MS);
        player = new YT.Player(host, {
          host: YOUTUBE_PLAYER_HOST,
          videoId: props.videoId,
          width: "100%",
          height: "100%",
          playerVars: playerVars(locale, window.location.origin),
          events: {
            onReady: (e) => {
              if (cancelled) return;
              e.target.unMute();
              playerRef.current = e.target;
              setStatus("ready");
            },
            onStateChange: (e) => {
              if (e.data !== ENDED || !isController) return;
              const end = e.target.getDuration() || duration || stateRef.current.position;
              setState((s) => setPlaying(s, false, end, Date.now()));
            },
            onError: () => {
              if (!cancelled) setStatus("offline");
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      try {
        player?.destroy();
      } catch {
        // already gone
      }
      playerRef.current = null;
      wrap.replaceChildren();
    };
    // Rebuilt only when the video, the language or the screen's role changes.
  }, [withPlayer, props.videoId, locale]);

  // Follow the shared state: the controller's buttons only publish state, and every player applies it.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || status !== "ready") return;
    const apply = () => {
      const target = expectedPosition(state, Date.now(), duration);
      const atEnd = duration !== undefined && target >= duration - 0.5;
      if (needsYouTubeSeek(p.getCurrentTime(), target, state.playing)) p.seekTo(target, true);
      const ps = p.getPlayerState();
      const running = ps === PLAYING || ps === BUFFERING;
      if (state.playing && !running && !atEnd) p.playVideo();
      if (!state.playing && running) p.pauseVideo();
    };
    apply();
    if (!state.playing) return;
    // Autoplay with sound needs a gesture on this page: if playback does not start, play muted and ask for a click.
    const check = setTimeout(() => {
      const ps = p.getPlayerState();
      if (ps !== PLAYING && ps !== BUFFERING && !p.isMuted()) {
        p.mute();
        p.playVideo();
        setBlocked(true);
      }
    }, BLOCKED_AFTER_MS);
    const id = setInterval(apply, 1000);
    return () => {
      clearTimeout(check);
      clearInterval(id);
    };
  }, [state, status, duration]);

  // A click on the audience screen counts as the gesture that unlocks sound.
  useEffect(() => {
    if (!blocked) return;
    const unlock = () => {
      playerRef.current?.unMute();
      setBlocked(false);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [blocked]);

  // Controller with a real player (projector alone): republish the real position so followers correct drift.
  useEffect(() => {
    if (!isController || !state.playing || !withPlayer) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p && p.getPlayerState() === PLAYING) setState((s) => seekTo(s, p.getCurrentTime(), Date.now()));
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [isController, state.playing, withPlayer, setState]);

  // Controller clock: the time shown to the presenter, and the end of the video when no player reports it.
  useEffect(() => {
    if (role === "preview" || !state.playing) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (isController && !withPlayer && duration !== undefined && expectedPosition(stateRef.current, t) >= duration) {
        setState((s) => setPlaying(s, false, duration, t));
      }
    }, 250);
    return () => clearInterval(id);
  }, [role, isController, withPlayer, state.playing, duration, setState]);

  const position = expectedPosition(state, now, duration);

  // Play, pause and seek from any window: the presenter's, or the projector's own (also when the presenter is open).
  const act = useSceneActions<VideoAction, VideoState>(ctx, (a) => {
    const at = Date.now();
    if (a.type === "restart") return setState((s) => seekTo(s, 0, at));
    if (a.type === "seek") {
      setNow(at);
      return setState((s) => seekTo(s, a.to, at));
    }
    // The owner's own player knows the true position; otherwise the asking window's estimate.
    const p = playerRef.current;
    const cur = p ? p.getCurrentTime() : a.at;
    const atEnd = duration !== undefined && cur >= duration - 0.5;
    setState((s) => setPlaying(s, !s.playing, atEnd ? 0 : cur, at));
  });
  const controls = canInteract(ctx);
  const header = (
    <header className={styles.header}>
      {props.kicker && (
        <p className={styles.kicker}>
          <Rich text={t(props.kicker)} />
        </p>
      )}
      {props.heading && (
        <h2 className={styles.h}>
          <Rich text={t(props.heading)} />
        </h2>
      )}
    </header>
  );
  const caption = props.caption ? (
    <p className={styles.caption}>
      <Rich text={t(props.caption)} />
    </p>
  ) : null;

  return (
    <div className={styles.root}>
      {header}
      <div className={styles.frame}>
        {withPlayer && (
          // No pointer events: clicks and keys stay with the page (clicker, unlock gesture).
          <div ref={wrapRef} className={cx(styles.player, status !== "ready" && styles.loading)} aria-hidden="true" />
        )}
        {withPlayer && status === "offline" && (
          <div className={cx(styles.card, styles.overlay)}>
            <CapIcon name="film" size={64} strokeWidth={1.4} className={styles.cardIcon} />
            <p className={styles.cardTitle}>
              <Rich text={t(TEXT.offline)} />
            </p>
            <p className={styles.cardHint}>
              <Rich text={t(TEXT.offlineHint)} />
            </p>
            <code className={styles.url}>{watchUrl(props.videoId)}</code>
          </div>
        )}
        {!withPlayer && (
          <div className={cx(styles.card, styles.still)}>
            <CapIcon name={state.playing ? "sound" : "film"} size={72} strokeWidth={1.4} className={styles.cardIcon} />
            {role !== "preview" && (
              <>
                <p className={styles.cardHint}>
                  <Rich text={t(TEXT.onProjector)} />
                </p>
                <p className={styles.clock}>
                  {formatTime(position)} / {formatTime(duration ?? 0)}
                </p>
              </>
            )}
          </div>
        )}
        {blocked && <p className={styles.blocked}><Rich text={t(TEXT.blocked)} /></p>}
      </div>
      {caption}

      {controls && (
        <div className={styles.controls}>
          <ControlBar>
            <SceneButton
              variant="primary"
              onClick={() => {
                // A click here is also the gesture that lets this window play sound.
                playerRef.current?.unMute();
                setBlocked(false);
                act({ type: "toggle", at: playerRef.current ? playerRef.current.getCurrentTime() : position });
              }}
            >
              <span className={styles.btnInner}>
                <CapIcon name={state.playing ? "pause" : "play"} size={22} />
                <Rich text={t(state.playing ? TEXT.pause : TEXT.play)} />
              </span>
            </SceneButton>
            <SceneButton onClick={() => act({ type: "restart" })} title={t(TEXT.restart)}>
              <CapIcon name="back" size={22} />
            </SceneButton>
            <label className={styles.seek}>
              <span className={styles.time}>{formatTime(position)}</span>
              <input
                type="range"
                aria-label={t(TEXT.seek)}
                min={0}
                max={duration ?? 0}
                step={0.5}
                value={Math.min(position, duration ?? 0)}
                onChange={(e) => {
                  setNow(Date.now());
                  act({ type: "seek", to: Number(e.currentTarget.value) });
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.currentTarget.blur()}
              />
              <span className={styles.time}>{formatTime(duration ?? 0)}</span>
            </label>
          </ControlBar>
        </div>
      )}
    </div>
  );
}
