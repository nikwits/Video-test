# Rugby explainer videos: house style and how to build a clip

Vertical (9:16) explainer clips for people new to rugby union, built in Remotion (React + SVG).
Every new clip must look like it belongs with the existing five. Read this first.

## Non-negotiables

- **Everything is drawn in code.** No image, video or audio files in any clip. (`docs/style-reference.png` is a reference for humans only; never import it.)
- **No branding.** No logos, club or sponsor names on kits, posts, boards or cards. Teams are HOME and AWAY.
- **1080x1920, 30fps.** Output to `out/<clip-name>.mp4`, also copy to `/out/` when that folder exists.
- **Easing on all motion.** Use `ease()` / `popIn()` from `src/scene/stage.tsx`. Linear only for mechanical things (the match clock).
- **Safe area.** Key action and text inside the middle 80%: x 108–972, y 192–1728. The scoreboard sits at y≈212–330.
- **Hold a clean end frame for the last second.** Freeze ambient motion with `const tt = Math.min(t, endHoldStart)`.
- **All timings in `src/config.ts`**, one object per clip, in seconds, with a short comment on each.

## Look ("premium editorial 2D", from `docs/style-reference.png`)

- **Players:** natural athletic proportions (about 7 heads tall), tapered limbs, simple realistic faces, flat shading with one shadow tone on the right side (light from upper left), thin dark outline (`O = 1.1` sprite units).
- **Kits:** HOME is all black (`#0F1113`) with white-hooped socks and black wristbands, number 10 on the kicker/hero. AWAY is all white. Touch judges wear lime.
- **Setting:** night match. Dark sky, floodlights on the stand roof, dimmed grey crowd, floodlit green pitch, vignette at the edges.
- **Palette** (`PALETTE` in config): kit `#0F1113`, shadow `#2A2D31`, mid `#5E6368`, skin `#D1A27A`, white `#F2F2F2`, accent lime `#A6E222`.
- **Lime is an accent only:** headline words, points tags, score flash, flags, one thin board stripe. Never a big fill.
- **Type:** Liberation Sans Bold squeezed to about 0.82 width via `<Condensed>` in `src/scene/Hud.tsx` (the container has no condensed font). Headlines use `<Headline>` (slight italic, lime, dark outline, soft shadow). Points use `<Tag>` (dark pill, lime edge). Words in caps, short: "TRY!", "PENALTY", "+3".
- **Effects are understated:** a white ring and a few flecks on impact, a subtle dotted trail on kicks, white/lime/grey confetti. No cartoon starbursts or dizzy stars.

## Project map

| Path | What it holds |
|---|---|
| `src/config.ts` | `PALETTE`, `COLORS`, `KITS`, `PITCH`, `SCORES`, and a timing object per clip (`TIMING`, `DROP_GOAL`, `PENALTY`, `INTRO`, `OUTRO`) |
| `src/Root.tsx` | Registers every composition |
| `src/engine/camera.ts` | Tiny perspective camera: `project`, `polyPath`, `groundRect`, `groundLine`, `wallRect` |
| `src/scene/stage.tsx` | `ease`, `bump`, `popIn`, `sprite`, `shadow`, `renderSorted`, `makeKick` (ball flight to the posts), `kickedBall`, `tee` |
| `src/scene/World.tsx` | `Backdrop` (sky, floodlights, stand, crowd, pitch, lines), `Posts`, `Vignette` |
| `src/scene/Hud.tsx` | `Scoreboard`, `Headline`, `Tag`, `Condensed` |
| `src/scene/Effects.tsx` | `SpeedLines`, `Wipe`, `Impact`, `Dust`, `Confetti`, `Sparkle` |
| `src/characters/Character.tsx` | The player rig and poses (`runBack`, `standBack`, `kickBack`, `runFront`, `standFront`, `armsUp`, `reachUp`, `handsOnHead`, `holdBallBack`, `holdBallFront`, `callForBall`) |
| `src/characters/Diver.tsx` | The try-scoring dive (seen from behind and above) |
| `src/clips/shared.tsx` | `kickCamera`, `placeKicker`, `officials` (touch judges), `KickClipShell` (word + points + scoreboard overlay) |
| `src/clips/cards.tsx` | `StadiumCard` (title-card backdrop) and `ScoreIcon` |
| `src/RugbyTry.tsx`, `src/clips/*.tsx` | The clips |

## World conventions

- Metres. x across the pitch, y up, z towards the posts. Try line at `z = 40`, posts at `x = ±2.8`, crossbar `y = 3`, dead-ball line `z = 50`.
- Characters are billboards drawn in sprite units (~1cm, feet at 0,0, up is negative y), scaled by `CHAR_SCALE` (1.3). The ball is exaggerated (`BALL_SCALE`, plus `FLIGHT_BOOST` in the air) so it reads on a phone.
- Anything in the world goes into a `Drawable[]` list and is drawn with `renderSorted` (far to near). The posts are a drawable too, so players can pass in front of or behind them.
- Players only have **front** and **back** views, plus the dive. A side-on action (scrum, lineout, tackle from the side) needs new rig work first.

## Workflow for a new clip

Use the `new-clip` skill (`.claude/skills/new-clip/SKILL.md`). In short:

1. Fill in `docs/BRIEF_TEMPLATE.md` (or get the same answers from the user).
2. Add a timing object to `src/config.ts`, a file in `src/clips/`, and a `<Composition>` in `src/Root.tsx`.
3. Build from the shared parts above. Copy the nearest existing clip rather than starting blank.
4. Render stills, look at them, fix, repeat (see below). Then render the MP4.
5. Commit, push, and send the MP4 to the user.

## Commands

```bash
npm install
npx tsc -p . --noUnusedLocals                 # typecheck (the "lint" step)
COMP=DropGoal node scripts/stills.mjs 20 53 225   # stills to out/still-NNN.png (default COMP=RugbyTry)
node scripts/sheet.mjs                        # tile all out/still-*.png into out/sheet.png to review
npm run render:all                            # all five MP4s (see package.json for single clips)
npx remotion render src/index.ts <Id> out/<name>.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

## Quality check (every clip, before the full render)

- Render stills at the key beats (start, each action, each text pop, end hold) and **look at them** via the sheet.
- Check: nothing clipped at the frame edge, text not overlapping other text, players not hidden behind posts or each other, ball clearly between the posts and above the bar on a kick, end frame clean and still.
- When refactoring shared code, render the same stills before and after and compare `md5sum`. Existing clips must not change unless that's the point.

## Gotchas

- Render with the container's headless shell (the `--browser-executable` path above). Don't run `playwright install`.
- `remotion.config.ts` uses PNG frames so the MP4 is standard-range `yuv420p`. JPEG frames give full-range `yuvj420p`, which looks washed out on some phones.
- The ffmpeg bundled with Remotion has no `xstack`/`overlay` filters. Use `scripts/sheet.mjs` (Playwright) for contact sheets.
- Stills from different compositions share filenames (`still-NNN.png`) and overwrite each other. Rename or clear between runs.
- SVG gradient ids in use: `nightSky`, `lampGlow`, `vignette`, `cardShade`. Reuse them, don't redefine them with different content.
- The black kit loses contrast on the dark in-goal grass. Keep the hero large or lit, and use the impact ring and headline to carry try moments.
- Straight after a long kick, the ball rises steeply on screen and can look as if it's already over the posts. The trail helps; a camera push makes the kicker crop at the bottom, so keep pushes small.
