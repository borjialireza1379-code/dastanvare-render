// v51 geography: one projection for the baked map (public/v51/map.jpg) and everything drawn on it.
// World px = azimuthal equal-area centred 65°E 30°N, scale 4500 (videos/51/build/map.json).
import { geoAzimuthalEqualArea } from "d3-geo";

export const PROJ = geoAzimuthalEqualArea().rotate([-65, -30]).scale(4500).translate([0, 0]);
export type LL = [number, number];
export const P = (ll: LL) => PROJ(ll) as [number, number];
export const MAP_RECT = { x0: -1500, y0: -1900, x1: 1650, y1: 1700, s: 1.25 };

export const CITY = {
  isfahan: { ll: [51.68, 32.65] as LL, fa: "اصفهان" },
  yazd: { ll: [54.36, 31.9] as LL, fa: "" },
  kerman: { ll: [57.08, 30.28] as LL, fa: "" },
  sistan: { ll: [61.6, 31.0] as LL, fa: "" },
  girishk: { ll: [64.3, 31.8] as LL, fa: "" },
  kandahar: { ll: [65.71, 31.61] as LL, fa: "قندهار" },
  ghazni: { ll: [68.42, 33.55] as LL, fa: "غزنی" },
  kabul: { ll: [69.17, 34.53] as LL, fa: "کابل" },
  jalalabad: { ll: [70.45, 34.43] as LL, fa: "جلال‌آباد" },
  khyber: { ll: [71.12, 34.08] as LL, fa: "گذرگاه خیبر" },
  peshawar: { ll: [71.58, 34.01] as LL, fa: "پیشاور" },
  attock: { ll: [72.24, 33.89] as LL, fa: "" },
  lahore: { ll: [74.35, 31.55] as LL, fa: "لاهور" },
  sirhind: { ll: [76.38, 30.64] as LL, fa: "" },
  karnal: { ll: [76.98, 29.69] as LL, fa: "کرنال" },
  delhi: { ll: [77.21, 28.61] as LL, fa: "دهلی" },
};
export type CityId = keyof typeof CITY;
export const ROUTE: CityId[] = ["isfahan", "yazd", "kerman", "sistan", "girishk", "kandahar", "ghazni", "kabul", "jalalabad", "khyber", "peshawar", "attock", "lahore", "sirhind", "karnal", "delhi"];
export const OTHER: Record<string, LL> = { mughan: [48.0, 39.6], naderabad: [65.6, 31.55], tehran: [51.39, 35.69] };

const R = 6371;
const hav = (a: LL, b: LL) => {
  const r = Math.PI / 180, dLa = (b[1] - a[1]) * r, dLo = (b[0] - a[0]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Catmull-Rom through the projected waypoints, sampled; cumulative world-px length and km along the way
const N = 28;
type Sample = { x: number; y: number; d: number; km: number };
export const SAMPLES: Sample[] = (() => {
  const pts = ROUTE.map((k) => P(CITY[k].ll));
  const out: Sample[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    for (let j = 0; j < N; j++) {
      const t = j / N, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]), d: 0, km: 0 });
    }
  }
  const last = pts[pts.length - 1];
  out.push({ x: last[0], y: last[1], d: 0, km: 0 });
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1], b = out[i];
    b.d = a.d + Math.hypot(b.x - a.x, b.y - a.y);
    const la = PROJ.invert!([a.x, a.y]) as LL, lb = PROJ.invert!([b.x, b.y]) as LL;
    b.km = a.km + hav(la, lb);
  }
  return out;
})();
export const ROUTE_LEN = SAMPLES[SAMPLES.length - 1].d;
/** route length (world px) at a waypoint */
export const cityD = (k: CityId) => SAMPLES[ROUTE.indexOf(k) * N].d;

const find = (d: number) => {
  let lo = 0, hi = SAMPLES.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (SAMPLES[m].d <= d) lo = m; else hi = m; }
  return lo;
};
export const pointAt = (d: number) => {
  const dd = Math.min(Math.max(d, 0), ROUTE_LEN), i = find(dd), a = SAMPLES[i], b = SAMPLES[Math.min(i + 1, SAMPLES.length - 1)];
  const k = b.d > a.d ? (dd - a.d) / (b.d - a.d) : 0;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, km: a.km + (b.km - a.km) * k, ang: Math.atan2(b.y - a.y, b.x - a.x) };
};
/** world-px polyline of the route between two lengths */
export const slice = (d0: number, d1: number) => {
  const a = Math.max(0, Math.min(d0, d1)), b = Math.min(ROUTE_LEN, Math.max(d0, d1));
  const out: [number, number][] = [];
  const p0 = pointAt(a); out.push([p0.x, p0.y]);
  for (const s of SAMPLES) if (s.d > a && s.d < b) out.push([s.x, s.y]);
  const p1 = pointAt(b); out.push([p1.x, p1.y]);
  return out;
};
