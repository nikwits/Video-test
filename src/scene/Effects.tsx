import React from 'react';
import {Easing, interpolate, random} from 'remotion';
import {COLORS} from '../config';

const INK = COLORS.outline;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Streaks rushing out from the vanishing point. They speed up as they
// come towards the lens, which gives a natural ease-in.
export const SpeedLines: React.FC<{vp: {x: number; y: number}; t: number; intensity: number}> = ({vp, t, intensity}) => {
  if (intensity <= 0.01) return null;
  const lines = [];
  for (let i = 0; i < 34; i++) {
    const side = i % 2 ? 1 : -1;
    // keep the middle clear so the player stays readable
    const a = (side > 0 ? 0 : Math.PI) + (random(`sa${i}`) - 0.5) * 1.9 + Math.PI / 2 * 0.35 * side;
    const speed = 0.9 + random(`sv${i}`) * 0.7;
    const u = (t * speed + random(`so${i}`)) % 1; // 0..1 life
    const r0 = 260 + Math.pow(u, 2.2) * 1500;
    const len = 90 + Math.pow(u, 2) * 420;
    const w = 5 + u * 12;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const x0 = vp.x + dx * r0;
    const y0 = vp.y + dy * r0;
    const x1 = vp.x + dx * (r0 + len);
    const y1 = vp.y + dy * (r0 + len);
    const nx = -dy * w;
    const ny = dx * w;
    const fade = Math.sin(Math.PI * u);
    lines.push(
      <polygon
        key={i}
        points={`${x0},${y0} ${x1 + nx},${y1 + ny} ${x1 - nx},${y1 - ny}`}
        fill="#FFFFFF"
        opacity={0.7 * fade * intensity}
      />,
    );
  }
  return <g>{lines}</g>;
};

// Diagonal team-colour wipe. p: 0..1, fully covering at 0.5.
export const Wipe: React.FC<{p: number}> = ({p}) => {
  if (p <= 0 || p >= 1) return null;
  const e = Easing.inOut(Easing.cubic)(p);
  const travel = interpolate(e, [0, 1], [2500, -2500]);
  const band = 2400;
  return (
    <g transform={`translate(540,960) rotate(-28) translate(0,${travel})`}>
      <rect x={-2000} y={-band / 2 - 120} width={4000} height={60} fill={COLORS.yellow} />
      <rect x={-2000} y={-band / 2 - 50} width={4000} height={50} fill="#FFFFFF" />
      <rect x={-2000} y={-band / 2} width={4000} height={band} fill={COLORS.blue} />
      {Array.from({length: 7}).map((_, i) => (
        <path
          key={i}
          d={`M${-900 + i * 300},-60 l120,-120 l120,120 l-40,0 l-80,-80 l-80,80 Z`}
          fill="#FFFFFF"
          opacity={0.18}
        />
      ))}
      <rect x={-2000} y={band / 2} width={4000} height={50} fill="#FFFFFF" />
      <rect x={-2000} y={band / 2 + 50} width={4000} height={60} fill={COLORS.yellow} />
    </g>
  );
};

// Cartoon impact: a spiky star that punches out and fades.
export const Impact: React.FC<{x: number; y: number; since: number; size: number; color?: string}> = ({
  x,
  y,
  since,
  size,
  color = COLORS.yellow,
}) => {
  if (since < 0 || since > 0.45) return null;
  const grow = interpolate(since, [0, 0.12, 0.45], [0.3, 1.1, 1.25], {...clamp, easing: Easing.out(Easing.cubic)});
  const fade = interpolate(since, [0.2, 0.45], [1, 0], clamp);
  const pts: string[] = [];
  const n = 9;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + 0.2;
    const r = (i % 2 ? 0.45 : 1) * size * grow * (i % 4 === 0 ? 1.15 : 1);
    pts.push(`${x + Math.cos(a) * r},${y + Math.sin(a) * r * 0.8}`);
  }
  return (
    <g opacity={fade}>
      <polygon points={pts.join(' ')} fill={color} stroke={INK} strokeWidth={Math.max(3, size * 0.06)} strokeLinejoin="round" />
      <polygon
        points={pts.map((p) => {
          const [px, py] = p.split(',').map(Number);
          return `${x + (px - x) * 0.5},${y + (py - y) * 0.5}`;
        }).join(' ')}
        fill="#FFFFFF"
      />
    </g>
  );
};

// Puffs of dust/grass kicked up on landing.
export const Dust: React.FC<{x: number; y: number; since: number; size: number; seed: string}> = ({x, y, since, size, seed}) => {
  if (since < 0 || since > 0.8) return null;
  const u = interpolate(since, [0, 0.8], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const fade = interpolate(since, [0.35, 0.8], [1, 0], clamp);
  return (
    <g opacity={fade}>
      {Array.from({length: 7}).map((_, i) => {
        const dir = (i / 6 - 0.5) * 2; // -1..1
        const px = x + dir * size * 1.6 * u + (random(`${seed}x${i}`) - 0.5) * size * 0.3;
        const py = y - Math.sin((i / 6) * Math.PI) * size * 0.5 * u;
        const r = size * (0.22 + random(`${seed}r${i}`) * 0.18) * (0.6 + u * 0.7);
        return <circle key={i} cx={px} cy={py} r={r} fill="#E9F5D8" stroke={INK} strokeWidth={Math.max(2, size * 0.035)} />;
      })}
    </g>
  );
};

// Little stars spinning round a dazed defender's head.
export const DizzyStars: React.FC<{x: number; y: number; t: number; r: number; opacity: number}> = ({x, y, t, r, opacity}) => (
  <g opacity={opacity}>
    {[0, 1, 2].map((i) => {
      const a = t * 7 + (i * Math.PI * 2) / 3;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r * 0.35;
      return <Sparkle key={i} x={px} y={py} size={r * 0.32} color={COLORS.yellow} rotate={t * 200} />;
    })}
  </g>
);

export const Sparkle: React.FC<{x: number; y: number; size: number; color: string; rotate?: number}> = ({
  x,
  y,
  size,
  color,
  rotate = 0,
}) => {
  const s = size;
  const d = `M0,${-s} Q${s * 0.18},${-s * 0.18} ${s},0 Q${s * 0.18},${s * 0.18} 0,${s} Q${-s * 0.18},${s * 0.18} ${-s},0 Q${-s * 0.18},${-s * 0.18} 0,${-s} Z`;
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`}>
      <path d={d} fill={color} stroke={INK} strokeWidth={Math.max(2, s * 0.14)} strokeLinejoin="round" />
    </g>
  );
};

const CONFETTI_COLORS = [COLORS.blue, COLORS.yellow, '#FFFFFF', '#FF6FB5', '#2EC4B6', '#8ED1FC'];

// Confetti raining down. Everything is out of frame by `clearBy`.
export const Confetti: React.FC<{t: number; start: number; clearBy: number}> = ({t, start, clearBy}) => {
  if (t < start || t > clearBy) return null;
  const pieces = [];
  const span = clearBy - start;
  for (let i = 0; i < 110; i++) {
    const delay = random(`cd${i}`) * span * 0.3;
    const life = span - delay; // each piece has just enough time to clear the frame
    const u = (t - start - delay) / life;
    if (u < 0 || u > 1) continue;
    const fall = Easing.in(Easing.quad)(u) * 0.55 + u * 0.45; // accelerates a bit, then drifts
    const y = -80 + fall * (1920 + 200);
    const x0 = random(`cx${i}`) * 1080;
    const sway = Math.sin(u * 10 + i) * 50 * random(`cs${i}`);
    const rot = u * 720 * (random(`cr${i}`) - 0.5) + i * 37;
    const flip = Math.cos(u * 18 + i);
    const w = 30 + random(`cw${i}`) * 20;
    const h = w * 0.55;
    pieces.push(
      <g key={i} transform={`translate(${x0 + sway},${y}) rotate(${rot}) scale(${flip},1)`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} stroke={INK} strokeWidth={2.5} />
      </g>,
    );
  }
  return <g>{pieces}</g>;
};
