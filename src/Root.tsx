import React from 'react';
import {Composition} from 'remotion';
import {RugbyTry} from './RugbyTry';
import {VIDEO} from './config';

export const Root: React.FC = () => (
  <Composition
    id="RugbyTry"
    component={RugbyTry}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
