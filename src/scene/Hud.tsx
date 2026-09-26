import React from 'react';
import {Easing, interpolate} from 'remotion';
import {COLORS} from '../config';

const FONT = "'DejaVu Sans', 'Arial Black', Arial, sans-serif";
const INK = COLORS.outline;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Counts up one number at a time: from, from+1, ... to.
const tickState = (t: number, from: number, to: number, start: number, step: number) => {
  if (t < start) return {value: from, since: Infinity, landed: false};
  const idx = Math.min(to - from, Math.floor((t - start) / step) + 1);
  const since = t - (start + (idx - 1) * step);
  return {value: from + idx, since, landed: from + idx === to};
};

export type ScoreTicks = {from: number; to: number; start: number}[];

export const Scoreboard: React.FC<{
  t: number;
  ticks: ScoreTicks;
  step: number;
  pulse: number; // 0..1, how big the celebration pulse is right now
}> = ({t, ticks, step, pulse}) => {
  // Find the latest tick range that has started.
  let state = {value: ticks[0]?.from ?? 0, since: Infinity, landed: false};
  for (const r of ticks) {
    if (t >= r.start) state = tickState(t, r.from, r.to, r.start, step);
  }
  const pop = interpolate(state.since, [0, 0.07, 0.22], [1.55, 1.2, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const slide = interpolate(state.since, [0, 0.14], [34, 0], {...clamp, easing: Easing.out(Easing.back(2))});
  const flash = state.landed ? interpolate(state.since, [0, 0.45], [1, 0], {...clamp, easing: Easing.out(Easing.quad)}) : 0;

  const W = 800;
  const H = 136;
  const X = (1080 - W) / 2;
  const Y = 206;
  const scale = 1 + 0.07 * pulse;
  const clockSecs = 78 * 60 + 41 + Math.floor(t);
  const clock = `${Math.floor(clockSecs / 60)}:${String(clockSecs % 60).padStart(2, '0')}`;

  const scoreBox = (x: number, value: number, live: boolean) => (
    <g>
      <rect
        x={x}
        y={Y + 16}
        width={124}
        height={H - 32}
        rx={18}
        fill={live && flash > 0 ? mix('#FFFFFF', COLORS.yellow, flash) : '#FFFFFF'}
        stroke={INK}
        strokeWidth={6}
      />
      <g transform={`translate(${x + 62},${Y + H / 2 + (live ? slide : 0)}) scale(${live ? pop : 1})`}>
        <text
          y={30}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={88}
          fill={INK}
        >
          {value}
        </text>
      </g>
    </g>
  );

  return (
    <g transform={`translate(540,${Y + H / 2}) scale(${scale}) translate(-540,${-(Y + H / 2)})`}>
      {pulse > 0 && (
        <rect
          x={X - 22 * pulse}
          y={Y - 22 * pulse}
          width={W + 44 * pulse}
          height={H + 44 * pulse}
          rx={48}
          fill={COLORS.yellow}
          opacity={0.55 * pulse}
        />
      )}
      <rect x={X} y={Y + 10} width={W} height={H} rx={34} fill="#000000" opacity={0.25} />
      <rect x={X} y={Y} width={W} height={H} rx={34} fill={INK} stroke="#FFFFFF" strokeWidth={6} />
      {/* home */}
      <rect x={X + 14} y={Y + 14} width={318} height={H - 28} rx={22} fill={COLORS.blue} />
      <text x={X + 104} y={Y + H / 2 + 17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#FFFFFF">
        BLUES
      </text>
      {scoreBox(X + 196, state.value, true)}
      {/* away */}
      <rect x={X + W - 332} y={Y + 14} width={318} height={H - 28} rx={22} fill={COLORS.red} />
      <text x={X + W - 104} y={Y + H / 2 + 17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#FFFFFF">
        REDS
      </text>
      {scoreBox(X + W - 320, 0, false)}
      {/* clock */}
      <text x={540} y={Y + H / 2 + 13} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#FFFFFF">
        {clock}
      </text>
    </g>
  );
};

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

// Chunky cartoon text with a thick outline and a drop shadow.
export const PopText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  scale: number;
  rotate?: number;
  shadow?: string;
}> = ({text, x, y, size, fill, scale, rotate = 0, shadow = COLORS.blue}) => (
  <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`}>
    <text
      x={size * 0.05}
      y={size * 0.39}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={900}
      fontSize={size}
      fill={shadow}
      stroke={INK}
      strokeWidth={size * 0.09}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {text}
    </text>
    <text
      y={size * 0.34}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={900}
      fontSize={size}
      fill={fill}
      stroke={INK}
      strokeWidth={size * 0.09}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {text}
    </text>
  </g>
);

export const Starburst: React.FC<{x: number; y: number; r: number; spikes: number; rotate: number; fill: string; scale: number}> = ({
  x,
  y,
  r,
  spikes,
  rotate,
  fill,
  scale,
}) => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.72 : r;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`}>
      <polygon points={pts.join(' ')} fill={fill} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
    </g>
  );
};
