// Small helpers around ffmpeg/ffprobe. Uses the copies bundled with Remotion,
// so there's nothing extra to install.
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REMOTION = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'remotion.cmd' : 'remotion');

export const run = (bin, args, {quiet = true, cwd = ROOT} = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(bin, args, {cwd, shell: process.platform === 'win32'});
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d;
      if (!quiet) process.stdout.write(d);
    });
    child.stderr.on('data', (d) => {
      err += d;
      if (!quiet) process.stderr.write(d);
    });
    child.on('close', (code) => {
      if (code === 0) resolve({out, err});
      else
        reject(
          new Error(`${path.basename(bin)} ${args.slice(0, 3).join(' ')} ... failed (${code})\n${err.slice(-2000)}`),
        );
    });
  });

export const ffmpeg = (args, opts) => run(REMOTION, ['ffmpeg', '-hide_banner', '-y', ...args], opts);
export const ffprobe = (args, opts) => run(REMOTION, ['ffprobe', '-hide_banner', ...args], opts);
export const remotion = (args, opts) => run(REMOTION, args, opts);

export const probe = async (file) => {
  const {out} = await ffprobe(['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]);
  const j = JSON.parse(out);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const rot = Number(v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v?.tags?.rotate ?? 0);
  const turned = Math.abs(rot) % 180 === 90;
  return {
    duration: Number(j.format.duration),
    width: turned ? v?.height : v?.width,
    height: turned ? v?.width : v?.height,
    codec: v?.codec_name,
    hasAudio: Boolean(a),
  };
};

export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'clip';

// Tiny argv parser. `booleans` lists flags that never take a value.
export const args = (argv, booleans = []) => {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) flags[k] = v;
      else if (!booleans.includes(k) && argv[i + 1] && !argv[i + 1].startsWith('--')) flags[k] = argv[++i];
      else flags[k] = true;
    } else pos.push(a);
  }
  return {pos, flags};
};
