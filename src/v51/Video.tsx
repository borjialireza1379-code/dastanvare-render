// v51 · «نادرشاه از اصفهان تا دهلی» — Agarlogy Short in the "strategy game" look: a campaign map with fog of war,
// a HUD (year, km, army, legendary loot), an objective bar, event cards with real public-domain / CC images, a battle card.
// Narration: the user's voice (1.2×), word times in vo.json. Timeline = narration lines (videos/51/script.txt).
import React from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from "remotion";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore json import
import land110 from "world-atlas/land-110m.json";
import { CITY, CityId, LL, P, ROUTE, ROUTE_LEN, cityD, pointAt, slice } from "./geo";
import { Cam, Explored, FX, FY, H, MapCanvas, W, toScreen } from "./MapLayer";
import { C, Captions, EventCard, FONT_B, FONT_T, Icon, Objective, PhotoCard, Shield, Stamp, Swords, Toast, TopBar, fa, faNum, panel, popStyle, useFonts } from "./ui";
import { E, END, FPS, FRAMES, S, Wd, back, clamp, ease, easeIn, easeOut, life, lin, mix } from "./timing";
import { rnd } from "./noise";

export const V51_FPS = FPS;
export const V51_FRAMES = FRAMES;
export const V51_LOOK = [0.1, 2.6, 5.1, 7.6, 10.6, 13.6, 19.6, 23.6, 28.2, 31.4, 35.1, 39.6, 44.9, 47.6, 50.3, 53.0, 56.2, 60.5, 62.2,
  66.1, 68.2, 71.0, 74.6, 77.9, 80.6, 86.8, 90.6, 93.4, 95.6, 98.9, 101.9, 105.2, 109.2, 112.6];

// ---------------- camera ----------------
type Key = { t: number; ll: LL; z: number };
const K = (t: number, ll: LL, z: number): Key => ({ t, ll, z });
const CAM: Key[] = [
  K(S(2) - 0.5, [64.6, 31.2], 0.56),
  K(E(2) + 0.2, [64.6, 31.2], 0.62),
  K(S(3) + 0.4, [52.0, 33.6], 1.05),
  K(E(3), [52.1, 33.4], 1.12),
  K(Wd(4, "چشمش") - 0.2, [64.6, 30.6], 0.62),
  K(Wd(4, "هند") + 0.3, [74.6, 29.6], 0.86),
  K(E(4) + 0.2, [75.6, 29.2], 0.98),
  K(S(5) + 0.35, [52.3, 32.3], 1.2),
  K(E(5), [52.4, 32.2], 1.32),
  K(S(6) + 0.3, [54.8, 31.8], 0.9),
  K(E(6), [64.8, 31.6], 1.0),
  K(S(7) + 0.2, [65.71, 31.68], 2.0),
  K(E(9), [65.68, 31.64], 2.3),
  K(Wd(10, "سقوط"), [65.71, 31.66], 2.2),
  K(S(11) + 0.3, [67.3, 32.7], 1.25),
  K(E(11), [67.4, 32.7], 1.3),
  K(S(12) + 0.15, [71.2, 31.5], 0.66),
  K(E(12) + 0.1, [71.3, 31.4], 0.68),
  K(S(13) + 0.2, [70.5, 34.05], 1.35),
  K(S(14) + 0.2, [70.85, 34.2], 2.1),
  K(E(15), [70.9, 34.15], 2.35),
  K(E(16) + 0.2, [73.2, 32.6], 1.0),
  K(Wd(17, "نبرد") - 0.3, [76.85, 29.95], 1.55),
  K(S(20), [76.92, 29.82], 1.65),
  K(S(20) + 0.6, [76.98, 29.74], 2.3),
  K(E(21), [76.98, 29.72], 2.4),
  K(S(22), [77.0, 29.5], 1.7),
  K(E(22) + 0.3, [77.05, 29.4], 1.72),
  K(S(23), [77.21, 28.72], 1.8),
  K(E(23), [77.21, 28.68], 2.0),
  K(E(25), [77.21, 28.66], 2.35),
  K(S(26), [77.21, 28.66], 1.6),
  K(E(27), [77.21, 28.66], 1.62),
  K(S(29), [64.6, 30.6], 0.62),
  K(END, [64.6, 30.6], 0.68),
];
const camAt = (t: number): Cam => {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i], b = CAM[i + 1];
  const k = ease(lin(t, a.t, b.t));
  const pa = P(a.ll), pb = P(b.ll);
  const z = Math.exp(mix(Math.log(a.z), Math.log(b.z), k));
  return { x: mix(pa[0], pb[0], k) + Math.sin(t * 0.37) * 5 / z, y: mix(pa[1], pb[1], k) + Math.cos(t * 0.29) * 4 / z, z };
};

// ---------------- the army along the route ----------------
const D = (c: CityId) => cityD(c);
const MOVES: [number, number, number, number][] = [ // t0, t1, d0, d1
  [S(6) + 0.4, E(6) - 0.2, 0, D("kandahar")],
  [E(12) + 0.05, S(13) + 0.3, D("kandahar"), D("jalalabad")],
  [Wd(15, "غافلگیرشون") + 0.9, Wd(17, "نبرد") - 0.2, D("jalalabad"), D("karnal")],
  [E(22) + 0.1, S(23) + 0.3, D("karnal"), D("delhi")],
];
const armyD = (t: number) => {
  let d = 0;
  for (const [t0, t1, d0, d1] of MOVES) { if (t >= t0) d = mix(d0, d1, ease(lin(t, t0, t1))); }
  return d;
};
const RET0 = S(29) + 0.1, RET1 = E(29) + 0.5;
const retK = (t: number) => ease(lin(t, RET0, RET1));
const moving = (t: number) => MOVES.some(([t0, t1]) => t > t0 && t < t1) || (t > RET0 && t < RET1);

const yearAt = (t: number) => (t >= S(17) ? 1739 : t >= Wd(10, "۱۷۳۸") ? 1738 : t >= E(6) - 0.2 ? 1737 : 1736);

// ---------------- world inset (L28) ----------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND110 = feature(land110 as any, (land110 as any).objects.land) as any;
const WORLD_W = 940, WORLD_H = 470;
const WPROJ = geoNaturalEarth1().rotate([-30, 0]).fitExtent([[10, 10], [WORLD_W - 10, WORLD_H - 10]], { type: "Sphere" });
const WORLD_D = geoPath(WPROJ)(LAND110) ?? "";
const WP = (ll: LL) => WPROJ(ll) as [number, number];

// ---------------- helpers ----------------
const pathD = (pts: [number, number][]) => pts.length ? "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") : "";
const along = (pts: [number, number][], step: number, offset: number) => {
  const out: { x: number; y: number; a: number }[] = [];
  let acc = -offset;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (!L) continue;
    while (acc + step <= L) { acc += step; const k = acc / L; out.push({ x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, a: Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI }); }
    acc -= L;
  }
  return out;
};

const Label: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; k?: number; font?: string }> = ({ x, y, text, size = 31, color = C.text, k = 1, font = FONT_B }) =>
  k <= 0.01 ? null : (
    <text x={x} y={y} textAnchor="middle" direction="rtl" fontFamily={font} fontWeight={900} fontSize={size} fill={color} opacity={k}
      stroke="rgba(22,12,4,0.92)" strokeWidth={8} paintOrder="stroke" strokeLinejoin="round">{text}</text>
  );

const Token: React.FC<{ x: number; y: number; color: string; hi: string; badge?: string; k?: number; bob?: number; shake?: number; flag?: boolean; id: string }> =
  ({ x, y, color, hi, badge, k = 1, bob = 0, shake = 0, flag = true, id }) => {
    if (k <= 0.01) return null;
    const s = back(clamp(k));
    return (
      <g transform={`translate(${x + shake},${y + bob}) scale(${s})`} opacity={clamp(k * 2)}>
        <defs><radialGradient id={`tok-${id}`} cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor={hi} /><stop offset="1" stopColor={color} /></radialGradient></defs>
        <ellipse cy={50} rx={38} ry={9} fill="rgba(0,0,0,0.45)" />
        <circle r={46} fill={C.ink} stroke={C.goldHi} strokeWidth={5} />
        <circle r={38} fill={`url(#tok-${id})`} />
        {flag && (<>
          <line x1={-11} y1={-24} x2={-11} y2={26} stroke={C.text} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M-9,-24 H22 L13,-13 L22,-2 H-9 Z" fill={C.text} />
        </>)}
        {badge && (
          <g transform="translate(0,62)">
            <rect x={-64} y={-19} width={128} height={38} rx={19} fill="rgba(20,12,5,0.94)" stroke={C.gold} strokeWidth={2.5} />
            <text textAnchor="middle" y={10} direction="rtl" fontFamily={FONT_B} fontWeight={900} fontSize={26} fill={C.text}>{badge}</text>
          </g>
        )}
      </g>
    );
  };

// ---------------- the composition ----------------
export const V51: React.FC<{ silent?: boolean; times?: number[] }> = ({ silent, times }) => {
  const frame = useCurrentFrame();
  const t = times ? times[Math.min(frame, times.length - 1)] : frame / FPS;
  const fontsOk = useFonts();
  const cam = camAt(t);
  const sc = (ll: LL) => { const p = P(ll); return toScreen(cam, p[0], p[1]); };
  const scw = (x: number, y: number) => toScreen(cam, x, y);

  // army + exploration
  const ad = armyD(t);
  const rk = retK(t);
  const maxD = t >= RET0 ? ROUTE_LEN : ad;
  const armyPos = t >= RET0 ? pointAt(ROUTE_LEN * (1 - rk)) : pointAt(ad);
  const reached = (c: CityId) => t >= S(2) && cityD(c) <= maxD + 2;
  const spy = life(t, Wd(4, "چشمش") - 0.1, S(5) + 0.5, 0.6, 0.6);
  const pd = P(CITY.delhi.ll);
  const explored: Explored = {
    lines: maxD > 1 ? [slice(0, maxD)] : [],
    width: 330,
    circles: [
      ...(t >= S(2) - 0.5 ? [{ ...xy(P(CITY.isfahan.ll)), r: 190 }] : []),
      ...ROUTE.filter((c) => c !== "isfahan" && reached(c)).map((c) => ({ ...xy(P(CITY[c].ll)), r: 150 })),
      ...(spy > 0 ? [{ x: pd[0], y: pd[1], r: 200 * spy }] : []),
    ],
  };

  // phases
  const hookK = 1 - lin(t, S(2) - 0.45, S(2) + 0.25);
  const mapK = lin(t, S(2) - 0.6, S(2) + 0.1);
  const solemn = life(t, S(24) - 0.25, S(26) - 0.05, 0.8, 0.7);
  const hudK = clamp(lin(t, S(2) + 0.2, S(2) + 0.7)) * (1 - 0.88 * solemn);
  const capY = t < S(2) - 0.2 ? 1390 : 1350;

  // HUD values
  const km = t >= RET0 ? pointAt(ROUTE_LEN).km * (1 + rk) : armyPos.km;
  const men = t < S(5) ? "—" : faNum(80000 * easeOut(lin(t, Wd(5, "۸۰") - 0.3, Wd(5, "نفر") + 0.2)));
  const lootN = (t >= Wd(27, "طاووس") - 0.1 ? 1 : 0) + (t >= Wd(27, "کوه") - 0.1 ? 1 : 0) + (t >= Wd(27, "دریای") - 0.1 ? 1 : 0);
  const pulse = (t0: number) => Math.max(0, 1 - Math.abs(t - t0) / 0.45);
  const bump = [
    Math.max(pulse(S(3) + 0.35), pulse(E(6) - 0.15), pulse(Wd(10, "۱۷۳۸") + 0.1), pulse(S(17) + 0.1)),
    moving(t) ? 0.35 : 0,
    pulse(Wd(5, "نفر") + 0.2),
    Math.max(pulse(Wd(27, "طاووس")), pulse(Wd(27, "کوه")), pulse(Wd(27, "دریای"))),
  ];

  // objective
  const obj = (() => {
    if (t < S(6)) return null;
    const p = (a: CityId, b: CityId) => clamp((ad - cityD(a)) / (cityD(b) - cityD(a)));
    if (t >= RET0) return { text: "بازگشت به ایران", prog: rk, flash: pulse(RET0 + 0.2), right: undefined };
    if (t >= S(26)) return { text: "هدف: خزانه", prog: lootN / 3, flash: pulse(S(26) + 0.2), right: `${fa(lootN)} از ${fa(3)}` };
    if (t >= S(23) + 0.3) return { text: "دهلی فتح شد", prog: 1, flash: pulse(S(23) + 0.5), right: undefined };
    if (t >= S(12)) return { text: "هدف: دهلی", prog: p("kandahar", "delhi"), flash: pulse(S(12) + 0.25),
      right: `${faNum(Math.max(0, pointAt(cityD("delhi")).km - armyPos.km))} کیلومتر مانده` };
    return { text: "هدف: قندهار", prog: t < Wd(10, "سقوط") ? p("isfahan", "kandahar") * 0.5 + (ad >= cityD("kandahar") - 1 ? 0.5 * lin(t, S(7), Wd(10, "سقوط")) : 0) : 1,
      flash: pulse(Wd(6, "قندهار")), right: t >= S(7) && t < Wd(10, "سقوط") ? "در حال محاصره" : undefined };
  })();

  // ----- map overlay (svg) -----
  const planned = slice(0, ROUTE_LEN).map(([x, y]) => scw(x, y));
  const plannedReveal = ease(lin(t, S(2) - 0.1, E(2) + 0.4));
  const plannedVis = planned.slice(0, Math.max(2, Math.round(planned.length * plannedReveal)));
  const travelled = maxD > 1 && t < RET0 ? slice(0, ad).map(([x, y]) => scw(x, y)) : t >= RET0 ? slice(0, ROUTE_LEN).map(([x, y]) => scw(x, y)) : [];
  const goldBack = t >= RET0 ? slice(ROUTE_LEN * (1 - rk), ROUTE_LEN).map(([x, y]) => scw(x, y)) : [];
  const chev = along(travelled, 62, (t * 46) % 62);
  const [ax, ay] = scw(armyPos.x, armyPos.y);
  const bob = moving(t) ? Math.sin(t * 18) * 3 : Math.sin(t * 2.2) * 2;

  // scene-specific map positions
  const [kx, ky] = sc(CITY.kandahar.ll);
  const [khx, khy] = sc(CITY.khyber.ll);
  const [krx, kry] = sc(CITY.karnal.ll);
  const [dx, dy] = sc(CITY.delhi.ll);
  const siege = t >= S(7) - 0.2 && t < S(11);
  const battle = t >= Wd(17, "نبرد") - 0.6 && t < E(22) + 0.2;
  let nx = ax, ny = ay;
  if (siege) { nx = ax - 92; ny = ay + 34; }
  if (battle) { nx = ax - 96; ny = ay - 62; }

  const cityState = (c: CityId) => {
    if (!CITY[c].fa) return null;
    const vis = c === "isfahan" ? t >= S(2) : c === "delhi" ? t >= S(2) + 0.6 : c === "kandahar" ? t >= S(6) : c === "khyber" ? t >= S(13) - 0.2 && t < E(16) + 1
      : c === "karnal" ? reached(c) && !battle : reached(c);
    if (!vis) return null;
    let taken = cityD(c) <= maxD + 2 && c !== "isfahan";
    if (c === "kandahar") taken = t >= Wd(10, "سقوط");
    if (c === "karnal") taken = t >= Wd(21, "شکست");
    if (c === "delhi") taken = t >= S(23) + 0.3;
    return { taken };
  };

  const flank: [number, number][] = ([[70.45, 34.43], [70.6, 34.16], [70.86, 33.95], [71.2, 33.93], [71.38, 34.02], [71.3, 34.09]] as LL[]).map((ll) => sc(ll));
  const flankK = easeOut(lin(t, S(15) + 0.3, Wd(15, "غافلگیرشون")));
  const flankPts = flank.slice(0, Math.max(2, Math.ceil(flank.length * flankK)));
  const surprise = Wd(15, "غافلگیرشون");

  const fugitives = ([["ghazni"], ["kabul"]] as [CityId][]).map(([c]) => {
    const [x, y] = sc(CITY[c].ll); const kk = easeOut(lin(t, S(11) + 0.3, Wd(11, "پناه")));
    return { x0: kx, y0: ky, x1: mix(kx, x, kk), y1: mix(ky, y, kk), k: life(t, S(11) + 0.2, E(11) + 0.3, 0.3, 0.4) };
  });

  return (
    <AbsoluteFill style={{ background: "#0B0805", overflow: "hidden" }}>
      {/* ===== map ===== */}
      <div style={{ position: "absolute", inset: 0, opacity: mapK }}>
        <MapCanvas cam={cam} explored={explored} fog={1} frame={frame}
          style={{ filter: solemn > 0 ? `grayscale(${solemn}) brightness(${1 - 0.5 * solemn}) contrast(${1 + 0.1 * solemn})` : undefined }} />
        {solemn > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(70,0,0,${0.32 * solemn})` }} />}
        {fontsOk && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - 0.75 * solemn }}>
            <defs>
              <radialGradient id="clash"><stop offset="0" stopColor="rgba(255,190,90,0.95)" /><stop offset="0.5" stopColor="rgba(230,90,40,0.55)" /><stop offset="1" stopColor="rgba(230,90,40,0)" /></radialGradient>
              <radialGradient id="goldglow"><stop offset="0" stopColor="rgba(255,220,130,0.9)" /><stop offset="1" stopColor="rgba(255,200,90,0)" /></radialGradient>
            </defs>
            {/* planned route */}
            <path d={pathD(plannedVis)} fill="none" stroke="rgba(20,10,3,0.55)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathD(plannedVis)} fill="none" stroke="#F6E7C1" strokeWidth={5} strokeDasharray="3 13" strokeDashoffset={-t * 30} strokeLinecap="round" opacity={0.9} />
            {/* travelled */}
            {travelled.length > 1 && (<>
              <path d={pathD(travelled)} fill="none" stroke="rgba(25,10,3,0.75)" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
              <path d={pathD(travelled)} fill="none" stroke={C.redHi} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
              {chev.map((c, i) => (
                <path key={i} d="M-6,-6 L3,0 L-6,6" transform={`translate(${c.x},${c.y}) rotate(${c.a})`} fill="none" stroke="#FFE7B0" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </>)}
            {goldBack.length > 1 && (<>
              <path d={pathD(goldBack)} fill="none" stroke="rgba(255,210,110,0.5)" strokeWidth={30} strokeLinecap="round" style={{ filter: "blur(6px)" }} />
              <path d={pathD(goldBack)} fill="none" stroke={C.goldHi} strokeWidth={9} strokeLinecap="round" />
            </>)}
            {/* fugitives (L11) */}
            {fugitives.map((f, i) => f.k > 0 && (
              <g key={i} opacity={f.k}>
                <line x1={f.x0} y1={f.y0} x2={f.x1} y2={f.y1} stroke={C.greenHi} strokeWidth={6} strokeDasharray="10 9" strokeLinecap="round" />
                <circle cx={f.x1} cy={f.y1} r={9} fill={C.greenHi} stroke={C.ink} strokeWidth={2} />
              </g>
            ))}
            {/* cities */}
            {ROUTE.map((c) => {
              const st = cityState(c); if (!st) return null;
              const [x, y] = sc(CITY[c].ll);
              if (c === "khyber") return (
                <g key={c}>
                  <path d={`M${x - 16},${y + 10} L${x - 4},${y - 13} L${x + 4},${y + 2} L${x + 10},${y - 7} L${x + 19},${y + 10} Z`} fill={C.text} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
                  <Label x={x} y={y - 26} text={CITY[c].fa} size={27} color={C.goldHi} />
                </g>
              );
              const big = c === "delhi" || c === "isfahan";
              return (
                <g key={c}>
                  {st.taken && (<>
                    <line x1={x} y1={y} x2={x} y2={y - 40} stroke={C.ink} strokeWidth={4} />
                    <path d={`M${x + 1},${y - 40} L${x + 28},${y - 33} L${x + 1},${y - 25} Z`} fill={C.redHi} stroke={C.ink} strokeWidth={2} />
                  </>)}
                  <circle cx={x} cy={y} r={big ? 14 : 11} fill={C.ink} stroke={c === "delhi" && !st.taken ? C.greenHi : C.goldHi} strokeWidth={big ? 5 : 3.5} />
                  <circle cx={x} cy={y} r={big ? 5.5 : 4.5} fill={st.taken ? C.redHi : c === "isfahan" ? C.redHi : C.goldHi} />
                  <Label x={x} y={y + (big ? 52 : 44)} text={CITY[c].fa} size={big ? 40 : 31} color={big ? C.goldHi : C.text} font={big ? FONT_T : FONT_B} />
                </g>
              );
            })}
            {/* Isfahan start pulse (L2) */}
            {(() => { const k = life(t, S(2), E(2) + 0.8, 0.3, 0.5); if (k <= 0) return null; const [x, y] = sc(CITY.isfahan.ll); const r = 20 + ((t * 1.6) % 1) * 60;
              return <circle cx={x} cy={y} r={r} fill="none" stroke={C.goldHi} strokeWidth={4} opacity={k * (1 - ((t * 1.6) % 1))} />; })()}
            {/* Delhi objective ring */}
            {t >= S(2) + 0.6 && t < S(23) && (
              <circle cx={dx} cy={dy} r={34 + Math.sin(t * 3) * 3 + pulse(S(12) + 0.25) * 30} fill="none" stroke={C.goldHi} strokeWidth={3} strokeDasharray="7 7" />
            )}
            {/* spyglass at Delhi (L4) */}
            {spy > 0 && (
              <g opacity={spy}>
                <circle cx={dx} cy={dy} r={150 * cam.z * spy} fill="none" stroke={C.goldHi} strokeWidth={5} />
                <circle cx={dx} cy={dy} r={150 * cam.z * spy + 10} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={8} />
                <g transform={`translate(${dx},${dy - 70}) scale(${back(clamp(spy * 1.3))})`}>
                  <circle r={44} fill="url(#goldglow)" />
                  <foreignObject x={-30} y={-30} width={60} height={60}><Icon kind="chest" size={60} /></foreignObject>
                </g>
                <Label x={dx} y={dy + 120} text="خزانه‌ی دهلی" size={36} color={C.goldHi} font={FONT_T} />
              </g>
            )}
            {/* Hotaki at Kandahar (L6–L10) */}
            <Token id="hot" x={kx + 6} y={ky - 8} color={C.green} hi={C.greenHi} badge="هوتکی‌ها" k={life(t, Wd(6, "آخرین") - 0.1, Wd(10, "سقوط") + 0.25, 0.35, 0.25)}
              shake={t > Wd(10, "سقوط") - 0.4 && t < Wd(10, "سقوط") ? Math.sin(t * 70) * 5 : 0} />
            {/* siege ring + months (L7–L10) */}
            {(() => { const k = life(t, S(7) - 0.1, Wd(10, "سقوط") + 0.5, 0.4, 0.4); if (k <= 0) return null;
              const p = lin(t, S(7), Wd(10, "سقوط")); const r = 118; const segs = 11;
              return (
                <g opacity={k} transform={`translate(${kx},${ky})`}>
                  {Array.from({ length: segs }, (_, i) => {
                    const a0 = -90 + i * (360 / segs) + 3, a1 = a0 + 360 / segs - 6, on = p * segs > i;
                    const rad = (a: number) => (a * Math.PI) / 180;
                    return <path key={i} d={`M${r * Math.cos(rad(a0))},${r * Math.sin(rad(a0))} A${r},${r} 0 0 1 ${r * Math.cos(rad(a1))},${r * Math.sin(rad(a1))}`}
                      fill="none" stroke={on ? C.redHi : "rgba(255,240,210,0.35)"} strokeWidth={on ? 12 : 8} strokeLinecap="round" />;
                  })}
                  <g transform={`translate(0,${-r - 46})`}>
                    <rect x={-120} y={-26} width={240} height={50} rx={25} fill="rgba(20,12,5,0.94)" stroke={C.redHi} strokeWidth={3} />
                    <text textAnchor="middle" y={10} direction="rtl" fontFamily={FONT_B} fontWeight={900} fontSize={28} fill={C.text}>{`محاصره · ماه ${fa(Math.min(11, Math.max(1, Math.ceil(p * 11))))}`}</text>
                  </g>
                </g>
              ); })()}
            {/* Naderabad construction (L8–L11) */}
            {(() => { const k = life(t, Wd(8, "شهر") - 0.2, S(12), 0.35, 0.4); if (k <= 0) return null;
              const p = lin(t, Wd(8, "شهر"), Wd(8, "نادرآباد") + 0.3); const x = kx - 170, y = ky + 150; const done = p >= 1;
              return (
                <g opacity={k} transform={`translate(${x},${y}) scale(${back(clamp(k))})`}>
                  <rect x={-34} y={-34} width={68} height={68} rx={14} fill={C.ink} stroke={done ? C.redHi : C.goldHi} strokeWidth={4} />
                  <path d="M-20,18 V-6 L-12,-14 L-4,-6 V-16 H4 V-6 L12,-14 L20,-6 V18 Z" fill={done ? C.redHi : "rgba(245,211,126,0.4)"} stroke={C.goldHi} strokeWidth={2.5} strokeLinejoin="round" />
                  <rect x={-90} y={46} width={180} height={18} rx={9} fill="rgba(0,0,0,0.7)" stroke={C.gold} strokeWidth={2} />
                  <rect x={-88} y={48} width={176 * p} height={14} rx={7} fill={C.goldHi} />
                  <text textAnchor="middle" y={100} direction="rtl" fontFamily={FONT_B} fontWeight={900} fontSize={30} fill={C.text} stroke="rgba(22,12,4,0.92)" strokeWidth={8} paintOrder="stroke">{done ? "نادرآباد" : "در حال ساخت…"}</text>
                </g>
              ); })()}
            {/* Khyber blocker (L14–L15) */}
            {(() => { const k = life(t, S(14) - 0.1, surprise + 0.5, 0.35, 0.35); if (k <= 0) return null;
              const hit = t > surprise ? Math.sin((t - surprise) * 60) * 6 * (1 - lin(t, surprise, surprise + 0.5)) : 0;
              return (
                <g>
                  <Token id="kh" x={khx + 8} y={khy - 4} color={C.green} hi={C.greenHi} k={k} shake={hit} />
                  <g opacity={k * (1 - lin(t, surprise, surprise + 0.4))} transform={`translate(${khx - 64},${khy + 6})`}>
                    {[-30, -10, 10, 30].map((o) => <line key={o} x1={o - 8} y1={22} x2={o + 8} y2={-22} stroke={C.redHi} strokeWidth={7} strokeLinecap="round" />)}
                    <line x1={-44} y1={-6} x2={44} y2={-6} stroke={C.ink} strokeWidth={6} />
                  </g>
                  <Label x={khx + 8} y={khy + 92} text="راه بسته‌ست" size={32} color="#FFB3A6" k={k * (1 - lin(t, surprise - 0.2, surprise + 0.2))} />
                </g>
              ); })()}
            {/* flank arrow (L15) */}
            {flankK > 0 && t < E(16) + 0.4 && (
              <g opacity={1 - lin(t, E(16), E(16) + 0.4)}>
                <path d={pathD(flankPts)} fill="none" stroke="rgba(20,10,3,0.7)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
                <path d={pathD(flankPts)} fill="none" stroke={C.goldHi} strokeWidth={8} strokeDasharray="14 10" strokeDashoffset={-t * 60} strokeLinecap="round" strokeLinejoin="round" />
                {(() => { const a = flankPts[flankPts.length - 2], b = flankPts[flankPts.length - 1]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
                  return <path d="M-14,-14 L10,0 L-14,14 Z" transform={`translate(${b[0]},${b[1]}) rotate(${ang})`} fill={C.goldHi} stroke={C.ink} strokeWidth={2.5} />; })()}
              </g>
            )}
            {/* Karnal: clash glow, cavalry arrows, zamburak fire */}
            {battle && (() => {
              const k = life(t, Wd(17, "نبرد") - 0.5, E(22) + 0.2, 0.4, 0.4);
              const cav = easeOut(lin(t, Wd(20, "سواره") - 0.2, E(20)));
              const arc = (sgn: number) => {
                const pts: [number, number][] = [];
                for (let i = 0; i <= 20; i++) {
                  const u = (i / 20) * cav, a = (-150 + 150 * u) * (Math.PI / 180) * sgn;
                  pts.push([krx - 40 + Math.cos(a) * 150, kry - 20 + Math.sin(a) * 130 * sgn]);
                }
                return pts;
              };
              const enemyK = 1 - lin(t, Wd(21, "شکست"), Wd(21, "شکست") + 0.5);
              return (
                <g opacity={k}>
                  <circle cx={krx} cy={kry} r={95 + Math.sin(t * 6) * 6} fill="url(#clash)" />
                  {cav > 0 && t < E(21) && [1, -1].map((s) => {
                    const pts = arc(s);
                    return <path key={s} d={pathD(pts)} fill="none" stroke={C.goldHi} strokeWidth={7} strokeDasharray="16 8" strokeDashoffset={-t * 80} strokeLinecap="round" opacity={0.95} />;
                  })}
                  {t > Wd(20, "زنبورک") - 0.1 && t < E(21) && Array.from({ length: 7 }, (_, i) => {
                    const ph = (t * 3 + i * 0.37) % 1; const x = nx + 40 + (i - 3) * 22, y = ny + 40 + rnd(i, 9) * 30;
                    return <circle key={i} cx={x + ph * 70} cy={y + ph * 40} r={10 * (1 - ph) + 2} fill={`rgba(255,${190 - ph * 120},80,${1 - ph})`} />;
                  })}
                  <Token id="mug" x={krx + 92} y={kry + 26} color={C.green} hi={C.greenHi} badge="گورکانی" k={enemyK * clamp(k * 1.5)}
                    shake={t > Wd(21, "شکست") - 0.6 && enemyK > 0 ? Math.sin(t * 60) * 5 : 0} />
                  <g transform={`translate(${krx},${kry})`}>
                    <circle r={32} fill="rgba(25,12,4,0.92)" stroke={C.goldHi} strokeWidth={4} />
                    <Swords s={0.8} />
                  </g>
                </g>
              );
            })()}
            {/* Delhi unrest fires (L23) */}
            {(() => { const k = life(t, Wd(23, "شورش") - 0.2, S(24) + 0.6, 0.3, 0.5); if (k <= 0) return null;
              return <g opacity={k}>{Array.from({ length: 9 }, (_, i) => {
                const a = rnd(i, 21) * Math.PI * 2, r = 30 + rnd(i, 22) * 70, fl = 0.75 + 0.25 * Math.sin(t * 13 + i);
                return <g key={i} transform={`translate(${dx + Math.cos(a) * r},${dy + Math.sin(a) * r * 0.7}) scale(${fl})`}>
                  <path d="M0,-26 C10,-12 14,-4 12,6 C10,16 -10,16 -12,6 C-14,-4 -6,-10 0,-26 Z" fill="rgba(255,120,40,0.9)" />
                  <path d="M0,-12 C5,-4 7,0 6,6 C5,11 -5,11 -6,6 C-7,0 -3,-4 0,-12 Z" fill="rgba(255,220,120,0.95)" />
                </g>; })}</g>; })()}
            {/* the army */}
            {t >= S(5) && (
              <Token id="nad" x={nx} y={ny} color={C.red} hi={C.redHi} k={easeOut(lin(t, S(5), S(5) + 0.4))} bob={bob}
                badge={t >= RET0 ? "با گنج" : undefined} />
            )}
            {/* recruits (L5) */}
            {(() => { const k = life(t, S(5) + 0.1, E(5) + 0.5, 0.3, 0.4); if (k <= 0) return null;
              const n = Math.round(14 * easeOut(lin(t, Wd(5, "۸۰") - 0.3, Wd(5, "نفر") + 0.3)));
              return <g opacity={k}>{Array.from({ length: n }, (_, i) => {
                const a = (i / 14) * Math.PI * 2 + t * 0.4; const r = 86 + (i % 2) * 22;
                return <g key={i} transform={`translate(${ax + Math.cos(a) * r},${ay + Math.sin(a) * r * 0.62})`}>
                  <circle r={10} fill={C.redHi} stroke={C.ink} strokeWidth={2.5} /><circle cy={-15} r={6} fill={C.text} stroke={C.ink} strokeWidth={2} />
                </g>; })}</g>; })()}
          </svg>
        )}
      </div>

      {/* ===== HUD ===== */}
      {fontsOk && (<>
        <TopBar k={hudK} year={t < S(3) ? "۱۷۳۶" : fa(yearAt(t))} km={faNum(km)} men={men} loot={fa(lootN)} bump={bump} />
        {obj && <Objective k={clamp(lin(t, S(6) - 0.1, S(6) + 0.3)) * (1 - 0.88 * solemn)} text={obj.text} prog={obj.prog} flash={obj.flash} right={obj.right} />}
      </>)}

      {/* ===== cards ===== */}
      {fontsOk && (<>
        {/* L3 achievement */}
        <EventCard k={life(t, S(3) + 0.2, E(3) + 0.45)} icon="crown" kicker="دستاورد باز شد" title="شاه ایران" body={`تاج‌گذاری در دشت مغان · ${fa(1736)}`} />
        {/* L9 upkeep */}
        {(() => { const k = life(t, S(9) + 0.05, E(9) + 0.35); if (k <= 0) return null; const g = lin(t, S(9), E(9));
          return (
            <div dir="rtl" style={{ ...panel, borderColor: C.redHi, position: "absolute", left: 90, right: 90, top: 340, borderRadius: 22, padding: "20px 26px", display: "flex", alignItems: "center", gap: 24, ...popStyle(k) }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, flexShrink: 0 }}>
                {Array.from({ length: 7 }, (_, i) => <div key={i} style={{ width: 22, height: 18 + i * 14 * clamp(g * 1.4 - i * 0.08), borderRadius: 4, background: `linear-gradient(180deg, ${C.redHi}, ${C.red})`, border: `1.5px solid ${C.goldHi}` }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 25, color: C.dim }}>هزینه‌ی نگهداری ارتش</span>
                <span style={{ fontFamily: FONT_T, fontSize: 52, color: "#FFB3A6" }}>هر ماه بیشتر</span>
                <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 27, color: C.text }}>{`غذا، علوفه و مواجب · ماه ${fa(Math.min(11, Math.max(1, Math.ceil(lin(t, S(7), Wd(10, "سقوط")) * 11))))} محاصره`}</span>
              </div>
            </div>
          ); })()}
        {/* L10 Kandahar falls */}
        <PhotoCard src="v51/footage/kandahar-ruins.jpg" k={life(t, Wd(10, "سقوط") - 0.05, S(11) + 0.55)} x={90} y={330} w={900} h={470}
          title="قندهار سقوط کرد" sub={`${fa(1738)} · پایان محاصره`} credit="ویرانه‌های ارگ قندهار کهنه · عکس بنجامین سیمپسون، ۱۸۸۱" push={lin(t, Wd(10, "سقوط"), S(11) + 0.5)} tag="فتح شد" />
        {/* L11 casus belli */}
        <EventCard k={life(t, Wd(11, "گورکانیان") - 0.25, E(11) + 0.35)} icon="scroll" kicker="بهانه‌ی جنگ به دست آمد" title="پناه به فراری‌ها" body="گورکانیان، فراری‌های افغان رو پناه دادن" accent={C.greenHi} />
        {/* L12 new objective */}
        <Toast text="مأموریت تازه: دهلی" k={life(t, S(12) + 0.1, E(12) + 0.7, 0.25, 0.3)} y={340} icon="goal" />
        {/* L13 Khyber photo */}
        <PhotoCard src="v51/footage/khyber.jpg" k={life(t, S(13) - 0.15, S(14) + 0.75)} x={90} y={330} w={900} h={520}
          title="گذرگاه خیبر" sub="دروازه‌ی کوهستانی هند" credit="ورودی گذرگاه خیبر · عکس جان برک، ۱۸۷۸" push={lin(t, S(13), S(14) + 0.7)} focus={[45, 55]} />
        {/* L15–16 */}
        <Stamp text="غافلگیری!" k={life(t, surprise - 0.05, E(15) + 0.4, 0.25, 0.3)} y={760} size={80} rot={-6} />
        <Toast text="راه هند باز شد" k={life(t, S(16), E(16) + 0.6, 0.25, 0.3)} y={340} icon="check" />
        {/* L17–21 battle card */}
        {(() => {
          const k = life(t, Wd(17, "نبرد") - 0.35, E(21) + 0.5, 0.35, 0.35); if (k <= 0) return null;
          const mshah = easeOut(lin(t, Wd(18, "محمدشاه") - 0.1, Wd(18, "محمدشاه") + 0.4));
          const pred = easeOut(lin(t, S(19) - 0.1, S(19) + 0.5));
          const flip = ease(lin(t, Wd(21, "شکست") - 0.1, Wd(21, "شکست") + 0.5));
          const redW = mix(15, 100, flip);
          const compact = easeOut(lin(t, S(20) - 0.1, S(20) + 0.4)) * (1 - easeOut(lin(t, Wd(21, "شکست") - 0.6, Wd(21, "شکست") - 0.1)));
          return (
            <div dir="rtl" style={{ ...panel, position: "absolute", top: 330, left: 60, right: 60, borderRadius: 24, ...popStyle(k),
              transform: `scale(${(0.86 + 0.14 * k) * (1 - 0.18 * compact)})`, transformOrigin: "50% 0%" }}>
              <div style={{ height: 112, borderRadius: "20px 20px 0 0", background: "linear-gradient(180deg, #A8342B, #6E1A14)", borderBottom: `3px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
                <svg width={64} height={64} viewBox="-34 -34 68 68"><Swords s={0.95} /></svg>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
                  <span style={{ fontFamily: FONT_T, fontSize: 70, color: "#FCE9B8", textShadow: "0 3px 0 rgba(0,0,0,0.55)" }}>نبرد کرنال</span>
                  <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 24, color: "#F1C9A0", marginTop: 4 }}>{`${fa(24)} فوریه ${fa(1739)} · شمال دهلی`}</span>
                </div>
                <svg width={64} height={64} viewBox="-34 -34 68 68"><Swords s={0.95} /></svg>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "18px 26px 0" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Shield color={C.red} hi={C.redHi} emblem="sun" size={92} />
                  <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 34, color: C.text, marginTop: 8 }}>سپاه نادر</span>
                </div>
                <span style={{ fontFamily: FONT_T, fontSize: 40, color: C.gold, padding: "0 10px" }}>در برابر</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  <div style={{ position: "relative", width: 110, height: 110 }}>
                    <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", opacity: 1 - mshah }}><Shield color={C.green} hi={C.greenHi} emblem="star" size={92} /></div>
                    <div style={{ position: "absolute", inset: 0, borderRadius: 55, overflow: "hidden", border: `4px solid ${C.greenHi}`, opacity: mshah, transform: `scale(${0.7 + 0.3 * mshah})`, background: "#111" }}>
                      <Img src={staticFile("v51/footage/mshah.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "62% 18%", transform: "scale(2.1)", transformOrigin: "62% 22%" }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 34, color: C.text, marginTop: 8 }}>{mshah > 0.5 ? "محمدشاه گورکانی" : "سپاه گورکانی"}</span>
                </div>
              </div>
              <div style={{ padding: "16px 40px 22px", opacity: pred }}>
                <div style={{ textAlign: "center", fontFamily: FONT_B, fontWeight: 700, fontSize: 23, color: C.dim, marginBottom: 8 }}>
                  {flip < 0.5 ? "پیش‌بینی بازی: پیروزی گورکانیان" : "نتیجه‌ی نبرد"}
                </div>
                <div style={{ display: "flex", height: 24, borderRadius: 12, overflow: "hidden", border: `2px solid ${C.gold}`, boxShadow: "0 0 0 3px rgba(0,0,0,0.5)" }}>
                  <div style={{ width: `${redW}%`, background: `linear-gradient(180deg, ${C.redHi}, ${C.red})` }} />
                  <div style={{ width: 4, background: C.goldHi }} />
                  <div style={{ flex: 1, background: `linear-gradient(180deg, ${C.greenHi}, ${C.green})` }} />
                </div>
              </div>
              <Stamp text="پیروزی" k={life(t, Wd(21, "شکست") + 0.05, E(21) + 0.5, 0.25, 0.3)} y={250} size={84} />
            </div>
          );
        })()}
        {/* L20 zamburak */}
        <PhotoCard src="v51/footage/zamburak.jpg" k={life(t, Wd(20, "زنبورک") - 0.25, E(20) + 0.55)} x={40} y={790} w={400} h={250}
          title="زنبورک" sub="تفنگ سبک روی شتر" credit="نمونه‌ای در نمایشگاه ۱۸۵۱ لندن · ریکزموزه" focus={[50, 58]} push={lin(t, Wd(20, "زنبورک"), E(20))} />
        <Toast text="چند ساعت بعد…" k={life(t, Wd(21, "ساعت") - 0.1, Wd(21, "شکست") + 0.1, 0.25, 0.25)} y={1180} icon="clock" />
        {/* L22 diplomacy */}
        {(() => { const k = life(t, S(22) - 0.1, E(22) + 0.4); if (k <= 0) return null;
          const av = (src: string, pos: string, col: string, label: string) => (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 150, height: 150, borderRadius: 75, overflow: "hidden", border: `5px solid ${col}`, boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
                <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: "scale(2.2)", transformOrigin: pos }} />
              </div>
              <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 30, color: C.text }}>{label}</span>
            </div>
          );
          return (
            <div dir="rtl" style={{ ...panel, position: "absolute", left: 80, right: 80, top: 340, borderRadius: 24, padding: "20px 24px 26px", ...popStyle(k) }}>
              <div style={{ textAlign: "center", fontFamily: FONT_B, fontWeight: 700, fontSize: 25, color: C.dim }}>دیپلماسی</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", marginTop: 12 }}>
                {av("v51/footage/nader.jpg", "50% 14%", C.redHi, "نادرشاه")}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: FONT_T, fontSize: 46, color: C.goldHi }}>مهمون ناخونده</span>
                  <svg width={160} height={40}><path d="M150,20 H18 M34,6 L14,20 L34,34" fill="none" stroke={C.goldHi} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 25, color: C.dim }}>رابطه: اجباری</span>
                </div>
                {av("v51/footage/mshah.jpg", "62% 18%", C.greenHi, "محمدشاه")}
              </div>
            </div>
          ); })()}
        {/* L23 Delhi */}
        <PhotoCard src="v51/footage/jama-masjid.jpg" k={life(t, S(23) - 0.1, Wd(23, "شورش") + 0.25)} x={90} y={330} w={900} h={500}
          title="دهلی" sub={`مارس ${fa(1739)}`} credit="مسجد جامع دهلی · آبرنگ توماس دانیل، ۱۷۹۷" push={lin(t, S(23), Wd(23, "شورش"))} tag="فتح شد" />
        {(() => { const k = life(t, Wd(23, "شورش") - 0.1, S(24) + 0.2); if (k <= 0) return null; const g = easeOut(lin(t, Wd(23, "شورش"), E(23)));
          const sh = Math.sin(t * 55) * 5 * g * (1 - lin(t, E(23) - 0.3, E(23)));
          return (
            <div dir="rtl" style={{ ...panel, borderColor: C.redHi, position: "absolute", left: 90, right: 90, top: 360, borderRadius: 22, padding: "22px 28px", ...popStyle(k), translate: `${sh}px 0` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Icon kind="fire" size={70} color="#FF8A5C" />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 25, color: C.dim }}>وضعیت شهر</span>
                  <span style={{ fontFamily: FONT_T, fontSize: 54, color: "#FFB3A6" }}>شورش در دهلی</span>
                </div>
              </div>
              <div style={{ marginTop: 14, height: 26, borderRadius: 13, background: "rgba(0,0,0,0.6)", border: `2px solid ${C.redHi}`, overflow: "hidden" }}>
                <div style={{ width: `${12 + 88 * g}%`, height: "100%", background: "linear-gradient(90deg, #FFB347, #D5483A)" }} />
              </div>
              <div style={{ marginTop: 6, fontFamily: FONT_B, fontWeight: 700, fontSize: 23, color: C.dim }}>ناآرامی</div>
            </div>
          ); })()}
        {/* L24–25: no game here */}
        <PhotoCard src="v51/footage/massacre-order.jpg" k={life(t, S(24) - 0.1, E(25) + 0.1, 0.6, 1.1)} x={170} y={300} w={740} h={980} plain fit="cover" focus={[50, 42]}
          push={lin(t, S(24), E(25))} credit="«نادرشاه فرمان قتل‌عام می‌دهد» · نگاره‌ی حکیم محمدخان" />
        {/* L26 treasury */}
        {(() => { const k = life(t, S(26) - 0.1, Wd(27, "طاووس") + 0.1, 0.35, 0.25); if (k <= 0) return null; const open = easeOut(lin(t, Wd(26, "خزانه") - 0.2, E(26)));
          return (
            <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", ...popStyle(k) }}>
              <div style={{ position: "relative", width: 300, height: 300 }}>
                <div style={{ position: "absolute", inset: -80, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,220,130,${0.75 * open}), rgba(255,200,90,0) 65%)` }} />
                <svg width={300} height={300} viewBox="0 0 120 120" style={{ position: "absolute", inset: 0 }}>
                  <rect x={18} y={56} width={84} height={50} rx={6} fill="#7A4A1E" stroke={C.goldHi} strokeWidth={3} />
                  <rect x={18} y={70} width={84} height={6} fill={C.gold} />
                  <rect x={54} y={64} width={12} height={16} rx={2} fill={C.goldHi} />
                  <g transform={`rotate(${-75 * open} 18 56)`}><path d="M18,56 C18,34 102,34 102,56 Z" fill="#8C5A26" stroke={C.goldHi} strokeWidth={3} /></g>
                  {open > 0.3 && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={30 + i * 9} cy={58 - ((t * 2 + i * 0.3) % 1) * 40 * open} r={3} fill={C.goldHi} opacity={1 - ((t * 2 + i * 0.3) % 1)} />)}
                </svg>
              </div>
              <span style={{ fontFamily: FONT_T, fontSize: 58, color: C.goldHi, textShadow: "0 4px 0 rgba(0,0,0,0.6)", marginTop: 10 }}>خزانه‌ی گورکانیان</span>
            </div>
          ); })()}
        {/* L27 three legendary items */}
        {([
          ["v51/footage/peacock.jpg", "تخت طاووس", Wd(27, "طاووس"), [50, 46], 40],
          ["v51/footage/kohinoor.jpg", "کوه نور", Wd(27, "کوه"), [50, 45], 380],
          ["v51/footage/darya.jpg", "دریای نور", Wd(27, "دریای"), [50, 50], 720],
        ] as [string, string, number, [number, number], number][]).map(([src, name, t0, focus, x], i) => (
          <PhotoCard key={i} src={src} k={life(t, t0 - 0.15, S(28) + 0.35, 0.3, 0.35)} x={x} y={380 + (i === 1 ? -20 : 20)} w={320} h={400}
            title={name} tag="افسانه‌ای" tagColor="#8A6A18" focus={focus} rot={(i - 1) * 3} push={lin(t, t0, S(28))} />
        ))}
        {/* L28 where they are today */}
        {(() => { const k = life(t, S(28) - 0.05, E(28) + 0.45); if (k <= 0) return null;
          const lon = WP([-0.12, 51.5]), teh = WP([51.39, 35.69]);
          const pin = (p: [number, number], t0: number, src: string, label: string) => { const d = easeOut(lin(t, t0, t0 + 0.45)); if (d <= 0) return null;
            return (
              <g transform={`translate(${p[0]},${p[1]})`}>
                <circle r={10} fill={C.goldHi} stroke={C.ink} strokeWidth={3} />
                <circle r={22 + ((t * 1.5) % 1) * 26} fill="none" stroke={C.goldHi} strokeWidth={3} opacity={1 - ((t * 1.5) % 1)} />
                <g transform={`translate(0,${-90 - (1 - d) * 140})`} opacity={d}>
                  <circle r={48} fill={C.ink} stroke={C.goldHi} strokeWidth={4} />
                  <clipPath id={`cp-${label}`}><circle r={44} /></clipPath>
                  <image href={staticFile(src)} x={-44} y={-44} width={88} height={88} preserveAspectRatio="xMidYMid slice" clipPath={`url(#cp-${label})`} />
                </g>
                <text y={48} textAnchor="middle" direction="rtl" fontFamily={FONT_B} fontWeight={900} fontSize={30} fill={C.text} stroke="rgba(22,12,4,0.92)" strokeWidth={8} paintOrder="stroke" opacity={d}>{label}</text>
              </g>
            ); };
          return (
            <div dir="rtl" style={{ ...panel, position: "absolute", left: 50, right: 50, top: 340, borderRadius: 24, padding: 14, ...popStyle(k) }}>
              <div style={{ textAlign: "center", fontFamily: FONT_T, fontSize: 48, color: C.goldHi, marginBottom: 6 }}>امروز کجان؟</div>
              <svg width={WORLD_W} height={WORLD_H} style={{ display: "block", margin: "0 auto", background: "#16303A", borderRadius: 12 }}>
                <path d={WORLD_D} fill="#B8975F" stroke="rgba(40,24,8,0.6)" strokeWidth={1} />
                {pin(lon, Wd(28, "لندنه") - 0.45, "v51/footage/kohinoor.jpg", "لندن · کوه نور")}
                {pin(teh, Wd(28, "تهرانه") - 0.6, "v51/footage/darya.jpg", "تهران · دریای نور")}
              </svg>
            </div>
          ); })()}
        {/* L30 the choice */}
        {(() => { const k = life(t, S(30) - 0.1, END + 1); if (k <= 0) return null;
          const hover = Math.sin((t - S(30)) * 2.2) > 0 ? 0 : 1;
          const btn = (label: string, icon: "goal" | "road", on: boolean) => (
            <div style={{ flex: 1, padding: "18px 10px 22px", borderRadius: 18, textAlign: "center", border: `3px solid ${on ? C.goldHi : C.gold}`,
              background: on ? "linear-gradient(180deg, #A8342B, #6E1A14)" : "rgba(0,0,0,0.45)", boxShadow: on ? `0 0 30px rgba(245,211,126,0.55)` : "none",
              transform: `scale(${on ? 1.04 : 1})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Icon kind={icon} size={54} />
              <span style={{ fontFamily: FONT_T, fontSize: 46, color: on ? "#FFE9B8" : C.text }}>{label}</span>
            </div>
          );
          return (
            <div dir="rtl" style={{ ...panel, position: "absolute", left: 70, right: 70, top: 360, borderRadius: 26, padding: "24px 26px 28px", ...popStyle(k) }}>
              <div style={{ textAlign: "center", fontFamily: FONT_B, fontWeight: 700, fontSize: 26, color: C.dim }}>انتخاب با توئه</div>
              <div style={{ textAlign: "center", fontFamily: FONT_T, fontSize: 56, color: C.goldHi, marginTop: 4 }}>بعد از فتح دهلی؟</div>
              <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
                {btn("برگرد ایران", "goal", hover === 0)}
                {btn("پیشروی کن", "road", hover === 1)}
              </div>
              <div style={{ textAlign: "center", fontFamily: FONT_B, fontWeight: 900, fontSize: 30, color: C.text, marginTop: 20 }}>جوابت رو کامنت کن</div>
            </div>
          ); })()}
      </>)}

      {/* ===== hook (L0–L2) ===== */}
      {hookK > 0.001 && fontsOk && (
        <div style={{ position: "absolute", inset: 0, opacity: hookK, background: "radial-gradient(circle at 50% 38%, #3A2A12 0%, #120C06 60%, #070503 100%)" }}>
          {(() => {
            const rew = lin(t, Wd(1, "۲۸۷") - 0.15, Wd(1, "نادرشاه") - 0.1);
            const dia = 1 - easeIn(lin(t, Wd(1, "نادرشاه") - 0.4, Wd(1, "نادرشاه") + 0.2));
            const sepia = lin(t, Wd(1, "اما"), Wd(1, "۲۸۷") + 0.6);
            return (<>
              <div style={{ position: "absolute", left: 40, right: 40, top: 230, height: 820, overflow: "hidden", borderRadius: 30, opacity: dia * (0.75 + 0.25 * lin(t, 0, 0.3)),
                boxShadow: "0 0 120px rgba(255,210,120,0.25)", filter: `sepia(${sepia * 0.8}) brightness(${1 - sepia * 0.35})` }}>
                <Img src={staticFile("v51/footage/kohinoor.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%",
                  transform: `scale(${1.05 + 0.12 * lin(t, 0, 6)})`, transformOrigin: "50% 38%" }} />
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${40 + 20 * ((t * 0.3) % 1)}% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 18%)`, mixBlendMode: "screen" }} />
                <div style={{ position: "absolute", left: 18, top: 16, fontFamily: FONT_B, fontWeight: 700, fontSize: 20, color: "rgba(255,240,215,0.8)", textShadow: "0 2px 4px #000" }}>عکس: بدلِ الماس کوه نور</div>
              </div>
              {/* item tooltip */}
              <div dir="rtl" style={{ ...panel, position: "absolute", left: 120, right: 120, top: 1000, borderRadius: 22, padding: "16px 28px 20px", opacity: dia, ...popStyle(easeOut(lin(t, 0, 0.3)) * dia, 0.9) }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: FONT_T, fontSize: 72, color: C.goldHi, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>کوه نور</span>
                  <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 26, color: "#2A1A06", background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`, padding: "4px 18px 8px", borderRadius: 12 }}>افسانه‌ای</span>
                </div>
                <div style={{ display: "flex", gap: 22, marginTop: 6, fontFamily: FONT_B, fontWeight: 700, fontSize: 28, color: C.text, opacity: easeOut(lin(t, Wd(0, "جواهرات") - 0.2, Wd(0, "جواهرات") + 0.2)) }}>
                  <span>{`${fa("105.6")} قیراط`}</span><span style={{ color: C.dim }}>·</span><span>جواهرات سلطنتی بریتانیا</span>
                </div>
              </div>
              {/* rewind 2026 → 1739 */}
              {rew > 0 && rew < 1.02 && t < Wd(1, "نادرشاه") + 0.3 && (
                <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", opacity: 1 - lin(t, Wd(1, "نادرشاه") - 0.1, Wd(1, "نادرشاه") + 0.25) }}>
                  <div style={{ fontFamily: FONT_T, fontSize: 210, lineHeight: 1, color: "#FFF1C9", textShadow: "0 0 40px rgba(255,200,100,0.7), 0 8px 0 rgba(0,0,0,0.6)" }}>
                    {fa(Math.round(mix(2026, 1739, easeOut(rew))))}
                  </div>
                  <div dir="rtl" style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 44, color: C.goldHi, marginTop: 10, textShadow: "0 3px 0 #000" }}>{`◀◀  ${fa(287)} سال به عقب`}</div>
                  <div style={{ position: "absolute", left: 0, right: 0, top: -300, height: 1400, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0) 2px 7px)",
                    transform: `translateY(${(t * 400) % 7}px)` }} />
                </div>
              )}
              {/* Nader portrait */}
              <PhotoCard src="v51/footage/nader.jpg" k={life(t, Wd(1, "نادرشاه") - 0.1, S(2) + 0.3, 0.4, 0.4)} x={190} y={250} w={700} h={760}
                title="نادرشاه افشار" sub={`شاه ایران · ${fa(1736)} تا ${fa(1747)}`} focus={[50, 22]} push={lin(t, Wd(1, "نادرشاه"), S(2) + 0.3)}
                credit="پرتره‌ی نادرشاه · نقاش ناشناس، اواخر قرن ۱۸" />
              <Toast text="خزانه‌ی گورکانیان هند" k={life(t, Wd(1, "خزانه") - 0.1, S(2) + 0.2, 0.25, 0.3)} y={1185} icon="chest" />
            </>);
          })()}
        </div>
      )}

      {/* ===== captions ===== */}
      {fontsOk && <Captions t={t} y={capY} />}
      {!silent && <Audio src={staticFile("v51/mix-norm.wav")} />}
    </AbsoluteFill>
  );
};

function xy(p: [number, number]) { return { x: p[0], y: p[1] }; }
export { FX, FY };

