import React, { useMemo } from "react";
import { AbsoluteFill, Html5Audio, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Cam, E, FA, FA_NUM, Key, LE, LIN, LS, MONT_BEATS, SW, VO_END, W, WE, WHIP, camAt, clamp01, clampCam, drift, pop, proj, ramp, toView, win } from "./geo";
import { BigText, Bubble, Captions, Card, Chip, Dot, FONT_HERO, FONT_UI, Flag, FlagTint, GOLD, IR, JP, Kind, MapView, MiniFlag, Motes, Photo, Pin, Shape, Stamp } from "./parts";
import { Dizi, FilmLeader, Gauge, Ghormeh, Kabab, Noodles, OilDrop, PlaneGlyph, Ramen, SpeedLines, Sun, Sushi, Tanker, Volcano } from "./glyphs";
import B from "./borders.json";

// «اگه ایرانی‌ها برن ژاپن و ژاپنی‌ها بیان ایران؟» · the people swap, the land stays (same idea and look as v03).
// Iranian tint (plain green-white-red, no emblem) sits on Japan, the Japanese tint on Iran.
// Climax: six famous anime redrawn as Iranian caricatures (the user's GPT pictures), music only, cut on the beat.
export const V49_FPS = 30;
const END = VO_END + 2.6;
export const V49_FRAMES = Math.ceil(END * V49_FPS);

if (typeof window !== "undefined") {
  const h = delayRender("v49 fonts");
  Promise.all(
    ([["Vazirmatn", "fonts/Vazirmatn-Bold.ttf", "800"], ["Vazirmatn", "fonts/Vazirmatn-Black.ttf", "900"], ["Lalezar", "fonts/Lalezar-Regular.ttf", "400"]] as const).map(([f, u, w]) =>
      new FontFace(f, `url('${staticFile(u)}')`, { weight: w }).load().then((ff) => document.fonts.add(ff)),
    ),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}

const C = B.countries as Record<string, string>;
const BX = B.bbox as unknown as Record<string, [number, number, number, number]>;
const BD = B.borders as Record<string, string>;

/* ---------------- cues (all from vo.json) ---------------- */
const T = {
  irani1: W(1, "ایرانی‌ها"), beran: W(1, "برن"), jp1: W(1, "ژاپن"), jpni1: W(1, "ژاپنی‌ها"), bian: W(1, "بیان"), ir1: W(1, "ایران"), chi: W(1, "چی"),
  l2: LS(2), n91: W(2, "۹۱"), n124: W(2, "۱۲۴"),
  l3: LS(3), n185: W(3, "۱۸.۵"), zelzele: W(3, "زلزله‌های"),
  l4: LS(4), atash: W(4, "آتشفشان"),
  l5: LS(5), shok: W(5, "شوک"), nafte: W(5, "نفته"),
  l6: LS(6), bedun: W(6, "بدون"), naft6: W(6, "نفت"), are: W(6, "آره"),
  l7: LS(7), manabe: W(7, "منابع"), irani7: W(7, "ایرانی‌ها"), vared: W(7, "وارد"),
  l8: LS(8), sarzamin: W(8, "سرزمینی"), n90: W(8, "۹۰"), khoshk: W(8, "خشکه"),
  l9: LS(9), nazdik: W(9, "نزدیک"), km: WE(9, "کیلومتر"), marz: W(9, "مرز"), chizi: W(9, "چیزی"), hich: W(9, "هیچ‌وقت"),
  l10: LS(10), ajib: W(10, "عجیب‌تر"),
  l11: LS(11), anime: W(11, "انیمه‌سازی"),
  l12: LS(12),
  l13: LS(13), ghaza: W(13, "غذاست"),
  l14: LS(14), sushi: W(14, "سوشی"), ramen: W(14, "رامن"), noodle: W(14, "نودل"),
  l15: LS(15), ghorme: W(15, "قرمه‌سبزی"), kabab: W(15, "کباب"), dizi: W(15, "دیزی"),
  l16: LS(16), dizi16: W(16, "دیزی"),
  l17: LS(17), avaz: W(17, "عوض"),
  l18: LS(18), farhang: W(18, "فرهنگ"), khaterat: W(18, "خاطرات"),
  l19: LS(19), jp19: W(19, "ژاپن"), ya: W(19, "یا"), ir19: W(19, "ایران"), e19: LE(19),
};
const M = MONT_BEATS; // 25 beats: six shots × 4 beats
const BEAT = (M[M.length - 1] - M[0]) / (M.length - 1);
const MONT = [M[0], M[M.length - 1]] as const;

/* ---------------- cameras ---------------- */
const JP_SPLIT: Cam = { lon: 137.5, lat: 38.2, s: 0.95 };
const IR_SPLIT: Cam = { lon: 53.6, lat: 32.4, s: 1.2 };
const JPF: Cam = { lon: 137.4, lat: 38.0, s: 1.15 };
const KEYS: Key[] = [
  { t: 0, ...JPF },
  { t: T.l3, ...JPF },
  { t: LE(4), lon: 137.6, lat: 37.8, s: 1.32, ease: LIN },
  { t: T.l8 - 0.05, lon: 137.6, lat: 37.8, s: 1.4, ease: LIN },
  { t: T.l8 + 0.75, lon: 53.8, lat: 32.6, s: 1.1, ease: WHIP },
  { t: T.l9, lon: 53.8, lat: 32.6, s: 1.14, ease: LIN },
  { t: T.chizi, lon: 53.8, lat: 32.6, s: 1.05 },
  { t: T.l10 + 0.4, lon: 53.4, lat: 33.4, s: 1.1 },
  { t: T.l12, lon: 51.6, lat: 35.4, s: 1.7, ease: LIN },
  { t: MONT[0], lon: 51.4, lat: 35.6, s: 2.1, ease: LIN },
];
const camFull = (t: number) => clampCam(camAt(KEYS, t));
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({ lon: a.lon + (b.lon - a.lon) * k, lat: a.lat + (b.lat - a.lat) * k, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k) });

/* section tag (top-right) */
const SECTIONS: [number, number, string, string][] = [
  [T.l3, T.l5 - 0.1, "طبیعت", "#ff8a7a"],
  [T.l5, T.l8 - 0.1, "اقتصاد", "#ffd34d"],
  [T.l8, T.l10 - 0.1, "جغرافیا", "#7fd3ff"],
  [T.l10, MONT[0] - 1.6, "فرهنگ", "#c9a6ff"],
  [T.l13, T.l16 - 0.3, "غذا", "#8fe388"],
];

/* ---------------- helpers ---------------- */
const insideOf = (d: string, pts: [number, number][]) => {
  if (typeof document === "undefined") return pts;
  const ctx = document.createElement("canvas").getContext("2d")!;
  const p = new Path2D(d);
  return pts.filter(([x, y]) => ctx.isPointInPath(p, x, y));
};
const hash = (i: number, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const gridIn = (name: string, step: number) => {
  const [x0, y0, x1, y1] = BX[name];
  const pts: [number, number][] = [];
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) pts.push([x + (hash(x, y) - 0.5) * step * 0.7, y + (hash(y, x) - 0.5) * step * 0.7]);
  return insideOf(C[name], pts).map((p, i) => ({ p, d: hash(i, 3) }));
};
const polyD = (pts: [number, number][]) => pts.map(([lon, lat], i) => { const p = proj(lon, lat); return `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join("") + "Z";
const thudAt = (t: number, a: number, d = 0.45) => (t >= a ? 1 - ramp(t, a, a + d) : 0);

const QUAKES: [number, number][] = [[142.4, 38.3], [143.9, 41.8], [135.0, 34.6], [136.7, 37.3], [138.9, 37.3], [130.8, 32.8], [141.6, 36.1], [135.6, 33.1], [137.6, 33.8], [139.3, 35.2], [144.4, 42.9], [140.8, 39.0], [141.9, 39.8], [132.0, 33.4], [129.9, 31.2], [142.8, 37.2]];
const VOLCANOES: [number, number][] = [[138.73, 35.36], [130.66, 31.58], [131.1, 32.88], [130.29, 32.76], [138.52, 36.4], [137.48, 35.89], [140.84, 42.54], [142.68, 43.42], [140.07, 37.6], [130.87, 31.93], [139.02, 35.23], [140.05, 39.1], [141.0, 39.85], [140.44, 38.14], [139.53, 34.08], [139.39, 34.73], [129.71, 29.64], [144.0, 43.6], [141.33, 42.69]];
// Persian Gulf → Hormuz → Indian Ocean → Malacca → South China Sea → Tokyo Bay (the real crude route to Japan)
const ROUTE: [number, number][] = [[50.3, 28.6], [53.5, 26.6], [56.6, 26.3], [59.5, 22.8], [66, 17], [76, 7.5], [81, 5.6], [91, 5.8], [96, 5.6], [99.5, 3.4], [103.6, 1.2], [106.5, 4.5], [110, 10], [115, 16], [120.6, 21], [125, 25.5], [131, 30.5], [136, 33.6], [139.8, 35.2]];
const CASPIAN_GREEN: [number, number][] = [[48.85, 38.45], [49.1, 37.6], [50.2, 37.2], [51.5, 36.75], [53.0, 36.9], [54.0, 37.0], [54.9, 37.3], [55.6, 37.2], [55.2, 36.6], [53.5, 36.35], [52.0, 36.2], [50.5, 36.5], [49.4, 36.8], [48.6, 37.4], [48.3, 38.2]];
const ZAGROS_GREEN: [number, number][] = [[45.0, 38.6], [46.4, 38.7], [47.4, 38.2], [47.2, 37.0], [47.9, 35.6], [49.0, 33.9], [50.2, 32.3], [50.9, 31.3], [50.4, 30.9], [49.3, 31.9], [48.0, 33.4], [46.9, 34.4], [46.0, 35.4], [45.3, 36.7]];
// Iran's neighbours in a clockwise walk: [border key, name, pin lon/lat, label lift, label shift]
const NEIGHBOURS: [string, string, number, number, number, number][] = [
  ["iraq", "عراق", 45.3, 33.0, 70, 0], ["turkey", "ترکیه", 43.9, 39.2, 70, 40], ["armenia", "ارمنستان", 45.4, 39.9, 150, 30], ["azerbaijan", "آذربایجان", 47.9, 39.6, 80, 20],
  ["turkmenistan", "ترکمنستان", 58.5, 38.4, 70, 0], ["afghanistan", "افغانستان", 62.6, 33.6, 70, -50], ["pakistan", "پاکستان", 63.4, 27.6, 70, -60],
];
const BORDER_KM: Record<string, number> = { iraq: 1135, turkey: 406, armenia: 33, azerbaijan: 546, turkmenistan: 886, afghanistan: 846, pakistan: 780 }; // 1:50m lengths, only for pacing the trace

/* ================= the video ================= */
export const V49: React.FC<{ silent?: boolean; times?: number[] }> = ({ silent = false, times }) => {
  const frame = useCurrentFrame();
  const t = times ? times[frame] ?? 0 : frame / V49_FPS;

  const crowdJP = useMemo(() => gridIn("japan", 10), []);
  const crowdIR = useMemo(() => gridIn("iran", 14), []);

  /* ---------- which layout ---------- */
  const inHook = t < T.l3 + 0.4;
  const inSplit9 = t >= T.chizi - 0.45 && t < T.l10 + 0.4;
  const inMont = t >= MONT[0] && t < MONT[1];
  const inFood = t >= MONT[1] && t < T.l16 - 0.25;
  const inDizi = t >= T.l16 - 0.25 && t < T.l17 - 0.2;
  const inEnd = t >= T.l17 - 0.2;
  const inFull = !inHook && !inSplit9 && !inMont && !inFood && !inDizi && !inEnd;

  // full camera with whip blur
  const cam = camFull(t);
  const camN = camFull(t + 1 / V49_FPS);
  const pv = proj(cam.lon, cam.lat), pn = proj(camN.lon, camN.lat);
  const vel = Math.hypot(pn.x - pv.x, pn.y - pv.y) * cam.s + Math.abs(Math.log(camN.s / cam.s)) * 900;
  const blur = Math.min(24, Math.max(0, vel - 6) * 0.22);
  const shakeAmt = thudAt(t, T.zelzele, 0.9) * 22 + thudAt(t, T.n185) * 8 + thudAt(t, T.nafte) * 16 + thudAt(t, T.are) * 10 + (t > T.zelzele && t < T.l4 ? 2.5 : 0);
  const dr = drift(t, 6, shakeAmt);
  const sw = (c: Cam) => 2.6 / c.s;

  /* ---------- who lives where (tints) ---------- */
  const landIR = T.jp1 + 0.35; // the Iranian flag lands on Japan
  const landJP = T.ir1 + 0.3; // the Japanese flag lands on Iran
  const jpLand = (c: Cam, id: string, o = 1) => (
    <>
      <FlagTint id={id + "j0"} d={C.japan} box={BX.japan} kind="jp" o={o * ramp(t, 0.1, 0.5) * (1 - ramp(t, landIR, landIR + 0.35))} t={t} sw={sw(c)} />
      <FlagTint id={id + "j1"} d={C.japan} box={BX.japan} kind="ir" o={o * ramp(t, landIR, landIR + 0.35)} t={t} sw={sw(c)} />
    </>
  );
  const irLand = (c: Cam, id: string, o = 1, edge?: string) => (
    <>
      <FlagTint id={id + "i0"} d={C.iran} box={BX.iran} kind="ir" o={o * ramp(t, 0.1, 0.5) * (1 - ramp(t, landJP, landJP + 0.35))} t={t} sw={sw(c)} />
      <FlagTint id={id + "i1"} d={C.iran} box={BX.iran} kind="jp" o={o * ramp(t, landJP, landJP + 0.35)} t={t} sw={sw(c)} edge={edge} />
    </>
  );

  /* ---------- map-space content of the full view ---------- */
  const fullMap = (c: Cam) => {
    const S = sw(c);
    const dry = ramp(t, T.n90, T.n90 + 0.9, E);
    const ir = proj(53.7, 32.6);
    return (
      <>
        {jpLand(c, "f")}
        {irLand(c, "f", 1 - 0.7 * dry * (t < T.l10 ? 1 : 0), t > T.sarzamin && t < T.n90 ? `rgba(255,255,255,${0.7 + 0.3 * Math.sin(t * 12)})` : undefined)}
        {/* L8: 90% of the land is dry */}
        {t > T.n90 - 0.1 && t < T.l10 + 0.3 && (
          <svg width={10} height={10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - ramp(t, T.l10 - 0.2, T.l10 + 0.3) }}>
            <defs>
              <clipPath id="irclip"><path d={C.iran} /></clipPath>
              <pattern id="cracks" width={60} height={60} patternUnits="userSpaceOnUse">
                <rect width={60} height={60} fill="#d8b46a" />
                <path d="M0 22 L18 26 L30 14 L44 20 L60 12 M18 26 L22 44 L40 52 L60 46 M30 14 L28 0 M22 44 L6 60" stroke="#8f6a2c" strokeWidth={2.2} fill="none" opacity={0.75} />
              </pattern>
            </defs>
            <g clipPath="url(#irclip)">
              <circle cx={ir.x} cy={ir.y} r={700 * dry} fill="url(#cracks)" opacity={0.78} />
              <path d={polyD(CASPIAN_GREEN)} fill="#3fae4a" opacity={0.75 * ramp(t, T.n90 + 0.6, T.n90 + 1.0)} />
              <path d={polyD(ZAGROS_GREEN)} fill="#3fae4a" opacity={0.45 * ramp(t, T.n90 + 0.6, T.n90 + 1.0)} />
            </g>
          </svg>
        )}
        {/* L9: the land border, neighbour by neighbour */}
        {t > T.nazdik - 0.1 && t < T.l10 + 0.4 && <BorderTrace t={t} S={S} o={1 - ramp(t, T.l10, T.l10 + 0.4)} />}
      </>
    );
  };
  const at = (lon: number, lat: number) => { const p = toView(cam, lon, lat); return { x: p.x + dr.x, y: p.y + dr.y }; };

  /* ---------- layouts ---------- */
  let views: React.ReactNode = null;
  if (inHook) {
    const k = ramp(t, T.l3 - 0.3, T.l3 + 0.35, E); // collapse split → full
    const hTop = 960 + 960 * k;
    const cu = lerpCam(clampCam({ ...JP_SPLIT, s: JP_SPLIT.s * (1 + 0.05 * ramp(t, 0, T.l3)) }, SW, 960), camFull(t), k);
    const ci = clampCam({ ...IR_SPLIT, s: IR_SPLIT.s * (1 + 0.05 * ramp(t, 0, T.l3)) }, SW, 960);
    const pu = toView(cu, 137.0, 36.6, SW, hTop), pi = toView(ci, 53.8, 32.3, SW, 960);
    const A = { x: pi.x, y: pi.y + hTop }, Bp = { x: pu.x, y: pu.y };
    // the two flights
    const fly = (rise0: number, f0: number, f1: number) => ({ rise: ramp(t, rise0, rise0 + 0.25), f: ramp(t, f0, f1, E), land: ramp(t, f1, f1 + 0.3) });
    const fi = fly(T.irani1, T.beran, landIR), fj = fly(T.jpni1, T.bian, landJP);
    const arcI = Math.sin(fi.f * Math.PI) * 240, arcJ = Math.sin(fj.f * Math.PI) * 240;
    const sIR = { x: A.x + (Bp.x - A.x) * fi.f + arcI, y: A.y + (Bp.y - A.y) * fi.f - 40 * fi.rise };
    const sJP = { x: Bp.x + (A.x - Bp.x) * fj.f - arcJ, y: Bp.y + (A.y - Bp.y) * fj.f - 40 * fj.rise };
    views = (
      <>
        <MapView cam={cu} h={hTop} shake={dr}>
          {jpLand(cu, "hu")}
          <Crowd pts={crowdJP} t={t} a={T.n91} dur={1.3} r={4.2 / cu.s} colors={[IR.g, "#ffffff", IR.r]} o={1 - k} />
        </MapView>
        <MapView cam={ci} h={960} top={hTop}>
          {irLand(ci, "hi")}
          <Crowd pts={crowdIR} t={t} a={T.n124} dur={1.3} r={4.6 / ci.s} colors={["#ffffff", JP.r, "#ffffff"]} o={1} />
        </MapView>
        <div style={{ position: "absolute", left: 0, right: 0, top: hTop - 3, height: 6, background: "rgba(255,255,255,.9)", boxShadow: "0 0 20px rgba(255,255,255,.6)", opacity: 1 - k }} />
        <Chip x={SW - 50} y={hTop - 62} anchor="l" text="خاکِ ژاپن" o={win(t, 0.15, T.n91, 0.25, 0.3)} size={34} />
        <Chip x={SW - 50} y={hTop + 62} anchor="l" text="خاکِ ایران" o={win(t, 0.15, T.n91, 0.25, 0.3)} size={34} />
        <Planes t={t} a={T.beran} b={T.l3} y={hTop} o={1 - k} />
        <Flag kind="ir" x={sIR.x} y={sIR.y} w={260} t={t} o={(t > T.irani1 ? 1 : 0) * (1 - k)} s={fi.rise * (1 - 0.5 * fi.land)} rot={-8 + 16 * fi.f} pole={fi.land > 0.5} />
        <Flag kind="jp" x={sJP.x} y={sJP.y} w={230} t={t + 0.4} o={(t > T.jpni1 ? 1 : 0) * (1 - k)} s={fj.rise * (1 - 0.5 * fj.land)} rot={8 - 16 * fj.f} pole={fj.land > 0.5} />
        {/* the premise */}
        <div dir="rtl" style={{
          position: "absolute", left: 70, right: 70, top: 960, transform: `translateY(-50%) scale(${pop(t, T.chi - 0.15, 0.4)})`,
          opacity: win(t, T.chi - 0.15, T.n91 - 0.05, 0.2, 0.3), textAlign: "center",
          background: "rgba(8,16,24,.86)", borderRadius: 28, padding: "22px 28px", boxShadow: "0 16px 40px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,255,255,.15)",
          fontFamily: FONT_UI, fontWeight: 900, fontSize: 46, color: "#fff", lineHeight: 1.45,
        }}>
          همون مردم، همون عادت‌ها…<br /><span style={{ color: GOLD }}>فقط سرزمین عوض شد</span>
        </div>
        {/* L2: the head counts */}
        <Chip x={SW / 2} y={hTop - 110} text={`${FA(Math.round(91 * ramp(t, T.n91, T.n91 + 0.8, LIN)))} میلیون ایرانی`} size={50} o={win(t, T.n91, T.l3 + 0.1, 0.2, 0.3)} s={pop(t, T.n91)} icon={<MiniFlag kind="ir" />} />
        <Chip x={SW / 2} y={hTop + 110} text={`${FA(Math.round(124 * ramp(t, T.n124, T.n124 + 0.8, LIN)))} میلیون ژاپنی`} size={50} o={win(t, T.n124, T.l3 + 0.1, 0.2, 0.3)} s={pop(t, T.n124)} icon={<MiniFlag kind="jp" />} />
      </>
    );
  } else if (inSplit9) {
    // «چیزی که ژاپن هیچ‌وقت نداشته»: Iran's long land border above, Japan (only coast) below
    const k = t < T.l10 ? ramp(t, T.chizi - 0.45, T.chizi + 0.05, E) : 1 - ramp(t, T.l10 - 0.1, T.l10 + 0.4, E);
    const hTop = 1920 - 960 * k;
    const cu = clampCam(camFull(t), SW, hTop);
    const cj = clampCam({ lon: 137.4, lat: 38.0, s: 0.95 * (1 + 0.04 * ramp(t, T.chizi, T.l10)) }, SW, 960);
    const ripple = (t * 0.7) % 1;
    views = (
      <>
        <MapView cam={cu} h={hTop}>{fullMap(cu)}</MapView>
        <MapView cam={cj} h={960} top={hTop}>
          {jpLand(cj, "sj")}
          <Shape d={C.japan} o={k} stroke="#7fd3ff" sw={sw(cj) * (2 + 3 * (1 - ripple))} glow="rgba(127,211,255,.9)" />
          <Shape d={C.japan} o={k * (1 - ripple) * 0.6} stroke="#bfe9ff" sw={sw(cj) * (2 + 30 * ripple)} />
        </MapView>
        <div style={{ position: "absolute", left: 0, right: 0, top: hTop - 3, height: 6, background: "rgba(255,255,255,.9)", opacity: k }} />
        <Chip x={SW / 2} y={hTop + 110} text={`مرز زمینی ژاپن: ${FA(0)} کیلومتر`} size={50} o={k * ramp(t, T.hich - 0.15, T.hich + 0.1)} s={pop(t, T.hich - 0.15)} color={GOLD} icon={<MiniFlag kind="jp" />} />
        <Chip x={SW / 2} y={hTop - 110} text={`${FA_NUM(5894)} کیلومتر`} size={46} o={k} icon={<MiniFlag kind="ir" />} />
      </>
    );
  } else if (inFood) {
    const cj = clampCam({ lon: 137.4, lat: 38.0, s: 0.95 }, SW, 960), ci = clampCam(IR_SPLIT, SW, 960);
    const k = ramp(t, MONT[1], MONT[1] + 0.35, E);
    views = (
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1.15 - 0.15 * k})`, opacity: k }}>
        <MapView cam={cj} h={960} dim={0.35 + 0.2 * ramp(t, T.l14, T.l14 + 0.4)}>{jpLand(cj, "fj")}</MapView>
        <MapView cam={ci} h={960} top={960} dim={0.35 + 0.2 * ramp(t, T.l15 - 0.2, T.l15 + 0.2)}>{irLand(ci, "fi")}</MapView>
        <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: "rgba(255,255,255,.9)" }} />
      </div>
    );
  } else if (inEnd) {
    const cj = clampCam({ lon: 137.4, lat: 38.0, s: 0.95 * (1 + 0.04 * ramp(t, T.l17, T.l18)) }, SW, 960), ci = clampCam({ ...IR_SPLIT, s: IR_SPLIT.s * (1 + 0.04 * ramp(t, T.l17, T.l18)) }, SW, 960);
    views = (
      <>
        <MapView cam={cj} h={960} dim={0.45}>{jpLand(cj, "ej")}</MapView>
        <MapView cam={ci} h={960} top={960} dim={0.45}>{irLand(ci, "ei")}</MapView>
        <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: "rgba(255,255,255,.9)" }} />
      </>
    );
  } else if (inFull) {
    const dim = 0.5 * win(t, T.l5, T.l8 + 0.2, 0.35, 0.5) + 0.62 * ramp(t, T.l10, T.l10 + 1.0) + 0.2 * ramp(t, T.l11, T.l11 + 0.3);
    views = <MapView cam={cam} h={1920} blur={blur} shake={dr} dim={Math.min(0.85, dim)}>{fullMap(cam)}</MapView>;
  }

  return (
    <AbsoluteFill style={{ background: "#0b2a36", overflow: "hidden" }}>
      {views}

      {inFull && (
        <AbsoluteFill>
          {/* L3: earthquakes */}
          <Quakes t={t} at={at} o={win(t, T.n185 - 0.2, T.l4 + 0.6, 0.2, 0.4)} />
          <BigText y={250} text={`${FA((18.5 * ramp(t, T.n185, T.n185 + 0.9, LIN)).toFixed(1)).replace(".", "٫")}٪`} size={150} o={win(t, T.n185, T.l4, 0.15, 0.3)} s={pop(t, T.n185) * (1 + 0.06 * thudAt(t, T.zelzele))} glow="rgba(255,90,70,.85)" />
          <Chip x={SW / 2} y={390} text="از زلزله‌های بزرگ دنیا" size={44} o={win(t, T.zelzele, T.l4, 0.2, 0.3)} s={pop(t, T.zelzele)} icon={<Dot c="#ff6b5e" />} />
          <Seismo t={t} o={win(t, T.zelzele - 0.3, T.l5, 0.25, 0.4)} />
          {/* L4: volcanoes */}
          {VOLCANOES.map(([lon, lat], i) => {
            const a = T.atash + hash(i, 9) * 0.9, o = win(t, a, T.l5 + 0.3, 0.2, 0.35);
            if (o <= 0) return null;
            const p = at(lon, lat);
            return <div key={i} style={{ position: "absolute", left: p.x - 30, top: p.y - 52, opacity: o, transform: `scale(${pop(t, a)})`, transformOrigin: "50% 100%" }}><Volcano size={60} t={t} seed={i} /></div>;
          })}
          <Chip x={SW / 2} y={250} text={`${FA(111)} آتشفشان فعال`} size={56} o={win(t, T.atash + 0.3, T.l5, 0.2, 0.3)} s={pop(t, T.atash + 0.3)} bg="rgba(255,106,0,.92)" />
          {/* L5–L6: oil */}
          <Oil t={t} />
          {/* L7: the tanker route */}
          <Route t={t} />
          {/* L8: dry */}
          <BigText y={300} text={`${FA(Math.round(90 * ramp(t, T.n90, T.n90 + 0.8, LIN)))}٪ خشک`} size={140} o={win(t, T.n90, T.l9, 0.15, 0.3)} s={pop(t, T.n90)} glow="rgba(255,170,40,.85)" />
          {win(t, T.n90, T.l9, 0.2, 0.3) > 0 && <div style={{ position: "absolute", left: 900, top: 230, opacity: win(t, T.n90, T.l9, 0.2, 0.3), transform: `scale(${pop(t, T.n90 + 0.15)})` }}><Sun size={130} t={t} /></div>}
          {(() => { const p = at(53.7, 31.2); return <Pin x={p.x} y={p.y} t={t} text="ژاپنی‌ها اینجان" size={38} o={win(t, T.sarzamin - 0.1, T.n90 + 0.1, 0.2, 0.25)} s={pop(t, T.sarzamin - 0.1)} up={90} />; })()}
          {/* L9: the land border */}
          {NEIGHBOURS.map(([key, name, lon, lat, up, dx], i) => {
            const a = traceStart(i);
            const p = at(lon, lat);
            return <Pin key={key} x={p.x} y={p.y} t={t + i * 0.2} text={name} size={32} o={win(t, a, T.chizi - 0.2, 0.2, 0.3)} s={pop(t, a)} up={up} dx={dx} color={GOLD} />;
          })}
          <Chip x={SW / 2} y={300} text={`${FA_NUM(Math.round(5894 * ramp(t, T.nazdik, TRACE_END, LIN)))} کیلومتر مرز زمینی`} size={52} o={win(t, T.nazdik, T.chizi - 0.1, 0.2, 0.3)} s={pop(t, T.nazdik) * (1 + 0.05 * thudAt(t, TRACE_END))} color={GOLD} />
          {/* L10: «a stranger thing…» */}
          <Motes t={t} o={win(t, T.l10, T.l11 + 0.3, 0.6, 0.3)} color="201,166,255" />
          <BigText y={860} text="یه اتفاق عجیب‌تر…" size={104} o={win(t, T.ajib - 0.1, T.l11 + 0.1, 0.3, 0.25)} s={pop(t, T.ajib - 0.1, 0.5)} glow="rgba(201,166,255,.9)" />
          {/* L11: the anime industry moves to Iran */}
          <SpeedLines w={1080} h={1920} t={t} o={0.55 * win(t, T.l11, MONT[0] - 1.7, 0.15, 0.25)} cy={880} />
          <BigText y={860} text="انیمه‌سازی" size={190 + 6 * Math.sin(t * 9)} o={win(t, T.anime - 0.05, MONT[0] - 1.7, 0.12, 0.25)} s={pop(t, T.anime - 0.05, 0.5)} glow="rgba(255,105,180,.95)" />
          <Chip x={SW / 2} y={1040} text="استودیو: تهران" size={50} o={win(t, T.anime + 0.35, MONT[0] - 1.7, 0.2, 0.25)} s={pop(t, T.anime + 0.35)} bg="rgba(255,105,180,.92)" icon={<MiniFlag kind="jp" w={48} />} />
          {/* L12: the countdown into the montage */}
          {(() => {
            const a = MONT[0] - 3 * BEAT;
            if (t < a - 0.25) return null;
            const n = t < a + BEAT ? 3 : t < a + 2 * BEAT ? 2 : 1;
            const k = (((t - a) / BEAT) % 1 + 1) % 1;
            return <FilmLeader t={t} n={n} k={t < a ? 0 : k} o={ramp(t, a - 0.25, a)} />;
          })()}
        </AbsoluteFill>
      )}

      {/* montage: music only, a cut every 4 beats */}
      {inMont && <Montage t={t} />}

      {/* food */}
      {inFood && <Food t={t} />}

      {/* the first dizi */}
      {inDizi && <DiziShot t={t} />}

      {/* ending */}
      {inEnd && <Ending t={t} />}

      {/* section tag */}
      {SECTIONS.map(([a, b, n, c]) => (
        <Chip key={n} x={SW - 54} y={150} anchor="l" text={n} size={34} o={win(t, a, b, 0.25, 0.25)} s={pop(t, a, 0.35)} icon={<Dot c={c} />} />
      ))}

      {/* channel logo (top-left, faint, always) */}
      <div style={{ position: "absolute", left: 38, top: 96, width: 112, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.55 }}>
        <Img src={staticFile("v49/logo-mark.png")} style={{ width: 90, height: 75, filter: "drop-shadow(0 0 3px rgba(0,0,0,.6))" }} />
        <div style={{ fontFamily: "Arial", fontWeight: 600, fontSize: 22, letterSpacing: 1.2, color: "#fff", marginTop: 2, textShadow: "0 2px 6px rgba(0,0,0,.7)" }}>Agarlogy</div>
      </div>

      <Captions t={t} hide={inMont || (t > MONT[0] - 3 * BEAT - 0.25 && t < MONT[0])} y={inDizi ? 1500 : 1330} />
      {!silent && !times && <Html5Audio src={staticFile("v49/mix-norm.wav")} />}
    </AbsoluteFill>
  );
};

/* ================= scene pieces ================= */

const Crowd: React.FC<{ pts: { p: [number, number]; d: number }[]; t: number; a: number; dur: number; r: number; colors: string[]; o: number }> = ({ pts, t, a, dur, r, colors, o }) => {
  if (t < a || o <= 0.001) return null;
  return (
    <svg width={10} height={10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
      {pts.map(({ p, d }, i) => {
        const s = a + d * dur;
        if (t < s) return null;
        const k = clamp01((t - s) / 0.25);
        return <circle key={i} cx={p[0]} cy={p[1] - (1 - k) * 24} r={r} fill={colors[i % colors.length]} stroke="rgba(0,0,0,.45)" strokeWidth={r * 0.25} opacity={k} />;
      })}
    </svg>
  );
};

const Planes: React.FC<{ t: number; a: number; b: number; y: number; o: number }> = ({ t, a, b, y, o }) => {
  const oo = win(t, a, b, 0.3, 0.3) * o;
  if (oo <= 0.001) return null;
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const up = i % 2 === 0;
        const u = (((t - a) / 1.7 + i * 0.37) % 1 + 1) % 1;
        const x = 120 + ((i * 173) % 840);
        const yy = up ? y + 230 - u * 460 : y - 230 + u * 460;
        return (
          <div key={i} style={{ position: "absolute", left: x - 22, top: yy - 22, opacity: oo * Math.sin(u * Math.PI), transform: `rotate(${up ? 0 : 180}deg)` }}>
            <PlaneGlyph size={44} color={up ? "#e9fbe9" : "#ffe9ea"} />
          </div>
        );
      })}
    </>
  );
};

const Quakes: React.FC<{ t: number; at: (lon: number, lat: number) => { x: number; y: number }; o: number }> = ({ t, at, o }) => {
  if (o <= 0.001) return null;
  return (
    <>
      {QUAKES.map(([lon, lat], i) => {
        const a = T.n185 + hash(i, 5) * 1.6;
        if (t < a) return null;
        const p = at(lon, lat);
        const big = i === 0 ? 1.5 : 1;
        return (
          <div key={i} style={{ position: "absolute", left: p.x, top: p.y, opacity: o }}>
            {[0, 1].map((j) => {
              const u = ((t - a) * 0.9 + j * 0.5) % 1;
              const R = (14 + 80 * u) * big;
              return <div key={j} style={{ position: "absolute", left: -R, top: -R, width: R * 2, height: R * 2, borderRadius: "50%", border: `${4 * (1 - u) + 1}px solid rgba(255,90,70,${(1 - u) * 0.9})` }} />;
            })}
            <div style={{ position: "absolute", left: -8 * big, top: -8 * big, width: 16 * big, height: 16 * big, borderRadius: "50%", background: "#ff4d3a", boxShadow: "0 0 16px #ff4d3a", transform: `scale(${pop(t, a, 0.3)})` }} />
          </div>
        );
      })}
    </>
  );
};

// seismograph strip (the right edge is "now")
const Seismo: React.FC<{ t: number; o: number }> = ({ t, o }) => {
  if (o <= 0.001) return null;
  const hits = [T.zelzele, ...QUAKES.map((_, i) => T.n185 + hash(i, 5) * 1.6)];
  const y0 = 1650;
  let d = "";
  for (let x = 0; x <= 1080; x += 5) {
    const ts = t - (1080 - x) / 360;
    let v = Math.sin(ts * 47) * 2 + Math.sin(ts * 83) * 1.5;
    for (const [j, q] of hits.entries()) if (ts > q) v += (j === 0 ? 70 : 26) * Math.exp(-(ts - q) * (j === 0 ? 2.2 : 5)) * Math.sin((ts - q) * 70);
    d += `${x ? "L" : "M"}${x},${(y0 + Math.max(-75, Math.min(75, v))).toFixed(1)}`;
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <rect x={0} y={y0 - 90} width={1080} height={180} fill="rgba(8,16,24,.72)" />
      {[-60, -30, 0, 30, 60].map((g) => <line key={g} x1={0} x2={1080} y1={y0 + g} y2={y0 + g} stroke="rgba(255,255,255,.08)" strokeWidth={2} />)}
      <path d={d} fill="none" stroke="#ff5a46" strokeWidth={4} style={{ filter: "drop-shadow(0 0 6px rgba(255,90,70,.9))" }} />
      <circle cx={1080} cy={y0} r={0} />
    </svg>
  );
};

const Oil: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, T.shok - 0.1, T.l7 + 0.2, 0.2, 0.35);
  if (o <= 0) return null;
  const drop = ramp(t, T.nafte - 0.25, T.nafte + 0.05, Easing_in);
  const bounce = t > T.nafte ? Math.exp(-(t - T.nafte) * 7) * Math.sin((t - T.nafte) * 30) * 22 : 0;
  const g = 1 - ramp(t, T.bedun, T.naft6 + 0.55, E);
  return (
    <>
      <BigText y={470} text="شوک بعدی:" size={84} o={win(t, T.shok, T.l7, 0.15, 0.3)} s={pop(t, T.shok)} glow="rgba(255,211,77,.7)" />
      <div style={{ position: "absolute", left: SW / 2 - 140, top: 600 - (1 - drop) * 700 + bounce, width: 280, opacity: o }}>
        <OilDrop size={280} strike={ramp(t, T.bedun, T.bedun + 0.3)} />
      </div>
      <BigText y={1150} text="نفت" size={170} o={win(t, T.nafte, T.l6, 0.1, 0.2)} s={pop(t, T.nafte)} glow="rgba(255,190,60,.9)" />
      <Card x={SW / 2} y={1105} w={560} o={win(t, T.l6 - 0.05, T.l7 + 0.2, 0.2, 0.35)} s={pop(t, T.l6 - 0.05)} bg="rgba(16,22,30,.92)">
        <div style={{ padding: "26px 30px 10px", display: "flex", justifyContent: "center" }}>
          <Gauge size={480} v={g} t={t} warn={t > T.naft6 + 0.3 ? 1 : 0} />
        </div>
      </Card>
      <Stamp x={SW / 2 + 10} y={760} text="آره!" t={t} at={T.are} o={o} size={150} rot={-10} />
    </>
  );
};
const Easing_in = (x: number) => x * x;

const Route: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, T.l7, T.l8 + 0.1, 0.3, 0.3);
  if (o <= 0) return null;
  const w = 1000, h = 820, left = 40, top = 520;
  const cam = clampCam({ lon: 95.5, lat: 22, s: 0.23 }, w, h);
  const S = 2.6 / cam.s;
  const pts = ROUTE.map(([lon, lat]) => proj(lon, lat));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
  const draw = ramp(t, T.irani7 - 0.2, T.vared + 0.6, LIN);
  // positions along the route (screen), by arc length
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = segs.reduce((a, b) => a + b, 0);
  const along = (u: number) => {
    let L = u * total;
    for (let i = 0; i < segs.length; i++) {
      if (L <= segs[i]) { const k = L / segs[i]; const p = { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k }; return { p, ang: Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x) }; }
      L -= segs[i];
    }
    return { p: pts[pts.length - 1], ang: 0 };
  };
  const o0 = proj(cam.lon, cam.lat);
  const scr = (p: { x: number; y: number }) => ({ x: left + w / 2 + (p.x - o0.x) * cam.s, y: top + h / 2 + (p.y - o0.y) * cam.s });
  const k = ramp(t, T.l7, T.l7 + 0.45, E);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <Chip x={SW / 2} y={330} text="ژاپن: بیش از ۹۹٪ نفتش وارداتیه" size={44} o={ramp(t, T.manabe - 0.1, T.manabe + 0.15)} s={pop(t, T.manabe - 0.1)} icon={<MiniFlag kind="jp" w={46} />} />
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 1920, transform: `translateY(${(1 - k) * 160}px) scale(${0.92 + 0.08 * k})`, transformOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", left: left - 4, top: top - 4, width: w + 8, height: h + 8, borderRadius: 38, background: "rgba(255,255,255,.85)", boxShadow: "0 30px 70px rgba(0,0,0,.6), 0 0 30px rgba(255,211,77,.35)" }} />
        <MapView cam={cam} w={w} h={h} top={top} left={left} radius={34}>
          {/* who lives where now */}
          <FlagTint id="rj" d={C.japan} box={BX.japan} kind="ir" o={1} t={t} sw={S} />
          <FlagTint id="ri" d={C.iran} box={BX.iran} kind="jp" o={1} t={t} sw={S} />
          <svg width={10} height={10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={d} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={S * 2} strokeDasharray={`${S * 6} ${S * 5}`} />
            <path d={d} fill="none" stroke={GOLD} strokeWidth={S * 3} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${S * 3}px rgba(255,211,77,.9))` }} />
          </svg>
        </MapView>
        {[0, 0.33, 0.66].map((off, i) => {
          if (draw <= off * 0.6) return null;
          const u = Math.min(draw, ((t - T.irani7) * 0.16 + off) % 1);
          const { p, ang } = along(u);
          const s = scr(p);
          const flip = Math.cos(ang) < 0;
          return <div key={i} style={{ position: "absolute", left: s.x - 30, top: s.y - 15, transform: `translateY(${(1 - k) * 160}px)` }}><Tanker size={60} rot={(ang * 180) / Math.PI + (flip ? 180 : 0)} /></div>;
        })}
        {(() => { const p = scr(proj(51.5, 27.2)); return <Pin x={p.x} y={p.y} t={t} text="خلیج فارس" size={30} o={ramp(t, T.irani7 - 0.2, T.irani7 + 0.1)} up={60} color={GOLD} />; })()}
        {(() => { const p = scr(proj(139.6, 35.6)); return <Pin x={p.x} y={p.y} t={t} text="ژاپن" size={30} o={ramp(t, T.vared, T.vared + 0.3)} up={60} color={GOLD} dx={-30} />; })()}
      </div>
    </div>
  );
};

// the border trace, paced by real length
const TRACE_A = () => T.nazdik;
const TRACE_END = T.marz + 0.6;
const KM_TOTAL = Object.values(BORDER_KM).reduce((a, b) => a + b, 0);
const traceStart = (i: number) => {
  let before = 0;
  for (let j = 0; j < i; j++) before += BORDER_KM[NEIGHBOURS[j][0]];
  return TRACE_A() + (TRACE_END - TRACE_A()) * (before / KM_TOTAL);
};
const BorderTrace: React.FC<{ t: number; S: number; o: number }> = ({ t, S, o }) => (
  <>
    {NEIGHBOURS.map(([key], i) => {
      const a = traceStart(i), b = i + 1 < NEIGHBOURS.length ? traceStart(i + 1) : TRACE_END;
      const draw = ramp(t, a, b, LIN);
      if (draw <= 0) return null;
      return <Shape key={key} d={BD[key]} o={o} stroke={GOLD} sw={S * 2.2} draw={draw} glow="rgba(255,211,77,.95)" />;
    })}
  </>
);

/* ---------------- montage ---------------- */
type Shot = { src: string; f0: [number, number, number]; f1: [number, number, number]; title: React.FC<{ t: number; a: number }> };
const SHOTS: Shot[] = [
  { src: "v49/img/onepiece-jigaraki.jpg", f0: [0.5, 0.5, 1.06], f1: [0.42, 0.5, 1.38], title: (p) => <TitleOnePiece {...p} /> },
  { src: "v49/img/spirited-hammam.jpg", f0: [0.5, 0.45, 1.06], f1: [0.5, 0.56, 1.5], title: (p) => <TitleSpirited {...p} /> },
  { src: "v49/img/titan-rooftops.jpg", f0: [0.62, 0.22, 1.32], f1: [0.74, 0.7, 1.5], title: (p) => <TitleTitan {...p} /> },
  { src: "v49/img/deathnote-konkur.jpg", f0: [0.5, 0.55, 1.08], f1: [0.6, 0.17, 1.55], title: (p) => <TitleDeathNote {...p} /> },
  { src: "v49/img/naruto-sangak.jpg", f0: [0.5, 0.5, 1.06], f1: [0.76, 0.52, 1.5], title: (p) => <TitleNaruto {...p} /> },
  { src: "v49/img/totoro-catbus.jpg", f0: [0.5, 0.5, 1.06], f1: [0.7, 0.45, 1.45], title: (p) => <TitleTotoro {...p} /> },
];
// pan/zoom that keeps the frame covered: point (fx, fy) moves toward the centre as far as the zoom allows
const frameOn = (fx: number, fy: number, z: number) => {
  const mx = ((z - 1) * 1080) / 2, my = ((z - 1) * 1920) / 2;
  const tx = Math.max(-mx, Math.min(mx, -(fx - 0.5) * 1080 * z));
  const ty = Math.max(-my, Math.min(my, -(fy - 0.5) * 1920 * z));
  return { tx, ty };
};
const Montage: React.FC<{ t: number }> = ({ t }) => {
  const i = Math.min(SHOTS.length - 1, Math.max(0, Math.floor((t - M[0]) / (4 * BEAT))));
  const a = M[i * 4], snapAt = M[i * 4 + 2], b = M[i * 4 + 4];
  const sh = SHOTS[i];
  const k = clamp01((t - a) / 0.22);
  const sn = ramp(t, snapAt - 0.04, snapAt + 0.2, E);
  const drift2 = ramp(t, a, b, LIN);
  const z = sh.f0[2] + (sh.f1[2] - sh.f0[2]) * sn + 0.04 * drift2;
  const fx = sh.f0[0] + (sh.f1[0] - sh.f0[0]) * sn, fy = sh.f0[1] + (sh.f1[1] - sh.f0[1]) * sn;
  const { tx, ty } = frameOn(fx, fy, z);
  const shake = t > snapAt && t < snapAt + 0.25 ? Math.sin(t * 90) * 8 * (1 - (t - snapAt) / 0.25) : 0;
  const ent: React.CSSProperties[] = [
    { transform: `scale(${1.3 - 0.3 * k})` },
    { transform: `translateX(${(1 - k) * 700}px)`, filter: k < 1 ? `blur(${(1 - k) * 18}px)` : undefined },
    { transform: `translateY(${(1 - k) * 900}px)`, filter: k < 1 ? `blur(${(1 - k) * 18}px)` : undefined },
    { transform: `scale(${0.8 + 0.2 * k}) rotate(${(1 - k) * -4}deg)` },
    { transform: `translateX(${(1 - k) * -700}px)`, filter: k < 1 ? `blur(${(1 - k) * 18}px)` : undefined },
    { clipPath: `circle(${8 + 92 * k}% at 50% 50%)` },
  ];
  const Title = sh.title;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, ...ent[i] }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <Img src={staticFile(sh.src)} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, objectFit: "cover", transform: `translate(${tx + shake}px, ${ty}px) scale(${z})` }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.72))" }} />
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: (1 - clamp01((t - a) / 0.12)) * 0.45 }} />
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: (1 - clamp01((t - snapAt) / 0.1)) * 0.18 * (t >= snapAt ? 1 : 0) }} />
      <Title t={t} a={a + 0.1} />
    </AbsoluteFill>
  );
};

/* anime titles: each one dressed like its famous logo, in Persian */
const TitleWrap: React.FC<{ t: number; a: number; y?: number; children: React.ReactNode }> = ({ t, a, y = 1650, children }) => (
  <div dir="rtl" style={{ position: "absolute", left: 0, right: 0, top: y, transform: `translateY(-50%) scale(${pop(t, a, 0.4)})`, opacity: ramp(t, a, a + 0.12), display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>{children}</div>
);
const stroke = (w: number, c: string): React.CSSProperties => ({ WebkitTextStroke: `${w}px ${c}`, paintOrder: "stroke fill" });
const TitleOnePiece: React.FC<{ t: number; a: number }> = ({ t, a }) => (
  <TitleWrap t={t} a={a}>
    <div style={{ fontFamily: FONT_HERO, fontSize: 150, lineHeight: 1, color: "#FFD21F", ...stroke(16, "#173B8C"), textShadow: "0 10px 0 #0d2459, 0 18px 30px rgba(0,0,0,.6)", transform: "rotate(-3deg)" }}>وان پیس</div>
    <div style={{ fontFamily: FONT_HERO, fontSize: 64, color: "#fff", background: "#C8102E", padding: "4px 40px 10px", borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,.5)", transform: "rotate(2deg)" }}>جگرکی</div>
  </TitleWrap>
);
const TitleSpirited: React.FC<{ t: number; a: number }> = ({ t, a }) => (
  <TitleWrap t={t} a={a}>
    <div style={{ fontFamily: FONT_HERO, fontSize: 140, lineHeight: 1.05, color: "#fff", textShadow: "0 0 18px rgba(200,30,40,.9), 0 0 50px rgba(200,30,40,.6), 0 6px 14px rgba(0,0,0,.7)" }}>شهر اشباح</div>
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: FONT_UI, fontWeight: 900, fontSize: 52, color: "#ffe9d6", textShadow: "0 3px 10px rgba(0,0,0,.8)" }}>
      <div style={{ width: 90, height: 3, background: "#ffe9d6" }} />حموم خان<div style={{ width: 90, height: 3, background: "#ffe9d6" }} />
    </div>
  </TitleWrap>
);
const TitleTitan: React.FC<{ t: number; a: number }> = ({ t, a }) => (
  <TitleWrap t={t} a={a}>
    <div style={{ fontFamily: FONT_HERO, fontSize: 132, lineHeight: 1.05, background: "linear-gradient(180deg,#f2f2f2 0%,#bdbdbd 45%,#6e6e6e 55%,#d9d9d9 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 2px #2a0000) drop-shadow(0 0 3px #2a0000) drop-shadow(0 0 22px rgba(170,0,0,.85))" }}>حمله به تایتان</div>
    <div style={{ fontFamily: FONT_HERO, fontSize: 60, color: "#fff", background: "#7a0000", padding: "2px 36px 8px", boxShadow: "0 8px 20px rgba(0,0,0,.6)", clipPath: "polygon(4% 0, 100% 0, 96% 100%, 0 100%)" }}>پشت‌بوم</div>
  </TitleWrap>
);
const TitleDeathNote: React.FC<{ t: number; a: number }> = ({ t, a }) => (
  <TitleWrap t={t} a={a}>
    <div style={{ background: "#0b0b0b", padding: "14px 46px 26px", border: "3px solid #e9e9e9", boxShadow: "0 18px 40px rgba(0,0,0,.7)", position: "relative" }}>
      <div style={{ fontFamily: FONT_HERO, fontSize: 132, lineHeight: 1.05, color: "#f4f4f4", textShadow: "0 0 14px rgba(255,255,255,.35)" }}>دفترچه کنکور</div>
      <div style={{ position: "absolute", left: 46, right: 46, bottom: 16, height: 6, background: "#c4161c" }} />
    </div>
  </TitleWrap>
);
const TitleNaruto: React.FC<{ t: number; a: number }> = ({ t, a }) => (
  <TitleWrap t={t} a={a}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width={110} height={110} viewBox="0 0 100 100" style={{ transform: `rotate(${t * 200}deg)` }}>
        <path d="M50 50 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 0 1 12 -12 a18 18 0 1 1 -18 18 a26 26 0 0 1 26 -26 a34 34 0 1 1 -34 34" fill="none" stroke="#FF7A00" strokeWidth={8} strokeLinecap="round" />
      </svg>
      <div style={{ fontFamily: FONT_HERO, fontSize: 160, lineHeight: 1, color: "#FF7A00", ...stroke(14, "#111"), textShadow: "0 10px 24px rgba(0,0,0,.6)" }}>ناروتو</div>
    </div>
    <div style={{ fontFamily: FONT_HERO, fontSize: 62, color: "#111", background: "#fff", padding: "2px 40px 8px", borderRadius: "40px 8px 40px 8px", boxShadow: "0 8px 20px rgba(0,0,0,.5)" }}>صف سنگک</div>
  </TitleWrap>
);
const TitleTotoro: React.FC<{ t: number; a: number }> = ({ t, a }) => (
  <TitleWrap t={t} a={a}>
    <div style={{ background: "#f3ecd6", borderRadius: 26, padding: "16px 40px 22px", boxShadow: "0 16px 40px rgba(0,0,0,.6)", textAlign: "center", border: "4px solid #2f5d34" }}>
      <div style={{ fontFamily: FONT_HERO, fontSize: 92, lineHeight: 1.1, color: "#2b2b2b" }}>همسایه‌ی من توتورو</div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 900, fontSize: 46, color: "#2f5d34" }}>🍃 ایستگاه ونک</div>
    </div>
  </TitleWrap>
);

/* ---------------- food ---------------- */
const FoodCard: React.FC<{ x: number; y: number; t: number; a: number; o: number; name: string; icon: React.ReactNode }> = ({ x, y, t, a, o, name, icon }) => {
  if (t < a - 0.05 || o <= 0.001) return null;
  return (
    <div dir="rtl" style={{
      position: "absolute", left: x, top: y, width: 290, height: 330, transform: `translate(-50%, -50%) scale(${pop(t, a - 0.05, 0.45)}) rotate(${Math.sin(x) * 3}deg)`, opacity: o,
      background: "#fffaf0", borderRadius: 30, boxShadow: "0 20px 40px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {icon}
      <div style={{ fontFamily: FONT_HERO, fontSize: 52, color: "#22303c", marginTop: 4 }}>{name}</div>
    </div>
  );
};
const Food: React.FC<{ t: number }> = ({ t }) => {
  const o = 1 - ramp(t, T.l16 - 0.5, T.l16 - 0.25);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <BigText y={960} text="نوبت غذاست!" size={130} o={win(t, MONT[1] + 0.15, T.l14 + 0.1, 0.2, 0.3)} s={pop(t, T.ghaza - 0.25, 0.5)} glow="rgba(143,227,136,.9)" />
      <Chip x={SW / 2} y={190} text="ایرانی‌ها در ژاپن" size={44} o={ramp(t, T.l14, T.l14 + 0.25)} s={pop(t, T.l14)} icon={<MiniFlag kind="ir" />} />
      <FoodCard x={850} y={600} t={t} a={T.sushi} o={1} name="سوشی" icon={<Sushi size={200} />} />
      <FoodCard x={540} y={600} t={t} a={T.ramen} o={1} name="رامن" icon={<Ramen size={200} />} />
      <FoodCard x={230} y={600} t={t} a={T.noodle} o={1} name="نودل" icon={<Noodles size={200} />} />
      <Chip x={SW / 2} y={1050} text="ژاپنی‌ها در ایران" size={44} o={ramp(t, T.l15, T.l15 + 0.25)} s={pop(t, T.l15)} icon={<MiniFlag kind="jp" />} />
      <FoodCard x={850} y={1610} t={t} a={T.ghorme} o={1} name="قرمه‌سبزی" icon={<Ghormeh size={200} />} />
      <FoodCard x={540} y={1610} t={t} a={T.kabab} o={1} name="کباب" icon={<Kabab size={200} />} />
      <FoodCard x={230} y={1610} t={t} a={T.dizi} o={1} name="دیزی" icon={<Dizi size={200} t={t} />} />
    </AbsoluteFill>
  );
};

const DiziShot: React.FC<{ t: number }> = ({ t }) => {
  const a = T.l16 - 0.25, b = T.l17;
  const k = ramp(t, a, a + 0.35, E);
  const z = 1.16 - 0.1 * ramp(t, a, b, LIN);
  // steam over the stone pot (≈ 54% across, 66% down in the picture), following the zoom
  const px = 540 + (0.54 * 1080 - 540) * z, py = 960 + (0.655 * 1920 - 960) * z;
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - k) * 50}% 0 ${(1 - k) * 50}% 0)` }}>
      <Photo src="v49/img/dizi-japanese.jpg" t={t} a={a} b={b} z0={z} z1={z} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((i) => {
          const u = ((t * 0.45 + i / 4) % 1 + 1) % 1;
          const x = px + (i - 1.5) * 26 + Math.sin(u * 6 + i) * 14;
          const y = py - u * 260;
          return <path key={i} d={`M${x},${y} q14,-24 0,-48 q-14,-24 0,-48`} stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={(1 - u) * u * 1.6 * 0.55} style={{ filter: "blur(3px)" }} />;
        })}
      </svg>
      <Chip x={SW / 2} y={300} text="گوشت‌کوب یا چاپستیک؟!" size={52} o={ramp(t, T.dizi16 - 0.1, T.dizi16 + 0.15)} s={pop(t, T.dizi16 - 0.1)} bg="rgba(8,16,24,.85)" color={GOLD} />
    </AbsoluteFill>
  );
};

/* ---------------- ending ---------------- */
const Ending: React.FC<{ t: number }> = ({ t }) => {
  const ph = ramp(t, T.l18 - 0.2, T.l18 + 0.3, E); // photos slide in
  const endO = ramp(t, T.l19 - 0.1, T.l19 + 0.3);
  return (
    <>
      {/* L17 */}
      <Motes t={t} o={win(t, T.l17, T.l18 + 0.2, 0.4, 0.3)} />
      <BigText y={960} text="یه چیز عوض نمی‌شه…" size={100} o={win(t, T.l17 + 0.1, T.l18, 0.3, 0.25)} s={pop(t, T.avaz - 0.2, 0.5)} glow="rgba(255,190,60,.85)" />
      {/* L18: Nowruz in Tokyo above, koinobori in Tehran below */}
      {ph > 0 && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 960, overflow: "hidden", transform: `translateX(${(1 - ph) * -1080}px)` }}>
            <Photo src="v49/img/nowruz-tokyo.jpg" t={t} a={T.l18} b={END} h={960} focusY={0.45} z0={1.04} z1={1.12} x0={10} x1={-20} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 960, width: SW, height: 960, overflow: "hidden", transform: `translateX(${(1 - ph) * 1080}px)` }}>
            <Photo src="v49/img/koinobori-tehran.jpg" t={t} a={T.l18} b={END} h={960} focusY={0.3} z0={1.04} z1={1.12} x0={-10} x1={20} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: "rgba(255,255,255,.9)", opacity: ph }} />
          <Chip x={SW / 2} y={190} text="نوروز در توکیو" size={44} o={ph * (1 - endO)} s={pop(t, T.l18 + 0.2)} icon={<MiniFlag kind="ir" />} />
          <Chip x={SW / 2} y={1040} text="کوینوبوری در تهران" size={44} o={ramp(t, T.farhang - 0.1, T.farhang + 0.15) * (1 - endO)} s={pop(t, T.farhang - 0.1)} icon={<MiniFlag kind="jp" />} />
        </>
      )}
      {/* L19: the question */}
      {endO > 0 && (
        <AbsoluteFill style={{ background: `rgba(4,10,16,${0.62 * endO})` }}>
          <BigText y={470} text="ژاپن یا ایران؟" size={140} o={endO} s={pop(t, T.l19 - 0.1, 0.5)} glow="rgba(255,211,77,.8)" />
          <Choice x={790} y={800} t={t} a={T.jp19} kind="jp" text="ژاپن" />
          <div style={{ position: "absolute", left: 540, top: 800, transform: `translate(-50%, -50%) scale(${pop(t, T.ya)})`, opacity: ramp(t, T.ya, T.ya + 0.15), fontFamily: FONT_HERO, fontSize: 70, color: "#fff", textShadow: "0 4px 12px rgba(0,0,0,.8)" }}>یا</div>
          <Choice x={290} y={800} t={t} a={T.ir19} kind="ir" text="ایران" />
          <div style={{ position: "absolute", left: SW / 2, top: 1090, transform: `translate(-50%, -50%) scale(${pop(t, T.e19 - 0.1) * (1 + 0.05 * Math.sin(t * 7))})`, opacity: ramp(t, T.e19 - 0.1, T.e19 + 0.1) }}>
            <Chip x={0} y={0} text="کامنت کن" size={60} o={1} bg="rgba(218,0,0,.95)" icon={<Bubble size={64} />} />
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};
const Choice: React.FC<{ x: number; y: number; t: number; a: number; kind: Kind; text: string }> = ({ x, y, t, a, kind, text }) => {
  if (t < a - 0.1) return null;
  const glow = kind === "jp" ? "rgba(188,0,45,.8)" : "rgba(35,159,64,.8)";
  return (
    <div dir="rtl" style={{
      position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${pop(t, a - 0.1, 0.45) * (1 + 0.03 * Math.sin(t * 5 + x))})`,
      display: "flex", alignItems: "center", gap: 22, padding: "22px 38px", borderRadius: 34, background: "rgba(12,20,28,.9)",
      boxShadow: `0 0 0 4px rgba(255,255,255,.85), 0 0 40px ${glow}, 0 20px 40px rgba(0,0,0,.6)`,
      fontFamily: FONT_HERO, fontSize: 84, color: "#fff", whiteSpace: "nowrap",
    }}>
      <MiniFlag kind={kind} w={96} />
      {text}
    </div>
  );
};

/* frames to check before a full render (seconds) */
export const V49_LOOK = (() => {
  const L: number[] = [0.4, T.beran + 0.3, T.jp1 + 0.2, T.ir1 + 0.25, T.chi + 0.5, T.n124 + 0.9, T.l3 + 0.2, T.zelzele + 0.5, T.atash + 1.0, T.nafte + 0.4, T.naft6 + 0.4, T.are + 0.3, T.manabe + 0.3, T.vared + 0.4, T.l8 + 0.4, T.n90 + 1.0, T.marz, T.marz + 0.8, T.hich + 0.3, T.ajib + 0.5, T.anime + 0.5, MONT[0] - 2 * BEAT + 0.2];
  for (let i = 0; i < 6; i++) L.push(M[i * 4] + 0.5, M[i * 4 + 2] + 0.5);
  L.push(T.ghaza, T.noodle + 0.5, T.dizi + 0.6, T.dizi16 + 0.4, T.avaz, T.farhang + 0.4, T.ir19 + 0.3, END - 0.3);
  return L;
})();
