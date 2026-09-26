import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame} from 'remotion';
import {BALL_SCALE, CHAR_SCALE, COLORS, KITS, PITCH, TIMING as T, VIDEO} from './config';
import {Camera, Vec3, groundLine, lerpCam, polyPath, project, vanishingPoint} from './engine/camera';
import {BallShape} from './characters/Ball';
import {
  Character,
  Expression,
  Rig,
  armsUp,
  kickBack,
  reachUp,
  runBack,
  runFront,
  standBack,
  standFront,
} from './characters/Character';
import {DIVER_LENGTH, Diver} from './characters/Diver';
import {Backdrop, Posts, Vignette} from './scene/World';
import {Confetti, Dust, Impact, Sparkle, SpeedLines, Wipe} from './scene/Effects';
import {Headline, Scoreboard, Tag} from './scene/Hud';

// ── helpers ──────────────────────────────────────────────────
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (t: number, t0: number, t1: number, v0: number, v1: number, e: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [t0, t1], [v0, v1], {...clamp, easing: e});
const bump = (t: number, t0: number, t1: number) => (t <= t0 || t >= t1 ? 0 : Math.sin(((t - t0) / (t1 - t0)) * Math.PI));
const UNIT = CHAR_SCALE / 100; // metres per sprite unit
const BALL_UNIT = (0.29 * BALL_SCALE) / 38; // metres per ball-sprite unit
const FLIGHT_BOOST = 2.5; // ball drawn bigger in the air so it reads at a distance

const SWAP_TO_CONVERSION = T.wipeToConversion + T.wipeDuration / 2;
const SWAP_TO_CELEBRATION = T.wipeToCelebration + T.wipeDuration / 2;

type Drawable = {depth: number; node: React.ReactNode};

// A sprite standing at a world position, scaled by perspective.
const sprite = (
  key: string,
  pos: Vec3,
  cam: Camera,
  node: React.ReactNode,
  opts: {rotate?: number; sx?: number; sy?: number} = {},
): Drawable => {
  const p = project(pos, cam);
  const k = p.s * UNIT;
  const {rotate = 0, sx = 1, sy = 1} = opts;
  return {
    depth: p.depth,
    node: (
      <g key={key} transform={`translate(${p.x},${p.y}) rotate(${rotate}) scale(${k * sx},${k * sy})`}>
        {node}
      </g>
    ),
  };
};

const shadow = (key: string, x: number, z: number, cam: Camera, r = 0.55, opacity = 0.28) => {
  const pts: Vec3[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push({x: x + Math.cos(a) * r, y: 0, z: z + Math.sin(a) * r * 0.55});
  }
  return <path key={key} d={polyPath(pts, cam)} fill="#0B3D0B" opacity={opacity} />;
};

const renderSorted = (items: Drawable[]) =>
  [...items].sort((a, b) => b.depth - a.depth).map((d) => d.node);

// ── the run & try: player motion ─────────────────────────────
const RUN_END_Z = 37.6;
const hipZ = (t: number) => {
  if (t <= T.runStart) return 0;
  if (t <= T.diveStart) return ease(t, T.runStart, T.diveStart, 0, RUN_END_Z, Easing.bezier(0.45, 0, 0.8, 0.8));
  if (t <= T.diveLand) return ease(t, T.diveStart, T.diveLand, RUN_END_Z, 40.4, Easing.bezier(0.2, 0.35, 0.6, 1));
  return ease(t, T.diveLand, T.diveLand + 0.5, 40.4, 41.0, Easing.out(Easing.cubic));
};
const START_X = 2.0;
const playerX = (t: number) => {
  const feintAt = T.sidestepAt - 0.25;
  if (t < feintAt) return START_X;
  if (t < T.sidestepAt) return ease(t, feintAt, T.sidestepAt, START_X, START_X + 0.5, Easing.inOut(Easing.sin));
  const stepEnd = T.sidestepAt + T.sidestepDuration;
  if (t < stepEnd) return ease(t, T.sidestepAt, stepEnd, START_X + 0.5, -1.3, Easing.out(Easing.cubic));
  return ease(t, stepEnd, T.diveStart, -1.3, PITCH.tryX, Easing.inOut(Easing.sin));
};
const velX = (t: number) => (playerX(t + 1 / 60) - playerX(t - 1 / 60)) * 30;

const DIVER_M = DIVER_LENGTH * UNIT;
const DIVER_HIP = 0.37 * DIVER_M;

// Orbit camera: sits `dist` metres from a target, swung round by `yaw`, looking at it.
const orbit = (target: Vec3, yaw: number, dist: number, height: number, cy: number): Camera => ({
  x: target.x - Math.sin(yaw) * dist,
  y: height,
  z: target.z - Math.cos(yaw) * dist,
  yaw,
  pitch: Math.atan2(height - target.y, dist),
  focal: 1600,
  cx: 540,
  cy,
});

// Follows the runner from behind, then swings round to a three-quarter
// angle for the dive so the body reads side-on.
const DIVE_YAW = 0.55;
const runCamera = (t: number): Camera => {
  const hip = hipZ(t);
  const k = ease(hip, 18, 37, 0, 1, Easing.inOut(Easing.quad));
  const swing = ease(t, T.diveCameraSwing, T.diveCameraSwingEnd, 0, 1, Easing.inOut(Easing.cubic));
  const x = playerX(Math.max(0, t - 0.1)) * (0.85 + 0.15 * swing);
  const target: Vec3 = {x, y: 1.1 - 0.6 * swing, z: hip + 0.3 * swing};
  const cam = orbit(target, DIVE_YAW * swing, 5.8 + 1.0 * k + 2.3 * swing, 3.2 + 1.3 * k + 0.5 * swing, 1080 - 20 * swing);
  cam.focal = 1600 + 420 * swing; // tighten up on the dive
  // punchy shake when the ball goes down
  const since = t - T.touchdown;
  if (since > 0 && since < 0.6) {
    const amp = 0.12 * Math.exp(-7 * since);
    cam.x += amp * Math.sin(since * 70);
    cam.y += amp * Math.cos(since * 55);
  }
  return cam;
};

const establishCamera = (t: number): Camera => {
  const start: Camera = {x: 1.2, y: 7.5, z: -9.5, yaw: 0, pitch: 0.45, focal: 1600, cx: 540, cy: 1000};
  const u = ease(t, 0, T.establishEnd, 0, 1, Easing.inOut(Easing.cubic));
  return lerpCam(start, runCamera(T.establishEnd), u);
};

// ── Scene 1: run, sidestep, dive ─────────────────────────────
const RunScene: React.FC<{t: number}> = ({t}) => {
  const cam = t < T.establishEnd ? establishCamera(t) : runCamera(t);
  const items: Drawable[] = [];
  const shadows: React.ReactNode[] = [];

  // posts
  items.push({depth: project({x: 0, y: 0, z: PITCH.tryLineZ}, cam).depth, node: <Posts key="posts" cam={cam} t={t} />});

  // ── attacker ──
  const px = playerX(t);
  const hip = hipZ(t);
  if (t < T.diveTakeoff) {
    let rig: Rig;
    let sx = 1;
    let sy = 1;
    let lift = 0;
    if (t < T.runStart) {
      rig = standBack(Math.abs(Math.sin(t * 9)) * 0.6);
      const set = ease(t, T.runStart - 0.2, T.runStart, 0, 1);
      sy = 1 - 0.08 * set;
      sx = 1 + 0.05 * set;
    } else {
      const phase = (hip / 3.1) * Math.PI * 2 + 0.4;
      rig = runBack(phase);
      const b = Math.abs(Math.sin(phase));
      lift = b * 0.07;
      sy = 0.93 + 0.12 * b; // squash on each footfall, stretch in the air
      sx = 1 / Math.sqrt(sy);
      // big squash as he plants for the sidestep
      const plant = bump(t, T.sidestepAt - 0.08, T.sidestepAt + 0.12);
      sy *= 1 - 0.14 * plant;
      sx *= 1 + 0.1 * plant;
      // crouch before the dive
      const crouch = ease(t, T.diveStart, T.diveTakeoff, 0, 1, Easing.out(Easing.quad));
      sy *= 1 - 0.2 * crouch;
      sx *= 1 + 0.12 * crouch;
    }
    const lean = Math.max(-20, Math.min(20, velX(t) * 2.4));
    items.push(sprite('p1', {x: px, y: lift, z: hip}, cam, <Character rig={rig} kit={KITS.home} view="back" />, {rotate: lean, sx, sy}));
    shadows.push(shadow('p1s', px, hip, cam));

    // sidestep whoosh
    const w = t - T.sidestepAt;
    if (w > 0 && w < 0.55) {
      const p = project({x: px, y: 1.1, z: hip}, cam);
      const fade = ease(w, 0.15, 0.55, 1, 0, Easing.in(Easing.quad));
      const reach = ease(w, 0, 0.3, 0.2, 1, Easing.out(Easing.cubic));
      shadows.push(
        <g key="whoosh" opacity={fade} stroke="#FFFFFF" strokeWidth={4} strokeOpacity={0.6} strokeLinecap="round" fill="none">
          {[-60, 0, 60].map((dy, i) => (
            <path key={i} d={`M${p.x + 90},${p.y + dy} q${110 * reach},${-20} ${220 * reach},${i * 12}`} />
          ))}
        </g>,
      );
    }
  } else {
    // the dive: feet at F, ball at the far end
    const air = ease(t, T.diveTakeoff, T.diveLand, 0, 1, Easing.linear);
    const h = t < T.diveLand ? 0.15 + 0.75 * Math.sin(Math.PI * air) : 0.14;
    const feetZ = hip - DIVER_HIP;
    const F = project({x: px, y: h, z: feetZ}, cam);
    const H = project({x: px, y: h, z: feetZ + DIVER_M}, cam);
    const M = project({x: px, y: h, z: feetZ + DIVER_M / 2}, cam);
    const len = Math.hypot(H.x - F.x, H.y - F.y);
    const ang = (Math.atan2(H.x - F.x, F.y - H.y) * 180) / Math.PI;
    const launch = ease(t, T.diveTakeoff, T.diveTakeoff + 0.22, 1.22, 1, Easing.out(Easing.cubic));
    const landSince = t - T.diveLand;
    const landSquash = landSince > 0 ? interpolate(landSince, [0, 0.08, 0.3], [0, 1, 0], {...clamp, easing: Easing.out(Easing.quad)}) : 0;
    const kx = M.s * UNIT * (1 + 0.14 * landSquash);
    const ky = (len / DIVER_LENGTH) * launch * (1 - 0.1 * landSquash);
    const kick = t > T.touchdown + 0.3 ? 0.5 + 0.5 * Math.sin((t - T.touchdown) * 22) : 0;
    items.push({
      depth: M.depth,
      node: (
        <g key="diver" transform={`translate(${F.x},${F.y}) rotate(${ang}) scale(${kx},${ky})`}>
          <Diver kit={KITS.home} kick={t < 7.3 ? kick : 0} />
        </g>
      ),
    });
    shadows.push(shadow('ds', px, feetZ + DIVER_M / 2, cam, 1.2, 0.22 + (1 - h) * 0.1));
  }

  // ── defender 1: gets sidestepped ──
  const meetZ = hipZ(T.sidestepAt) + 2.6;
  const d1StartZ = 16;
  const d1Go = T.runStart + 0.3;
  const lungeT = t - T.defenderLungeAt;
  const d1z = t < T.defenderLungeAt ? ease(t, d1Go, T.defenderLungeAt, d1StartZ, meetZ, Easing.inOut(Easing.quad)) : meetZ - ease(lungeT, 0, 0.4, 0, 0.6, Easing.out(Easing.quad));
  const d1x = START_X - 0.4 - ease(lungeT, 0, 0.38, 0, 0.6, Easing.out(Easing.quad));
  let d1: React.ReactNode;
  let d1rot = 0;
  let d1sx = 1;
  let d1sy = 1;
  let d1expr: Expression = 'determined';
  if (t < d1Go) {
    d1 = <Character rig={standFront(0.6 + 0.4 * Math.abs(Math.sin(t * 6)))} kit={KITS.away} view="front" expr="determined" />;
  } else {
    const dist = d1StartZ - d1z;
    const r = lungeT > 0 ? armsUp(runFront(0.4, 1), 0) : runFront((dist / 2.6) * Math.PI * 2, 1);
    if (lungeT > 0) {
      // arms reaching out towards where the player *was*
      reachUp(r);
      d1rot = ease(lungeT, 0, 0.36, 0, -90, Easing.in(Easing.quad));
      const land = lungeT - 0.36;
      if (land > 0) {
        const sq = interpolate(land, [0, 0.07, 0.25], [0, 1, 0], {...clamp, easing: Easing.out(Easing.quad)});
        d1sy = 1 + 0.08 * sq;
        d1sx = 1 - 0.12 * sq;
      }
      d1expr = land > 0.1 ? 'dazed' : 'shock';
    }
    d1 = <Character rig={r} kit={KITS.away} view="front" expr={d1expr} />;
  }
  items.push(sprite('d1', {x: d1x, y: 0, z: d1z}, cam, d1, {rotate: d1rot, sx: d1sx, sy: d1sy}));
  shadows.push(shadow('d1s', d1x + (d1rot / 90) * 1.0, d1z, cam, 0.55 + (Math.abs(d1rot) / 90) * 0.6));
  if (lungeT > 0.35) {
    const land = project({x: d1x - 1.2, y: 0.1, z: d1z}, cam);
    shadows.push(<Dust key="d1dust" x={land.x} y={land.y} since={lungeT - 0.36} size={land.s * 0.9} seed="d1" />);
  }

  // ── defender 2: cover tackler, arrives too late ──
  if (t > T.chaserEnterAt - 0.1) {
    const c0 = {x: 6.8, z: hipZ(T.chaserEnterAt) + 5};
    const c1 = {x: 2.4, z: hipZ(T.chaserDiveAt) + 0.3};
    const u = ease(t, T.chaserEnterAt, T.chaserDiveAt, 0, 1, Easing.inOut(Easing.sin));
    const diveT = t - T.chaserDiveAt;
    let cx = c0.x + (c1.x - c0.x) * u;
    let cz = c0.z + (c1.z - c0.z) * u;
    let rot = 0;
    let rig: Rig = runFront(u * 14, 0.6);
    let expr: Expression = 'determined';
    if (diveT > 0) {
      // dives at the player's legs, lands short
      rot = ease(diveT, 0, 0.34, 0, -88, Easing.in(Easing.quad));
      cx -= ease(diveT, 0, 0.34, 0, 0.9, Easing.out(Easing.quad));
      cz -= ease(diveT, 0, 0.4, 0, 0.5, Easing.out(Easing.quad));
      rig = runFront(0, 0);
      reachUp(rig);
      expr = 'shock';
    }
    items.push(sprite('d2', {x: cx, y: 0, z: cz}, cam, <Character rig={rig} kit={KITS.away2} view="front" expr={expr} />, {rotate: rot}));
    shadows.push(shadow('d2s', cx + (rot / 90) * 1.0, cz, cam, 0.55 + (Math.abs(rot) / 90) * 0.6));
    if (diveT > 0.33) {
      const land = project({x: cx - 1.2, y: 0.1, z: cz}, cam);
      shadows.push(<Dust key="d2dust" x={land.x} y={land.y} since={diveT - 0.34} size={land.s * 0.9} seed="d2" />);
    }
  }

  // touchdown burst at the ball
  const ballAt = project({x: px, y: 0.2, z: hipZ(T.touchdown) - DIVER_HIP + DIVER_M}, cam);
  const chest = project({x: px, y: 0.1, z: hipZ(T.diveLand) - DIVER_HIP + DIVER_M * 0.6}, cam);

  const speed =
    t < T.runStart + 0.3
      ? 0
      : interpolate(t, [T.runStart + 0.3, T.runStart + 1.3, T.diveLand, T.diveLand + 0.3], [0, 1, 1, 0], {
          ...clamp,
          easing: Easing.inOut(Easing.quad),
        });
  const cheer = ease(t, T.touchdown, T.touchdown + 0.3, 0, 1, Easing.out(Easing.quad));

  return (
    <g>
      <Backdrop cam={cam} t={t} cheer={cheer} />
      {shadows}
      <Dust x={chest.x} y={chest.y} since={t - T.diveLand} size={chest.s * 0.45} seed="dive" />
      {renderSorted(items)}
      <Impact x={ballAt.x} y={ballAt.y} since={t - T.touchdown} size={ballAt.s * 0.9} />
      <SpeedLines vp={vanishingPoint(cam)} t={t} intensity={speed} />
    </g>
  );
};

// ── Scene 2: conversion ──────────────────────────────────────
const TRY_SPOT_Z = hipZ(T.diveLand + 1) - DIVER_HIP + DIVER_M; // where the ball went down
const TEE: Vec3 = {x: PITCH.tryX, y: 0, z: PITCH.tryLineZ - PITCH.conversionDistance};
const AIM = {x: 0 - TEE.x, z: PITCH.tryLineZ - TEE.z};
const AIM_LEN = Math.hypot(AIM.x, AIM.z);
const DIR = {x: AIM.x / AIM_LEN, z: AIM.z / AIM_LEN};
const RIGHT = {x: DIR.z, z: -DIR.x};
const YAW = Math.atan2(AIM.x, AIM.z);
const FLIGHT_LEN = AIM_LEN + 10.5; // lands in the in-goal, well past the posts
const CROSS_S = AIM_LEN / FLIGHT_LEN;
const CROSS_H = 6.4; // height as it crosses the posts (crossbar is 3m)
const APEX = CROSS_H / (4 * CROSS_S * (1 - CROSS_S));
// Ease-out flight that crosses the posts exactly at T.ballOverPosts.
const FLIGHT_P = Math.log(1 - CROSS_S) / Math.log(1 - (T.ballOverPosts - T.kickAt) / (T.ballLands - T.kickAt));
const flightS = (t: number) => {
  const u = Math.max(0, Math.min(1, (t - T.kickAt) / (T.ballLands - T.kickAt)));
  return 1 - Math.pow(1 - u, FLIGHT_P);
};
const BALL_REST_Y = 0.17;
const ballPos = (t: number): Vec3 => {
  const after = t - T.ballLands;
  if (after > 0) {
    // one lazy bounce, then it rolls to a stop
    const u = Math.min(1, after / 0.45);
    const d = FLIGHT_LEN + ease(after, 0, 0.7, 0, 2.4, Easing.out(Easing.quad));
    return {x: TEE.x + DIR.x * d, y: BALL_REST_Y + 0.8 * 4 * u * (1 - u), z: TEE.z + DIR.z * d};
  }
  const s = flightS(t);
  const d = s * FLIGHT_LEN;
  return {x: TEE.x + DIR.x * d, y: 0.34 * (1 - s) + BALL_REST_Y * s + 4 * APEX * s * (1 - s), z: TEE.z + DIR.z * d};
};
const at = (along: number, side: number): Vec3 => ({
  x: TEE.x + DIR.x * along + RIGHT.x * side,
  y: 0,
  z: TEE.z + DIR.z * along + RIGHT.z * side,
});

const conversionCamera = (t: number): Camera => {
  const push = ease(t, T.kickAt + 0.05, T.ballOverPosts + 0.25, 0, 7.5, Easing.inOut(Easing.cubic));
  const rise = ease(t, T.kickAt + 0.05, T.ballOverPosts + 0.25, 0, 1.6, Easing.inOut(Easing.cubic));
  const tilt = ease(t, T.kickAt, T.ballOverPosts, 0, 0.12, Easing.inOut(Easing.sin));
  const settle = ease(t, SWAP_TO_CONVERSION, SWAP_TO_CONVERSION + 0.6, 1, 0, Easing.out(Easing.cubic));
  const back = 10 - push + settle * 2.5;
  const p = at(-back, -0.35);
  return {x: p.x, y: 2.7 + rise + settle * 1.2, z: p.z, yaw: YAW, pitch: 0.04 - tilt + settle * 0.06, focal: 1600, cx: 540, cy: 1010};
};

const ConversionScene: React.FC<{t: number}> = ({t}) => {
  const cam = conversionCamera(t);
  const items: Drawable[] = [];
  const shadows: React.ReactNode[] = [];
  items.push({depth: project({x: 0, y: 0, z: PITCH.tryLineZ}, cam).depth, node: <Posts key="posts" cam={cam} t={t} />});

  // dashed guide from the try spot back to the tee
  const g0 = ease(t, T.guideLineIn, T.guideLineIn + 0.6, 0, 1, Easing.out(Easing.cubic));
  const gFade = ease(t, T.runUpStart - 0.3, T.runUpStart + 0.1, 1, 0, Easing.inOut(Easing.quad));
  const guide: string[] = [];
  const total = TRY_SPOT_Z - TEE.z - 0.6;
  for (let d = 0; d < total * g0; d += 1.4) {
    const a = TRY_SPOT_Z - d;
    const b = Math.max(TRY_SPOT_Z - Math.min(total * g0, d + 0.8), TEE.z + 0.6);
    guide.push(groundLine(TEE.x, a, TEE.x, b, 0.22, cam));
  }
  const spotRing: Vec3[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    spotRing.push({x: TEE.x + Math.cos(a) * 0.7, y: 0, z: TRY_SPOT_Z + Math.sin(a) * 0.7});
  }
  const spotPulse = 1 + 0.15 * Math.sin(t * 8);

  // tee
  const teeP = project({x: TEE.x, y: 0, z: TEE.z}, cam);
  items.push({
    depth: teeP.depth + 0.05,
    node: (
      <g key="tee" transform={`translate(${teeP.x},${teeP.y}) scale(${teeP.s * UNIT})`}>
        <path d="M-16,0 L-8,-18 L8,-18 L16,0 Z" fill={COLORS.tee} stroke={COLORS.outline} strokeWidth={1.2} strokeLinejoin="round" />
      </g>
    ),
  });

  // ball: on the tee, then flying
  const flying = t >= T.kickAt;
  const bp = flying ? ballPos(t) : {x: TEE.x, y: 0.34, z: TEE.z};
  const b = project(bp, cam);
  const bk = b.s * BALL_UNIT * (flying ? interpolate(t, [T.kickAt, T.kickAt + 0.25], [1, FLIGHT_BOOST], {...clamp, easing: Easing.out(Easing.quad)}) : 1);
  const spin = flying ? flightS(t) * 1350 + ease(t, T.ballLands, T.ballLands + 0.6, 0, 180, Easing.out(Easing.quad)) : 0;
  // trail
  const trail: React.ReactNode[] = [];
  if (flying) {
    for (let i = 1; i <= 14; i++) {
      const tt = t - i * 0.028;
      if (tt < T.kickAt) break;
      const q = project(ballPos(tt), cam);
      trail.push(<circle key={i} cx={q.x} cy={q.y} r={Math.max(5, q.s * 0.14) * (1 - i / 20)} fill="#FFFFFF" opacity={0.6 * (1 - i / 15)} />);
    }
  }
  items.push({
    depth: b.depth,
    node: (
      <g key="ball">
        {trail}
        <g transform={`translate(${b.x},${b.y}) rotate(${-90 + spin}) scale(${bk})`}>
          <BallShape outline={1.6 / Math.max(0.5, Math.min(2, bk))} />
        </g>
      </g>
    ),
  });
  shadows.push(shadow('bs', bp.x, bp.z, cam, 0.25, flying ? 0.18 : 0.25));

  // kicker
  const p0 = at(-3.4, -1.1);
  const p1 = at(-0.55, -0.62);
  const ru = ease(t, T.runUpStart, T.kickAt, 0, 1, Easing.bezier(0.45, 0, 0.85, 0.85));
  const kpos = {x: p0.x + (p1.x - p0.x) * ru, y: 0, z: p0.z + (p1.z - p0.z) * ru};
  let rig: Rig;
  let sy = 1;
  let sx = 1;
  let lift = 0;
  let lean = 0;
  const kickStart = T.kickAt - 0.12;
  const celebrate = T.ballOverPosts + 0.08;
  if (t < T.runUpStart) {
    rig = standBack(0.5 + 0.5 * Math.sin(t * 5), false);
    sy = 1 + 0.015 * Math.sin(t * 5);
  } else if (t < kickStart) {
    const phase = ru * Math.PI * 2 * 2.1;
    rig = runBack(phase, false);
    const bb = Math.abs(Math.sin(phase));
    sy = 0.95 + 0.08 * bb;
    sx = 1 / Math.sqrt(sy);
    lift = bb * 0.05;
    lean = 6;
  } else if (t < celebrate) {
    const k = interpolate(t, [kickStart, T.kickAt, T.kickAt + 0.35], [0, 0.35, 1], {...clamp, easing: Easing.out(Easing.quad)});
    rig = kickBack(k);
    lean = -8 * ease(t, T.kickAt, T.kickAt + 0.3, 0, 1);
    const hop = ease(t, T.kickAt + 0.05, T.kickAt + 0.3, 0, 1, Easing.out(Easing.quad)) - ease(t, T.kickAt + 0.3, T.kickAt + 0.55, 0, 1, Easing.in(Easing.quad));
    lift = 0.18 * hop;
  } else {
    const c = t - celebrate;
    rig = armsUp(standBack(0, false), ease(c, 0, 0.2, 0, 1, Easing.out(Easing.back(1.6))));
    const jump = Math.max(0, Math.sin(Math.min(Math.PI, c * 6)));
    lift = 0.35 * jump;
    sy = 1 + 0.08 * jump;
    sx = 1 / Math.sqrt(sy);
  }
  items.push(sprite('kicker', {x: kpos.x, y: lift, z: kpos.z}, cam, <Character rig={rig} kit={KITS.home} view="back" />, {rotate: lean, sx, sy}));
  shadows.push(shadow('ks', kpos.x, kpos.z, cam));

  const teeImpact = project({x: TEE.x, y: 0.35, z: TEE.z}, cam);
  const cheer = ease(t, T.ballOverPosts, T.ballOverPosts + 0.3, 0, 1, Easing.out(Easing.quad));

  return (
    <g>
      <Backdrop cam={cam} t={t} cheer={cheer} />
      <g opacity={gFade}>
        <path d={guide.join('')} fill={COLORS.accent} />
        {g0 > 0 && (
          <g transform={`translate(0,0)`}>
            <path d={polyPath(spotRing, cam)} fill="none" stroke={COLORS.accent} strokeWidth={6 * spotPulse} />
          </g>
        )}
      </g>
      {shadows}
      {renderSorted(items)}
      <Impact x={teeImpact.x} y={teeImpact.y} since={t - T.kickAt} size={teeImpact.s * 0.55} />
    </g>
  );
};

// ── Scene 3: celebration ─────────────────────────────────────
const heroCamera: Camera = {x: -1.2, y: 1.5, z: 19.6, yaw: 0.05, pitch: -0.1, focal: 1600, cx: 540, cy: 1000};
const HERO = {x: -1.25, z: 25.2};

const CelebrationScene: React.FC<{t: number}> = ({t}) => {
  const tt = Math.min(t, T.endHoldStart); // freeze everything for the end hold
  const cam = heroCamera;
  const c = tt - T.celebrateStart;
  const items: Drawable[] = [];
  items.push({depth: project({x: 0, y: 0, z: PITCH.tryLineZ}, cam).depth, node: <Posts key="posts" cam={cam} t={tt} />});

  // two jumps then settle into the final pose
  const jumps = [
    {start: 0.22, dur: 0.5, h: 0.55},
    {start: 0.86, dur: 0.62, h: 0.85},
  ];
  let lift = 0;
  let sy = 1;
  for (const j of jumps) {
    const u = (c - j.start) / j.dur;
    if (u > 0 && u < 1) {
      lift = j.h * 4 * u * (1 - u);
      sy = 1 + 0.1 * Math.sin(Math.PI * u);
    }
    // anticipation squash before, landing squash after
    sy -= 0.14 * bump(c, j.start - 0.12, j.start + 0.02);
    sy -= 0.16 * bump(c, j.start + j.dur - 0.02, j.start + j.dur + 0.16);
  }
  const arms = ease(c, 0.1, 0.35, 0.25, 1, Easing.out(Easing.back(1.5)));
  const rig = armsUp(standFront(0.2), arms);
  // fist pump on the second jump
  const pump = bump(c, 0.86, 1.48) * 10;
  rig.handL = [rig.handL[0] - pump * 0.3, rig.handL[1] - pump];
  rig.handR = [rig.handR[0] + pump * 0.3, rig.handR[1] - pump];
  const sx = 1 / Math.sqrt(sy);
  items.push(sprite('hero', {x: HERO.x, y: lift, z: HERO.z}, cam, <Character rig={rig} kit={KITS.home} view="front" expr="joy" />, {sx, sy}));
  const cheer = ease(t, T.celebrateStart, T.celebrateStart + 0.3, 0, 1) * ease(t, T.endHoldStart - 0.5, T.endHoldStart, 1, 0);

  return (
    <g>
      <Backdrop cam={cam} t={tt} cheer={cheer} />
      {shadow('hs', HERO.x, HERO.z, cam, 0.6 - lift * 0.2, 0.3 - lift * 0.1)}
      {renderSorted(items)}
    </g>
  );
};

// ── Overlays ─────────────────────────────────────────────────
const popIn = (frame: number, at: number, damping = 9) =>
  spring({frame: frame - at * VIDEO.fps, fps: VIDEO.fps, config: {damping, stiffness: 170, mass: 0.8}});

export const RugbyTry: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;

  let scene: React.ReactNode;
  if (t < SWAP_TO_CONVERSION) scene = <RunScene t={t} />;
  else if (t < SWAP_TO_CELEBRATION) scene = <ConversionScene t={t} />;
  else scene = <CelebrationScene t={t} />;

  // TRY! +5
  const showTry = t >= T.tryTextIn && t < SWAP_TO_CONVERSION;
  const tryPop = popIn(frame, T.tryTextIn, 13);
  const fivePop = popIn(frame, T.plusFiveIn, 12);
  const underline = ease(t, T.tryTextIn + 0.1, T.tryTextIn + 0.45, 0, 1, Easing.out(Easing.cubic));
  // +2 near the posts
  const showTwo = t >= T.plusTwoIn && t < SWAP_TO_CELEBRATION;
  const twoPop = popIn(frame, T.plusTwoIn, 12);
  const twoRise = ease(t, T.plusTwoIn, T.plusTwoIn + 0.6, 0, -40, Easing.out(Easing.cubic));

  // scoreboard pulse on 7
  const pu = (t - T.pulseStart) / (T.pulseEnd - T.pulseStart);
  const pulse = pu > 0 && pu < 1 ? Math.pow(Math.sin(Math.PI * T.pulseCount * pu), 2) * Math.sin(Math.PI * pu) ** 0.3 : 0;

  const sparkles =
    t > T.pulseStart && t < T.endHoldStart
      ? [
          {x: 120, y: 230, d: 0},
          {x: 965, y: 250, d: 0.3},
          {x: 190, y: 380, d: 0.55},
          {x: 900, y: 390, d: 0.15},
          {x: 540, y: 400, d: 0.7},
        ].map((s, i) => {
          const k = Math.max(0, Math.sin((t - T.pulseStart) * 5 + s.d * 6)) * ease(t, T.endHoldStart - 0.4, T.endHoldStart, 1, 0);
          return <Sparkle key={i} x={s.x} y={s.y} size={34 * k} color={i % 2 ? '#FFFFFF' : COLORS.accent} rotate={t * 40} />;
        })
      : null;

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.skyBottom}}>
      <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
        {scene}
        <Vignette />

        {showTry && (
          <g>
            <Headline text="TRY!" x={540} y={560} size={250} fill={COLORS.accent} scale={tryPop} underline={underline} />
            {t >= T.plusFiveIn && <Tag text="+5" x={540} y={790} size={84} scale={fivePop} />}
          </g>
        )}
        {showTwo && (
          <g>
            <Tag text="+2" x={540} y={560 + twoRise} size={96} scale={twoPop} />
          </g>
        )}

        <Confetti t={t} start={T.confettiStart} clearBy={T.endHoldStart - 0.05} />
        <Wipe p={(t - T.wipeToConversion) / T.wipeDuration} />
        <Wipe p={(t - T.wipeToCelebration) / T.wipeDuration} />

        {sparkles}
        <Scoreboard
          t={Math.min(t, T.endHoldStart)}
          step={T.scoreTickStep}
          pulse={pulse}
          ticks={[
            {from: 0, to: 5, start: T.scoreToFiveStart},
            {from: 5, to: 7, start: T.scoreToSevenStart},
          ]}
        />
      </svg>
    </AbsoluteFill>
  );
};
