# Rugby Try

A 15 second, 9:16 cartoon of a rugby try and conversion. Everything is drawn in code (React + SVG in Remotion). There are no image, video or audio files.

- Output: `out/rugby-try.mp4` (1080x1920, 30fps, 450 frames)
- Tweak timings: `src/config.ts` → `TIMING` (all in seconds)
- Colours, kits, pitch layout: same file

## Commands

```bash
npm install
npm run studio          # live preview
npm run stills          # renders check frames 30,150,200,260,330,420 to out/
node scripts/stills.mjs 95 180   # any frames you like
node scripts/sheet.mjs  # tiles the stills into out/sheet.png
npm run render          # full MP4
```

`--browser-executable` in the scripts points at the Chromium in this container. Drop it (or set `REMOTION_BROWSER`) on a normal machine.

## How it's built

- `src/engine/camera.ts`: a tiny perspective camera. Pitch, posts and ball flight live in one 3D world, so everything lines up.
- `src/characters/`: flat cartoon players built from a simple rig (back view, front view and a diving pose).
- `src/scene/`: pitch and stadium, scoreboard and pop-up text, plus effects (speed lines, wipes, confetti).
- `src/RugbyTry.tsx`: the three scenes (run and try, conversion, celebration) and all the motion.
