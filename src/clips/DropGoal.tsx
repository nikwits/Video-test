import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {DROP_GOAL as D, KITS, PITCH, VIDEO} from '../config';
import {Vec3, project} from '../engine/camera';
import {BallShape} from '../characters/Ball';
import {
  Character,
  Expression,
  Rig,
  armsUp,
  callForBall,
  handsOnHead,
  holdBallBack,
  kickBack,
  reachUp,
  runBack,
  runFront,
  standBack,
  standFront,
} from '../characters/Character';
import {Backdrop, Posts} from '../scene/World';
import {Impact} from '../scene/Effects';
import {BALL_UNIT, Drawable, UNIT, bump, ease, kickedBall, makeKick, renderSorted, shadow, sprite} from '../scene/stage';
import {KickClipShell, kickCamera, officials} from './shared';

// Open play: the pass comes in, the fly-half drops the ball, strikes it on
// the half-volley as it bounces, and it sails over a leaping defender.

const SPOT = {x: D.spotX, z: PITCH.tryLineZ - D.distance};
const KICK = makeKick({
  spot: SPOT,
  startY: 0.25, // struck just off the ground
  crossH: 6.6,
  pastPosts: 9,
  kickAt: D.kickAt,
  overPosts: D.ballOverPosts,
  lands: D.ballLands,
});
const CELEBRATE = D.ballOverPosts + 0.1;
const KICKER_SIDE = -0.35;

// How far the kicker is along the line to the posts (0 = where the ball is struck).
const kickerAlong = (t: number) =>
  t < D.catchAt ? ease(t, 0, D.catchAt, -2.3, -1.8, Easing.inOut(Easing.sin)) : ease(t, D.catchAt, D.kickAt - 0.1, -1.8, -0.45, Easing.inOut(Easing.quad));

// Where the ball sits in his hands, in world space.
const handBall = (t: number): Vec3 => {
  const p = KICK.at(kickerAlong(t), KICKER_SIDE + 28 * UNIT);
  return {...p, y: 104 * UNIT};
};
const PASS_FROM: Vec3 = {...KICK.at(-1.4, -6), y: 1.1};

const DropGoalScene: React.FC<{t: number}> = ({t}) => {
  const tt = Math.min(t, D.endHoldStart); // everything settles for the end hold
  const cam = kickCamera(KICK, tt, {back: 8.5, side: -0.6, height: 2.6, push: 0.8, rise: 0.5, tilt: 0.05});
  const items: Drawable[] = [];
  const shadows: React.ReactNode[] = [];

  items.push({depth: project({x: 0, y: 0, z: PITCH.tryLineZ}, cam).depth, node: <Posts key="posts" cam={cam} t={tt} />});
  items.push(...officials(tt, D.flagsUp, cam, tt));

  // ── the ball: pass, in hands, dropped, struck ──
  if (tt >= D.passAt && tt < D.catchAt) {
    const u = ease(tt, D.passAt, D.catchAt, 0, 1, Easing.out(Easing.quad));
    const to = handBall(D.catchAt);
    const pos = {
      x: PASS_FROM.x + (to.x - PASS_FROM.x) * u,
      y: PASS_FROM.y + (to.y - PASS_FROM.y) * u + 0.7 * 4 * u * (1 - u),
      z: PASS_FROM.z + (to.z - PASS_FROM.z) * u,
    };
    const b = project(pos, cam);
    items.push({
      depth: b.depth,
      node: (
        <g key="pass" transform={`translate(${b.x},${b.y}) rotate(${-15 + u * 40}) scale(${b.s * BALL_UNIT * 1.3},${b.s * BALL_UNIT * 1.3 * (0.75 + 0.25 * Math.cos(u * 30))})`}>
          <BallShape outline={1.4} />
        </g>
      ),
    });
    shadows.push(shadow('passShadow', pos.x, pos.z, cam, 0.2, 0.15));
  } else if (tt >= D.dropAt) {
    // dropped point-first, it falls and bounces right into the swing of the boot
    const from = handBall(D.dropAt);
    const spot = {...KICK.at(0, 0), y: 0.25};
    const u = ease(tt, D.dropAt, D.kickAt, 0, 1, Easing.in(Easing.quad));
    const falling = {x: from.x + (spot.x - from.x) * u, y: from.y + (spot.y - from.y) * u, z: from.z + (spot.z - from.z) * u};
    items.push(kickedBall(KICK, tt, cam, falling, -70 - 20 * u));
    const bp = tt >= D.kickAt ? KICK.ballPos(tt) : falling;
    shadows.push(shadow('ballShadow', bp.x, bp.z, cam, 0.25, 0.18));
  }

  // ── kicker ──
  const along = kickerAlong(tt);
  const kpos = KICK.at(along, KICKER_SIDE);
  let rig: Rig;
  let lift = 0;
  let lean = 0;
  let sy = 1;
  const stepPhase = ((along + 1.8) / 1.35) * Math.PI * 2 * 1.1;
  if (tt < D.catchAt) {
    rig = callForBall(standBack(0.5 + 0.5 * Math.sin(tt * 7), false), ease(tt, D.passAt - 0.2, D.passAt + 0.2, 0.4, 1));
  } else if (tt < D.kickAt - 0.12) {
    rig = runBack(stepPhase, false);
    holdBallBack(rig);
    if (tt >= D.dropAt) rig.ball = undefined;
    const bb = Math.abs(Math.sin(stepPhase));
    sy = 0.96 + 0.06 * bb;
    lift = 0.04 * bb;
    lean = 4;
  } else if (tt < CELEBRATE) {
    const k = ease(tt, D.kickAt - 0.12, D.kickAt, 0, 0.35, Easing.in(Easing.quad)) + ease(tt, D.kickAt, D.kickAt + 0.35, 0, 0.65, Easing.out(Easing.quad));
    rig = kickBack(k);
    lean = -8 * ease(tt, D.kickAt, D.kickAt + 0.3, 0, 1);
  } else {
    const c = tt - CELEBRATE;
    rig = armsUp(standBack(0, false), ease(c, 0, 0.2, 0, 1, Easing.out(Easing.back(1.6))));
    const jump = Math.max(0, Math.sin(Math.min(Math.PI, c * 6)));
    lift = 0.35 * jump;
    sy = 1 + 0.08 * jump;
  }
  items.push(sprite('kicker', {x: kpos.x, y: lift, z: kpos.z}, cam, <Character rig={rig} kit={KITS.home} view="back" />, {rotate: lean, sy, sx: 1 / Math.sqrt(sy)}));
  shadows.push(shadow('kickerShadow', kpos.x, kpos.z, cam));

  // ── defenders rushing out to charge it down ──
  const rushers = [
    {kit: KITS.away, from: 8, to: 3.4, side: 1.3, leaps: true, key: 'dA'},
    {kit: KITS.away2, from: 9.5, to: 6.2, side: -3.0, leaps: false, key: 'dB'},
  ];
  for (const d of rushers) {
    const a = ease(tt, 0.55, D.chargeAt + 0.1, d.from, d.to, Easing.inOut(Easing.quad)) - ease(tt, D.chargeAt + 0.1, D.chargeAt + 0.8, 0, 0.5, Easing.out(Easing.quad));
    const pos = KICK.at(a, d.side);
    let r: Rig;
    let expr: Expression = 'determined';
    let up = 0;
    if (tt < 0.55) {
      r = standFront(0.6 + 0.4 * Math.abs(Math.sin(tt * 6)));
    } else if (tt < D.ballOverPosts) {
      r = runFront(((d.from - a) / 2.4) * Math.PI * 2, 0.8);
      if (d.leaps && tt > D.chargeAt - 0.1) {
        reachUp(r);
        up = 0.4 * bump(tt, D.chargeAt, D.chargeAt + 0.55);
        expr = 'shock';
      }
    } else {
      r = handsOnHead(standFront(0.1));
      expr = 'dazed';
    }
    items.push(sprite(d.key, {x: pos.x, y: up, z: pos.z}, cam, <Character rig={r} kit={d.kit} view="front" expr={expr} />));
    shadows.push(shadow(`${d.key}s`, pos.x, pos.z, cam, 0.55 - up * 0.3));
  }

  const strike = project({...KICK.at(0, 0), y: 0.25}, cam);
  const cheer = ease(t, D.ballOverPosts, D.ballOverPosts + 0.3, 0, 1, Easing.out(Easing.quad)) * ease(t, D.endHoldStart - 0.5, D.endHoldStart, 1, 0);

  return (
    <g>
      <Backdrop cam={cam} t={tt} cheer={cheer} />
      {shadows}
      {renderSorted(items)}
      <Impact x={strike.x} y={strike.y} since={t - D.kickAt} size={strike.s * 0.55} />
    </g>
  );
};

export const DropGoal: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  return (
    <KickClipShell
      frame={frame}
      t={t}
      word="DROP GOAL"
      wordSize={170}
      wordIn={D.wordIn}
      pointsIn={D.pointsIn}
      points={3}
      scoreFrom={D.startScore}
      scoreStart={D.scoreStart}
      pulseStart={D.pulseStart}
      pulseEnd={D.pulseEnd}
      endHoldStart={D.endHoldStart}
    >
      <DropGoalScene t={t} />
    </KickClipShell>
  );
};
