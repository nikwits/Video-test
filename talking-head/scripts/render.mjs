#!/usr/bin/env node
// Step 2: render the finished clip.
//
//   npm run render -- <clip> [--out out/<clip>.mp4] [--props '{"zoom":{"maxScale":1.06}}'] [--frames 0-299]
//
// <clip> is the name the transcribe step printed (public/clips/<clip>.mp4 + .words.json).
// --props is merged over the defaults in src/config.ts, handy for one-off tweaks.

import fs from 'node:fs';
import path from 'node:path';
import {ROOT, args, remotion} from './lib/media.mjs';

const {pos, flags} = args(process.argv.slice(2));
const clip = pos[0];
if (!clip) {
  console.error('Usage: npm run render -- <clip> [--out file.mp4] [--props JSON]');
  process.exit(1);
}
for (const f of [`${clip}.mp4`, `${clip}.words.json`]) {
  if (!fs.existsSync(path.join(ROOT, 'public', 'clips', f))) {
    console.error(`Missing public/clips/${f}. Run: npm run transcribe -- <video> --name ${clip}`);
    process.exit(1);
  }
}

const out = flags.out ?? path.join('out', `${clip}.mp4`);
const props = {...(flags.props ? JSON.parse(flags.props) : {}), clip};
const cli = ['render', 'src/index.ts', 'TalkingHead', out, `--props=${JSON.stringify(props)}`];
if (flags.frames) cli.push(`--frames=${flags.frames}`);
// Use a local headless Chrome if one is set or pre-installed, otherwise Remotion fetches its own.
const browser =
  process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(browser)) cli.push(`--browser-executable=${browser}`);

console.log(`Rendering ${clip} -> ${out}`);
await remotion(cli, {quiet: false});
console.log(`\nDone: ${out}`);
