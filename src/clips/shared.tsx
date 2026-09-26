// Pieces shared by the kick-at-goal clips (drop goal, penalty).
import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {COLORS, KITS, PALETTE, PITCH, VIDEO} from '../config';
import {Camera, Vec3} from '../engine/camera';
import {Character, Rig, armsUp, kickBack, runBack, standBack, standFront} from '../characters/Character';
import {Vignette} from '../scene/World';
import {Headline, Scoreboard, Tag} from '../scene/Hud';
import {Drawable, Kick, clamp, ease, popIn, shadow, sprite} from '../scene/stage';

// ── Touch judges ─────────────────────────────────────────────
// Standing behind the posts; they raise their flags when the kick is good.
const Official: React.FC<{side: -1 | 1; raise: number; wave: number}> = ({side, raise, wave}) => {
  const r: Rig = standFront(0.2);
  const e: [number, number] = [side * (27 + 4 * raise), -118 - 56 * raise];
  const h: [number, number] = [side * (28 + 2 * raise), -91 - 114 * raise];
  if (side > 0) {
    r.elbowR = e;
    r.handR = h;
    r.elbowL = [-28, -119];
    r.handL = [-28, -92];
  } else {
    r.elbowL = e;
    r.handL = h;
    r.elbowR = [28, -119];
    r.handR = [28, -92];
  }
  // flagpole carries on the line of the forearm
  const dx = h[0] - e[0];
  const dy = h[1] - e[1];
  const len = Math.hypot(dx, dy);
  const tip: [number, number] = [h[0] + (dx / len) * 38, h[1] + (dy / len) * 38];
  const fw = side * 26;
  const flutter = Math.sin(wave) * 4;
  return (
    <g>
      <Character rig={r} kit={KITS.official} view="front" expr="focus" />
      <path d={`M${h[0]},${h[1]} L${tip[0]},${tip[1]}`} stroke={PALETTE.kit} strokeWidth={2.2} strokeLinecap="round" />
      <path
        d={`M${tip[0]},${tip[1]} Q${tip[0] + fw / 2},${tip[1] - 3 + flutter} ${tip[0] + fw},${tip[1] + flutter} L${tip[0] + fw},${tip[1] + 18 + flutter} Q${tip[0] + fw / 2},${tip[1] + 15 + flutter} ${tip[0]},${tip[1] + 18} Z`}
        fill={PALETTE.white}
        stroke={PALETTE.kit}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </g>
  );
};

export const officials = (t: number, flagsUp: number, cam: Camera, tt: number): Drawable[] =>
  ([-1, 1] as const).map((side) => {
    const raise = ease(t, flagsUp, flagsUp + 0.3, 0, 1, Easing.out(Easing.back(1.4)));
    return sprite(`official${side}`, {x: side * (PITCH.postHalfGap + 1.4), y: 0, z: PITCH.tryLineZ + 4}, cam, (
      <Official side={side} raise={raise} wave={tt * 9 + side} />
    ));
  });

// ── Kick camera ──────────────────────────────────────────────
// Sits behind the kicker on the line to the posts, and eases forward
// and up a little as the ball flies.
export const kickCamera = (
  kick: Kick,
  t: number,
  opts: {back: number; side: number; height: number; push: number; rise: number; tilt: number},
): Camera => {
  const {kickAt, overPosts} = kick.plan;
  const push = ease(t, kickAt + 0.05, overPosts + 0.3, 0, opts.push, Easing.inOut(Easing.cubic));
  const rise = ease(t, kickAt + 0.05, overPosts + 0.3, 0, opts.rise, Easing.inOut(Easing.cubic));
  const tilt = ease(t, kickAt, overPosts, 0, opts.tilt, Easing.inOut(Easing.sin));
  const p = kick.at(-opts.back + push, opts.side);
  return {x: p.x, y: opts.height + rise, z: p.z, yaw: kick.yaw, pitch: 0.04 - tilt, focal: 1600, cx: 540, cy: 1010};
};

// ── Place kicker ─────────────────────────────────────────────
// Stands behind the tee, runs in, strikes, then celebrates.
export const placeKicker = (
  t: number,
  kick: Kick,
  cam: Camera,
  opts: {from: Vec3; to: Vec3; runUpStart: number; celebrateAt: number; strides?: number},
): {item: Drawable; shade: React.ReactNode} => {
  const {kickAt} = kick.plan;
  const ru = ease(t, opts.runUpStart, kickAt, 0, 1, Easing.bezier(0.45, 0, 0.85, 0.85));
  const pos = {x: opts.from.x + (opts.to.x - opts.from.x) * ru, z: opts.from.z + (opts.to.z - opts.from.z) * ru};
  let rig: Rig;
  let sy = 1;
  let sx = 1;
  let lift = 0;
  let lean = 0;
  const kickStart = kickAt - 0.12;
  if (t < opts.runUpStart) {
    rig = standBack(0.5 + 0.5 * Math.sin(t * 5), false);
    sy = 1 + 0.015 * Math.sin(t * 5);
  } else if (t < kickStart) {
    const phase = ru * Math.PI * 2 * (opts.strides ?? 2.1);
    rig = runBack(phase, false);
    const bb = Math.abs(Math.sin(phase));
    sy = 0.95 + 0.08 * bb;
    sx = 1 / Math.sqrt(sy);
    lift = bb * 0.05;
    lean = 6;
  } else if (t < opts.celebrateAt) {
    const k = interpolate(t, [kickStart, kickAt, kickAt + 0.35], [0, 0.35, 1], {...clamp, easing: Easing.out(Easing.quad)});
    rig = kickBack(k);
    lean = -8 * ease(t, kickAt, kickAt + 0.3, 0, 1);
    const hop =
      ease(t, kickAt + 0.05, kickAt + 0.3, 0, 1, Easing.out(Easing.quad)) - ease(t, kickAt + 0.3, kickAt + 0.55, 0, 1, Easing.in(Easing.quad));
    lift = 0.18 * hop;
  } else {
    const c = t - opts.celebrateAt;
    rig = armsUp(standBack(0, false), ease(c, 0, 0.2, 0, 1, Easing.out(Easing.back(1.6))));
    const jump = Math.max(0, Math.sin(Math.min(Math.PI, c * 6)));
    lift = 0.35 * jump;
    sy = 1 + 0.08 * jump;
    sx = 1 / Math.sqrt(sy);
  }
  return {
    item: sprite('kicker', {x: pos.x, y: lift, z: pos.z}, cam, <Character rig={rig} kit={KITS.home} view="back" />, {rotate: lean, sx, sy}),
    shade: shadow('kickerShadow', pos.x, pos.z, cam),
  };
};

// ── Overlay: word, points, scoreboard ────────────────────────
export const KickClipShell: React.FC<{
  frame: number;
  t: number;
  word: string;
  wordSize: number;
  wordIn: number;
  pointsIn: number;
  points: number;
  scoreFrom: number;
  scoreStart: number;
  pulseStart: number;
  pulseEnd: number;
  endHoldStart: number;
  children: React.ReactNode;
}> = (p) => {
  const {frame, t} = p;
  const wordPop = popIn(frame, p.wordIn, 13);
  const pointsPop = popIn(frame, p.pointsIn, 12);
  const underline = ease(t, p.wordIn + 0.1, p.wordIn + 0.45, 0, 1, Easing.out(Easing.cubic));
  const pu = (t - p.pulseStart) / (p.pulseEnd - p.pulseStart);
  const pulse = pu > 0 && pu < 1 ? Math.pow(Math.sin(Math.PI * pu), 2) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.skyBottom}}>
      <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
        {p.children}
        <Vignette />
        {t >= p.wordIn && <Headline text={p.word} x={540} y={540} size={p.wordSize} fill={COLORS.accent} scale={wordPop} underline={underline} />}
        {t >= p.pointsIn && <Tag text={`+${p.points}`} x={540} y={740} size={84} scale={pointsPop} />}
        <Scoreboard
          t={Math.min(t, p.endHoldStart)}
          step={0.1}
          pulse={pulse}
          ticks={[{from: p.scoreFrom, to: p.scoreFrom + p.points, start: p.scoreStart}]}
        />
      </svg>
    </AbsoluteFill>
  );
};

