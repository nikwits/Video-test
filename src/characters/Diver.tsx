import React from 'react';
import {COLORS, Kit} from '../config';
import {BallShape} from './Ball';

// The try-scoring dive, seen from behind and above.
// Drawn lying along the local -y axis: boots at y=0, ball at y=-DIVER_LENGTH.
// The caller stretches it along that axis to match the perspective.
export const DIVER_LENGTH = 232;

const INK = COLORS.outline;
const O = 3.5;

const S: React.FC<{d: string; w: number; c: string}> = ({d, w, c}) => (
  <path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
);

export const Diver: React.FC<{kit: Kit; kick: number}> = ({kit, kick}) => {
  // kick: small leg flutter, 0..1
  const k = kick * 8;
  const legs = (side: -1 | 1) => {
    const hip = [side * 13, -84];
    const knee = [side * 17, -46 + (side < 0 ? k : -k)];
    const foot = [side * 19, -10];
    const d = `M${hip[0]},${hip[1]} L${knee[0]},${knee[1]} L${foot[0]},${foot[1]}`;
    const kd = `M${knee[0]},${knee[1]} L${foot[0]},${foot[1]}`;
    return (
      <g key={side}>
        <S d={d} w={19 + 2 * O} c={INK} />
        <S d={`M${hip[0]},${hip[1]} L${knee[0]},${knee[1]}`} w={19} c={kit.skin} />
        <S d={kd} w={19} c={kit.socks} />
        <S d={`M${knee[0]},${knee[1] + 6} L${knee[0] + side * 0.5},${knee[1] + 14}`} w={19} c={kit.sockHoop} />
        <g transform={`translate(${foot[0]},${foot[1]})`}>
          <ellipse rx={11} ry={12} fill="#3B3B4F" stroke={INK} strokeWidth={O} />
          {[
            [-4, -5],
            [4, -5],
            [-4, 2],
            [4, 2],
            [0, 7],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2} fill="#D9D9E3" />
          ))}
        </g>
      </g>
    );
  };
  const arm = (side: -1 | 1) => {
    const sh = [side * 34, -160];
    const el = [side * 30, -190];
    const hand = [side * 17, -216];
    return (
      <g key={side}>
        <S d={`M${sh[0]},${sh[1]} L${el[0]},${el[1]} L${hand[0]},${hand[1]}`} w={15 + 2 * O} c={INK} />
        <S d={`M${el[0]},${el[1]} L${hand[0]},${hand[1]}`} w={15} c={kit.skin} />
        <S d={`M${sh[0]},${sh[1]} L${el[0]},${el[1] + 8}`} w={18} c={kit.shirt} />
        <S d={`M${el[0]},${el[1] + 12} L${el[0]},${el[1] + 7}`} w={18} c={kit.trim} />
      </g>
    );
  };
  return (
    <g>
      {legs(-1)}
      {legs(1)}
      {/* shorts */}
      <path
        d="M-32,-74 L32,-74 L30,-100 L-30,-100 Z"
        fill={kit.shorts}
        stroke={INK}
        strokeWidth={O}
        strokeLinejoin="round"
      />
      {/* ball first so the hands wrap over it */}
      <g transform={`translate(0,${-DIVER_LENGTH + 12})`}>
        <BallShape />
      </g>
      {arm(-1)}
      {arm(1)}
      {/* torso: his back, number facing us */}
      <path
        d="M-30,-98 L30,-98 L38,-150 Q36,-164 22,-166 L-22,-166 Q-36,-164 -38,-150 Z"
        fill={kit.shirt}
        stroke={INK}
        strokeWidth={O}
        strokeLinejoin="round"
      />
      <path d="M28,-104 L34,-150 L28,-160 L24,-104 Z" fill={kit.shirtShade} />
      <text
        x={0}
        y={-118}
        textAnchor="middle"
        fontFamily="'DejaVu Sans', 'Arial Black', Arial, sans-serif"
        fontWeight={900}
        fontSize={34}
        fill={kit.trim}
        stroke={INK}
        strokeWidth={3}
        paintOrder="stroke"
      >
        {kit.number}
      </text>
      {/* head, back of */}
      <circle cx={-22} cy={-176} r={6} fill={kit.skin} stroke={INK} strokeWidth={O} />
      <circle cx={22} cy={-176} r={6} fill={kit.skin} stroke={INK} strokeWidth={O} />
      <circle cx={0} cy={-178} r={22} fill={kit.hair} stroke={INK} strokeWidth={O} />
      {/* hands on the ball */}
      <circle cx={-15} cy={-214} r={8.5} fill={kit.skin} stroke={INK} strokeWidth={O} />
      <circle cx={15} cy={-214} r={8.5} fill={kit.skin} stroke={INK} strokeWidth={O} />
    </g>
  );
};
