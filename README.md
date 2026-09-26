# Rugby Scoring Clips

Three 9:16 clips showing the ways to score in rugby union, in a premium editorial 2D style (night match, all-black home kit). Everything is drawn in code (React + SVG in Remotion). There are no image, video or audio files.

| Clip | Composition | Output | Length |
|---|---|---|---|
| Try + conversion (5 + 2) | `RugbyTry` | `out/rugby-try.mp4` | 15s |
| Drop goal (3) | `DropGoal` | `out/drop-goal.mp4` | 8s |
| Penalty kick (3) | `PenaltyKick` | `out/penalty-kick.mp4` | 8s |

All are 1080x1920 at 30fps.

- Tweak timings: `src/config.ts` → `TIMING` (try), `DROP_GOAL`, `PENALTY`. All in seconds.
- Starting score: `startScore` in `DROP_GOAL` / `PENALTY` (set to 7 and 10 if you stitch the clips into one match).
- Palette, kits, pitch layout: same file (`PALETTE`, `KITS`, `PITCH`).

## Commands

```bash
npm install
npm run studio          # live preview
npm run stills          # renders check frames 30,150,200,260,330,420 to out/
COMP=DropGoal node scripts/stills.mjs 20 53 225   # stills from another clip
node scripts/stills.mjs 95 180   # any frames you like
node scripts/sheet.mjs  # tiles the stills into out/sheet.png
npm run render          # try MP4
npm run render:drop-goal
npm run render:penalty
npm run render:all      # all three
```

`--browser-executable` in the scripts points at the Chromium in this container. Drop it (or set `REMOTION_BROWSER`) on a normal machine.

## How it's built

- `src/engine/camera.ts`: a tiny perspective camera. Pitch, posts and ball flight live in one 3D world, so everything lines up.
- `src/characters/`: players with natural athletic proportions, flat shading and simple faces (back view, front view and a diving pose).
- `src/scene/`: pitch and stadium, scoreboard and pop-up text, plus effects (speed lines, wipes, confetti).
- `src/scene/stage.tsx`: shared helpers (easing, perspective sprites, depth sorting, kick flight).
- `src/RugbyTry.tsx`: the try clip (run and try, conversion, celebration).
- `src/clips/`: the drop goal and penalty clips, plus what they share (touch judges, kick camera, text overlay).
