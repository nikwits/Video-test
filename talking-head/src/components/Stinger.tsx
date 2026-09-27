import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Spark} from './Spark';
import type {Settings} from '../settings';

// One second: the spark draws itself once on Ink, holds a beat, then hard cut.
export const Stinger: React.FC<{s: Settings}> = ({s}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drawEnd = Math.max(4, Math.round(durationInFrames * 0.7));
  const progress = interpolate(frame, [2, drawEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{backgroundColor: s.brand.ink, alignItems: 'center', justifyContent: 'center'}}>
      <Spark width={520} color={s.brand.pink} strokeWidth={7} progress={progress} />
    </AbsoluteFill>
  );
};
