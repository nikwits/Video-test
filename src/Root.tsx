import React from 'react';
import {Composition} from 'remotion';
import {RugbyTry} from './RugbyTry';
import {DropGoal} from './clips/DropGoal';
import {PenaltyKick} from './clips/PenaltyKick';
import {DROP_GOAL, PENALTY, VIDEO} from './config';

const size = {fps: VIDEO.fps, width: VIDEO.width, height: VIDEO.height};

export const Root: React.FC = () => (
  <>
    <Composition id="RugbyTry" component={RugbyTry} durationInFrames={VIDEO.durationInFrames} {...size} />
    <Composition id="DropGoal" component={DropGoal} durationInFrames={DROP_GOAL.durationInFrames} {...size} />
    <Composition id="PenaltyKick" component={PenaltyKick} durationInFrames={PENALTY.durationInFrames} {...size} />
  </>
);
