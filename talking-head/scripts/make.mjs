#!/usr/bin/env node
// Both steps in one go: raw video in, finished clip out.
//
//   npm run make -- ~/Downloads/raw.mp4 [--name my-clip] [any transcribe flags]

import path from 'node:path';
import {ROOT, args, run, slug} from './lib/media.mjs';

const argv = process.argv.slice(2);
const {pos, flags} = args(argv, ['no-proxy', 'force']);
if (!pos[0]) {
  console.error('Usage: npm run make -- <video file> [--name my-clip]');
  process.exit(1);
}
const name = slug(flags.name ?? path.basename(pos[0]));
await run(process.execPath, [path.join(ROOT, 'scripts', 'transcribe.mjs'), ...argv], {quiet: false});
await run(process.execPath, [path.join(ROOT, 'scripts', 'plan.ts'), name], {quiet: false});
await run(process.execPath, [path.join(ROOT, 'scripts', 'render.mjs'), name], {quiet: false});
