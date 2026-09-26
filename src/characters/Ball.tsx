import React from 'react';
import {COLORS} from '../config';

// A rugby ball in local units: long axis along x, 19 x 12 half-size.
// `spinFlatten` squashes the long axis to fake the ball turning end over end.
export const BallShape: React.FC<{outline?: number; spinFlatten?: number}> = ({
  outline = 3.5,
  spinFlatten = 1,
}) => {
  const rx = 19 * Math.max(0.64, spinFlatten);
  const ry = 12;
  return (
    <g>
      <ellipse rx={rx} ry={ry} fill={COLORS.ball} stroke={COLORS.outline} strokeWidth={outline} />
      <ellipse cx={-rx * 0.55} rx={rx * 0.1} ry={ry * 0.84} fill={COLORS.ballStripe} />
      <ellipse cx={rx * 0.55} rx={rx * 0.1} ry={ry * 0.84} fill={COLORS.ballStripe} />
      <path
        d={`M${-rx * 0.28},${-ry * 0.42} L${rx * 0.28},${-ry * 0.42}`}
        stroke={COLORS.outline}
        strokeWidth={outline * 0.55}
        strokeLinecap="round"
      />
      {[-0.18, -0.06, 0.06, 0.18].map((f) => (
        <path
          key={f}
          d={`M${rx * f},${-ry * 0.56} L${rx * f},${-ry * 0.28}`}
          stroke={COLORS.outline}
          strokeWidth={outline * 0.45}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={-rx * 0.25} cy={ry * 0.35} rx={rx * 0.28} ry={ry * 0.18} fill="#FFFFFF" opacity={0.7} />
    </g>
  );
};
