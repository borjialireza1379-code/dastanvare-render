// v45 · نبرد گوگمل (Gaugamela, 331 BC) · vertical Agarology short, same look/engine as v44.
// Built by videos/45/assemble.mjs from the v44 helpers + videos/45/body.tsx.txt (edit those, then re-run).
// Map: EOX Sentinel-2 cloudless 2016 (CC BY 4.0), three levels (videos/45/get-tiles.mjs). Battle layout is a reconstruction.
// Timing: src/v45/vo.json, built from the user's narration by videos/45/build-vo.mjs.
import React from "react";
import { AbsoluteFill, Html5Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import tiles from "./tiles.json";
import vo from "./vo.json";

export const V45_FPS = 30;
type Word = { w: string; s: number; e: number };
type Line = { n: number; s: number; e: number; words?: Word[] };
const LINES = (vo as { lines: Line[] }).lines;
const TOTAL = (vo as { total: number }).total;
export const V45_FRAMES = Math.ceil((TOTAL + 1.2) * V45_FPS);
const W = 1080, H = 1920;

// ---------- fonts (same as v35) ----------
const FA_T = "Estedad", FA_UI = "Vazirmatn";
if (typeof window !== "undefined") {
  const h = delayRender("v45 fonts");
  Promise.all(
    ([
      [FA_UI, "fonts/Vazirmatn-Regular.ttf", { weight: "400" }],
      [FA_UI, "fonts/Vazirmatn-Bold.ttf", { weight: "700" }],
      [FA_UI, "fonts/Vazirmatn-Black.ttf", { weight: "900" }],
      [FA_T, "fonts/Estedad-Black.woff2", { weight: "900" }],
    ] as [string, string, FontFaceDescriptors][]).map(([f, u, d]) => new FontFace(f, `url('${staticFile(u)}')`, d).load().then((ff) => document.fonts.add(ff))),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}

// photo cards the user makes with ChatGPT (public/v45/img/); false = placeholder mount
export const IMG: Record<string, boolean> = { "01-alexander": true, "02-darius": true, "03-chariots": true, "04-oblique": true, "05-wedge": true, "06-darius-leaves": true };
// where the face is in each 16:9 picture (portrait cards crop to it)
const FOCUS: Record<string, string> = { "01-alexander": "49% 22%", "02-darius": "50% 30%", "06-darius-leaves": "38% 25%" };

// ---------- palette (v35) ----------
const GOLD = "#F2C46E", GOLD2 = "#E8B04B", CREAM = "#FBEBCB", WINE = "#C25A6A",RED = "#D9543A", INK = "#120B07";
const SH = "0 2px 10px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.95)";

// ---------- helpers ----------
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const eout = (x: number) => 1 - (1 - x) ** 3;
const back = (x: number) => { const c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const ramp = (t: number, a: number, b: number) => eout(lin(t, a, b));
const win = (t: number, a: number, b: number, f = 0.3) => Math.min(ramp(t, a, a + f), 1 - eio(lin(t, b - f, b)));
const fa = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const faNum = (n: number) => fa(Math.round(n).toLocaleString("en-US").replace(/,/g, "٬"));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const L = (i: number) => LINES[i];
const Wd = (i: number, word: string, frac = 0) => {
  const w = L(i).words?.find((x) => x.w.includes(word));
  return w ? w.s : L(i).s + (L(i).e - L(i).s) * frac;
};

// ---------- web mercator ----------
const wx = (lon: number) => ((lon + 180) / 360) * 256;
const wy = (lat: number) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 256; };
type Cam = { lon: number; lat: number; z: number };
type Pt = [number, number];
const toScreen = (c: Cam, lon: number, lat: number): Pt => {
  const k = 2 ** c.z;
  return [(wx(lon) - wx(c.lon)) * k + W / 2, (wy(lat) - wy(c.lat)) * k + H / 2];
};
// battle space: px at zoom 11 around the (approximate) battlefield, Navkur / Nineveh plains
const BC = { lon: 43.4, lat: 36.45 };
const bs = (c: Cam, x: number, y: number): Pt => {
  const [cx, cy] = toScreen(c, BC.lon, BC.lat), k = 2 ** (c.z - 11);
  return [cx + x * k, cy + y * k];
};
const P = {
  pella: [22.52, 40.76], persepolis: [52.89, 29.93], gaug: [43.4, 36.45], nineveh: [43.15, 36.36], arbela: [44.01, 36.19],
  tigris: [42.95, 35.9], babylon: [44.42, 32.54], susa: [48.25, 32.19],
} as const;

// ---------- camera ----------
function camKeys(): [number, number, number, number][] {
  const l = LINES, g = Wd(1, "گوگمل", 0.5), ch = Wd(6, "چند", 0.5);
  return [
    [0, 43.4, 36.45, 11.0],
    [l[0].e, 43.4, 36.45, 11.2],
    [l[1].s + 1.0, 37.4, 35.5, 5.35],
    [g - 0.3, 37.9, 35.6, 5.5],
    [g + 1.3, 43.5, 36.2, 8.4],
    [l[1].e, 43.5, 36.25, 8.6],
    [l[2].s + 1.2, 43.4, 36.45, 11.0],
    [l[3].e, 43.41, 36.45, 11.1],
    [l[5].e, 43.4, 36.46, 11.15],
    [ch - 0.4, 43.39, 36.48, 10.9],
    [ch + 1.1, 48.2, 33.0, 6.9],
    [TOTAL + 2, 48.2, 33.0, 7.05],
  ];
}
function camAt(t: number): Cam {
  const K = camKeys();
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const [t0, a0, b0, z0] = K[i], [t1, a1, b1, z1] = K[i + 1];
  const p = eio(lin(t, t0, t1));
  const x = wx(a0) + (wx(a1) - wx(a0)) * p, y = wy(b0) + (wy(b1) - wy(b0)) * p;
  const lon = (x / 256) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 256))) * 180) / Math.PI;
  const z = z0 + (z1 - z0) * p;
  return { lon: lon + Math.sin(t * 0.35) * 0.0009 * 2 ** (11 - z), lat: lat + Math.cos(t * 0.3) * 0.0006 * 2 ** (11 - z), z: z + 0.012 * Math.sin(t * 0.5) };
}

// ---------- map ----------
const MapBg: React.FC<{ c: Cam; dim: number }> = ({ c, dim }) => {
  const lv = [["wide", 1], ["region", ramp(c.z, 6.4, 7.3)], ["battle", ramp(c.z, 9.5, 10.3)]] as const;
  return (
    <AbsoluteFill style={{ background: "#c8b48c", overflow: "hidden" }}>
      {lv.map(([name, o]) => {
        const m = (tiles as Record<string, { z: number; x0: number; y0: number; cols: number; rows: number }>)[name];
        if (o <= 0) return null;
        const k = 2 ** (c.z - m.z);
        return (
          <Img key={name} src={staticFile(`v45/${name}.jpg`)}
            style={{ position: "absolute", left: (m.x0 * 256 - wx(c.lon) * 2 ** m.z) * k + W / 2, top: (m.y0 * 256 - wy(c.lat) * 2 ** m.z) * k + H / 2, width: m.cols * 256 * k, height: m.rows * 256 * k, maxWidth: "none", opacity: o,
              filter: name === "battle" ? "saturate(0.55) sepia(0.28) contrast(1.06) brightness(0.8)" : "saturate(0.92) sepia(0.18) contrast(1.06) brightness(0.8)" }} />
        );
      })}
      {/* warm edge, light — keeps the satellite bright but ties it to the gold/umber palette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(40,22,8,.42) 100%)" }} />
      <AbsoluteFill style={{ background: `rgba(14,8,5,${dim})` }} />
    </AbsoluteFill>
  );
};

// ---------- Agarology pieces ----------
const Label: React.FC<{ p: Pt; text: string; k: number; size?: number; color?: string; dy?: number; sub?: string }> = ({ p, text, k, size = 36, color = CREAM, dy = -40, sub }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: p[0], top: p[1] + dy, transform: `translate(-50%,-50%) translateY(${(1 - k) * 10}px)`, opacity: k, direction: "rtl", textAlign: "center", whiteSpace: "nowrap", fontFamily: FA_UI, fontWeight: 900, fontSize: size, color, textShadow: SH, lineHeight: 1.15 }}>
      {text}
      {sub && <div style={{ fontSize: size * 0.6, fontWeight: 700, opacity: 0.9 }}>{sub}</div>}
    </div>
  );

const Dot: React.FC<{ p: Pt; k: number; color?: string; r?: number; pulse?: number }> = ({ p, k, color = GOLD, r = 11, pulse = 0 }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: p[0], top: p[1] }}>
      {pulse > 0 && pulse < 1 && <div style={{ position: "absolute", left: -r * (1 + 2.5 * pulse), top: -r * (1 + 2.5 * pulse), width: r * 2 * (1 + 2.5 * pulse), height: r * 2 * (1 + 2.5 * pulse), borderRadius: "50%", border: `3px solid ${color}`, opacity: (1 - pulse) * k }} />}
      <div style={{ position: "absolute", left: -r * k, top: -r * k, width: r * 2 * k, height: r * 2 * k, borderRadius: "50%", background: color, boxShadow: `0 0 ${14 * k}px ${color}, 0 0 0 3px rgba(0,0,0,.6)` }} />
    </div>
  );

const Chip: React.FC<{ x: number; y: number; k: number; children: React.ReactNode; size?: number; color?: string; border?: string }> = ({ x, y, k, children, size = 34, color = CREAM, border = GOLD2 }) =>
  k <= 0.01 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${(1 - k) * 12}px)`, opacity: k, padding: `${size * 0.2}px ${size * 0.6}px ${size * 0.3}px`, background: "rgba(16,10,6,.9)", border: `2px solid ${border}`, color, fontFamily: FA_UI, fontWeight: 700, fontSize: size, direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 8px 22px rgba(0,0,0,.55)" }}>
      {children}
    </div>
  );

// title card on top of the frame: dark panel, gold frame, Estedad
const Card: React.FC<{ k: number; text: string; sub?: string; tone?: "gold" | "red" | "cream"; y?: number; size?: number }> = ({ k, text, sub, tone = "gold", y = 330, size = 84 }) => {
  if (k <= 0.01) return null;
  const col = tone === "red" ? "#F08A6A" : tone === "cream" ? CREAM : GOLD;
  return (
    <div style={{ position: "absolute", left: W / 2, top: y, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * back(cl(k))})`, opacity: cl(k * 1.4), padding: "22px 54px 30px", background: "linear-gradient(180deg, rgba(26,16,10,.94), rgba(14,8,5,.94))", border: `2px solid ${GOLD2}`, outline: "1px solid rgba(232,176,75,.35)", outlineOffset: 7, boxShadow: "0 24px 60px rgba(0,0,0,.6)", direction: "rtl", textAlign: "center" }}>
      <div style={{ fontFamily: FA_T, fontSize: size, color: col, lineHeight: 1.25, whiteSpace: "nowrap" }}>{text}</div>
      {sub && <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: size * 0.36, color: CREAM, opacity: 0.88, marginTop: 4, whiteSpace: "nowrap" }}>{sub}</div>}
    </div>
  );
};

// photo pinned to a map point: cream mount, slow push-in, dashed leader line
const Photo: React.FC<{ src: string; c: Pt; w: number; k: number; t: number; anchor?: Pt; ar?: number; caption?: string; gray?: number; rot?: number }> = ({ src, c, w, k, t, anchor, ar = 16 / 9, caption, gray = 0, rot = 0 }) => {
  if (k <= 0.01) return null;
  const h = w / ar, has = IMG[src];
  return (
    <>
      {anchor && (
        <svg style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "visible", opacity: k }}>
          <line x1={anchor[0]} y1={anchor[1]} x2={c[0]} y2={c[1]} stroke="rgba(242,196,110,.9)" strokeWidth={2.5} strokeDasharray="6 6" />
          <circle cx={anchor[0]} cy={anchor[1]} r={7} fill={GOLD} stroke="#000" strokeWidth={2} />
        </svg>
      )}
      <div style={{ position: "absolute", left: c[0] - w / 2, top: c[1] - h / 2, width: w, height: h, opacity: k, transform: `translateY(${(1 - k) * 30}px) scale(${0.92 + 0.08 * k}) rotate(${rot}deg)`, padding: 10, boxSizing: "border-box", background: "#efe0bf", border: "2px solid #b8945a", boxShadow: "0 18px 40px rgba(0,0,0,.6), 0 2px 6px rgba(0,0,0,.5)", filter: `grayscale(${gray}) brightness(${1 - 0.35 * gray})` }}>
        <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", background: "linear-gradient(160deg,#5a3a1e,#1e120a)" }}>
          {has && <Img src={staticFile(`v45/img/${src}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: FOCUS[src] ?? "50% 50%", transformOrigin: FOCUS[src] ?? "50% 50%", transform: `scale(${1.03 + 0.05 * lin(t % 20, 0, 6)})` }} />}
          {!has && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial", fontSize: 22, color: "rgba(255,255,255,.5)" }}>{src}.png</div>}
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 40px rgba(60,35,10,.35)" }} />
        </div>
        {caption && <div style={{ position: "absolute", right: 16, bottom: -22, padding: "4px 16px 8px", background: INK, border: `1.5px solid ${GOLD2}`, color: CREAM, fontFamily: FA_UI, fontWeight: 700, fontSize: 30, direction: "rtl", whiteSpace: "nowrap" }}>{caption}</div>}
      </div>
    </>
  );
};

// army block: team colour, dark border (v35 Unit), scaled with the map
// soldiers: a unit is a tidy grid of dots (one dot = soldiers), user's request — not a solid block.
// Infantry: tight 6x4 rows; cavalry: looser 4x2 with a bigger dot; camels: 3x2 sand dots. Dots jitter slightly
// (breathing/marching), and as a unit is hit (gray) dots drop out one by one.
const Unit: React.FC<{ p: Pt; k: number; color: string; w?: number; h?: number; rot?: number; gray?: number; mark?: "horse" | "camel"; t?: number }> = ({ p, k, color, w = 46, h = 26, rot = 0, gray = 0, mark, t = 0 }) => {
  if (k <= 0.01) return null;
  const [cols, rows] = mark === "horse" ? [4, 2] : mark === "camel" ? [3, 2] : [6, 4];
  const gx = w / cols, gy = h / rows, r = Math.min(gx, gy) * (mark ? 0.34 : 0.32);
  const ph = (p[0] * 0.013 + p[1] * 0.007) % 6.28;
  const dots: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const id = j * cols + i;
    if (rnd(id + ph * 10) < gray * 0.65) continue; // casualties
    const jit = mark ? 0.18 : 0.08;
    const x = gx * (i + 0.5) + Math.sin(t * 3.1 + id * 1.7 + ph) * gx * jit, y = gy * (j + 0.5) + Math.cos(t * 2.7 + id * 2.3 + ph) * gy * jit;
    dots.push(<circle key={id} cx={x} cy={y} r={r} fill={color} stroke="rgba(10,6,3,.85)" strokeWidth={Math.max(1.2, r * 0.32)} />);
  }
  return (
    <svg width={w + 8} height={h + 8} viewBox={`-4 -4 ${w + 8} ${h + 8}`} style={{ position: "absolute", left: p[0] - w / 2 - 4, top: p[1] - h / 2 - 4, opacity: k, overflow: "visible", transform: `rotate(${rot}deg)`, filter: `grayscale(${gray}) brightness(${1 - 0.3 * gray}) drop-shadow(0 3px 4px rgba(0,0,0,.55))` }}>
      {dots}
    </svg>
  );
};

// campaign arrow, Agarology: thin coloured line with dark halo and sharp head
const Arrow: React.FC<{ a: Pt; b: Pt; p: number; color: string; w?: number; dash?: boolean; bend?: number }> = ({ a, b, p, color, w = 7, dash, bend = 0.12 }) => {
  if (p <= 0.001) return null;
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const q = (s: number): Pt => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * mx + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * my + s * s * b[1]];
  const d = `M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}`;
  const tip = q(p), pre = q(Math.max(0, p - 0.02)), ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]), hs = w * 3.2;
  const head = `M${tip[0] + Math.cos(ang) * hs} ${tip[1] + Math.sin(ang) * hs}L${tip[0] + Math.cos(ang + 2.5) * hs} ${tip[1] + Math.sin(ang + 2.5) * hs}L${tip[0] + Math.cos(ang - 2.5) * hs} ${tip[1] + Math.sin(ang - 2.5) * hs}Z`;
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth={w + 5} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
      {dash ? (
        <>
          <mask id={`m${a[0] | 0}${b[1] | 0}`}><path d={d} fill="none" stroke="#fff" strokeWidth={w + 6} pathLength={1} strokeDasharray={`${p} 2`} /></mask>
          <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray="16 11" mask={`url(#m${a[0] | 0}${b[1] | 0})`} />
        </>
      ) : (
        <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
      )}
      <path d={head} fill={color} stroke="rgba(0,0,0,.6)" strokeWidth={1.5} />
    </g>
  );
};

// phrase captions (v35 Short style: Vazirmatn Black, cream, gold keywords)
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const line = LINES.find((l) => t >= l.s - 0.05 && t <= l.e + 0.25);
  if (!line?.words?.length) return null;
  const ws = line.words, groups: Word[][] = [];
  for (let i = 0; i < ws.length; i += 4) groups.push(ws.slice(i, i + 4));
  const g = groups.find((_, i) => t < (groups[i + 1]?.[0].s ?? 1e9)) ?? groups[groups.length - 1];
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1365, direction: "rtl", textAlign: "center", fontFamily: FA_UI, fontWeight: 900, fontSize: 66, lineHeight: 1.3, textShadow: "0 4px 0 rgba(0,0,0,.55), 0 0 18px rgba(0,0,0,.85), 0 0 4px #000" }}>
      {g.map((w, i) => {
        const on = t >= w.s;
        const key = /[۰-۹0-9]|اسکندر|داریوش|شکاف|گوگمل|تیر|مورب|بابل|شوش|تخت/.test(w.w);
        return <span key={i} style={{ color: on ? (key ? GOLD : CREAM) : "rgba(251,235,203,.45)", display: "inline-block", transform: `scale(${on && t < w.s + 0.12 ? 1.07 : 1})`, marginLeft: 16 }}>{w.w}</span>;
      })}
    </div>
  );
};
// ---------- the film ----------
const PER = "#D0584A"; // Achaemenid crimson (brighter than #A94B40 so it reads on the satellite map)
export const V45: React.FC<{ silent?: boolean; at?: number }> = ({ silent, at }) => {
  const cur = useCurrentFrame();
  const t = (at ?? cur) / V45_FPS;
  const c = camAt(t);
  const k = 2 ** (c.z - 11);
  const l = LINES;
  const S = (x: number, y: number) => bs(c, x, y);
  const els: React.ReactNode[] = [];
  const svg: React.ReactNode[] = [];
  const U = 1.4 * k;
  void WINE; void faNum;

  // key times (all from the narration words)
  const tMid = Wd(0, "وسط", 0.55), tSplit = Wd(0, "شکافت", 0.85);
  const tStr = Wd(3, "مستقیم", 0.2), tWing = Wd(3, "جناح", 0.6);
  const tPull = Wd(4, "کشیده", 0.35), tGap = Wd(4, "شکاف", 0.85);
  const tW = Wd(5, "تیر", 0.45), tDar = Wd(5, "داریوش", 0.75);
  const tLeave = Wd(6, "ترک", 0.45), tFall = Wd(6, "پاشید", 0.5), tCh = Wd(6, "چند", 0.5);
  const tBab = Wd(6, "بابل", 0.6), tSus = Wd(6, "شوش", 0.65), tPer = Wd(6, "تخت", 0.7);

  // ---- battle state ----
  const hookGap = t < l[1].s + 0.4 ? ramp(t, tMid - 0.2, tSplit + 0.2) : 0;
  const obl = ramp(t, tWing - 0.2, l[3].e + 0.3);
  const pull = ramp(t, tPull - 0.4, tGap + 0.2);
  const gap = Math.max(hookGap, pull);
  const col = ramp(t, tFall - 0.3, tFall + 2.2);
  const bf = Math.max(win(t, 0, l[1].s + 0.5, 0.25), win(t, l[2].s + 0.4, tCh + 0.5, 0.4));

  if (bf > 0) {
    const pers: { x: number; y: number; cav?: boolean; id: number }[] = [];
    let id = 0;
    for (let x = -240; x <= 240; x += 80) pers.push({ x, y: -230, id: id++ }, { x, y: -295, id: id++ });
    for (const x of [-470, -395]) pers.push({ x, y: -230, cav: true, id: id++ });
    for (const x of [320, 395, 470]) pers.push({ x, y: -230, cav: true, id: id++ });
    for (const u of pers) {
      let x = u.x, y = u.y;
      if (u.x > 0) { x += gap * (u.cav ? 160 : 140); y += gap * (u.cav ? 35 : 0); }
      x += col * (rnd(u.id) - 0.5) * 300; y -= col * (120 + rnd(u.id + 5) * 380);
      els.push(<Unit t={t} key={"p" + u.id} p={S(x, y)} k={bf * (1 - col * 0.5)} color={PER} w={(u.cav ? 44 : 54) * U} h={(u.cav ? 24 : 30) * U} mark={u.cav ? "horse" : undefined} gray={col * 0.85} />);
    }
    // Darius' command post
    const dGo = ramp(t, tLeave - 0.1, tLeave + 2.2), dp = S(-20 - 90 * dGo, -345 - 620 * dGo);
    const dk = bf * (1 - ramp(t, tLeave + 1.6, tLeave + 2.4));
    els.push(<Dot key="dar" p={dp} k={dk} color={PER} r={17} pulse={lin(t, tDar - 0.2, tDar + 0.8)} />);
    els.push(<Label key="darl" p={dp} text="داریوش" k={dk * (t > l[1].s + 0.4 ? 1 : ramp(t, 0.2, 0.6))} size={34} dy={-42} />);
    if (dGo > 0) svg.push(<g key="dret" opacity={dk}><Arrow a={S(-20, -345)} b={S(-110, -965)} p={dGo} color={PER} w={7} dash bend={0.05} /></g>);

    // chariots (L2): appear on «ارابه», roll forward, some stop and gray out
    const ch = win(t, Wd(2, "ارابه", 0.3) - 0.2, l[3].s + 2.4, 0.3);
    if (ch > 0) for (let i = 0; i < 6; i++) {
      const go = ramp(t, Wd(2, "ارابه", 0.4) + i * 0.08, Wd(2, "ارابه", 0.4) + 1.6 + i * 0.08);
      const stop = i % 2 ? 1 : 0.55;
      els.push(<Unit t={t} key={"ch" + i} p={S(-200 + i * 80, -160 + go * 230 * stop)} k={ch} color="#E7A06A" w={36 * U} h={20 * U} mark="horse" gray={i % 2 ? 0 : ramp(t, l[3].s, l[3].s + 0.8) * 0.8} />);
    }

    // Macedonians
    const mac: { x: number; y: number; cav?: "R" | "L"; id: number }[] = [];
    id = 100;
    for (let x = -200; x <= 120; x += 64) mac.push({ x, y: 255, id: id++ });
    for (const x of [-330, -262]) mac.push({ x, y: 255, cav: "L", id: id++ });
    for (const x of [-140, -50, 40]) mac.push({ x, y: 360, id: id++ });
    for (const u of mac) {
      let x = u.x, y = u.y;
      if (!u.cav && u.y < 300) y -= obl * 45 * ((u.x + 200) / 320);
      y -= col * 110;
      els.push(<Unit t={t} key={"m" + u.id} p={S(x, y)} k={bf * (u.y > 300 ? 0.75 : 1)} color={GOLD} w={(u.cav ? 44 : 54) * U * (u.y > 300 ? 0.85 : 1)} h={(u.cav ? 24 : 30) * U} mark={u.cav ? "horse" : undefined} />);
    }
    // Companions: right wing → oblique → wedge through the gap → towards Darius
    const base: Pt[] = [[205, 255], [272, 255], [339, 255]].map(([x, y]) => [x + 150 * obl, y - 70 * obl]);
    const path = (s: number): Pt => {
      const A: Pt = [420, 180], B: Pt = [110, -225], C: Pt = [0, -310];
      return s < 0.7 ? [A[0] + (B[0] - A[0]) * (s / 0.7), A[1] + (B[1] - A[1]) * (s / 0.7)] : [B[0] + (C[0] - B[0]) * ((s - 0.7) / 0.3), B[1] + (C[1] - B[1]) * ((s - 0.7) / 0.3)];
    };
    const tri: Pt[] = [[0, 0], [-40, 44], [40, 44], [-80, 88], [0, 88], [80, 88]];
    const form = ramp(t, tW - 0.6, tW);
    const head = path(eio(lin(t, tW, tDar + 0.3)));
    tri.forEach(([ox, oy], i) => {
      const b0 = base[Math.min(i, 2)];
      const wp: Pt = [head[0] + ox, head[1] + oy];
      const x = b0[0] + (wp[0] - b0[0]) * form, y = b0[1] + (wp[1] - b0[1]) * form - col * 110 * (1 - form);
      const kk = i < 3 ? 1 : form;
      els.push(<Unit t={t} key={"cp" + i} p={S(x, y)} k={bf * kk} color="#FFD98A" w={44 * U} h={24 * U} mark="horse" />);
    });
    const alexP = form > 0 ? S(head[0], head[1] - 10) : S(base[1][0], base[1][1]);
    els.push(<Label key="alx" p={alexP} text="اسکندر" k={bf * (t < l[1].s + 0.4 ? ramp(t, 0.2, 0.6) : ramp(t, l[2].s + 1.4, l[2].s + 1.9)) * (1 - col)} size={34} dy={-48} color={GOLD} />);

    // hook: gold arrow through the line
    if (hookGap > 0 || t < l[1].s) {
      const hp = ramp(t, 0.25, tMid + 0.1);
      svg.push(<g key="hka" opacity={win(t, 0, l[1].s + 0.4, 0.2)}><Arrow a={S(300, 230)} b={S(70, -330)} p={hp} color={GOLD} w={10} bend={0.12} /></g>);
    }
    // L3: «no direct attack» — straight arrow crossed out, then the oblique arrow
    const st = win(t, tStr - 0.3, tWing + 0.3, 0.2);
    if (st > 0) {
      svg.push(<g key="str" opacity={st * 0.85}><Arrow a={S(-40, 200)} b={S(-40, -160)} p={ramp(t, tStr - 0.3, tStr + 0.3)} color={CREAM} w={6} dash bend={0} /></g>);
      const x = ramp(t, tStr + 0.2, tStr + 0.6), q = S(-40, 30);
      if (x > 0) svg.push(<path key="strx" d={`M${q[0] - 44} ${q[1] - 44}L${q[0] + 44} ${q[1] + 44}M${q[0] + 44} ${q[1] - 44}L${q[0] - 44} ${q[1] + 44}`} stroke={RED} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={`${x} 2`} opacity={st} />);
    }
    const ob = win(t, tWing - 0.2, tW, 0.3);
    if (ob > 0) svg.push(<g key="obl" opacity={ob}><Arrow a={S(270, 300)} b={S(480, 150)} p={ramp(t, tWing - 0.2, tWing + 1.2)} color={GOLD} w={8} bend={-0.1} /></g>);
    // L4: Persian left cavalry pulled right
    const pa = win(t, tPull - 0.5, tW, 0.3);
    if (pa > 0) svg.push(<g key="pul" opacity={pa}><Arrow a={S(330, -280)} b={S(560, -170)} p={ramp(t, tPull - 0.5, tPull + 0.9)} color={PER} w={8} bend={-0.15} /></g>);
    // the gap: crack + glow
    const gk = Math.max(win(t, tSplit - 0.3, l[1].s + 0.3, 0.2), win(t, tGap - 0.3, tDar + 0.4, 0.3));
    if (gk > 0) {
      const q = S(110, -230), fl = Math.max(0, 1 - Math.abs(t - tGap) * 2.5) + Math.max(0, 1 - Math.abs(t - tSplit) * 2.5);
      els.push(<div key="glow" style={{ position: "absolute", left: q[0] - 160 * k, top: q[1] - 200 * k, width: 320 * k, height: 400 * k, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,226,150,.85), rgba(255,226,150,0))", opacity: gk * (0.35 + 0.65 * Math.min(1, fl)), mixBlendMode: "screen" }} />);
      svg.push(<path key="crack" d={`M${q[0]} ${q[1] - 120 * k}L${q[0] - 14 * k} ${q[1] - 60 * k}L${q[0] + 12 * k} ${q[1] - 10 * k}L${q[0] - 10 * k} ${q[1] + 40 * k}L${q[0] + 8 * k} ${q[1] + 110 * k}`} fill="none" stroke={CREAM} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${gk} 2`} opacity={gk} />);
    }
    // L5: the charge arrow and Mazaeus' pressure on Parmenion
    const wa = win(t, tW - 0.3, tLeave + 0.4, 0.3);
    if (wa > 0) svg.push(<g key="wa" opacity={wa}><Arrow a={S(430, 230)} b={S(10, -300)} p={ramp(t, tW - 0.3, tDar)} color={GOLD} w={11} bend={0.1} /></g>);
    const mz = win(t, Wd(5, "مستقیم", 0.3), tLeave + 0.2, 0.3);
    if (mz > 0) {
      svg.push(<g key="mz" opacity={mz}><Arrow a={S(-430, -190)} b={S(-310, 210)} p={ramp(t, Wd(5, "مستقیم", 0.3), Wd(5, "مستقیم", 0.3) + 1.2)} color={PER} w={7} dash bend={0.12} /></g>);
      els.push(<Label key="mzl" p={S(-420, 20)} text="مازه" sub="فشار بر پارمنیون" k={mz} size={30} dy={0} />);
    }
    // L2 side labels
    const nm = win(t, l[2].s + 1.4, tStr - 0.3, 0.3);
    els.push(<Label key="bes" p={S(395, -230)} text="بسوس" k={nm} size={30} dy={-46} />);
    els.push(<Label key="maz" p={S(-432, -230)} text="مازه" k={nm} size={30} dy={-46} />);
    els.push(<Label key="par" p={S(-296, 255)} text="پارمنیون" k={nm} size={30} dy={52} />);
  }

  // ---- L0 hook card ----
  els.push(<Card key="h0" k={win(t, 0, l[1].s + 0.2, 0.15)} y={280} text="اسکندر در برابر داریوش" size={70} />);

  // ---- L1 wide → region: Pella and Persepolis, then the plain ----
  const r1 = win(t, l[1].s - 0.1, l[2].s + 1.0, 0.3);
  if (r1 > 0) {
    const pel = toScreen(c, ...P.pella), pps = toScreen(c, ...P.persepolis), g = toScreen(c, ...P.gaug);
    const tA = Wd(1, "اسکندر", 0.3), tD = Wd(1, "داریوش", 0.3);
    const wd = win(t, l[1].s, Wd(1, "گوگمل", 0.5) + 1.2, 0.3);
    svg.push(<g key="wa1" opacity={wd}><Arrow a={pel} b={[g[0] - 12, g[1] + 6]} p={ramp(t, l[1].s + 0.2, Wd(1, "گوگمل", 0.5) + 0.6)} color={GOLD} w={8} bend={0.12} /><Arrow a={pps} b={[g[0] + 12, g[1] + 8]} p={ramp(t, l[1].s + 0.6, Wd(1, "گوگمل", 0.5) + 0.8)} color={PER} w={8} bend={-0.12} /></g>);
    els.push(<Dot key="pel" p={pel} k={wd} color={GOLD} />);
    els.push(<Label key="pell" p={pel} text="مقدونیه" k={wd} size={36} dy={-40} />);
    els.push(<Dot key="pps" p={pps} k={wd} color={PER} />);
    els.push(<Label key="ppsl" p={pps} text="پارس" sub="هخامنشیان" k={wd} size={36} dy={-54} />);
    const rg = ramp(t, Wd(1, "گوگمل", 0.5) + 0.6, Wd(1, "گوگمل", 0.5) + 1.3) * r1;
    els.push(<Label key="tig" p={toScreen(c, ...P.tigris)} text="دجله" k={rg} size={30} color="#bfe3f2" dy={0} />);
    els.push(<Dot key="mos" p={toScreen(c, ...P.nineveh)} k={rg} color={CREAM} r={8} />);
    els.push(<Label key="mosl" p={toScreen(c, ...P.nineveh)} text="نینوا" sub="موصل" k={rg} size={30} dy={-46} />);
    els.push(<Dot key="arb" p={toScreen(c, ...P.arbela)} k={rg} color={CREAM} r={8} />);
    els.push(<Label key="arbl" p={toScreen(c, ...P.arbela)} text="اربیل" k={rg} size={30} dy={-34} />);
    const gr = 46 * 2 ** (c.z - 8);
    els.push(<div key="area" style={{ position: "absolute", left: g[0] - gr, top: g[1] - gr, width: gr * 2, height: gr * 2, borderRadius: "50%", border: `3px dashed ${GOLD}`, background: "rgba(242,196,110,.18)", opacity: rg * (1 - ramp(t, l[2].s, l[2].s + 0.6)) }} />);
    els.push(<Label key="areal" p={g} text="محل تقریبی نبرد" k={rg * (1 - ramp(t, l[2].s, l[2].s + 0.6))} size={32} dy={-gr - 26} color={GOLD} />);
    els.push(<Card key="b1" y={275} k={win(t, Wd(1, "گوگمل", 0.3) - 0.2, l[2].s + 0.6, 0.3)} text="نبرد گوگمل" sub="۱ اکتبر ۳۳۱ پیش از میلاد" />);
    els.push(<Photo key="pa" src="01-alexander" c={[790, 1060]} w={330} ar={4 / 5} k={win(t, tA - 0.2, Wd(1, "گوگمل", 0.3) - 0.1, 0.3)} t={t} caption="اسکندر مقدونی" rot={2} />);
    els.push(<Photo key="pd" src="02-darius" c={[290, 1060]} w={330} ar={4 / 5} k={win(t, tD - 0.2, Wd(1, "گوگمل", 0.3) - 0.1, 0.3)} t={t} caption="داریوش سوم" rot={-2} />);
  }

  // ---- year chip ----
  els.push(<Chip key="yr" x={W - 160} y={110} k={ramp(t, l[2].s, l[2].s + 0.5) * (1 - ramp(t, l[7].s, l[7].s + 0.4))} size={32}>۳۳۱ پیش از میلاد</Chip>);

  // ---- L2: the bigger army, the flattened plain ----
  const tFlat = Wd(2, "صاف", 0.4);
  els.push(<Card key="b2" y={268} k={win(t, l[2].s + 0.5, Wd(2, "ارابه", 0.3) - 0.1, 0.25)} text="ارتش بزرگ‌تر هخامنشی" size={68} sub="اندازه‌ی دقیقش معلوم نیست" tone="red" />);
  const fl = lin(t, tFlat - 0.1, tFlat + 0.9);
  if (fl > 0 && fl < 1) els.push(<div key="flat" style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 260 + fl * 220, height: 70, background: "linear-gradient(180deg, transparent, rgba(255,236,190,.55), transparent)", mixBlendMode: "screen", opacity: Math.sin(fl * Math.PI) }} />);
  els.push(<Photo key="p3" src="03-chariots" c={[W / 2, 560]} w={660} k={win(t, Wd(2, "ارابه", 0.3) - 0.1, l[3].s + 0.2, 0.3)} t={t} anchor={S(0, -150)} caption="ارابه‌های داس‌دار" />);

  // ---- L3: oblique ----
  els.push(<Card key="b3" y={268} k={win(t, tStr - 0.2, tWing + 0.1, 0.2)} text="بدون حمله‌ی مستقیم" tone="cream" size={68} />);
  els.push(<Card key="b3b" y={268} k={win(t, tWing, l[4].s + 0.3, 0.25)} text="حرکت مورب" sub="جناح راست اسکندر به بیرون میدان" />);
  els.push(<Photo key="p4" src="04-oblique" c={[W / 2, 570]} w={620} k={win(t, tWing + 0.6, l[4].s + 0.4, 0.3)} t={t} caption="آرایش مایل" />);
  // ---- L4: pulled and opened ----
  els.push(<Card key="b4" y={268} k={win(t, l[4].s + 0.3, tGap - 0.1, 0.25)} text="سواره‌نظام پارس کشیده شد" size={62} tone="red" />);
  els.push(<Card key="b4b" y={268} k={win(t, tGap - 0.1, l[5].s + 0.4, 0.15)} text="شکاف!" size={96} tone="red" sub="وسط خط ارتش داریوش" />);
  // ---- L5: the charge ----
  els.push(<Card key="b5" y={268} k={win(t, l[5].s + 0.3, tLeave - 0.2, 0.25)} text="سواره‌نظام همراهان" sub="مستقیم به سمت داریوش" />);
  els.push(<Photo key="p5" src="05-wedge" c={[W / 2, 1180]} w={560} k={win(t, tW + 0.3, Wd(5, "مستقیم", 0.3) + 0.4, 0.3)} t={t} caption="حمله‌ی اسکندر" />);
  // ---- L6: Darius leaves, the empire falls ----
  els.push(<Card key="b6" y={268} k={win(t, tLeave - 0.2, tCh, 0.25)} text="داریوش میدان را ترک کرد" size={62} tone="red" />);
  els.push(<Photo key="p6" src="06-darius-leaves" c={[W / 2, 1160]} w={580} k={win(t, tLeave, tCh - 0.1, 0.3)} t={t} caption="عقب‌نشینی شاه" />);
  const cs = win(t, tCh - 0.3, l[7].s + 0.4, 0.3);
  if (cs > 0) {
    const g = toScreen(c, ...P.gaug);
    els.push(<Dot key="gg" p={g} k={cs} color={RED} r={11} />);
    els.push(<Label key="ggl" p={g} text="گوگمل" k={cs} size={32} dy={-38} />);
    const chain: [readonly [number, number], string, number][] = [[P.babylon, "بابل", tBab], [P.susa, "شوش", tSus], [P.persepolis, "تخت‌جمشید", tPer]];
    let prev = g;
    chain.forEach(([pp, name, tt], i) => {
      const q = toScreen(c, pp[0], pp[1]), a = ramp(t, tt - 0.7, tt);
      svg.push(<g key={"cc" + i} opacity={cs}><Arrow a={prev} b={q} p={a} color={GOLD} w={7} dash bend={0.1} /></g>);
      els.push(<Dot key={"cd" + i} p={q} k={cs * ramp(t, tt - 0.1, tt + 0.15)} color={GOLD} r={13} pulse={lin(t, tt, tt + 0.8)} />);
      els.push(<Label key={"cl" + i} p={q} text={name} k={cs * ramp(t, tt - 0.1, tt + 0.2)} size={40} dy={-46} />);
      prev = q;
    });
    els.push(<Card key="b7" y={275} k={win(t, tBab - 0.3, l[7].s + 0.3, 0.25)} text="سقوط قلب امپراتوری" sub="بابل، شوش، تخت‌جمشید · ۳۳۱–۳۳۰ پ.م." size={70} />);
  }

  // ---- L7: question ----
  const q = ramp(t, l[7].s, l[7].s + 0.5);
  if (q > 0) {
    const a = ramp(t, Wd(7, "ترسید", 0.5) - 0.2, Wd(7, "ترسید", 0.5) + 0.2), b = ramp(t, Wd(7, "نجات", 0.4) - 0.2, Wd(7, "نجات", 0.4) + 0.2);
    els.push(<Card key="qq" k={q} text="ترس یا تصمیم؟" tone="cream" size={80} y={330} />);
    els.push(<Photo key="qa" src="02-darius" c={[780, 820]} w={360} ar={4 / 5} k={a} t={t} caption="ترسید؟" rot={2} />);
    els.push(<Photo key="qb" src="06-darius-leaves" c={[300, 820]} w={360} ar={4 / 5} k={b} t={t} caption="یا تصمیم درست؟" rot={-2} />);
    els.push(<div key="ya" style={{ position: "absolute", left: W / 2 + 10, top: 820, transform: "translate(-50%,-50%)", fontFamily: FA_T, fontSize: 80, color: GOLD, textShadow: SH, opacity: b }}>یا</div>);
    els.push(<Chip key="cm" x={W / 2} y={1150} k={ramp(t, l[7].e - 0.6, l[7].e - 0.1)} size={40}>نظرت رو کامنت کن</Chip>);
  }

  return (
    <AbsoluteFill style={{ background: "#c8b48c" }}>
      <MapBg c={c} dim={0.38 * q} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{svg}</svg>
      {els}
      <Captions t={t} />
      <div style={{ position: "absolute", left: 38, top: 96, width: 112, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.55 }}>
        <Img src={staticFile("v45/logo-mark.png")} style={{ width: 90, height: 75, filter: "drop-shadow(0 0 3px rgba(0,0,0,.6))" }} />
        <div style={{ fontFamily: "Arial", fontWeight: 600, fontSize: 22, letterSpacing: 1.2, color: "#fff", marginTop: 2, textShadow: "0 2px 6px rgba(0,0,0,.7)" }}>Agarlogy</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: "Arial", fontSize: 17, color: "rgba(255,255,255,.75)", textShadow: "0 1px 3px #000" }}>Map: Sentinel-2 cloudless 2016 by EOX (CC BY 4.0) · approximate reconstruction</div>
      {!silent && <Html5Audio src={staticFile("v45/mix.wav")} />}
    </AbsoluteFill>
  );
};
