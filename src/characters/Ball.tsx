import React from 'react';
import {COLORS, PALETTE} from '../config';

// A rugby ball in local units: long axis along x, 19 x 12 half-size.
export const BallShape: React.FC<{outline?: number}> = ({outline = 1.6}) => {
  const rx = 19;
  const ry = 12;
  return (
    <g>
      <ellipse rx={rx} ry={ry} fill={COLORS.ball} stroke={PALETTE.kit} strokeWidth={outline} />
      {/* shaded underside */}
      <path d={`M${-rx * 0.92},${ry * 0.3} Q0,${ry * 1.25} ${rx * 0.92},${ry * 0.3} Q0,${ry * 0.8} ${-rx * 0.92},${ry * 0.3} Z`} fill="#C9CDD3" />
      {/* panel graphics */}
      <path d={`M${-rx * 0.62},${-ry * 0.8} Q${-rx * 0.4},0 ${-rx * 0.62},${ry * 0.8}`} stroke={COLORS.ballStripe} strokeWidth={ry * 0.22} fill="none" />
      <path d={`M${rx * 0.62},${-ry * 0.8} Q${rx * 0.4},0 ${rx * 0.62},${ry * 0.8}`} stroke={COLORS.ballStripe} strokeWidth={ry * 0.22} fill="none" />
      <path d={`M${-rx * 0.3},${-ry * 0.3} L${rx * 0.3},${-ry * 0.3}`} stroke={PALETTE.shadow} strokeWidth={outline * 0.7} strokeLinecap="round" />
      <ellipse rx={rx} ry={ry} fill="none" stroke={PALETTE.kit} strokeWidth={outline} />
    </g>
  );
};
