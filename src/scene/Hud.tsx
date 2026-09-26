import React from 'react';
import {Easing, interpolate} from 'remotion';
import {COLORS, PALETTE} from '../config';

// No condensed font ships with the container, so squeeze a bold sans instead.
export const FONT = "'Liberation Sans', Arial, Helvetica, sans-serif";
const INK = PALETTE.kit;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Counts up one number at a time: from, from+1, ... to.
const tickState = (t: number, from: number, to: number, start: number, step: number) => {
  if (t < start) return {value: from, since: Infinity, landed: false};
  const idx = Math.min(to - from, Math.floor((t - start) / step) + 1);
  const since = t - (start + (idx - 1) * step);
  return {value: from + idx, since, landed: from + idx === to};
};

export type ScoreTicks = {from: number; to: number; start: number}[];

export const Condensed: React.FC<{
  x: number;
  y: number;
  size: number;
  fill: string;
  children: React.ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  squeeze?: number;
}> = ({x, y, size, fill, children, anchor = 'middle', squeeze = 0.82}) => (
  <g transform={`translate(${x},${y}) scale(${squeeze},1)`}>
    <text textAnchor={anchor} fontFamily={FONT} fontWeight={700} fontSize={size} fill={fill}>
      {children}
    </text>
  </g>
);

export const Scoreboard: React.FC<{
  t: number;
  ticks: ScoreTicks;
  step: number;
  pulse: number; // 0..1, how big the celebration pulse is right now
}> = ({t, ticks, step, pulse}) => {
  let state = {value: ticks[0]?.from ?? 0, since: Infinity, landed: false};
  for (const r of ticks) {
    if (t >= r.start) state = tickState(t, r.from, r.to, r.start, step);
  }
  const pop = interpolate(state.since, [0, 0.07, 0.22], [1.35, 1.12, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const slide = interpolate(state.since, [0, 0.14], [26, 0], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const flash = state.landed ? interpolate(state.since, [0, 0.5], [1, 0], {...clamp, easing: Easing.out(Easing.quad)}) : 0;

  const W = 760;
  const H = 118;
  const X = (1080 - W) / 2;
  const Y = 212;
  const scale = 1 + 0.05 * pulse;
  const clockSecs = 78 * 60 + 41 + Math.floor(t);
  const clock = `${Math.floor(clockSecs / 60)}:${String(clockSecs % 60).padStart(2, '0')}`;

  const scoreBox = (x: number, value: number, live: boolean) => (
    <g>
      <rect
        x={x}
        y={Y + 14}
        width={110}
        height={H - 28}
        rx={10}
        fill={live && flash > 0 ? mix(PALETTE.white, PALETTE.accent, flash) : PALETTE.white}
      />
      <g transform={`translate(${x + 55},${Y + H / 2 + (live ? slide : 0)}) scale(${live ? pop : 1})`}>
        <Condensed x={0} y={27} size={78} fill={INK}>
          {value}
        </Condensed>
      </g>
    </g>
  );

  return (
    <g transform={`translate(540,${Y + H / 2}) scale(${scale}) translate(-540,${-(Y + H / 2)})`}>
      {pulse > 0 && (
        <rect
          x={X - 16 * pulse}
          y={Y - 16 * pulse}
          width={W + 32 * pulse}
          height={H + 32 * pulse}
          rx={30}
          fill={PALETTE.accent}
          opacity={0.45 * pulse}
        />
      )}
      <rect x={X} y={Y + 8} width={W} height={H} rx={18} fill="#000000" opacity={0.35} />
      <rect x={X} y={Y} width={W} height={H} rx={18} fill={INK} stroke={PALETTE.shadow} strokeWidth={3} />
      <rect x={X + 16} y={Y + 26} width={6} height={H - 52} rx={3} fill={PALETTE.accent} />
      <Condensed x={X + 40} y={Y + H / 2 + 15} size={44} fill={PALETTE.white} anchor="start">
        HOME
      </Condensed>
      {scoreBox(X + 176, state.value, true)}
      <Condensed x={X + W - 40} y={Y + H / 2 + 15} size={44} fill={PALETTE.mid} anchor="end">
        AWAY
      </Condensed>
      {scoreBox(X + W - 286, 0, false)}
      <Condensed x={540} y={Y + H / 2 + 12} size={34} fill={PALETTE.mid}>
        {clock}
      </Condensed>
    </g>
  );
};

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

// Big headline word: bold, slightly italic, clean outline and a soft drop shadow.
export const Headline: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  scale: number;
  underline?: number; // 0..1 wipe-in of the bar underneath
}> = ({text, x, y, size, fill, scale, underline = 0}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <g transform="skewX(-8)">
      <g opacity={0.45} transform={`translate(${size * 0.03},${size * 0.05})`}>
        <Condensed x={0} y={size * 0.36} size={size} fill="#000000" squeeze={0.86}>
          {text}
        </Condensed>
      </g>
      <g transform={`translate(0,${size * 0.36}) scale(0.86,1)`}>
        <text
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={700}
          fontSize={size}
          fill={fill}
          stroke={INK}
          strokeWidth={size * 0.035}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {text}
        </text>
      </g>
      {underline > 0 && (
        <rect x={(-size * 1.1) / 2} y={size * 0.5} width={size * 1.1 * underline} height={size * 0.07} fill={PALETTE.white} />
      )}
    </g>
  </g>
);

// A small dark pill with a lime edge: "+5", "+2".
export const Tag: React.FC<{text: string; x: number; y: number; size: number; scale: number}> = ({text, x, y, size, scale}) => {
  const w = size * 1.7;
  const h = size * 1.05;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-w / 2} y={-h / 2 + 6} width={w} height={h} rx={h / 2} fill="#000000" opacity={0.35} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={INK} stroke={COLORS.accent} strokeWidth={size * 0.06} />
      <Condensed x={0} y={size * 0.35} size={size} fill={PALETTE.white}>
        {text}
      </Condensed>
    </g>
  );
};
