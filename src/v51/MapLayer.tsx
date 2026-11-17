// v51 map layer: the baked campaign map (public/v51/map.jpg) under a camera, with a fog of war over everything the
// army has not reached yet (same map, greyed and darkened, light mist), plus grain and vignette.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { MAP_RECT } from "./geo";
import { vnoise, rnd } from "./noise";

export const W = 1080, H = 1920, FX = 540, FY = 1020;
export type Cam = { x: number; y: number; z: number };
export const toScreen = (cam: Cam, x: number, y: number): [number, number] => [(x - cam.x) * cam.z + FX, (y - cam.y) * cam.z + FY];

let mapImg: HTMLImageElement | null = null;
let grey: HTMLCanvasElement | null = null, wisp: HTMLCanvasElement | null = null, grain: HTMLCanvasElement | null = null;
let fogCv: HTMLCanvasElement | null = null, maskCv: HTMLCanvasElement | null = null;
let loading: Promise<void> | null = null;

const tile = (w: number, h: number, fn: (x: number, y: number, i: number) => [number, number, number, number]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!; const im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x); const [r, gg, b, a] = fn(x, y, i);
    im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = a;
  }
  g.putImageData(im, 0, 0); return c;
};

const load = () => (loading ??= (async () => {
  const img = new Image(); img.src = staticFile("v51/map.jpg"); await img.decode(); mapImg = img;
  const g = document.createElement("canvas"); g.width = img.width; g.height = img.height;
  const gc = g.getContext("2d")!; gc.filter = "grayscale(0.85) brightness(0.62) contrast(1.05)"; gc.drawImage(img, 0, 0); grey = g;
  // seamless-ish mist tile: noise on a torus would be ideal; a soft low-frequency field with blurred edges is enough here
  const P = 64;
  const raw = tile(256, 256, (x, y) => {
    const f = (a: number, b: number) => vnoise(a / P * 3, b / P * 3, 11) * 0.7 + vnoise(a / P * 7, b / P * 7, 12) * 0.3;
    // blend with wrapped copies so the tile repeats without hard seams
    const u = x / 256, v = y / 256;
    const n = f(x, y) * (1 - u) * (1 - v) + f(x - 256, y) * u * (1 - v) + f(x, y - 256) * (1 - u) * v + f(x - 256, y - 256) * u * v;
    return [228, 220, 204, Math.min(48, Math.max(0, n) * 120)];
  });
  // seamless blur: blur a 3×3 copy, keep the centre tile
  const big = document.createElement("canvas"); big.width = 768; big.height = 768;
  const bg = big.getContext("2d")!; bg.filter = "blur(14px)";
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) bg.drawImage(raw, i * 256, j * 256);
  wisp = document.createElement("canvas"); wisp.width = 256; wisp.height = 256;
  wisp.getContext("2d")!.drawImage(big, 256, 256, 256, 256, 0, 0, 256, 256);
  grain = tile(256, 256, (_x, _y, i) => { const v = 128 + (rnd(i, 3) * 90 - 45); return [v, v, v, 24]; });
  fogCv = document.createElement("canvas"); fogCv.width = W; fogCv.height = H;
  maskCv = document.createElement("canvas"); maskCv.width = W / 4; maskCv.height = H / 4;
})());

export const useMapReady = () => {
  const [ok, setOk] = useState(!!mapImg && !!fogCv);
  const [h] = useState(() => (mapImg && fogCv ? null : delayRender("v51 map")));
  useEffect(() => {
    if (ok) return;
    load().then(() => { setOk(true); if (h !== null) continueRender(h); })
      .catch((e) => { console.error(e); if (h !== null) continueRender(h); });
  }, [h, ok]);
  return ok;
};

/** explored = polylines (world px) + circles; reveal = extra soft holes (e.g. a spyglass) */
export type Explored = { lines: [number, number][][]; width: number; circles: { x: number; y: number; r: number }[] };

const drawSrc = (ctx: CanvasRenderingContext2D, src: CanvasImageSource, cam: Cam) => {
  const { x0, y0, s } = MAP_RECT;
  const wx0 = cam.x - FX / cam.z, wy0 = cam.y - FY / cam.z;
  const ww = W / cam.z, wh = H / cam.z;
  ctx.drawImage(src, (wx0 - x0) * s, (wy0 - y0) * s, ww * s, wh * s, 0, 0, W, H);
};

export const MapCanvas: React.FC<{ cam: Cam; explored: Explored; fog: number; frame: number; style?: React.CSSProperties }> = ({ cam, explored, fog, frame, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const ready = useMapReady();
  useLayoutEffect(() => {
    if (!ready || !ref.current || !mapImg || !grey || !fogCv || !maskCv || !wisp || !grain) return;
    const ctx = ref.current.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0F2129"; ctx.fillRect(0, 0, W, H);
    drawSrc(ctx, mapImg, cam);
    if (fog > 0.001) {
      const f = fogCv.getContext("2d")!;
      f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = "source-over"; f.clearRect(0, 0, W, H);
      drawSrc(f, grey, cam);
      const pat = f.createPattern(wisp, "repeat")!;
      const k = cam.z * 3.2;
      pat.setTransform(new DOMMatrix([k, 0, 0, k, FX - cam.x * cam.z + frame * 0.35, FY - cam.y * cam.z]));
      f.fillStyle = pat; f.fillRect(0, 0, W, H);
      // explored mask at quarter resolution, blurred, then punched out of the fog
      const m = maskCv.getContext("2d")!;
      m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, maskCv.width, maskCv.height);
      m.setTransform(cam.z / 4, 0, 0, cam.z / 4, (FX - cam.x * cam.z) / 4, (FY - cam.y * cam.z) / 4);
      m.filter = `blur(${Math.max(4, Math.min(14, 10 * cam.z))}px)`;
      m.strokeStyle = "#fff"; m.fillStyle = "#fff"; m.lineCap = "round"; m.lineJoin = "round"; m.lineWidth = explored.width;
      for (const ln of explored.lines) {
        if (ln.length < 2) continue;
        m.beginPath(); m.moveTo(ln[0][0], ln[0][1]); for (const p of ln) m.lineTo(p[0], p[1]); m.stroke();
      }
      for (const c of explored.circles) { m.beginPath(); m.arc(c.x, c.y, c.r, 0, Math.PI * 2); m.fill(); }
      m.filter = "none"; m.setTransform(1, 0, 0, 1, 0, 0);
      f.globalCompositeOperation = "destination-out"; f.imageSmoothingEnabled = true; f.drawImage(maskCv, 0, 0, W, H);
      f.globalCompositeOperation = "source-over";
      ctx.globalAlpha = fog; ctx.drawImage(fogCv, 0, 0); ctx.globalAlpha = 1;
    }
    const v = ctx.createRadialGradient(W / 2, H * 0.52, 430, W / 2, H * 0.52, 1260);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const gp = ctx.createPattern(grain, "repeat")!;
    gp.setTransform(new DOMMatrix([1, 0, 0, 1, rnd(frame, 5) * 256, rnd(frame, 6) * 256]));
    ctx.globalCompositeOperation = "overlay"; ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over";
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, ...style }} />;
};
