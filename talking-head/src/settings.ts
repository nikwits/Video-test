// Props for <TalkingHead>, and how they merge over the defaults in config.ts.
import {BRAND, CAPTIONS, CARDS, CUTS, EMPHASIS_WORDS, FONTS, FPS, ZOOM} from './config.ts';
import type {Brand, CaptionConfig, CardConfig, CutConfig, Fonts, ZoomConfig} from './config.ts';
import type {PlanConfig} from './lib/plan.ts';
import type {Plan} from './lib/types.ts';

export type TalkingHeadProps = {
  clip: string; // name used for public/clips/<clip>.mp4, .words.json and .edit.json
  video?: string; // override the footage path inside public/ (default clips/<clip>.mp4)
  brand?: Partial<Brand>;
  fonts?: Partial<Fonts>;
  captions?: Partial<CaptionConfig>;
  cuts?: Partial<CutConfig>;
  zoom?: Partial<ZoomConfig>;
  cards?: Partial<CardConfig>;
  emphasisWords?: string[];
  plan?: Plan; // filled in by calculateMetadata, don't set by hand
};

export const resolve = (p: TalkingHeadProps) => ({
  brand: {...BRAND, ...p.brand},
  fonts: {...FONTS, ...p.fonts},
  captions: {...CAPTIONS, ...p.captions},
  cuts: {...CUTS, ...p.cuts},
  zoom: {...ZOOM, ...p.zoom},
  cards: {...CARDS, ...p.cards},
  emphasisWords: p.emphasisWords ?? EMPHASIS_WORDS,
});

export type Settings = ReturnType<typeof resolve>;

export const planConfig = (s: Settings): PlanConfig => ({
  fps: FPS,
  cuts: s.cuts,
  captions: s.captions,
  zoom: s.zoom,
  emphasisWords: s.emphasisWords,
});
