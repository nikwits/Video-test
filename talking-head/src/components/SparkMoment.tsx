import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Spark} from './Spark';
import type {Settings} from '../settings';
import type {Plan} from '../lib/types';

// On the one or two biggest moments, a small spark draws itself above the caption,
// holds, and fades. Quiet on purpose.
export const SparkMoment: React.FC<{plan: Plan; s: Settings}> = ({plan, s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const z = plan.zooms.find((z) => z.spark && frame >= z.from && frame < z.from + 3 * fps);
  if (!z) return null;
  const t = (frame - z.from) / fps;
  const progress = interpolate(t, [0.25, 0.85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const opacity = interpolate(t, [2.4, 2.9], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pillTop = s.captions.bottom + s.captions.serifSize * 1.2 + 30;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: pillTop + 44,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <Spark width={120} color={s.brand.pink} strokeWidth={4} progress={progress} />
    </div>
  );
};
