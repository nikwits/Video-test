// Prints the edit for a clip without rendering: every sentence with its caption
// style and why, the pink stat words, and the zoom moments. Use it to decide
// what to put in public/clips/<clip>.edit.json.
//
//   npm run plan -- <clip>

import fs from 'node:fs';
import path from 'node:path';
import {buildPlan} from '../src/lib/plan.ts';
import type {EditFile, Word} from '../src/lib/types.ts';
import {planConfig, resolve} from '../src/settings.ts';

const clip = process.argv[2];
if (!clip) {
  console.error('Usage: npm run plan -- <clip>');
  process.exit(1);
}
const dir = path.resolve(import.meta.dirname, '..', 'public', 'clips');
const words: Word[] = JSON.parse(fs.readFileSync(path.join(dir, `${clip}.words.json`), 'utf8'));
const editPath = path.join(dir, `${clip}.edit.json`);
const edit: EditFile = fs.existsSync(editPath) ? JSON.parse(fs.readFileSync(editPath, 'utf8')) : {};

const s = resolve({clip});
const plan = buildPlan(words, edit, planConfig(s));
const fps = 30;
const raw = words.length ? words[words.length - 1].end : 0;
const out = plan.frames / fps;

const mmss = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
console.log(`\n${clip}: ${mmss(raw)} of talking -> ${mmss(out)} after cutting dead air`);
console.log(
  `${plan.segments.length} pieces kept, ${plan.shots.length} shots (longest ${(
    Math.max(...plan.shots.map((x) => x.to - x.from)) / fps
  ).toFixed(1)}s), ${plan.zooms.length} zooms, ${plan.phrases.length} captions`,
);
console.log(`Final video with stinger and end card: ${mmss(out + s.cards.stinger + s.cards.endCard)}\n`);

const tag = {opinion: 'SERIF ', fact: 'STAT  ', plain: '      '} as const;
for (const line of plan.sentences) {
  const text = line.words.map((w) => (w.pink ? `[${w.text}]` : w.text)).join(' ');
  const why = line.reason ? `  (${line.reason})` : '';
  const zoom = line.zoom ? '  << ZOOM' : '';
  console.log(`${mmss(line.srcStart).padStart(6)}  ${tag[line.style]} ${text}${why}${zoom}`);
}
console.log(
  '\n[pink] = stat colour. Raw-footage times on the left, for "cut" and "zooms": [{"at": ...}] in the edit file.',
);
