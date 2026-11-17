// v51 · bakes the coloured campaign map once (world px rect of videos/51/build/map.json at 1.25 px per world px).
// npx remotion still src/v51/bake/index.ts V51-Bake public/v51/map.jpg --public-dir=videos/51/bake-public --image-format=jpeg --jpeg-quality=90
// Sources (public domain): Natural Earth land (world-atlas), rivers and SR_HR shaded relief.
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { geoAzimuthalEqualArea, geoPath } from "d3-geo";

export const RECT = { x0: -1500, y0: -1900, x1: 1650, y1: 1700, s: 1.25 };
export const BW = Math.round((RECT.x1 - RECT.x0) * RECT.s), BH = Math.round((RECT.y1 - RECT.y0) * RECT.s);
const PROJ = geoAzimuthalEqualArea().rotate([-65, -30]).scale(4500 * RECT.s).translate([-RECT.x0 * RECT.s, -RECT.y0 * RECT.s])
  .clipExtent([[-100, -100], [BW + 100, BH + 100]]);
// land.json = world-atlas land-10m clipped to lon 25–105, lat −5–65 (videos/51/build/land.mjs)
let LAND: GeoJSON.FeatureCollection;

// small value noise (no extra packages: the cloud repo has only d3-geo / topojson / world-atlas)
const hash = (x: number, y: number, seed: number) => {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
export const vnoise = (x: number, y: number, seed = 1) => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
};

const lowNoise = (w: number, h: number, seed: number, freq: number, fn: (n: number) => [number, number, number, number]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!; const im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = vnoise(x * freq, y * freq, seed) * 0.65 + vnoise(x * freq * 2.7, y * freq * 2.7, seed + 7) * 0.35;
    const [r, gg, b, a] = fn(n); const i = (y * w + x) * 4;
    im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = a;
  }
  g.putImageData(im, 0, 0);
  return c;
};

const draw = (ctx: CanvasRenderingContext2D, relief: HTMLImageElement, rivers: GeoJSON.FeatureCollection) => {
  const path = geoPath(PROJ, ctx);
  const k = RECT.s;
  const sea = ctx.createLinearGradient(0, 0, 0, BH);
  sea.addColorStop(0, "#1F3C46"); sea.addColorStop(1, "#0F2129");
  ctx.fillStyle = sea; ctx.fillRect(0, 0, BW, BH);
  ctx.save(); ctx.beginPath(); path(LAND);
  ctx.strokeStyle = "rgba(110,185,180,0.35)"; ctx.lineWidth = 34 * k; ctx.filter = `blur(${16 * k}px)`; ctx.stroke(); ctx.restore();

  ctx.save(); ctx.beginPath(); path(LAND); ctx.clip();
  ctx.fillStyle = "#C6A46B"; ctx.fillRect(0, 0, BW, BH);
  const tint = lowNoise(Math.round(BW / 10), Math.round(BH / 10), 3, 0.045,
    (n) => (n > 0 ? [236, 214, 160, Math.min(255, n * 330)] : [120, 108, 66, Math.min(255, -n * 300)]));
  ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 0.55; ctx.drawImage(tint, 0, 0, BW, BH); ctx.globalAlpha = 1;
  ctx.filter = `blur(${26 * k}px)`; ctx.strokeStyle = "rgba(92,122,56,0.5)"; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const f of rivers.features) {
    const sr = (f.properties as { scalerank: number }).scalerank;
    if (sr > 7) continue;
    ctx.lineWidth = (80 - sr * 6) * k; ctx.beginPath(); path(f); ctx.stroke();
  }
  ctx.filter = "none";
  ctx.globalCompositeOperation = "overlay"; ctx.drawImage(relief, 0, 0);
  ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = 0.6; ctx.drawImage(relief, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  for (const f of rivers.features) {
    const sr = (f.properties as { scalerank: number }).scalerank;
    const w = Math.max(1.4, 6.2 - sr * 0.55) * k;
    ctx.beginPath(); path(f);
    ctx.strokeStyle = "rgba(35,70,85,0.55)"; ctx.lineWidth = w + 2.4 * k; ctx.stroke();
    ctx.strokeStyle = "#5E9BB0"; ctx.lineWidth = w; ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath(); path(LAND); ctx.strokeStyle = "rgba(48,30,12,0.75)"; ctx.lineWidth = 2.4 * k; ctx.stroke();
};

export const Bake: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("v51 bake"));
  useEffect(() => {
    const img = new Image(); img.src = staticFile("relief.png");
    Promise.all([img.decode(), fetch(staticFile("rivers.json")).then((r) => r.json()), fetch(staticFile("land.json")).then((r) => r.json())])
      .then(([, rivers, land]) => { LAND = land; draw(ref.current!.getContext("2d")!, img, rivers); continueRender(h); })
      .catch((e) => { console.error(e); continueRender(h); });
  }, [h]);
  return (
    <AbsoluteFill style={{ background: "#0F2129" }}>
      <canvas ref={ref} width={BW} height={BH} />
    </AbsoluteFill>
  );
};
