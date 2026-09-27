#!/usr/bin/env node
// Builds public/clips/demo.mp4: stand-in footage with a tone wherever a word in
// demo.words.json is "spoken". Lets you try the whole pipeline without real footage.
//
//   npm run demo && npm run render -- demo

import fs from 'node:fs';
import path from 'node:path';
import {ROOT, ffmpeg, remotion} from './lib/media.mjs';

const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/clips/demo.words.json'), 'utf8'));
const cache = path.join(ROOT, '.cache');
fs.mkdirSync(cache, {recursive: true});
const silent = path.join(cache, 'demo-silent.mp4');

const cli = ['render', 'src/index.ts', 'DemoFootage', silent, '--muted'];
const browser =
  process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(browser)) cli.push(`--browser-executable=${browser}`);
console.log('Rendering stand-in footage');
await remotion(cli, {quiet: false});

// Tone on while talking, silent in the gaps, so the dead-air cuts are audible.
const spans = [];
for (const w of words) {
  const last = spans[spans.length - 1];
  if (last && w.start - last[1] < 0.12) last[1] = w.end;
  else spans.push([w.start, w.end]);
}
const gate = spans.map(([a, b]) => `between(t,${a},${b})`).join('+');
const duration = words[words.length - 1].end + 1.5;
console.log('Adding the tone track');
await ffmpeg([
  '-i',
  silent,
  '-f',
  'lavfi',
  '-i',
  `sine=frequency=196:sample_rate=48000:duration=${duration}`,
  '-filter:a',
  `volume='if(${gate},0.2,0)':eval=frame`,
  '-map',
  '0:v',
  '-map',
  '1:a',
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-shortest',
  path.join(ROOT, 'public/clips/demo.mp4'),
]);
console.log('Done: public/clips/demo.mp4. Now: npm run render -- demo');
