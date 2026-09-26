// Renders the quality-check stills to out/still-<frame>.png
// Usage: node scripts/stills.mjs [frame ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const list = frames.length ? frames : [30, 150, 200, 260, 330, 420];
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'RugbyTry', browserExecutable});
for (const frame of list) {
  const output = path.resolve(`out/still-${String(frame).padStart(3, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, browserExecutable});
  console.log('rendered', output);
}
