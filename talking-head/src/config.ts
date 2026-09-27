// Every knob for the look and the edit lives here. The <TalkingHead> composition takes
// any of these as props, so you can override per clip without touching the components.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export type Brand = {
  pink: string; // Signal pink: stats, the spark line
  ink: string; // near-black: stinger, end card, caption pill
  white: string; // caption text
};

export const BRAND: Brand = {
  pink: '#C4197C',
  ink: '#0F0E14',
  white: '#F2F0F2',
};

export type Fonts = {
  judgement: string; // opinion / provocation lines (serif italic)
  measurement: string; // default captions, stats, labels (mono)
};

// These two families are bundled (see src/fonts.ts). Swap in any family you load yourself.
export const FONTS: Fonts = {
  judgement: 'Spectral',
  measurement: 'IBM Plex Mono',
};

export type CaptionConfig = {
  maxWords: number; // most words on screen at once
  maxChars: number; // soft limit so a phrase fits on one line
  bottom: number; // px from the bottom of the frame to the bottom of the caption
  monoSize: number; // px, mono captions
  serifSize: number; // px, serif italic captions (a touch bigger, the face runs small)
  reveal: 'word' | 'phrase'; // words appear as spoken, or the whole phrase at once
  pill: boolean; // dark pill behind the text (false = drop shadow only)
  pauseBreak: number; // s, a pause this long between words starts a new phrase
  linger: number; // s, how long a phrase stays up after its last word if nothing follows
};

export const CAPTIONS: CaptionConfig = {
  maxWords: 4,
  maxChars: 30,
  bottom: 120,
  monoSize: 52,
  serifSize: 62,
  reveal: 'phrase',
  pill: true,
  pauseBreak: 0.45,
  linger: 0.4,
};

export type CutConfig = {
  minSilence: number; // s, gaps between words longer than this are cut out
  padBefore: number; // s, kept before the first word after a cut
  padAfter: number; // s, kept after the last word before a cut
  maxShot: number; // s, longest run of unbroken talking before a framing cut
  minShot: number; // s, never cut shots shorter than this
  punchScale: number; // scale of the tighter framing used on alternate jump cuts
  audioFade: number; // frames of audio fade at each cut, stops clicks
};

export const CUTS: CutConfig = {
  minSilence: 0.35,
  padBefore: 0.08,
  padAfter: 0.14,
  maxShot: 3,
  minShot: 1.2,
  punchScale: 1.035,
  audioFade: 2,
};

export type ZoomConfig = {
  count: number | 'auto'; // 'auto' = 1 per ~28s of finished clip, capped at 3
  maxScale: number; // 1.06 to 1.08
  ramp: number; // s, slow push-in
  minGap: number; // s, never two zooms closer than this
  minScore: number; // a line must score this high to earn a zoom (see src/lib/plan.ts)
  focusY: number; // 0..1, vertical point the zoom pushes towards (faces sit high in frame)
  sparks: number; // how many zoom moments also get the small spark line (0 to switch off)
};

export const ZOOM: ZoomConfig = {
  count: 'auto',
  maxScale: 1.07,
  ramp: 1.4,
  minGap: 15,
  minScore: 3,
  focusY: 0.38,
  sparks: 1,
};

export type CardConfig = {
  stinger: number; // s, opening spark draw (1s max per brand)
  endCard: number; // s, end card length
  endFade: number; // s, end card fade in
  cta: string; // one-line call to action on the end card
};

export const CARDS: CardConfig = {
  stinger: 1,
  endCard: 3,
  endFade: 0.6,
  cta: 'witsandwatts.ai',
};

// Words that flag a sharp opinion. A line containing one gets the serif italic
// (unless it has a stat in it, facts win). Add your own verbal tics here.
export const EMPHASIS_WORDS = [
  'never',
  'always',
  'nobody',
  'everyone',
  'stop',
  'wrong',
  'myth',
  'truth',
  'honestly',
  'actually',
  'mistake',
  'waste',
  'pointless',
  'broken',
  'hype',
];
