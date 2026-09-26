// ─────────────────────────────────────────────────────────────
//  RUGBY TRY: all the knobs live here.
//  Every time is in SECONDS from the start of the video.
//  Change a number, re-render, done.
// ─────────────────────────────────────────────────────────────

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450, // 15s
};

export const TIMING = {
  // 0 to 1s: establish the pitch and the scoreboard
  establishEnd: 1.0, // camera swoop finishes, player sets off

  // 1 to 6s: the run
  runStart: 1.0,
  sidestepAt: 3.0, // player plants and steps off the other foot
  sidestepDuration: 0.4,
  defenderLungeAt: 3.12, // first defender buys the dummy
  chaserEnterAt: 4.1, // cover defender sprints in from the left
  chaserDiveAt: 5.45, // ...and dives, too late
  runEnd: 6.0,
  diveCameraSwing: 5.7, // camera swings round to the side for the dive...
  diveCameraSwingEnd: 6.35, // ...and settles here

  // 6 to 7.5s: the try
  diveStart: 6.0, // plant and launch
  diveTakeoff: 6.12, // feet leave the ground
  diveLand: 6.42, // chest hits the grass
  touchdown: 6.45, // ball pressed down in the in-goal area
  tryTextIn: 6.5,
  plusFiveIn: 6.72,
  scoreToFiveStart: 6.85,

  // 7.5 to 9.5s: quick transition, then set up the conversion
  wipeToConversion: 7.5, // wipe starts; scene swaps at the halfway point
  wipeDuration: 0.5,
  guideLineIn: 8.2, // dashed line shows the kick is lined up with the try

  // 9.5 to 12s: the conversion
  runUpStart: 9.5,
  kickAt: 10.25, // boot meets ball
  ballOverPosts: 10.95, // ball crosses the posts (between them, above the bar)
  ballLands: 11.75,
  plusTwoIn: 11.0,
  scoreToSevenStart: 11.2,

  // 12 to 15s: celebrate and hold
  wipeToCelebration: 11.85,
  celebrateStart: 12.1,
  confettiStart: 12.1,
  pulseStart: 12.25,
  pulseCount: 3,
  pulseEnd: 13.8,
  endHoldStart: 14.0, // everything settles; the last second is a still frame

  // shared
  scoreTickStep: 0.08, // gap between each number as the score counts up
};

// Palette, taken from the player reference sheet.
export const PALETTE = {
  kit: '#0F1113',
  shadow: '#2A2D31',
  mid: '#5E6368',
  skin: '#D1A27A',
  white: '#F2F2F2',
  accent: '#A6E222',
};

// Scene colours. Night match under floodlights.
export const COLORS = {
  outline: PALETTE.kit,
  skyTop: '#070A12',
  skyBottom: '#141B2C',
  haze: '#BFD4FF',
  lamp: '#FFF9E6',
  grassA: '#46983F',
  grassB: '#3E8B39',
  inGoalA: '#3A8436',
  inGoalB: '#347A31',
  surround: '#2B6629',
  line: PALETTE.white,
  post: PALETTE.white,
  pad: PALETTE.kit,
  padBand: PALETTE.white,
  flag: PALETTE.accent,
  stand: '#121725',
  standRow: '#1A2133',
  roof: '#0B0E16',
  board: ['#1B1F27', '#2A2D31'],
  crowd: ['#5E6368', '#8A9099', '#F2F2F2', '#3C4250', '#A6B0BF', '#C9CDD3'],
  ball: PALETTE.white,
  ballStripe: PALETTE.mid,
  tee: PALETTE.accent,
  accent: PALETTE.accent,
  white: PALETTE.white,
  dark: PALETTE.kit,
  panel: PALETTE.shadow,
  mid: PALETTE.mid,
};

// Home: all black, white-hooped socks (as on the reference sheet).
// Away: all white, so they read clearly against it.
export const KITS = {
  home: {
    shirt: PALETTE.kit,
    shirtLit: PALETTE.shadow,
    shirtShade: '#050607',
    collar: PALETTE.shadow,
    numberColor: PALETTE.white,
    shorts: PALETTE.kit,
    shortsShade: '#050607',
    socks: PALETTE.kit,
    sockHoop: PALETTE.white,
    band: PALETTE.kit,
    skin: PALETTE.skin,
    skinShade: '#B3825C',
    hair: PALETTE.kit,
    number: '10',
  },
  away: {
    shirt: PALETTE.white,
    shirtLit: '#FFFFFF',
    shirtShade: '#C4C9D0',
    collar: PALETTE.mid,
    numberColor: PALETTE.kit,
    shorts: PALETTE.white,
    shortsShade: '#C4C9D0',
    socks: PALETTE.white,
    sockHoop: PALETTE.kit,
    band: PALETTE.white,
    skin: '#9C6B48',
    skinShade: '#7C5134',
    hair: PALETTE.kit,
    number: '7',
  },
  away2: {
    shirt: PALETTE.white,
    shirtLit: '#FFFFFF',
    shirtShade: '#C4C9D0',
    collar: PALETTE.mid,
    numberColor: PALETTE.kit,
    shorts: PALETTE.white,
    shortsShade: '#C4C9D0',
    socks: PALETTE.white,
    sockHoop: PALETTE.kit,
    band: PALETTE.white,
    skin: '#E2B690',
    skinShade: '#C39269',
    hair: '#4A3222',
    number: '14',
  },
};

export type Kit = typeof KITS.home;

// World layout, in metres. z runs up the pitch towards the posts.
export const PITCH = {
  tryLineZ: 40,
  deadBallZ: 50,
  twentyTwoZ: 18,
  tenMetreZ: 0,
  halfwayZ: -10,
  touchX: 35,
  postHalfGap: 2.8, // posts are 5.6m apart
  crossbarY: 3,
  postTopY: 10.5,
  tryX: 0.4, // where the try is scored (and so where the conversion is taken from)
  conversionDistance: 15, // metres back from the try line
};

// A little exaggeration so people and ball read well on a phone.
export const CHAR_SCALE = 1.3; // metres per 100 sprite units
export const BALL_SCALE = 1.6;

export const sec = (s: number) => s * VIDEO.fps;
