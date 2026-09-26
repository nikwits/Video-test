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

// Colours. Flat, bold, friendly.
export const COLORS = {
  outline: '#1A1A2E',
  skyTop: '#5EC4F7',
  skyBottom: '#A8E3FF',
  cloud: '#FFFFFF',
  grassA: '#4CB944',
  grassB: '#43A83C',
  inGoalA: '#3E9E54',
  inGoalB: '#37914B',
  surround: '#3A8F36',
  line: '#FFFFFF',
  post: '#FFFFFF',
  padBlue: '#1E6FE8',
  padYellow: '#FFD23F',
  stand: '#2D3561',
  standRow: '#3A4478',
  roof: '#1F2447',
  board: ['#FFD23F', '#FF5A5F', '#1E6FE8', '#FFFFFF'],
  crowd: ['#1E6FE8', '#FFFFFF', '#FF5A5F', '#FFD23F', '#1E6FE8', '#8ED1FC'],
  ball: '#FFF8EC',
  ballStripe: '#E63946',
  tee: '#FF8C1A',
  yellow: '#FFD60A',
  blue: '#1E6FE8',
  red: '#E63946',
  white: '#FFFFFF',
};

export const KITS = {
  home: {
    shirt: '#1E6FE8',
    shirtShade: '#1558BF',
    trim: '#FFFFFF',
    shorts: '#FFFFFF',
    socks: '#1E6FE8',
    sockHoop: '#FFFFFF',
    skin: '#F2C29B',
    hair: '#4A2E1E',
    number: '10',
  },
  away: {
    shirt: '#E63946',
    shirtShade: '#BF2A36',
    trim: '#FFFFFF',
    shorts: '#1A1A2E',
    socks: '#E63946',
    sockHoop: '#1A1A2E',
    skin: '#C98B5E',
    hair: '#1A1A2E',
    number: '7',
  },
  away2: {
    shirt: '#E63946',
    shirtShade: '#BF2A36',
    trim: '#FFFFFF',
    shorts: '#1A1A2E',
    socks: '#E63946',
    sockHoop: '#1A1A2E',
    skin: '#8D5A3B',
    hair: '#1A1A2E',
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

// Cartoon exaggeration so people and ball read well on a phone.
export const CHAR_SCALE = 1.25; // metres per 100 sprite units
export const BALL_SCALE = 1.9;

export const sec = (s: number) => s * VIDEO.fps;
