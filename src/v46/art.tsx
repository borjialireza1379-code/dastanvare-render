// v46 · motion graphics drawn in code (all inside the 1000×860 footage window, or the info slot under it).
import React from "react";
import { INK, PAPER, YEL, back, clamp, eio, eo, fa } from "./kit";

export const BW = 1000, BH = 860; // window box

// ─── Starship drawn in SVG, centred on (0,0), nose up; belly (heat shield) on the left half ───
export const Ship: React.FC<{ x: number; y: number; r: number; flame?: number; glow?: number; s?: number; mx?: 1 | -1; t: number }> = ({ x, y, r, flame = 0, glow = 0, s = 1, mx = 1, t }) => {
  const fl = flame * (0.85 + 0.15 * Math.sin(t * 47) + 0.08 * Math.sin(t * 91));
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s * mx} ${s})`}>
      {glow > 0 && <ellipse cx="-56" cy="0" rx={60 + 50 * glow} ry={175 + 40 * glow} fill="url(#plasma)" opacity={glow} />}
      {fl > 0.02 && (
        <g>
          <path d={`M -26 150 Q 0 ${150 + 230 * fl} 26 150 Z`} fill="url(#flame)" />
          <path d={`M -14 150 Q 0 ${150 + 130 * fl} 14 150 Z`} fill="#FFF6C8" />
        </g>
      )}
      {/* aft flaps */}
      <path d="M -38 70 L -64 118 L -64 146 L -38 140 Z" fill="#2A2A2A" />
      <path d="M 38 70 L 64 118 L 64 146 L 38 140 Z" fill="#3A3A3A" />
      {/* body: steel with a dark belly half */}
      <path d="M -38 -60 L 38 -60 L 38 150 L -38 150 Z" fill="url(#steel)" />
      <path d="M -38 -60 L -4 -60 L -4 150 L -38 150 Z" fill="#1E1E1E" />
      {/* nose */}
      <path d="M -38 -60 C -38 -120 -16 -150 0 -158 C 16 -150 38 -120 38 -60 Z" fill="url(#steel)" />
      <path d="M -38 -60 C -38 -120 -16 -150 0 -158 L -4 -60 Z" fill="#1E1E1E" />
      {/* forward flaps */}
      <path d="M -34 -110 L -54 -84 L -54 -62 L -36 -66 Z" fill="#2A2A2A" />
      <path d="M 34 -110 L 54 -84 L 54 -62 L 36 -66 Z" fill="#3A3A3A" />
      {/* catch pins + panel lines */}
      <rect x="-44" y="-52" width="10" height="8" fill={INK} />
      <rect x="34" y="-52" width="10" height="8" fill={INK} />
      {[0, 40, 80, 120].map((yy) => <line key={yy} x1="-4" y1={-40 + yy} x2="38" y2={-40 + yy} stroke="#9AA0A6" strokeWidth="1.5" opacity="0.6" />)}
      <path d="M -38 -60 L 38 -60 L 38 150 L -38 150 Z M -38 -60 C -38 -120 -16 -150 0 -158 C 16 -150 38 -120 38 -60" fill="none" stroke={INK} strokeWidth="3" />
    </g>
  );
};

export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="steel" x1="0" x2="1">
      <stop offset="0" stopColor="#8E959C" />
      <stop offset="0.55" stopColor="#E3E6E8" />
      <stop offset="1" stopColor="#9EA5AB" />
    </linearGradient>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFF3B0" />
      <stop offset="0.35" stopColor={YEL} />
      <stop offset="0.75" stopColor="#FF8A1E" stopOpacity="0.8" />
      <stop offset="1" stopColor="#FF5A1E" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="plasma">
      <stop offset="0" stopColor="#FFF6D0" />
      <stop offset="0.35" stopColor="#FFC23A" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#FF6A1E" stopOpacity="0.5" />
      <stop offset="1" stopColor="#FF3A1E" stopOpacity="0" />
    </radialGradient>
  </defs>
);

// ─── the launch tower with its two «chopstick» arms ───
const TX = 610, TW = 80, TTOP = 140, GROUND = 760, ARM_Y = 300, ARM_L = 255;
const Tower: React.FC<{ open: number }> = ({ open }) => (
  <g>
    {/* lattice */}
    <rect x={TX} y={TTOP} width={TW} height={GROUND - TTOP} fill="none" stroke={INK} strokeWidth="6" />
    {Array.from({ length: 10 }, (_, i) => {
      const y0 = TTOP + i * 62;
      return (
        <g key={i} stroke={INK} strokeWidth="3">
          <line x1={TX} y1={y0} x2={TX + TW} y2={y0 + 62} />
          <line x1={TX + TW} y1={y0} x2={TX} y2={y0 + 62} />
          <line x1={TX} y1={y0} x2={TX + TW} y2={y0} />
        </g>
      );
    })}
    <rect x={TX - 8} y={TTOP - 18} width={TW + 16} height={18} fill={INK} />
    {/* carriage + two arms (seen from the side: one swings up, one down while open) */}
    <rect x={TX - 14} y={ARM_Y - 26} width={22} height={70} fill={INK} />
    {[-1, 1].map((sgn) => (
      <g key={sgn} transform={`rotate(${sgn * 22 * open} ${TX - 4} ${ARM_Y + sgn * 9})`}>
        <path d={`M ${TX - 4} ${ARM_Y + sgn * 9 - 10} L ${TX - 4 - ARM_L} ${ARM_Y + sgn * 9 - 6} L ${TX - 4 - ARM_L} ${ARM_Y + sgn * 9 + 8} L ${TX - 4} ${ARM_Y + sgn * 9 + 12} Z`} fill={sgn < 0 ? "#2B2B2B" : INK} />
        <rect x={TX - 4 - ARM_L} y={ARM_Y + sgn * 9 - 8} width="26" height="18" fill={YEL} />
      </g>
    ))}
  </g>
);

const Paper: React.FC<{ t: number }> = ({ t }) => (
  <>
    <rect width={BW} height={BH} fill="#ECE8DC" />
    {Array.from({ length: 26 }, (_, i) => <line key={`v${i}`} x1={i * 40 - ((t * 6) % 40)} y1="0" x2={i * 40 - ((t * 6) % 40)} y2={BH} stroke="#D8D2C0" strokeWidth="1.5" />)}
    {Array.from({ length: 22 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 40} x2={BW} y2={i * 40} stroke="#D8D2C0" strokeWidth="1.5" />)}
    <rect y={GROUND} width={BW} height={BH - GROUND} fill="#CFC8B3" />
    <line x1="0" y1={GROUND} x2={BW} y2={GROUND} stroke={INK} strokeWidth="5" />
    {Array.from({ length: 40 }, (_, i) => <line key={`g${i}`} x1={i * 28} y1={GROUND + 6} x2={i * 28 - 18} y2={GROUND + 30} stroke={INK} strokeWidth="2" opacity="0.35" />)}
  </>
);

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const CAUGHT = { x: TX - 4 - ARM_L / 2 + 2, y: ARM_Y + 52 + 60 }; // ship centre when its pins sit on the arms

/** the catch, as a technical drawing. Times are absolute seconds. */
export const CatchRecon: React.FC<{ t: number; fall0: number; flip: number; settle: number; close: number; launch?: number }> = ({ t, fall0, flip, settle, close, launch }) => {
  const P0 = { x: 90, y: 90 }, P1 = { x: 330, y: 230 }, P2 = { x: CAUGHT.x, y: CAUGHT.y - 120 };
  let x: number, y: number, r: number, flame = 0;
  if (t < flip) {
    const u = eio((t - fall0) / (flip - fall0));
    x = lerp(P0.x, P1.x, u);
    y = lerp(P0.y, P1.y, u) + 6 * Math.sin(t * 7);
    r = 90 + 4 * Math.sin(t * 5);
  } else if (t < flip + 0.7) {
    const u = (t - flip) / 0.7;
    x = lerp(P1.x, P2.x, eo(u));
    y = lerp(P1.y, P2.y, eo(u));
    r = 90 - 90 * back(u, 1.4);
  } else {
    const u = eo((t - flip - 0.7) / Math.max(0.4, settle - flip - 0.7));
    x = P2.x;
    y = lerp(P2.y, CAUGHT.y, u);
    r = 0;
  }
  flame = clamp((t - flip + 0.2) / 0.15) * clamp((settle + 0.15 - t) / 0.15);
  let open = 1 - eio((t - close) / 0.45);
  // a small clunk when the arms take the weight
  const bump = t > settle ? Math.exp(-(t - settle) * 9) * Math.sin((t - settle) * 40) * 6 : 0;
  y += bump;
  if (launch !== undefined && t >= launch) {
    const u = t - launch;
    open = eio(u / 0.5);
    flame = clamp(u / 0.12);
    y = CAUGHT.y - 0.5 * 380 * u * u;
    x = CAUGHT.x;
  }
  // dashed path behind the ship
  const prog = clamp((t - fall0) / (settle - fall0));
  return (
    <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`}>
      <Defs />
      <Paper t={t} />
      <path d={`M ${P0.x} ${P0.y} Q ${P1.x - 40} ${P1.y - 30} ${P1.x} ${P1.y} T ${P2.x} ${P2.y} L ${CAUGHT.x} ${CAUGHT.y}`} fill="none" stroke={INK} strokeWidth="4" strokeDasharray="10 14" opacity={0.35 * (launch !== undefined && t > launch ? 0 : 1)} strokeDashoffset={0} pathLength={1000} style={{ clipPath: `inset(0 ${100 - prog * 100}% 0 0)` }} />
      <Tower open={open} />
      <Ship x={x} y={y} r={r} flame={flame} t={t} mx={-1} />
      {/* yellow callout ring on the pins at the moment of catch */}
      {t > close + 0.3 && (launch === undefined || t < launch) && (
        <circle cx={CAUGHT.x} cy={ARM_Y} r={30 + 50 * eo((t - close - 0.3) / 0.4)} fill="none" stroke={YEL} strokeWidth="6" opacity={1 - eo((t - close - 0.3) / 0.6)} />
      )}
    </svg>
  );
};

// ─── belly-first dive into the atmosphere ───
export const BellyFlop: React.FC<{ t: number; a: number; b: number; w?: number; h?: number }> = ({ t, a, b, w = BW, h = BH }) => {
  const u = clamp((t - a) / (b - a));
  const x = lerp(w * 0.86, w * 0.3, eio(u)), y = lerp(h * 0.3, h * 0.5, eio(u));
  const heat = clamp(u * 1.4);
  const STARS = Array.from({ length: 70 }, (_, i) => [(i * 211) % w, (i * 97) % (h * 0.6), 1 + (i % 3)]);
  const ex = w / 2, ey = h + 1180 - h * 0.28 - 30 * u;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs />
      <defs>
        <linearGradient id="space" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03050B" />
          <stop offset="1" stopColor="#0B1834" />
        </linearGradient>
        <radialGradient id="earth" cx="0.5" cy="0.15" r="0.9">
          <stop offset="0" stopColor="#3C7CC2" />
          <stop offset="0.6" stopColor="#1B4A86" />
          <stop offset="1" stopColor="#0B2448" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#space)" />
      {STARS.map(([sx, sy, sr], i) => <circle key={i} cx={sx} cy={sy} r={sr} fill="#fff" opacity={0.35 + 0.3 * Math.sin(t * 2 + i)} />)}
      <circle cx={ex} cy={ey} r="1180" fill="url(#earth)" />
      <circle cx={ex} cy={ey} r="1196" fill="none" stroke="#8AD8FF" strokeWidth="18" opacity="0.45" style={{ filter: "blur(6px)" }} />
      {/* heat streaks behind the ship */}
      {Array.from({ length: 7 }, (_, i) => {
        const off = (i - 3) * 16;
        const len = 160 + 220 * heat + 40 * Math.sin(t * 9 + i);
        return <line key={i} x1={x + 60} y1={y + off + 30} x2={x + 60 + len} y2={y + off - len * 0.45 + 30} stroke={i % 2 ? YEL : "#FF7A1E"} strokeWidth={6 - Math.abs(i - 3)} strokeLinecap="round" opacity={0.25 + 0.5 * heat} />;
      })}
      <Ship x={x} y={y} r={-78} glow={0.35 + 0.65 * heat} t={t} s={w / 1000 * 1.25} />
    </svg>
  );
};

// ─── plane-in-the-bin pictogram (info slot) ───
export const PlaneX: React.FC<{ t: number; t0: number; out?: number }> = ({ t, t0, out = 0 }) => {
  const fly = eo((t - t0) / 0.6);
  const x1 = eio((t - t0 - 0.55) / 0.22), x2 = eio((t - t0 - 0.72) / 0.22);
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 1112, height: 250, opacity: clamp((t - t0) / 0.1) * (1 - out), transform: `rotate(-2deg) scale(${back((t - t0) / 0.4, 1.6)})` }}>
      <div style={{ position: "absolute", inset: 0, background: PAPER, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} />
      <svg width="840" height="250" viewBox="0 0 840 250" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${lerp(-120, 420, fly)} 125) rotate(-8)`}>
          <path d="M -150 0 C -150 -14 -136 -18 -110 -18 L 110 -18 C 140 -18 160 -8 168 0 C 160 8 140 18 110 18 L -110 18 C -136 18 -150 14 -150 0 Z" fill={INK} />
          <path d="M -20 -16 L -70 -92 L -40 -92 L 50 -16 Z" fill={INK} />
          <path d="M -20 16 L -70 92 L -40 92 L 50 16 Z" fill={INK} />
          <path d="M -140 -10 L -170 -56 L -150 -56 L -112 -12 Z" fill={INK} />
          {[-80, -50, -20, 10, 40, 70].map((wx) => <rect key={wx} x={wx} y="-7" width="14" height="9" rx="3" fill={PAPER} />)}
        </g>
        <line x1="300" y1="30" x2={300 + 240 * x1} y2={30 + 190 * x1} stroke={YEL} strokeWidth="30" strokeLinecap="round" />
        <line x1="540" y1="30" x2={540 - 240 * x2} y2={30 + 190 * x2} stroke={YEL} strokeWidth="30" strokeLinecap="round" />
        <line x1="300" y1="30" x2={300 + 240 * x1} y2={30 + 190 * x1} stroke={INK} strokeWidth="6" strokeLinecap="round" opacity="0.6" />
        <line x1="540" y1="30" x2={540 - 240 * x2} y2={30 + 190 * x2} stroke={INK} strokeWidth="6" strokeLinecap="round" opacity="0.6" />
      </svg>
      <div style={{ position: "absolute", right: 26, top: 14, font: `900 36px "RVazir"`, color: INK, direction: "rtl", opacity: clamp((t - t0 - 0.9) / 0.2) }}>یک پرواز، بعد سطل زباله</div>
    </div>
  );
};

// ─── cost per kilo chart (info slot) ───
const ROWS = [
  { label: "موشک‌های قدیمی", v: 18500 },
  { label: "فالکون ۹", v: 2900 },
  { label: "هدف استارشیپ", v: 100 },
];
export const CostChart: React.FC<{ t: number; t0: number; stamp: number; out?: number; top?: number }> = ({ t, t0, stamp, out = 0, top = 1108 }) => {
  const maxW = 380;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top, opacity: clamp((t - t0) / 0.12) * (1 - out), transform: `rotate(-1.5deg) scale(${back((t - t0) / 0.45, 1.6)})`, direction: "rtl" }}>
      <div style={{ background: PAPER, padding: "18px 30px 22px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", position: "relative" }}>
        <div style={{ position: "absolute", top: -20, right: 70, width: 120, height: 38, background: "rgba(255,214,10,0.88)", transform: "rotate(5deg)" }} />
        <div style={{ font: `800 30px "RVazir"`, color: "#555", marginBottom: 8 }}>هزینه‌ی بردن هر کیلو بار به مدار (دلار)</div>
        {ROWS.map((r, i) => {
          const k = eo((t - t0 - 0.25 - i * 0.35) / 0.6);
          const w = Math.max(10, (r.v / 18500) * maxW * k);
          const last = i === ROWS.length - 1;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", height: 62, gap: 16 }}>
              <div style={{ width: 225, flexShrink: 0, whiteSpace: "nowrap", font: `900 30px "RVazir"`, color: INK }}>{r.label}</div>
              <div style={{ width: w, height: 34, background: last ? YEL : INK, border: last ? `3px solid ${INK}` : undefined, opacity: clamp(k * 3) }} />
              <div style={{ font: `400 46px "RLalezar"`, color: INK, opacity: clamp((k - 0.6) * 3) }}>{last ? "زیر " : ""}{fa(r.v * (last ? 1 : k))}</div>
            </div>
          );
        })}
        {t > stamp && (
          <div style={{ position: "absolute", left: 24, top: 40, transform: `rotate(-10deg) scale(${back((t - stamp) / 0.3, 2.6)})`, opacity: clamp((t - stamp) / 0.06), border: `6px solid ${INK}`, background: YEL, color: INK, padding: "2px 22px 10px", font: `400 64px "RLalezar"` }}>۱۰۰ برابر ارزان‌تر</div>
        )}
      </div>
    </div>
  );
};

// ─── a booster icon falling into the gulf, with ripples (over the gulf photo) ───
export const Splash: React.FC<{ t: number; t0: number; x: number; y: number; w?: number; h?: number }> = ({ t, t0, x, y, w = BW, h = BH }) => {
  const u = clamp((t - t0) / 1.1);
  const bx = lerp(x + 330, x, u), by = lerp(y - 380, y, u * u);
  const hit = t - t0 - 1.1;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
      <path d={`M ${x + 330} ${y - 380} Q ${x + 120} ${y - 330} ${bx} ${by}`} fill="none" stroke={YEL} strokeWidth="5" strokeDasharray="10 12" opacity={hit < 0.6 ? 0.9 : 0.9 - (hit - 0.6)} />
      {hit < 0 && (
        <g transform={`translate(${bx} ${by}) rotate(${-150 + 60 * u})`}>
          <rect x="-11" y="-60" width="22" height="120" rx="4" fill="#E9ECEF" stroke={INK} strokeWidth="3" />
          <rect x="-11" y="-60" width="22" height="16" fill={INK} />
        </g>
      )}
      {hit >= 0 &&
        [0, 0.25, 0.5].map((d, i) => {
          const k = clamp((hit - d) / 1.2);
          return <ellipse key={i} cx={x} cy={y} rx={20 + 120 * k} ry={(20 + 120 * k) * 0.38} fill="none" stroke={YEL} strokeWidth={6 * (1 - k) + 1} opacity={1 - k} />;
        })}
      {hit >= 0 && (
        <g transform={`translate(${x} ${y}) scale(${back(hit / 0.3, 2.4)})`} opacity={clamp(hit / 0.05)}>
          <line x1="-22" y1="-22" x2="22" y2="22" stroke={INK} strokeWidth="14" strokeLinecap="round" />
          <line x1="22" y1="-22" x2="-22" y2="22" stroke={INK} strokeWidth="14" strokeLinecap="round" />
          <line x1="-22" y1="-22" x2="22" y2="22" stroke={YEL} strokeWidth="8" strokeLinecap="round" />
          <line x1="22" y1="-22" x2="-22" y2="22" stroke={YEL} strokeWidth="8" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};
