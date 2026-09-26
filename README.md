# Rugby Scoring Clips

Five 9:16 clips (an intro, the four ways to score, and a recap) for rugby union, in a premium editorial 2D style (night match, all-black home kit). Everything is drawn in code (React + SVG in Remotion). There are no image, video or audio files.

| Clip | Composition | Output | Length |
|---|---|---|---|
| Intro: "New to rugby?" | `Intro` | `out/intro.mp4` | 5s |
| Try + conversion (5 + 2) | `RugbyTry` | `out/rugby-try.mp4` | 15s |
| Drop goal (3) | `DropGoal` | `out/drop-goal.mp4` | 8s |
| Penalty kick (3) | `PenaltyKick` | `out/penalty-kick.mp4` | 8s |
| Recap | `Outro` | `out/outro.mp4` | 6s |

All are 1080x1920 at 30fps.

- Tweak timings: `src/config.ts` → `INTRO`, `TIMING` (try), `DROP_GOAL`, `PENALTY`, `OUTRO`. All in seconds.
- Recap wording and points: `SCORES` in the same file.
- Starting score: `startScore` in `DROP_GOAL` / `PENALTY` (set to 7 and 10 if you stitch the clips into one match).
- Palette, kits, pitch layout: same file (`PALETTE`, `KITS`, `PITCH`).

## Making a new clip

- House style, project map and gotchas: `CLAUDE.md` (Claude reads it automatically).
- Fill in `docs/BRIEF_TEMPLATE.md` and hand it to Claude; the `new-clip` skill (`.claude/skills/new-clip/`) walks through brief, build, stills check and render.
- The original look reference is `docs/style-reference.png` (for humans only; never used in a clip).
- Cloud sessions install dependencies automatically via `.claude/hooks/session-start.sh`.

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
npm run render:intro
npm run render:outro
npm run render:all      # all five
```

`--browser-executable` in the scripts points at the Chromium in this container. Drop it (or set `REMOTION_BROWSER`) on a normal machine.

## How it's built

- `src/engine/camera.ts`: a tiny perspective camera. Pitch, posts and ball flight live in one 3D world, so everything lines up.
- `src/characters/`: players with natural athletic proportions, flat shading and simple faces (back view, front view and a diving pose).
- `src/scene/`: pitch and stadium, scoreboard and pop-up text, plus effects (speed lines, wipes, confetti).
- `src/scene/stage.tsx`: shared helpers (easing, perspective sprites, depth sorting, kick flight).
- `src/RugbyTry.tsx`: the try clip (run and try, conversion, celebration).
- `src/clips/`: the intro, drop goal, penalty and recap clips, plus what they share (touch judges, kick camera, text overlay, title-card backdrop and icons).
