# Media for the talk

Videos and stills used by the `VideoScene` component live directly in this
folder (top level, not in a subfolder). Scene 1.5, "the presenter's own demo",
expects:

```
content/assets/media/personal-demo.mp4
```

Until the file is there, the scene shows a calm placeholder card with that
path, so rehearsals work without it.

## Adding your demo

1. Record the demo (screen recording of you using an assistant on a real task
   of yours). Keep it short: 60 to 120 seconds plays well in a talk.
2. Encode it as below and save it as `personal-demo.mp4` in this folder.
3. Optional: add `personal-demo.vtt` (captions, WebVTT) next to it; it is
   attached automatically. Captions help anyone who cannot hear the sound.
4. Optional: add a still image (for example `personal-demo.jpg`) and set the
   scene's `poster` prop to its file name.
5. Restart `pnpm dev` (new files are picked up when the dev server starts), or
   run `pnpm build` for a production build: the video is copied into the build.

Do not commit large videos to git unless you mean to: they bloat the
repository forever.

## Recommended encoding

- Container and codecs: MP4, H.264 video (High profile, `yuv420p`), AAC audio.
  Every browser plays this.
- Size: 1920x1080 (or 1280x720 if the recording is mostly text), 30 fps.
- Quality: constant quality around CRF 20 to 23; about 5 to 10 MB per minute
  for a screen recording.
- `+faststart`, so playback starts before the whole file is read.
- Audio is optional: the scene starts muted, and the presenter chooses where
  sound plays (projector or presenter screen).

With ffmpeg:

```
ffmpeg -i recording.mov \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 21 -preset slow \
  -vf "scale=1920:-2,fps=30" \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  personal-demo.mp4
```

WebM (VP9) also works (`personal-demo.webm`, then set `src` to that name), but
H.264 MP4 is the safe choice.

## During the talk

The presenter screen shows play/pause, a position slider, "back to start" and
the sound output. The projector follows: it starts, pauses and seeks with the
presenter, and corrects small drift by itself. With `scene.steps: 1`, the
clicker's next key starts the video.

Before the talk, open the scene once on the projector window and click into it
once: browsers only allow sound after a click on the page.
