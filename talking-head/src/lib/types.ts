// Shapes shared by the transcript script, the planner and the composition.

// One entry per spoken word, times in seconds on the raw footage. This is what
// scripts/transcribe.mjs writes to public/clips/<clip>.words.json.
export type Word = {word: string; start: number; end: number};

export type LineStyle = 'opinion' | 'fact' | 'plain';

// Optional hand edits, public/clips/<clip>.edit.json. Everything is optional.
export type EditFile = {
  // Force a line's style. `match` is any chunk of the sentence's text (case and punctuation ignored).
  lines?: {match: string; style: LineStyle}[];
  // Words or phrases to force pink ("ten times"), or to stop being pink ("one").
  stats?: {add?: string[]; remove?: string[]};
  // 'auto' (default), or pick the moments yourself: a chunk of the line, or a time on the raw footage.
  zooms?: 'auto' | ({match: string} | {at: number})[];
  // Chunks of raw footage to drop (fluffs, retakes), in seconds on the raw footage.
  cut?: {from: number; to: number}[];
  // End card call to action for this clip.
  cta?: string;
  // Extra words that flag an opinion line for this clip.
  emphasisWords?: string[];
};

export type Segment = {srcFrom: number; outFrom: number; frames: number}; // frames

export type Framing = 'wide' | 'tight' | 'zoom';

export type Shot = {from: number; to: number; framing: Framing}; // output frames

export type CaptionWord = {text: string; start: number; end: number; pink: boolean}; // output seconds

export type Phrase = {start: number; end: number; font: 'mono' | 'serif'; words: CaptionWord[]};

export type Zoom = {
  from: number; // output frame the push starts
  to: number; // output frame it ends (always on a cut)
  baseScale: number; // framing it pushes from, so there's no jump
  spark: boolean; // also draw the small spark line
};

export type SentenceInfo = {
  text: string;
  words: {text: string; pink: boolean}[];
  srcStart: number;
  outStart: number;
  style: LineStyle;
  reason: string;
  score: number;
  zoom: boolean;
};

export type Plan = {
  segments: Segment[];
  shots: Shot[];
  phrases: Phrase[];
  zooms: Zoom[];
  sentences: SentenceInfo[];
  frames: number; // length of the talking part in frames
  cta: string | null;
};
