import React from 'react';
import {Kit, PALETTE} from '../config';
import {BallShape} from './Ball';

// Players are drawn in local "sprite units" (about 1cm each) with
// natural athletic proportions: roughly seven heads tall.
// Feet sit on (0,0) and the body goes up into negative y.
// Light comes from the upper left, so shadows sit on the right.

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
export type Expression = 'determined' | 'shock' | 'dazed' | 'joy' | 'focus';

export const INK = PALETTE.kit;
export const O = 1.1; // outline thickness in sprite units
export const LABEL_FONT = "'Liberation Sans', Arial, Helvetica, sans-serif";

const lerpPt = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const f1 = (n: number) => n.toFixed(2);

// A limb segment: two circles joined by tangents, wider at one end.
export const taperPath = (a: Pt, b: Pt, wa: number, wb: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / len;
  const ny = dx / len;
  const ra = wa / 2;
  const rb = wb / 2;
  const p1 = `${f1(a[0] + nx * ra)},${f1(a[1] + ny * ra)}`;
  const p2 = `${f1(b[0] + nx * rb)},${f1(b[1] + ny * rb)}`;
  const p3 = `${f1(b[0] - nx * rb)},${f1(b[1] - ny * rb)}`;
  const p4 = `${f1(a[0] - nx * ra)},${f1(a[1] - ny * ra)}`;
  return `M${p1} L${p2} A${f1(rb)},${f1(rb)} 0 0 0 ${p3} L${p4} A${f1(ra)},${f1(ra)} 0 0 0 ${p1} Z`;
};

// A flat band across a limb (sock hoops, cuffs): square ends, no caps.
const bandPath = (a: Pt, b: Pt, wa: number, wb: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / len;
  const ny = dx / len;
  const q = [
    [a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2],
    [b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2],
    [b[0] - (nx * wb) / 2, b[1] - (ny * wb) / 2],
    [a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2],
  ];
  return `M${q.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L')} Z`;
};

// The shadow strip that runs down the shaded side of a segment.
const shadePath = (a: Pt, b: Pt, wa: number, wb: number) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 0.001;
  let nx = -dy / len;
  let ny = dx / len;
  if (nx + 0.35 * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const a2: Pt = [a[0] + nx * wa * 0.26, a[1] + ny * wa * 0.26];
  const b2: Pt = [b[0] + nx * wb * 0.26, b[1] + ny * wb * 0.26];
  return taperPath(a2, b2, wa * 0.44, wb * 0.44);
};

export type Seg = {a: Pt; b: Pt; wa: number; wb: number; fill: string; shade?: string};

// Draw a chain of segments: one outline underneath, then the fills.
export const Limb: React.FC<{segs: Seg[]}> = ({segs}) => (
  <g>
    <path d={segs.map((s) => taperPath(s.a, s.b, s.wa + 2 * O, s.wb + 2 * O)).join('')} fill={INK} />
    {segs.map((s, i) => (
      <g key={i}>
        <path d={taperPath(s.a, s.b, s.wa, s.wb)} fill={s.fill} />
        {s.shade && <path d={shadePath(s.a, s.b, s.wa, s.wb)} fill={s.shade} />}
      </g>
    ))}
  </g>
);

export const Boot: React.FC<{at: Pt; sole?: boolean; view: View}> = ({at, sole, view}) => (
  <g transform={`translate(${f1(at[0])},${f1(at[1] + 1)})`}>
    {sole ? (
      <g>
        <ellipse rx={6.2} ry={8.2} fill={PALETTE.shadow} stroke={INK} strokeWidth={O} />
        {[
          [-2.4, -4],
          [2.4, -4],
          [-2.4, 0.5],
          [2.4, 0.5],
          [0, 5],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.1} fill={PALETTE.mid} />
        ))}
      </g>
    ) : (
      <g>
        <path
          d={view === 'front' ? 'M-6.5,-5 Q-8.5,5 0,5.8 Q8.5,5 6.5,-5 Z' : 'M-6,-5 Q-7.2,4.5 0,5.2 Q7.2,4.5 6,-5 Z'}
          fill={INK}
          stroke={INK}
          strokeWidth={O}
          strokeLinejoin="round"
        />
        <path d="M-5.6,3.4 Q0,5.2 5.6,3.4" stroke={PALETTE.mid} strokeWidth={0.9} fill="none" />
        {view === 'front' && <path d="M-2.5,-2 L2.5,-2 M-2.5,0 L2.5,0" stroke={PALETTE.shadow} strokeWidth={0.8} />}
      </g>
    )}
  </g>
);

export const Leg: React.FC<{hip: Pt; knee: Pt; foot: Pt; sole?: boolean; kit: Kit; view: View}> = ({hip, knee, foot, sole, kit, view}) => {
  const ankle = lerpPt(knee, foot, 0.9);
  const sockTop = lerpPt(knee, foot, 0.16);
  const h1a = lerpPt(knee, foot, 0.22);
  const h1b = lerpPt(knee, foot, 0.255);
  const h2a = lerpPt(knee, foot, 0.3);
  const h2b = lerpPt(knee, foot, 0.335);
  const w = (f: number) => 13.2 - f * 5.2; // calf tapers to the ankle
  return (
    <g>
      <Limb
        segs={[
          {a: hip, b: knee, wa: 19.5, wb: 12.6, fill: kit.skin, shade: kit.skinShade},
          {a: knee, b: sockTop, wa: 12.6, wb: w(0.16), fill: kit.skin, shade: kit.skinShade},
          {a: sockTop, b: ankle, wa: w(0.16), wb: w(0.9), fill: kit.socks, shade: kit.shirtShade},
        ]}
      />
      <path d={bandPath(h1a, h1b, w(0.22) - 0.3, w(0.27) - 0.3)} fill={kit.sockHoop} />
      <path d={bandPath(h2a, h2b, w(0.32) - 0.3, w(0.37) - 0.3)} fill={kit.sockHoop} />
      <Boot at={foot} sole={sole} view={view} />
    </g>
  );
};

export const Arm: React.FC<{shoulder: Pt; elbow: Pt; hand: Pt; kit: Kit}> = ({shoulder, elbow, hand, kit}) => {
  const sleeveEnd = lerpPt(shoulder, elbow, 0.55);
  const wrist = lerpPt(elbow, hand, 0.86);
  const bandA = lerpPt(elbow, hand, 0.66);
  return (
    <g>
      <Limb
        segs={[
          {a: shoulder, b: elbow, wa: 12.5, wb: 9.5, fill: kit.skin, shade: kit.skinShade},
          {a: elbow, b: wrist, wa: 9.5, wb: 7, fill: kit.skin, shade: kit.skinShade},
        ]}
      />
      <Limb segs={[{a: bandA, b: wrist, wa: 8.4, wb: 7.8, fill: kit.band}]} />
      <path d={bandPath(shoulder, sleeveEnd, 15.4 + 2 * O, 13.2 + 2 * O)} fill={INK} />
      <circle cx={f1(shoulder[0])} cy={f1(shoulder[1])} r={7.7 + O} fill={INK} />
      <circle cx={f1(shoulder[0])} cy={f1(shoulder[1])} r={7.7} fill={kit.shirt} />
      <path d={bandPath(shoulder, sleeveEnd, 15.4, 13.2)} fill={kit.shirt} />
      <path d={bandPath(lerpPt(shoulder, sleeveEnd, 0.9), sleeveEnd, 13.5, 13.2)} fill={kit.shirtLit} />
      <circle cx={f1(hand[0])} cy={f1(hand[1])} r={4.9} fill={kit.skin} stroke={INK} strokeWidth={O} />
    </g>
  );
};

export const Shorts: React.FC<{kit: Kit}> = ({kit}) => (
  <g>
    <path
      d="M-17,-104 L17,-104 L20.5,-80 L2,-78.5 L0,-86 L-2,-78.5 L-20.5,-80 Z"
      fill={kit.shorts}
      stroke={INK}
      strokeWidth={O}
      strokeLinejoin="round"
    />
    <path d="M9,-103 L16.4,-103 L19.7,-80.8 L11.5,-80 Z" fill={kit.shortsShade} />
  </g>
);

const TORSO =
  'M-7,-155 Q-14,-154 -21,-151.5 Q-29,-148.5 -29,-140 L-21.5,-128 Q-17,-117 -16,-106 L-17,-99 L17,-99 L16,-106 Q17,-117 21.5,-128 L29,-140 Q29,-148.5 21,-151.5 Q14,-154 7,-155 Q0,-151.5 -7,-155 Z';

export const Torso: React.FC<{kit: Kit; view: View}> = ({kit, view}) => (
  <g>
    <path d={TORSO} fill={kit.shirt} stroke={INK} strokeWidth={O} strokeLinejoin="round" />
    {/* lit raglan panel and shaded side: clothing shapes do the work */}
    <path d="M-8,-154 Q-21,-151 -27.5,-143 L-22,-133 Q-17,-144 -8,-154 Z" fill={kit.shirtLit} />
    <path d="M11,-153 Q26,-149 28,-140.5 L20.6,-128.5 Q16.5,-117 15.2,-106 L16,-100 L9.5,-100 Q11.5,-122 11,-153 Z" fill={kit.shirtShade} />
    <path d="M-16.6,-101.5 L16.6,-101.5" stroke={kit.shirtLit} strokeWidth={0.9} />
    {/* floodlight rim on the lit edge */}
    <path d="M-27.8,-141 L-21,-129.5 Q-16.8,-118 -15.6,-106" stroke={PALETTE.mid} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    {view === 'back' ? (
      <>
        <path d="M-7,-155 Q0,-151.5 7,-155" stroke={kit.collar} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <g transform="translate(0,-119) scale(0.8,1)">
          <text
            textAnchor="middle"
            fontFamily={LABEL_FONT}
            fontWeight={700}
            fontSize={19}
            fill={kit.numberColor}
            letterSpacing={-0.5}
          >
            {kit.number}
          </text>
        </g>
      </>
    ) : (
      <>
        <path d="M-7,-155 Q0,-150.5 7,-155" stroke={kit.collar} strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M0,-151.2 L0,-145.5" stroke={kit.collar} strokeWidth={1.3} strokeLinecap="round" />
      </>
    )}
  </g>
);

const Face: React.FC<{expr: Expression; kit: Kit}> = ({expr, kit}) => {
  const brow = {
    determined: [-1.2, 1.2],
    focus: [-0.6, 0.6],
    shock: [1.4, 1.4],
    dazed: [0.6, -0.4],
    joy: [1.0, 1.0],
  }[expr];
  const lip = '#6B3F2A';
  return (
    <g>
      {[-1, 1].map((side) => {
        const x = side * 4.6;
        const lift = side < 0 ? brow[0] : brow[1];
        return (
          <g key={side}>
            <path
              d={`M${x - side * 2.7},${-175.2 - lift * 0.3} L${x + side * 2.9},${-175.6 - lift}`}
              stroke={kit.hair}
              strokeWidth={1.7}
              strokeLinecap="round"
            />
            {expr === 'joy' ? (
              <path d={`M${x - 1.8},-171.4 Q${x},-173.4 ${x + 1.8},-171.4`} stroke={INK} strokeWidth={0.9} fill="none" strokeLinecap="round" />
            ) : expr === 'dazed' ? (
              <path d={`M${x - 1.8},-171.8 L${x + 1.8},-171.8`} stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
            ) : expr === 'shock' ? (
              <g>
                <ellipse cx={x} cy={-172} rx={1.9} ry={2.1} fill={PALETTE.white} stroke={INK} strokeWidth={0.6} />
                <circle cx={x} cy={-171.8} r={0.95} fill={INK} />
              </g>
            ) : (
              <g>
                <ellipse cx={x} cy={-171.9} rx={1.55} ry={1.05} fill={INK} />
                <path d={`M${x - 2},-172.9 Q${x},-173.8 ${x + 2},-172.9`} stroke={INK} strokeWidth={0.6} fill="none" />
              </g>
            )}
          </g>
        );
      })}
      <path d="M0.4,-171 L1.5,-166.2 Q0.6,-165.2 -0.9,-165.7" stroke={kit.skinShade} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      {expr === 'joy' ? (
        <g>
          <path d="M-4.6,-162.6 Q0,-161.6 4.6,-162.6 Q3.6,-158 0,-157.8 Q-3.6,-158 -4.6,-162.6 Z" fill="#4A2420" stroke={INK} strokeWidth={0.5} />
          <path d="M-3.9,-162.4 Q0,-161.7 3.9,-162.4 L3.4,-161 Q0,-160.5 -3.4,-161 Z" fill={PALETTE.white} />
        </g>
      ) : expr === 'shock' ? (
        <ellipse cx={0} cy={-160.6} rx={1.8} ry={2.3} fill="#4A2420" />
      ) : expr === 'dazed' ? (
        <path d="M-3.2,-161 Q-1.6,-162.2 0,-161 Q1.6,-159.8 3.2,-161" stroke={lip} strokeWidth={1} fill="none" strokeLinecap="round" />
      ) : (
        <path d={expr === 'focus' ? 'M-3,-161.4 L3,-161.4' : 'M-3.3,-161.2 Q0,-162.1 3.3,-161.2'} stroke={lip} strokeWidth={1} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

export const Head: React.FC<{kit: Kit; view: View; expr: Expression}> = ({kit, view, expr}) => (
  <g>
    <Limb segs={[{a: [0, -162], b: [0, -150], wa: 10, wb: 12.5, fill: kit.skin, shade: kit.skinShade}]} />
    {view === 'front' && <path d="M-4.5,-158.5 Q0,-156 4.5,-158.5 L4.8,-155 Q0,-153.5 -4.8,-155 Z" fill={kit.skinShade} />}
    {[-1, 1].map((s) => (
      <ellipse key={s} cx={s * 10.7} cy={-171} rx={2.1} ry={3.4} fill={kit.skin} stroke={INK} strokeWidth={O} />
    ))}
    {view === 'back' ? (
      <g>
        <path
          d="M-10.5,-175 C-10.5,-188 10.5,-188 10.5,-175 L10,-167 Q8,-161 0,-160 Q-8,-161 -10,-167 Z"
          fill={kit.skin}
          stroke={INK}
          strokeWidth={O}
        />
        <path
          d="M-11,-172 C-12.4,-191 12.4,-191 11,-172 Q10.4,-165.5 6,-163 L4,-164.5 L2,-162.6 L0,-164.4 L-2,-162.6 L-4,-164.5 L-6,-163 Q-10.4,-165.5 -11,-172 Z"
          fill={kit.hair}
          stroke={INK}
          strokeWidth={O}
          strokeLinejoin="round"
        />
        <path d="M-6,-184 L-3.5,-180 M-1,-186 L1,-181.5 M4,-185 L5.5,-180.5 M-7.5,-176 L-5,-173 M6.5,-176 L8,-172.5" stroke={PALETTE.shadow} strokeWidth={0.8} strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <path
          d="M-10.5,-175 C-10.5,-188 10.5,-188 10.5,-175 L10,-167 Q9,-161 4,-158.5 Q0,-157.3 -4,-158.5 Q-9,-161 -10,-167 Z"
          fill={kit.skin}
          stroke={INK}
          strokeWidth={O}
        />
        <path d="M10.5,-175 L10,-167 Q9,-161 4,-158.5 Q7.4,-164.5 7.6,-175 Z" fill={kit.skinShade} />
        <Face expr={expr} kit={kit} />
        <path
          d="M-11.2,-172.5 Q-12.8,-184 -6.5,-187.6 Q-3,-190.4 1,-188.8 Q5.5,-190.8 8.6,-187 Q12.6,-184.4 11.4,-175 L10,-178.2 L8.8,-174.6 L7,-179.4 Q3,-177.2 -0.8,-180.2 L-2.8,-177 L-5.8,-180.4 L-7.8,-176.2 L-9.4,-179 L-10.2,-173 Z"
          fill={kit.hair}
          stroke={INK}
          strokeWidth={O}
          strokeLinejoin="round"
        />
        <path d="M-4,-186.5 L-2,-183 M2.5,-187.5 L3.6,-183.4 M6.8,-185 L7.6,-181.6" stroke={PALETTE.shadow} strokeWidth={0.8} strokeLinecap="round" />
      </g>
    )}
  </g>
);

export const Character: React.FC<{
  rig: Rig;
  kit: Kit;
  view: View;
  expr?: Expression;
}> = ({rig, kit, view, expr = 'determined'}) => {
  const legL = <Leg hip={rig.hipL} knee={rig.kneeL} foot={rig.footL} sole={rig.soleL} kit={kit} view={view} />;
  const legR = <Leg hip={rig.hipR} knee={rig.kneeR} foot={rig.footR} sole={rig.soleR} kit={kit} view={view} />;
  const armL = <Arm shoulder={rig.shoulderL} elbow={rig.elbowL} hand={rig.handL} kit={kit} />;
  const armR = <Arm shoulder={rig.shoulderR} elbow={rig.elbowR} hand={rig.handR} kit={kit} />;
  const ball = rig.ball ? (
    <g transform={`translate(${rig.ball.x},${rig.ball.y}) rotate(${rig.ball.rot}) scale(0.72)`}>
      <BallShape outline={O / 0.72} />
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
  hipL: [-9, -94],
  kneeL: [-10, -52],
  footL: [-10, -5],
  hipR: [9, -94],
  kneeR: [10, -52],
  footR: [10, -5],
  shoulderL: [-22, -146],
  elbowL: [-27, -118],
  handL: [-28, -91],
  shoulderR: [22, -146],
  elbowR: [27, -118],
  handR: [28, -91],
});

// Back view, ball tucked under the right arm. phase in radians.
export const runBack = (phase: number, withBall = true): Rig => {
  const r = base();
  const s = Math.sin(phase);
  const leg = (side: -1 | 1) => {
    const l = Math.max(0, side * s);
    const e = l * l * (3 - 2 * l); // smoothstep for a snappier heel kick
    return {
      knee: [side * (10.5 - e * 1.5), -52 - e * 10] as Pt,
      foot: [side * (9.5 - e * 3), -5 - e * 46] as Pt,
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
  r.elbowL = [-29, -121 + 5 * s];
  r.handL = [-25 - 3 * s, -97 + 16 * s];
  if (withBall) {
    r.elbowR = [29, -121];
    r.handR = [19, -110];
    r.ball = {x: 28, y: -117, rot: -28};
  } else {
    r.elbowR = [29, -121 - 5 * s];
    r.handR = [25 + 3 * s, -97 - 16 * s];
  }
  return r;
};

// Standing ready. bounce 0..1
export const standBack = (bounce: number, withBall = true): Rig => {
  const r = runBack(0, withBall);
  const k = bounce * 3;
  r.kneeL = [-12, -52 + k];
  r.kneeR = [12, -52 + k];
  r.footL = [-12.5, -5];
  r.footR = [12.5, -5];
  r.soleL = false;
  r.soleR = false;
  r.elbowL = [-28, -119];
  r.handL = [-27, -92];
  return r;
};

// Back view conversion kick. k: 0 = leg cocked, 0.35 = contact, 1 = full follow-through.
export const kickBack = (k: number): Rig => {
  const r = base();
  r.footL = [-8, -5];
  r.kneeL = [-10, -52];
  if (k < 0.35) {
    const u = k / 0.35;
    r.kneeR = [12, -54 - (1 - u) * 6];
    r.footR = [11, -5 - (1 - u) * 44];
    r.soleR = u < 0.6;
  } else {
    const u = Math.min(1, (k - 0.35) / 0.65);
    const e = 1 - Math.pow(1 - u, 2);
    r.legRBehind = true;
    r.kneeR = [12 + e * 16, -54 - e * 30];
    r.footR = [14 + e * 37, -10 - e * 100];
  }
  r.elbowL = [-44, -138];
  r.handL = [-62, -141];
  r.elbowR = [40, -128];
  r.handR = [51, -114];
  return r;
};

// Arms up in the air. lift 0..1 blends from hanging to a full V.
export const armsUp = (r: Rig, lift: number): Rig => {
  const l = lift;
  r.elbowL = [-27 - 8 * l, -118 - 56 * l];
  r.handL = [-28 - 17 * l, -91 - 109 * l];
  r.elbowR = [27 + 8 * l, -118 - 56 * l];
  r.handR = [28 + 17 * l, -91 - 109 * l];
  return r;
};

// Both arms flung up and forward: a defender diving at thin air.
export const reachUp = (r: Rig): Rig => {
  r.elbowL = [-20, -175];
  r.handL = [-16, -203];
  r.elbowR = [20, -175];
  r.handR = [16, -203];
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
      knee: [side * (10.5 - e), -52 - e * 22] as Pt,
      foot: [side * 10, -5 - e * 24] as Pt,
    };
  };
  const L = leg(-1);
  const R = leg(1);
  r.kneeL = L.knee;
  r.footL = L.foot;
  r.kneeR = R.knee;
  r.footR = R.foot;
  const a = armsOut;
  r.elbowL = [-30 - 10 * a, -121 - 4 * a + 4 * s];
  r.handL = [-30 - 22 * a, -98 - 6 * a - 8 * s];
  r.elbowR = [30 + 10 * a, -121 - 4 * a - 4 * s];
  r.handR = [30 + 22 * a, -98 - 6 * a + 8 * s];
  return r;
};

// Front view, standing with knees a little bent. crouch 0..1
export const standFront = (crouch: number): Rig => {
  const r = base();
  r.kneeL = [-13, -52 + crouch * 3];
  r.kneeR = [13, -52 + crouch * 3];
  r.footL = [-13, -5];
  r.footR = [13, -5];
  r.elbowL = [-35, -123];
  r.handL = [-44, -110];
  r.elbowR = [35, -123];
  r.handR = [44, -110];
  return r;
};
