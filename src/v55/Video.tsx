// v55 · Agarlogy · «پایگاه دولچه» — the user's narration (videos/55/vo/raw.wav, tempo 1.25 → src/v55/vo.json).
// Look: v54's satellite map + classified dossier, pushed toward a conspiracy-theory mood: night tint, CRT signal screens,
// redaction bars, VHS rewind, glitch cuts, a cut-away of the seven underground floors, a red string on the map.
// Camera: Blue Marble globe spins from the Middle East to New Mexico → one long dive onto Dulce → mesa → New Mexico →
// back down into the ground → Albuquerque (Kirtland AFB, Bennewitz) → Dulce → … → back out to the globe.
// Map: EOX Sentinel-2 cloudless 2016 (CC BY 4.0). Pictures: the user's ChatGPT images in public/v55/img (IMG flags).
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Html5Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import tiles from "./tiles.json";
import vo from "./vo.json";
import { drawGlobe, drawStars, type GLook } from "./globe";

export const V55_FPS = 30;
type Word = { w: string; s: number; e: number };
type Line = { n: number; s: number; e: number; text: string; words: Word[] };
const LINES = (vo as unknown as { lines: Line[] }).lines;
const TOTAL = (vo as { total: number }).total;
export const V55_FRAMES = Math.ceil((TOTAL + 0.4) * V55_FPS);
const W = 1080, H = 1920;
const AUDIO = "v55/mix.wav"; // videos/55/mix.mjs

// ---------- fonts ----------
const FA_T = "Estedad", FA_UI = "Vazirmatn", FA_TY = "VazirCode", MONO = "JBMonoV55";
if (typeof window !== "undefined") {
  const h = delayRender("v55 fonts");
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
// the user's ChatGPT pictures (public/v55/img/<name>.png); false = an empty frame with the file name
export const IMG: Record<string, boolean> = {
  "01-mesa-lights": true, "02-radio-room": true, "03-ufo-photo": true, "04-lab": true,
  "05-hybrid-tank": true, "06-tunnel-fight": true, "07-handoff": true, "08-blast-door": true,
};
const hasImg = (s: string) => !!IMG[s];
const imgUrl = (s: string) => staticFile(`v55/img/${s}.png`);

// ---------- palette ----------
const RED = "#E8403A", RED2 = "#FF6B5E", PAPER = "#EEE5D1", INK = "#1B140D", CREAM = "#F5EDDD", OCEAN = "#0F2035";
const CRT = "#8DF5B4"; // only inside the signal monitor (the real colour of a 1970s scope)
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
/** a camera centre that puts `ll` dx/dy screen px left/up of the frame centre at zoom z */
const offPt = (ll: Pt, dx: number, dy: number, z: number): Pt => [unwx(wx(ll[0]) + dx / 2 ** z), unwy(wy(ll[1]) + dy / 2 ** z)];

// places (read off the Sentinel-2 mosaics)
const DUL: Pt = [-106.995, 36.946]; // Dulce town
const MESA: Pt = [-106.965, 36.99]; // Archuleta Mesa, north of town, on the Colorado line
const KAFB: Pt = [-106.56, 35.03]; // Kirtland Air Force Base
const HOME: Pt = [-106.5, 35.075]; // Four Hills, Albuquerque: Bennewitz's house next to the base
const NMC: Pt = [-106.05, 34.3];
const MID: Pt = [-106.75, 35.68]; // Albuquerque and Dulce both in frame at z 8.8
const ABQC: Pt = [-106.53, 35.035];
const SY = 820; // surface line of the cut-away (screen y)
const SEC = offPt(MESA, 0, H / 2 - (SY - 50), 13.25);
const NM: Pt[] = [[-109.05, 37.0], [-103.0, 37.0], [-103.0, 36.5], [-103.04, 36.5], [-103.06, 32.0], [-106.62, 32.0], [-106.53, 31.78], [-108.21, 31.78], [-108.21, 31.33], [-109.05, 31.33]];
const KAFB_POLY: Pt[] = [[-106.63, 35.05], [-106.53, 35.05], [-106.51, 35.062], [-106.47, 35.06], [-106.46, 35.0], [-106.5, 34.985], [-106.63, 34.985]];
const MESA_LOOP: Pt[] = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2, r = 1 + 0.16 * Math.sin(3 * a + 1) + 0.09 * Math.sin(5 * a + 2);
  return [MESA[0] + 0.03 * r * Math.cos(a), MESA[1] + 0.021 * r * Math.sin(a)];
});

// ---------- camera ----------
type Key = { t: number; p: Pt; z: number; e?: "io" | "o" | "i" | "l" };
const HOOK_END = 3.3;
function hookCam(t: number): Cam {
  const pr = eout(lin(t, 0, 1.9));
  const lon = 52 + (DUL[0] - 52) * pr, lat = 32 + (DUL[1] - 32) * pr;
  const z = t < 1.0 ? 3.1 + 0.3 * t : 3.4 + (13.3 - 3.4) * eio(lin(t, 1.0, HOOK_END));
  return { lon, lat, z };
}
const KEYS: Key[] = [
  { t: HOOK_END, p: DUL, z: 13.3 },
  { t: le(0), p: DUL, z: 13.62 },
  { t: Wd(1, "کوه‌های") - 0.15, p: DUL, z: 13.55 },
  { t: Wd(1, "کوه‌های") + 0.8, p: MESA, z: 13.1 },
  { t: Wd(1, "نیومکزیکوی") - 0.2, p: MESA, z: 12.95 },
  { t: Wd(1, "آمریکاست") + 0.35, p: NMC, z: 7.05, e: "o" },
  { t: ls(2) - 0.05, p: NMC, z: 7.1 },
  { t: ls(2) + 0.95, p: SEC, z: 13.2 },
  { t: le(2), p: SEC, z: 13.35 },
  { t: ls(3) + 0.15, p: SEC, z: 13.25 },
  { t: le(3) + 0.1, p: MID, z: 8.9 },
  { t: Wd(4, "مردی"), p: ABQC, z: 12.3 },
  { t: Wd(4, "نزدیکی"), p: ABQC, z: 12.4 },
  { t: le(4), p: ABQC, z: 12.6 },
  { t: Wd(5, "به‌تدریج"), p: ABQC, z: 12.5 },
  { t: Wd(5, "نتیجه") + 0.2, p: MID, z: 8.8 },
  { t: Wd(5, "دولچه") - 0.1, p: MID, z: 8.85 },
  { t: ls(7), p: MESA, z: 13.1 },
  { t: le(7), p: MESA, z: 13.4 },
  { t: le(8), p: MESA, z: 13.7 },
  { t: ls(9) + 1.3, p: ABQC, z: 12.4 },
  { t: le(9), p: ABQC, z: 12.6 },
  { t: ls(10) + 1.1, p: MID, z: 8.8 },
  { t: le(10), p: MID, z: 8.95 },
  { t: ls(12) + 0.5, p: MESA, z: 12.2 },
  { t: le(12) + 0.1, p: MESA, z: 12.5 },
  { t: TOTAL + 0.4, p: [DUL[0] - 4, DUL[1] + 2], z: 3.6 },
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
  const ppd = (256 * 2 ** c.z) / 360;
  return { lon: c.lon + (Math.sin(t * 0.37) * 5) / ppd, lat: c.lat + (Math.cos(t * 0.29) * 4) / ppd, z: c.z + 0.008 * Math.sin(t * 0.5) };
}

// ---------- map ----------
type Lv = { z: number; x0: number; y0: number; cols: number; rows: number };
const TL = tiles as unknown as Record<string, Lv>;
const Tiles: React.FC<{ c: Cam; night: number }> = ({ c, night }) => {
  const lv: [string, number, boolean][] = [
    ["wide", 1, c.z < 9.5], ["region", ramp(c.z, 7.0, 7.5), c.z > 6.9 && c.z < 13], ["near", ramp(c.z, 9.7, 10.2), c.z > 9.6],
    ["abq", ramp(c.z, 11.6, 12.1), c.z > 11.5], ["dulce", ramp(c.z, 12.0, 12.5), c.z > 11.9],
  ];
  const filter = `saturate(${1.0 - 0.35 * night}) contrast(1.08) brightness(${0.98 - 0.3 * night})`;
  return (
    <>
      {lv.map(([name, o, show]) => {
        if (!show || o <= 0) return null;
        const m = TL[name], k = 2 ** (c.z - m.z);
        return (
          <Img key={name} src={staticFile(`v55/${name}.jpg`)}
            style={{ position: "absolute", left: (m.x0 * 256 - wx(c.lon) * 2 ** m.z) * k + W / 2, top: (m.y0 * 256 - wy(c.lat) * 2 ** m.z) * k + H / 2, width: m.cols * 256 * k, height: m.rows * 256 * k, maxWidth: "none", opacity: o, filter }} />
        );
      })}
    </>
  );
};
const sp = (c: Cam, ll: Pt): Pt => { const k = 2 ** c.z; return [(wx(ll[0]) - wx(c.lon)) * k + W / 2, (wy(ll[1]) - wy(c.lat)) * k + H / 2]; };
const polyLL = (c: Cam, pts: Pt[], close = true) => pts.map((p, i) => { const [x, y] = sp(c, p); return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); }).join("") + (close ? "Z" : "");

// ---------- globe ----------
const LOOK: GLook = { sun: [-0.4, 0.5, 0.78], amb: 0.3, warm: 0.04, dim: 1.08, atm: 1 };
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
// "grey" pictogram: big head, almond eyes, thin body (same size as Fig)
const Alien: React.FC<{ x: number; y: number; s: number; color: string; o?: number }> = ({ x, y, s, color, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} opacity={o}>
    <path d="M0 -15.5 C4.8 -15.5 5.6 -11.5 4.6 -9 C3.6 -6.4 1.6 -5 0 -5 C-1.6 -5 -3.6 -6.4 -4.6 -9 C-5.6 -11.5 -4.8 -15.5 0 -15.5Z" />
    <ellipse cx={-2} cy={-10} rx={1.6} ry={0.85} fill="#000" transform="rotate(28 -2 -10)" />
    <ellipse cx={2} cy={-10} rx={1.6} ry={0.85} fill="#000" transform="rotate(-28 2 -10)" />
    <path d="M-2.2 -4.2h4.4a1.4 1.4 0 0 1 1.4 1.4v6.4h-1.5v8.4h-1.6v-6h-0.6v6h-1.6v-8.4h-1.5v-6.4a1.4 1.4 0 0 1 1.4 -1.4z" />
  </g>
);
const Brackets: React.FC<{ x0: number; y0: number; x1: number; y1: number; o: number; len?: number; color?: string }> = ({ x0, y0, x1, y1, o, len = 50, color = RED }) =>
  o <= 0.01 ? null : (
    <g fill="none" stroke={color} strokeWidth={5} strokeLinecap="square" opacity={o}>
      <path d={`M${x0} ${y0 + len}V${y0}H${x0 + len}`} /><path d={`M${x1 - len} ${y0}H${x1}V${y0 + len}`} />
      <path d={`M${x0} ${y1 - len}V${y1}H${x0 + len}`} /><path d={`M${x1 - len} ${y1}H${x1}V${y1 - len}`} />
    </g>
  );
// DNA double helix, scrolling
const Helix: React.FC<{ w: number; h: number; t: number; p?: number; color?: string }> = ({ w, h, t, p = 1, color = CREAM }) => {
  const N = 48, a: string[] = [], b: string[] = [], rungs: React.ReactNode[] = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * w * p, ph = i * 0.42 + t * 3;
    const y1 = h / 2 + Math.sin(ph) * h * 0.38, y2 = h / 2 - Math.sin(ph) * h * 0.38;
    a.push((i ? "L" : "M") + x.toFixed(1) + " " + y1.toFixed(1));
    b.push((i ? "L" : "M") + x.toFixed(1) + " " + y2.toFixed(1));
    if (i % 3 === 0) rungs.push(<line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={i % 6 ? color : RED} strokeWidth={3} opacity={0.35 + 0.4 * Math.abs(Math.cos(ph))} />);
  }
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      {rungs}
      <path d={a.join("")} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      <path d={b.join("")} fill="none" stroke={RED2} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
};
// oscilloscope trace
const Wave: React.FC<{ w: number; h: number; t: number; amp: number; color?: string }> = ({ w, h, t, amp, color = CRT }) => {
  const N = 120, d: string[] = [];
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * w, u = i / N;
    const burst = Math.exp(-(((u - ((t * 0.45) % 1.4) + 0.2) * 7) ** 2));
    const y = h / 2 + (Math.sin(u * 38 + t * 9) * 0.35 + Math.sin(u * 91 - t * 14) * 0.2 + (rnd(i + Math.floor(t * 15) * 7) - 0.5) * 0.5) * h * 0.42 * amp * (0.35 + 0.9 * burst);
    d.push((i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1));
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {Array.from({ length: 9 }, (_, i) => <line key={"v" + i} x1={(i * w) / 8} y1={0} x2={(i * w) / 8} y2={h} stroke="rgba(141,245,180,.13)" strokeWidth={1.5} />)}
      {Array.from({ length: 5 }, (_, i) => <line key={"h" + i} x1={0} y1={(i * h) / 4} x2={w} y2={(i * h) / 4} stroke="rgba(141,245,180,.13)" strokeWidth={1.5} />)}
      <path d={d.join("")} fill="none" stroke={color} strokeWidth={9} opacity={0.2} />
      <path d={d.join("")} fill="none" stroke={color} strokeWidth={3} />
    </svg>
  );
};

// ---------- dossier pieces ----------
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
// black redaction bar; `lift` 0..1 slides it off to the left to reveal what is under it
const Redact: React.FC<{ x: number; y: number; w: number; h?: number; lift?: number; k?: number }> = ({ x, y, w, h = 34, lift = 0, k = 1 }) =>
  k <= 0.01 || lift >= 0.999 ? null : (
    <div style={{ position: "absolute", right: x, top: y, width: w * k, height: h, background: "#0B0908", transform: `translateX(${-eio(lift) * (w + 120)}px) rotate(${-0.6 + eio(lift) * -4}deg)`, opacity: 1 - eio(lift) * 0.6 }} />
  );
const Clip: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 0 }) => (
  <svg width={46} height={110} viewBox="0 0 46 110" style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 3px 3px rgba(0,0,0,.45))" }}>
    <path d="M14 70 V18 a9 9 0 0 1 18 0 V84 a13 13 0 0 1 -26 0 V30" fill="none" stroke="#B9BEC4" strokeWidth={4.5} strokeLinecap="round" />
    <path d="M14 70 V18 a9 9 0 0 1 18 0 V84 a13 13 0 0 1 -26 0 V30" fill="none" stroke="#EEF1F4" strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);
const Placeholder: React.FC<{ src: string; size?: number }> = ({ src, size = 26 }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: size, color: "rgba(255,255,255,.45)", border: "2px dashed rgba(255,255,255,.18)" }}>{src}.png</div>
);
const ReconTag: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", padding: "2px 10px 5px", border: `2px solid ${RED}`, color: RED, background: "rgba(244,239,230,.88)", fontFamily: FA_UI, fontWeight: 700, fontSize: 19, direction: "rtl", transform: "rotate(-4deg)", ...style }}>تصویرسازی</div>
);
// photo print (horizontal pictures): white border, clip, tag; drops in, exits downward
const Print: React.FC<{ src: string; x: number; y: number; w: number; k: number; out?: number; t: number; rot?: number; ar?: number; tag?: string; focus?: string; shake?: number; children?: React.ReactNode }> = ({ src, x, y, w, k, out = 0, t, rot = 0, ar = 3 / 2, tag, focus = "50% 50%", shake = 0, children }) => {
  if (k <= 0.01 || out >= 0.999) return null;
  const h = w / ar, b = 14, bb = tag ? 54 : 14;
  const ke = eout(cl(k));
  const dx = shake * Math.sin(t * 61), dy = shake * Math.cos(t * 47);
  return (
    <div style={{ position: "absolute", left: x - w / 2 - b + dx, top: y - h / 2 - b + dy, width: w + 2 * b, height: h + b + bb, opacity: cl(k * 2.5) * (1 - out * 0.3), transform: `translateY(${(1 - ke) * -140 + eio(out) * 1500}px) rotate(${rot + (1 - ke) * 9 + out * 18}deg) scale(${1.14 - 0.14 * ke})`, background: "#F4EFE6", boxShadow: "0 26px 50px rgba(0,0,0,.55), 0 3px 8px rgba(0,0,0,.4)" }}>
      <div style={{ position: "absolute", left: b, top: b, width: w, height: h, overflow: "hidden", background: "linear-gradient(160deg,#2a2b26,#0f100c)" }}>
        {hasImg(src) ? (
          <Img src={imgUrl(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus, transformOrigin: focus, transform: `scale(${1.05 + 0.05 * lin(t % 30, 0, 8)})`, filter: "contrast(1.06) saturate(.8)" }} />
        ) : <Placeholder src={src} />}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 60px rgba(0,8,4,.5)" }} />
        <ReconTag style={{ left: 14, top: 14 }} />
        {children}
      </div>
      {tag && <div style={{ position: "absolute", right: b + 6, bottom: 10, fontFamily: FA_TY, fontSize: 25, color: INK, direction: "rtl", whiteSpace: "nowrap" }}>{tag}</div>}
      <Clip x={w * 0.72} y={-34} rot={4} />
    </div>
  );
};
// full-screen vertical picture: blur-zoom entry, slow push, dark top/bottom bands for text
const Full: React.FC<{ src: string; k: number; out: number; t: number; t0: number; focus?: string; tag?: string; children?: React.ReactNode }> = ({ src, k, out, t, t0, focus = "50% 50%", tag, children }) => {
  if (k <= 0.01 || out >= 0.999) return null;
  const ke = eout(cl(k));
  const s = 1.2 - 0.14 * ke + 0.06 * lin(t, t0, t0 + 5) + 0.12 * eio(out);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: cl(k * 2.5) * (1 - eio(out)), overflow: "hidden", background: "#05070A" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: focus, filter: `blur(${(1 - ke) * 12}px)` }}>
        {hasImg(src) ? <Img src={imgUrl(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus, filter: "contrast(1.08) saturate(.85)" }} /> : <div style={{ position: "absolute", inset: 80 }}><Placeholder src={src} size={34} /></div>}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.6) 0%, rgba(0,0,0,0) 27%, rgba(0,0,0,0) 58%, rgba(0,0,0,.66) 78%, rgba(0,0,0,.8) 100%)" }} />
      <ReconTag style={{ left: 44, top: 1288, opacity: 0.85 }} />
      {tag && <div style={{ position: "absolute", right: 44, top: 1284, fontFamily: FA_TY, fontSize: 28, color: CREAM, direction: "rtl", whiteSpace: "nowrap", textShadow: SH }}>{tag}</div>}
      {children}
    </div>
  );
};
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
// map pin: label box, stem, dot (anchored at the dot)
const Pin: React.FC<{ x: number; y: number; k: number; label: string; color?: string; size?: number; stem?: number }> = ({ x, y, k, label, color = CREAM, size = 40, stem = 56 }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) scale(${0.6 + 0.4 * eout(k)})`, transformOrigin: "50% 100%", opacity: cl(k * 2), display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ padding: "6px 22px 12px", background: "rgba(12,9,7,.92)", border: `3px solid ${color === CREAM ? "rgba(245,237,221,.7)" : RED}`, fontFamily: FA_UI, fontWeight: 900, fontSize: size, color, whiteSpace: "nowrap", direction: "rtl", boxShadow: "0 10px 24px rgba(0,0,0,.6)" }}>{label}</div>
      <div style={{ width: 4, height: stem, background: color === CREAM ? CREAM : RED }} />
      <div style={{ width: 22, height: 22, borderRadius: 11, background: color === CREAM ? CREAM : RED, border: "4px solid #000", marginTop: -6, marginBottom: -11 }} />
    </div>
  );

// ---------- captions ----------
const KEYW = /دولچه|فضایی|ژنتیکی|هفت|فوق‌محرمانه|بنویتز|سیگنال|۱۹۷۹|۱۹۷۰|ترکیبی|جنگ|گمراه|فریب|ساختگیه|پنهان|کامنت|مخفی|زیرزمینی|محرمانه|مسلحانه|ضد‌اطلاعات/;
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

// ---------- glitch cuts ----------
const GLITCH = [ls(3), ls(5) - 0.1, ls(6) - 0.1, Wd(7, "آزمایش‌های") - 0.25, Wd(7, "موجودات") - 0.2, ls(9) - 0.05, ls(11) - 0.05];
const glitchAt = (t: number) => Math.max(0, ...GLITCH.map((a) => (t >= a && t < a + 0.28 ? 1 - lin(t, a, a + 0.28) : 0)));
const GlitchBars: React.FC<{ t: number; g: number }> = ({ t, g }) => {
  if (g <= 0.01) return null;
  const f = Math.floor(t * 30);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 7 }, (_, i) => {
        const y = rnd(f * 7 + i) * H, h = 8 + rnd(f * 3 + i) * 90;
        return <div key={i} style={{ position: "absolute", left: (rnd(f + i * 5) - 0.5) * 200, top: y, width: W + 200, height: h, background: i % 2 ? `rgba(232,64,58,${0.35 * g})` : `rgba(160,230,255,${0.22 * g})`, mixBlendMode: "screen" }} />;
      })}
      <AbsoluteFill style={{ background: `rgba(255,255,255,${0.06 * g})` }} />
    </AbsoluteFill>
  );
};

// ---------- the film ----------
export const V55: React.FC<{ silent?: boolean; at?: number }> = ({ silent, at }) => {
  const cur = useCurrentFrame();
  const t = (at ?? cur) / V55_FPS;
  const c = camAt(t);
  const P = (ll: Pt) => sp(c, ll);
  const ms: React.ReactNode[] = []; // map svg
  const mh: React.ReactNode[] = []; // map html
  const sc: React.ReactNode[] = []; // screen
  const tileA = ramp(c.z, 5.45, 5.95);
  const g = glitchAt(t);

  const night = 0.4 * ramp(t, HOOK_END + 0.3, HOOK_END + 2.5) + 0.3 * win(t, ls(4), le(5), 0.6);
  const dim = Math.max(
    0.45 * win(t, Wd(4, "مردی") - 0.15, Wd(4, "نزدیکی") - 0.1, 0.3), 0.45 * win(t, ls(7) - 0.1, Wd(7, "آزمایش‌های"), 0.3),
    0.4 * win(t, Wd(8, "درگیری") - 0.3, Wd(8, "اتفاقی"), 0.3), 0.45 * win(t, Wd(9, "مشخص") - 0.2, le(9) + 0.3), 0.5 * win(t, ls(11), le(13) + 0.6, 0.4),
  );

  // ============ HOOK: globe → dive → lock on Dulce ============
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
    const lk = ramp(t, 2.7, 3.1), lo = 1 - ramp(t, ls(1) + 0.3, ls(1) + 0.7);
    if (lk > 0 && lo > 0) {
      const [x0, y0] = P([DUL[0] - 0.012, DUL[1] + 0.009]), [x1, y1] = P([DUL[0] + 0.012, DUL[1] - 0.009]);
      const pad = 20 + 260 * (1 - lk);
      const blink = t < 3.6 ? (Math.sin(t * 30) > -0.3 ? 1 : 0.4) : 1;
      ms.push(<Brackets key="br" x0={x0 - pad} y0={y0 - pad} x1={x1 + pad} y1={y1 + pad} o={lk * lo * blink} />);
      const ctr = P(DUL), pulse = lin(t, 3.0, 3.9);
      if (pulse > 0 && pulse < 1) ms.push(<circle key="pl" cx={ctr[0]} cy={ctr[1]} r={90 + 160 * pulse} fill="none" stroke={RED} strokeWidth={6} opacity={(1 - pulse) * lo} />);
      sc.push(<Chip key="zone" x={W / 2} y={Math.min(1250, y1 + pad + 64)} k={ramp(t, 3.0, 3.3) * lo} color={RED2} border={RED}>⚠ منطقه‌ی مشکوک</Chip>);
      sc.push(<div key="coord" style={{ position: "absolute", left: W / 2, top: Math.max(200, y0 - pad - 44), transform: "translate(-50%,-50%)", opacity: ramp(t, 2.9, 3.2) * lo, fontFamily: MONO, fontWeight: 600, fontSize: 30, color: CREAM, letterSpacing: 2, textShadow: SH, whiteSpace: "nowrap" }}>36°57′N  106°59′W</div>);
    }
    // "humans and aliens side by side" → "genetic experiments"
    const tSide = Wd(0, "کنار") - 0.15, tGen = Wd(0, "آزمایش‌های") - 0.1;
    const kS = ramp(t, tSide, tSide + 0.3) * (1 - ramp(t, tGen - 0.1, tGen + 0.15));
    if (kS > 0) {
      const join = eout(lin(t, tSide, tSide + 0.6));
      sc.push(
        <div key="side" style={{ position: "absolute", left: W / 2, top: 520, transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * kS})`, opacity: kS, width: 420, height: 190, background: "rgba(10,8,6,.86)", border: "2px solid rgba(245,237,221,.4)", boxShadow: "0 16px 40px rgba(0,0,0,.6)" }}>
          <svg width={420} height={190} style={{ position: "absolute", left: 0, top: 0 }}>
            <Fig x={210 - 50 - 60 * (1 - join)} y={108} s={4.6} color={CREAM} />
            <Alien x={210 + 50 + 60 * (1 - join)} y={110} s={4.6} color={CREAM} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: -52, textAlign: "center", fontFamily: FA_UI, fontWeight: 900, fontSize: 34, color: CREAM, textShadow: SH, direction: "rtl" }}>کنار هم؟</div>
        </div>,
      );
    }
    const kG = ramp(t, tGen, tGen + 0.3) * (1 - ramp(t, ls(1) - 0.05, ls(1) + 0.25));
    if (kG > 0) {
      sc.push(
        <div key="gen" style={{ position: "absolute", left: W / 2, top: 520, transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * kG})`, opacity: kG, padding: "22px 34px 26px", background: "rgba(10,8,6,.88)", border: `3px solid ${RED}`, boxShadow: "0 16px 40px rgba(0,0,0,.6)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Helix w={380} h={96} t={t} p={eout(lin(t, tGen, tGen + 0.6))} />
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 48, color: RED2, direction: "rtl", whiteSpace: "nowrap" }}>آزمایش ژنتیکی</div>
        </div>,
      );
    }
  }

  // ============ L1: Dulce Base, the mesa, New Mexico ============
  {
    const tNM = Wd(1, "نیومکزیکوی");
    const kN = ramp(t, Wd(1, "دولچه") - 0.2, Wd(1, "دولچه") + 0.25) * (1 - ramp(t, tNM - 0.3, tNM));
    sc.push(
      <Plate key="name" k={kN} y={330} border="rgba(232,64,58,.8)" pad="16px 52px 22px">
        <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 100, color: CREAM, lineHeight: 1.2, whiteSpace: "nowrap" }}>پایگاه دولچه</div>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 30, color: RED2, letterSpacing: 6, direction: "ltr" }}>DULCE BASE</div>
      </Plate>,
    );
    // the mesa outline (also stays for the cut-away)
    const tM = Wd(1, "کوه‌های") - 0.1;
    const kM = ramp(t, tM, tM + 0.7) * (1 - ramp(t, tNM - 0.1, tNM + 0.2)) + win(t, ls(2) + 0.7, ls(3) + 0.3, 0.4) * 0.8 + win(t, ls(8) - 0.2, ls(9) + 0.4, 0.4) * 0.8 + win(t, ls(11), Wd(12, "ساختگیه"), 0.4) * 0.8;
    if (kM > 0) {
      const d = polyLL(c, MESA_LOOP);
      ms.push(<path key="mz" d={d} fill={`rgba(232,64,58,${0.1 * cl(kM)})`} stroke={RED} strokeWidth={4.5} strokeDasharray="18 10" strokeDashoffset={-t * 25} opacity={cl(kM)} />);
      const top = P([MESA[0], MESA[1] + 0.026]);
      const kL = ramp(t, tM + 0.3, tM + 0.6) * (1 - ramp(t, tNM - 0.1, tNM + 0.2));
      if (kL > 0) mh.push(<div key="mzL" style={{ position: "absolute", left: top[0], top: top[1] - 10, transform: "translate(-50%,-100%)", opacity: kL, display: "flex", flexDirection: "column", alignItems: "center", direction: "rtl" }}>
        <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 42, color: CREAM, textShadow: SH, whiteSpace: "nowrap" }}>آرچولتا مِسا</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: RED2, letterSpacing: 3, textShadow: SH, direction: "ltr" }}>ARCHULETA MESA</div>
      </div>);
    }
    const kT = ramp(t, Wd(1, "شهر") - 0.15, Wd(1, "شهر") + 0.2) * (1 - ramp(t, tNM - 0.1, tNM + 0.15));
    if (kT > 0) { const p = P(DUL); mh.push(<Pin key="town" x={p[0]} y={p[1]} k={kT} label="شهر دولچه" size={36} stem={40} />); }
    // New Mexico
    const kS = ramp(t, tNM - 0.05, tNM + 0.9) * (1 - ramp(t, ls(2) + 0.1, ls(2) + 0.5));
    if (kS > 0) {
      ms.push(<path key="nm" d={polyLL(c, NM)} fill={`rgba(232,64,58,${0.13 * kS})`} stroke={RED2} strokeWidth={4} pathLength={1} strokeDasharray={`${kS} 2`} strokeLinejoin="round" />);
      const p = P([-106.1, 33.6]);
      mh.push(<div key="nmL" style={{ position: "absolute", left: p[0], top: p[1], transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * kS})`, opacity: kS, textAlign: "center", direction: "rtl" }}>
        <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 84, color: CREAM, textShadow: SH, whiteSpace: "nowrap" }}>نیومکزیکو</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: RED2, letterSpacing: 5, textShadow: SH, direction: "ltr" }}>NEW MEXICO</div>
      </div>);
    }
    const kU = ramp(t, Wd(1, "آمریکاست") - 0.15, Wd(1, "آمریکاست") + 0.2) * (1 - ramp(t, ls(2) + 0.1, ls(2) + 0.45));
    sc.push(<Chip key="usa" x={W / 2} y={300} k={kU} size={42}><FlagUS w={64} /> آمریکا</Chip>);
    const kD = win(t, tNM - 0.2, ls(2) + 0.9, 0.3) * (c.z < 11 ? 1 : 0);
    if (kD > 0) {
      const p = P(DUL), pu = (t * 1.2) % 1;
      ms.push(<g key="dot" opacity={kD}><circle cx={p[0]} cy={p[1]} r={14 + 40 * pu} fill="none" stroke={RED} strokeWidth={4} opacity={1 - pu} /><circle cx={p[0]} cy={p[1]} r={12} fill={RED} stroke="#000" strokeWidth={3} /></g>);
      mh.push(<div key="dotL" style={{ position: "absolute", left: p[0] + 26, top: p[1] - 6, transform: "translate(0,-50%)", opacity: kD, fontFamily: FA_UI, fontWeight: 900, fontSize: 36, color: CREAM, textShadow: SH, whiteSpace: "nowrap", direction: "rtl" }}>دولچه</div>);
    }
  }

  // ============ L2: the ground opens — seven floors ============
  {
    const tG = Wd(2, "زمین") - 0.15;
    const rv = eout(lin(t, tG, tG + 0.7)), out = ramp(t, le(2) + 0.05, ls(3) + 0.45);
    if (rv > 0 && out < 1) {
      const top = SY - 120 + (1 - rv) * (H - SY + 220) + eio(out) * (H - SY + 220);
      const tF0 = Wd(2, "پایگاه") - 0.05, tSeven = Wd(2, "هفت");
      const tHum = Wd(2, "انسان‌ها"), tAl = Wd(2, "موجودات"), tPr = Wd(2, "پروژه‌های");
      const floors: React.ReactNode[] = [];
      let shown = 0;
      for (let i = 0; i < 7; i++) {
        const kf = ramp(t, tF0 + i * 0.17, tF0 + i * 0.17 + 0.22);
        if (kf <= 0) continue;
        shown = i + 1;
        const y = 200 + i * 66, hgt = 48, x0 = 190 - i * 12, x1 = 890 + i * 12, wdt = (x1 - x0) * eout(kf);
        const cx = (x0 + x1) / 2;
        const red = i === 5 && t > tPr + 0.3;
        const people: React.ReactNode[] = [];
        for (let j = 0; j < 3; j++) {
          const alien = i % 2 === 1;
          const kp = ramp(t, (alien ? tAl : tHum) + j * 0.08 + i * 0.03, (alien ? tAl : tHum) + j * 0.08 + i * 0.03 + 0.2);
          if (kp <= 0) continue;
          const dir = rnd(i * 9 + j) > 0.5 ? 1 : -1, span = x1 - x0 - 120;
          const px = x0 + 60 + ((((rnd(i * 13 + j) * span + dir * t * 38) % span) + span) % span);
          people.push(alien ? <Alien key={j} x={px} y={y + hgt / 2 + 3} s={1.45} color="#DDE6D8" o={kp} /> : <Fig key={j} x={px} y={y + hgt / 2 + 4} s={1.4} color={CREAM} o={kp} />);
        }
        const kr = ramp(t, tPr + i * 0.06, tPr + i * 0.06 + 0.2);
        floors.push(
          <g key={i} opacity={cl(kf * 2)}>
            <rect x={cx - wdt / 2} y={y} width={wdt} height={hgt} fill="#0A0D10" stroke={red ? RED : "rgba(245,237,221,.4)"} strokeWidth={red ? 3 : 2} />
            <rect x={cx - wdt / 2 + 6} y={y + 6} width={Math.max(0, wdt - 12)} height={hgt - 12} fill={red ? `rgba(232,64,58,${0.25 + 0.12 * Math.sin(t * 8)})` : "rgba(255,244,220,.09)"} />
            {kf > 0.95 && Array.from({ length: 11 }, (_, q) => <rect key={q} x={x0 + 30 + q * ((x1 - x0 - 60) / 10) - 9} y={y + 4} width={18} height={3} fill="#FFF6E2" opacity={0.35 + 0.5 * (rnd(q + i * 11 + Math.floor(t * 6) * (q % 3 === 0 ? 1 : 0)) > 0.15 ? 1 : 0.2)} />)}
            {people}
            {kr > 0 && <rect x={cx + 120} y={y + 12} width={150 * kr} height={hgt - 24} fill="#000" />}
            <circle cx={x0 - 44} cy={y + hgt / 2} r={24} fill="rgba(10,8,6,.9)" stroke={red ? RED : CREAM} strokeWidth={3} />
            <text x={x0 - 44} y={y + hgt / 2 + 11} textAnchor="middle" fontFamily={FA_T} fontWeight={900} fontSize={30} fill={red ? RED2 : CREAM}>{fa(i + 1)}</text>
            {red && <text x={x1 + 40} y={y + hgt / 2 + 14} textAnchor="middle" fontFamily={FA_T} fontWeight={900} fontSize={44} fill={RED2}>؟</text>}
          </g>,
        );
      }
      const shaftB = 200 + 6 * 66 + 48;
      const car = 40 + (shaftB - 80) * (0.5 - 0.5 * Math.cos(t * 0.9));
      sc.push(
        <div key="cut" style={{ position: "absolute", left: 0, top, width: W, height: 1400 }}>
          <svg width={W} height={1400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="earth55" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B2A1C" /><stop offset="0.35" stopColor="#21160E" /><stop offset="1" stopColor="#0B0806" /></linearGradient>
              <filter id="rock55"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves={3} seed={5} /><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
            </defs>
            <path d="M0 140 L250 132 Q300 128 330 70 L360 40 L720 36 L760 60 Q790 120 840 128 L1080 136 V1400 H0 Z" fill="url(#earth55)" />
            <path d="M0 140 L250 132 Q300 128 330 70 L360 40 L720 36 L760 60 Q790 120 840 128 L1080 136 V1400 H0 Z" fill="#000" filter="url(#rock55)" />
            {[300, 470, 640, 820].map((yy, i) => <path key={i} d={`M0 ${yy} C200 ${yy - 18} 420 ${yy + 22} 620 ${yy} S940 ${yy - 14} 1080 ${yy + 6}`} fill="none" stroke="rgba(245,237,221,.07)" strokeWidth={3} />)}
            <path d="M0 140 L250 132 Q300 128 330 70 L360 40 L720 36 L760 60 Q790 120 840 128 L1080 136" fill="none" stroke={RED} strokeWidth={4} strokeDasharray="16 9" strokeDashoffset={t * 30} />
            <rect x={527} y={40} width={26} height={(shaftB - 40) * rv} fill="rgba(10,13,16,.95)" stroke="rgba(245,237,221,.35)" strokeWidth={2} />
            <rect x={530} y={car} width={20} height={26} fill={CREAM} opacity={0.85} />
            {floors}
          </svg>
        </div>,
      );
      const kC = ramp(t, tF0, tF0 + 0.2) * (1 - ramp(t, le(2) - 0.1, le(2) + 0.25));
      const seven = ramp(t, tSeven - 0.05, tSeven + 0.15);
      sc.push(
        <Plate key="floors" k={kC} y={300} border={seven > 0 ? "rgba(232,64,58,.85)" : "rgba(245,237,221,.35)"}>
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 96, color: seven > 0 ? RED2 : CREAM, lineHeight: 1.1, transform: `scale(${1 + 0.25 * (seven > 0 && seven < 1 ? 1 - seven : 0)})` }}>{fa(Math.max(1, shown))} طبقه</div>
          <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 32, color: CREAM, opacity: 0.85 }}>زیر زمین</div>
        </Plate>,
      );
      sc.push(<Stamp key="ts" text="فوق‌محرمانه" x={W / 2} y={540} k={ramp(t, Wd(2, "فوق‌محرمانه") - 0.05, Wd(2, "فوق‌محرمانه") + 0.13) * (1 - ramp(t, Wd(2, "جایی"), Wd(2, "جایی") + 0.3))} rot={-7} size={74} />);
    }
  }

  // ============ L3 / L4 start: rewind to the late 70s ============
  {
    const kR = win(t, ls(3) + 0.05, Wd(4, "مردی") + 0.15, 0.25);
    if (kR > 0) {
      const tr = Math.floor(t * 30);
      sc.push(
        <AbsoluteFill key="vhs" style={{ opacity: kR * 0.85, pointerEvents: "none" }}>
          {Array.from({ length: 4 }, (_, i) => {
            const y = ((rnd(i + 3) * H + t * 900 * (1 + i * 0.3)) % (H + 80)) - 40;
            return <div key={i} style={{ position: "absolute", left: 0, top: y, width: W, height: 10 + rnd(i + tr) * 26, background: "rgba(255,255,255,.13)", boxShadow: "0 0 18px rgba(255,255,255,.2)" }} />;
          })}
        </AbsoluteFill>,
      );
      const yr = Math.round(2026 - 47 * eio(lin(t, ls(3) + 0.3, Wd(4, "۱۹۷۰") + 0.25)));
      const done = yr === 1979;
      sc.push(
        <div key="rw" style={{ position: "absolute", left: W / 2, top: 330, transform: "translate(-50%,-50%)", opacity: kR, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "6px 20px 10px", background: "rgba(10,8,6,.8)", border: "2px solid rgba(245,237,221,.4)" }}>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 40, color: CREAM, opacity: done ? 0.4 : Math.sin(t * 12) > 0 ? 1 : 0.4 }}>◀◀</div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: CREAM, letterSpacing: 3 }}>REWIND</div>
          </div>
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 160, color: done ? RED2 : CREAM, lineHeight: 1, textShadow: "0 6px 30px rgba(0,0,0,.8)" }}>{fa(yr)}</div>
          <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 36, color: CREAM, textShadow: SH, opacity: ramp(t, Wd(4, "اواخر"), Wd(4, "اواخر") + 0.3), direction: "rtl" }}>اواخر دهه‌ی ۷۰</div>
        </div>,
      );
    }
  }

  // ============ L4: Paul Bennewitz, strange signals, the air base ============
  {
    const tIn = Wd(4, "مردی") - 0.1, tSig = Wd(4, "سیگنال‌های"), tNear = Wd(4, "نزدیکی");
    const kC = ramp(t, tIn, tIn + 0.45), outC = ramp(t, tSig - 0.05, tSig + 0.35);
    if (kC > 0 && outC < 1) {
      const f1 = "نام: پل بنویتز", f2 = "شهر: آلبوکرکی، نیومکزیکو", f3 = "کار: تجهیزات الکترونیکی";
      const ty: React.CSSProperties = { position: "absolute", right: 380, fontFamily: FA_TY, fontSize: 36, color: INK };
      sc.push(
        <div key="card" style={{ position: "absolute", left: 80, top: 540, width: 920, height: 560, transform: `translateX(${(1 - eout(kC)) * 1200 - eio(outC) * 1300}px) rotate(${-1.2 + (1 - kC) * 6}deg)`, background: `repeating-linear-gradient(0deg, rgba(60,40,20,.05) 0 1px, transparent 1px 46px), ${PAPER}`, boxShadow: "0 30px 70px rgba(0,0,0,.6)", direction: "rtl" }}>
          <div style={{ position: "absolute", right: 34, top: 26, fontFamily: FA_T, fontWeight: 900, fontSize: 44, color: INK }}>پرونده‌ی شخصی</div>
          <div style={{ position: "absolute", left: 34, top: 32, fontFamily: MONO, fontSize: 24, color: "rgba(27,20,13,.6)", direction: "ltr" }}>FILE 01 · 1979</div>
          <div style={{ position: "absolute", right: 34, top: 100, width: 300, height: 380, background: "linear-gradient(180deg,#2b2620,#14110d)", overflow: "hidden", border: "8px solid #f6f1e7", boxShadow: "0 6px 16px rgba(0,0,0,.35)" }}>
            <svg width={284} height={364} viewBox="0 0 284 364"><circle cx={142} cy={140} r={62} fill="#3b342c" /><path d="M30 364 Q36 236 142 224 Q248 236 254 364Z" fill="#3b342c" /><text x={142} y={168} textAnchor="middle" fontFamily={FA_T} fontWeight={900} fontSize={84} fill={RED}>؟</text></svg>
          </div>
          <Typed text={f1} p={typeP(t, Wd(4, "پل") - 0.05, f1, 0.08)} t={t} style={{ ...ty, top: 120 }} />
          <Typed text={f2} p={typeP(t, Wd(4, "بنویتز") + 0.15, f2, 0.06)} t={t} style={{ ...ty, top: 200 }} />
          <Typed text={f3} p={typeP(t, Wd(4, "ادعا"), f3, 0.06)} t={t} style={{ ...ty, top: 280 }} />
          <Redact x={380} y={364} w={300} k={ramp(t, Wd(4, "ادعا") + 0.1, Wd(4, "ادعا") + 0.3)} />
          <Redact x={380} y={420} w={210} k={ramp(t, Wd(4, "ادعا") + 0.2, Wd(4, "ادعا") + 0.4)} />
          <Stamp text="تحت نظر" x={210} y={470} k={ramp(t, Wd(4, "کرد") - 0.05, Wd(4, "کرد") + 0.12)} rot={-7} size={58} paper />
        </div>,
      );
    }
    sc.push(
      <Print key="radio" src="02-radio-room" x={W / 2} y={780} w={960} k={ramp(t, tSig - 0.15, tSig + 0.3)} out={ramp(t, tNear - 0.25, tNear + 0.1)} t={t} rot={1.5} tag="آلبوکرکی ـ ۱۹۷۹">
        <Stamp text="سیگنال ناشناس" x={300} y={120} k={ramp(t, Wd(4, "عجیبی") - 0.05, Wd(4, "عجیبی") + 0.12)} rot={-6} size={54} />
      </Print>,
    );
  }

  // ============ Kirtland AFB + Bennewitz's house (L4 end, L9) ============
  {
    const kB = Math.max(win(t, Wd(4, "نزدیکی") - 0.2, ls(5) + 0.2, 0.3), win(t, ls(9) + 0.7, Wd(9, "اطلاعات") - 0.1, 0.4));
    if (kB > 0 && c.z > 10.5) {
      const kc = P(KAFB), hm = P(HOME);
      ms.push(
        <g key="kafb" opacity={kB}>
          <defs>
            <pattern id="hatch55" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="26" height="26" fill="rgba(232,64,58,.08)" /><line x1="0" y1="0" x2="0" y2="26" stroke="rgba(232,64,58,.35)" strokeWidth="4" />
            </pattern>
          </defs>
          <path d={polyLL(c, KAFB_POLY)} fill="url(#hatch55)" stroke={RED} strokeWidth={4.5} strokeDasharray="20 10" strokeDashoffset={-t * 25} />
          {[0, 1, 2].map((i) => { const u = ((t * 0.8 + i / 3) % 1); return <circle key={i} cx={kc[0]} cy={kc[1]} r={30 + 300 * u} fill="none" stroke={RED2} strokeWidth={4} opacity={(1 - u) * 0.8} />; })}
        </g>,
      );
      mh.push(<div key="kafbL" style={{ position: "absolute", left: kc[0], top: kc[1] + 70, transform: "translate(-50%,-50%)", opacity: kB, display: "flex", alignItems: "center", gap: 14, padding: "8px 22px 12px", background: "rgba(12,9,7,.9)", border: `3px solid ${RED}`, direction: "rtl", whiteSpace: "nowrap" }}>
        <FlagUS w={54} /><div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 38, color: CREAM }}>پایگاه هوایی کرتلند</div>
      </div>);
      const kH = Math.max(ramp(t, Wd(4, "دریافت") - 0.3, Wd(4, "دریافت")) * (1 - ramp(t, ls(5) + 0.0, ls(5) + 0.3)), win(t, Wd(9, "بنویتز") - 0.2, Wd(9, "اطلاعات") - 0.1, 0.3));
      if (kH > 0) {
        // signal pulses travelling from the base to the house
        for (let i = 0; i < 4; i++) {
          const u = (t * 0.9 + i / 4) % 1;
          ms.push(<circle key={"sg" + i} cx={kc[0] + (hm[0] - kc[0]) * u} cy={kc[1] + (hm[1] - kc[1]) * u} r={9} fill={RED2} opacity={kH * (1 - Math.abs(u - 0.5) * 1.4)} />);
        }
        ms.push(<line key="sgl" x1={kc[0]} y1={kc[1]} x2={hm[0]} y2={hm[1]} stroke="rgba(245,237,221,.55)" strokeWidth={3} strokeDasharray="6 10" opacity={kH} />);
        mh.push(<Pin key="home" x={hm[0]} y={hm[1]} k={kH} label="خانه‌ی بنویتز" size={34} stem={44} />);
      }
    }
  }

  // ============ L5: aliens? → Dulce ============
  {
    const tA = ls(5) - 0.1, tOut = Wd(5, "به‌تدریج"), tAl = Wd(5, "موجودات");
    const k = ramp(t, tA, tA + 0.3), out = ramp(t, tOut - 0.1, tOut + 0.25);
    const src = "منبع سیگنال:", alien = t >= tAl - 0.05;
    sc.push(
      <Full key="ufo" src="03-ufo-photo" k={k} out={out} t={t} t0={tA} focus="50% 45%" tag="نیومکزیکو ـ ۱۹۸۰">
        <div style={{ position: "absolute", left: 70, top: 150, width: 940, height: 380, background: "rgba(3,10,6,.9)", border: `2px solid rgba(141,245,180,.55)`, boxShadow: "0 0 40px rgba(141,245,180,.15), 0 20px 50px rgba(0,0,0,.6)", transform: `translateY(${(1 - eout(ramp(t, tA + 0.15, tA + 0.5))) * -40}px)`, opacity: ramp(t, tA + 0.15, tA + 0.4) }}>
          <div style={{ position: "absolute", right: 24, top: 14, fontFamily: FA_TY, fontSize: 30, color: CRT, direction: "rtl" }}>سیگنال رهگیری‌شده</div>
          <div style={{ position: "absolute", left: 24, top: 18, fontFamily: MONO, fontSize: 22, color: CRT, opacity: 0.8 }}>{(1.2 + 0.03 * Math.sin(t * 3)).toFixed(3)} MHz</div>
          <div style={{ position: "absolute", left: 24, top: 70 }}><Wave w={892} h={200} t={t} amp={1} /></div>
          <div style={{ position: "absolute", right: 24, bottom: 18, display: "flex", gap: 14, direction: "rtl", alignItems: "center" }}>
            <div style={{ fontFamily: FA_TY, fontSize: 34, color: CRT }}>{src}</div>
            {alien
              ? <Typed text="موجودات فضایی؟" p={typeP(t, tAl - 0.05, "موجودات فضایی؟", 0.12)} t={t} style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 40, color: RED2 }} />
              : <div style={{ fontFamily: MONO, fontSize: 34, color: CRT, opacity: Math.sin(t * 10) > 0 ? 1 : 0.3 }}>???</div>}
          </div>
        </div>
      </Full>,
    );
    // Albuquerque → Dulce
    const kL = win(t, Wd(5, "نتیجه") - 0.3, ls(6) + 0.2, 0.3);
    if (kL > 0) {
      const a = P(HOME), b = P(DUL);
      const pr = eio(lin(t, Wd(5, "نتیجه"), Wd(5, "دولچه") + 0.1));
      ms.push(
        <g key="route" opacity={kL}>
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(245,237,221,.25)" strokeWidth={3} strokeDasharray="4 12" />
          <line x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * pr} y2={a[1] + (b[1] - a[1]) * pr} stroke={RED2} strokeWidth={6} strokeDasharray="16 10" strokeDashoffset={t * 40} />
          <circle cx={a[0]} cy={a[1]} r={12} fill={CREAM} stroke="#000" strokeWidth={3} />
        </g>,
      );
      mh.push(<div key="abqL" style={{ position: "absolute", left: a[0] + 24, top: a[1], transform: "translate(0,-50%)", opacity: kL, fontFamily: FA_UI, fontWeight: 900, fontSize: 36, color: CREAM, textShadow: SH, whiteSpace: "nowrap" }}>آلبوکرکی</div>);
      const kD = ramp(t, Wd(5, "دولچه") - 0.15, Wd(5, "دولچه") + 0.2) * kL;
      if (kD > 0) {
        const pu = (t * 1.3) % 1;
        ms.push(<g key="dd" opacity={kD}><circle cx={b[0]} cy={b[1]} r={16 + 60 * pu} fill="none" stroke={RED} strokeWidth={5} opacity={1 - pu} /><circle cx={b[0]} cy={b[1]} r={14} fill={RED} stroke="#000" strokeWidth={3} /></g>);
        sc.push(<Chip key="ddL" x={b[0]} y={b[1] - 80} k={kD} size={38} color={RED2} border={RED}>پایگاه مخفی زیرزمینی؟</Chip>);
      }
    }
  }

  // ============ L6: just the beginning ============
  {
    const tA = ls(6) - 0.1;
    sc.push(
      <Full key="mesa" src="01-mesa-lights" k={ramp(t, tA, tA + 0.25)} out={ramp(t, le(6) + 0.1, ls(7) + 0.3)} t={t} t0={tA} focus="50% 40%" tag="آرچولتا مسا ـ شب">
        <Stamp text="تازه شروع ماجرا" x={W / 2} y={330} k={ramp(t, Wd(6, "شروع") - 0.05, Wd(6, "شروع") + 0.12)} rot={-6} size={78} />
      </Full>,
    );
  }

  // ============ L7: rumours, genetic labs, hybrids ============
  {
    const tR = Wd(7, "شایعاتی") - 0.15, tLab = Wd(7, "آزمایش‌های") - 0.25, tHy = Wd(7, "موجودات") - 0.2;
    const outR = ramp(t, tLab - 0.1, tLab + 0.2);
    if (t > tR - 0.2 && outR < 1) {
      const heads = ["گزارش تأییدنشده", "شاهد ناشناس", "پایگاه زیر کوه", "نامه‌ی بی‌امضا", "پرونده‌ی گمشده"];
      heads.forEach((hd, i) => {
        const kk = ramp(t, tR + i * 0.16, tR + i * 0.16 + 0.3);
        if (kk <= 0) return;
        const x = 120 + rnd(i + 40) * 380, y = 360 + i * 120 + rnd(i + 50) * 50, rot = (rnd(i + 60) - 0.5) * 22;
        sc.push(
          <div key={"rm" + i} style={{ position: "absolute", left: x, top: y, width: 560, height: 360, transform: `translate(${(1 - eout(kk)) * (i % 2 ? 900 : -900)}px, ${eio(outR) * 1500}px) rotate(${rot + (1 - kk) * 30}deg)`, background: `repeating-linear-gradient(0deg, rgba(60,40,20,.05) 0 1px, transparent 1px 40px), ${i % 2 ? PAPER : "#E6DCC3"}`, boxShadow: "0 18px 40px rgba(0,0,0,.55)", direction: "rtl" }}>
            <div style={{ position: "absolute", right: 26, top: 22, fontFamily: FA_T, fontWeight: 900, fontSize: 38, color: INK, whiteSpace: "nowrap" }}>{hd}</div>
            {[0, 1, 2, 3].map((q) => <div key={q} style={{ position: "absolute", right: 26, top: 96 + q * 56, width: 380 - rnd(i * 4 + q) * 160, height: 24, background: q === 1 || q === 3 ? "#0B0908" : "rgba(27,20,13,.25)" }} />)}
          </div>,
        );
      });
      sc.push(<Stamp key="rumor" text="شایعه" x={W / 2} y={330} k={ramp(t, Wd(7, "منتشر") - 0.05, Wd(7, "منتشر") + 0.12) * (1 - outR)} rot={-8} size={110} />);
    }
    sc.push(
      <Full key="lab" src="04-lab" k={ramp(t, tLab, tLab + 0.25)} out={ramp(t, tHy - 0.05, tHy + 0.15)} t={t} t0={tLab} tag="طبقه‌ی ۶ ـ آزمایشگاه ژنتیک">
        <div style={{ position: "absolute", left: W / 2, top: 300, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: ramp(t, tLab + 0.2, tLab + 0.5) }}>
          <Helix w={520} h={110} t={t} p={eout(lin(t, tLab + 0.2, tLab + 0.9))} />
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 64, color: CREAM, textShadow: SH, direction: "rtl", whiteSpace: "nowrap" }}>آزمایش روی <span style={{ color: RED2 }}>انسان</span></div>
        </div>
      </Full>,
    );
    sc.push(
      <Full key="hyb" src="05-hybrid-tank" k={ramp(t, tHy, tHy + 0.25)} out={ramp(t, le(7) + 0.05, ls(8) + 0.3)} t={t} t0={tHy} tag="طبقه‌ی ۶ ـ «تالار کابوس»">
        <div style={{ position: "absolute", left: W / 2, top: 290, transform: "translate(-50%,-50%)", textAlign: "center", direction: "rtl", opacity: ramp(t, tHy + 0.15, tHy + 0.45) }}>
          <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 70, color: CREAM, textShadow: SH, whiteSpace: "nowrap" }}>انسان <span style={{ color: RED2 }}>+</span> حیوان</div>
        </div>
        <Stamp text="ادعا" x={810} y={470} k={ramp(t, Wd(7, "حیوان") - 0.05, Wd(7, "حیوان") + 0.12)} rot={-10} size={80} />
      </Full>,
    );
  }

  // ============ L8: the Dulce War ============
  {
    const tF = Wd(8, "درگیری") - 0.25, tM = Wd(8, "مسلحانه"), tOut = Wd(8, "اتفاقی") - 0.05;
    const shake = 10 * Math.max(0, 1 - lin(t, tM, tM + 0.7)) * (t > tM ? 1 : 0);
    sc.push(
      <Print key="fight" src="06-tunnel-fight" x={W / 2} y={790} w={980} k={ramp(t, tF, tF + 0.4)} out={ramp(t, tOut, tOut + 0.35)} t={t} rot={-1.5} tag="روایت شاهدان ـ تونل‌های زیر مسا" shake={shake}>
        <div style={{ position: "absolute", inset: 0, background: `rgba(232,40,30,${0.22 * Math.max(0, Math.sin(t * 9)) * win(t, tM, tOut, 0.2)})`, mixBlendMode: "screen" }} />
      </Print>,
    );
    const kY = ramp(t, Wd(8, "۱۹۷۹") - 0.25, Wd(8, "۱۹۷۹") + 0.05) * (1 - ramp(t, tOut + 0.1, tOut + 0.4));
    if (kY > 0) sc.push(<div key="y79" style={{ position: "absolute", left: W / 2, top: 290, transform: `translate(-50%,-50%) scale(${1 + 0.4 * (1 - eout(kY))})`, opacity: kY, fontFamily: FA_T, fontWeight: 900, fontSize: 170, color: RED2, lineHeight: 1, textShadow: "0 0 40px rgba(232,64,58,.5), 0 8px 30px rgba(0,0,0,.8)" }}>۱۹۷۹</div>);
    const tW = Wd(8, "جنگ") - 0.2;
    const kW = ramp(t, tW, tW + 0.3) * (1 - ramp(t, ls(9) + 0.1, ls(9) + 0.4));
    sc.push(
      <Plate key="war" k={kW} y={330} border="rgba(232,64,58,.9)" pad="14px 56px 22px">
        <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 112, color: RED2, lineHeight: 1.15, whiteSpace: "nowrap", transform: `scale(${1 + 0.2 * (1 - eout(kW))})` }}>جنگ دولچه</div>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 28, color: CREAM, letterSpacing: 6, direction: "ltr" }}>THE DULCE WAR · 1979</div>
      </Plate>,
    );
    const kX = win(t, tOut, ls(9) + 0.5, 0.3);
    if (kX > 0) {
      const m = P(MESA);
      for (let i = 0; i < 6; i++) {
        const u = (t * 0.9 + i / 6) % 1, a = rnd(i + 80) * Math.PI * 2, r = 60 + rnd(i + 90) * 140;
        ms.push(<circle key={"bx" + i} cx={m[0] + Math.cos(a) * r} cy={m[1] + Math.sin(a) * r} r={14 + 110 * u} fill="none" stroke={RED2} strokeWidth={5} opacity={kX * (1 - u)} />);
      }
      ms.push(<circle key="bglow" cx={m[0]} cy={m[1]} r={260} fill="url(#rg55)" opacity={kX * (0.7 + 0.3 * Math.sin(t * 7))} />);
      ms.push(<defs key="rgd"><radialGradient id="rg55"><stop offset="0" stopColor="rgba(255,60,50,.6)" /><stop offset="1" stopColor="rgba(255,60,50,0)" /></radialGradient></defs>);
    }
  }

  // ============ L9: the twist — AFOSI disinformation ============
  {
    const tA = Wd(9, "مشخص") - 0.2, tInfo = Wd(9, "اطلاعات");
    const k = ramp(t, tA, tA + 0.45), out = ramp(t, tInfo - 0.45, tInfo - 0.05);
    if (k > 0 && out < 1) {
      const tRev = Wd(9, "ضد‌اطلاعات") - 0.1;
      const ty: React.CSSProperties = { position: "absolute", right: 44, fontFamily: FA_TY, fontSize: 34, color: INK };
      sc.push(
        <div key="doc" style={{ position: "absolute", left: 70, top: 470, width: 940, height: 700, transform: `translateY(${(1 - eout(k)) * 1400 + eio(out) * -1500}px) rotate(${-1 + (1 - k) * 6}deg)`, background: `repeating-linear-gradient(0deg, rgba(60,40,20,.05) 0 1px, transparent 1px 48px), ${PAPER}`, boxShadow: "0 30px 70px rgba(0,0,0,.6)", direction: "rtl" }}>
          <div style={{ position: "absolute", right: 44, top: 28, fontFamily: FA_T, fontWeight: 900, fontSize: 46, color: INK }}>سند طبقه‌بندی‌شده</div>
          <div style={{ position: "absolute", left: 40, top: 36, fontFamily: MONO, fontSize: 22, color: "rgba(27,20,13,.6)", direction: "ltr" }}>DECLASSIFIED</div>
          <Typed text="موضوع: پل بنویتز" p={typeP(t, Wd(9, "بنویتز") - 0.1, "موضوع: پل بنویتز", 0.08)} t={t} style={{ ...ty, top: 130 }} />
          <div style={{ ...ty, top: 210 }}>منبع اطلاعات او:</div>
          <div style={{ position: "absolute", right: 44, top: 270, opacity: ramp(t, tRev + 0.1, tRev + 0.4), direction: "rtl" }}>
            <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 40, color: RED }}>ضدّاطلاعات نیروی هوایی آمریکا</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: INK, direction: "ltr", textAlign: "right", letterSpacing: 4 }}>AFOSI · KIRTLAND AFB</div>
          </div>
          <Redact x={44} y={276} w={640} h={92} lift={lin(t, tRev, tRev + 0.45)} />
          {[0, 1, 2].map((q) => <Redact key={q} x={44} y={420 + q * 60} w={720 - q * 140} />)}
          <Stamp text="از طبقه‌بندی خارج شد" x={300} y={630} k={ramp(t, tA + 0.5, tA + 0.65)} rot={-5} size={44} paper />
        </div>,
      );
    }
    sc.push(
      <Print key="hand" src="07-handoff" x={W / 2} y={770} w={960} k={ramp(t, tInfo - 0.4, tInfo)} out={ramp(t, le(9) + 0.05, ls(10) + 0.4)} t={t} rot={1.8} tag="اطلاعاتی که به بنویتز داده شد">
        <Stamp text="گمراه‌کننده" x={330} y={130} k={ramp(t, Wd(9, "گمراه‌کننده‌ای") - 0.05, Wd(9, "گمراه‌کننده‌ای") + 0.12)} rot={-7} size={74} />
      </Print>,
    );
  }

  // ============ L10: the deception — red string, a stolen gaze ============
  {
    const kA = win(t, ls(10) + 0.7, ls(11) + 0.1, 0.35);
    if (kA > 0 && c.z < 10.5) {
      const hm = P(HOME), dl = P(DUL);
      const tgt1: Pt = [hm[0] + 250, hm[1] - 50];
      const sw = eio(lin(t, Wd(10, "منحرف") - 0.1, Wd(10, "توجه") + 0.25));
      const a1 = Math.atan2(tgt1[1] - hm[1], tgt1[0] - hm[0]), a2 = Math.atan2(dl[1] - hm[1], dl[0] - hm[0]);
      const ang = a1 + (a2 - a1) * sw, len = 250 + (Math.hypot(dl[0] - hm[0], dl[1] - hm[1]) - 290) * sw, sp2 = 0.22;
      ms.push(
        <path key="gaze" d={`M${hm[0]} ${hm[1]} L${hm[0] + Math.cos(ang - sp2) * len} ${hm[1] + Math.sin(ang - sp2) * len} A${len} ${len} 0 0 1 ${hm[0] + Math.cos(ang + sp2) * len} ${hm[1] + Math.sin(ang + sp2) * len} Z`}
          fill="rgba(245,237,221,.16)" stroke="rgba(245,237,221,.45)" strokeWidth={2} opacity={kA * ramp(t, ls(10) + 0.9, ls(10) + 1.3)} />,
      );
      // red string Bennewitz → Dulce
      const sg = eout(lin(t, Wd(10, "داستان") - 0.1, Wd(10, "داستان") + 0.6));
      if (sg > 0) {
        const mx = (hm[0] + dl[0]) / 2 + 60, my = (hm[1] + dl[1]) / 2 + 30;
        ms.push(<path key="str" d={`M${hm[0]} ${hm[1]} Q${mx} ${my} ${dl[0]} ${dl[1]}`} fill="none" stroke={RED} strokeWidth={5} pathLength={1} strokeDasharray={`${sg} 2`} opacity={kA} />);
      }
      mh.push(<Pin key="pB" x={hm[0]} y={hm[1]} k={kA} label="بنویتز" size={36} stem={40} />);
      mh.push(<Pin key="pD" x={dl[0]} y={dl[1]} k={ramp(t, Wd(10, "داستان") - 0.2, Wd(10, "داستان") + 0.2) * kA} label="داستان دولچه" color={RED2} size={38} stem={44} />);
      const kK = ramp(t, ls(10) + 1.0, ls(10) + 1.4) * kA, hot = ramp(t, Wd(10, "پروژه‌های") - 0.1, Wd(10, "پروژه‌های") + 0.2);
      if (kK > 0) mh.push(
        <div key="real" style={{ position: "absolute", left: tgt1[0], top: tgt1[1], transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * kK + 0.08 * hot * Math.max(0, Math.sin(t * 6))})`, opacity: kK, padding: "10px 22px 14px", background: "rgba(12,9,7,.92)", border: `3px solid ${hot > 0.5 ? RED : "rgba(245,237,221,.6)"}`, boxShadow: hot > 0.5 ? "0 0 30px rgba(232,64,58,.5)" : "0 10px 24px rgba(0,0,0,.6)", direction: "rtl", textAlign: "center" }}>
          <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 32, color: hot > 0.5 ? RED2 : CREAM, whiteSpace: "nowrap" }}>پایگاه کرتلند</div>
          <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 24, color: CREAM, opacity: 0.85, whiteSpace: "nowrap" }}>پروژه‌های محرمانه‌ی واقعی</div>
        </div>,
      );
      sc.push(<Stamp key="op" text="عملیات فریب" x={290} y={880}k={ramp(t, Wd(10, "فریب") - 0.05, Wd(10, "فریب") + 0.12) * kA} rot={-6} size={86} />);
    }
  }

  // ============ L11–L13: the question, two answers, comment ============
  {
    const kQ = ramp(t, ls(11) - 0.05, ls(11) + 0.1) * (1 - ramp(t, Wd(12, "ساختگیه") - 0.5, Wd(12, "ساختگیه") - 0.2));
    if (kQ > 0) sc.push(<div key="q" style={{ position: "absolute", left: W / 2, top: 820, transform: `translate(-50%,-50%) scale(${1 + 0.9 * (1 - eout(kQ))})`, opacity: cl(kQ * 2), fontFamily: FA_T, fontWeight: 900, fontSize: 520, color: RED, lineHeight: 1, textShadow: "0 0 60px rgba(232,64,58,.55), 0 10px 40px rgba(0,0,0,.8)" }}>؟</div>);
    const shrink = ramp(t, ls(13) - 0.1, ls(13) + 0.4), gone = ramp(t, le(13) + 0.4, le(13) + 0.9);
    const card = (key: string, x: number, kk: number, title: string, sub: string, img: React.ReactNode) =>
      kk <= 0.01 || gone >= 1 ? null : (
        <div key={key} style={{ position: "absolute", left: x - 235, top: 470 - 140 * shrink, width: 470, height: 680, opacity: cl(kk * 2) * (1 - gone), transform: `translateY(${(1 - eout(kk)) * 120}px) scale(${(0.9 + 0.1 * back(cl(kk))) * (1 - 0.18 * shrink)}) rotate(${x > W / 2 ? 1.5 : -1.5}deg)`, background: "#F4EFE6", padding: 14, boxSizing: "border-box", boxShadow: "0 26px 60px rgba(0,0,0,.6)" }}>
          <div style={{ width: "100%", height: 470, overflow: "hidden", position: "relative", background: "#14100c" }}>{img}</div>
          <div style={{ textAlign: "center", direction: "rtl", fontFamily: FA_T, fontWeight: 900, fontSize: 62, color: INK, lineHeight: 1.25, marginTop: 14, whiteSpace: "nowrap" }}>{title}</div>
          <div style={{ textAlign: "center", direction: "rtl", fontFamily: FA_UI, fontWeight: 700, fontSize: 30, color: "rgba(27,20,13,.75)" }}>{sub}</div>
        </div>
      );
    const lv = TL.dulce, cxp = ((wx(MESA[0]) * 2 ** 14 - lv.x0 * 256) / (lv.cols * 256)) * 100, cyp = ((wy(MESA[1]) * 2 ** 14 - lv.y0 * 256) / (lv.rows * 256)) * 100;
    const tF = Wd(12, "ساختگیه"), tR = Wd(12, "واقعیت‌های");
    sc.push(card("c1", 790, ramp(t, tF - 0.35, tF + 0.1), "داستان ساختگی", "فقط یه کوه معمولی؟",
      <>
        <div style={{ position: "absolute", inset: 0, background: `url(${staticFile("v55/dulce.jpg")}) ${cxp}% ${cyp}% / 300% auto no-repeat`, transform: `scale(${1 + 0.04 * Math.sin(t * 0.6)})`, filter: "saturate(.8) brightness(.9)" }} />
        <Stamp text="جعلی؟" x={221} y={235} k={ramp(t, tF + 0.1, tF + 0.25)} rot={-10} size={66} />
      </>));
    sc.push(card("c2", 290, ramp(t, tR - 0.3, tR + 0.15), "واقعیت پنهان", "هنوز از چشم ما دور؟",
      hasImg("08-blast-door") ? <Img src={imgUrl("08-blast-door")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 55%", transform: `scale(${1.04 + 0.03 * Math.sin(t * 0.6)})` }} /> : <Placeholder src="08-blast-door" size={22} />));
    const kO = ramp(t, Wd(12, "یا") - 0.1, Wd(12, "یا") + 0.15) * (1 - gone);
    if (kO > 0 && t > tF) sc.push(<div key="or" style={{ position: "absolute", left: W / 2 - 60, top: 750 - 160 * shrink, width: 120, height: 120, borderRadius: 60, background: RED, border: `5px solid ${CREAM}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FA_T, fontWeight: 900, fontSize: 56, color: CREAM, transform: `scale(${back(cl(kO)) * (1 - 0.18 * shrink)})`, boxShadow: "0 10px 30px rgba(0,0,0,.6)" }}>یا</div>);
    const kC = ramp(t, ls(13) - 0.1, ls(13) + 0.35);
    if (kC > 0) {
      const msg = "ساختگی یا واقعی؟ نظرت چیه…";
      const heart = ramp(t, Wd(13, "بنویسید"), Wd(13, "بنویسید") + 0.2);
      sc.push(
        <div key="cm" style={{ position: "absolute", left: 70, top: 1150, width: 940, height: 124, transform: `translateY(${(1 - eout(kC)) * 300}px)`, opacity: cl(kC * 2), background: "rgba(18,16,15,.94)", borderRadius: 62, border: "2px solid rgba(245,237,221,.35)", display: "flex", alignItems: "center", padding: "0 26px", gap: 22, direction: "rtl", boxShadow: "0 20px 50px rgba(0,0,0,.6)" }}>
          <div style={{ width: 78, height: 78, borderRadius: 39, background: `linear-gradient(135deg, ${RED}, #F2A65A)`, flexShrink: 0 }} />
          <Typed text={msg} p={typeP(t, ls(13), msg, 0.12)} t={t} style={{ flex: 1, fontFamily: FA_UI, fontWeight: 700, fontSize: 40, color: CREAM }} />
          <div style={{ fontSize: 56, color: RED2, transform: `scale(${1 + 0.6 * Math.sin(Math.PI * heart)})`, opacity: 0.4 + 0.6 * heart }}>♥</div>
        </div>,
      );
    }
  }

  // ============ HUD: logo, section tag ============
  const SECT: [number, string][] = [[ls(1) - 0.1, "پایگاه دولچه"], [ls(3) - 0.1, "شروع ماجرا"], [ls(7) - 0.1, "شایعات"], [ls(9) - 0.1, "حقیقت؟"], [ls(11) - 0.1, "سؤال"]];
  let si = -1;
  SECT.forEach(([t0], i) => { if (t >= t0) si = i; });
  const sk = si >= 0 ? ramp(t, SECT[si][0], SECT[si][0] + 0.35) : 0;
  const jx = g > 0 ? (rnd(Math.floor(t * 30)) - 0.5) * 60 * g : 0;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #13243C 0%, #070C16 70%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: g > 0 ? `translateX(${jx}px)` : undefined }}>
        {tileA < 1 && <Sky t={t} c={c} />}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: tileA, background: OCEAN }}>
          <Tiles c={c} night={night} />
          <AbsoluteFill style={{ background: `rgba(4,16,30,${0.38 * night})`, mixBlendMode: "multiply" }} />
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>{ms}</svg>
          {mh}
          <AbsoluteFill style={{ background: `rgba(6,8,12,${dim})` }} />
        </div>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.5) 80%, rgba(0,0,0,.62) 100%)" }} />
        {sc}
      </AbsoluteFill>
      <GlitchBars t={t} g={g} />
      <Img src={staticFile("v55/logo.png")} style={{ position: "absolute", left: 44, top: 70, width: 92, opacity: 0.5 }} />
      {si >= 0 && (
        <div style={{ position: "absolute", right: 44, top: 86, display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 12px", background: "rgba(10,8,6,.78)", borderRight: `5px solid ${RED}`, direction: "rtl", opacity: sk, transform: `translateX(${(1 - sk) * 40}px)` }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: RED, opacity: Math.sin(t * 6) > 0 ? 1 : 0.3 }} />
          <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 30, color: CREAM, whiteSpace: "nowrap" }}>{SECT[si][1]}</div>
        </div>
      )}
      <Captions t={t} />
      {/* scanlines + grain: the "leaked tape" feel */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 2px, transparent 2px 5px)", opacity: 0.35, pointerEvents: "none" }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
        <filter id="gr55"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(t * 15) % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width={W} height={H} filter="url(#gr55)" />
      </svg>
      {!silent && <Html5Audio src={staticFile(AUDIO)} />}
    </AbsoluteFill>
  );
};

// ---------- stills for checking (one frame per moment) ----------
export const LOOK_T = [0.05, 1.0, 1.8, 2.6, 3.4, 4.2, 6.0, 8.3, 11.2, 13.3, 14.0, 15.4, 16.6, 18.9, 20.6, 22.6, 24.6, 26.0, 28.4, 30.6, 33.6, 37.6, 40.9, 42.9, 45.2, 48.2, 52.5, 56.0, 58.4, 60.7, 63.0, 65.0, 66.9, 70.8, 74.3, 76.7, 80.4, 83.2, 85.6, 87.3];
export const V55Look: React.FC = () => {
  const f = useCurrentFrame();
  return <V55 silent at={Math.round(LOOK_T[Math.min(f, LOOK_T.length - 1)] * V55_FPS)} />;
};
