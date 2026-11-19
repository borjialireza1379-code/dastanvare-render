// v54 · Agarlogy · «سنتینل شمالی» — the user's narration (videos/54/vo/raw.wav, tempo 1.25 → src/v54/vo.json).
// Look: a live satellite map (EOX Sentinel-2 2016, CC BY 4.0) + a classified dossier on top of it:
// manila folders, photo prints with paper clips, typed fields (VazirCode), red ink stamps. Signal red is the only accent.
// Camera: spinning Blue Marble globe → one long dive onto North Sentinel → the map follows the story
// (India, the 2018 route at night, the beach, a tilted 3D island, the 5 km ring) → back out to the globe.
// Photos: the user's ChatGPT pictures in public/v54/img (IMG flags), CDC TEM photos (public domain) in public/v54/footage.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Html5Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import tiles from "./tiles.json";
import vo from "./vo.json";
import geo from "./geo.json";
import { drawGlobe, drawStars, type GLook } from "./globe";

export const V54_FPS = 30;
type Word = { w: string; s: number; e: number };
type Line = { n: number; s: number; e: number; text: string; words: Word[] };
const LINES = (vo as unknown as { lines: Line[] }).lines;
const TOTAL = (vo as { total: number }).total;
export const V54_FRAMES = Math.ceil((TOTAL + 0.3) * V54_FPS);
const W = 1080, H = 1920;

// ---------- fonts ----------
const FA_T = "Estedad", FA_UI = "Vazirmatn", FA_TY = "VazirCode", MONO = "JBMonoV54";
if (typeof window !== "undefined") {
  const h = delayRender("v54 fonts");
  Promise.all(
    ([
      [FA_UI, "fonts/Vazirmatn-Regular.ttf", { weight: "400" }],
      [FA_UI, "fonts/Vazirmatn-Bold.ttf", { weight: "700" }],
      [FA_UI, "fonts/Vazirmatn-Black.ttf", { weight: "900" }],
      [FA_T, "fonts/Estedad-Black.woff2", { weight: "900" }],
      [FA_TY, "fonts/VazirCode.ttf", { weight: "400" }],
      [MONO, "fonts/JetBrainsMono.ttf", { weight: "100 900" }],
    ] as [string, string, FontFaceDescriptors][]).map(([f, u, d]) => new FontFace(f, `url('${staticFile(u)}')`, d).load().then((ff) => document.fonts.add(ff))),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}

// ---------- pictures ----------
// the user's ChatGPT pictures (public/v54/img/<name>.png); false = an empty print with the file name
export const IMG: Record<string, boolean> = {
  "01-shore": false, "02-helicopter": false, "03-village": false, "04-night-boat": false,
  "05-kayak": false, "06-aftermath": false, "07-food": false, "08-ship": false,
};
const REAL = new Set(["measles", "flu"]);
const hasImg = (s: string) => REAL.has(s) || !!IMG[s];
const imgUrl = (s: string) => (REAL.has(s) ? staticFile(`v54/footage/${s}.jpg`) : staticFile(`v54/img/${s}.png`));
// where each food item sits in 07-food.png (fractions of width/height) — set after the picture arrives
const FOOD: [string, string, number, number][] = [
  ["ماهی", "ماهی", 0.2, 0.3], ["لاک", "لاک‌پشت دریایی", 0.5, 0.3], ["گراز", "گراز وحشی", 0.8, 0.3],
  ["خرچنگ", "خرچنگ", 0.28, 0.72], ["میوه", "میوه‌های جنگلی", 0.72, 0.72],
];

// ---------- palette ----------
const RED = "#E8403A", RED2 = "#FF6B5E", PAPER = "#EEE5D1", MANILA = "#D5BB84", INK = "#1B140D", CREAM = "#F5EDDD", OCEAN = "#0F2035";
const SH = "0 2px 10px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.95)";

// ---------- helpers ----------
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const eout = (x: number) => 1 - (1 - x) ** 3;
const ein = (x: number) => x * x * x;
const back = (x: number) => { const c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const ramp = (t: number, a: number, b: number) => eout(lin(t, a, b));
const win = (t: number, a: number, b: number, f = 0.3) => Math.min(ramp(t, a, a + f), 1 - eio(lin(t, b - f, b)));
const fa = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const faNum = (n: number) => fa(Math.round(n).toLocaleString("en-US").replace(/,/g, "٬"));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const L = (i: number) => LINES[i];
const ls = (i: number) => L(i).s, le = (i: number) => L(i).e;
const Wd = (i: number, word: string, frac = 0) => {
  const bare = (s: string) => s.replace(/[.,:?!؛،؟«»]/g, "");
  const w = L(i).words.find((x) => bare(x.w) === word) ?? L(i).words.find((x) => x.w.includes(word));
  return w ? w.s : L(i).s + (L(i).e - L(i).s) * frac;
};

// ---------- web mercator (world units 0..256 at zoom 0) ----------
type Pt = [number, number];
type Cam = { lon: number; lat: number; z: number };
const wx = (lon: number) => ((lon + 180) / 360) * 256;
const wy = (lat: number) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 256; };
const unwx = (x: number) => (x / 256) * 360 - 180;
const unwy = (y: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 256))) * 180) / Math.PI;
const G = geo as unknown as { india: string; coast: Pt[]; ring5: Pt[]; center: Pt };
const CL: Pt = G.center;
const CW: Pt = [wx(CL[0]), wy(CL[1])];
const ISL_R = Math.max(...G.coast.map((p) => Math.hypot(p[0] - CW[0], p[1] - CW[1]))); // world units
const atAngle = (pts: Pt[], a: number) => pts[Math.round(((((a / (2 * Math.PI)) % 1) + 1) % 1) * pts.length) % pts.length];
const LAND_W = atAngle(G.coast, 0.32); // east-south-east shore: the landing beach in the story
const LAND: Pt = [unwx(LAND_W[0]), unwy(LAND_W[1])];
const PB: Pt = [92.735, 11.665]; // Port Blair
const fromC = (a: number, r: number): Pt => [unwx(CW[0] + Math.cos(a) * ISL_R * r), unwy(CW[1] + Math.sin(a) * ISL_R * r)];
const lerpW = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

// ---------- camera ----------
type Key = { t: number; p: Pt; z: number; e?: "io" | "o" | "i" | "l" };
const HOOK_END = 3.25;
function hookCam(t: number): Cam {
  const pr = eout(lin(t, 0, 1.75));
  const lon = 26 + (CL[0] - 26) * pr, lat = 33 + (CL[1] - 33) * pr;
  const z = t < 1.0 ? 3.15 + 0.35 * t : 3.5 + (13.3 - 3.5) * eio(lin(t, 1.0, 3.15));
  return { lon, lat, z };
}
const KEYS: Key[] = [
  { t: HOOK_END, p: CL, z: 13.3 },
  { t: le(1), p: [CL[0] + 0.003, CL[1] - 0.002], z: 13.6 },
  { t: le(3) + 0.1, p: CL, z: 13.85 },
  { t: ls(5) - 0.05, p: CL, z: 13.25 },
  { t: ls(5) + 1.3, p: [84.6, 15.4], z: 6.05 },
  { t: ls(6) + 0.05, p: [85.2, 15.1], z: 6.15 },
  { t: ls(6) + 1.5, p: CL, z: 13.45 },
  { t: le(7), p: CL, z: 13.8 },
  { t: ls(8) + 1.0, p: CL, z: 12.72 },
  { t: le(8), p: CL, z: 12.62 },
  { t: ls(9) + 1.7, p: [92.49, 11.66], z: 11.05 },
  { t: Wd(10, "مخفیانه") + 0.3, p: [92.47, 11.65], z: 11.12 },
  { t: Wd(10, "آشنا") + 0.25, p: LAND, z: 13.6 },
  { t: ls(11) + 0.8, p: LAND, z: 14.5 },
  { t: le(11), p: LAND, z: 14.6 },
  { t: ls(12) + 1.2, p: [CL[0] + 0.022, CL[1]], z: 12.85 },
  { t: le(12), p: [CL[0] + 0.022, CL[1]], z: 12.8 },
  { t: ls(13) + 1.4, p: CL, z: 14.0 },
  { t: le(14), p: CL, z: 14.12 },
  { t: le(16), p: CL, z: 13.9 },
  { t: ls(17) + 0.6, p: CL, z: 13.5 },
  { t: le(19), p: CL, z: 13.35 },
  { t: ls(20) + 1.2, p: CL, z: 12.6 },
  { t: le(20), p: CL, z: 12.5 },
  { t: le(21) + 0.05, p: CL, z: 11.4 },
  { t: le(22), p: CL, z: 11.15 },
  { t: ls(23) + 2.7, p: [CL[0] - 6, CL[1] + 4], z: 3.55 },
  { t: TOTAL + 2, p: [CL[0] - 14, CL[1] + 6], z: 3.45, e: "l" },
];
function keyCam(t: number): Cam {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const u = lin(t, a.t, b.t);
  const p = b.e === "l" ? u : b.e === "o" ? eout(u) : b.e === "i" ? ein(u) : eio(u);
  const z = a.z + (b.z - a.z) * p;
  const ax = wx(a.p[0]), ay = wy(a.p[1]), bx = wx(b.p[0]), by = wy(b.p[1]);
  let x: number, y: number;
  if (b.z >= a.z) { const f = (1 - p) * 2 ** (a.z - z); x = bx - (bx - ax) * f; y = by - (by - ay) * f; }
  else { const f = p * 2 ** (b.z - z); x = ax + (bx - ax) * f; y = ay + (by - ay) * f; }
  return { lon: unwx(x), lat: unwy(y), z };
}
function camAt(t: number): Cam {
  const c = t < HOOK_END ? hookCam(t) : keyCam(t);
  const ppd = (256 * 2 ** c.z) / 360; // px per degree of longitude
  return { lon: c.lon + (Math.sin(t * 0.37) * 5) / ppd, lat: c.lat + (Math.cos(t * 0.29) * 4) / ppd, z: c.z + 0.008 * Math.sin(t * 0.5) };
}
const TILT: [number, number, number][] = [
  [0, 0, 0], [ls(13) + 0.05, 0, 0], [ls(13) + 1.5, 44, -5], [le(16), 44, 7], [ls(17) + 0.7, 0, 0],
  [ls(20) - 0.1, 0, 0], [ls(20) + 1.3, 36, -6], [le(20), 36, 5], [le(21) + 0.1, 0, 0], [TOTAL + 2, 0, 0],
];
function tiltAt(t: number): [number, number] {
  let i = 0;
  while (i < TILT.length - 2 && t > TILT[i + 1][0]) i++;
  const [t0, a0, r0] = TILT[i], [t1, a1, r1] = TILT[i + 1];
  const p = eio(lin(t, t0, t1));
  return [a0 + (a1 - a0) * p, r0 + (r1 - r0) * p];
}

// ---------- map ----------
type Lv = { z: number; x0: number; y0: number; cols: number; rows: number };
const TL = tiles as unknown as Record<string, Lv>;
// the z11 mosaic is cloudy south of ~11.2°N: fade it out there (the z8 level shows instead)
const NEAR_FADE = (() => {
  const m = TL.near, f = (lat: number) => ((wy(lat) * 2 ** m.z - m.y0 * 256) / (m.rows * 256)) * 100;
  return [f(11.3), f(11.18)];
})();
const Tiles: React.FC<{ c: Cam; night: number }> = ({ c, night }) => {
  const lv: [string, number, boolean][] = [
    ["wide", 1, c.z < 9.5], ["region", ramp(c.z, 7.0, 7.5), c.z > 6.9 && c.z < 13], ["near", ramp(c.z, 9.7, 10.2), c.z > 9.6], ["island", ramp(c.z, 12.0, 12.5), c.z > 11.9],
  ];
  const filter = `saturate(${1.05 - 0.45 * night}) contrast(1.06) brightness(${0.97 - 0.42 * night})`;
  return (
    <>
      {lv.map(([name, o, show]) => {
        if (!show || o <= 0) return null;
        const m = TL[name], k = 2 ** (c.z - m.z);
        const mask = name === "near" ? `linear-gradient(to bottom, #000 ${NEAR_FADE[0]}%, transparent ${NEAR_FADE[1]}%)` : undefined;
        return (
          <Img key={name} src={staticFile(`v54/${name}.jpg`)}
            style={{ position: "absolute", left: (m.x0 * 256 - wx(c.lon) * 2 ** m.z) * k + W / 2, top: (m.y0 * 256 - wy(c.lat) * 2 ** m.z) * k + H / 2, width: m.cols * 256 * k, height: m.rows * 256 * k, maxWidth: "none", opacity: o, filter, WebkitMaskImage: mask, maskImage: mask }} />
        );
      })}
    </>
  );
};
const sp = (c: Cam, ll: Pt): Pt => { const k = 2 ** c.z; return [(wx(ll[0]) - wx(c.lon)) * k + W / 2, (wy(ll[1]) - wy(c.lat)) * k + H / 2]; };
const spw = (c: Cam, p: Pt): Pt => { const k = 2 ** c.z; return [(p[0] - wx(c.lon)) * k + W / 2, (p[1] - wy(c.lat)) * k + H / 2]; };
const polyD = (c: Cam, pts: Pt[]) => pts.map((p, i) => { const [x, y] = spw(c, p); return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }).join("") + "Z";

// ---------- globe ----------
const LOOK: GLook = { sun: [-0.45, 0.5, 0.75], amb: 0.3, warm: 0.04, dim: 1.08, atm: 1 };
const Sky: React.FC<{ t: number; c: Cam }> = ({ t, c }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const x = cv.getContext("2d")!;
    x.clearRect(0, 0, W, H);
    drawStars(x, W, H, t, c.lon * 9 + t * 6, 1);
    const R = (256 * 2 ** c.z) / (2 * Math.PI * Math.cos((c.lat * Math.PI) / 180));
    drawGlobe(x, W, H, { lon: c.lon, lat: c.lat, R, cx: W / 2, cy: H / 2 }, LOOK, 1);
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />;
};

// ---------- small graphics ----------
const ICON: Record<string, React.ReactNode> = {
  phone: <><rect x="15" y="5" width="18" height="38" rx="4" /><line x1="21" y1="37" x2="27" y2="37" /></>,
  plane: <path d="M24 5 L27 19 L42 27 L42 31 L27 27 L26 37 L31 41 L31 43 L24 41 L17 43 L17 41 L22 37 L21 27 L6 31 L6 27 L21 19 Z" />,
  wifi: <><path d="M7 20 Q24 5 41 20" /><path d="M12.5 26 Q24 15 35.5 26" /><path d="M18 32 Q24 26 30 32" /><circle cx="24" cy="38" r="2.2" /></>,
  bulb: <><path d="M17 30 Q10 24 12 16 Q15 7 24 7 Q33 7 36 16 Q38 24 31 30 Z" /><line x1="19" y1="35" x2="29" y2="35" /><line x1="20" y1="40" x2="28" y2="40" /></>,
  tv: <><rect x="6" y="11" width="36" height="24" rx="3" /><line x1="17" y1="41" x2="31" y2="41" /><line x1="24" y1="35" x2="24" y2="41" /></>,
  bow: <><path d="M15 6 Q36 24 15 42" /><line x1="15" y1="6" x2="15" y2="42" /><line x1="8" y1="24" x2="40" y2="24" /><path d="M40 24 L34 20 M40 24 L34 28" /></>,
  fish: <><path d="M8 24 Q18 13 30 18 L40 12 L38 24 L40 36 L30 30 Q18 35 8 24 Z" /><circle cx="15" cy="22" r="1.4" /></>,
};
const Icon: React.FC<{ name: string; size: number; color?: string; sw?: number }> = ({ name, size, color = CREAM, sw = 2.6 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>{ICON[name]}</svg>
);
const FlagIN: React.FC<{ w?: number }> = ({ w = 66 }) => (
  <svg width={w} height={(w * 2) / 3} viewBox="0 0 30 20" style={{ display: "block", boxShadow: "0 2px 6px rgba(0,0,0,.5)" }}>
    <rect width="30" height="20" fill="#fff" /><rect width="30" height="6.67" fill="#FF9933" /><rect y="13.33" width="30" height="6.67" fill="#138808" />
    <circle cx="15" cy="10" r="2.7" fill="none" stroke="#000080" strokeWidth="0.45" />
    {Array.from({ length: 24 }, (_, i) => <line key={i} x1="15" y1="10" x2={15 + 2.7 * Math.cos((i * Math.PI) / 12)} y2={10 + 2.7 * Math.sin((i * Math.PI) / 12)} stroke="#000080" strokeWidth="0.18" />)}
  </svg>
);
const FlagUS: React.FC<{ w?: number }> = ({ w = 60 }) => (
  <svg width={w} height={(w * 10) / 19} viewBox="0 0 38 20" style={{ display: "block", boxShadow: "0 2px 6px rgba(0,0,0,.4)" }}>
    {Array.from({ length: 13 }, (_, i) => <rect key={i} y={(i * 20) / 13} width="38" height={20 / 13 + 0.02} fill={i % 2 ? "#fff" : "#B22234"} />)}
    <rect width="15.2" height="10.77" fill="#3C3B6E" />
    {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={1.4 + (i % 6) * 2.5 + (Math.floor(i / 6) % 2) * 1.2} cy={1.2 + Math.floor(i / 6) * 2.1} r={0.42} fill="#fff" />)}
  </svg>
);
// person pictogram, ~24 units tall, centred on the waist
const Fig: React.FC<{ x: number; y: number; s: number; color: string; o?: number }> = ({ x, y, s, color, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} opacity={o}>
    <circle cx="0" cy="-9" r="3.3" />
    <path d="M-3.4 -4.6h6.8a1.8 1.8 0 0 1 1.8 1.8v6h-2v8h-2.2v-6h-0.8v6h-2.2v-8h-2v-6a1.8 1.8 0 0 1 1.8 -1.8z" />
  </g>
);
// top-down boat: wake behind, hull, cabin
const Boat: React.FC<{ p: Pt; ang: number; s?: number; color?: string; k?: number; wake?: number; light?: number }> = ({ p, ang, s = 1, color = CREAM, k = 1, wake = 1, light }) =>
  k <= 0.01 ? null : (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${(ang * 180) / Math.PI}) scale(${s})`} opacity={k}>
      {wake > 0 && <><path d="M-16 -5 L-70 -24" stroke="rgba(255,255,255,.55)" strokeWidth={2.5} opacity={wake} /><path d="M-16 5 L-70 24" stroke="rgba(255,255,255,.55)" strokeWidth={2.5} opacity={wake} /><path d="M-18 0 L-58 0" stroke="rgba(255,255,255,.3)" strokeWidth={6} opacity={wake} /></>}
      <path d="M20 0 Q12 -8 -15 -7 L-17 0 L-15 7 Q12 8 20 0Z" fill={color} stroke="rgba(0,0,0,.7)" strokeWidth={2} />
      <rect x={-8} y={-4} width={10} height={8} rx={1.5} fill="rgba(0,0,0,.35)" />
      {light !== undefined && <circle cx={-3} cy={0} r={3.2} fill={light > 0.5 ? "#5AA9FF" : "#FF4D4D"} />}
    </g>
  );
// a flying arrow on a gentle arc; after landing it stays stuck (stick)
const FlyArrow: React.FC<{ a: Pt; b: Pt; p: number; len?: number; bend?: number; stick?: boolean; o?: number }> = ({ a, b, p, len = 64, bend = 0.12, stick, o = 1 }) => {
  if (p <= 0 || (p >= 1 && !stick)) return null;
  const q = Math.min(p, 1);
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const at = (s: number): Pt => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * my + s * s * b[1]];
  const tip = at(q), pre = at(Math.max(0, q - 0.03));
  const ang = (Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) * 180) / Math.PI;
  const tail = at(Math.max(0, q - 0.16));
  return (
    <g opacity={o}>
      {p < 1 && <line x1={tail[0]} y1={tail[1]} x2={tip[0]} y2={tip[1]} stroke="rgba(255,240,220,.35)" strokeWidth={len * 0.05} strokeLinecap="round" />}
      <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${ang})`}>
        <line x1={-len} y1={0} x2={-2} y2={0} stroke="#2A1A0E" strokeWidth={len * 0.085} strokeLinecap="round" />
        <line x1={-len} y1={0} x2={-2} y2={0} stroke="#D9C29A" strokeWidth={len * 0.045} strokeLinecap="round" />
        <path d={`M0 0 L${-len * 0.2} ${-len * 0.075} L${-len * 0.2} ${len * 0.075}Z`} fill="#1E140C" />
        <path d={`M${-len} 0 L${-len * 0.82} ${-len * 0.1} L${-len * 0.72} 0 L${-len * 0.82} ${len * 0.1}Z`} fill={RED} />
      </g>
    </g>
  );
};
const Brackets: React.FC<{ x0: number; y0: number; x1: number; y1: number; o: number; len?: number; color?: string }> = ({ x0, y0, x1, y1, o, len = 50, color = RED }) =>
  o <= 0.01 ? null : (
    <g fill="none" stroke={color} strokeWidth={5} strokeLinecap="square" opacity={o}>
      <path d={`M${x0} ${y0 + len}V${y0}H${x0 + len}`} /><path d={`M${x1 - len} ${y0}H${x1}V${y0 + len}`} />
      <path d={`M${x0} ${y1 - len}V${y1}H${x0 + len}`} /><path d={`M${x1 - len} ${y1}H${x1}V${y1 - len}`} />
    </g>
  );

// ---------- dossier pieces ----------
// red ink stamp that slams down
const Stamp: React.FC<{ text: string; x: number; y: number; k: number; rot?: number; size?: number; sub?: string; color?: string; paper?: boolean }> = ({ text, x, y, k, rot = -8, size = 64, sub, color = RED, paper }) => {
  if (k <= 0.01) return null;
  const s = 1 + 1.25 * (1 - eout(cl(k)));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: cl(k * 3) * 0.92, border: `${size * 0.08}px solid ${color}`, outline: `${size * 0.03}px solid ${color}`, outlineOffset: -size * 0.16, padding: `${size * 0.12}px ${size * 0.38}px ${size * 0.2}px`, color, fontFamily: FA_T, fontWeight: 900, fontSize: size, lineHeight: 1.15, direction: "rtl", textAlign: "center", whiteSpace: "nowrap", mixBlendMode: paper ? "multiply" : "normal", background: paper ? "transparent" : "rgba(20,10,8,.55)", textShadow: paper ? "none" : "0 0 18px rgba(232,64,58,.45)" }}>
      {text}
      {sub && <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: size * 0.36, marginTop: 2 }}>{sub}</div>}
    </div>
  );
};
// word-by-word typing (Persian letters must stay joined)
const Typed: React.FC<{ text: string; p: number; t: number; style?: React.CSSProperties }> = ({ text, p, t, style }) => {
  if (p <= 0) return null;
  const ws = text.split(" "), n = Math.ceil(cl(p) * ws.length);
  return (
    <div style={{ direction: "rtl", whiteSpace: "nowrap", ...style }}>
      {ws.slice(0, n).join(" ")}
      {p < 1 && <span style={{ opacity: Math.sin(t * 20) > 0 ? 1 : 0.2 }}>▍</span>}
    </div>
  );
};
const typeP = (t: number, a: number, text: string, rate = 0.09) => lin(t, a, a + Math.max(0.2, text.split(" ").length * rate));
const Clip: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 0 }) => (
  <svg width={46} height={110} viewBox="0 0 46 110" style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 3px 3px rgba(0,0,0,.45))" }}>
    <path d="M14 70 V18 a9 9 0 0 1 18 0 V84 a13 13 0 0 1 -26 0 V30" fill="none" stroke="#B9BEC4" strokeWidth={4.5} strokeLinecap="round" />
    <path d="M14 70 V18 a9 9 0 0 1 18 0 V84 a13 13 0 0 1 -26 0 V30" fill="none" stroke="#EEF1F4" strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);
// photo print: white border, clip, tag, "reconstruction" mark for AI pictures; drops in, exits downward
const Print: React.FC<{ src: string; x: number; y: number; w: number; k: number; out?: number; t: number; rot?: number; ar?: number; tag?: string; recon?: boolean; focus?: string; shake?: number; children?: React.ReactNode }> = ({ src, x, y, w, k, out = 0, t, rot = 0, ar = 3 / 2, tag, recon = true, focus = "50% 50%", shake = 0, children }) => {
  if (k <= 0.01 || out >= 0.999) return null;
  const h = w / ar, b = 14, bb = tag ? 54 : 14;
  const ke = eout(cl(k));
  const dx = shake * Math.sin(t * 61), dy = shake * Math.cos(t * 47);
  return (
    <div style={{ position: "absolute", left: x - w / 2 - b + dx, top: y - h / 2 - b + dy, width: w + 2 * b, height: h + b + bb, opacity: cl(k * 2.5) * (1 - out * 0.3), transform: `translateY(${(1 - ke) * -140 + eio(out) * 1500}px) rotate(${rot + (1 - ke) * 9 + out * 18}deg) scale(${1.14 - 0.14 * ke})`, background: "#F4EFE6", boxShadow: "0 26px 50px rgba(0,0,0,.55), 0 3px 8px rgba(0,0,0,.4)" }}>
      <div style={{ position: "absolute", left: b, top: b, width: w, height: h, overflow: "hidden", background: "linear-gradient(160deg,#3a3026,#15100b)" }}>
        {hasImg(src) ? (
          <Img src={imgUrl(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus, transformOrigin: focus, transform: `scale(${1.05 + 0.05 * lin(t % 30, 0, 8)})`, filter: "contrast(1.05) saturate(.85) sepia(.12)" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 26, color: "rgba(255,255,255,.45)", border: "2px dashed rgba(255,255,255,.18)" }}>{src}.png</div>
        )}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 60px rgba(20,10,0,.45)" }} />
        {recon && !REAL.has(src) && (
          <div style={{ position: "absolute", left: 14, top: 14, padding: "2px 10px 5px", border: `2px solid ${RED}`, color: RED, background: "rgba(244,239,230,.88)", fontFamily: FA_UI, fontWeight: 700, fontSize: 19, direction: "rtl", transform: "rotate(-4deg)" }}>بازسازی تصویری</div>
        )}
        {children}
      </div>
      {tag && <div style={{ position: "absolute", right: b + 6, bottom: 10, fontFamily: FA_TY, fontSize: 25, color: INK, direction: "rtl", whiteSpace: "nowrap" }}>{tag}</div>}
      <Clip x={w * 0.72} y={-34} rot={4} />
    </div>
  );
};
// manila folder sliding up from below; children are placed in folder coordinates
const Folder: React.FC<{ k: number; out?: number; x?: number; y: number; w: number; h: number; rot?: number; tab: string; shift?: Pt; children?: React.ReactNode }> = ({ k, out = 0, x = W / 2, y, w, h, rot = 0, tab, shift = [0, 0], children }) => {
  if (k <= 0.01 || out >= 0.999) return null;
  const ke = eout(cl(k));
  return (
    <div style={{ position: "absolute", left: x - w / 2 + shift[0], top: y - h / 2 + shift[1], width: w, height: h, transform: `translateY(${(1 - ke) * 1300 + eio(out) * 1500}px) rotate(${rot - (1 - ke) * 7 + out * 12}deg)` }}>
      <div style={{ position: "absolute", right: 46, top: -58, width: 330, height: 70, background: MANILA, borderRadius: "14px 14px 0 0", boxShadow: "0 -2px 10px rgba(0,0,0,.25)", fontFamily: FA_TY, fontSize: 28, color: INK, direction: "rtl", textAlign: "center", lineHeight: "62px" }}>{tab}</div>
      <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(115deg, rgba(0,0,0,.025) 0 2px, transparent 2px 8px), ${MANILA}`, borderRadius: 8, boxShadow: "0 30px 70px rgba(0,0,0,.6), inset 0 0 40px rgba(110,70,20,.25)" }} />
      <div style={{ position: "absolute", left: 34, top: 26, padding: "2px 14px 6px", border: `3px solid ${RED}`, color: RED, fontFamily: FA_T, fontWeight: 900, fontSize: 30, transform: "rotate(-3deg)", opacity: 0.85, mixBlendMode: "multiply" }}>محرمانه</div>
      {children}
    </div>
  );
};
// dark title plate on top of the frame
const Plate: React.FC<{ k: number; y?: number; children: React.ReactNode; border?: string; pad?: string }> = ({ k, y = 330, children, border = "rgba(245,237,221,.35)", pad = "18px 40px 24px" }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: W / 2, top: y, transform: `translate(-50%,-50%) translateY(${(1 - k) * -24}px) scale(${0.94 + 0.06 * k})`, opacity: cl(k * 1.6), padding: pad, background: "linear-gradient(180deg, rgba(18,14,11,.93), rgba(10,8,6,.93))", border: `2px solid ${border}`, boxShadow: "0 20px 50px rgba(0,0,0,.55)", direction: "rtl", textAlign: "center" }}>
      {children}
    </div>
  );
const Chip: React.FC<{ x: number; y: number; k: number; children: React.ReactNode; size?: number; color?: string; border?: string }> = ({ x, y, k, children, size = 32, color = CREAM, border = "rgba(245,237,221,.45)" }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - k) * 12}px)`, opacity: cl(k * 1.5), padding: `${size * 0.18}px ${size * 0.55}px ${size * 0.3}px`, background: "rgba(12,9,7,.88)", border: `2px solid ${border}`, color, fontFamily: FA_UI, fontWeight: 700, fontSize: size, direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 8px 22px rgba(0,0,0,.5)", display: "flex", alignItems: "center", gap: size * 0.35 }}>
      {children}
    </div>
  );

// ---------- captions ----------
const KEYW = /سنتینل|هند|۲۰۱۸|چاو|کشته|ممنوع|سرخک|آنفولانزا|فاجعه|پنج|بی‌خبره|آگاهانه|کامنت|تیر|کمان|اشتباه|جونش|مسیحیت|ایمنی|حفاظت|جسدش/;
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const line = LINES.find((l) => t >= l.s - 0.05 && t <= l.e + 0.25);
  if (!line?.words?.length) return null;
  const ws = line.words, groups: Word[][] = [];
  for (let i = 0; i < ws.length; i += 4) groups.push(ws.slice(i, i + 4));
  const g = groups.find((_, i) => t < (groups[i + 1]?.[0].s ?? 1e9)) ?? groups[groups.length - 1];
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1372, direction: "rtl", textAlign: "center", fontFamily: FA_UI, fontWeight: 900, fontSize: 64, lineHeight: 1.3, textShadow: "0 4px 0 rgba(0,0,0,.55), 0 0 18px rgba(0,0,0,.85), 0 0 4px #000" }}>
      {g.map((w, i) => {
        const on = t >= w.s;
        return <span key={i} style={{ color: on ? (KEYW.test(w.w) ? RED2 : CREAM) : "rgba(245,237,221,.42)", display: "inline-block", transform: `scale(${on && t < w.s + 0.12 ? 1.07 : 1})`, marginLeft: 16 }}>{w.w}</span>;
      })}
    </div>
  );
};

// ---------- the film ----------
export const V54: React.FC<{ silent?: boolean; at?: number }> = ({ silent, at }) => {
  const cur = useCurrentFrame();
  const t = (at ?? cur) / V54_FPS;
  const c = camAt(t);
  const [tilt, rot] = tiltAt(t);
  const k = 2 ** c.z;
  const P = (ll: Pt) => sp(c, ll);
  const isl = P(CL);
  const islR = ISL_R * k;
  const ms: React.ReactNode[] = []; // map-plane svg
  const mh: React.ReactNode[] = []; // map-plane html
  const sc: React.ReactNode[] = []; // screen
  const tileA = ramp(c.z, 5.45, 5.95);

  // map dim / night
  const dim = Math.max(
    0.45 * win(t, ls(2) - 0.1, ls(4) + 0.1, 0.4), 0.3 * win(t, ls(7) - 0.1, le(7) + 0.3), 0.32 * win(t, ls(9) + 0.2, Wd(10, "ماهیگیر"), 0.4),
    0.5 * win(t, ls(15) - 0.2, le(15) + 0.4), 0.55 * win(t, ls(17) - 0.1, le(19) + 0.3, 0.4), 0.42 * win(t, ls(21), le(23) + 0.6, 0.4),
  );
  const night = 0.9 * win(t, Wd(10, "ماهیگیر") - 0.5, Wd(10, "آشنا") + 0.7, 0.5);

  // ============ HOOK: globe → dive → lock ============
  {
    const a = win(t, 0, 3.45, 0.2);
    if (a > 0) {
      const alt = 20000 * 2 ** (3.15 - c.z);
      sc.push(
        <div key="alt" style={{ position: "absolute", left: W / 2, top: 236, transform: "translate(-50%,-50%)", opacity: a, display: "flex", alignItems: "center", gap: 16, padding: "10px 26px 14px", background: "rgba(8,10,14,.6)", border: "2px solid rgba(232,64,58,.7)", direction: "rtl" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: RED, opacity: Math.sin(t * 14) > 0 ? 1 : 0.25 }} />
          <div style={{ fontFamily: FA_TY, fontSize: 34, color: CREAM, whiteSpace: "nowrap" }}>ارتفاع: {faNum(alt >= 100 ? Math.round(alt / 10) * 10 : alt)} کیلومتر</div>
        </div>,
      );
    }
    // target lock on the island
    const lk = ramp(t, 2.72, 3.12), lo = 1 - ramp(t, ls(2) - 0.3, ls(2) + 0.1);
    if (lk > 0 && lo > 0) {
      const pts = G.coast.map((p) => spw(c, p));
      const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
      const pad = 26 + 260 * (1 - lk);
      const blink = t < 3.6 ? (Math.sin(t * 30) > -0.3 ? 1 : 0.4) : 1;
      ms.push(<Brackets key="br" x0={x0 - pad} y0={y0 - pad} x1={x1 + pad} y1={y1 + pad} o={lk * lo * blink} />);
      const pulse = lin(t, 3.0, 3.9);
      if (pulse > 0 && pulse < 1) ms.push(<circle key="pl" cx={isl[0]} cy={isl[1]} r={islR * (0.9 + 1.2 * pulse)} fill="none" stroke={RED} strokeWidth={6} opacity={(1 - pulse) * lo} />);
      sc.push(<Chip key="zone" x={W / 2} y={Math.min(1250, y1 + pad + 70)} k={ramp(t, 3.0, 3.3) * lo} color={RED2} border={RED}>⚠ منطقه‌ی ممنوعه</Chip>);
      sc.push(<div key="coord" style={{ position: "absolute", left: W / 2, top: Math.max(200, y0 - pad - 46), transform: "translate(-50%,-50%)", opacity: ramp(t, 2.9, 3.2) * lo, fontFamily: MONO, fontWeight: 600, fontSize: 30, color: CREAM, letterSpacing: 2, textShadow: SH, whiteSpace: "nowrap" }}>11°33′N  92°14′E</div>);
    }
  }

  // ============ L1: the coast is a wall ============
  {
    const cv = ramp(t, 3.3, 4.9) * (1 - ramp(t, ls(4) - 0.3, ls(4) + 0.2));
    if (cv > 0) {
      const d = polyD(c, G.coast);
      ms.push(<path key="cg" d={d} fill="none" stroke="rgba(232,64,58,.3)" strokeWidth={16} pathLength={1} strokeDasharray={`${cv} 2`} />);
      ms.push(<path key="cl" d={d} fill="none" stroke={RED} strokeWidth={4.5} pathLength={1} strokeDasharray={`${cv} 2`} />);
    }
    const bA = win(t, 3.6, le(1) + 0.5, 0.4);
    if (bA > 0) {
      const tStop = Wd(1, "سرزمینشون") + 0.2, tHit = Wd(1, "حتی");
      [0.15, 2.45, 4.35].forEach((ang, j) => {
        const pApp = eout(lin(t, 3.8 + j * 0.25, tStop));
        const tImp = tHit + 0.12 * j + 0.55;
        const back = eio(lin(t, tImp + 0.3, le(1) + 0.6));
        const r = 2.4 - 1.22 * pApp + 0.9 * back;
        const pos = P(fromC(ang, r));
        const hit = t >= tImp;
        ms.push(<Boat key={"b" + j} p={pos} ang={ang + Math.PI + (back > 0 ? Math.PI * back : 0)} s={1.25} color={hit ? RED2 : CREAM} k={bA} wake={1 - pApp * 0.7 + back} />);
        const from = P(fromC(ang + 0.1 * (j - 1), 0.62));
        ms.push(<FlyArrow key={"ba" + j} a={from} b={pos} p={lin(t, tHit + 0.12 * j, tImp)} len={60} bend={0.18} />);
        const fl = lin(t, tImp, tImp + 0.5);
        if (fl > 0 && fl < 1) ms.push(<circle key={"bf" + j} cx={pos[0]} cy={pos[1]} r={20 + 60 * fl} fill="none" stroke={RED} strokeWidth={5} opacity={1 - fl} />);
      });
    }
  }

  // ============ L2 / L3: two folders ============
  {
    const kA = ramp(t, ls(2) - 0.15, ls(2) + 0.45), kB = ramp(t, ls(3) - 0.12, ls(3) + 0.42), out = ramp(t, ls(4) - 0.3, ls(4) + 0.3);
    if (kA > 0 && out < 1) {
      const head = "پرونده‌ی ۰۱ ـ قبیله‌ای در انزوا";
      sc.push(
        <Folder key="fA" k={kA} out={out} y={860} w={940} h={920} rot={-2.5} tab="پرونده‌ی ۰۱" shift={[-24 * kB, -70 * kB]}>
          <Typed text={head} p={typeP(t, ls(2) + 0.3, head)} t={t} style={{ position: "absolute", right: 40, top: 40, fontFamily: FA_TY, fontSize: 34, color: INK }} />
          <Print src="01-shore" x={470} y={455} w={800} k={ramp(t, ls(2) + 0.15, ls(2) + 0.6)} t={t} rot={1.8} tag="ساحل جزیره ـ از روی قایق" />
          <Stamp text="چرا؟" x={250} y={790} k={ramp(t, Wd(2, "پیش") - 0.05, Wd(2, "پیش") + 0.13)} rot={-10} size={84} paper />
        </Folder>,
      );
    }
    if (kB > 0 && out < 1) {
      const head = "پرونده‌ی ۰۲ ـ مردی که قانون را شکست";
      sc.push(
        <Folder key="fB" k={kB} out={out} y={930} w={940} h={900} rot={3} tab="پرونده‌ی ۰۲">
          <Typed text={head} p={typeP(t, ls(3) + 0.25, head)} t={t} style={{ position: "absolute", right: 40, top: 40, fontFamily: FA_TY, fontSize: 34, color: INK }} />
          <Print src="05-kayak" x={470} y={450} w={800} k={ramp(t, ls(3) + 0.1, ls(3) + 0.55)} t={t} rot={-1.5} tag="نزدیک شدن به ساحل" />
          <Stamp text="قانون‌شکنی" x={300} y={775} k={ramp(t, Wd(3, "نادیده") - 0.05, Wd(3, "نادیده") + 0.13)} rot={-7} size={70} paper />
        </Folder>,
      );
    }
  }

  // ============ L4 / L5: name, then India ============
  {
    const kN = ramp(t, Wd(4, "سنتینل") - 0.2, Wd(4, "سنتینل") + 0.25) * (1 - ramp(t, ls(6) + 0.2, ls(6) + 0.6));
    sc.push(
      <Plate key="name" k={kN} y={318} border="rgba(232,64,58,.8)" pad="16px 52px 22px">
        <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 100, color: CREAM, lineHeight: 1.2, whiteSpace: "nowrap" }}>سنتینل شمالی</div>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 28, color: RED2, letterSpacing: 5, direction: "ltr" }}>NORTH SENTINEL ISLAND</div>
      </Plate>,
    );
    const kI = ramp(t, Wd(5, "هنده") - 0.5, Wd(5, "هنده") + 0.35) * (1 - ramp(t, ls(6) + 0.3, ls(6) + 0.8));
    if (kI > 0) {
      ms.push(<path key="ind" d={G.india} transform={`translate(${W / 2 - wx(c.lon) * k} ${H / 2 - wy(c.lat) * k}) scale(${k})`} fill={`rgba(232,64,58,${0.16 * kI})`} stroke={RED2} strokeWidth={3.5} vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={`${kI} 2`} strokeLinejoin="round" />);
      const p = P([79.2, 22.6]);
      mh.push(
        <div key="indL" style={{ position: "absolute", left: p[0], top: p[1], transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * kI})`, opacity: kI, display: "flex", alignItems: "center", gap: 18, direction: "rtl" }}>
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 92, color: CREAM, textShadow: SH }}>هند</div>
          <FlagIN w={78} />
        </div>,
      );
    }
    const kB = ramp(t, Wd(5, "خلیج") - 0.15, Wd(5, "خلیج") + 0.3) * (1 - ramp(t, ls(6) + 0.2, ls(6) + 0.6));
    if (kB > 0) {
      const p = P([88.3, 15.2]);
      mh.push(<div key="bay" style={{ position: "absolute", left: p[0], top: p[1], transform: "translate(-50%,-50%)", opacity: kB * 0.95, fontFamily: FA_UI, fontWeight: 700, fontSize: 44, color: "rgba(245,237,221,.88)", textShadow: SH, letterSpacing: 2, whiteSpace: "nowrap" }}>خلیج بنگال</div>);
    }
    const kD = win(t, ls(5) - 0.1, ls(6) + 1.2, 0.3) * (c.z < 11 ? 1 : 0);
    if (kD > 0) {
      const pu = (t * 1.2) % 1;
      ms.push(<g key="dot" opacity={kD}><circle cx={isl[0]} cy={isl[1]} r={14 + 40 * pu} fill="none" stroke={RED} strokeWidth={4} opacity={1 - pu} /><circle cx={isl[0]} cy={isl[1]} r={12} fill={RED} stroke="#000" strokeWidth={3} /></g>);
      mh.push(<div key="dotL" style={{ position: "absolute", left: isl[0] - 28, top: isl[1] - 8, transform: "translate(-100%,-50%)", opacity: kD, fontFamily: FA_UI, fontWeight: 900, fontSize: 34, color: CREAM, textShadow: SH, whiteSpace: "nowrap", direction: "rtl" }}>سنتینل شمالی</div>);
    }
  }

  // ============ L6: the tribe, isolation, no modern world ============
  {
    const kP = ramp(t, Wd(6, "سنتینلیه") - 0.2, Wd(6, "سنتینلیه") + 0.25) * (1 - ramp(t, Wd(6, "مردمی") - 0.1, Wd(6, "مردمی") + 0.2));
    if (kP > 0) {
      const p = P([CL[0] + 0.004, CL[1] - 0.003]);
      ms.push(<circle key="vp" cx={p[0]} cy={p[1]} r={13 * kP} fill={RED} stroke="#000" strokeWidth={3} />);
      sc.push(<Chip key="vpl" x={p[0]} y={p[1] - 70} k={kP} size={40}>قبیله‌ی سنتینلی</Chip>);
    }
    const out = ramp(t, Wd(6, "ارتباطی") - 0.35, Wd(6, "ارتباطی") + 0.15);
    sc.push(<Print key="vil" src="03-village" x={W / 2} y={720} w={900} k={ramp(t, Wd(6, "مردمی") - 0.15, Wd(6, "مردمی") + 0.35)} out={out} t={t} rot={-1.5} tag="محل زندگی: جنگل‌های جزیره" />);
    const kT = ramp(t, Wd(6, "قرن") - 0.2, Wd(6, "قرن") + 0.2) * (1 - out);
    if (kT > 0) {
      const bar = eio(lin(t, Wd(6, "قرن"), Wd(6, "کامل") + 0.3));
      sc.push(
        <div key="tl" style={{ position: "absolute", left: 90, top: 1130, width: 900, height: 150, opacity: kT, transform: `translateY(${(1 - kT) * 30}px)`, background: "rgba(12,9,7,.9)", border: "2px solid rgba(245,237,221,.3)", direction: "rtl" }}>
          <div style={{ position: "absolute", right: 30, top: 16, fontFamily: FA_TY, fontSize: 28, color: CREAM }}>قرن‌ها پیش</div>
          <div style={{ position: "absolute", left: 30, top: 16, fontFamily: FA_TY, fontSize: 28, color: CREAM }}>امروز</div>
          <div style={{ position: "absolute", left: 30, right: 30, top: 84, height: 4, background: "rgba(245,237,221,.25)" }} />
          {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: "absolute", right: 30 + i * 105, top: 76, width: 3, height: 20, background: "rgba(245,237,221,.5)" }} />)}
          <div style={{ position: "absolute", right: 30, top: 78, width: 840 * bar, height: 16, background: RED, boxShadow: "0 0 18px rgba(232,64,58,.6)" }} />
          <div style={{ position: "absolute", right: 30 + 840 * bar - 4, top: 70, width: 8, height: 32, background: CREAM }} />
          <div style={{ position: "absolute", right: 30, top: 104, fontFamily: FA_UI, fontWeight: 700, fontSize: 26, color: RED2, opacity: ramp(t, Wd(6, "انزوای"), Wd(6, "انزوای") + 0.3) }}>انزوای تقریباً کامل</div>
        </div>,
      );
    }
    const tI = Wd(6, "ارتباطی") - 0.05, kM = ramp(t, tI, tI + 0.4) * (1 - ramp(t, ls(7) - 0.1, ls(7) + 0.3));
    if (kM > 0) {
      ["phone", "plane", "wifi", "bulb", "tv"].forEach((n, i) => {
        const a = -Math.PI / 2 + ((i - 2) * Math.PI) / 4.2;
        const r = islR * 1.35 + 60 * (1 - kM) + 10 * Math.sin(t * 2 + i);
        const x = isl[0] + Math.cos(a) * r * 1.15, y = isl[1] + Math.sin(a) * r * 0.95 + 120;
        const sl = ramp(t, tI + 0.45 + i * 0.12, tI + 0.65 + i * 0.12);
        sc.push(
          <div key={"mi" + i} style={{ position: "absolute", left: x - 52, top: y - 52, width: 104, height: 104, borderRadius: 52, background: "rgba(12,9,7,.86)", border: `2px solid ${sl > 0.5 ? RED : "rgba(245,237,221,.5)"}`, opacity: kM * (1 - 0.35 * sl), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.7 + 0.3 * kM})` }}>
            <Icon name={n} size={60} color={sl > 0.5 ? "rgba(245,237,221,.55)" : CREAM} />
            <svg width={104} height={104} style={{ position: "absolute", left: -2, top: -2 }}><line x1={22} y1={22} x2={22 + 60 * sl} y2={22 + 60 * sl} stroke={RED} strokeWidth={7} strokeLinecap="round" /></svg>
          </div>,
        );
      });
    }
  }

  // ============ L7: bows and arrows ============
  {
    const tV = Wd(7, "تیر"), shake = 9 * Math.max(0, 1 - lin(t, tV + 0.35, tV + 0.9)) * (t > tV + 0.35 ? 1 : 0);
    const kP = ramp(t, ls(7) - 0.1, ls(7) + 0.35), out = ramp(t, le(7) + 0.05, le(7) + 0.45);
    sc.push(
      <Print key="heli" src="02-helicopter" x={W / 2} y={770} w={960} k={kP} out={out} t={t} rot={2} tag="هشدار با تیر و کمان" shake={shake}>
        <Stamp text="تهدید" x={700} y={470} k={ramp(t, Wd(7, "تهدید") - 0.05, Wd(7, "تهدید") + 0.13)} rot={-9} size={96} />
      </Print>,
    );
    const vol: React.ReactNode[] = [];
    for (let j = 0; j < 7; j++) {
      const a: Pt = [-120 + rnd(j) * 120, 1350 + rnd(j + 9) * 380], b: Pt = [760 + rnd(j + 3) * 420, 180 + rnd(j + 5) * 420];
      vol.push(<FlyArrow key={"v" + j} a={a} b={b} p={lin(t, tV + j * 0.07, tV + j * 0.07 + 0.42)} len={120} bend={0.08} />);
    }
    sc.push(<svg key="vol" width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>{vol}</svg>);
  }

  // ============ L8 (and L12, L20): the restricted ring ============
  {
    const kR = Math.max(
      ramp(t, Wd(8, "محدوده") - 0.3, Wd(8, "محدوده") + 0.6) * (1 - 0.75 * ramp(t, ls(9), ls(9) + 1.0)) * (1 - ramp(t, ls(11) - 0.5, ls(11))),
      0.85 * win(t, ls(12) + 0.2, le(12) + 0.3, 0.5),
      win(t, ls(20) + 0.2, le(20) + 0.4, 0.6),
    );
    if (kR > 0) {
      const dR = polyD(c, G.ring5), dC = polyD(c, G.coast);
      ms.push(
        <g key="ring" opacity={kR}>
          <defs>
            <pattern id="hatch54" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="26" height="26" fill="rgba(232,64,58,.09)" /><line x1="0" y1="0" x2="0" y2="26" stroke="rgba(232,64,58,.42)" strokeWidth="5" />
            </pattern>
          </defs>
          <path d={dR + dC} fill="url(#hatch54)" fillRule="evenodd" />
          <path d={dR} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth={9} />
          <path d={dR} fill="none" stroke={RED} strokeWidth={4.5} strokeDasharray="22 12" strokeDashoffset={-t * 30} />
        </g>,
      );
      const tS = Wd(8, "ممنوع") - 0.25;
      const sA = win(t, tS, ls(9) + 0.6, 0.25);
      if (sA > 0) for (let i = 0; i < 6; i++) {
        const p = spw(c, atAngle(G.ring5, (i / 6) * Math.PI * 2 + 0.5));
        const kk = ramp(t, tS + i * 0.07, tS + i * 0.07 + 0.2) * sA;
        ms.push(<g key={"ns" + i} transform={`translate(${p[0]} ${p[1]}) scale(${kk})`}><circle r={24} fill={CREAM} stroke={RED} strokeWidth={7} /><line x1={-13} y1={0} x2={13} y2={0} stroke={RED} strokeWidth={8} /></g>);
      }
    }
    const kN = ramp(t, Wd(8, "دولت") - 0.2, Wd(8, "دولت") + 0.3) * (1 - ramp(t, le(8) + 0.1, le(8) + 0.45));
    sc.push(
      <Plate key="ban" k={kN} y={330} border="rgba(232,64,58,.8)">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <FlagIN w={60} /><div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 38, color: CREAM }}>دولت هند</div>
        </div>
        <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 84, color: RED2, lineHeight: 1.2, opacity: ramp(t, Wd(8, "ممنوع") - 0.1, Wd(8, "ممنوع") + 0.1), transform: `scale(${1 + 0.3 * (1 - ramp(t, Wd(8, "ممنوع") - 0.1, Wd(8, "ممنوع") + 0.15))})` }}>ورود ممنوع</div>
      </Plate>,
    );
  }

  // ============ L9 / L10: 2018 — the file on John Allen Chau, the night route ============
  {
    const tY = ls(9) - 0.1, yr = Math.round(1970 + 48 * eout(lin(t, tY, Wd(9, "مردی") - 0.1)));
    const kY = ramp(t, tY, tY + 0.3) * (1 - ramp(t, Wd(10, "ماهیگیر") - 0.5, Wd(10, "ماهیگیر") - 0.1));
    if (kY > 0) {
      const done = yr === 2018 ? ramp(t, Wd(9, "مردی") - 0.1, Wd(9, "مردی") + 0.1) : 0;
      sc.push(<div key="yr" style={{ position: "absolute", left: W / 2, top: 300, transform: `translate(-50%,-50%) scale(${1 + 0.12 * (done < 1 ? done : 1 - ramp(t, Wd(9, "مردی") + 0.1, Wd(9, "مردی") + 0.4))})`, opacity: kY, fontFamily: FA_T, fontWeight: 900, fontSize: 150, color: done > 0 ? RED2 : CREAM, textShadow: "0 6px 30px rgba(0,0,0,.8)", lineHeight: 1 }}>{fa(yr)}</div>);
    }
    const kC = ramp(t, Wd(9, "مردی") - 0.1, Wd(9, "مردی") + 0.4), outC = ramp(t, Wd(10, "ماهیگیر") - 0.55, Wd(10, "ماهیگیر") - 0.05);
    if (kC > 0 && outC < 1) {
      const f1 = "نام: جان آلن چاو", f3 = "شغل: مبلغ مذهبی", f4 = "ملیت: آمریکایی", law = "قانون: ورود ممنوع";
      const tStrike = Wd(9, "نادیده");
      const ty: React.CSSProperties = { position: "absolute", right: 380, fontFamily: FA_TY, fontSize: 36, color: INK };
      sc.push(
        <div key="card" style={{ position: "absolute", left: 80, top: 520, width: 920, height: 600, transform: `translateX(${(1 - eout(kC)) * 1200 - eio(outC) * 1300}px) rotate(${-1.2 + (1 - kC) * 6}deg)`, background: `repeating-linear-gradient(0deg, rgba(60,40,20,.05) 0 1px, transparent 1px 46px), ${PAPER}`, boxShadow: "0 30px 70px rgba(0,0,0,.6)", direction: "rtl" }}>
          <div style={{ position: "absolute", right: 34, top: 26, fontFamily: FA_T, fontWeight: 900, fontSize: 44, color: INK }}>پرونده‌ی شخصی</div>
          <div style={{ position: "absolute", left: 34, top: 32, fontFamily: MONO, fontSize: 24, color: "rgba(27,20,13,.6)", direction: "ltr" }}>FILE 02 · 2018</div>
          <div style={{ position: "absolute", right: 34, top: 100, width: 300, height: 380, background: "linear-gradient(180deg,#2b2620,#14110d)", overflow: "hidden", border: "8px solid #f6f1e7", boxShadow: "0 6px 16px rgba(0,0,0,.35)" }}>
            <svg width={284} height={364} viewBox="0 0 284 364"><circle cx={142} cy={140} r={62} fill="#3b342c" /><path d="M30 364 Q36 236 142 224 Q248 236 254 364Z" fill="#3b342c" /><text x={142} y={168} textAnchor="middle" fontFamily={FA_T} fontWeight={900} fontSize={84} fill={RED}>؟</text></svg>
            <div style={{ position: "absolute", right: 10, bottom: 8, fontFamily: FA_UI, fontWeight: 700, fontSize: 20, color: "rgba(245,237,221,.7)" }}>بدون عکس</div>
          </div>
          <Typed text={f1} p={typeP(t, Wd(9, "جان") - 0.05, f1, 0.1)} t={t} style={{ ...ty, top: 120 }} />
          <div style={{ ...ty, top: 200, opacity: ramp(t, Wd(9, "مردی"), Wd(9, "مردی") + 0.3) }}>{law}</div>
          <div style={{ position: "absolute", right: 380, top: 226, width: 330 * eout(lin(t, tStrike, tStrike + 0.3)), height: 6, background: RED }} />
          <Typed text={f3} p={typeP(t, Wd(10, "مبلغ") - 0.1, f3, 0.1)} t={t} style={{ ...ty, top: 280 }} />
          <div style={{ position: "absolute", right: 380, top: 360, display: "flex", alignItems: "center", gap: 16 }}>
            <Typed text={f4} p={typeP(t, Wd(10, "آمریکایی") - 0.1, f4, 0.1)} t={t} style={{ fontFamily: FA_TY, fontSize: 36, color: INK }} />
            <div style={{ opacity: ramp(t, Wd(10, "آمریکایی") + 0.1, Wd(10, "آمریکایی") + 0.3) }}><FlagUS w={62} /></div>
          </div>
          <Stamp text="نادیده گرفت" x={250} y={505} k={ramp(t, tStrike + 0.15, tStrike + 0.3)} rot={-6} size={52} paper />
        </div>,
      );
    }
    // the route: Port Blair → the island, with the fishermen, at night
    const kRt = win(t, Wd(10, "کمک") - 0.3, ls(11) + 0.2, 0.3);
    if (kRt > 0) {
      const pb = P(PB), ld = P(LAND);
      const pr = eio(lin(t, Wd(10, "ماهیگیر"), Wd(10, "جزیره") + 0.2));
      const mx = (pb[0] + ld[0]) / 2 + (ld[1] - pb[1]) * 0.25, my = (pb[1] + ld[1]) / 2 - (ld[0] - pb[0]) * 0.25;
      const at = (s: number): Pt => [(1 - s) ** 2 * pb[0] + 2 * (1 - s) * s * mx + s * s * ld[0], (1 - s) ** 2 * pb[1] + 2 * (1 - s) * s * my + s * s * ld[1]];
      const bp = at(pr), bq = at(Math.max(0, pr - 0.02));
      ms.push(
        <g key="route" opacity={kRt}>
          <path d={`M${pb[0]} ${pb[1]}Q${mx} ${my} ${ld[0]} ${ld[1]}`} fill="none" stroke="rgba(245,237,221,.25)" strokeWidth={3} strokeDasharray="4 12" />
          <path d={`M${pb[0]} ${pb[1]}Q${mx} ${my} ${ld[0]} ${ld[1]}`} fill="none" stroke={CREAM} strokeWidth={5} strokeDasharray="14 12" opacity={0.9} mask="url(#rm54)" />
          <mask id="rm54"><path d={`M${pb[0]} ${pb[1]}Q${mx} ${my} ${ld[0]} ${ld[1]}`} fill="none" stroke="#fff" strokeWidth={14} pathLength={1} strokeDasharray={`${pr} 2`} /></mask>
          <circle cx={pb[0]} cy={pb[1]} r={11} fill={CREAM} stroke="#000" strokeWidth={3} />
          {pr > 0 && pr < 1 && <Boat p={bp} ang={Math.atan2(bp[1] - bq[1], bp[0] - bq[0])} s={1.3} k={1} />}
        </g>,
      );
      mh.push(<div key="pbL" style={{ position: "absolute", left: pb[0] + 22, top: pb[1] - 4, transform: "translate(0,-50%)", opacity: kRt, fontFamily: FA_UI, fontWeight: 900, fontSize: 34, color: CREAM, textShadow: SH, whiteSpace: "nowrap" }}>پورت‌بلر</div>);
      if (pr > 0.05 && pr < 1) mh.push(<div key="fbL" style={{ position: "absolute", left: bp[0], top: bp[1] - 52, transform: "translate(-50%,-50%)", fontFamily: FA_UI, fontWeight: 700, fontSize: 28, color: CREAM, textShadow: SH, whiteSpace: "nowrap", opacity: kRt }}>قایق ماهیگیرها</div>);
    }
    const kMoon = win(t, Wd(10, "مخفیانه") - 0.15, Wd(10, "آشنا") + 0.4, 0.25);
    sc.push(<Chip key="moon" x={W / 2} y={250} k={kMoon} size={38}><span style={{ fontSize: 40 }}>☾</span> شبانه و مخفیانه</Chip>);
    sc.push(<Print key="nb" src="04-night-boat" x={W / 2} y={700} w={880} k={ramp(t, Wd(10, "مخفیانه") - 0.25, Wd(10, "مخفیانه") + 0.2)} out={ramp(t, Wd(10, "قبیله") - 0.15, Wd(10, "قبیله") + 0.25)} t={t} rot={-2} tag="شب ـ نزدیک جزیره" />);
    const goal = "هدف: آشنا کردن قبیله با مسیحیت";
    const kG = ramp(t, Wd(10, "مسیحیت") - 0.45, Wd(10, "مسیحیت") - 0.2) * (1 - ramp(t, ls(11) + 0.1, ls(11) + 0.4));
    sc.push(<Plate key="goal" k={kG} y={330}><Typed text={goal} p={typeP(t, Wd(10, "مسیحیت") - 0.4, goal, 0.07)} t={t} style={{ fontFamily: FA_TY, fontSize: 40, color: CREAM }} /></Plate>);
  }

  // ============ L11 / L12: the beach ============
  {
    const kK = win(t, ls(11) - 0.8, le(12) + 0.4, 0.3);
    if (kK > 0) {
      const ld = P(LAND), outw = P(fromC(0.32, 1.9));
      const pk = eout(lin(t, ls(11) - 0.8, ls(11) + 0.6));
      const kp: Pt = [outw[0] + (ld[0] - outw[0]) * pk, outw[1] + (ld[1] - outw[1]) * pk];
      const dead = t >= Wd(11, "کشته");
      if (t < ls(12) + 0.2) ms.push(<g key="kay" opacity={kK}><Boat p={kp} ang={Math.atan2(ld[1] - outw[1], ld[0] - outw[0])} s={0.9} color={dead ? RED2 : "#F2D35B"} wake={1 - pk} /></g>);
      const tA = Wd(11, "حمله") - 0.15;
      for (let j = 0; j < 8; j++) {
        const src = P(lerpW(LAND, CL, 0.22 + rnd(j + 20) * 0.18));
        const a: Pt = [src[0] + (rnd(j + 30) - 0.5) * 260, src[1] + (rnd(j + 40) - 0.5) * 260];
        const b: Pt = [ld[0] + (rnd(j + 50) - 0.5) * 110, ld[1] + (rnd(j + 60) - 0.5) * 110];
        ms.push(<FlyArrow key={"aa" + j} a={a} b={b} p={lin(t, tA + j * 0.09, tA + j * 0.09 + 0.5)} len={46} bend={0.2} stick o={1 - ramp(t, ls(12) + 0.4, ls(12) + 0.9)} />);
      }
      const gl = win(t, tA + 0.45, ls(12) + 0.6, 0.3);
      if (gl > 0) ms.push(<circle key="glow" cx={ld[0]} cy={ld[1]} r={140} fill="url(#rg54)" opacity={gl * (0.75 + 0.25 * Math.sin(t * 8))} />);
      ms.push(<defs key="rgd"><radialGradient id="rg54"><stop offset="0" stopColor="rgba(255,60,50,.75)" /><stop offset="1" stopColor="rgba(255,60,50,0)" /></radialGradient></defs>);
      const kX = win(t, ls(12) - 0.1, le(12) + 0.4, 0.3);
      if (kX > 0) {
        ms.push(<g key="x" transform={`translate(${ld[0]} ${ld[1]}) scale(${kX * (1 + 0.08 * Math.sin(t * 6))})`}><circle r={30} fill="rgba(12,9,7,.85)" stroke={RED} strokeWidth={4} /><path d="M-12 -12L12 12M12 -12L-12 12" stroke={RED} strokeWidth={6} strokeLinecap="round" /></g>);
        sc.push(<Chip key="xl" x={ld[0] - 10} y={ld[1] - 82} k={ramp(t, ls(12) + 0.25, ls(12) + 0.6) * kX} size={32}>محل حادثه</Chip>);
      }
    }
    sc.push(
      <Print key="aft" src="06-aftermath" x={W / 2} y={760} w={940} k={ramp(t, Wd(11, "نهایت") - 0.3, Wd(11, "نهایت") + 0.15)} out={ramp(t, ls(12) + 0.5, ls(12) + 0.9)} t={t} rot={1.5} tag="ساحل جزیره ـ نوامبر ۲۰۱۸">
        <Stamp text="کشته شد" x={470} y={300} k={ramp(t, Wd(11, "کشته") - 0.05, Wd(11, "کشته") + 0.13)} rot={-8} size={110} />
      </Print>,
    );
    // a boat tries to come for him and turns back at the ring
    const kPb = win(t, ls(12) + 0.6, le(12) + 0.4, 0.3);
    if (kPb > 0) {
      const tTurn = Wd(12, "بازگردوندنش") - 0.2;
      const app = eout(lin(t, ls(12) + 0.6, tTurn)), ret = eio(lin(t, tTurn + 0.2, le(12) + 0.5));
      const r = 3.3 - 1.25 * app + 1.3 * ret;
      const bp = P(fromC(0.05, r));
      ms.push(<Boat key="pol" p={bp} ang={Math.PI + Math.PI * ret} s={1.5} k={kPb} light={Math.sin(t * 12) > 0 ? 1 : 0} wake={app < 1 ? 1 - app : ret > 0 ? 1 : 0.2} />);
      sc.push(<Chip key="pol2" x={Math.min(900, bp[0])} y={bp[1] - 80} k={ramp(t, Wd(12, "فراهم") - 0.3, Wd(12, "فراهم")) * kPb} size={34} color={RED2} border={RED}>بازگردانده نشد</Chip>);
    }
  }

  // ============ L13–L16: how they live (tilted island) ============
  {
    const kH = ramp(t, ls(13) - 0.1, ls(13) + 0.3) * (1 - ramp(t, le(13) + 0.1, le(13) + 0.4));
    const q = "بخش دوم ـ زندگی در جزیره";
    sc.push(<Plate key="ch2" k={kH} y={330}><Typed text={q} p={typeP(t, ls(13), q, 0.08)} t={t} style={{ fontFamily: FA_TY, fontSize: 40, color: CREAM }} /></Plate>);
    const pins: [string, string, Pt, number][] = [
      ["bow", "شکار", [CL[0] - 0.012, CL[1] + 0.009], Wd(14, "شکار")],
      ["bow", "شکار", [CL[0] + 0.014, CL[1] - 0.012], Wd(14, "شکار") + 0.15],
      ["fish", "ماهیگیری", fromC(Math.PI * 0.97, 0.9), Wd(14, "ماهیگیری")],
      ["fish", "ماهیگیری", fromC(Math.PI * 0.55, 0.92), Wd(14, "ماهیگیری") + 0.15],
    ];
    const pinOut = 1 - ramp(t, le(14) + 0.1, le(14) + 0.4);
    pins.forEach(([ic, lab, ll, t0], i) => {
      const kk = ramp(t, t0 - 0.1, t0 + 0.25) * pinOut;
      if (kk <= 0) return;
      const p = P(ll);
      mh.push(
        <div key={"pin" + i} style={{ position: "absolute", left: p[0], top: p[1], transform: `translate(-50%,-100%) scale(${kk})`, transformOrigin: "50% 100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px 10px", background: "rgba(12,9,7,.9)", border: `2px solid ${ic === "fish" ? "rgba(140,210,220,.9)" : "rgba(170,210,130,.9)"}`, direction: "rtl" }}>
            <Icon name={ic} size={44} />
            <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 34, color: CREAM, whiteSpace: "nowrap" }}>{lab}</div>
          </div>
          <div style={{ width: 3, height: 40, background: CREAM }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: CREAM, border: "3px solid #000", marginTop: -4 }} />
        </div>,
      );
    });
    // L15: the food evidence board
    const kF = ramp(t, ls(15) - 0.25, ls(15) + 0.2), oF = ramp(t, le(15) + 0.15, le(15) + 0.5);
    const PW = 1000, PH = PW / 1.5;
    sc.push(
      <Print key="food" src="07-food" x={W / 2} y={760} w={PW} k={kF} out={oF} t={t} rot={-1} tag="غذای اصلی سنتینلی‌ها">
        <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }}>
          {FOOD.map(([key, , fx, fy], i) => {
            const tw = Wd(15, key);
            const pp = ramp(t, tw - 0.1, tw + 0.3);
            if (pp <= 0) return null;
            return <ellipse key={i} cx={fx * PW} cy={fy * PH} rx={120} ry={95} fill="none" stroke={RED} strokeWidth={6} pathLength={1} strokeDasharray={`${pp} 2`} transform={`rotate(${-8 + i * 5} ${fx * PW} ${fy * PH})`} />;
          })}
        </svg>
        {FOOD.map(([key, lab, fx, fy], i) => {
          const tw = Wd(15, key), pp = ramp(t, tw, tw + 0.25);
          if (pp <= 0) return null;
          return <div key={"ft" + i} style={{ position: "absolute", left: fx * PW, top: fy * PH + 112, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * pp})`, opacity: pp, padding: "3px 14px 7px", background: CREAM, color: INK, fontFamily: FA_TY, fontSize: 28, whiteSpace: "nowrap", direction: "rtl", boxShadow: "0 3px 8px rgba(0,0,0,.4)" }}>{fa(i + 1)} ـ {lab}</div>;
        })}
      </Print>,
    );
    // L16: everything from the island itself — a gauge ring with the five foods on it
    const kG = win(t, ls(16) - 0.1, le(16) + 0.3, 0.35);
    if (kG > 0) {
      const R = islR * 1.28, gp = eio(lin(t, Wd(16, "تمام") - 0.1, le(16) - 0.4));
      const circ = 2 * Math.PI * R;
      ms.push(
        <g key="gauge" opacity={kG}>
          <circle cx={isl[0]} cy={isl[1]} r={R} fill="none" stroke="rgba(245,237,221,.25)" strokeWidth={14} />
          <circle cx={isl[0]} cy={isl[1]} r={R} fill="none" stroke={CREAM} strokeWidth={14} strokeDasharray={`${circ * gp} ${circ}`} transform={`rotate(-90 ${isl[0]} ${isl[1]})`} strokeLinecap="round" />
        </g>,
      );
      FOOD.forEach(([, lab, fx, fy], i) => {
        const a = -Math.PI / 2 + ((i + 0.5) / 5) * Math.PI * 2;
        const on = ramp(t, Wd(16, "تمام") - 0.1 + ((i + 0.5) / 5) * (le(16) - 0.3 - Wd(16, "تمام")), Wd(16, "تمام") + 0.15 + ((i + 0.5) / 5) * (le(16) - 0.3 - Wd(16, "تمام")));
        const x = isl[0] + Math.cos(a) * R, y = isl[1] + Math.sin(a) * R;
        mh.push(
          <div key={"md" + i} style={{ position: "absolute", left: x - 62, top: y - 62, width: 124, height: 124, borderRadius: 62, overflow: "hidden", border: `5px solid ${CREAM}`, boxShadow: "0 8px 20px rgba(0,0,0,.6)", opacity: kG * (0.25 + 0.75 * on), transform: `scale(${0.75 + 0.25 * on})`, background: hasImg("07-food") ? `url(${imgUrl("07-food")}) ${-(fx * 620 - 57)}px ${-(fy * 413 - 57)}px / 620px 413px no-repeat` : "rgba(12,9,7,.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {!hasImg("07-food") && <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 20, color: CREAM, textAlign: "center", direction: "rtl", padding: 6 }}>{lab}</div>}
          </div>,
        );
      });
      const pct = Math.round(100 * gp);
      sc.push(
        <Plate key="pct" k={kG} y={330} border="rgba(245,237,221,.5)">
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 96, color: CREAM, lineHeight: 1.1 }}>{fa(pct)}٪</div>
          <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 34, color: CREAM, opacity: 0.85 }}>غذا از طبیعت خود جزیره</div>
        </Plate>,
      );
    }
  }

  // ============ L17–L19: the real reason — disease ============
  {
    const kF = ramp(t, ls(17) - 0.15, ls(17) + 0.35), oF = ramp(t, ls(18) - 0.15, ls(18) + 0.3);
    if (kF > 0 && oF < 1) {
      const q = "دلیل اصلی ممنوعیت ورود غریبه‌ها";
      sc.push(
        <Folder key="fC" k={kF} out={oF} y={900} w={920} h={760} rot={-1.5} tab="پرونده‌ی ۰۳">
          <Typed text={q} p={typeP(t, ls(17) + 0.2, q, 0.08)} t={t} style={{ position: "absolute", right: 50, top: 110, fontFamily: FA_TY, fontSize: 42, color: INK }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: FA_T, fontWeight: 900, fontSize: 300, color: "rgba(27,20,13,.85)", lineHeight: 1, opacity: ramp(t, ls(17) + 0.4, ls(17) + 0.8) }}>؟</div>
          <Stamp text="مهم‌تر از همه" x={460} y={620} k={ramp(t, Wd(17, "مهم‌تر") - 0.05, Wd(17, "مهم‌تر") + 0.13)} rot={-6} size={66} paper />
        </Folder>,
      );
    }
    const kL = ramp(t, ls(18) - 0.2, ls(18) + 0.3), oL = ramp(t, ls(19) - 0.15, ls(19) + 0.3);
    if (kL > 0 && oL < 1) {
      const tm = Wd(18, "سرخک"), tf = Wd(18, "آنفولانزا"), ti = Wd(18, "ایمنی");
      const lvl = 1 - 0.82 * eio(lin(t, ti - 0.1, ti + 1.0));
      sc.push(
        <div key="lab" style={{ position: "absolute", left: 70, top: 380, width: 940, height: 880, transform: `translateY(${(1 - eout(kL)) * -1400 + eio(oL) * 1500}px) rotate(${0.8 + oL * 10}deg)`, background: `repeating-linear-gradient(0deg, rgba(60,40,20,.045) 0 1px, transparent 1px 44px), ${PAPER}`, boxShadow: "0 30px 70px rgba(0,0,0,.6)", direction: "rtl" }}>
          <div style={{ position: "absolute", right: 40, top: 26, fontFamily: FA_T, fontWeight: 900, fontSize: 52, color: INK }}>گزارش پزشکی</div>
          <div style={{ position: "absolute", left: 40, top: 40, fontFamily: MONO, fontSize: 22, color: "rgba(27,20,13,.6)", direction: "ltr" }}>FILE 03 · HEALTH RISK</div>
          <div style={{ position: "absolute", right: 40, top: 100, fontFamily: FA_TY, fontSize: 30, color: INK, opacity: 0.85 }}>خطر: بیماری‌های واگیر از دنیای بیرون</div>
          <Print src="measles" x={705} y={370} w={390} ar={1.15} k={ramp(t, tm - 0.25, tm + 0.15)} t={t} rot={-2.5} tag="سرخک" recon={false} />
          <Print src="flu" x={250} y={370} w={390} ar={1.15} k={ramp(t, tf - 0.25, tf + 0.15)} t={t} rot={2.2} tag="آنفولانزا" recon={false} />
          <div style={{ position: "absolute", right: 40, top: 640, fontFamily: FA_UI, fontWeight: 900, fontSize: 36, color: INK }}>ایمنی بدن</div>
          <div style={{ position: "absolute", right: 230, left: 40, top: 650, height: 40, border: `3px solid ${INK}`, opacity: ramp(t, ti - 0.4, ti - 0.1) }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${lvl * 100}%`, background: lvl > 0.5 ? "#5E7F4A" : RED, transition: "none" }} />
          </div>
          <div style={{ position: "absolute", left: 40, top: 705, fontFamily: FA_T, fontWeight: 900, fontSize: 46, color: RED, opacity: ramp(t, Wd(18, "نداشته") - 0.1, Wd(18, "نداشته") + 0.2) }}>ناکافی</div>
          <div style={{ position: "absolute", right: 40, bottom: 22, fontFamily: FA_UI, fontSize: 20, color: "rgba(27,20,13,.6)" }}>عکس‌ها: میکروسکوپ الکترونی، CDC (مالکیت عمومی)</div>
        </div>,
      );
    }
    // L19: ordinary for us, catastrophic for a tiny population
    const kU = ramp(t, ls(19) - 0.15, ls(19) + 0.3) * (1 - ramp(t, le(19) + 0.15, le(19) + 0.45));
    if (kU > 0) {
      const tn = Wd(19, "معمولی"), tp = Wd(19, "جمعیت"), tc = Wd(19, "فاجعه");
      const us: React.ReactNode[] = [];
      for (let r = 0; r < 8; r++) for (let q2 = 0; q2 < 30; q2++) {
        const i = r * 30 + q2, sick = rnd(i + 7) < 0.1 && win(t, tn + rnd(i) * 0.5, tn + 1.4 + rnd(i) * 0.4, 0.2) > 0.5;
        us.push(<Fig key={i} x={24 + q2 * 29.5 + (r % 2) * 14} y={52 + r * 34} s={1.15} color={sick ? RED : CREAM} o={0.55 + 0.45 * rnd(i + 3)} />);
      }
      const kS = ramp(t, tp - 0.25, tp + 0.2);
      const them: React.ReactNode[] = [];
      const wave = lin(t, tc - 0.7, tc + 0.5);
      for (let i = 0; i < 38; i++) {
        const a = rnd(i + 70) * Math.PI * 2, rr = Math.sqrt(rnd(i + 90)) * 1;
        const x = 470 + Math.cos(a) * rr * 330, y = 180 + Math.sin(a) * rr * 110;
        const inf = (x - 140) / 660 < wave * 1.15 && rnd(i + 5) < 0.9;
        them.push(<Fig key={i} x={x} y={y} s={2.1} color={inf ? RED : CREAM} />);
      }
      sc.push(
        <div key="pop" style={{ position: "absolute", left: 70, top: 400, width: 940, opacity: kU, transform: `translateY(${(1 - kU) * 40}px)` }}>
          <div style={{ position: "relative", height: 360, background: "rgba(12,9,7,.9)", border: "2px solid rgba(245,237,221,.3)" }}>
            <div style={{ position: "absolute", right: 24, top: 12, fontFamily: FA_UI, fontWeight: 900, fontSize: 36, color: CREAM, direction: "rtl" }}>ما</div>
            <div style={{ position: "absolute", left: 24, top: 18, fontFamily: FA_TY, fontSize: 26, color: "rgba(245,237,221,.7)", direction: "rtl", opacity: ramp(t, tn, tn + 0.3) }}>یه بیماری معمولی</div>
            <svg width={940} height={300} style={{ position: "absolute", left: 0, top: 50, WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)" }}>{us}</svg>
          </div>
          <div style={{ position: "relative", height: 400, marginTop: 30, background: "rgba(12,9,7,.9)", border: `2px solid ${wave > 0.4 ? RED : "rgba(245,237,221,.3)"}`, opacity: kS, transform: `translateY(${(1 - kS) * 40}px)` }}>
            <div style={{ position: "absolute", right: 24, top: 12, fontFamily: FA_UI, fontWeight: 900, fontSize: 36, color: CREAM, direction: "rtl" }}>جمعیت کوچک سنتینلی‌ها</div>
            <svg width={940} height={340} style={{ position: "absolute", left: 0, top: 60 }}>{them}</svg>
            <Stamp text="فاجعه‌بار" x={470} y={230} k={ramp(t, tc - 0.05, tc + 0.13)} rot={-8} size={92} />
          </div>
        </div>,
      );
    }
  }

  // ============ L20: the 5 km protected zone ============
  {
    const kD = win(t, Wd(20, "پنج") - 0.3, le(20) + 0.4, 0.3);
    if (kD > 0) {
      const a = spw(c, G.coast[0]), b = spw(c, G.ring5[0]);
      const dp = eout(lin(t, Wd(20, "پنج") - 0.2, Wd(20, "پنج") + 0.4));
      const e: Pt = [a[0] + (b[0] - a[0]) * dp, a[1] + (b[1] - a[1]) * dp];
      ms.push(
        <g key="dim" opacity={kD}>
          <line x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke="#000" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
          <line x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke={CREAM} strokeWidth={5} strokeLinecap="round" />
          <line x1={a[0]} y1={a[1] - 26} x2={a[0]} y2={a[1] + 26} stroke={CREAM} strokeWidth={5} />
          {dp > 0.95 && <line x1={b[0]} y1={b[1] - 26} x2={b[0]} y2={b[1] + 26} stroke={CREAM} strokeWidth={5} />}
        </g>,
      );
      const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      mh.push(<div key="dimL" style={{ position: "absolute", left: m[0], top: m[1] - 58, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * dp})`, opacity: kD * dp, padding: "6px 22px 12px", background: "rgba(12,9,7,.9)", border: `2px solid ${CREAM}`, fontFamily: FA_T, fontWeight: 900, fontSize: 52, color: CREAM, whiteSpace: "nowrap", direction: "rtl" }}>۵ کیلومتر</div>);
    }
    const kZ = win(t, Wd(20, "حفاظت") - 0.25, le(20) + 0.4, 0.3);
    if (kZ > 0) {
      const p = spw(c, atAngle(G.ring5, -Math.PI / 2));
      mh.push(<div key="zoneL" style={{ position: "absolute", left: p[0], top: p[1] - 10, transform: `translate(-50%,-100%) scale(${0.85 + 0.15 * kZ})`, opacity: kZ, padding: "8px 26px 14px", background: "rgba(12,9,7,.92)", border: `3px solid ${RED}`, fontFamily: FA_T, fontWeight: 900, fontSize: 50, color: RED2, whiteSpace: "nowrap", direction: "rtl" }}>منطقه‌ی حفاظت‌شده</div>);
    }
    const kG = ramp(t, Wd(20, "دولت") - 0.2, Wd(20, "دولت") + 0.25) * (1 - ramp(t, le(20) + 0.1, le(20) + 0.4));
    sc.push(<Chip key="gov" x={W / 2} y={250} k={kG} size={38}><FlagIN w={56} /> دولت هند</Chip>);
  }

  // ============ L21–L23: the question, two answers, comment ============
  {
    const kQ = ramp(t, ls(21) - 0.05, ls(21) + 0.12) * (1 - ramp(t, ls(22) - 0.1, ls(22) + 0.2));
    if (kQ > 0) sc.push(<div key="q" style={{ position: "absolute", left: W / 2, top: 820, transform: `translate(-50%,-50%) scale(${1 + 0.9 * (1 - eout(kQ))})`, opacity: cl(kQ * 2), fontFamily: FA_T, fontWeight: 900, fontSize: 520, color: RED, lineHeight: 1, textShadow: "0 0 60px rgba(232,64,58,.55), 0 10px 40px rgba(0,0,0,.8)" }}>؟</div>);
    const shrink = ramp(t, ls(23) - 0.1, ls(23) + 0.4), gone = ramp(t, le(23) + 0.4, le(23) + 0.9);
    const card = (key: string, x: number, kk: number, title: string, sub: string, img: React.ReactNode) =>
      kk <= 0.01 || gone >= 1 ? null : (
        <div key={key} style={{ position: "absolute", left: x - 235, top: 470 - 140 * shrink, width: 470, height: 680, opacity: cl(kk * 2) * (1 - gone), transform: `translateY(${(1 - eout(kk)) * 120}px) scale(${(0.9 + 0.1 * back(cl(kk))) * (1 - 0.18 * shrink)}) rotate(${x > W / 2 ? 1.5 : -1.5}deg)`, background: "#F4EFE6", padding: 14, boxSizing: "border-box", boxShadow: "0 26px 60px rgba(0,0,0,.6)" }}>
          <div style={{ width: "100%", height: 470, overflow: "hidden", position: "relative", background: "#14100c" }}>{img}</div>
          <div style={{ textAlign: "center", direction: "rtl", fontFamily: FA_T, fontWeight: 900, fontSize: 70, color: INK, lineHeight: 1.25, marginTop: 14 }}>{title}</div>
          <div style={{ textAlign: "center", direction: "rtl", fontFamily: FA_UI, fontWeight: 700, fontSize: 30, color: "rgba(27,20,13,.75)" }}>{sub}</div>
        </div>
      );
    const isl14 = TL.island, cxp = ((wx(CL[0]) * 2 ** 14 - isl14.x0 * 256) / (isl14.cols * 256)) * 100, cyp = ((wy(CL[1]) * 2 ** 14 - isl14.y0 * 256) / (isl14.rows * 256)) * 100;
    sc.push(card("c1", 790, ramp(t, Wd(22, "بی‌خبره") - 0.35, Wd(22, "بی‌خبره") + 0.1), "بی‌خبر", "از دنیای مدرن؟",
      <div style={{ position: "absolute", inset: 0, background: `url(${staticFile("v54/island.jpg")}) ${cxp}% ${cyp}% / 260% auto no-repeat`, transform: `scale(${1 + 0.04 * Math.sin(t * 0.6)})` }} />));
    sc.push(card("c2", 290, ramp(t, Wd(22, "آگاهانه") - 0.3, Wd(22, "آگاهانه") + 0.15), "آگاهانه", "دوری از دنیای ما؟",
      hasImg("08-ship") ? <Img src={imgUrl("08-ship")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 24, color: "rgba(255,255,255,.45)" }}>08-ship.png</div>));
    const kO = ramp(t, Wd(22, "یا") - 0.1, Wd(22, "یا") + 0.15) * (1 - gone);
    if (kO > 0 && t > Wd(22, "بی‌خبره")) sc.push(<div key="or" style={{ position: "absolute", left: W / 2 - 60, top: 750 - 160 * shrink, width: 120, height: 120, borderRadius: 60, background: RED, border: `5px solid ${CREAM}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FA_T, fontWeight: 900, fontSize: 56, color: CREAM, transform: `scale(${back(cl(kO)) * (1 - 0.18 * shrink)})`, boxShadow: "0 10px 30px rgba(0,0,0,.6)" }}>یا</div>);
    const kC = ramp(t, ls(23) - 0.1, ls(23) + 0.35);
    if (kC > 0) {
      const msg = "بی‌خبر یا آگاهانه؟ نظرت چیه…";
      const heart = ramp(t, Wd(23, "بنویسید"), Wd(23, "بنویسید") + 0.2);
      sc.push(
        <div key="cm" style={{ position: "absolute", left: 70, top: 1150, width: 940, height: 124, transform: `translateY(${(1 - eout(kC)) * 300}px)`, opacity: cl(kC * 2), background: "rgba(18,16,15,.94)", borderRadius: 62, border: "2px solid rgba(245,237,221,.35)", display: "flex", alignItems: "center", padding: "0 26px", gap: 22, direction: "rtl", boxShadow: "0 20px 50px rgba(0,0,0,.6)" }}>
          <div style={{ width: 78, height: 78, borderRadius: 39, background: `linear-gradient(135deg, ${RED}, #F2A65A)`, flexShrink: 0 }} />
          <Typed text={msg} p={typeP(t, ls(23), msg, 0.12)} t={t} style={{ flex: 1, fontFamily: FA_UI, fontWeight: 700, fontSize: 40, color: CREAM }} />
          <div style={{ fontSize: 56, color: RED2, transform: `scale(${1 + 0.6 * Math.sin(Math.PI * heart)})`, opacity: 0.4 + 0.6 * heart }}>♥</div>
        </div>,
      );
    }
  }

  // ============ HUD: logo, section tag ============
  const SECT: [number, string][] = [[ls(1) - 0.1, "جزیره‌ی ممنوعه"], [ls(9) - 0.1, "پرونده‌ی ۲۰۱۸"], [ls(13) - 0.1, "زندگی"], [ls(17) - 0.1, "دلیل اصلی"], [ls(21) - 0.1, "سؤال"]];
  let si = -1;
  SECT.forEach(([t0], i) => { if (t >= t0) si = i; });
  const sk = si >= 0 ? ramp(t, SECT[si][0], SECT[si][0] + 0.35) : 0;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #13243C 0%, #070C16 70%)", overflow: "hidden" }}>
      {tileA < 1 && <Sky t={t} c={c} />}
      <div style={{ position: "absolute", left: -W, top: -H, width: 3 * W, height: 3 * H, transform: `perspective(1700px) rotateX(${tilt}deg) rotateZ(${rot}deg)`, transformOrigin: "50% 50%", opacity: tileA }}>
        <div style={{ position: "absolute", left: W, top: H, width: W, height: H }}>
          <div style={{ position: "absolute", left: -W, top: -H, width: 3 * W, height: 3 * H, background: OCEAN }} />
          <Tiles c={c} night={night} />
          <div style={{ position: "absolute", left: -W, top: -H, width: 3 * W, height: 3 * H, background: `rgba(4,14,42,${0.45 * night})` }} />
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>{ms}</svg>
          {mh}
          <div style={{ position: "absolute", left: -W, top: -H, width: 3 * W, height: 3 * H, background: `rgba(6,8,12,${dim})` }} />
        </div>
      </div>
      {/* overlays drawn in the map plane but above the dim (labels must stay readable) are in mh; screen layer: */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,.5) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.5) 80%, rgba(0,0,0,.62) 100%)" }} />
      {sc}
      <Img src={staticFile("v54/logo.png")} style={{ position: "absolute", left: 44, top: 70, width: 92, opacity: 0.5 }} />
      {si >= 0 && (
        <div style={{ position: "absolute", right: 44, top: 86, display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 12px", background: "rgba(10,8,6,.78)", borderRight: `5px solid ${RED}`, direction: "rtl", opacity: sk, transform: `translateX(${(1 - sk) * 40}px)` }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: RED, opacity: Math.sin(t * 6) > 0 ? 1 : 0.3 }} />
          <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 30, color: CREAM, whiteSpace: "nowrap" }}>{SECT[si][1]}</div>
        </div>
      )}
      <Captions t={t} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: 0.08, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <filter id="gr54"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(t * 30) % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width={W} height={H} filter="url(#gr54)" />
      </svg>
      {!silent && <Html5Audio src={staticFile("v54/mix.wav")} />}
    </AbsoluteFill>
  );
};

// ---------- stills for checking (one frame per moment) ----------
export const LOOK_T = [0.05, 0.9, 1.8, 2.5, 3.15, 6.6, 8.3, 11.2, 14.9, 16.9, 19.7, 23.6, 26.7, 29.7, 33.9, 37.9, 41.0, 43.3, 47.3, 48.9, 52.4, 54.9, 57.4, 61.7, 65.6, 68.4, 73.4, 79.6, 84.6, 86.6, 90.8, 94.8];
export const V54Look: React.FC = () => {
  const f = useCurrentFrame();
  return <V54 silent at={Math.round(LOOK_T[Math.min(f, LOOK_T.length - 1)] * V54_FPS)} />;
};
