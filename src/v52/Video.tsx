import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import IRAN from "./iran.json";
import MG from "./mapgeo.json";
import VO from "./vo.json";

// v52 · Agarlogy · «۵ چیزی که فکر می‌کنی ایرانیه، ولی نیست»: the look of v33/v38 (satellite map + brown/gold card),
// but the gold threads run the other way: from where each thing really comes from (China, the Andes, America, India) INTO Iran.
// The map is wider than v03 (tools/v52-map.cjs, 110°W → 125°E, 56°N → 28°S); when the camera zooms out past the screen
// height the map closes into a band with gold edges (like the v33 ending). Self-contained for the GitHub render.
export const V52_FPS = 30;
const LINES = VO.lines as { n: number; text: string; s: number; e: number }[];
const TOTAL = VO.total + 1.5; // hold the end a little
export const V52_FRAMES = Math.ceil((TOTAL + 0.2) * V52_FPS);
const SW = 1080, SH = 1920;

const FA_T = "Estedad", FA_UI = "Vazirmatn", TAG = "Chakra Petch";
if (typeof window !== "undefined") {
  const h = delayRender("v52 fonts");
  Promise.all(
    ([
      [FA_UI, "fonts/Vazirmatn-Bold.ttf", { weight: "700" }],
      [FA_UI, "fonts/Vazirmatn-Black.ttf", { weight: "900" }],
      [FA_T, "fonts/Estedad-Black.woff2", { weight: "900" }],
      [TAG, "fonts/ChakraPetch-SemiBold.ttf", { weight: "600" }],
    ] as [string, string, FontFaceDescriptors][]).map(([f, u, d]) =>
      new FontFace(f, `url('${staticFile(u)}')`, d).load().then((ff) => document.fonts.add(ff)),
    ),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}

/* ---------- palette (series 15–31) ---------- */
const GOLD = "#F2B860", INK = "#FBEBCB";
const goldText: React.CSSProperties = {
  background: "linear-gradient(180deg,#FFE2A6 0%,#F2B860 55%,#A8692A 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  filter: "drop-shadow(0 4px 12px rgba(0,0,0,.6))",
};

/* ---------- time ---------- */
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const WHIP = Easing.bezier(0.8, 0, 0.2, 1);
const LIN = (x: number) => x;
const BACK = Easing.out(Easing.back(1.8));
const ramp = (t: number, a: number, b: number, e: (x: number) => number = OUT) => (b <= a ? (t >= a ? 1 : 0) : e(cl((t - a) / (b - a))));
const win = (t: number, a: number, b: number, fi = 0.3, fo = 0.25) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, IO));
const FA = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const clean = (s: string) => s.replace(/[ً-ْ]/g, "");
const S = (n: number) => LINES[n].s;
const E = (n: number) => LINES[n].e;
const NEXT = (n: number) => (LINES[n + 1] ? LINES[n + 1].s : TOTAL);
/** time of a word inside a line, by its letter position (line times come from the take's pauses, no STT) */
const Wd = (n: number, w: string, nth = 0) => {
  const tx = clean(LINES[n].text);
  let i = -1;
  for (let k = 0; k <= nth; k++) i = tx.indexOf(w, i + 1);
  if (i < 0) throw new Error(`v52 Wd: "${w}" not in line ${n}`);
  return S(n) + (E(n) - S(n)) * (i / tx.length);
};
const wob = (t: number, seed: number) => 0.6 * Math.sin(t * 0.9 + seed) + 0.4 * Math.sin(t * 0.53 + seed * 2.1);

/* ---------- map ---------- */
const MAP_W = MG.W, MAP_H = MG.H;
type LL = [number, number];
type Pt = { x: number; y: number };
const proj = (lon: number, lat: number): Pt => {
  let e = lon - MG.LON0;
  while (e < -60) e += 360;
  while (e >= 300) e -= 360;
  return { x: e * MG.PPD, y: MG.YTOP - MG.R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) };
};
// the Iran outline was traced on the v03 map (LON0 230, YTOP 3589.74): same scale, only shifted
const IRAN_SHIFT = { x: (230 - MG.LON0) * MG.PPD, y: MG.YTOP - 3589.742228192563 };
const C: Record<string, LL> = {
  tehran: [51.39, 35.69], shiraz: [52.53, 29.59], isfahan: [51.67, 32.65], tabriz: [46.29, 38.08], mashhad: [59.6, 36.3],
  lahijan: [50.0, 37.2], gilan: [49.4, 37.0], iran: [54.2, 32.6],
  yangtze: [114.3, 30.6], ganges: [83.0, 25.3], andes: [-72.0, -13.5], mexico: [-99.1, 19.4], india: [77.2, 28.6],
  yunnan: [101.0, 24.0], darjeeling: [88.3, 27.0],
};
const mp = (c: string) => proj(C[c][0], C[c][1]);

/* ---------- the five things ---------- */
type An = "u" | "d" | "l" | "r";
type Pin = { c: string; label: string; an: An; t: number; big?: boolean; until?: number };
type Hop = { a: string; b: string; t0: number; dur: number };
type RowD = { label: string; at: number; val: (t: number) => React.ReactNode };
type Item = { line: number; name: string; pins: Pin[]; hops: Hop[]; rows: RowD[]; icon: (t: number, k: number) => React.ReactNode };
const G: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: GOLD }}>{children}</span>;
const count = (t: number, at: number, from: number, to: number, step = 1) =>
  FA(Math.round((from + (to - from) * ramp(t, at, at + 1.0, Easing.out(Easing.cubic))) / step) * step);

const hopEnd = (h: Hop) => h.t0 + h.dur;
const H_RICE1: Hop = { a: "yangtze", b: "ganges", t0: Wd(1, "راه") - 0.45, dur: 0.6 };
const H_RICE2: Hop = { a: "ganges", b: "gilan", t0: Wd(1, "ایران", 1) - 0.5, dur: 0.75 };
const H_POTATO: Hop = { a: "andes", b: "tehran", t0: Wd(2, "حدود") - 0.1, dur: 1.15 };
const H_TOMATO: Hop = { a: "mexico", b: "tehran", t0: Wd(3, "قرن") - 0.4, dur: 0.95 };
const H_CHESS: Hop = { a: "india", b: "tehran", t0: Wd(4, "ایرانی") - 0.4, dur: 0.7 };
const H_TEA: Hop = { a: "darjeeling", b: "lahijan", t0: Wd(5, "آورد") - 0.4, dur: 0.8 };

const ITEMS: Item[] = [
  {
    line: 1, name: "برنج", icon: (t, k) => <IcoRice t={t} k={k} />,
    pins: [
      { c: "gilan", label: "شالیزارهای گیلان", an: "u", t: S(1) + 0.3, until: Wd(1, "چینه") - 0.5 },
      { c: "yangtze", label: "رود یانگ‌تسه، چین", an: "u", t: Wd(1, "چینه") - 0.05 },
      { c: "ganges", label: "هند", an: "d", t: hopEnd(H_RICE1) },
      { c: "gilan", label: "ایران", an: "u", t: hopEnd(H_RICE2), big: true },
    ],
    hops: [H_RICE1, H_RICE2],
    rows: [
      { label: "اصلش:", at: Wd(1, "چینه") - 0.05, val: () => "چین" },
      { label: "رسید ایران:", at: Wd(1, "بیشتر"), val: (t) => <>بیش از <G>{count(t, Wd(1, "بیشتر"), 0, 2000, 10)}</G> سال پیش</> },
      { label: "از راه:", at: Wd(1, "راه") - 0.1, val: () => "هند" },
    ],
  },
  {
    line: 2, name: "سیب‌زمینی", icon: (t, k) => <IcoPotato t={t} k={k} />,
    pins: [
      { c: "andes", label: "آند، پرو", an: "u", t: Wd(2, "آند") - 0.05 },
      { c: "tehran", label: "دربار قاجار", an: "l", t: hopEnd(H_POTATO), until: Wd(2, "لقب") + 0.1 },
      { c: "tehran", label: "«آلوی مالکوم»", an: "l", t: Wd(2, "لقب") + 0.05, big: true },
      { c: "shiraz", label: "آلو", an: "d", t: Wd(2, "شیرازیا") + 0.1, big: true },
    ],
    hops: [H_POTATO],
    rows: [
      { label: "اصلش:", at: Wd(2, "آند") - 0.05, val: () => "آندِ آمریکای جنوبی" },
      { label: "رسید ایران:", at: Wd(2, "حدود"), val: (t) => <>حدود <G>{count(t, Wd(2, "حدود"), 0, 200, 10)}</G> سال پیش</> },
      { label: "لقب:", at: Wd(2, "لقب") + 0.05, val: () => "آلوی مالکوم" },
    ],
  },
  {
    line: 3, name: "گوجه‌فرنگی", icon: (t, k) => <IcoTomato t={t} k={k} />,
    pins: [
      { c: "mexico", label: "مکزیک", an: "r", t: Wd(3, "آمریکا") - 0.05 },
      { c: "tehran", label: "قرن نوزدهم", an: "l", t: hopEnd(H_TOMATO), big: true },
    ],
    hops: [H_TOMATO],
    rows: [
      { label: "اصلش:", at: Wd(3, "آمریکا") - 0.05, val: () => "قاره‌ی آمریکا" },
      { label: "رسید ایران:", at: Wd(3, "قرن") - 0.05, val: (t) => <>قرن <G>{count(t, Wd(3, "قرن") - 0.05, 0, 19)}</G></> },
    ],
  },
  {
    line: 4, name: "شطرنج", icon: (t) => <IcoKing t={t} check={ramp(t, Wd(4, "کیش") - 0.05, Wd(4, "کیش") + 0.25)} />,
    pins: [
      { c: "india", label: "چَتورَنگا", an: "u", t: Wd(4, "هند") - 0.05, big: true },
      { c: "tehran", label: "چَترَنگ", an: "u", t: hopEnd(H_CHESS), big: true },
      { c: "tehran", label: "کیش!", an: "d", t: Wd(4, "کیش") - 0.05, big: true },
    ],
    hops: [H_CHESS],
    rows: [
      { label: "اصلش:", at: Wd(4, "هند") - 0.05, val: () => "هند" },
      { label: "اسم ایرانی:", at: Wd(4, "چترنگش") - 0.05, val: () => "چَترَنگ" },
      { label: "اضافه‌ی ما:", at: Wd(4, "کیش") - 0.05, val: () => <G>کیش!</G> },
    ],
  },
  {
    line: 5, name: "چای", icon: (t, k) => <IcoTea t={t} k={k} />,
    pins: [
      { c: "yunnan", label: "چین", an: "u", t: Wd(5, "چینه") - 0.05, big: true },
      { c: "lahijan", label: "تا ۱۲۷۹ کاشته نمی‌شد", an: "u", t: Wd(5, "ایران") + 0.1, until: Wd(5, "کاشف") + 0.2 },
      { c: "darjeeling", label: "هند", an: "u", t: Wd(5, "هند") - 0.05 },
      { c: "lahijan", label: "لاهیجان", an: "u", t: Math.max(hopEnd(H_TEA), Wd(5, "لاهیجان") - 0.05), big: true },
    ],
    hops: [H_TEA],
    rows: [
      { label: "اصلش:", at: Wd(5, "چینه") - 0.05, val: () => "چین" },
      { label: "کاشت در ایران:", at: Wd(5, "هزار"), val: (t) => <G>{count(t, Wd(5, "هزار"), 1200, 1279)}</G> },
      { label: "نهال:", at: Wd(5, "نهال") - 0.05, val: () => "از هند تا لاهیجان" },
    ],
  },
];
const N = ITEMS.length;
const LAST = LINES.length - 1;

/* hook: the five things sit on Iran like a sofreh, then on «ولی نیست» each one flies off towards where it really comes from */
const T_NOT = Wd(0, "ولی") - 0.05;
const HOOK: { c: string; name: string; an: An; t: number; to: string }[] = [
  { c: "lahijan", name: "چای", an: "u", t: 0.1, to: "yunnan" },
  { c: "tabriz", name: "گوجه‌فرنگی", an: "d", t: 0.32, to: "mexico" },
  { c: "mashhad", name: "برنج", an: "u", t: 0.54, to: "yangtze" },
  { c: "isfahan", name: "شطرنج", an: "d", t: 0.76, to: "india" },
  { c: "shiraz", name: "سیب‌زمینی", an: "d", t: 0.98, to: "andes" },
];
/* the end: the whole map in a band, every thread running into Iran */
const FINAL: { c: string; name: string; dx: number; dy: number }[] = [
  { c: "mexico", name: "گوجه‌فرنگی", dx: 150, dy: -78 },
  { c: "andes", name: "سیب‌زمینی", dx: 70, dy: 62 },
  { c: "india", name: "شطرنج", dx: -30, dy: 84 },
  { c: "yangtze", name: "برنج", dx: -62, dy: -76 },
  { c: "yunnan", name: "چای", dx: 0, dy: 92 },
];
const T_FIN = S(LAST) + 0.1;

/* ---------- camera (map px). Zooming out past the screen height closes the map into a band ---------- */
type MCam = { x: number; y: number; s: number };
type Key = MCam & { t: number; e: (u: number) => number };
const FOCUS = { y0: 680, y1: 1230 }; // free band between the card and the captions
const YS = (FOCUS.y0 + FOCUS.y1) / 2;
const SFLOOR = SW / MAP_W;
const TOP_SLACK = 330;
const frame = (pts: Pt[], t: number, e: (u: number) => number, sMax: number, padX = 150): Key => {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const sc = Math.max(SFLOOR, Math.min(sMax, (SW - 2 * padX) / Math.max(w, 1), (FOCUS.y1 - FOCUS.y0 - 120) / Math.max(h, 1)));
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return { t, x: cx, y: cy - (YS - SH / 2) / sc, s: sc, e };
};
const hold = (k: Key, t: number, z = 1.04): Key => ({ ...k, t, s: k.s * z, e: LIN });
const KEYS: Key[] = (() => {
  const P = (...cs: string[]) => cs.map(mp);
  const k: Key[] = [];
  const add = (...ks: Key[]) => k.push(...ks);
  // hook
  const k0 = frame(P("tabriz", "mashhad", "shiraz", "lahijan"), 0, LIN, 1.45);
  add(k0, hold(k0, T_NOT), frame(P("iran"), T_NOT + 0.85, IO, 0.62));
  // rice: Gilan → whip to China → China, India, Iran
  const r0 = frame(P("gilan"), S(1) + 0.12, WHIP, 1.3);
  const r1 = frame(P("yangtze"), Wd(1, "چینه") + 0.05, WHIP, 1.2);
  const r2 = frame(P("yangtze", "ganges", "gilan"), hopEnd(H_RICE2) + 0.15, IO, 1.0);
  add(r0, hold(r0, Wd(1, "چینه") - 0.55), r1, hold(r1, H_RICE1.t0 - 0.05), r2, hold(r2, NEXT(1) - 0.32));
  // potato: the Andes → over the Atlantic to Tehran → Tehran + Shiraz
  const p0 = frame(P("andes"), S(2) + 0.12, WHIP, 1.15);
  const p1 = frame(P("andes", "tehran"), hopEnd(H_POTATO) + 0.1, IO, 1.0);
  const p2 = frame(P("tehran", "shiraz"), Wd(2, "شیرازیا") + 0.1, IO, 1.35);
  add(p0, hold(p0, H_POTATO.t0 - 0.1), p1, hold(p1, Wd(2, "برای") - 0.1, 1.03), p2, hold(p2, NEXT(2) - 0.32));
  // tomato: Mexico → Tehran
  const m0 = frame(P("mexico"), S(3) + 0.12, WHIP, 1.15);
  const m1 = frame(P("mexico", "tehran"), hopEnd(H_TOMATO) + 0.1, IO, 1.0);
  add(m0, hold(m0, H_TOMATO.t0 - 0.1), m1, hold(m1, NEXT(3) - 0.32));
  // chess: India → Iran → push in on «کیش»
  const c0 = frame(P("india"), S(4) + 0.12, WHIP, 1.3);
  const c1 = frame(P("india", "tehran"), hopEnd(H_CHESS) + 0.1, IO, 1.2);
  const c2 = frame(P("tehran"), Wd(4, "کیش") + 0.25, IO, 1.6);
  add(c0, hold(c0, H_CHESS.t0 - 0.1), c1, hold(c1, Wd(4, "کیش") - 0.35, 1.02), c2, hold(c2, NEXT(4) - 0.32));
  // tea: China → Lahijan («تا ۱۲۷۹ کاشته نمی‌شد») → India and Lahijan
  const t0 = frame(P("yunnan"), S(5) + 0.12, WHIP, 1.2);
  const t1 = frame(P("lahijan"), Wd(5, "ایران") + 0.15, WHIP, 1.35);
  const t2 = frame(P("darjeeling", "lahijan"), hopEnd(H_TEA) + 0.1, IO, 1.0);
  add(t0, hold(t0, Wd(5, "ایران") - 0.4), t1, hold(t1, Wd(5, "کاشف") - 0.25), t2, hold(t2, NEXT(5) - 0.32));
  // the end
  const fin = FINAL.map((f) => mp(f.c)).concat(mp("tehran"));
  const f0 = frame(fin, T_FIN + 0.75, IO, 1, 40);
  add(f0, hold(f0, TOTAL, 1.03));
  return k.sort((a, b) => a.t - b.t);
})();
const keyCam = (t: number): MCam => {
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1].t <= t) i++;
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  if (t <= a.t || a === b) return a;
  const u = b.e(cl((t - a.t) / (b.t - a.t)));
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * u) };
};
/** camera + the box the map lives in (full screen, or a band with gold edges when zoomed out) */
const view = (t: number) => {
  const k = keyCam(t);
  const s = Math.max(k.s, SFLOOR);
  const h = Math.min(SH, MAP_H * s);
  const top = (SH - h) / 2;
  const hw = SW / 2 / s, hh = h / 2 / s;
  // full screen: the map's top edge (56°N) may come down behind the card (≤ TOP_SLACK px), so northern places can still sit in the free band
  const slack = h >= SH ? TOP_SLACK / s : 0;
  return { cam: { s, x: cl(k.x, hw, MAP_W - hw), y: cl(k.y, Math.min(hh - slack, MAP_H - hh), MAP_H - hh) }, h, top };
};

/* ---------- component ---------- */
export const V52: React.FC<{ silent?: boolean; times?: number[] }> = ({ silent = false, times }) => {
  const f = useCurrentFrame();
  const t = times ? times[f] ?? 0 : f / V52_FPS;
  const { cam, h, top } = view(t);
  const nx = view(t + 1 / V52_FPS).cam;
  const vel = Math.hypot(nx.x - cam.x, nx.y - cam.y) * cam.s + Math.abs(Math.log(nx.s / cam.s)) * 900;
  const blur = Math.min(20, Math.max(0, vel - 7) * 0.22);
  const dr = { x: 6 * wob(t * 0.15, 1), y: 6 * wob(t * 0.15, 4) };
  const atP = (p: Pt): Pt => ({ x: SW / 2 + (p.x - cam.x) * cam.s + dr.x, y: top + h / 2 + (p.y - cam.y) * cam.s + dr.y });
  const at = (c: string): Pt => atP(mp(c));

  type Ch = { key: string; p: Pt; text: string; an: An | "c"; k: number; big: number };
  const chips: Ch[] = [];
  const dots: { p: Pt; k: number; pulse: number }[] = [];
  const arcs: { a: Pt; b: Pt; p: number; alpha: number }[] = [];
  let iran = 0.25 + 0.1 * Math.sin(t * 2.2);

  // hook: the five things on Iran, then each flies off towards home on «ولی نیست»
  if (t < S(1) + 0.3) {
    HOOK.forEach((hk, i) => {
      const k = ramp(t, hk.t, hk.t + 0.35, BACK);
      const go = ramp(t, T_NOT + i * 0.06, T_NOT + 0.75 + i * 0.06, Easing.in(Easing.cubic));
      const p0 = at(hk.c), far = at(hk.to);
      const dx = far.x - p0.x, dy = far.y - p0.y, L = Math.hypot(dx, dy) || 1;
      const p = { x: p0.x + (dx / L) * 900 * go, y: p0.y + (dy / L) * 900 * go };
      const fade = 1 - ramp(t, T_NOT + 0.45 + i * 0.06, T_NOT + 0.8 + i * 0.06);
      if (k * fade > 0.01) chips.push({ key: `h${i}`, p, text: hk.name, an: hk.an, k: k * fade, big: 1 });
      const dk = ramp(t, hk.t, hk.t + 0.2) * (1 - ramp(t, T_NOT + 0.6, T_NOT + 1.0));
      if (dk > 0.01) dots.push({ p: p0, k: dk, pulse: (t - hk.t) / 0.8 });
      if (go > 0.02) arcs.push({ a: p0, b: p, p: 1, alpha: 0.9 * (1 - ramp(t, T_NOT + 0.7, T_NOT + 1.1)) });
    });
    iran += 0.6 * ramp(t, 0, 0.4) * (1 - ramp(t, T_NOT, T_NOT + 0.6));
  }
  // items: pins + threads into Iran
  ITEMS.forEach((it, ii) => {
    const segA = win(t, S(it.line) - 0.05, NEXT(it.line) - 0.15, 0.3, 0.3);
    if (segA <= 0.005) return;
    it.hops.forEach((hp) => {
      const p = ramp(t, hp.t0, hp.t0 + hp.dur, IO);
      if (p > 0) arcs.push({ a: at(hp.a), b: at(hp.b), p, alpha: segA * (p < 1 ? 1 : 0.8) });
      if (["gilan", "tehran", "lahijan"].includes(hp.b)) iran += 0.7 * ramp(t, hopEnd(hp) - 0.1, hopEnd(hp) + 0.2) * (1 - ramp(t, hopEnd(hp) + 0.8, hopEnd(hp) + 1.8)) * segA;
    });
    it.pins.forEach((pn, pi) => {
      const a = pn.until ? Math.min(segA, 1 - ramp(t, pn.until - 0.25, pn.until, IO)) : segA;
      if (a <= 0.01) return;
      const k = ramp(t, pn.t, pn.t + 0.35, BACK) * a;
      if (k > 0.01) chips.push({ key: `p${ii}-${pi}`, p: at(pn.c), text: pn.label, an: pn.an, k, big: pn.big ? 1 : 0 });
      const dk = ramp(t, pn.t - 0.1, pn.t + 0.1) * a;
      if (dk > 0.01) dots.push({ p: at(pn.c), k: dk, pulse: (t - pn.t) / 0.9 });
    });
  });
  // the end: every thread runs into Iran, each thing sits on its real home
  const endA = ramp(t, T_FIN, T_FIN + 0.4);
  const finals = FINAL.map((fn, i) => {
    const t0 = T_FIN + 0.7 + i * 0.16;
    return { ...fn, p: at(fn.c), k: ramp(t, t0 + 0.35, t0 + 0.7, BACK), arc: ramp(t, t0, t0 + 0.75, IO), t0 };
  });
  finals.forEach((fn) => { if (fn.arc > 0) arcs.push({ a: fn.p, b: at("tehran"), p: fn.arc, alpha: 0.95 }); });
  iran = Math.min(1.2, iran + 0.5 * endA);
  const mapTop = top + h / 2 - cam.y * cam.s;
  const edge = (p: Pt) => cl((p.x - 25) / 110) * cl((SW - 25 - p.x) / 110) * cl((p.y - Math.max(560, top, mapTop)) / 120) * cl((Math.min(1460, top + h) - p.y) / 120);
  // a chip hung to the side of its place is judged by where its body is, not by the place
  const body = (c: { p: Pt; an: An | "c" }): Pt => ({ x: c.p.x + (c.an === "r" ? 130 : c.an === "l" ? -130 : 0), y: c.p.y });
  const shown = chips.map((c) => ({ ...c, k: c.k * edge(body(c)) })).filter((c) => c.k > 0.01);
  const band = cl((SH - h) / 160);

  return (
    <AbsoluteFill style={{ background: "#0E0805", overflow: "hidden" }}>
      <MapLayer cam={cam} h={h} top={top} blur={blur}>
        <svg width={MAP_W} height={MAP_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={IRAN.d} transform={`translate(${IRAN_SHIFT.x} ${IRAN_SHIFT.y})`} fill={`rgba(255,196,84,${0.14 + 0.3 * Math.min(1, iran)})`} stroke="#fff"
            strokeWidth={(2.6 / cam.s) * 1.2} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${(2.6 / cam.s) * 3}px rgba(255,196,84,${0.5 + 0.4 * Math.min(1, iran)}))` }} />
        </svg>
      </MapLayer>
      {mapTop > 1 && <div style={{ position: "absolute", left: 0, right: 0, top: mapTop - 2, height: 2, background: "rgba(242,196,110,.85)", boxShadow: "0 0 14px rgba(242,184,96,.5)" }} />}
      {band > 0.01 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: top - 2, height: 2, background: `rgba(242,196,110,${0.85 * band})`, boxShadow: `0 0 14px rgba(242,184,96,${0.5 * band})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: top + h, height: 2, background: `rgba(242,196,110,${0.85 * band})`, boxShadow: `0 0 14px rgba(242,184,96,${0.5 * band})` }} />
        </>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, background: "linear-gradient(180deg, rgba(14,8,5,.66) 0%, rgba(14,8,5,.32) 55%, rgba(14,8,5,0) 100%)" }} />
      <svg width={SW} height={SH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <radialGradient id="v52head"><stop offset="0" stopColor="#fffbe8" /><stop offset=".3" stopColor="rgba(255,206,120,.8)" /><stop offset="1" stopColor="rgba(255,180,80,0)" /></radialGradient>
        </defs>
        {arcs.map((a, i) => <Arc key={i} {...a} />)}
        {shown.map((c) => (c.an === "c" ? null : <Leader key={c.key} p={c.p} an={c.an} k={c.k} />))}
        {finals.map((fn, i) => fn.k > 0.01 && <line key={i} x1={fn.p.x} y1={fn.p.y} x2={fn.p.x + fn.dx * Math.min(1, fn.k)} y2={fn.p.y + fn.dy * Math.min(1, fn.k)} stroke="rgba(255,226,160,.85)" strokeWidth={1.8} opacity={Math.min(1, fn.k)} />)}
        {dots.map((d, i) => <Dot key={i} {...d} />)}
        {finals.map((fn, i) => <Dot key={`fd${i}`} p={fn.p} k={ramp(t, fn.t0 - 0.1, fn.t0 + 0.1)} pulse={(t - fn.t0) / 0.8} />)}
        {endA > 0 && <Dot p={at("tehran")} k={ramp(t, T_FIN + 1.6, T_FIN + 1.9)} pulse={(t - T_FIN - 1.6) / 0.9} />}
      </svg>
      {shown.map(({ key, p, ...c }) => <Chip key={key} x={p.x} y={p.y} {...c} t={t} />)}
      {finals.map((fn, i) => fn.k > 0.01 && <Chip key={`f${i}`} x={fn.p.x + fn.dx} y={fn.p.y + fn.dy} text={fn.name} an="c" k={fn.k} big={1} t={t} />)}
      {endA > 0 && <Chip x={at("tehran").x} y={at("tehran").y - 26} text="ایران" an="u" k={ramp(t, T_FIN + 1.6, T_FIN + 1.95, BACK)} big={0} t={t} />}
      <HookTitle t={t} />
      {ITEMS.map((it, i) => <Card key={it.line} d={it} i={i} t={t} />)}
      <EndTitle t={t} />
      <Logo />
      <Captions t={t} />
      {!silent && !times && <Html5Audio src={staticFile("v52/mix-norm.wav")} />}
    </AbsoluteFill>
  );
};

/* ---------- map layer ---------- */
const MapLayer: React.FC<{ cam: MCam; h: number; top: number; blur: number; children?: React.ReactNode }> = ({ cam, h, top, blur, children }) => (
  <div style={{ position: "absolute", left: 0, top, width: SW, height: h, overflow: "hidden", background: "#0E0805" }}>
    <div style={{
      position: "absolute", left: 0, top: 0, width: MAP_W, height: MAP_H, transformOrigin: "0 0",
      transform: `translate(${SW / 2 - cam.x * cam.s}px, ${h / 2 - cam.y * cam.s}px) scale(${cam.s})`,
      filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined,
    }}>
      <Img src={staticFile("v52/map.jpg")} style={{ position: "absolute", left: 0, top: 0, width: MAP_W, height: MAP_H, maxWidth: "none" }} />
      {children}
    </div>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(14,8,5,.5) 100%)" }} />
  </div>
);
/* gold thread: a lifted curve from a to b, drawn up to p (from v33) */
const Arc: React.FC<{ a: Pt; b: Pt; p: number; alpha: number }> = ({ a, b, p, alpha }) => {
  if (alpha <= 0.01) return null;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  let nx = dy / len, ny = -dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const lift = Math.min(260, len * 0.24);
  const c = { x: (a.x + b.x) / 2 + nx * lift, y: (a.y + b.y) / 2 + ny * lift };
  const q = (v: number) => ({ x: (1 - v) ** 2 * a.x + 2 * (1 - v) * v * c.x + v * v * b.x, y: (1 - v) ** 2 * a.y + 2 * (1 - v) * v * c.y + v * v * b.y });
  const NP = 48, pts: Pt[] = [];
  for (let i = 0; i <= NP; i++) pts.push(q((i / NP) * Math.min(1, p)));
  const d = pts.map((v, i) => `${i ? "L" : "M"}${v.x.toFixed(1)},${v.y.toFixed(1)}`).join("");
  const head = pts[pts.length - 1];
  return (
    <g opacity={alpha}>
      <path d={d} fill="none" stroke="rgba(255,186,84,.22)" strokeWidth={11} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#ffd98f" strokeWidth={3.6} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(255,190,80,.95))" }} />
      {p < 1 && <circle cx={head.x} cy={head.y} r={34} fill="url(#v52head)" />}
    </g>
  );
};
const Dot: React.FC<{ p: Pt; k: number; pulse: number }> = ({ p, k, pulse }) => (k <= 0.01 ? null : (
  <g opacity={Math.min(1, k)}>
    {pulse > 0 && pulse < 1 && <circle cx={p.x} cy={p.y} r={8 + 46 * pulse} fill="none" stroke={`rgba(255,214,140,${1 - pulse})`} strokeWidth={2.5} />}
    <circle cx={p.x} cy={p.y} r={7} fill="#fff4d6" stroke="rgba(120,70,10,.6)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 6px rgba(255,200,100,.95))" }} />
  </g>
));
const Leader: React.FC<{ p: Pt; an: An; k: number }> = ({ p, an, k }) => {
  const d = 24 * Math.min(1, k);
  const [dx, dy] = an === "u" ? [0, -d] : an === "d" ? [0, d] : an === "l" ? [-d, 0] : [d, 0];
  return <line x1={p.x + dx * 0.3} y1={p.y + dy * 0.3} x2={p.x + dx} y2={p.y + dy} stroke="rgba(255,226,160,.9)" strokeWidth={1.8} opacity={Math.min(1, k)} />;
};
/** big = the thing's name (gold Estedad), else a place label; an "c" = centred on (x, y) */
const Chip: React.FC<{ x: number; y: number; text: string; an: An | "c"; k: number; big: number; t: number }> = ({ x, y, text, an, k, big, t }) => {
  const fs = big ? 46 : 34;
  const off = an === "c" ? 0 : 24;
  const [tx, ty, ox, oy] = an === "u" ? ["-50%", "-100%", 0, -off] : an === "d" ? ["-50%", "0%", 0, off] : an === "l" ? ["-100%", "-50%", -off, 0] : an === "r" ? ["0%", "-50%", off, 0] : ["-50%", "-50%", 0, 0];
  return (
    <div dir="rtl" style={{
      position: "absolute", left: x + ox, top: y + oy + 3 * Math.sin(t * 1.7 + x * 0.01),
      transform: `translate(${tx}, ${ty}) translateY(${(1 - Math.min(1, k)) * 14}px) scale(${0.7 + 0.3 * k})`,
      transformOrigin: an === "u" ? "50% 100%" : an === "d" ? "50% 0%" : an === "l" ? "100% 50%" : an === "r" ? "0% 50%" : "50% 50%",
      opacity: Math.min(1, k), whiteSpace: "nowrap", padding: `${fs * 0.12}px ${fs * 0.45}px ${fs * 0.2}px`, borderRadius: fs * 0.38,
      background: "rgba(20,12,6,.86)", border: `1.5px solid rgba(242,184,96,${big ? 0.9 : 0.55})`,
      boxShadow: `0 0 ${big ? 26 : 12}px rgba(255,186,84,${big ? 0.35 : 0.15}), 0 8px 20px rgba(0,0,0,.55)`,
      fontFamily: big ? FA_T : FA_UI, fontWeight: big ? 900 : 700, fontSize: fs, lineHeight: 1.2, color: big ? GOLD : INK,
    }}>{text}</div>
  );
};

/* ---------- titles ---------- */
const HookTitle: React.FC<{ t: number }> = ({ t }) => {
  const a = win(t, -0.2, S(1) - 0.3, 0.3, 0.3);
  if (a <= 0) return null;
  const k1 = ramp(t, -0.2, 0.2, BACK), k2 = ramp(t, 0.05, 0.45, BACK);
  const st = ramp(t, T_NOT - 0.05, T_NOT + 0.2, BACK);
  return (
    <div dir="rtl" style={{ position: "absolute", left: 0, right: 0, top: 236, textAlign: "center", opacity: a, transform: `translateY(${(1 - a) * -30}px)` }}>
      <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 58, color: "#fff", opacity: Math.min(1, k1), transform: `translateY(${(1 - Math.min(1, k1)) * 16}px)`, textShadow: "0 3px 12px rgba(0,0,0,.8)" }}>
        {FA(5)} چیزی که فکر می‌کنی
      </div>
      <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 128, lineHeight: 1.12, transform: `scale(${0.85 + 0.15 * k2})`, ...goldText }}>ایرانیه</div>
      {st > 0.01 && (
        <div style={{
          display: "inline-block", marginTop: 6, padding: "4px 40px 14px", borderRadius: 18,
          background: "linear-gradient(180deg,#FFE2A6 0%,#F2B860 55%,#C98A3F 100%)", boxShadow: "0 10px 30px rgba(0,0,0,.55), 0 0 40px rgba(242,184,96,.45)",
          fontFamily: FA_T, fontWeight: 900, fontSize: 88, lineHeight: 1.2, color: "#1A0F06",
          opacity: Math.min(1, st * 1.5), transform: `rotate(-3deg) scale(${1.6 - 0.6 * st})`,
        }}>ولی نیست</div>
      )}
    </div>
  );
};
/** right-to-left sweep reveal with a typing cursor (Persian letters stay joined) */
const Typed: React.FC<{ t: number; a: number; b: number; off?: number; children: React.ReactNode; style: React.CSSProperties }> = ({ t, a, b, off = 1e9, children, style }) => {
  const k = ramp(t, a, b, LIN);
  if (k <= 0) return null;
  const blink = t >= off ? 0 : k >= 1 ? (Math.floor(t * 2.2) % 2 === 0 ? 1 : 0) : 1;
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      <div style={{ clipPath: `inset(-20% -2% -20% ${(1 - k) * 100}%)` }}>{children}</div>
      <div style={{ position: "absolute", top: "12%", bottom: "8%", width: 6, borderRadius: 3, background: GOLD, left: `calc(${(1 - k) * 100}% - 14px)`, opacity: blink, boxShadow: "0 0 12px rgba(242,184,96,.8)" }} />
    </div>
  );
};
const EndTitle: React.FC<{ t: number }> = ({ t }) => {
  const a0 = S(LAST) - 0.05;
  if (t < a0) return null;
  const box = ramp(t, a0 + 1.2, a0 + 1.6, BACK);
  return (
    <>
      <div dir="rtl" style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center" }}>
        <Typed t={t} a={a0} b={a0 + 0.6} off={a0 + 0.6} style={{ fontFamily: FA_T, fontWeight: 900, fontSize: 104, lineHeight: 1.2, color: GOLD, textShadow: "0 4px 20px rgba(0,0,0,.7), 0 0 50px rgba(242,184,96,.3)" }}>تو چی اضافه می‌کنی؟</Typed>
        <div />
        <Typed t={t} a={a0 + 0.6} b={a0 + 1.3} style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 54, lineHeight: 1.5, color: INK, textShadow: "0 3px 12px rgba(0,0,0,.8)" }}>یه چیز «ایرانی» که ایرانی نیست</Typed>
      </div>
      {/* a comment box waiting for the viewer's answer */}
      <div dir="rtl" style={{
        position: "absolute", left: 90, right: 90, top: 1350, height: 104, borderRadius: 52, display: "flex", alignItems: "center", gap: 22, padding: "0 30px",
        background: "rgba(20,12,6,.9)", border: "2px solid rgba(242,184,96,.75)", boxShadow: "0 0 30px rgba(255,186,84,.3)",
        opacity: Math.min(1, box), transform: `translateY(${(1 - Math.min(1, box)) * 30}px) scale(${0.9 + 0.1 * box})`,
      }}>
        <div style={{ width: 58, height: 58, borderRadius: 29, border: `2.5px solid ${GOLD}`, background: "radial-gradient(circle at 50% 38%, #F2B860 0 22%, transparent 23%), radial-gradient(circle at 50% 100%, #F2B860 0 45%, transparent 46%)", flex: "none" }} />
        <div style={{ flex: 1, fontFamily: FA_UI, fontWeight: 700, fontSize: 40, color: "rgba(251,235,203,.55)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 4, height: 44, background: GOLD, opacity: Math.floor(t * 2.4) % 2 === 0 ? 1 : 0 }} />کامنت کن…
        </div>
        <div style={{ fontFamily: FA_UI, fontWeight: 900, fontSize: 36, color: GOLD }}>ارسال</div>
      </div>
    </>
  );
};

/* ---------- item card ---------- */
const Row: React.FC<{ t: number; at: number; label: string; children: React.ReactNode }> = ({ t, at, label, children }) => {
  const k = ramp(t, at - 0.05, at + 0.35, BACK);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, fontFamily: FA_UI, lineHeight: 1.35, opacity: Math.min(1, k), transform: `translateX(${(1 - Math.min(1, k)) * 26}px)` }}>
      <span style={{ fontWeight: 700, fontSize: 32, color: GOLD, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "nowrap" }}>{children}</span>
    </div>
  );
};
const Card: React.FC<{ d: Item; i: number; t: number }> = ({ d, i, t }) => {
  const a0 = S(d.line) - 0.3, a1 = NEXT(d.line) - 0.38;
  const kin = ramp(t, a0, a0 + 0.45, BACK), kout = ramp(t, a1 - 0.25, a1, IO);
  const a = Math.min(1, kin) * (1 - kout);
  if (a <= 0.005) return null;
  const sweep = ramp(t, a0 + 0.1, a0 + 0.9, LIN);
  return (
    <div dir="rtl" style={{
      position: "absolute", left: 50, right: 50, top: 232, height: 404, borderRadius: 30, overflow: "hidden",
      opacity: a, transform: `translateY(${(1 - Math.min(1, kin)) * -50 - kout * 40}px) scale(${0.94 + 0.06 * Math.min(1, kin)})`,
      background: "linear-gradient(180deg, rgba(36,22,10,.94), rgba(14,8,5,.92))",
      border: "1.5px solid rgba(242,184,96,.55)", boxShadow: "0 20px 50px rgba(0,0,0,.55), 0 0 40px rgba(255,186,84,.12)",
      display: "flex", alignItems: "center", padding: "0 40px", gap: 30,
    }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, transparent ${sweep * 140 - 30}%, rgba(255,226,160,.13) ${sweep * 140 - 15}%, transparent ${sweep * 140}%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 18, right: 18, top: 16, bottom: 16, borderRadius: 22, border: "1px solid rgba(242,184,96,.16)", pointerEvents: "none" }} />
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{ display: "inline-block", fontFamily: FA_UI, fontWeight: 800, fontSize: 28, color: GOLD, padding: "2px 18px 5px", borderRadius: 999, border: "1.5px solid rgba(242,184,96,.6)" }}>
          {FA(i + 1)} از {FA(N)}
        </div>
        <div style={{ fontFamily: FA_T, fontWeight: 900, fontSize: d.name.length > 6 ? 92 : 110, lineHeight: 1.12, marginTop: 2, whiteSpace: "nowrap", ...goldText }}>{d.name}</div>
        <div style={{ marginTop: 4 }}>
          {d.rows.map((r) => <Row key={r.label} t={t} at={r.at} label={r.label}>{r.val(t)}</Row>)}
        </div>
      </div>
      <Medal t={t}>{d.icon(t, ramp(t, a0, a0 + 0.9, LIN))}</Medal>
    </div>
  );
};

/* ---------- medallion + gold line icons ---------- */
const GD = (
  <defs>
    <linearGradient id="v52g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFE2A6" /><stop offset=".55" stopColor="#F2B860" /><stop offset="1" stopColor="#A8692A" />
    </linearGradient>
  </defs>
);
const LINE = { fill: "none", stroke: "url(#v52g)", strokeWidth: 4.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const draw = (k: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - cl(k) });
const FILL = "rgba(242,184,96,.14)";

const Medal: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => (
  <div style={{ width: 260, height: 260, position: "relative", flex: "none" }}>
    <svg viewBox="0 0 260 260" width={260} height={260} style={{ position: "absolute", inset: 0, transform: `rotate(${t * 9}deg)` }}>
      <circle cx={130} cy={130} r={126} fill="none" stroke="rgba(242,184,96,.45)" strokeWidth={1.5} strokeDasharray="3 9" />
    </svg>
    <div style={{
      position: "absolute", left: 14, top: 14, width: 232, height: 232, borderRadius: "50%", overflow: "hidden",
      background: "radial-gradient(circle at 36% 30%, #3d2611 0%, #1c1209 62%, #0e0805 100%)",
      boxShadow: "0 0 0 2.5px rgba(242,184,96,.9), 0 0 26px rgba(255,186,84,.25), inset 0 0 34px rgba(0,0,0,.6)",
    }}>
      <svg viewBox="0 0 200 200" width={232} height={232} style={{ position: "absolute", inset: 0 }}>{GD}{children}</svg>
    </div>
  </div>
);
type Ico = React.FC<{ t: number; k: number }>;
/* a bowl of rice with chopsticks, steam rising */
const IcoRice: Ico = ({ t, k }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const x = 76 + i * 24, y0 = 62 - 6 * Math.sin(t * 2 + i);
      return <path key={i} d={`M${x},74 C${x - 8},${y0 + 4} ${x + 8},${y0 - 6} ${x},${y0 - 18}`} {...LINE} strokeWidth={3} opacity={0.55 * cl(k * 2 - 1)} />;
    })}
    <path d="M44,106 Q100,70 156,106" fill={FILL} stroke="url(#v52g)" strokeWidth={4} opacity={cl(k * 1.6 - 0.2)} />
    {Array.from({ length: 13 }, (_, i) => {
      const x = 56 + (i % 7) * 15 + (i > 6 ? 8 : 0), y = i > 6 ? 90 : 100;
      return <ellipse key={i} cx={x} cy={y - (i > 6 ? 2 * Math.abs(3 - (i - 7)) : 0)} rx={5} ry={2.6} transform={`rotate(${(i * 37) % 60 - 30} ${x} ${y})`} fill="#FFF3D0" opacity={cl(k * 2 - 0.8)} />;
    })}
    <path d="M38,106 L162,106 Q156,158 100,164 Q44,158 38,106 Z" {...LINE} fill={FILL} {...draw(k)} />
    <path d="M78,164 L76,176 L124,176 L122,164" {...LINE} strokeWidth={3.5} {...draw(k * 1.3 - 0.3)} />
    <g transform={`rotate(${2 * Math.sin(t * 1.4)} 150 80)`}>
      <line x1={118} y1={98} x2={178} y2={40} {...LINE} strokeWidth={4} {...draw(k * 1.5 - 0.5)} />
      <line x1={126} y1={102} x2={184} y2={50} {...LINE} strokeWidth={4} {...draw(k * 1.5 - 0.6)} />
    </g>
  </g>
);
/* a potato with its eyes */
const IcoPotato: Ico = ({ t, k }) => (
  <g transform={`rotate(${-12 + 3 * Math.sin(t * 1.3)} 100 100)`}>
    <path d="M46,96 C40,64 72,42 104,46 C140,50 164,70 160,102 C156,136 130,156 96,154 C64,152 50,128 46,96 Z" {...LINE} fill={FILL} {...draw(k)} />
    {[[78, 78], [118, 70], [136, 108], [92, 126], [70, 108]].map(([x, y], i) => (
      <path key={i} d={`M${x - 6},${y} Q${x},${y - 5} ${x + 6},${y}`} {...LINE} strokeWidth={3} opacity={cl(k * 2 - 0.8 - i * 0.1)} />
    ))}
    <path d="M60,92 C62,74 76,62 92,60" {...LINE} strokeWidth={2.5} opacity={0.5 * cl(k * 2 - 1)} />
  </g>
);
/* a tomato with its green calyx (drawn in gold, one colour family) */
const IcoTomato: Ico = ({ t, k }) => (
  <g transform={`translate(0 ${2 * Math.sin(t * 1.6)})`}>
    <path d="M100,62 C142,58 164,86 160,118 C156,150 128,166 100,166 C72,166 44,150 40,118 C36,86 58,58 100,62 Z" {...LINE} fill={FILL} {...draw(k)} />
    <path d="M70,72 Q72,118 88,160 M130,72 Q128,118 112,160" {...LINE} strokeWidth={2.2} opacity={0.45 * cl(k * 2 - 0.8)} />
    <path d="M100,64 L84,50 L96,58 L92,40 L102,56 L112,42 L106,60 L122,52 L104,66 Z" {...LINE} strokeWidth={3} fill="url(#v52g)" opacity={cl(k * 2 - 0.6)} />
    <path d="M100,46 Q102,32 110,26" {...LINE} strokeWidth={4} {...draw(k * 1.6 - 0.6)} />
    <path d="M62,100 C64,86 74,78 86,76" stroke="#FFF3D0" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.5 * cl(k * 2 - 1)} />
  </g>
);
/* the chess king (v33), shaking on «کیش» */
const IcoKing: React.FC<{ t: number; check: number }> = ({ t, check }) => {
  const sh = check * (1 - check) * 4 * 9 * Math.sin(t * 60);
  return (
    <g transform={`rotate(${1.5 * Math.sin(t * 2) + sh} 100 160) translate(100 100) scale(0.86) translate(-100 -100)`}>
      <g fill="url(#v52g)" stroke="rgba(90,55,15,.5)" strokeWidth={1.5}>
        <rect x={94} y={20} width={12} height={34} rx={2} />
        <rect x={85} y={29} width={30} height={11} rx={2} />
        <path d="M70,58 L130,58 L121,86 L79,86 Z" />
        <rect x={75} y={86} width={50} height={11} rx={4} />
        <path d="M82,97 L118,97 L130,150 L70,150 Z" />
        <rect x={58} y={150} width={84} height={14} rx={4} />
        <rect x={52} y={164} width={96} height={13} rx={4} />
      </g>
      <path d="M86,100 L76,148" stroke="rgba(255,250,235,.45)" strokeWidth={4} strokeLinecap="round" />
      {check > 0.01 && <circle cx={100} cy={100} r={70 + 30 * check} fill="none" stroke={`rgba(255,226,160,${0.9 * (1 - check)})`} strokeWidth={4} />}
    </g>
  );
};
/* a tea glass (estekan) on its saucer, steam rising */
const IcoTea: Ico = ({ t, k }) => (
  <g>
    {[0, 1].map((i) => {
      const x = 90 + i * 20, y0 = 40 - 6 * Math.sin(t * 2.2 + i * 2);
      return <path key={i} d={`M${x},52 C${x - 9},${y0 + 4} ${x + 9},${y0 - 6} ${x},${y0 - 16}`} {...LINE} strokeWidth={3} opacity={0.6 * cl(k * 2 - 1)} />;
    })}
    <path d="M74,66 L77,98 Q90,112 77,126 L80,150 L120,150 L123,126 Q110,112 123,98 L126,66 Z" fill="rgba(200,110,40,.55)" opacity={cl(k * 2 - 0.9)} />
    <path d="M70,60 L130,60 L126,96 Q112,112 126,128 L122,154 L78,154 L74,128 Q88,112 74,96 Z" {...LINE} fill="none" {...draw(k)} />
    <ellipse cx={100} cy={166} rx={52} ry={9} {...LINE} fill={FILL} {...draw(k * 1.4 - 0.4)} />
    <path d="M78,72 L80,94" stroke="#FFF3D0" strokeWidth={3} strokeLinecap="round" opacity={0.6 * cl(k * 2 - 1)} />
  </g>
);

/* ---------- logo + captions ---------- */
const Logo: React.FC = () => (
  <div style={{ position: "absolute", left: 38, top: 96, width: 112, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.55 }}>
    <Img src={staticFile("v52/logo-mark.png")} style={{ width: 90, height: 75, filter: "drop-shadow(0 0 3px rgba(0,0,0,.6))" }} />
    <div style={{ fontFamily: TAG, fontWeight: 600, fontSize: 22, letterSpacing: 1.2, color: "#fff", marginTop: 2, textShadow: "0 2px 6px rgba(0,0,0,.7)" }}>Agarlogy</div>
  </div>
);
const KW = new Set(["برنج", "سیب‌زمینی", "گوجه‌فرنگی", "شطرنج", "چایی"]);
type Chunk = { words: { w: string; s: number; e: number; kw: boolean }[]; s: number; e: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  LINES.slice(0, LAST).forEach((ln) => {
    const words = clean(ln.text).split(/\s+/).filter(Boolean);
    const tot = words.reduce((a, w) => a + w.length + 1, 0);
    let c = ln.s;
    const timed = words.map((w, i) => {
      const s0 = c, e0 = c + ((w.length + 1) / tot) * (ln.e - ln.s);
      c = e0;
      return { w, s: s0, e: e0, kw: i === 0 && KW.has(w.replace(/[«».،:…]/g, "")) };
    });
    for (let i = 0; i < timed.length; ) {
      let j = i + 1, chars = timed[i].w.length;
      while (j < timed.length && j - i < 4 && chars + timed[j].w.length < 22 && !/[.،؛؟:…]$/.test(timed[j - 1].w)) { chars += timed[j].w.length; j++; }
      const ws = timed.slice(i, j);
      out.push({ words: ws, s: ws[0].s, e: ws[ws.length - 1].e });
      i = j;
    }
  });
  return out;
})();
const SHADOW = "0 3px 12px rgba(0,0,0,.85), 0 0 3px rgba(0,0,0,.9)";
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (t < S(1) - 0.1) return null; // the hook title already says it
  const i = CHUNKS.findIndex((c, k) => t >= c.s - 0.08 && t < (CHUNKS[k + 1] ? Math.min(CHUNKS[k + 1].s - 0.08, c.e + 0.6) : c.e + 0.6));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const k = cl((t - c.s + 0.08) / 0.16);
  return (
    <div dir="rtl" style={{
      position: "absolute", left: 50, right: 50, top: 1330, textAlign: "center",
      fontFamily: FA_UI, fontWeight: 900, fontSize: 64, lineHeight: 1.35,
      transform: `translateY(${(1 - k) * 16}px) scale(${0.96 + 0.04 * k})`, opacity: k,
    }}>
      {c.words.map((w, j) => {
        const on = t >= w.s - 0.03;
        return (
          <span key={j} style={{ color: w.kw ? (on ? GOLD : "rgba(242,184,96,.55)") : on ? "#fff" : "rgba(255,255,255,.55)", textShadow: SHADOW, margin: "0 8px", display: "inline-block" }}>
            {w.w.replace(/[«».:…]/g, "").replace(/،$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- look frames ---------- */
export const V52_LOOK: number[] = [
  0.05,                          // first frame: not dark, title in
  T_NOT + 0.35,                  // «ولی نیست»: the things fly off home
  hopEnd(H_RICE2) + 0.4,         // rice: China → India → Iran
  Wd(2, "لقب") + 0.5,            // potato: Andes → Tehran in a band
  Wd(4, "کیش") + 0.4,            // chess: کیش!
  Wd(5, "لاهیجان") + 0.4,        // tea: India → Lahijan
  T_FIN + 2.6,                   // the end: every thread into Iran
  TOTAL - 0.2,                   // last frame
  E(3) - 0.2,                    // tomato: Mexico → Tehran
];
