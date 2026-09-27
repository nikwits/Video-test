// Turns a word-level transcript into an edit: which bits of footage to keep, where the
// jump cuts land, what the captions say and how they're styled, and where the few
// zoom moments go. Pure functions, no React, so scripts/plan.ts can print the same plan.

import type {
  CaptionWord,
  EditFile,
  Framing,
  LineStyle,
  Phrase,
  Plan,
  Segment,
  SentenceInfo,
  Shot,
  Word,
  Zoom,
} from './types.ts';

export type PlanConfig = {
  fps: number;
  cuts: {
    minSilence: number;
    padBefore: number;
    padAfter: number;
    maxShot: number;
    minShot: number;
    punchScale: number;
  };
  captions: {maxWords: number; maxChars: number; pauseBreak: number; linger: number};
  zoom: {
    count: number | 'auto';
    maxScale: number;
    ramp: number;
    minGap: number;
    minScore: number;
    sparks: number;
  };
  emphasisWords: string[];
};

// ---------- text helpers ----------

const clean = (w: string) =>
  w
    .toLowerCase()
    .replace(/[“”"'‘’.,!?;:()\[\]…]/g, '')
    .replace(/[—–]/g, '')
    .trim();

const norm = (s: string) => s.split(/\s+/).map(clean).filter(Boolean).join(' ');

const endsSentence = (w: string) => /[.?!…]["'”’)]*$/.test(w.trim());
const endsClause = (w: string) => /[,;:—–-]["'”’)]*$/.test(w.trim());

// ---------- stat detection ----------

const NUMBER_WORDS = new Set(
  (
    'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen ' +
    'sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety ' +
    'hundred thousand million billion trillion half double twice triple tenfold hundredfold'
  ).split(' '),
);

const UNITS = new Set(
  (
    'percent x times fold hundred thousand million billion trillion k ' +
    'hours hour days day weeks week months month years year minutes minute seconds ' +
    'people staff customers clients pounds dollars euros bucks grand points'
  ).split(' '),
);

const isHardStat = (raw: string) => {
  const w = clean(raw);
  return /\d/.test(raw) || /[$£€%]/.test(raw) || w === 'percent';
};

/** Marks the words that are numbers, stats or proof points. */
export const markStats = (words: string[], edit: EditFile['stats'] = {}): boolean[] => {
  const c = words.map(clean);
  const pink = words.map(isHardStat);

  // A number word only counts when a unit follows it ("ten times", "forty percent"),
  // otherwise "one of the things" would light up everywhere.
  for (let i = 0; i < c.length; i++) {
    if (NUMBER_WORDS.has(c[i]) && UNITS.has(c[i + 1] ?? '')) pink[i] = true;
  }
  // Pull the unit words along with a stat: "40 per cent", "3 x", "$2 million".
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < c.length - 1; i++) {
      if (pink[i] && UNITS.has(c[i + 1])) pink[i + 1] = true;
    }
  }
  // "40 per cent"
  for (let i = 0; i < c.length - 2; i++) {
    if (pink[i] && c[i + 1] === 'per' && c[i + 2] === 'cent') pink[i + 1] = pink[i + 2] = true;
  }

  const apply = (phrases: string[] | undefined, value: boolean) => {
    for (const p of phrases ?? []) {
      const target = norm(p).split(' ').filter(Boolean);
      if (!target.length) continue;
      for (let i = 0; i + target.length <= c.length; i++) {
        if (target.every((t, k) => c[i + k] === t)) {
          for (let k = 0; k < target.length; k++) pink[i + k] = value;
        }
      }
    }
  };
  apply(edit.add, true);
  apply(edit.remove, false);
  return pink;
};

// ---------- the edit ----------

type Range = {from: number; to: number};

const subtract = (ranges: Range[], cuts: Range[]): Range[] => {
  let out = ranges;
  for (const cut of cuts) {
    const next: Range[] = [];
    for (const r of out) {
      if (cut.to <= r.from || cut.from >= r.to) {
        next.push(r);
        continue;
      }
      if (cut.from > r.from) next.push({from: r.from, to: cut.from});
      if (cut.to < r.to) next.push({from: cut.to, to: r.to});
    }
    out = next;
  }
  return out;
};

/** Keeps the talking, drops the dead air. Returns kept ranges on the raw footage. */
export const keepRanges = (words: Word[], cfg: PlanConfig, manualCuts: Range[] = []): Range[] => {
  const {minSilence, padBefore, padAfter} = cfg.cuts;
  const islands: Range[] = [];
  for (const w of words) {
    const last = islands[islands.length - 1];
    if (last && w.start - last.to <= minSilence) last.to = Math.max(last.to, w.end);
    else islands.push({from: w.start, to: w.end});
  }
  const padded = islands.map((r) => ({from: Math.max(0, r.from - padBefore), to: r.to + padAfter}));
  // Where padding overlaps a neighbour, meet in the middle of the gap.
  for (let i = 1; i < padded.length; i++) {
    if (padded[i].from < padded[i - 1].to) {
      const mid = (islands[i - 1].to + islands[i].from) / 2;
      padded[i - 1].to = mid;
      padded[i].from = mid;
    }
  }
  return subtract(padded, manualCuts).filter((r) => r.to - r.from > 0.05);
};

const toSegments = (ranges: Range[], fps: number): Segment[] => {
  const segs: Segment[] = [];
  let out = 0;
  for (const r of ranges) {
    const srcFrom = Math.round(r.from * fps);
    const frames = Math.round(r.to * fps) - srcFrom;
    if (frames <= 0) continue;
    segs.push({srcFrom, outFrom: out, frames});
    out += frames;
  }
  return segs;
};

/** Raw-footage seconds to finished-clip seconds (times inside a cut snap to the next kept frame). */
export const makeMapper = (segs: Segment[], fps: number) => (t: number) => {
  const f = t * fps;
  for (const s of segs) {
    if (f < s.srcFrom) return s.outFrom / fps;
    if (f <= s.srcFrom + s.frames) return (s.outFrom + (f - s.srcFrom)) / fps;
  }
  const last = segs[segs.length - 1];
  return last ? (last.outFrom + last.frames) / fps : 0;
};

// ---------- sentences and styles ----------

type Sentence = {words: Word[]; pink: boolean[]; style: LineStyle; reason: string; score: number};

const splitSentences = (words: Word[]): Word[][] => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const longPause = next ? next.start - w.end > 1.5 : false;
    if (endsSentence(w.word) || longPause || !next) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
};

const classify = (words: Word[], edit: EditFile, cfg: PlanConfig): Sentence => {
  const text = words.map((w) => w.word).join(' ');
  const n = norm(text);
  const pinkAuto = markStats(
    words.map((w) => w.word),
    edit.stats,
  );
  const hasStat = pinkAuto.some(Boolean);
  const question = /\?["'”’)]*$/.test(text.trim());
  const emphasis = [...cfg.emphasisWords, ...(edit.emphasisWords ?? [])].map(clean);
  const hits = n.split(' ').filter((w) => emphasis.includes(w));

  let style: LineStyle;
  let reason: string;
  const override = (edit.lines ?? []).find((l) => norm(l.match) && n.includes(norm(l.match)));
  if (override) {
    style = override.style;
    reason = 'your edit';
  } else if (hasStat) {
    style = 'fact';
    reason = 'has a number';
  } else if (question) {
    style = 'opinion';
    reason = 'question';
  } else if (hits.length) {
    style = 'opinion';
    reason = `says "${hits[0]}"`;
  } else {
    style = 'plain';
    reason = '';
  }

  // Opinion lines are all serif (no mono stats mixed in). Plain lines have no pink.
  const pink = style === 'fact' ? pinkAuto : words.map(() => false);

  // How much a line deserves one of the rare zoom moments.
  let score = 0;
  if (style === 'opinion') score += 2;
  if (override && style !== 'plain') score += 1;
  if (question) score += 1;
  score += Math.min(2, hits.length);
  if (style === 'fact') score += 2;
  if (words.length <= 12) score += 1;
  if (words.length > 25) score -= 1;
  return {words, pink, style, reason, score};
};

// ---------- captions ----------

const balanced = <T>(items: T[], parts: number): T[][] => {
  const out: T[][] = [];
  let i = 0;
  for (let p = 0; p < parts; p++) {
    const size = Math.ceil((items.length - i) / (parts - p));
    out.push(items.slice(i, i + size));
    i += size;
  }
  return out.filter((c) => c.length);
};

const chunkLen = (ws: Word[]) => ws.map((w) => w.word).join(' ').length;

const phrasesFor = (s: Sentence, cfg: PlanConfig) => {
  const {maxWords, maxChars, pauseBreak} = cfg.captions;
  const idx = s.words.map((_, i) => i);
  // Clauses: break at commas and at audible pauses.
  const clauses: number[][] = [];
  let cur: number[] = [];
  idx.forEach((i) => {
    cur.push(i);
    const w = s.words[i];
    const next = s.words[i + 1];
    if (!next || endsClause(w.word) || next.start - w.end > pauseBreak) {
      clauses.push(cur);
      cur = [];
    }
  });
  // Then into balanced chunks that fit the word and width limits.
  const chunks: number[][] = [];
  for (const cl of clauses) {
    let parts = Math.ceil(cl.length / maxWords);
    let split = balanced(cl, parts);
    while (parts < cl.length && split.some((c) => chunkLen(c.map((i) => s.words[i])) > maxChars)) {
      parts++;
      split = balanced(cl, parts);
    }
    chunks.push(...split);
  }
  return chunks;
};

// ---------- the whole plan ----------

export const buildPlan = (rawWords: Word[], edit: EditFile, cfg: PlanConfig): Plan => {
  const {fps} = cfg;
  const manualCuts = (edit.cut ?? []).map((c) => ({from: c.from, to: c.to}));
  const inCut = (w: Word) => manualCuts.some((c) => (w.start + w.end) / 2 >= c.from && (w.start + w.end) / 2 <= c.to);
  const words = rawWords
    .map((w) => ({word: w.word.trim(), start: w.start, end: Math.max(w.end, w.start + 0.05)}))
    .filter((w) => w.word && !inCut(w))
    .sort((a, b) => a.start - b.start);

  const segments = toSegments(keepRanges(words, cfg, manualCuts), fps);
  const frames = segments.reduce((a, s) => a + s.frames, 0);
  const map = makeMapper(segments, fps);
  const outDur = frames / fps;

  const sentences = splitSentences(words).map((ws) => classify(ws, edit, cfg));

  // Captions
  const phrases: Phrase[] = [];
  for (const s of sentences) {
    for (const chunk of phrasesFor(s, cfg)) {
      const cw: CaptionWord[] = chunk.map((i) => ({
        text: s.words[i].word,
        start: map(s.words[i].start),
        end: map(s.words[i].end),
        pink: s.pink[i],
      }));
      phrases.push({
        start: cw[0].start,
        end: cw[cw.length - 1].end,
        font: s.style === 'opinion' ? 'serif' : 'mono',
        words: cw,
      });
    }
  }
  phrases.forEach((p, i) => {
    const next = phrases[i + 1];
    const hold = p.end + cfg.captions.linger;
    p.end = next ? Math.min(Math.max(p.end, next.start), hold, next.start) : Math.min(hold, outDur);
    if (next && next.start - p.end < 0.12) p.end = next.start; // no flicker between phrases
  });

  // Jump cuts: every removed silence is a cut, and long runs get a framing cut so
  // nothing plays unbroken for more than maxShot seconds.
  const bounds = new Set<number>(segments.slice(1).map((s) => s.outFrom));
  const gapPoints = words.slice(0, -1).map((w, i) => {
    const next = words[i + 1];
    const t = (map(w.end) + map(next.start)) / 2;
    const pri = endsSentence(w.word) ? 3 : endsClause(w.word) ? 2 : 1;
    return {f: Math.round(t * fps), pri, gap: next.start - w.end};
  });
  for (const seg of segments) {
    let cur = seg.outFrom;
    const end = seg.outFrom + seg.frames;
    while (end - cur > cfg.cuts.maxShot * fps) {
      const lo = cur + cfg.cuts.minShot * fps;
      const hi = Math.min(cur + cfg.cuts.maxShot * fps, end - cfg.cuts.minShot * fps);
      const cands = gapPoints.filter((g) => g.f >= lo && g.f <= hi);
      const best = cands.sort((a, b) => b.pri - a.pri || b.gap - a.gap || b.f - a.f)[0];
      const f = best ? best.f : Math.round(cur + cfg.cuts.maxShot * fps);
      if (f >= end) break;
      bounds.add(f);
      cur = f;
    }
  }
  const cuts = [0, ...[...bounds].sort((a, b) => a - b), frames];

  // Zoom moments: the highest-scoring lines, spaced out, and only if they earn it.
  const sInfo = sentences.map((s) => ({s, start: map(s.words[0].start), end: map(s.words[s.words.length - 1].end)}));
  const target = cfg.zoom.count === 'auto' ? Math.max(1, Math.min(3, Math.round(outDur / 28))) : cfg.zoom.count;
  let picked: typeof sInfo = [];
  if (edit.zooms && edit.zooms !== 'auto') {
    for (const z of edit.zooms) {
      const hit =
        'match' in z
          ? sInfo.find((x) => norm(x.s.words.map((w) => w.word).join(' ')).includes(norm(z.match)))
          : (sInfo.find((x) => x.s.words[0].start <= z.at && x.s.words[x.s.words.length - 1].end >= z.at) ??
            sInfo.find((x) => x.s.words[0].start >= z.at));
      if (hit && !picked.includes(hit)) picked.push(hit);
    }
  } else {
    const ranked = sInfo
      .filter((x) => x.start > 3 && x.s.score >= cfg.zoom.minScore)
      .sort((a, b) => b.s.score - a.s.score || a.start - b.start);
    for (const x of ranked) {
      if (picked.length >= target) break;
      if (picked.every((p) => Math.abs(p.start - x.start) >= cfg.zoom.minGap)) picked.push(x);
    }
  }
  const sparkSet = new Set([...picked].sort((a, b) => b.s.score - a.s.score).slice(0, cfg.zoom.sparks));
  picked.sort((a, b) => a.start - b.start);

  // Build shots with framing. Zooms push in from wherever the framing is and
  // reset on the first cut after the line ends, so the reset hides in the cut.
  const windows = picked.map((x) => {
    const from = Math.max(0, Math.round((x.start - 0.15) * fps));
    // Long enough to finish the push and sit on it for a beat.
    const endF = Math.max(Math.round(x.end * fps), from + Math.round((cfg.zoom.ramp + 1) * fps));
    const to = cuts.find((c) => c >= endF) ?? frames;
    return {from, to, spark: sparkSet.has(x)};
  });
  const shots: Shot[] = [];
  let flip: Framing = 'wide';
  for (let i = 0; i < cuts.length - 1; i++) {
    const from = cuts[i];
    const to = cuts[i + 1];
    if (to <= from) continue;
    const inZoom = windows.some((w) => from >= w.from && from < w.to);
    let framing: Framing;
    if (inZoom) framing = 'zoom';
    else if (windows.some((w) => w.to === from))
      framing = 'wide'; // land wide after a zoom
    else framing = i === 0 ? 'wide' : flip === 'wide' ? 'tight' : 'wide';
    if (framing !== 'zoom') flip = framing;
    // A shot that runs into a zoom stays one shot: the push starts mid-shot.
    shots.push({from, to, framing});
  }
  const zooms: Zoom[] = windows.map((w) => {
    const host = shots.find((s) => s.from <= w.from && s.to > w.from);
    const base = host && host.framing === 'tight' ? cfg.cuts.punchScale : 1;
    return {from: w.from, to: w.to, baseScale: base, spark: w.spark};
  });

  const zoomSentences = new Set(picked.map((p) => p.s));
  const info: SentenceInfo[] = sInfo.map((x) => ({
    text: x.s.words.map((w) => w.word).join(' '),
    words: x.s.words.map((w, i) => ({text: w.word, pink: x.s.pink[i]})),
    srcStart: x.s.words[0].start,
    outStart: x.start,
    style: x.s.style,
    reason: x.s.reason,
    score: x.s.score,
    zoom: zoomSentences.has(x.s),
  }));

  return {segments, shots, phrases, zooms, sentences: info, frames, cta: edit.cta ?? null};
};

/** Scale for an output frame of the talking part: jump-cut framing plus any slow zoom. */
export const scaleAt = (plan: Plan, frame: number, punchScale: number, maxScale: number, rampFrames: number) => {
  const z = plan.zooms.find((z) => frame >= z.from && frame < z.to);
  if (z) {
    const p = Math.min(1, (frame - z.from) / rampFrames);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // easeInOutCubic
    return z.baseScale + (maxScale - z.baseScale) * e;
  }
  const shot = plan.shots.find((s) => frame >= s.from && frame < s.to);
  return shot && shot.framing === 'tight' ? punchScale : 1;
};
