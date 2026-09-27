import React from 'react';
import {AbsoluteFill, CalculateMetadataFunction, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from './lib/types';
import './fonts';

// Stand-in "raw footage" for testing without a real clip: a simple presenter whose
// mouth moves on the words in demo.words.json, plus the raw timecode, so you can
// see exactly where the jump cuts land. `npm run demo` renders it with a tone track.

type Props = {words?: Word[]};

export const demoMetadata: CalculateMetadataFunction<Props> = async () => {
  const words: Word[] = await (await fetch(staticFile('clips/demo.words.json'))).json();
  const end = words[words.length - 1].end + 1.5;
  return {durationInFrames: Math.ceil(end * 30), props: {words}};
};

export const DemoFootage: React.FC<Props> = ({words = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const talking = words.some((w) => t >= w.start && t <= w.end);
  const mouth = talking ? 10 + 8 * Math.abs(Math.sin(t * 22)) : 3;
  const sway = Math.sin(t * 0.7) * 6;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 30% 30%, #6b6f75 0%, #3b3e44 55%, #25272b 100%)'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <g transform={`translate(${960 + sway}, 0)`}>
          <path d="M -380 1080 C -360 820 -220 760 0 760 C 220 760 360 820 380 1080 Z" fill="#1d2127" />
          <rect x={-55} y={610} width={110} height={170} rx={40} fill="#b98c6c" />
          <ellipse cx={0} cy={470} rx={150} ry={190} fill="#c99a78" />
          <path
            d="M -150 440 C -160 280 -60 250 0 250 C 90 250 165 300 150 430 C 120 340 40 320 -20 330 C -90 340 -130 380 -150 440 Z"
            fill="#3a2a22"
          />
          <ellipse cx={-55} cy={470} rx={12} ry={8} fill="#2a1d18" />
          <ellipse cx={55} cy={470} rx={12} ry={8} fill="#2a1d18" />
          <ellipse cx={0} cy={575} rx={34} ry={mouth / 2} fill="#5a2b2b" />
        </g>
      </svg>
      <div
        style={{position: 'absolute', top: 40, left: 48, fontFamily: 'IBM Plex Mono', fontSize: 30, color: '#ffffffaa'}}
      >
        STAND-IN FOOTAGE · RAW {t.toFixed(2)}s
      </div>
    </AbsoluteFill>
  );
};
