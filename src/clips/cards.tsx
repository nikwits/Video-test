// Backgrounds and icons for the title cards (intro and outro).
import React from 'react';
import {Easing} from 'remotion';
import {COLORS, PALETTE, PITCH} from '../config';
import {Camera, project} from '../engine/camera';
import {Backdrop, Posts} from '../scene/World';
import {Drawable, ease, renderSorted} from '../scene/stage';

// The stadium at night, seen from in front of the posts, drifting slowly
// forward. `extra` adds sprites (a player) to the depth-sorted scene.
export const StadiumCard: React.FC<{t: number; hold: number; dim: number; cy?: number; extra?: (cam: Camera) => Drawable[]}> = ({
  t,
  hold,
  dim,
  cy = 1060,
  extra,
}) => {
  const tt = Math.min(t, hold);
  const push = ease(tt, 0, hold, 0, 1.0, Easing.inOut(Easing.sin));
  const cam: Camera = {x: -0.6, y: 1.6, z: 16.5 + push, yaw: 0.02, pitch: -0.12, focal: 1600, cx: 540, cy};
  const items: Drawable[] = [
    {depth: project({x: 0, y: 0, z: PITCH.tryLineZ}, cam).depth, node: <Posts key="posts" cam={cam} t={tt} />},
    ...(extra ? extra(cam) : []),
  ];
  return (
    <g>
      <Backdrop cam={cam} t={tt} cheer={0} />
      {renderSorted(items)}
      <defs>
        <linearGradient id="cardShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05070C" stopOpacity={0.85 * dim} />
          <stop offset="0.55" stopColor="#05070C" stopOpacity={0.55 * dim} />
          <stop offset="1" stopColor="#05070C" stopOpacity={0.35 * dim} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#cardShade)" />
    </g>
  );
};

// Small line icons for each way to score, drawn in a 100x100 box.
export const ScoreIcon: React.FC<{kind: 'try' | 'conversion' | 'penalty' | 'drop'}> = ({kind}) => {
  const line = {stroke: PALETTE.white, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  const ball = (x: number, y: number, rot = -20, s = 1) => (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <ellipse rx={17} ry={11} fill={PALETTE.white} />
      <path d="M-9,-8 Q-5,0 -9,8 M9,-8 Q5,0 9,8" stroke={PALETTE.mid} strokeWidth={3} fill="none" />
    </g>
  );
  const posts = (
    <g {...line}>
      <path d="M28,92 L28,10 M72,92 L72,10 M28,58 L72,58" />
    </g>
  );
  switch (kind) {
    case 'try':
      return (
        <g>
          <path d="M8,72 L92,72" {...line} />
          <path d="M8,84 L92,84" stroke={COLORS.accent} strokeWidth={4} strokeDasharray="8 8" />
          {ball(52, 58, -10, 1.3)}
          <path d="M22,40 L34,48 M50,26 L50,40 M78,40 L66,48" {...line} strokeWidth={4} />
        </g>
      );
    case 'conversion':
      return (
        <g>
          {posts}
          {ball(50, 32, 30)}
          <path d="M50,92 L44,80 L56,80 Z" fill={COLORS.accent} />
        </g>
      );
    case 'penalty':
      // a referee's whistle
      return (
        <g>
          <circle cx={42} cy={58} r={24} {...line} />
          <path d="M60,40 L90,32 L92,48 L64,52" {...line} />
          <circle cx={42} cy={58} r={7} fill={COLORS.accent} />
          <path d="M18,28 Q10,20 16,10" {...line} strokeWidth={4} />
        </g>
      );
    case 'drop':
      return (
        <g>
          <path d="M8,88 L92,88" {...line} />
          <path d="M26,18 Q26,70 40,84 Q56,50 80,20" stroke={COLORS.accent} strokeWidth={4} strokeDasharray="7 7" fill="none" />
          {ball(26, 20, 80, 0.9)}
          <circle cx={40} cy={85} r={5} fill={PALETTE.white} />
        </g>
      );
  }
};
