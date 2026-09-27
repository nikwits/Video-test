import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Settings} from '../settings';
import type {Phrase} from '../lib/types';

// Bottom-third burn-in captions. Mono by default, stats in pink, opinion lines in
// the serif italic. No pops, no bounces, no scale.
export const Captions: React.FC<{phrases: Phrase[]; s: Settings}> = ({phrases, s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const phrase = phrases.find((p) => t >= p.start && t < p.end);
  if (!phrase) return null;

  const c = s.captions;
  const serif = phrase.font === 'serif';
  const appear = interpolate(t, [phrase.start, phrase.start + 3 / fps], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: c.bottom,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity: appear,
          padding: c.pill ? (serif ? '10px 34px 16px' : '14px 30px') : 0,
          borderRadius: 14,
          backgroundColor: c.pill ? hexA(s.brand.ink, 0.78) : 'transparent',
          boxShadow: c.pill ? '0 6px 24px rgba(0,0,0,0.28)' : 'none',
          fontFamily: serif ? s.fonts.judgement : s.fonts.measurement,
          fontStyle: serif ? 'italic' : 'normal',
          fontWeight: 500,
          fontSize: serif ? c.serifSize : c.monoSize,
          letterSpacing: serif ? '0' : '-0.01em',
          lineHeight: 1.2,
          color: s.brand.white,
          textShadow: c.pill ? 'none' : '0 2px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap',
          maxWidth: 1600,
        }}
      >
        {phrase.words
          // Word mode shows words as they're said (the pill grows with them).
          .filter((w, i) => c.reveal === 'phrase' || i === 0 || t >= w.start)
          .map((w, i) => (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span style={{color: w.pink ? s.brand.pink : undefined}}>{w.text}</span>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};

const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
