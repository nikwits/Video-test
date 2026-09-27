#!/usr/bin/env node
// Step 1: raw video in, word-level transcript out.
//
//   npm run transcribe -- ~/Downloads/raw.mp4 [--name my-clip] [--engine local|openai]
//                          [--model medium.en] [--language en] [--no-proxy] [--force]
//                          [--silence-db -38]
//
// Writes:
//   public/clips/<name>.mp4         1080p/30fps copy of the footage (fast, reliable renders)
//   public/clips/<name>.words.json  [{ word, start, end }] in seconds
//   public/clips/<name>.edit.json   starter file for hand edits (only if it doesn't exist)
//
// Engines:
//   local  (default) whisper.cpp, installed and built into .whisper/ on first run. Free, offline after setup.
//   openai the OpenAI Whisper API. Needs OPENAI_API_KEY in your environment. Faster on a slow laptop.

import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args, ffmpeg, probe, slug} from './lib/media.mjs';

const {pos, flags} = args(process.argv.slice(2), ['no-proxy', 'force']);
const input = pos[0];
if (!input || !fs.existsSync(input)) {
  console.error('Usage: npm run transcribe -- <video file> [--name my-clip] [--engine local|openai]');
  process.exit(1);
}

const name = slug(flags.name ?? path.basename(input));
const engine = flags.engine ?? 'local';
const model = flags.model ?? 'medium.en';
const language = flags.language ?? 'en';
const silenceDb = Number(flags['silence-db'] ?? -38);
const WHISPER_VERSION = '1.7.6';

const clipsDir = path.join(ROOT, 'public', 'clips');
const cacheDir = path.join(ROOT, '.cache');
fs.mkdirSync(clipsDir, {recursive: true});
fs.mkdirSync(cacheDir, {recursive: true});

const videoOut = path.join(clipsDir, `${name}.mp4`);
const wav = path.join(cacheDir, `${name}.wav`);
const wordsOut = path.join(clipsDir, `${name}.words.json`);
const editOut = path.join(clipsDir, `${name}.edit.json`);

const step = (s) => console.log(`\n> ${s}`);
const fresh = (out, src) => !flags.force && fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs;

// ---------- 1. footage ----------

const info = await probe(input);
console.log(`${path.basename(input)}: ${info.width}x${info.height} ${info.codec}, ${info.duration.toFixed(1)}s`);
if (!info.hasAudio) {
  console.error('That file has no audio track, so there is nothing to transcribe.');
  process.exit(1);
}

if (flags['no-proxy']) {
  step(`Copying footage to public/clips/${name}.mp4`);
  if (path.resolve(input) !== path.resolve(videoOut)) fs.copyFileSync(input, videoOut);
} else if (fresh(videoOut, input)) {
  step(`Footage already prepared: public/clips/${name}.mp4`);
} else {
  // Scale to cover 1920x1080 (keeps aspect, the composition crops), constant 30fps, H.264.
  // Phone footage is often 4K HEVC with variable frame rate, which renders slowly and drifts.
  step(`Making a 1080p/30fps copy of the footage (a few minutes for 4K)`);
  await ffmpeg([
    '-i',
    input,
    '-vf',
    "scale='if(gt(a,16/9),-2,1920)':'if(gt(a,16/9),1080,-2)':flags=lanczos,format=yuv420p",
    '-r',
    '30',
    '-fps_mode',
    'cfr',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '18',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-movflags',
    '+faststart',
    videoOut,
  ]);
}

// ---------- 2. audio ----------

step('Extracting audio');
await ffmpeg(['-i', videoOut, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);

// ---------- 3. whisper ----------

let words;
if (engine === 'openai') words = await transcribeOpenAI();
else if (engine === 'local') words = await transcribeLocal();
else {
  console.error(`Unknown engine "${engine}". Use local or openai.`);
  process.exit(1);
}

// ---------- 4. tighten word edges against real silence ----------
// Whisper's word ends tend to run on into pauses. Snapping them to the actual
// silence makes the dead-air cuts land cleanly.

step('Checking word edges against the audio');
const silences = await detectSilence(wav, silenceDb);
words = tighten(words, silences);

const round = (t) => Math.round(t * 1000) / 1000;
const json = words.map((w) => ({word: w.word, start: round(w.start), end: round(w.end)}));
fs.writeFileSync(wordsOut, JSON.stringify(json, null, 1) + '\n');
if (!fs.existsSync(editOut)) {
  const starter = {lines: [], stats: {add: [], remove: []}, zooms: 'auto', cut: []};
  fs.writeFileSync(editOut, JSON.stringify(starter, null, 2) + '\n');
}

console.log(`\nDone. ${json.length} words -> public/clips/${name}.words.json`);
console.log(`Preview the edit:   npm run plan -- ${name}`);
console.log(`Render:             npm run render -- ${name}`);

// =====================================================================

async function transcribeLocal() {
  const {installWhisperCpp, downloadWhisperModel, transcribe} = await import('@remotion/install-whisper-cpp');
  const whisperPath = path.join(ROOT, '.whisper', 'whisper.cpp');
  const modelFolder = path.join(ROOT, '.whisper', 'models');
  if (language !== 'en' && model.endsWith('.en')) {
    throw new Error(
      `Model ${model} is English only. Use --model medium (or large-v3-turbo) for --language ${language}.`,
    );
  }
  step(
    `Setting up whisper.cpp ${WHISPER_VERSION} (first run clones and builds it, needs git, make and a C++ compiler)`,
  );
  fs.mkdirSync(path.dirname(whisperPath), {recursive: true});
  await installWhisperCpp({version: WHISPER_VERSION, to: whisperPath, printOutput: false});
  step(`Getting the ${model} model (first run downloads it)`);
  fs.mkdirSync(modelFolder, {recursive: true});
  await downloadWhisperModel({model, folder: modelFolder, printOutput: false});

  step(`Transcribing with ${model}`);
  let last = -1;
  const out = await transcribe({
    inputPath: wav,
    whisperPath,
    whisperCppVersion: WHISPER_VERSION,
    model,
    modelFolder,
    language,
    tokenLevelTimestamps: true,
    printOutput: false,
    onProgress: (p) => {
      const pct = Math.floor(p * 10) * 10;
      if (pct !== last) process.stdout.write(`${pct}% `);
      last = pct;
    },
  });
  console.log('');

  // Tokens are sub-word pieces. A new word starts where a token begins with a space.
  const tokens = out.transcription.flatMap((seg) => seg.tokens).filter((t) => !/^\s*\[_/.test(t.text) && t.text.trim());
  const ws = [];
  for (const t of tokens) {
    const start = t.t_dtw >= 0 ? t.t_dtw / 100 : t.offsets.from / 1000;
    const end = t.offsets.to / 1000;
    const prev = ws[ws.length - 1];
    if (prev && !/^\s/.test(t.text)) {
      prev.word += t.text;
      prev.end = Math.max(prev.end, end);
    } else {
      ws.push({word: t.text.trim(), start, end: Math.max(end, start)});
    }
  }
  return fixOrder(ws);
}

async function transcribeOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Set OPENAI_API_KEY in your environment to use --engine openai.');
  step('Sending audio to the OpenAI Whisper API');
  const mp3 = path.join(cacheDir, `${name}.mp3`);
  await ffmpeg(['-i', wav, '-c:a', 'libmp3lame', '-b:a', '48k', mp3]);
  if (fs.statSync(mp3).size > 24 * 1024 * 1024)
    throw new Error('Audio is over the API limit of 25MB (about 70 minutes).');

  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(mp3)], {type: 'audio/mpeg'}), `${name}.mp3`);
  form.append('model', flags['openai-model'] ?? 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('timestamp_granularities[]', 'segment');
  if (language) form.append('language', language);
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`},
    body: form,
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const j = await res.json();

  // The API's word list has no punctuation, which we need for sentences, commas and
  // questions. Put it back by lining the words up with the punctuated full text.
  const surface = String(j.text ?? '')
    .split(/\s+/)
    .filter(Boolean);
  const bare = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}%$£€]/gu, '');
  let p = 0;
  const ws = (j.words ?? []).map((w) => {
    for (let k = p; k < Math.min(p + 5, surface.length); k++) {
      if (bare(surface[k]) === bare(w.word)) {
        p = k + 1;
        return {word: surface[k], start: w.start, end: w.end};
      }
    }
    return {word: w.word.trim(), start: w.start, end: w.end};
  });
  return fixOrder(ws);
}

function fixOrder(ws) {
  const out = ws.filter((w) => w.word).sort((a, b) => a.start - b.start);
  for (let i = 0; i < out.length; i++) {
    const next = out[i + 1];
    if (next && out[i].end > next.start) out[i].end = next.start;
    if (out[i].end < out[i].start + 0.04) out[i].end = out[i].start + 0.04;
  }
  return out;
}

async function detectSilence(file, db) {
  const {err} = await ffmpeg(['-i', file, '-af', `silencedetect=noise=${db}dB:d=0.25`, '-f', 'null', '-']);
  const out = [];
  let open = null;
  for (const line of err.split('\n')) {
    const s = line.match(/silence_start: ([\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+)/);
    if (s) open = Number(s[1]);
    if (e && open !== null) {
      out.push({start: open, end: Number(e[1])});
      open = null;
    }
  }
  return out;
}

function tighten(ws, silences) {
  return ws.map((w) => {
    let {start, end} = w;
    for (const s of silences) {
      // Word runs on into a pause: end it where the pause starts.
      if (s.start > start + 0.08 && s.start < end) end = s.start;
      // Word "starts" inside a pause: start it where the pause ends.
      if (s.start <= start && s.end > start && s.end < end - 0.08) start = s.end;
    }
    return {...w, start, end};
  });
}
