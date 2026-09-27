# Wits + Watts talking-head clips

Raw founder-to-camera footage in, a finished 16:9 social clip out (1920x1080, 30fps): dead air cut, jump cuts every 2 to 3 seconds, brand captions, two or three slow zooms on the lines that matter, a 1 second spark stinger and an end card.

It's two steps, so you can check and tweak the transcript before rendering.

## Setup (once)

Needs Node 22.18 or newer. For the local transcriber you also need `git`, `make`, `cmake` and a C++ compiler (on a Mac: `xcode-select --install` and `brew install cmake`).

```bash
cd talking-head
npm install
```

## Make a clip

```bash
# 1. Transcribe. Makes a 1080p copy of the footage and a word-level transcript.
npm run transcribe -- ~/Downloads/raw.mp4 --name ai-pilots

# 2. See the edit it will make (styles, stats, zooms), no render needed.
npm run plan -- ai-pilots

# 3. Render to out/ai-pilots.mp4
npm run render -- ai-pilots
```

Or all three in one go: `npm run make -- ~/Downloads/raw.mp4 --name ai-pilots`.

To watch it and scrub around first: `npm run studio`, then set the `clip` prop on the TalkingHead composition.

No footage handy? `npm run demo && npm run render -- demo` builds a stand-in clip and renders it.

### Transcription options

| Flag | Default | What it does |
|---|---|---|
| `--engine local` | yes | whisper.cpp on your machine. First run clones and builds it into `.whisper/` and downloads the model (about 1.5GB for `medium.en`). Free and private. |
| `--engine openai` | | OpenAI Whisper API instead. Needs `OPENAI_API_KEY` set. Faster on an older laptop. |
| `--model medium.en` | `medium.en` | `small.en` is quicker, `large-v3-turbo` is the most accurate. |
| `--language en` | `en` | For other languages, use a model without `.en`. |
| `--no-proxy` | | Skip the 1080p copy and use the file as is. |
| `--force` | | Redo the 1080p copy even if it exists. |
| `--silence-db -38` | `-38` | How quiet counts as a pause. Try `-32` for a noisy room. |

The transcript is `public/clips/<name>.words.json`: an array of `{ "word", "start", "end" }` in seconds. Fix a misheard word by editing it right there.

## How the edit decides things

- **Dead air.** Any gap between words longer than 0.35s is cut. Pauses and the fumbling at the start and end go.
- **Jump cuts.** Every removed pause is a cut, and any run longer than 3s gets a framing cut at the best break (end of sentence, then a comma, then the longest pause). Framing alternates between wide and a slightly tighter 103.5%, so cuts read as deliberate, not glitches.
- **Caption style**, per sentence, never mixed within a caption:
  - Has a number, %, $, £, € or "10x" (or "ten times", "forty percent"): mono, with the stat in **Signal pink**.
  - Ends in "?" or has an emphasis word ("nobody", "never", "stop", "wrong"...): **serif italic**.
  - Everything else: mono, white.
- **Zooms.** About one per 28 seconds, max 3, at least 15s apart, only on lines that score high enough (opinions, questions, stats, short punchy lines). Slow push to 107%, and it resets on a cut so you never see it zoom back out.
- **Spark.** The biggest zoom moment also gets a small spark line drawing above the caption. Once.

`npm run plan -- <clip>` prints all of this, line by line.

## Overriding the auto decisions

Each clip gets `public/clips/<name>.edit.json`. Everything in it is optional:

```json
{
  "lines": [
    {"match": "start changing habits", "style": "opinion"},
    {"match": "one of the things", "style": "plain"}
  ],
  "stats": {"add": ["ten times"], "remove": ["one"]},
  "zooms": [{"match": "nobody changed how the work"}, {"at": 42.5}],
  "cut": [{"from": 11.1, "to": 13.5}],
  "cta": "Book a call at witsandwatts.ai",
  "emphasisWords": ["theatre"]
}
```

- `lines`: force a sentence's style. `match` is any chunk of the sentence (case and punctuation ignored). `opinion` = serif, `fact` = mono with pink stats, `plain` = mono, no pink.
- `stats`: force words pink, or stop them being pink.
- `zooms`: `"auto"`, or pick the moments. `at` is seconds on the raw footage (the times `npm run plan` shows).
- `cut`: drop bits of raw footage, like a fluffed take.
- `cta`: end card line for this clip.

## Changing the look

All defaults live in `src/config.ts`: brand colours, fonts, caption size and position, cut timing, zoom count and scale, stinger and end card length, emphasis words. Any of them can also be overridden per render:

```bash
npm run render -- ai-pilots --props '{"zoom":{"count":2,"maxScale":1.06},"captions":{"bottom":90}}'
```

## Project map

| Path | What it holds |
|---|---|
| `scripts/transcribe.mjs` | Step 1: footage -> 1080p copy + word JSON (whisper.cpp or OpenAI) |
| `scripts/plan.ts` | Prints the edit for a clip |
| `scripts/render.mjs`, `scripts/make.mjs` | Render, or everything at once |
| `scripts/demo.mjs` | Builds stand-in demo footage |
| `src/config.ts` | Brand tokens and every timing/size knob |
| `src/lib/plan.ts` | The editor: cuts, captions, styles, stat detection, zoom picks |
| `src/TalkingHead.tsx` | The composition: stinger, footage, captions, spark, end card |
| `src/components/` | `Stinger`, `Footage`, `Captions`, `SparkMoment`, `EndCard`, `Spark` |
| `public/clips/` | Your footage (not committed), transcripts and edit files |

## Known gaps

- The logo lockup on the end card is set in Spectral with a drawn spark. Swap in the real logo SVG in `src/components/EndCard.tsx` when you have it.
- Stat detection is a regex plus a short list of number words and units. It will miss the odd one ("a third of them"). Use `stats.add` in the edit file.
