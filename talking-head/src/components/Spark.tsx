import React from 'react';

// The heartbeat / spark from the logo, simplified: flat, a small blip, one sharp
// up-down spike, then flat again. Drawn in a 100 x 40 box.
const POINTS: [number, number][] = [
  [0, 22],
  [30, 22],
  [36, 16],
  [41, 22],
  [48, 22],
  [55, 2],
  [63, 38],
  [69, 12],
  [73, 22],
  [100, 22],
];
export const SPARK_D = 'M' + POINTS.map(([x, y]) => `${x},${y}`).join(' L');

type Props = {
  width: number;
  color: string;
  strokeWidth: number;
  progress?: number; // 0..1, how much of the line is drawn
  style?: React.CSSProperties;
};

export const Spark: React.FC<Props> = ({width, color, strokeWidth, progress = 1, style}) => {
  const height = (width * 40) / 100;
  // Stroke scales with the viewBox, so convert px to viewBox units.
  const sw = (strokeWidth * 100) / width;
  return (
    <svg width={width} height={height} viewBox="-2 -2 104 44" style={{overflow: 'visible', ...style}}>
      <path
        d={SPARK_D}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - progress}
        opacity={progress > 0 ? 1 : 0}
      />
    </svg>
  );
};
