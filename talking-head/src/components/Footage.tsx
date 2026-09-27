import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {scaleAt} from '../lib/plan.ts';
import type {Settings} from '../settings';
import type {Plan} from '../lib/types';

// The kept pieces of footage laid end to end, with the jump-cut framing and the
// occasional slow zoom applied on top.
export const Footage: React.FC<{plan: Plan; src: string; s: Settings}> = ({plan, src, s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = scaleAt(plan, frame, s.cuts.punchScale, s.zoom.maxScale, s.zoom.ramp * fps);
  const fade = s.cuts.audioFade;

  return (
    <AbsoluteFill style={{backgroundColor: s.brand.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: `50% ${s.zoom.focusY * 100}%`}}>
        {plan.segments.map((seg, i) => (
          <Sequence key={i} from={seg.outFrom} durationInFrames={seg.frames} premountFor={fps}>
            <OffthreadVideo
              src={src}
              trimBefore={seg.srcFrom}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
              // A couple of frames of fade at each cut stops audio clicks.
              volume={(f) => (fade > 0 ? Math.min(1, (f + 1) / fade, (seg.frames - f) / fade) : 1)}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
