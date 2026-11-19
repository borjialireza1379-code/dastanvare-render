// v54 globe (copy of v42): an orthographic globe drawn pixel by pixel on a canvas from the graded Blue Marble textures
// (public/v54/globe-lo.jpg whole world 4096x2048, globe-hi.jpg 45E..90E / 50N..15N at 60 px/deg).
// The same renderer makes the space shots (small R) and the "horizon from a mountain" shots (huge R, centre far below the frame).
import { continueRender, delayRender, staticFile } from "remotion";

type Tex = { w: number; h: number; d: Uint8ClampedArray };
let LO: Tex | null = null, HI: Tex | null = null;
const HB = { lonW: 66, lonE: 118, latN: 40, latS: -16, ppd: 60 };

const loadTex = (src: string) => new Promise<Tex>((res, rej) => {
  const im = new Image();
  im.onload = () => {
    const c = document.createElement("canvas");
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext("2d")!;
    x.drawImage(im, 0, 0);
    res({ w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data });
  };
  im.onerror = () => rej(new Error("v54 texture " + src));
  im.src = src;
});
if (typeof window !== "undefined") {
  const h = delayRender("v54 globe textures", { timeoutInMilliseconds: 90000 });
  Promise.all([loadTex(staticFile("v54/globe-lo.jpg")), loadTex(staticFile("v54/globe-hi.jpg"))])
    .then(([a, b]) => { LO = a; HI = b; continueRender(h); })
    .catch((e) => { console.error(e); continueRender(h); });
}

export type GCam = { lon: number; lat: number; R: number; cx: number; cy: number };
/** sun: light direction in view space (x right, y up, z to the viewer); warm 0..1 = dusk tint; dim = overall brightness */
export type GLook = { sun: [number, number, number]; amb: number; warm: number; dim: number; atm: number };

const D2R = Math.PI / 180, R2D = 180 / Math.PI;

/** screen position of a lon/lat point; vis > 0 on the near side */
export const gproj = (c: GCam, lon: number, lat: number) => {
  const l = (lon - c.lon) * D2R, p = lat * D2R, p0 = c.lat * D2R;
  const cp = Math.cos(p);
  return {
    x: c.cx + c.R * cp * Math.sin(l),
    y: c.cy - c.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * cp * Math.cos(l)),
    vis: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * cp * Math.cos(l),
  };
};

let OFF: HTMLCanvasElement | null = null;
const bil = (T: Tex, u: number, v: number, out: number[]) => {
  if (u < 0) u = 0; else if (u > T.w - 1.001) u = T.w - 1.001;
  if (v < 0) v = 0; else if (v > T.h - 1.001) v = T.h - 1.001;
  const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0;
  const i00 = (y0 * T.w + x0) * 4, i10 = i00 + 4, i01 = i00 + T.w * 4, i11 = i01 + 4, d = T.d;
  for (let k = 0; k < 3; k++) {
    const a = d[i00 + k] + (d[i10 + k] - d[i00 + k]) * fx;
    const b = d[i01 + k] + (d[i11 + k] - d[i01 + k]) * fx;
    out[k] = a + (b - a) * fy;
  }
};

/** draws the globe (plus its atmosphere) onto ctx; alpha fades the whole globe */
export function drawGlobe(ctx: CanvasRenderingContext2D, W: number, H: number, cam: GCam, look: GLook, alpha = 1) {
  if (alpha <= 0.003 || !LO) return;
  const { R, cx, cy } = cam;
  const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W, Math.ceil(cx + R));
  const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H, Math.ceil(cy + R));
  const bw = x1 - x0, bh = y1 - y0;
  if (bw > 0 && bh > 0) {
    if (!OFF) OFF = document.createElement("canvas");
    if (OFF.width !== W || OFF.height !== H) { OFF.width = W; OFF.height = H; }
    const octx = OFF.getContext("2d")!;
    const img = octx.createImageData(bw, bh), o = img.data;
    const l0 = cam.lon * D2R, p0 = cam.lat * D2R, sp0 = Math.sin(p0), cp0 = Math.cos(p0);
    const [sx, sy, sz] = look.sun, sl = Math.hypot(sx, sy, sz) || 1;
    const Lx = sx / sl, Ly = sy / sl, Lz = sz / sl;
    const invR = 1 / R, c = [0, 0, 0], c2 = [0, 0, 0];
    const wr = 1 + 0.32 * look.warm, wg = 1 - 0.04 * look.warm, wb = 1 - 0.42 * look.warm;
    const loK = LO.w / 360, loV = LO.h / 180;
    for (let py = 0; py < bh; py++) {
      const y = (cy - (y0 + py + 0.5)) * invR, y2 = y * y;
      if (y2 >= 1) continue;
      const xr = Math.sqrt(1 - y2) * R;
      const ax = Math.max(x0, Math.floor(cx - xr - 1)), bx = Math.min(x1, Math.ceil(cx + xr + 1));
      for (let px = ax; px < bx; px++) {
        const x = (px + 0.5 - cx) * invR, r2 = x * x + y2;
        if (r2 >= 1) continue;
        const z = Math.sqrt(1 - r2);
        const lat = Math.asin(z * sp0 + y * cp0) * R2D;
        let lon = (l0 + Math.atan2(x, z * cp0 - y * sp0)) * R2D;
        lon = ((((lon + 180) % 360) + 360) % 360) - 180;
        bil(LO, (lon + 180) * loK - 0.5, (90 - lat) * loV - 0.5, c);
        if (HI && lon > HB.lonW && lon < HB.lonE && lat > HB.latS && lat < HB.latN) {
          const fe = Math.min(lon - HB.lonW, HB.lonE - lon, lat - HB.latS, HB.latN - lat);
          const wgt = fe > 1.2 ? 1 : fe / 1.2;
          bil(HI, (lon - HB.lonW) * HB.ppd - 0.5, (HB.latN - lat) * HB.ppd - 0.5, c2);
          c[0] += (c2[0] - c[0]) * wgt; c[1] += (c2[1] - c[1]) * wgt; c[2] += (c2[2] - c[2]) * wgt;
        }
        const dif = Math.max(0, (x * Lx + y * Ly + z * Lz + 0.15) / 1.15); // soft terminator
        const sh = look.dim * (look.amb + (1 - look.amb) * dif) * (0.78 + 0.22 * Math.sqrt(z));
        const edge = (1 - Math.sqrt(r2)) * R;
        const i = (py * bw + (px - x0)) * 4;
        o[i] = c[0] * sh * wr; o[i + 1] = c[1] * sh * wg; o[i + 2] = c[2] * sh * wb;
        o[i + 3] = edge >= 1.2 ? 255 : 255 * Math.max(0, edge / 1.2);
      }
    }
    octx.clearRect(0, 0, W, H);
    octx.putImageData(img, x0, y0);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(OFF, 0, 0);
    ctx.restore();
  }
  // atmosphere: a thin glowing shell, warm at dusk
  if (look.atm > 0) {
    const th = Math.min(R * 0.075, 70);
    const g = ctx.createRadialGradient(cx, cy, Math.max(0, R - th * 0.6), cx, cy, R + th);
    const w = look.warm;
    const col = (a: number) => `rgba(${Math.round(150 + 105 * w)},${Math.round(205 - 45 * w)},${Math.round(255 - 150 * w)},${(a * look.atm * alpha).toFixed(3)})`;
    g.addColorStop(0, col(0));
    g.addColorStop(0.36, col(0.55));
    g.addColorStop(0.5, col(0.32));
    g.addColorStop(1, col(0));
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R + th, 0, Math.PI * 2);
    ctx.arc(cx, cy, Math.max(0, R - th * 0.6), 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();
  }
}

/** a fixed star field with slow parallax */
const STARS = Array.from({ length: 420 }, (_, i) => {
  const h = (k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  return { x: h(1), y: h(2), r: 0.5 + 1.6 * Math.pow(h(3), 3), a: 0.25 + 0.75 * h(4), tw: h(5) * 6.28, warm: h(6) };
});
export function drawStars(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, drift: number, a: number) {
  if (a <= 0.01) return;
  ctx.save();
  for (const s of STARS) {
    const x = ((s.x * W * 1.3 - drift * (0.3 + s.r * 0.2)) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15;
    const y = s.y * H;
    const k = s.a * (0.75 + 0.25 * Math.sin(t * 2.1 + s.tw)) * a;
    ctx.fillStyle = s.warm > 0.7 ? `rgba(255,226,170,${k})` : `rgba(235,240,255,${k})`;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
