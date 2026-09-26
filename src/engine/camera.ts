// A tiny perspective camera. Everything is drawn flat, but placed in a
// simple 3D world so the pitch, posts and ball flight all line up.
//
// World axes (metres): x = across the pitch, y = up, z = towards the posts.

export type Vec3 = {x: number; y: number; z: number};

export type Camera = {
  x: number;
  y: number;
  z: number;
  yaw: number; // radians, positive turns to look towards +x
  pitch: number; // radians, positive looks down
  focal: number; // px
  cx: number; // screen x of the optical axis
  cy: number; // screen y of the optical axis
};

export type Screen = {x: number; y: number; s: number; depth: number};

const NEAR = 0.3;

export const toCamera = (p: Vec3, cam: Camera): Vec3 => {
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dz = p.z - cam.z;
  const cyaw = Math.cos(cam.yaw);
  const syaw = Math.sin(cam.yaw);
  const xr = dx * cyaw - dz * syaw;
  const zr = dx * syaw + dz * cyaw;
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  return {x: xr, y: dy * cp + zr * sp, z: zr * cp - dy * sp};
};

const fromCameraSpace = (c: Vec3, cam: Camera): Screen => ({
  x: cam.cx + (cam.focal * c.x) / c.z,
  y: cam.cy - (cam.focal * c.y) / c.z,
  s: cam.focal / c.z,
  depth: c.z,
});

// Project a world point. `s` is pixels per metre at that depth.
export const project = (p: Vec3, cam: Camera): Screen =>
  fromCameraSpace(toCamera(p, cam), cam);

const clipNear = (pts: Vec3[]): Vec3[] => {
  const out: Vec3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const aIn = a.z >= NEAR;
    const bIn = b.z >= NEAR;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = (NEAR - a.z) / (b.z - a.z);
      out.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR});
    }
  }
  return out;
};

// Project a flat polygon in world space to an SVG path (clipped at the near plane).
export const polyPath = (pts: Vec3[], cam: Camera): string => {
  const clipped = clipNear(pts.map((p) => toCamera(p, cam)));
  if (clipped.length < 3) return '';
  return (
    clipped
      .map((c, i) => {
        const s = fromCameraSpace(c, cam);
        return `${i === 0 ? 'M' : 'L'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
      })
      .join('') + 'Z'
  );
};

// A rectangle lying on the grass.
export const groundRect = (x0: number, z0: number, x1: number, z1: number, cam: Camera) =>
  polyPath(
    [
      {x: x0, y: 0, z: z0},
      {x: x1, y: 0, z: z0},
      {x: x1, y: 0, z: z1},
      {x: x0, y: 0, z: z1},
    ],
    cam,
  );

// A painted line on the grass, `w` metres wide.
export const groundLine = (
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  w: number,
  cam: Camera,
) => {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const nx = (-dz / len) * (w / 2);
  const nz = (dx / len) * (w / 2);
  return polyPath(
    [
      {x: x0 + nx, y: 0, z: z0 + nz},
      {x: x1 + nx, y: 0, z: z1 + nz},
      {x: x1 - nx, y: 0, z: z1 - nz},
      {x: x0 - nx, y: 0, z: z0 - nz},
    ],
    cam,
  );
};

// An upright rectangle facing down the pitch (posts, boards, stands).
export const wallRect = (x0: number, y0: number, x1: number, y1: number, z: number, cam: Camera) =>
  polyPath(
    [
      {x: x0, y: y0, z},
      {x: x1, y: y0, z},
      {x: x1, y: y1, z},
      {x: x0, y: y1, z},
    ],
    cam,
  );

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpCam = (a: Camera, b: Camera, t: number): Camera => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  focal: lerp(a.focal, b.focal, t),
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
});

// Where lines running straight up the pitch meet (for speed lines).
export const vanishingPoint = (cam: Camera) => {
  const far = project(
    {x: cam.x + Math.sin(cam.yaw) * 1e5, y: cam.y, z: cam.z + Math.cos(cam.yaw) * 1e5},
    cam,
  );
  return {x: far.x, y: far.y};
};
