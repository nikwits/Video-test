import React from 'react';
import {CalculateMetadataFunction, Composition, Folder, staticFile} from 'remotion';
import {FPS, HEIGHT, WIDTH} from './config';
import {buildPlan} from './lib/plan.ts';
import type {EditFile, Word} from './lib/types';
import {planConfig, resolve} from './settings';
import type {TalkingHeadProps} from './settings';
import {TalkingHead} from './TalkingHead';
import {DemoFootage, demoMetadata} from './DemoFootage';

// Reads the transcript (and the optional hand edits) for the clip and works out the edit.
const calculateMetadata: CalculateMetadataFunction<TalkingHeadProps> = async ({props}) => {
  const res = await fetch(staticFile(`clips/${props.clip}.words.json`));
  if (!res.ok) {
    throw new Error(`No transcript at public/clips/${props.clip}.words.json. Run: npm run transcribe -- <video>`);
  }
  const words: Word[] = await res.json();
  let edit: EditFile = {};
  const editRes = await fetch(staticFile(`clips/${props.clip}.edit.json`)).catch(() => null);
  if (editRes && editRes.ok) edit = await editRes.json();

  const s = resolve(props);
  const plan = buildPlan(words, edit, planConfig(s));
  const frames = Math.round(s.cards.stinger * FPS) + plan.frames + Math.round(s.cards.endCard * FPS);
  return {durationInFrames: Math.max(1, frames), props: {...props, plan}};
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="TalkingHead"
      component={TalkingHead}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={300}
      defaultProps={{clip: 'demo'} as TalkingHeadProps}
      calculateMetadata={calculateMetadata}
    />
    <Folder name="Test">
      <Composition
        id="DemoFootage"
        component={DemoFootage}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={300}
        calculateMetadata={demoMetadata}
      />
    </Folder>
  </>
);
