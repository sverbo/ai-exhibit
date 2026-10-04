import { tr } from "@ai-exhibit/presentation-core";
import { Rich } from "../../primitives/Rich.tsx";
import { useEffect, useRef, useState } from "react";
import type { SceneComponentProps } from "../../contract.ts";
import { useOnStepChange, useSceneState } from "../../learning/shared/sceneState.ts";
import { ControlBar, SceneButton, Segmented, l, type L10n } from "../../learning/shared/ui.tsx";
import { CapIcon } from "../shared/icons.tsx";
import { captionsName, expectedPath, mediaUrl } from "./media.ts";
import {
  HEARTBEAT_MS,
  expectedPosition,
  formatTime,
  initialVideoState,
  isMuted,
  needsSeek,
  seekTo,
  setPlaying,
  type SoundOutput,
  type VideoState,
} from "./sync.ts";
import styles from "./VideoScene.module.css";

export interface VideoSceneProps {
  /** File in content/assets/media/, e.g. "personal-demo.mp4" (a leading "media/" is accepted). */
  src: string;
  /** Optional still image in the same folder, shown before playback and in previews. */
  poster?: string;
  caption?: L10n;
}

const TEXT = {
  placeholder: { en: "Personal demo video goes here" },
  placeholderHint: l(
    "Déposez le fichier à cet endroit puis rechargez la page. Instructions : content/assets/media/README.md",
    "Drop the file at this path, then reload. Instructions: content/assets/media/README.md",
  ),
  unreadable: { en: "The file is there, but the browser cannot play it." },
  play: { en: "Play" },
  pause: { en: "Pause" },
  restart: { en: "Back to start" },
  sound: { en: "Sound" },
  soundOff: { en: "Off" },
  soundProjector: { en: "Projector" },
  seek: { en: "Position" },
  blocked: l(
    "Le navigateur bloque le son : cliquez une fois dans cette fenêtre.",
    "The browser blocks sound: click once in this window.",
  ),
};

export function VideoScene({ props, ctx }: SceneComponentProps<VideoSceneProps, VideoState>) {
  const { locale, role } = ctx;
  const t = (x: L10n) => tr(x, locale);
  const isController = role === "controller";
  const url = mediaUrl(props.src ?? "");
  const posterUrl = props.poster ? mediaUrl(props.poster) : undefined;
  const captionsUrl = props.src ? mediaUrl(captionsName(props.src)) : undefined;

  const [state, setState] = useSceneState<VideoState>(ctx, initialVideoState, { throttleMs: 150 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [broken, setBroken] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });

  const muted = isMuted(state.sound, role, ctx.audienceScreen);

  // Every role with a video element follows the shared state, the controller included:
  // its buttons only publish state, and this effect applies it.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    const apply = () => {
      const target = expectedPosition(state, Date.now(), el.duration);
      if (needsSeek(el.currentTime, target, state.playing)) el.currentTime = target;
      if (state.playing && el.paused) {
        el.play().catch((err: unknown) => {
          // Autoplay with sound needs a user gesture on this page: fall back to muted playback.
          if (err instanceof DOMException && err.name === "NotAllowedError" && !el.muted) {
            el.muted = true;
            setBlocked(true);
            el.play().catch(() => {});
          }
        });
      } else if (!state.playing && !el.paused) {
        el.pause();
      }
    };
    if (el.readyState >= 1) apply();
    else {
      el.addEventListener("loadedmetadata", apply, { once: true });
      return () => el.removeEventListener("loadedmetadata", apply);
    }
  }, [state, muted]);

  // A click on the projector window counts as the gesture that unlocks sound.
  useEffect(() => {
    if (!blocked) return;
    const unlock = () => {
      const el = videoRef.current;
      if (el && !muted) el.muted = false;
      setBlocked(false);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [blocked, muted]);

  // Controller heartbeat: republish the real position so followers correct drift.
  useEffect(() => {
    if (!isController || !state.playing) return;
    const id = setInterval(() => {
      const el = videoRef.current;
      if (el && !el.paused) setState((s) => seekTo(s, el.currentTime, Date.now()));
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [isController, state.playing, setState]);

  // The clicker can start the video: reveal step 1 plays, back to 0 pauses.
  useOnStepChange(ctx.revealStep, (step, prev) => {
    if (!isController || !url) return;
    const el = videoRef.current;
    const pos = el?.currentTime ?? state.position;
    if (step >= 1 && prev === 0) setState((s) => setPlaying(s, true, pos, Date.now()));
    if (step === 0) setState((s) => setPlaying(s, false, pos, Date.now()));
  });

  const caption = props.caption ? <p className={styles.caption}><Rich text={t(props.caption)} /></p> : null;

  if (!url || broken) {
    return (
      <div className={styles.root}>
        <div className={styles.placeholder}>
          <CapIcon name="film" size={72} strokeWidth={1.4} className={styles.placeholderIcon} />
          <p className={styles.placeholderTitle}><Rich text={t(broken ? TEXT.unreadable : TEXT.placeholder)} /></p>
          <code className={styles.path}>{expectedPath(props.src ?? "personal-demo.mp4")}</code>
          {role !== "display" && <p className={styles.hint}><Rich text={t(TEXT.placeholderHint)} /></p>}
        </div>
        {caption}
      </div>
    );
  }

  if (role === "preview") {
    return (
      <div className={styles.root}>
        <div className={styles.frame}>
          {posterUrl ? (
            <img className={styles.media} src={posterUrl} alt="" />
          ) : (
            <div className={styles.previewCard}>
              <CapIcon name="film" size={64} strokeWidth={1.4} />
              <code className={styles.path}>{expectedPath(props.src)}</code>
            </div>
          )}
        </div>
        {caption}
      </div>
    );
  }

  const onTime = () => {
    const el = videoRef.current;
    if (el && isController) setTime({ current: el.currentTime, duration: el.duration || 0 });
  };

  return (
    <div className={styles.root}>
      <div className={styles.frame}>
        <video
          ref={videoRef}
          className={styles.media}
          src={url}
          poster={posterUrl}
          preload="auto"
          playsInline
          muted
          onError={() => setBroken(true)}
          onTimeUpdate={onTime}
          onLoadedMetadata={onTime}
          onEnded={() => {
            const el = videoRef.current;
            if (isController && el) setState((s) => setPlaying(s, false, el.duration || s.position, Date.now()));
          }}
        >
          {captionsUrl && <track kind="captions" src={captionsUrl} srcLang={locale} label={locale} default />}
        </video>
        {blocked && role === "display" && <p className={styles.blocked}><Rich text={t(TEXT.blocked)} /></p>}
      </div>
      {caption}

      {isController && (
        <div className={styles.controls}>
        <ControlBar>
          <SceneButton
            variant="primary"
            onClick={() => {
              const el = videoRef.current;
              const atEnd = el ? el.ended || (el.duration > 0 && el.currentTime >= el.duration - 0.1) : false;
              const pos = atEnd ? 0 : (el?.currentTime ?? state.position);
              setState((s) => setPlaying(s, !s.playing, pos, Date.now()));
            }}
          >
            <span className={styles.btnInner}>
              <CapIcon name={state.playing ? "pause" : "play"} size={22} />
              <Rich text={t(state.playing ? TEXT.pause : TEXT.play)} />
            </span>
          </SceneButton>
          <SceneButton onClick={() => setState((s) => setPlaying(s, false, 0, Date.now()))} title={t(TEXT.restart)}>
            <CapIcon name="back" size={22} />
          </SceneButton>
          <label className={styles.seek}>
            <span className={styles.time}>{formatTime(time.current)}</span>
            <input
              type="range"
              aria-label={t(TEXT.seek)}
              min={0}
              max={time.duration || 0}
              step={0.1}
              value={Math.min(time.current, time.duration || 0)}
              onChange={(e) => {
                const v = Number(e.currentTarget.value);
                setTime((x) => ({ ...x, current: v }));
                setState((s) => seekTo(s, v, Date.now()));
              }}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.currentTarget.blur()}
            />
            <span className={styles.time}>{formatTime(time.duration)}</span>
          </label>
          <Segmented<SoundOutput>
            label={t(TEXT.sound)}
            value={state.sound === "off" ? "off" : "projector"}
            options={[
              {
                value: "off",
                label: (
                  <span className={styles.btnInner}>
                    <CapIcon name="mute" size={22} />
                    <Rich text={t(TEXT.soundOff)} />
                  </span>
                ),
              },
              { value: "projector", label: t(TEXT.soundProjector) },
            ]}
            onChange={(sound) => setState((s) => ({ ...s, sound }))}
          />
        </ControlBar>
        </div>
      )}
    </div>
  );
}

