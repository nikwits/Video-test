import {Config} from '@remotion/cli/config';

// PNG frames keep the output in standard-range yuv420p, which phones and socials expect.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setPublicDir('public');
