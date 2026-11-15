// v44 · نبرد حرّان (Carrhae, 53 BC) · vertical Agarology short on a bright Sentinel-2 satellite map.
// Look = Agarology (v35 kit): dark panels with gold frame, Estedad titles, cream labels, wine Rome / gold Parthia,
// thin campaign arrows, pinned photo cards. Only the map is bright (user: «not dark like the Sasanian video»).
// Map: EOX Sentinel-2 cloudless 2016 (CC BY 4.0), three stitched levels (videos/44/get-tiles.mjs).
// Timing: src/v44/vo.json (lines s/e + words), built from the user's narration by videos/44/build-vo.mjs.
import React from "react";
import { AbsoluteFill, Html5Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import tiles from "./tiles.json";
import vo from "./vo.json";

export const V44_FPS = 30;
type Word = { w: string; s: number; e: number };
type Line = { n: number; s: number; e: number; words?: Word[] };
const LINES = (vo as { lines: Line[] }).lines;
const TOTAL = (vo as { total: number }).total;
export const V44_FRAMES = Math.ceil((TOTAL + 1.2) * V44_FPS);
const W = 1080, H = 1920;

// ---------- fonts (same as v35) ----------
const FA_T = "Estedad", FA_UI = "Vazirmatn";
if (typeof window !== "undefined") {
  const h = delayRender("v44 fonts");
  Promise.all(
    ([
      [FA_UI, "fonts/Vazirmatn-Regular.ttf", { weight: "400" }],
      [FA_UI, "fonts/Vazirmatn-Bold.ttf", { weight: "700" }],
      [FA_UI, "fonts/Vazirmatn-Black.ttf", { weight: "900" }],
      [FA_T, "fonts/Estedad-Black.woff2", { weight: "900" }],
    ] as [string, string, FontFaceDescriptors][]).map(([f, u, d]) => new FontFace(f, `url('${staticFile(u)}')`, d).load().then((ff) => document.fonts.add(ff))),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}

// photo cards the user makes with ChatGPT (public/v44/img/); false = placeholder mount
export const IMG: Record<string, boolean> = { "01-surena": true, "02-crassus": true, "03-reveal": true, "04-parthian-shot": true, "05-camels": true, "06-orodes": true };
// where the face is in each 16:9 picture (portrait cards crop to it)
const FOCUS: Record<string, string> = { "01-surena": "50% 22%", "02-crassus": "48% 24%", "06-orodes": "52% 20%" };

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
// battle space: px at zoom 11 around the battlefield (desert south of Harran)
const BC = { lon: 39.0, lat: 36.47 };
const bs = (c: Cam, x: number, y: number): Pt => {
  const [cx, cy] = toScreen(c, BC.lon, BC.lat), k = 2 ** (c.z - 11);
  return [cx + x * k, cy + y * k];
};
const P = {
  rome: [12.48, 41.9], ctes: [44.58, 33.09], zeugma: [37.87, 37.06], carrhae: [39.03, 36.87],
  bambyce: [38.12, 36.52], balikh: [39.07, 36.3], euph: [38.3, 36.15],
} as const;

// ---------- camera ----------
function camKeys(): [number, number, number, number][] {
  const l = LINES;
  return [
    [0, 28.5, 36.2, 5.25],
    [l[0].e - 0.6, 29.5, 36.2, 5.45],
    [l[1].s + 1.6, 38.45, 36.78, 8.45],
    [l[1].e - 0.2, 38.55, 36.8, 8.75],
    [l[2].s + 1.4, 39.0, 36.47, 11.1],
    [l[2].e, 39.0, 36.47, 11.3],
    [l[3].e, 39.0, 36.46, 11.25],
    [l[4].s + 0.8, 39.03, 36.46, 11.1],
    [l[4].e, 39.03, 36.46, 11.15],
    [Wd(5, "فروپاشید", 0.45) - 0.3, 39.05, 36.47, 11.0],
    [l[5].e - 0.4, 39.02, 36.68, 10.0],
    [l[6].s + 1.6, 41.5, 35.2, 6.4],
    [l[6].e, 41.8, 35.0, 6.55],
    [TOTAL + 2, 41.8, 35.0, 6.7],
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
          <Img key={name} src={staticFile(`v44/${name}.jpg`)}
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
          {has && <Img src={staticFile(`v44/img/${src}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: FOCUS[src] ?? "50% 50%", transformOrigin: FOCUS[src] ?? "50% 50%", transform: `scale(${1.03 + 0.05 * lin(t % 20, 0, 6)})` }} />}
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
        const key = /[۰-۹0-9]|سورنا|اشکانی|ایرانی|شتر|اعدام|پادشاه|کراسوس|روم/.test(w.w);
        return <span key={i} style={{ color: on ? (key ? GOLD : CREAM) : "rgba(251,235,203,.45)", display: "inline-block", transform: `scale(${on && t < w.s + 0.12 ? 1.07 : 1})`, marginLeft: 16 }}>{w.w}</span>;
      })}
    </div>
  );
};

// ---------- the film ----------
export const V44: React.FC<{ silent?: boolean; at?: number }> = ({ silent, at }) => {
  const cur = useCurrentFrame();
  const t = (at ?? cur) / V44_FPS;
  const c = camAt(t);
  const k = 2 ** (c.z - 11);
  const l = LINES;
  const S = (x: number, y: number) => bs(c, x, y);
  const els: React.ReactNode[] = [];
  const svg: React.ReactNode[] = [];

  // ---- L0 hook: Rome vs Parthia ----
  const h = win(t, 0, l[1].s + 0.6, 0.15);
  if (h > 0) {
    const rome = toScreen(c, ...P.rome), ctes = toScreen(c, ...P.ctes), carr = toScreen(c, ...P.carrhae);
    const tIr = Wd(0, "ایرانی", 0.5);
    const pr = ramp(t, 0.15, 2.2), pp = ramp(t, tIr, tIr + 1.6);
    svg.push(<g key="hk" opacity={h}><Arrow a={rome} b={[carr[0] - 14, carr[1] - 6]} p={pr} color={WINE} w={8} bend={0.1} /><Arrow a={ctes} b={[carr[0] + 14, carr[1] + 8]} p={pp} color={GOLD} w={8} bend={-0.15} /></g>);
    els.push(<Dot key="dr" p={rome} k={h * ramp(t, 0, 0.25)} color={WINE} />);
    els.push(<Label key="lr" p={rome} text="روم" k={h * ramp(t, 0.05, 0.35)} dy={-44} size={40} />);
    els.push(<Dot key="dc" p={ctes} k={h * ramp(t, tIr - 0.3, tIr)} color={GOLD} />);
    els.push(<Label key="lc" p={ctes} text="اشکانیان" sub="ایران" k={h * ramp(t, tIr - 0.2, tIr + 0.1)} dy={-56} size={40} />);
    const t10 = Wd(0, "۱۰", 0.55);
    const n1 = 40000 * eout(lin(t, 0.1, 1.6)), n2 = 10000 * eout(lin(t, t10, t10 + 1.0));
    const pulse = 1 + 0.06 * Math.max(0, 1 - Math.abs(t - Wd(0, "نابودش", 0.85)) * 5);
    const box = (n: number, col: string, who: string, o: number) => (
      <div style={{ opacity: o, padding: "12px 34px 18px", background: "linear-gradient(180deg, rgba(26,16,10,.94), rgba(14,8,5,.94))", border: `2px solid ${col}`, outline: `1px solid ${col}55`, outlineOffset: 6, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,.55)" }}>
        <div style={{ fontFamily: FA_T, fontSize: 104, color: col, lineHeight: 1.1 }}>{faNum(n)}</div>
        <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 32, color: CREAM, opacity: 0.9 }}>{who}</div>
      </div>
    );
    els.push(
      <div key="vs" style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26, alignItems: "center", direction: "rtl", opacity: h, transform: `scale(${pulse})` }}>
        {box(n1, "#E58A97", "سرباز رومی", 1)}
        <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 40, color: CREAM, textShadow: SH }}>در برابر</div>
        {box(n2, GOLD, "سوار اشکانی", ramp(t, t10 - 0.15, t10 + 0.05))}
      </div>,
    );
  }

  // ---- year chip (top-right, from L1 on) ----
  els.push(<Chip key="yr" x={W - 150} y={110} k={ramp(t, l[1].s + 0.4, l[1].s + 0.9) * (1 - ramp(t, l[7].s, l[7].s + 0.4))} size={34}>۵۳ پیش از میلاد</Chip>);

  // ---- L1 route Zeugma → Carrhae ----
  const r1 = win(t, l[1].s + 0.6, l[2].s + 1.2, 0.3);
  if (r1 > 0) {
    const route = [P.zeugma, P.bambyce, P.balikh, P.carrhae].map((p) => toScreen(c, p[0], p[1]));
    const t0 = Wd(1, "کراسوس", 0.35), t1 = Wd(1, "سورنا", 0.7);
    route.slice(0, -1).forEach((a, i) => {
      const seg = eio(cl(lin(t, t0, t1) * 3 - i));
      svg.push(<g key={"rt" + i} opacity={r1}><Arrow a={a} b={route[i + 1]} p={seg} color={WINE} w={7} dash bend={0.05} /></g>);
    });
    els.push(<Dot key="zd" p={route[0]} k={r1 * ramp(t, t0 - 0.3, t0)} color={WINE} r={10} />);
    els.push(<Label key="zg" p={route[0]} text="زئوگما" k={r1 * ramp(t, t0 - 0.3, t0)} size={34} />);
    els.push(<Label key="fr" p={toScreen(c, ...P.euph)} text="فرات" k={r1 * ramp(t, l[1].s + 1.6, l[1].s + 2)} size={30} color="#bfe3f2" dy={0} />);
    els.push(<Dot key="hd" p={route[3]} k={r1 * ramp(t, t1 - 0.2, t1 + 0.1)} color={RED} r={13} pulse={lin(t, t1, t1 + 0.9)} />);
    els.push(<Label key="hr" p={route[3]} text="حرّان" k={r1 * ramp(t, t1 - 0.2, t1 + 0.1)} size={44} dy={-48} />);
    els.push(<Card key="b1" k={r1 * ramp(t, l[1].s + 0.3, l[1].s + 0.8)} text="نبرد حرّان" sub="کراسوس در برابر سورنا" />);
    els.push(<Chip key="b1b" x={W / 2} y={490} k={win(t, Wd(1, "لژیون", 0.45), t1 + 0.4, 0.25)} border={WINE}>۷ لژیون رومی</Chip>);
    // portraits: Crassus vs Surena
    const tS = Wd(1, "سورنا", 0.62);
    els.push(<Photo key="pc" src="02-crassus" c={[290, 1060]} w={330} ar={4 / 5} k={win(t, Wd(1, "کراسوس", 0.3), l[2].s + 0.5, 0.3)} t={t} caption="کراسوس" rot={-2} />);
    els.push(<Photo key="ps" src="01-surena" c={[790, 1060]} w={330} ar={4 / 5} k={win(t, tS - 0.2, l[2].s + 0.5, 0.3)} t={t} caption="سورنا" rot={2} />);
  }

  // ---- battlefield (L2 → L5) ----
  const bf = win(t, l[2].s + 0.6, l[6].s + 0.9, 0.4);
  if (bf > 0) {
    const tCol = Wd(5, "فروپاشید", 0.45);
    const col = lin(t, tCol, tCol + 2.4);
    const U = 1.55 * k; // unit scale on screen
    // Roman hollow square, 4 sides x 3 blocks
    const side = 230;
    for (let s = 0; s < 4; s++) for (let j = 0; j < 3; j++) {
      const a = (s * Math.PI) / 2, off = (j - 1) * 96, id = s * 3 + j;
      const tight = 1.12 - 0.12 * ramp(t, l[3].s, l[3].s + 2);
      let x = (Math.cos(a) * side / 2 - Math.sin(a) * off) * tight, y = (Math.sin(a) * side / 2 + Math.cos(a) * off) * tight;
      x += col * (rnd(id) - 0.5) * 260; y += col * (-200 - rnd(id + 9) * 260);
      els.push(<Unit t={t} key={"lg" + id} p={S(x, y)} k={bf * (1 - col * 0.55)} color={WINE} w={54 * U} h={32 * U} rot={(s % 2) * 90} gray={col * 0.8} />);
    }
    const tEnd = Wd(5, "اسارت", 0.85);
    const cp = S(col * 20, -col * 330);
    els.push(<Dot key="cr" p={cp} k={bf * ramp(t, l[2].s + 1.2, l[2].s + 1.8) * (1 - ramp(t, tEnd, tEnd + 0.8))} color={WINE} r={12} />);
    els.push(<Label key="crl" p={cp} text="کراسوس" k={bf * ramp(t, l[2].s + 1.4, l[2].s + 2) * (1 - ramp(t, tEnd, tEnd + 0.8))} size={32} dy={-36} />);

    // L2: hidden army in dust, drums, armour reveal
    const tDrum = Wd(2, "طبل", 0.45), tShine = Wd(2, "زره", 0.6);
    const reveal = ramp(t, tShine - 0.1, tShine + 0.5);
    const nA = 14, tP = Wd(5, "پسر", 0.05), tTrap = Wd(5, "فریب", 0.25);
    for (let i = 0; i < nA; i++) {
      const orbit = ramp(t, l[3].s, l[3].s + 1.2);
      const ang = (i / nA) * Math.PI * 2 + orbit * (t - l[3].s) * 0.35;
      const feint = Math.max(0, Math.sin((t - l[3].s) * 2.2 + i)) * 70 * orbit;
      const r = 420 - 60 * orbit + feint;
      let x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      const ax = 330 + (i % 3) * 75, ay = (i - nA / 2) * 60;
      x = x * orbit + ax * (1 - orbit); y = y * orbit + ay * (1 - orbit);
      if (i < 6) {
        const lure = ramp(t, tP, tTrap), close = ramp(t, tTrap, tTrap + 1.2), ta = (i / 6) * Math.PI * 2;
        const tx = 700 + 280 * lure + Math.cos(ta) * 120 * close, ty = -60 + Math.sin(ta) * 120 * close, m = ramp(t, tP - 0.3, tP + 0.3);
        x = x * (1 - m) + tx * m; y = y * (1 - m) + ty * m;
      }
      const cat = i % 5 === 0;
      els.push(<Unit t={t} key={"ar" + i} p={S(x, y)} k={bf * (0.2 + 0.8 * reveal)} color={cat ? "#d9a441" : GOLD} w={(cat ? 50 : 40) * U} h={(cat ? 30 : 22) * U} mark="horse" />);
    }
    const dust = bf * (1 - reveal) * ramp(t, l[2].s + 0.6, l[2].s + 1.2);
    if (dust > 0) for (let i = 0; i < 7; i++) {
      const p = S(430 + rnd(i) * 120 + reveal * 200, (i - 3) * 110);
      els.push(<div key={"du" + i} style={{ position: "absolute", left: p[0] - 170 * k, top: p[1] - 115 * k, width: 340 * k, height: 230 * k, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(222,196,150,.96), rgba(222,196,150,0))", opacity: dust, filter: `blur(${8 * k}px)` }} />);
    }
    [0, 0.35, 0.7].forEach((d, j) => {
      const p = lin(t, tDrum + d, tDrum + d + 0.9);
      if (p > 0 && p < 1) { const q = S(450, 0); svg.push(<circle key={"dr" + j} cx={q[0]} cy={q[1]} r={(60 + 520 * eout(p)) * k} fill="none" stroke={GOLD} strokeWidth={8 * (1 - p)} opacity={(1 - p) * bf} />); }
    });
    const g = lin(t, tShine, tShine + 0.7);
    if (g > 0 && g < 1) { const q = S(450, 0); els.push(<div key="gl" style={{ position: "absolute", left: q[0] - 300 * k, top: q[1] - 450 * k, width: 600 * k, height: 900 * k, background: `linear-gradient(110deg, transparent ${g * 100 - 20}%, rgba(255,240,200,.7) ${g * 100}%, transparent ${g * 100 + 20}%)`, mixBlendMode: "screen" }} />); }
    els.push(<Card key="b2" y={205} k={win(t, tDrum - 0.2, l[3].s + 0.3, 0.25)} text="غافلگیری اشکانی" sub="طبل‌ها، بعد برق زره‌ها" />);
    els.push(<Photo key="p3" src="03-reveal" c={[W / 2, 500]} w={640} k={win(t, tShine - 0.1, l[3].s + 0.4, 0.3)} t={t} anchor={S(400, 0)} caption="کاتافراکت‌های اشکانی" />);

    // L3–L5: arrow storm
    const storm = ramp(t, l[3].s + 0.4, l[3].s + 1.2) * (1 - ramp(t, tCol + 1.5, tCol + 2.4));
    if (storm > 0) for (let i = 0; i < 48; i++) {
      const per = 0.9 + rnd(i) * 0.5, ph = ((t + rnd(i + 3) * per) % per) / per;
      const ang = rnd(i + 7) * Math.PI * 2 + t * 0.35;
      const from = [Math.cos(ang) * 400, Math.sin(ang) * 400], to = [(rnd(i + 11) - 0.5) * 220, (rnd(i + 13) - 0.5) * 220];
      const x = from[0] + (to[0] - from[0]) * ph, y = from[1] + (to[1] - from[1]) * ph, a = Math.atan2(to[1] - from[1], to[0] - from[0]);
      const p1 = S(x, y), p2 = S(x - Math.cos(a) * 34, y - Math.sin(a) * 34);
      svg.push(<line key={"ao" + i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={INK} strokeWidth={3.5 * k + 0.5} strokeLinecap="round" opacity={storm * Math.sin(ph * Math.PI)} />);
    }
    const tBack = Wd(3, "عقب", 0.5);
    els.push(<Card key="b3" y={205} k={win(t, tBack - 0.2, l[4].s + 0.2, 0.25)} text="تیر پارتی" sub="عقب‌نشینی، و تیر به پشت سر" />);
    const fr = win(t, tBack, l[4].s, 0.2);
    if (fr > 0) {
      const a1 = S(330, -260), a2 = S(560, -420);
      svg.push(<g key="fr" opacity={fr}><Arrow a={a1} b={a2} p={ramp(t, tBack, Wd(3, "پشت", 0.8))} color={GOLD} w={7} dash /></g>);
      svg.push(<g key="frb" opacity={fr}><Arrow a={a2} b={S(120, -100)} p={ramp(t, Wd(3, "پشت", 0.75), Wd(3, "پشت", 0.75) + 0.5)} color={CREAM} w={5} bend={0.04} /></g>);
    }
    els.push(<Photo key="p4" src="04-parthian-shot" c={[W / 2, 500]} w={640} k={win(t, l[3].s + 0.6, tBack - 0.1, 0.3)} t={t} caption="کمانداران سواره" />);

    // L4: camel caravan from the east
    const cm = win(t, l[4].s, l[5].s + 0.6, 0.3);
    if (cm > 0) {
      const tC = Wd(4, "شتر", 0.55), p = ramp(t, tC - 0.5, tC + 1.6);
      for (let i = 0; i < 8; i++) els.push(<Unit t={t} key={"cm" + i} p={S(1050 - 420 * p + i * 46, 240 + (i % 2) * 34 + i * 8)} k={cm} color="#e2c48a" w={34 * U} h={24 * U} mark="camel" />);
      for (let i = 0; i < 6; i++) {
        const q = lin(t, tC + 0.8 + i * 0.18, tC + 1.6 + i * 0.18), ang = -0.6 + i * 0.5;
        if (q > 0 && q < 1) svg.push(<g key={"bd" + i}><Arrow a={S(640, 260)} b={S(Math.cos(ang) * 400, Math.sin(ang) * 400)} p={eout(q)} color={CREAM} w={4} bend={0.08} /></g>);
      }
      els.push(<Card key="b4" y={205} k={win(t, tC - 0.2, l[5].s + 0.3, 0.25)} text="تیرها تمام نمی‌شوند" sub="کاروان شترهای حامل مهمات" />);
      els.push(<Photo key="p5" src="05-camels" c={[W / 2, 500]} w={640} k={win(t, tC + 0.1, l[5].s + 0.2, 0.3)} t={t} anchor={S(700, 260)} caption="شترهای سورنا" />);
    }

    // L5: Publius breaks out and is trapped
    const tDead = Wd(5, "کشته", 0.4);
    const pub = win(t, tP, tCol + 0.6, 0.2);
    if (pub > 0) {
      const run = eio(lin(t, tP, tTrap + 0.3));
      for (let j = 0; j < 3; j++) els.push(<Unit t={t} key={"pb" + j} p={S(140 + 620 * run + (j - 1) * 10, -60 + (j - 1) * 46)} k={pub * (1 - 0.6 * ramp(t, tDead, tDead + 0.6))} color={WINE} w={54 * U} h={32 * U} gray={ramp(t, tDead, tDead + 0.5)} />);
      svg.push(<g key="pba" opacity={pub * (1 - ramp(t, tTrap, tTrap + 0.4))}><Arrow a={S(150, -60)} b={S(700, -60)} p={run} color={WINE} w={7} dash bend={0.03} /></g>);
      const ring = ramp(t, tTrap, tTrap + 1.0);
      if (ring > 0) { const q = S(760, -60); svg.push(<circle key="trap" cx={q[0]} cy={q[1]} r={(260 - 110 * ring) * k} fill="none" stroke={GOLD} strokeWidth={5} strokeDasharray="18 12" opacity={pub * ring} />); }
      els.push(<Label key="pbl" p={S(140 + 620 * run, -60)} text="پوبلیوس" sub="پسر کراسوس" k={pub * (1 - ramp(t, tDead, tDead + 0.4))} size={32} dy={-70} />);
      els.push(<Card key="b5" y={205} k={win(t, tTrap - 0.1, tCol - 0.1, 0.2)} text="دام مرگبار" tone="red" sub="عقب‌نشینی ساختگی" />);
    }
    const rt = win(t, tCol, l[6].s + 0.8, 0.3);
    if (rt > 0) {
      const hp = toScreen(c, ...P.carrhae);
      svg.push(<g key="ret" opacity={rt}><Arrow a={S(0, -120)} b={[hp[0], hp[1] + 30]} p={ramp(t, tCol + 0.3, tCol + 1.6)} color={WINE} w={7} dash /></g>);
      els.push(<Dot key="hd2" p={hp} k={rt} color={RED} r={12} />);
      els.push(<Label key="hr2" p={hp} text="حرّان" k={rt} size={40} dy={-44} />);
      els.push(<Card key="b6" y={205} k={win(t, tCol + 0.1, Wd(5, "خود", 0.7), 0.2)} text="فروپاشی روم" tone="red" sub="عقب‌نشینی شبانه به حرّان" />);
      els.push(<Card key="b7" y={205} k={win(t, Wd(5, "خود", 0.7), l[6].s + 0.4, 0.2)} text="پایان کراسوس" tone="red" />);
      els.push(<Photo key="p6" src="02-crassus" c={[W / 2, 1040]} w={360} ar={4 / 5} k={win(t, Wd(5, "خود", 0.7), l[6].s + 0.3, 0.25)} t={t} caption="کراسوس" gray={ramp(t, tEnd - 0.2, tEnd + 0.4)} />);
    }
  }

  // ---- L6: Surena and his own king ----
  const s6 = win(t, l[6].s + 0.3, l[7].s + 0.4, 0.3);
  if (s6 > 0) {
    const tEx = Wd(6, "اعدام", 0.7), off = ramp(t, tEx, tEx + 0.6);
    const ct = toScreen(c, ...P.ctes);
    els.push(<Dot key="ctd" p={ct} k={s6} color={GOLD} />);
    els.push(<Label key="ctl" p={ct} text="تیسفون" k={s6} size={34} />);
    els.push(<Card key="b8a" k={win(t, l[6].s + 0.2, Wd(6, "سورنا", 0.35), 0.2)} text="عجیب‌ترین قسمت ماجرا…" tone="cream" size={72} />);
    els.push(<Photo key="su" src="01-surena" c={[300, 820]} w={380} ar={4 / 5} k={s6 * ramp(t, Wd(6, "سورنا", 0.35) - 0.2, Wd(6, "سورنا", 0.35) + 0.2)} t={t} caption="سورنا · فاتح حرّان" gray={off} rot={-2} />);
    els.push(<Photo key="or" src="06-orodes" c={[780, 820]} w={380} ar={4 / 5} k={s6 * ramp(t, Wd(6, "پادشاه", 0.6) - 0.2, Wd(6, "پادشاه", 0.6) + 0.2)} t={t} caption="اُرُد دوم، شاه اشکانی" rot={2} />);
    if (off > 0) els.push(<svg key="x" style={{ position: "absolute", left: 300 - 150, top: 820 - 150, width: 300, height: 300, opacity: off * s6 }}><path d="M40 40L260 260M260 40L40 260" stroke={RED} strokeWidth="16" strokeLinecap="round" pathLength={1} strokeDasharray={`${off} 2`} /></svg>);
    els.push(<Card key="b8" k={win(t, tEx - 0.1, l[7].s + 0.4, 0.2)} text="اعدام سورنا" tone="red" sub="به دستور پادشاه خودش" y={330} />);
  }

  // ---- why Surena was executed (Plutarch, Crassus 33; Iranica): from «اعدام» until the question cards ----
  const tWhy = Wd(6, "اعدام", 0.7) + 0.15, why = win(t, tWhy, Wd(7, "خارجی", 0.55) + 0.5, 0.3);
  if (why > 0) {
    els.push(
      <div key="why" style={{ position: "absolute", left: W / 2, top: 1165, width: 900, transform: `translate(-50%,-50%) translateY(${(1 - why) * 24}px)`, opacity: why, padding: "16px 34px 22px", background: "linear-gradient(180deg, rgba(26,16,10,.95), rgba(14,8,5,.95))", border: `2px solid ${GOLD2}`, outline: "1px solid rgba(232,176,75,.35)", outlineOffset: 6, boxShadow: "0 18px 44px rgba(0,0,0,.6)", direction: "rtl", textAlign: "center" }}>
        <div style={{ fontFamily: FA_T, fontSize: 50, color: GOLD, lineHeight: 1.3 }}>چرا؟</div>
        <div style={{ fontFamily: FA_UI, fontWeight: 700, fontSize: 36, color: CREAM, lineHeight: 1.45 }}>
          پیروزی حرّان سورنا را <span style={{ color: GOLD }}>محبوب‌تر و قدرتمندتر</span> از شاه کرد؛ اُرُد ترسید تاج‌وتختش را از دست بدهد.
        </div>
      </div>,
    );
  }

  // ---- L7: question ----
  const q = ramp(t, l[7].s, l[7].s + 0.5);
  if (q > 0) {
    const a = ramp(t, Wd(7, "خارجی", 0.55) - 0.2, Wd(7, "خارجی", 0.55) + 0.2), b = ramp(t, Wd(7, "خودی", 0.85) - 0.2, Wd(7, "خودی", 0.85) + 0.2);
    els.push(<Card key="qq" k={q} text="کدوم خطرناک‌تره؟" tone="cream" size={74} y={330} />);
    els.push(<Photo key="qa" src="02-crassus" c={[780, 820]} w={360} ar={4 / 5} k={a} t={t} caption="دشمن خارجی؟" />);
    els.push(<Photo key="qb" src="06-orodes" c={[300, 820]} w={360} ar={4 / 5} k={b} t={t} caption="پادشاه خودی؟" />);
    els.push(<div key="ya" style={{ position: "absolute", left: W / 2, top: 820, transform: "translate(-50%,-50%)", fontFamily: FA_T, fontSize: 80, color: GOLD, textShadow: SH, opacity: b }}>یا</div>);
    els.push(<Chip key="cm" x={W / 2} y={1150} k={ramp(t, l[7].e - 0.3, l[7].e + 0.2)} size={40}>نظرت رو کامنت کن</Chip>);
  }

  return (
    <AbsoluteFill style={{ background: "#c8b48c" }}>
      <MapBg c={c} dim={0.38 * q} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{svg}</svg>
      {els}
      <Captions t={t} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: "Arial", fontSize: 17, color: "rgba(255,255,255,.75)", textShadow: "0 1px 3px #000" }}>Map: Sentinel-2 cloudless 2016 by EOX (CC BY 4.0)</div>
      {!silent && <Html5Audio src={staticFile("v44/mix.wav")} />}
    </AbsoluteFill>
  );
};
