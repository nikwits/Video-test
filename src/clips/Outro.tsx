import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {COLORS, OUTRO as O, PALETTE, SCORES, VIDEO} from '../config';
import {Vignette} from '../scene/World';
import {Condensed} from '../scene/Hud';
import {ease, popIn} from '../scene/stage';
import {ScoreIcon, StadiumCard} from './cards';

// Recap: the four ways to score and what each is worth.

const ROW = {x: 80, w: 920, h: 230, top: 520, gap: 262};

const RecapRow: React.FC<{i: number; t: number; frame: number}> = ({i, t, frame}) => {
  const s = SCORES[i];
  const at = O.rowsIn + i * O.rowGap;
  if (t < at) return null;
  const slide = ease(t, at, at + 0.45, 160, 0, Easing.out(Easing.cubic));
  const fade = ease(t, at, at + 0.25, 0, 1, Easing.out(Easing.quad));
  const pts = popIn(frame, at + 0.25, 10);
  const y = ROW.top + i * ROW.gap;
  return (
    <g opacity={fade} transform={`translate(${slide},${y})`}>
      <rect x={ROW.x} y={8} width={ROW.w} height={ROW.h} rx={26} fill="#000000" opacity={0.35} />
      <rect x={ROW.x} y={0} width={ROW.w} height={ROW.h} rx={26} fill={PALETTE.kit} stroke={PALETTE.shadow} strokeWidth={3} opacity={0.95} />
      {/* icon */}
      <rect x={ROW.x + 28} y={35} width={160} height={160} rx={22} fill={PALETTE.shadow} />
      <g transform={`translate(${ROW.x + 58},${65}) scale(1)`}>
        <ScoreIcon kind={s.icon} />
      </g>
      {/* name and meaning */}
      <Condensed x={ROW.x + 222} y={112} size={76} fill={PALETTE.white} anchor="start">
        {s.name}
      </Condensed>
      <Condensed x={ROW.x + 224} y={168} size={36} fill="#AEB4BD" anchor="start" squeeze={0.88}>
        {s.line}
      </Condensed>
      {/* points */}
      <g transform={`translate(${ROW.x + ROW.w - 110},${ROW.h / 2}) scale(${pts})`}>
        <rect x={-78} y={-86} width={156} height={172} rx={20} fill={COLORS.accent} />
        <Condensed x={0} y={36} size={120} fill={PALETTE.kit}>
          {s.points}
        </Condensed>
        <Condensed x={0} y={70} size={30} fill={PALETTE.kit}>
          POINTS
        </Condensed>
      </g>
    </g>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const title = popIn(frame, O.titleIn, 14);
  const underline = ease(t, O.titleIn + 0.2, O.titleIn + 0.6, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.skyBottom}}>
      <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
        <StadiumCard t={t} hold={O.endHoldStart} dim={1.25} />
        <Vignette />
        {t >= O.titleIn && (
          <g opacity={Math.min(1, title * 1.5)} transform={`translate(540,330) scale(${0.85 + 0.15 * title}) translate(-540,-330)`}>
            <Condensed x={540} y={300} size={62} fill="#C9CDD3">
              RECAP
            </Condensed>
            <g transform="translate(540,410) skewX(-8) translate(-540,-410)">
              <Condensed x={540} y={410} size={120} fill={PALETTE.white}>
                <tspan fill={COLORS.accent}>4</tspan> WAYS TO SCORE
              </Condensed>
            </g>
            <rect x={540 - 260} y={440} width={520 * underline} height={8} fill={COLORS.accent} />
          </g>
        )}
        {SCORES.map((_, i) => (
          <RecapRow key={i} i={i} t={t} frame={frame} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
