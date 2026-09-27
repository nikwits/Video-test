// Bundled brand fonts (from @fontsource, so renders work offline).
// Judgement = Spectral italic, Measurement = IBM Plex Mono.
import {loadFont} from '@remotion/fonts';
import spectral500Italic from '@fontsource/spectral/files/spectral-latin-500-italic.woff2';
import spectral500 from '@fontsource/spectral/files/spectral-latin-500-normal.woff2';
import plexMono400 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2';
import plexMono500 from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2';

const faces = [
  {family: 'Spectral', url: spectral500Italic, weight: '500', style: 'italic'},
  {family: 'Spectral', url: spectral500, weight: '500', style: 'normal'},
  {family: 'IBM Plex Mono', url: plexMono400, weight: '400', style: 'normal'},
  {family: 'IBM Plex Mono', url: plexMono500, weight: '500', style: 'normal'},
];

// loadFont holds the render until each face is ready.
export const fontsReady = Promise.all(faces.map((f) => loadFont(f)));
