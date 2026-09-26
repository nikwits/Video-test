import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS, INTRO as I, KITS, PALETTE, SCORES, VIDEO} from '../config';
import {Character, holdBallFront, standFront} from '../characters/Character';
import {Vignette} from '../scene/World';
import {Condensed, Headline} from '../scene/Hud';
import {Camera} from '../engine/camera';
import {popIn, sprite} from '../scene/stage';
import {StadiumCard} from './cards';

// "New to rugby? Here are the 4 ways to score points."

const HERO = {x: -0.6, z: 24.2};

// A line of text that pops up into place.
const Line: React.FC<{frame: number; at: number; y: number; children: React.ReactNode}> = ({frame, at, y, children}) => {
  const p = popIn(frame, at, 14);
  if (frame < at * VIDEO.fps) return null;
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`translate(0,${(1 - p) * 40})`}>
      <g transform={`translate(540,${y}) scale(${0.85 + 0.15 * p}) translate(-540,${-y})`}>{children}</g>
    </g>
  );
};

const Chip: React.FC<{x: number; y: number; text: string; scale: number}> = ({x, y, text, scale}) => {
  const w = 400;
  const h = 78;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={PALETTE.kit} stroke={COLORS.accent} strokeWidth={4} opacity={0.94} />
      <Condensed x={0} y={17} size={48} fill={PALETTE.white}>
        {text}
      </Condensed>
    </g>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const tt = Math.min(t, I.endHoldStart);
  const fourPop = popIn(frame, I.fourIn, 10);

  const hero = (cam: Camera) => {
    const breathe = Math.sin(tt * 3);
    return [
      sprite('hero', {x: HERO.x, y: 0, z: HERO.z}, cam, <Character rig={holdBallFront(standFront(0.4 + 0.3 * breathe))} kit={KITS.home} view="front" expr="focus" />, {
        sy: 1 + 0.01 * breathe,
      }),
    ];
  };

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.skyBottom}}>
      <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
        <StadiumCard t={t} hold={I.endHoldStart} dim={1} extra={hero} cy={1200} />
        <Vignette />

        <Line frame={frame} at={I.questionIn} y={330}>
          <Condensed x={540} y={370} size={124} fill={PALETTE.white}>
            NEW TO RUGBY?
          </Condensed>
        </Line>
        <Line frame={frame} at={I.leadIn} y={470}>
          <Condensed x={540} y={490} size={62} fill="#C9CDD3">
            HERE ARE THE
          </Condensed>
        </Line>
        {t >= I.fourIn && <Headline text="4" x={540} y={680} size={330} fill={COLORS.accent} scale={fourPop} />}
        <Line frame={frame} at={I.waysIn} y={900}>
          <Condensed x={540} y={930} size={92} fill={PALETTE.white}>
            WAYS TO SCORE POINTS
          </Condensed>
        </Line>

        {SCORES.map((s, i) => {
          const at = I.chipsIn + i * I.chipGap;
          if (t < at) return null;
          return <Chip key={s.name} x={i % 2 ? 770 : 310} y={i < 2 ? 1035 : 1128} text={s.name} scale={popIn(frame, at, 12)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
