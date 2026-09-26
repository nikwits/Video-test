import React from 'react';
import {Kit} from '../config';
import {BallShape} from './Ball';
import {Arm, Head, Leg, O, Shorts, Torso} from './Character';

// The try-scoring dive, seen from behind and above.
// Drawn lying along the local -y axis: boots at y=0, ball at y=-DIVER_LENGTH.
// The caller stretches it along that axis to match the perspective.
export const DIVER_LENGTH = 232;

export const Diver: React.FC<{kit: Kit; kick: number}> = ({kit, kick}) => {
  // kick: a small flutter of the legs, 0..1
  const k = kick * 6;
  return (
    <g>
      <Leg hip={[-9, -94]} knee={[-12, -52 + k]} foot={[-11, -8]} sole kit={kit} view="back" />
      <Leg hip={[9, -94]} knee={[12, -52 - k]} foot={[11, -8]} sole kit={kit} view="back" />
      <g transform="translate(0,-3)">
        <Shorts kit={kit} />
        <Torso kit={kit} view="back" />
        <Head kit={kit} view="back" expr="determined" />
        {/* ball pressed into the grass, both hands on it */}
        <g transform="translate(0,-217) scale(0.72)">
          <BallShape outline={O / 0.72} />
        </g>
        <Arm shoulder={[-22, -146]} elbow={[-22, -177]} hand={[-10, -205]} kit={kit} />
        <Arm shoulder={[22, -146]} elbow={[22, -177]} hand={[10, -205]} kit={kit} />
      </g>
    </g>
  );
};
