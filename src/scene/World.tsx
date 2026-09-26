import React from 'react';
import {random} from 'remotion';
import {COLORS, PITCH} from '../config';
import {Camera, groundLine, groundRect, project, wallRect} from '../engine/camera';

const {tryLineZ, deadBallZ, twentyTwoZ, tenMetreZ, halfwayZ, touchX} = PITCH;
const STAND_Z = 62;
const BOARD_Z = 54;
const LINE_W = 0.22;

// Night sky with floodlight towers glowing above the stands.
const LAMPS = [-30, -12, 12, 30];
const Sky: React.FC<{cam: Camera}> = ({cam}) => {
  return (
    <g>
      <defs>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.skyTop} />
          <stop offset="1" stopColor={COLORS.skyBottom} />
        </linearGradient>
        <radialGradient id="lampGlow">
          <stop offset="0" stopColor={COLORS.lamp} stopOpacity={0.9} />
          <stop offset="0.25" stopColor={COLORS.haze} stopOpacity={0.35} />
          <stop offset="1" stopColor={COLORS.haze} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#nightSky)" />
      {LAMPS.map((x) => {
        const top = project({x, y: 21, z: 66}, cam);
        const foot = project({x, y: 16, z: 66}, cam);
        if (top.depth <= 0) return null;
        const w = 6 * top.s;
        const h = 2.4 * top.s;
        return (
          <g key={x}>
            <circle cx={top.x} cy={top.y - h / 2} r={w * 1.9} fill="url(#lampGlow)" />
            <path d={`M${foot.x - 0.25 * foot.s},${foot.y} L${top.x - 0.25 * top.s},${top.y} L${top.x + 0.25 * top.s},${top.y} L${foot.x + 0.25 * foot.s},${foot.y} Z`} fill="#0B0E16" />
            <rect x={top.x - w / 2} y={top.y - h} width={w} height={h} rx={0.3 * top.s} fill="#1B1F27" />
            {Array.from({length: 10}).map((_, i) => (
              <circle
                key={i}
                cx={top.x - w / 2 + ((i % 5) + 0.5) * (w / 5)}
                cy={top.y - h + (Math.floor(i / 5) + 0.5) * (h / 2)}
                r={0.42 * top.s}
                fill={COLORS.lamp}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// Crowd dots are fixed in the world, so work them out once.
const CROWD = (() => {
  const dots: {x: number; y: number; c: string; p: number}[] = [];
  let i = 0;
  for (let y = 1.8; y < 13.5; y += 1.25) {
    for (let x = -70; x <= 70; x += 1.35) {
      const jitter = (random(`cx${i}`) - 0.5) * 0.6;
      dots.push({
        x: x + jitter + (Math.round(y / 1.25) % 2) * 0.6,
        y: y + (random(`cy${i}`) - 0.5) * 0.3,
        c: COLORS.crowd[Math.floor(random(`cc${i}`) * COLORS.crowd.length)],
        p: random(`cp${i}`) * Math.PI * 2,
      });
      i++;
    }
  }
  return dots;
})();

const Stand: React.FC<{cam: Camera; cheer: number; t: number}> = ({cam, cheer, t}) => {
  const rows = [];
  for (let y = 1.2; y < 14; y += 2.5) {
    rows.push(<path key={y} d={wallRect(-80, y, 80, y + 1.25, STAND_Z, cam)} fill={COLORS.standRow} />);
  }
  const boards = [];
  for (let x = -60, i = 0; x < 60; x += 6, i++) {
    boards.push(
      <path
        key={x}
        d={wallRect(x, 0, x + 6, 1.0, BOARD_Z, cam)}
        fill={COLORS.board[i % COLORS.board.length]}
      />,
    );
  }
  boards.push(<path key="edge" d={wallRect(-60, 0.92, 60, 1.0, BOARD_Z - 0.01, cam)} fill={COLORS.accent} opacity={0.85} />);
  return (
    <g>
      <path d={wallRect(-80, 0, 80, 15, STAND_Z, cam)} fill={COLORS.stand} />
      {rows}
      {CROWD.map((d, i) => {
        const hop = cheer * Math.max(0, Math.sin(t * 16 + d.p)) * 0.5;
        const p = project({x: d.x, y: d.y + hop, z: STAND_Z}, cam);
        if (p.x < -20 || p.x > 1100 || p.depth <= 0) return null;
        return <circle key={i} cx={p.x} cy={p.y} r={0.36 * p.s} fill={d.c} opacity={0.7} />;
      })}
      <path d={wallRect(-80, 14.2, 80, 16.2, STAND_Z - 0.5, cam)} fill={COLORS.roof} />
      <path d={wallRect(-80, 14.1, 80, 14.35, STAND_Z - 0.6, cam)} fill={COLORS.lamp} opacity={0.8} />
      <path d={groundRect(-80, deadBallZ + 2, 80, STAND_Z, cam)} fill={COLORS.surround} />
      {boards}
    </g>
  );
};

const dashed = (x0: number, z0: number, x1: number, z1: number, dash: number, gap: number, cam: Camera) => {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const out: string[] = [];
  for (let d = 0; d < len; d += dash + gap) {
    const a = d / len;
    const b = Math.min(len, d + dash) / len;
    out.push(groundLine(x0 + (x1 - x0) * a, z0 + (z1 - z0) * a, x0 + (x1 - x0) * b, z0 + (z1 - z0) * b, LINE_W, cam));
  }
  return out.join('');
};

const Ground: React.FC<{cam: Camera}> = ({cam}) => {
  const stripes = [];
  for (let z = -80, i = 0; z < tryLineZ; z += 5, i++) {
    stripes.push(<path key={z} d={groundRect(-touchX - 5, z, touchX + 5, z + 5, cam)} fill={i % 2 ? COLORS.grassA : COLORS.grassB} />);
  }
  for (let z = tryLineZ, i = 0; z < deadBallZ; z += 2.5, i++) {
    stripes.push(
      <path key={`ig${z}`} d={groundRect(-touchX - 5, z, touchX + 5, z + 2.5, cam)} fill={i % 2 ? COLORS.inGoalA : COLORS.inGoalB} />,
    );
  }
  const lines = [
    groundLine(-touchX, tryLineZ, touchX, tryLineZ, LINE_W * 1.4, cam),
    groundLine(-touchX, deadBallZ, touchX, deadBallZ, LINE_W, cam),
    groundLine(-touchX, twentyTwoZ, touchX, twentyTwoZ, LINE_W, cam),
    groundLine(-touchX, halfwayZ, touchX, halfwayZ, LINE_W, cam),
    dashed(-touchX, tenMetreZ, touchX, tenMetreZ, 2, 2, cam),
    dashed(-touchX, tryLineZ - 5, touchX, tryLineZ - 5, 1, 4, cam),
    groundLine(-touchX, -80, -touchX, deadBallZ, LINE_W, cam),
    groundLine(touchX, -80, touchX, deadBallZ, LINE_W, cam),
    dashed(-20, -80, -20, tryLineZ - 5, 2, 3, cam),
    dashed(20, -80, 20, tryLineZ - 5, 2, 3, cam),
    dashed(-30, -80, -30, tryLineZ - 5, 2, 3, cam),
    dashed(30, -80, 30, tryLineZ - 5, 2, 3, cam),
  ].join('');
  return (
    <g>
      <path d={groundRect(-90, -120, 90, deadBallZ + 2, cam)} fill={COLORS.surround} />
      {stripes}
      <path d={lines} fill={COLORS.line} />
    </g>
  );
};

export const Backdrop: React.FC<{cam: Camera; t: number; cheer: number}> = ({cam, t, cheer}) => (
  <g>
    <Sky cam={cam} />
    <Stand cam={cam} cheer={cheer} t={t} />
    <Ground cam={cam} />
  </g>
);

// The H. Returned separately so it can be depth-sorted with the players.
export const Posts: React.FC<{cam: Camera; t: number}> = ({cam, t}) => {
  const z = tryLineZ;
  const g = PITCH.postHalfGap;
  const w = 0.3;
  const s = project({x: 0, y: PITCH.crossbarY, z}, cam).s;
  const sw = Math.max(1.5, Math.min(4, 0.035 * s));
  const top = PITCH.postTopY;
  const flag = (x: number, dir: number) => {
    const base = project({x, y: top, z}, cam);
    const size = 0.9 * base.s;
    const wave = Math.sin(t * 9 + x) * 0.18;
    return (
      <path
        d={`M${base.x},${base.y} L${base.x + dir * size * 1.2},${base.y + size * (0.35 + wave)} L${base.x},${base.y + size * 0.8} Z`}
        fill={COLORS.flag}
        stroke={COLORS.outline}
        strokeWidth={sw * 0.5}
        strokeLinejoin="round"
      />
    );
  };
  return (
    <g>
      <path
        d={wallRect(-g, PITCH.crossbarY - w / 2, g, PITCH.crossbarY + w / 2, z, cam)}
        fill={COLORS.post}
        stroke={COLORS.outline}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {[-g, g].map((x) => (
        <g key={x}>
          {flag(x, x < 0 ? -1 : 1)}
          <path d={wallRect(x - w / 2, 0, x + w / 2, top, z, cam)} fill={COLORS.post} stroke={COLORS.outline} strokeWidth={sw} />
          <path d={wallRect(x - 0.42, 0, x + 0.42, 2.0, z - 0.2, cam)} fill={COLORS.pad} stroke={COLORS.outline} strokeWidth={sw} />
          <path d={wallRect(x - 0.42, 0.75, x + 0.42, 1.25, z - 0.2, cam)} fill={COLORS.padBand} />
        </g>
      ))}
    </g>
  );
};

// Darkens the frame edges so the floodlit middle glows.
export const Vignette: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="vignette" cx="0.5" cy="0.52" r="0.75">
        <stop offset="0.55" stopColor="#05070C" stopOpacity={0} />
        <stop offset="1" stopColor="#05070C" stopOpacity={0.55} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#vignette)" />
  </g>
);
