import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {PENALTY as P, PITCH, VIDEO} from '../config';
import {project} from '../engine/camera';
import {Backdrop, Posts} from '../scene/World';
import {Impact} from '../scene/Effects';
import {Drawable, ease, kickedBall, makeKick, renderSorted, shadow, tee} from '../scene/stage';
import {KickClipShell, kickCamera, officials, placeKicker} from './shared';

// A long-range penalty from out wide: tee, run-up, strike, flags up, +3.

const SPOT = {x: P.spotX, z: PITCH.tryLineZ - P.distance};
const KICK = makeKick({
  spot: SPOT,
  startY: 0.34,
  crossH: 5.2, // long kick, clears the bar with less to spare
  pastPosts: 9,
  kickAt: P.kickAt,
  overPosts: P.ballOverPosts,
  lands: P.ballLands,
});
const REST = {x: SPOT.x, y: 0.34, z: SPOT.z};

const PenaltyScene: React.FC<{t: number}> = ({t}) => {
  const tt = Math.min(t, P.endHoldStart); // everything settles for the end hold
  const cam = kickCamera(KICK, tt, {back: 9, side: -0.4, height: 2.6, push: 0.8, rise: 0.5, tilt: 0.05});
  const items: Drawable[] = [];
  const shadows: React.ReactNode[] = [];

  items.push({depth: project({x: 0, y: 0, z: PITCH.tryLineZ}, cam).depth, node: <Posts key="posts" cam={cam} t={tt} />});
  items.push(...officials(tt, P.flagsUp, cam, tt));
  items.push(tee(SPOT, cam));
  items.push(kickedBall(KICK, tt, cam, REST));
  const bp = tt >= P.kickAt ? KICK.ballPos(tt) : REST;
  shadows.push(shadow('ballShadow', bp.x, bp.z, cam, 0.25, tt >= P.kickAt ? 0.18 : 0.25));

  const kicker = placeKicker(tt, KICK, cam, {
    from: KICK.at(-3.4, -1.2),
    to: KICK.at(-0.55, -0.62),
    runUpStart: P.runUpStart,
    celebrateAt: P.ballOverPosts + 0.1,
    strides: 2.4,
  });
  items.push(kicker.item);
  shadows.push(kicker.shade);

  const strike = project({x: SPOT.x, y: 0.35, z: SPOT.z}, cam);
  const cheer = ease(t, P.ballOverPosts, P.ballOverPosts + 0.3, 0, 1, Easing.out(Easing.quad)) * ease(t, P.endHoldStart - 0.5, P.endHoldStart, 1, 0);

  return (
    <g>
      <Backdrop cam={cam} t={tt} cheer={cheer} />
      {shadows}
      {renderSorted(items)}
      <Impact x={strike.x} y={strike.y} since={t - P.kickAt} size={strike.s * 0.55} />
    </g>
  );
};

export const PenaltyKick: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  return (
    <KickClipShell
      frame={frame}
      t={t}
      word="PENALTY"
      wordSize={200}
      wordIn={P.wordIn}
      pointsIn={P.pointsIn}
      points={3}
      scoreFrom={P.startScore}
      scoreStart={P.scoreStart}
      pulseStart={P.pulseStart}
      pulseEnd={P.pulseEnd}
      endHoldStart={P.endHoldStart}
    >
      <PenaltyScene t={t} />
    </KickClipShell>
  );
};
