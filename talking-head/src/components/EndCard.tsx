import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Spark} from './Spark';
import type {Settings} from '../settings';

// Ink, the "wits [spark] watts" lockup and a one-line CTA. The only motion is a fade in.
export const EndCard: React.FC<{s: Settings; cta: string}> = ({s, cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = interpolate(frame, [0, s.cards.endFade * fps], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const word: React.CSSProperties = {
    fontFamily: s.fonts.judgement,
    fontWeight: 500,
    fontSize: 132,
    color: s.brand.white,
    letterSpacing: '-0.01em',
    lineHeight: 1,
  };
  return (
    <AbsoluteFill style={{backgroundColor: s.brand.ink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <span style={word}>wits</span>
          <Spark width={150} color={s.brand.pink} strokeWidth={6} style={{marginTop: 18}} />
          <span style={word}>watts</span>
        </div>
        <div
          style={{
            fontFamily: s.fonts.measurement,
            fontWeight: 400,
            fontSize: 34,
            color: s.brand.white,
            opacity: 0.78,
            letterSpacing: '0.04em',
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
