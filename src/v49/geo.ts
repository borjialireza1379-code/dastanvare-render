import { Easing, interpolate } from "remotion";
import MG from "./mapgeo.json";
import vo from "./vo.json";

// Mercator map (tools/v49-maps.cjs): lon 28E → 158E, lat 62N → 12S · public/v49/map.jpg (NASA Blue Marble, public domain)
export const MAP_W = MG.W;
export const MAP_H = MG.H;
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const latOfY = (y: number) => ((2 * Math.atan(Math.exp((MG.YTOP - y) / MG.R)) - Math.PI / 2) * 180) / Math.PI;

export const SW = 1080;
export const SH = 1920;

export const proj = (lon: number, lat: number) => ({ x: (lon - MG.LON0) * MG.PPD, y: MG.YTOP - MG.R * merc(lat) });

export type Cam = { lon: number; lat: number; s: number };
export type Key = Cam & { t: number; ease?: (x: number) => number };

// keep a w×h view inside the map
export const clampCam = (c: Cam, w = SW, h = SH): Cam => {
  const s = Math.max(c.s, h / MAP_H, w / MAP_W);
  const p = proj(c.lon, c.lat);
  const hw = w / 2 / s, hh = h / 2 / s;
  const x = Math.min(MAP_W - hw, Math.max(hw, p.x)), y = Math.min(MAP_H - hh, Math.max(hh, p.y));
  return { lon: MG.LON0 + x / MG.PPD, lat: latOfY(y), s };
};

export const E = Easing.bezier(0.65, 0, 0.25, 1);
export const WHIP = Easing.bezier(0.8, 0, 0.2, 1);
export const LIN = (x: number) => x;

export const camAt = (keys: Key[], t: number): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) {
      const k = (b.ease ?? E)((t - a.t) / (b.t - a.t));
      return { lon: a.lon + (b.lon - a.lon) * k, lat: a.lat + (b.lat - a.lat) * k, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k) };
    }
  }
  return keys[keys.length - 1];
};

// lon/lat → px inside a w×h view
export const toView = (c: Cam, lon: number, lat: number, w = SW, h = SH) => {
  const p = proj(lon, lat), o = proj(c.lon, c.lat);
  return { x: w / 2 + (p.x - o.x) * c.s, y: h / 2 + (p.y - o.y) * c.s };
};

// smooth pseudo-noise (no extra package: the cloud render repo keeps its deps small)
const hsh = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
export const noise1 = (seed: number, x: number) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hsh(i + seed * 57.3) * (1 - u) + hsh(i + 1 + seed * 57.3) * u) * 2 - 1;
};
export const drift = (t: number, amp = 6, shake = 0) => ({
  x: noise1(1, t * 0.3) * amp + noise1(3, t * 18) * shake,
  y: noise1(2, t * 0.3) * amp + noise1(4, t * 18) * shake,
});

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ramp = (t: number, a: number, b: number, ease = Easing.bezier(0.33, 0, 0.2, 1)) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
export const win = (t: number, a: number, b: number, fin = 0.35, fout = 0.35) => Math.min(ramp(t, a, a + fin), 1 - ramp(t, b - fout, b));
export const pop = (t: number, a: number, d = 0.45) =>
  interpolate(t, [a, a + d * 0.55, a + d * 0.8, a + d], [0, 1.12, 0.97, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
export const FA = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
export const FA_NUM = (n: number) => FA(n.toLocaleString("en-US")).replace(/,/g, "٬");

// word cues from vo.json: W(line, "part of word", nth) → start time (s); lines are 1-based (videos/49/script.txt)
type VW = { w: string; s: number; e: number; line: number };
export const WORDS = vo.words as VW[];
const norm = (s: string) => s.replace(/[‌،؛…؟.:!«»]/g, "").replace(/[ً-ْ]/g, "");
// exact word first («ایران» must not hit «ایرانی‌ها»), else any word containing it
const find = (line: number, part: string, nth: number) => {
  const inLine = WORDS.filter((w) => w.line === line);
  const exact = inLine.filter((w) => norm(w.w) === norm(part));
  const m = exact.length > nth ? exact : inLine.filter((w) => norm(w.w).includes(norm(part)));
  if (!m[nth]) throw new Error(`cue not found: ${line} ${part}`);
  return m[nth];
};
export const W = (line: number, part: string, nth = 0) => find(line, part, nth).s;
export const WE = (line: number, part: string, nth = 0) => find(line, part, nth).e;
export const LS = (line: number) => WORDS.find((w) => w.line === line)!.s;
export const LE = (line: number) => { const m = WORDS.filter((w) => w.line === line); return m[m.length - 1].e; };
export const VO_END = vo.total;
export const MONT_BEATS = vo.mont.beats as number[];
export const MUSIC_OFF = vo.musicOff;
export const ESTIMATE = !!(vo as { estimate?: boolean }).estimate;
