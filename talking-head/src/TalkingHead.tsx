import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Captions} from './components/Captions';
import {EndCard} from './components/EndCard';
import {Footage} from './components/Footage';
import {SparkMoment} from './components/SparkMoment';
import {Stinger} from './components/Stinger';
import {resolve} from './settings';
import type {TalkingHeadProps} from './settings';
import './fonts';

export const TalkingHead: React.FC<TalkingHeadProps> = (props) => {
  const {fps} = useVideoConfig();
  const s = resolve(props);
  const plan = props.plan;
  if (!plan) return <AbsoluteFill style={{backgroundColor: s.brand.ink}} />;

  const stinger = Math.round(s.cards.stinger * fps);
  const end = Math.round(s.cards.endCard * fps);
  const src = staticFile(props.video ?? `clips/${props.clip}.mp4`);

  return (
    <AbsoluteFill style={{backgroundColor: s.brand.ink}}>
      {stinger > 0 ? (
        <Sequence durationInFrames={stinger} name="Stinger">
          <Stinger s={s} />
        </Sequence>
      ) : null}
      <Sequence from={stinger} durationInFrames={plan.frames} name="Talking head">
        <Footage plan={plan} src={src} s={s} />
        <Captions phrases={plan.phrases} s={s} />
        <SparkMoment plan={plan} s={s} />
      </Sequence>
      {end > 0 ? (
        <Sequence from={stinger + plan.frames} durationInFrames={end} name="End card">
          <EndCard s={s} cta={plan.cta ?? s.cards.cta} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
