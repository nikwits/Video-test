# Wits + Watts talking-head clips

A separate Remotion project from the rugby clips in the repo root. The root CLAUDE.md
rules (9:16, rugby house style, no video files) do NOT apply here. This one is 16:9,
1920x1080, 30fps, and wraps real footage.

## Brand rules (from the brief)

- Colours: Signal pink `#C4197C`, Ink `#0F0E14`, off-white `#F2F0F2`. Tokens in `src/config.ts`.
- Captions: mono (IBM Plex Mono) by default, stats in pink (colour change only, no pop), opinion lines in serif italic (Spectral). Never mix fonts inside one caption. Max 4 words.
- Calm by default. Zooms are rare (2-3 per 60-90s), slow, 106-108% max. No flashes, no scale pops.
- Spark line is a quiet, occasional motif: the 1s stinger, the end card, and one or two key moments.
- End card: Ink, "wits [spark] watts", one mono CTA line, fade in only.

## Workflow

`npm run transcribe -- <video> --name <clip>`, `npm run plan -- <clip>`, `npm run render -- <clip>`. See README.md.
Typecheck: `npx tsc -p .`. In the cloud container, renders pick up the preinstalled headless shell automatically.
Logic lives in `src/lib/plan.ts` (pure, also run by `scripts/plan.ts` via Node type stripping, so keep `.ts` import extensions there).
