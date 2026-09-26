import React from 'react';
import {COLORS, Kit} from '../config';
import {BallShape} from './Ball';

// Characters are drawn in local "sprite units" (about 1cm each).
// Feet sit on (0,0) and the body goes up into negative y.

export type Pt = [number, number];

export type Rig = {
  hipL: Pt;
  kneeL: Pt;
  footL: Pt;
  soleL?: boolean; // show the underside of the boot (back view, heel kicked up)
  hipR: Pt;
  kneeR: Pt;
  footR: Pt;
  soleR?: boolean;
  legRBehind?: boolean; // draw right leg behind the torso (kick follow-through)
  shoulderL: Pt;
  elbowL: Pt;
  handL: Pt;
  shoulderR: Pt;
  elbowR: Pt;
  handR: Pt;
  ball?: {x: number; y: number; rot: number};
};

export type View = 'back' | 'front';
export type Expression = 'determined' | 'shock' | 'dizzy' | 'joy' | 'focus';

const O = 3.5; // outline thickness in sprite units
const INK = COLORS.outline;

const seg = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const line = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');

const Stroke: React.FC<{pts: Pt[]; w: number; color: string}> = ({pts, w, color}) => (
  <path d={line(pts)} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
);

const Leg: React.FC<{hip: Pt; knee: Pt; foot: Pt; sole?: boolean; kit: Kit; side: -1 | 1}> = ({
  hip,
  knee,
  foot,
  sole,
  kit,
  side,
}) => {
  const W = 19;
  const hoopA = seg(knee, foot, 0.12);
  const hoopB = seg(knee, foot, 0.3);
  return (
    <g>
      <Stroke pts={[hip, knee, foot]} w={W + 2 * O} color={INK} />
      <Stroke pts={[hip, knee]} w={W} color={kit.skin} />
      <Stroke pts={[knee, foot]} w={W} color={kit.socks} />
      <Stroke pts={[knee, hoopA]} w={W} color={kit.socks} />
      <Stroke pts={[hoopA, hoopB]} w={W - 0.5} color={kit.sockHoop} />
      {sole ? (
        <g transform={`translate(${foot[0]},${foot[1]})`}>
          <ellipse rx={11} ry={13} fill="#3B3B4F" stroke={INK} strokeWidth={O} />
          {[
            [-4, -6],
            [4, -6],
            [-4, 1],
            [4, 1],
            [0, 8],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2} fill="#D9D9E3" />
          ))}
        </g>
      ) : (
        <g transform={`translate(${foot[0] + side * 2},${foot[1] - 2})`}>
          <path
            d="M-12,4 Q-13,-8 0,-9 Q13,-8 12,4 Z"
            fill={INK}
            stroke={INK}
            strokeWidth={O}
            strokeLinejoin="round"
          />
          <path d="M-7,-5 L7,-5" stroke={kit.shirt} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

const Arm: React.FC<{shoulder: Pt; elbow: Pt; hand: Pt; kit: Kit; fist?: boolean}> = ({
  shoulder,
  elbow,
  hand,
  kit,
  fist,
}) => {
  const cuffA = seg(shoulder, elbow, 0.62);
  const cuffB = seg(shoulder, elbow, 0.8);
  return (
    <g>
      <Stroke pts={[shoulder, elbow, hand]} w={15 + 2 * O} color={INK} />
      <Stroke pts={[elbow, hand]} w={15} color={kit.skin} />
      <Stroke pts={[shoulder, cuffB]} w={18} color={kit.shirt} />
      <Stroke pts={[cuffA, cuffB]} w={18} color={kit.trim} />
      <circle cx={hand[0]} cy={hand[1]} r={fist ? 9.5 : 8.5} fill={kit.skin} stroke={INK} strokeWidth={O} />
    </g>
  );
};

const Shorts: React.FC<{kit: Kit}> = ({kit}) => (
  <path
    d="M-30,-86 L30,-86 L34,-54 L4,-54 L0,-62 L-4,-54 L-34,-54 Z"
    fill={kit.shorts}
    stroke={INK}
    strokeWidth={O}
    strokeLinejoin="round"
  />
);

const Torso: React.FC<{kit: Kit; view: View}> = ({kit, view}) => (
  <g>
    <path
      d="M-22,-136 Q-36,-134 -39,-122 L-31,-80 L31,-80 L39,-122 Q36,-134 22,-136 Q0,-128 -22,-136 Z"
      fill={kit.shirt}
      stroke={INK}
      strokeWidth={O}
      strokeLinejoin="round"
    />
    {/* flat side shading */}
    <path d="M26,-130 L36,-122 L30,-84 L24,-84 Z" fill={kit.shirtShade} />
    {/* hem stripe */}
    <path d="M-31,-86 L31,-86" stroke={kit.trim} strokeWidth={4} />
    {view === 'back' ? (
      <>
        <path d="M-17,-134 Q0,-127 17,-134" stroke={kit.trim} strokeWidth={5} fill="none" strokeLinecap="round" />
        <text
          x={0}
          y={-94}
          textAnchor="middle"
          fontFamily="'DejaVu Sans', 'Arial Black', Arial, sans-serif"
          fontWeight={900}
          fontSize={34}
          fill={kit.trim}
          stroke={INK}
          strokeWidth={3}
          paintOrder="stroke"
          letterSpacing={-1}
        >
          {kit.number}
        </text>
      </>
    ) : (
      <>
        <path d="M-15,-135 L0,-118 L15,-135" stroke={kit.trim} strokeWidth={5} fill="none" strokeLinejoin="round" />
        <circle cx={-15} cy={-110} r={6} fill={kit.trim} stroke={INK} strokeWidth={2} />
        <text
          x={15}
          y={-104}
          textAnchor="middle"
          fontFamily="'DejaVu Sans', 'Arial Black', Arial, sans-serif"
          fontWeight={900}
          fontSize={15}
          fill={kit.trim}
          stroke={INK}
          strokeWidth={2}
          paintOrder="stroke"
        >
          {kit.number}
        </text>
      </>
    )}
  </g>
);

const Face: React.FC<{expr: Expression}> = ({expr}) => {
  const brow = {
    determined: [
      [-15, -171, -4, -166],
      [4, -166, 15, -171],
    ],
    focus: [
      [-15, -170, -4, -167],
      [4, -167, 15, -170],
    ],
    shock: [
      [-15, -174, -4, -176],
      [4, -176, 15, -174],
    ],
    dizzy: [
      [-15, -172, -4, -172],
      [4, -172, 15, -172],
    ],
    joy: [
      [-15, -173, -4, -175],
      [4, -175, 15, -173],
    ],
  }[expr];
  return (
    <g>
      {expr === 'dizzy' ? (
        <>
          {[-9, 9].map((x) => (
            <g key={x} stroke={INK} strokeWidth={2.6} strokeLinecap="round">
              <path d={`M${x - 4},-162 L${x + 4},-154`} />
              <path d={`M${x + 4},-162 L${x - 4},-154`} />
            </g>
          ))}
        </>
      ) : expr === 'joy' ? (
        <>
          {[-9, 9].map((x) => (
            <path
              key={x}
              d={`M${x - 5},-157 Q${x},-165 ${x + 5},-157`}
              stroke={INK}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </>
      ) : (
        <>
          {[-9, 9].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-158} rx={5.2} ry={expr === 'shock' ? 7 : 6} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
              <circle cx={x + (expr === 'focus' ? 0 : 0.8)} cy={-157} r={expr === 'shock' ? 2 : 2.8} fill={INK} />
            </g>
          ))}
        </>
      )}
      {brow.map(([x0, y0, x1, y1], i) => (
        <path key={i} d={`M${x0},${y0} L${x1},${y1}`} stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      ))}
      <path d="M-2,-152 Q1,-148 -2,-146" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      {expr === 'joy' && (
        <g>
          <path d="M-13,-144 Q0,-126 13,-144 Z" fill="#7A1F2B" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M-10,-143 L10,-143 L9,-140 L-9,-140 Z" fill="#FFFFFF" />
          <ellipse cx={0} cy={-134} rx={5} ry={3} fill="#FF7A8A" />
        </g>
      )}
      {expr === 'determined' && (
        <path d="M-8,-141 Q0,-144 8,-141" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      )}
      {expr === 'focus' && <path d="M-6,-141 L6,-141" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      {expr === 'shock' && <ellipse cx={0} cy={-139} rx={5} ry={6.5} fill="#7A1F2B" stroke={INK} strokeWidth={2.4} />}
      {expr === 'dizzy' && (
        <path d="M-9,-140 Q-4.5,-145 0,-140 Q4.5,-135 9,-140" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      )}
      {(expr === 'joy' || expr === 'shock') && (
        <>
          <ellipse cx={-17} cy={-148} rx={4.5} ry={2.8} fill="#FF8C8C" opacity={0.6} />
          <ellipse cx={17} cy={-148} rx={4.5} ry={2.8} fill="#FF8C8C" opacity={0.6} />
        </>
      )}
    </g>
  );
};

const Head: React.FC<{kit: Kit; view: View; expr: Expression}> = ({kit, view, expr}) => (
  <g>
    <rect x={-8} y={-142} width={16} height={12} fill={kit.skin} stroke={INK} strokeWidth={O} />
    <circle cx={-25} cy={-155} r={6.5} fill={kit.skin} stroke={INK} strokeWidth={O} />
    <circle cx={25} cy={-155} r={6.5} fill={kit.skin} stroke={INK} strokeWidth={O} />
    {view === 'back' ? (
      <>
        <circle cx={0} cy={-157} r={25} fill={kit.hair} stroke={INK} strokeWidth={O} />
        <path d="M-17,-137 Q0,-131 17,-137" stroke={kit.skin} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M-12,-172 Q-4,-178 6,-176" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={4} fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx={0} cy={-157} r={25} fill={kit.skin} stroke={INK} strokeWidth={O} />
        <path
          d="M-25,-160 Q-25,-184 0,-184 Q25,-184 25,-160 L19,-168 L12,-162 L5,-169 L-3,-163 L-10,-169 L-17,-163 Z"
          fill={kit.hair}
          stroke={INK}
          strokeWidth={O}
          strokeLinejoin="round"
        />
        <Face expr={expr} />
      </>
    )}
  </g>
);

export const Character: React.FC<{
  rig: Rig;
  kit: Kit;
  view: View;
  expr?: Expression;
  fists?: boolean;
}> = ({rig, kit, view, expr = 'determined', fists}) => {
  const legL = <Leg hip={rig.hipL} knee={rig.kneeL} foot={rig.footL} sole={rig.soleL} kit={kit} side={-1} />;
  const legR = <Leg hip={rig.hipR} knee={rig.kneeR} foot={rig.footR} sole={rig.soleR} kit={kit} side={1} />;
  const armL = <Arm shoulder={rig.shoulderL} elbow={rig.elbowL} hand={rig.handL} kit={kit} fist={fists} />;
  const armR = <Arm shoulder={rig.shoulderR} elbow={rig.elbowR} hand={rig.handR} kit={kit} fist={fists} />;
  const ball = rig.ball ? (
    <g transform={`translate(${rig.ball.x},${rig.ball.y}) rotate(${rig.ball.rot})`}>
      <BallShape />
    </g>
  ) : null;

  return (
    <g>
      {rig.legRBehind && legR}
      {view === 'back' && ball}
      {legL}
      {!rig.legRBehind && legR}
      <Shorts kit={kit} />
      <Torso kit={kit} view={view} />
      <Head kit={kit} view={view} expr={expr} />
      {armL}
      {armR}
      {view === 'front' && ball}
    </g>
  );
};

// ── Poses ────────────────────────────────────────────────────

const base = (): Rig => ({
  hipL: [-14, -62],
  kneeL: [-15, -32],
  footL: [-15, -3],
  hipR: [14, -62],
  kneeR: [15, -32],
  footR: [15, -3],
  shoulderL: [-32, -124],
  elbowL: [-40, -100],
  handL: [-40, -78],
  shoulderR: [32, -124],
  elbowR: [40, -100],
  handR: [40, -78],
});

// Back view, ball tucked under the right arm. phase in radians.
export const runBack = (phase: number, withBall = true): Rig => {
  const r = base();
  const s = Math.sin(phase);
  const lift = (side: number) => Math.max(0, side * s);
  const leg = (side: -1 | 1) => {
    const l = lift(side);
    const e = l * l * (3 - 2 * l); // smoothstep for a snappier heel kick
    return {
      knee: [side * (16 - e * 2), -32 - e * 8] as Pt,
      foot: [side * (14 - e * 4), -3 - e * 38] as Pt,
      sole: e > 0.35,
    };
  };
  const L = leg(-1);
  const R = leg(1);
  r.kneeL = L.knee;
  r.footL = L.foot;
  r.soleL = L.sole;
  r.kneeR = R.knee;
  r.footR = R.foot;
  r.soleR = R.sole;
  // free arm pumps
  r.elbowL = [-42, -102 + 6 * s];
  r.handL = [-36 - 4 * s, -84 + 20 * s];
  if (withBall) {
    r.elbowR = [42, -100];
    r.handR = [30, -90];
    r.ball = {x: 40, y: -98, rot: -28};
  } else {
    r.elbowR = [42, -102 - 6 * s];
    r.handR = [36 + 4 * s, -84 - 20 * s];
  }
  return r;
};

// Standing ready, ball under arm. bounce 0..1
export const standBack = (bounce: number, withBall = true): Rig => {
  const r = runBack(0, withBall);
  const k = bounce * 4;
  r.kneeL = [-18, -32 + k];
  r.kneeR = [18, -32 + k];
  r.footL = [-19, -3];
  r.footR = [19, -3];
  r.soleL = false;
  r.soleR = false;
  r.elbowL = [-42, -100];
  r.handL = [-38, -80];
  return r;
};

// Back view conversion kick. k: 0 = leg cocked, 0.35 = contact, 1 = full follow-through.
export const kickBack = (k: number): Rig => {
  const r = base();
  r.footL = [-12, -3];
  r.kneeL = [-16, -32];
  if (k < 0.35) {
    const u = k / 0.35;
    r.kneeR = [18, -34 - (1 - u) * 6];
    r.footR = [16, -3 - (1 - u) * 40];
    r.soleR = u < 0.6;
  } else {
    const u = Math.min(1, (k - 0.35) / 0.65);
    const e = 1 - Math.pow(1 - u, 2);
    r.legRBehind = true;
    r.hipR = [14, -64];
    r.kneeR = [22 + e * 26, -40 - e * 40];
    r.footR = [26 + e * 52, -12 - e * 104];
  }
  r.elbowL = [-60, -118];
  r.handL = [-82, -120];
  r.elbowR = [56, -106];
  r.handR = [70, -96];
  return r;
};

// Arms up in the air. lift 0..1 blends from hanging to full V.
export const armsUp = (r: Rig, lift: number): Rig => {
  const l = lift;
  r.elbowL = [-40 - 10 * l, -100 - 56 * l];
  r.handL = [-40 - 18 * l, -78 - 116 * l];
  r.elbowR = [40 + 10 * l, -100 - 56 * l];
  r.handR = [40 + 18 * l, -78 - 116 * l];
  return r;
};

// Front view running towards camera (defenders), arms out ready to tackle.
export const runFront = (phase: number, armsOut = 1): Rig => {
  const r = base();
  const s = Math.sin(phase);
  const leg = (side: -1 | 1) => {
    const l = Math.max(0, side * s);
    const e = l * l * (3 - 2 * l);
    return {
      knee: [side * (15 - e * 2), -32 - e * 24] as Pt,
      foot: [side * (14 - e * 2), -3 - e * 26] as Pt,
    };
  };
  const L = leg(-1);
  const R = leg(1);
  r.kneeL = L.knee;
  r.footL = L.foot;
  r.kneeR = R.knee;
  r.footR = R.foot;
  const a = armsOut;
  r.elbowL = [-42 - 12 * a, -102 - 6 * a + 5 * s];
  r.handL = [-40 - 26 * a, -80 - 6 * a - 10 * s];
  r.elbowR = [42 + 12 * a, -102 - 6 * a - 5 * s];
  r.handR = [40 + 26 * a, -80 - 6 * a + 10 * s];
  return r;
};

// Front view, standing with knees bent. crouch 0..1
export const standFront = (crouch: number): Rig => {
  const r = base();
  r.kneeL = [-20, -32 + crouch * 5];
  r.kneeR = [20, -32 + crouch * 5];
  r.footL = [-20, -3];
  r.footR = [20, -3];
  r.elbowL = [-50, -106];
  r.handL = [-62, -92];
  r.elbowR = [50, -106];
  r.handR = [62, -92];
  return r;
};
