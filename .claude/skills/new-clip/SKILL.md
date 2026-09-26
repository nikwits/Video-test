---
name: new-clip
description: Build a new rugby explainer clip in this project's house style (night stadium, black HOME kit, lime accents, code-drawn only). Use when the user asks for a new video, clip, scene, intro/outro card or explainer about a rugby rule or skill, or wants a variation of an existing clip.
---

# New clip

Builds one new vertical clip that matches the existing set. Read `CLAUDE.md` first: it has the style rules, project map and gotchas.

## 1. Get the brief

Use `docs/BRIEF_TEMPLATE.md`. If the user hasn't given these, ask **one question at a time** (with options where possible) for anything that changes the build:

- What the clip teaches, in one line
- Length (existing clips: 5s, 6s, 8s, 15s)
- The on-screen words and points, exactly
- Standalone or part of a sequence (affects the scoreboard's `startScore`)

Default everything else from `CLAUDE.md`. Say which defaults you picked.

Check feasibility early: players only have front and back views plus the dive. If the action needs a side view (scrum, lineout, side-on tackle), say so and agree the extra rig work before building.

## 2. Plan the beats

Write a short beat list with times in seconds: set-up, the action, the text pops, the score tick, and the held end frame (last second). Pick the camera:

- Kick at goal: `kickCamera` + `makeKick` (see `src/clips/PenaltyKick.tsx`)
- Open play from behind the runner: the orbit camera in `src/RugbyTry.tsx`
- Title card: `StadiumCard` (see `src/clips/Intro.tsx`, `src/clips/Outro.tsx`)

## 3. Build

1. Add a timing object to `src/config.ts`: `durationInFrames`, every beat in seconds with a comment, `endHoldStart`.
2. Copy the nearest existing clip into `src/clips/<Name>.tsx`, then change it. Reuse `shared.tsx`, `stage.tsx`, `cards.tsx`, `Hud.tsx`. Only add new shared pieces when a second clip will use them.
3. Register a `<Composition>` in `src/Root.tsx`, and add `render:<name>` to `package.json` (and to `render:all`).
4. New poses go in `src/characters/Character.tsx` as small functions like `handsOnHead`.
5. Typecheck: `npx tsc -p . --noUnusedLocals`.

## 4. Stills loop (don't skip)

```bash
rm -f out/still-*.png
COMP=<Id> node scripts/stills.mjs <frames at each beat and the last frame>
node scripts/sheet.mjs
```

Open `out/sheet.png` and check against the list in `CLAUDE.md` (clipping, overlaps, hidden players, ball between the posts, clean end frame). Fix and repeat until it's right. If you touched shared code, compare `md5sum` of before/after stills for the existing clips.

## 5. Render and deliver

```bash
npm run render:<name>
```

- Confirm with ffprobe (bundled with Remotion): 1080x1920, 30fps, `yuv420p`, the expected frame count.
- Copy to `/out/` if that folder exists.
- Update the clip table in `README.md`.
- Commit with a clear message, push to the working branch, and send the MP4 to the user.
- Tell the user in a few lines: what the clip shows, anything you defaulted, and any weak spots you saw in the stills.
