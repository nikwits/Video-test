// Shared building blocks for every clip: easing helpers, perspective
// sprites, depth sorting, and the flight of a kicked ball.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {BALL_SCALE, CHAR_SCALE, COLORS, PITCH, VIDEO} from '../config';
import {Camera, Vec3, polyPath, project} from '../engine/camera';
import {BallShape} from '../characters/Ball';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (
  t: number,
  t0: number,
  t1: number,
  v0: number,
  v1: number,
  e: (x: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(t, [t0, t1], [v0, v1], {...clamp, easing: e});
export const bump = (t: number, t0: number, t1: number) =>
  t <= t0 || t >= t1 ? 0 : Math.sin(((t - t0) / (t1 - t0)) * Math.PI);

export const UNIT = CHAR_SCALE / 100; // metres per sprite unit
export const BALL_UNIT = (0.29 * BALL_SCALE) / 38; // metres per ball-sprite unit
export const FLIGHT_BOOST = 2.5; // ball drawn bigger in the air so it reads at a distance

export type Drawable = {depth: number; node: React.ReactNode};

// A sprite standing at a world position, scaled by perspective.
export const sprite = (
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

export const shadow = (key: string, x: number, z: number, cam: Camera, r = 0.55, opacity = 0.28) => {
  const pts: Vec3[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push({x: x + Math.cos(a) * r, y: 0, z: z + Math.sin(a) * r * 0.55});
  }
  return <path key={key} d={polyPath(pts, cam)} fill="#0B3D0B" opacity={opacity} />;
};

export const renderSorted = (items: Drawable[]) => [...items].sort((a, b) => b.depth - a.depth).map((d) => d.node);

export const popIn = (frame: number, at: number, damping = 9) =>
  spring({frame: frame - at * VIDEO.fps, fps: VIDEO.fps, config: {damping, stiffness: 170, mass: 0.8}});

// ── Kicks at goal ────────────────────────────────────────────

export type KickPlan = {
  spot: {x: number; z: number}; // where the ball is kicked from
  startY: number; // ball height at contact (0.34 on a tee, lower on a half-volley)
  crossH: number; // height as it crosses the posts (crossbar is 3m)
  pastPosts: number; // how far beyond the posts it lands
  kickAt: number;
  overPosts: number; // the moment it crosses the posts
  lands: number;
};

export type Kick = ReturnType<typeof makeKick>;

// Works out the flight of a kick at goal. The ball eases out (a touch of
// drag) and is timed to cross the posts exactly at `overPosts`.
export const makeKick = (plan: KickPlan) => {
  const aim = {x: 0 - plan.spot.x, z: PITCH.tryLineZ - plan.spot.z};
  const aimLen = Math.hypot(aim.x, aim.z);
  const dir = {x: aim.x / aimLen, z: aim.z / aimLen};
  const right = {x: dir.z, z: -dir.x};
  const yaw = Math.atan2(aim.x, aim.z);
  const flightLen = aimLen + plan.pastPosts;
  const crossS = aimLen / flightLen;
  const apex = plan.crossH / (4 * crossS * (1 - crossS));
  const power = Math.log(1 - crossS) / Math.log(1 - (plan.overPosts - plan.kickAt) / (plan.lands - plan.kickAt));
  const restY = 0.17;

  const flightS = (t: number) => {
    const u = Math.max(0, Math.min(1, (t - plan.kickAt) / (plan.lands - plan.kickAt)));
    return 1 - Math.pow(1 - u, power);
  };
  const at = (along: number, side: number): Vec3 => ({
    x: plan.spot.x + dir.x * along + right.x * side,
    y: 0,
    z: plan.spot.z + dir.z * along + right.z * side,
  });
  const ballPos = (t: number): Vec3 => {
    const after = t - plan.lands;
    if (after > 0) {
      // one lazy bounce, then it rolls to a stop
      const u = Math.min(1, after / 0.45);
      const d = flightLen + ease(after, 0, 0.7, 0, 2.4, Easing.out(Easing.quad));
      const p = at(d, 0);
      return {...p, y: restY + 0.8 * 4 * u * (1 - u)};
    }
    const s = flightS(t);
    const p = at(s * flightLen, 0);
    return {...p, y: plan.startY * (1 - s) + restY * s + 4 * apex * s * (1 - s)};
  };
  const spin = (t: number) => flightS(t) * 1350 + ease(t, plan.lands, plan.lands + 0.6, 0, 180, Easing.out(Easing.quad));
  return {plan, dir, right, yaw, aimLen, flightS, ballPos, at, spin};
};

// The ball in flight with its dotted trail. Before the kick it sits at `restPos`.
export const kickedBall = (kick: Kick, t: number, cam: Camera, restPos: Vec3, restRot = -90): Drawable => {
  const flying = t >= kick.plan.kickAt;
  const bp = flying ? kick.ballPos(t) : restPos;
  const b = project(bp, cam);
  const boost = flying
    ? interpolate(t, [kick.plan.kickAt, kick.plan.kickAt + 0.25], [1, FLIGHT_BOOST], {...clamp, easing: Easing.out(Easing.quad)})
    : 1;
  const bk = b.s * BALL_UNIT * boost;
  const trail: React.ReactNode[] = [];
  if (flying) {
    for (let i = 1; i <= 14; i++) {
      const tt = t - i * 0.028;
      if (tt < kick.plan.kickAt) break;
      const q = project(kick.ballPos(tt), cam);
      trail.push(<circle key={i} cx={q.x} cy={q.y} r={Math.max(5, q.s * 0.14) * (1 - i / 20)} fill="#FFFFFF" opacity={0.6 * (1 - i / 15)} />);
    }
  }
  return {
    depth: b.depth,
    node: (
      <g key="ball">
        {trail}
        <g transform={`translate(${b.x},${b.y}) rotate(${(flying ? -90 : restRot) + (flying ? kick.spin(t) : 0)}) scale(${bk})`}>
          <BallShape outline={1.6 / Math.max(0.5, Math.min(2, bk))} />
        </g>
      </g>
    ),
  };
};

// Kicking tee under the ball.
export const tee = (pos: {x: number; z: number}, cam: Camera): Drawable => {
  const p = project({x: pos.x, y: 0, z: pos.z}, cam);
  return {
    depth: p.depth + 0.05,
    node: (
      <g key="tee" transform={`translate(${p.x},${p.y}) scale(${p.s * UNIT})`}>
        <path d="M-16,0 L-8,-18 L8,-18 L16,0 Z" fill={COLORS.tee} stroke={COLORS.outline} strokeWidth={1.2} strokeLinejoin="round" />
      </g>
    ),
  };
};
