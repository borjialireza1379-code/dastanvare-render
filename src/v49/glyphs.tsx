import React from "react";
import { FA, clamp01 } from "./geo";
import { FONT_HERO } from "./parts";

// code-drawn icons for v49 (no picture files)

export const PlaneGlyph: React.FC<{ size: number; color?: string }> = ({ size, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.55))" }}>
    <path d="M24 2 C26 2 27 5 27 8 L27 19 L44 29 L44 33 L27 27 L27 38 L32 42 L32 45 L24 43 L16 45 L16 42 L21 38 L21 27 L4 33 L4 29 L21 19 L21 8 C21 5 22 2 24 2 Z" fill={color} />
  </svg>
);

export const Volcano: React.FC<{ size: number; t: number; seed?: number }> = ({ size, t, seed = 0 }) => {
  const puffs = [0, 1, 2].map((i) => {
    const u = ((t * 0.45 + i / 3 + seed * 0.17) % 1 + 1) % 1;
    return { y: 30 - u * 34, x: 50 + Math.sin(u * 5 + seed + i) * 6 + u * 10, r: 6 + u * 12, o: (1 - u) * 0.7 };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.6))" }}>
      {puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#cfcfcf" opacity={p.o} />)}
      <path d="M8 92 L40 34 Q50 26 60 34 L92 92 Z" fill="#5b3a2a" stroke="#2a1a12" strokeWidth={3} />
      <path d="M40 34 Q50 26 60 34 L56 46 L50 40 L44 48 Z" fill="#ff7a1a" />
      <path d="M50 40 L46 60 L52 72 L49 88" stroke="#ff9a2e" strokeWidth={4} fill="none" opacity={0.85} />
      <circle cx={50} cy={32} r={14} fill="#ff6a00" opacity={0.25 + 0.15 * Math.sin(t * 6 + seed)} />
    </svg>
  );
};

export const OilDrop: React.FC<{ size: number; strike?: number }> = ({ size, strike = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: "drop-shadow(0 12px 18px rgba(0,0,0,.6))" }}>
    <defs>
      <radialGradient id="oilg" cx="0.35" cy="0.55" r="0.7">
        <stop offset="0" stopColor="#4a4a4a" /><stop offset="0.5" stopColor="#141414" /><stop offset="1" stopColor="#000" />
      </radialGradient>
    </defs>
    <path d="M50 4 C62 26 82 46 82 64 A32 32 0 0 1 18 64 C18 46 38 26 50 4 Z" fill="url(#oilg)" stroke="#000" strokeWidth={2} />
    <ellipse cx={36} cy={62} rx={7} ry={13} fill="#fff" opacity={0.35} transform="rotate(-18 36 62)" />
    {strike > 0 && <line x1={6} y1={92} x2={6 + 88 * strike} y2={92 - 88 * strike} stroke="#E3262E" strokeWidth={10} strokeLinecap="round" />}
  </svg>
);

// fuel gauge: v 1 = full, 0 = empty
export const Gauge: React.FC<{ size: number; v: number; t: number; warn: number }> = ({ size, v, t, warn }) => {
  const a = Math.PI * (1 - clamp01(v)); // 0 = right (full), π = left (empty)
  const cx = 150, cy = 150, r = 112;
  const nx = cx + Math.cos(a) * r * 0.86, ny = cy - Math.sin(a) * r * 0.86;
  const ticks = Array.from({ length: 9 }, (_, i) => Math.PI * (i / 8));
  const blink = warn > 0 && Math.sin(t * 14) > 0 ? 1 : 0.25;
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 300 186" style={{ overflow: "visible" }}>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={26} />
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx - r * Math.cos(Math.PI * 0.22)},${cy - r * Math.sin(Math.PI * 0.22)}`} fill="none" stroke="#E3262E" strokeWidth={26} />
      {ticks.map((k, i) => (
        <line key={i} x1={cx - Math.cos(k) * (r - 22)} y1={cy - Math.sin(k) * (r - 22)} x2={cx - Math.cos(k) * (r - 6)} y2={cy - Math.sin(k) * (r - 6)} stroke="#fff" strokeWidth={i % 4 === 0 ? 6 : 3} />
      ))}
      <text x={cx - r - 4} y={cy + 34} fontFamily={FONT_HERO} fontSize={30} fill="#ff6b6b" textAnchor="middle">خالی</text>
      <text x={cx + r + 4} y={cy + 34} fontFamily={FONT_HERO} fontSize={30} fill="#fff" textAnchor="middle">پُر</text>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ff9a2e" strokeWidth={9} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={16} fill="#222" stroke="#ff9a2e" strokeWidth={5} />
      <g transform={`translate(${cx - 20}, ${cy - 72})`} opacity={blink}>
        <rect x={0} y={6} width={26} height={34} rx={4} fill="#ff9a2e" />
        <rect x={5} y={11} width={16} height={10} rx={2} fill="#3a2410" />
        <path d="M26 14 L34 20 L34 36 Q34 40 38 38" stroke="#ff9a2e" strokeWidth={4} fill="none" />
      </g>
    </svg>
  );
};

export const Tanker: React.FC<{ size: number; rot?: number }> = ({ size, rot = 0 }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 100 50" style={{ overflow: "visible", transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.6))" }}>
    <path d="M4 22 L88 22 Q98 22 96 30 L90 42 L10 42 Z" fill="#b22222" stroke="#1a1a1a" strokeWidth={2} />
    <rect x={4} y={18} width={86} height={6} fill="#1f1f1f" />
    <rect x={8} y={6} width={14} height={14} fill="#f0f0f0" stroke="#1a1a1a" strokeWidth={2} />
    {[30, 44, 58, 72].map((x) => <circle key={x} cx={x} cy={16} r={4} fill="#d9d9d9" stroke="#1a1a1a" strokeWidth={1.5} />)}
  </svg>
);

export const Sun: React.FC<{ size: number; t: number }> = ({ size, t }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", filter: "drop-shadow(0 0 18px rgba(255,170,40,.9))" }}>
    <g transform={`rotate(${t * 20} 50 50)`}>
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={47} y={2} width={6} height={16} rx={3} fill="#ffb12b" transform={`rotate(${i * 30} 50 50)`} />)}
    </g>
    <circle cx={50} cy={50} r={27} fill="#ffcf3a" />
  </svg>
);

/* ---------------- food (flat icons, 200×200 viewBox) ---------------- */
export const Sushi: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <ellipse cx={100} cy={150} rx={86} ry={16} fill="rgba(0,0,0,.18)" />
    <rect x={30} y={96} width={140} height={54} rx={27} fill="#fbfaf4" stroke="#d9d4c3" strokeWidth={4} />
    <path d="M22 100 Q30 62 100 62 Q170 62 178 100 Q160 112 100 110 Q40 112 22 100 Z" fill="#ff7f50" stroke="#e0603a" strokeWidth={4} />
    {[60, 85, 110, 135].map((x) => <path key={x} d={`M${x} 70 Q${x + 10} 88 ${x + 2} 106`} stroke="#ffd0b8" strokeWidth={6} fill="none" strokeLinecap="round" />)}
    <rect x={88} y={60} width={24} height={92} fill="#1f3326" />
  </svg>
);
export const Ramen: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <line x1={120} y1={30} x2={180} y2={96} stroke="#c8925a" strokeWidth={8} strokeLinecap="round" />
    <line x1={136} y1={24} x2={190} y2={88} stroke="#c8925a" strokeWidth={8} strokeLinecap="round" />
    <ellipse cx={100} cy={96} rx={84} ry={24} fill="#f2c27a" />
    {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${30 + i * 26} 96 q8 -12 16 0 t16 0`} stroke="#f7e3a3" strokeWidth={6} fill="none" />)}
    <ellipse cx={70} cy={90} rx={18} ry={11} fill="#fff" /><ellipse cx={70} cy={90} rx={9} ry={6} fill="#ffb21f" />
    <circle cx={130} cy={88} r={14} fill="#fff" stroke="#eee" strokeWidth={2} />
    <path d="M124 88 a6 6 0 1 1 6 6" stroke="#ff6f91" strokeWidth={3} fill="none" />
    <rect x={100} y={74} width={22} height={6} rx={2} fill="#2f6e3a" transform="rotate(-20 110 77)" />
    <path d="M16 96 Q20 168 100 168 Q180 168 184 96 Z" fill="#b8312f" />
    <path d="M40 130 h120" stroke="#fff" strokeWidth={4} opacity={0.5} strokeDasharray="10 8" />
    <rect x={70} y={166} width={60} height={12} rx={4} fill="#8e2422" />
  </svg>
);
export const Noodles: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <line x1={92} y1={10} x2={120} y2={92} stroke="#c8925a" strokeWidth={8} strokeLinecap="round" />
    <line x1={110} y1={8} x2={128} y2={92} stroke="#c8925a" strokeWidth={8} strokeLinecap="round" />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${56 + i * 24} 78 q6 -30 12 -40`} stroke="#f2cf6a" strokeWidth={7} fill="none" strokeLinecap="round" />)}
    <path d="M38 76 L162 76 L146 178 L54 178 Z" fill="#fafafa" stroke="#d6d6d6" strokeWidth={4} />
    <path d="M38 76 L70 60 L130 60 L162 76" fill="#ececec" stroke="#d6d6d6" strokeWidth={4} />
    <circle cx={100} cy={128} r={22} fill="#d7263d" />
    <path d="M62 34 Q100 4 138 34" stroke="#888" strokeWidth={4} fill="none" opacity={0} />
  </svg>
);
export const Ghormeh: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <ellipse cx={100} cy={92} rx={84} ry={26} fill="#3d4f1f" />
    <ellipse cx={100} cy={90} rx={74} ry={20} fill="#4f6526" />
    {[[60, 86], [86, 96], [118, 84], [140, 94], [100, 80]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={9} ry={5} fill="#5a1f1f" transform={`rotate(${i * 30} ${x} ${y})`} />)}
    {[[74, 80], [128, 98], [104, 98]].map(([x, y], i) => <rect key={i} x={x - 8} y={y - 6} width={16} height={12} rx={3} fill="#6b3f22" />)}
    <circle cx={82} cy={100} r={5} fill="#c9a227" /><circle cx={146} cy={84} r={5} fill="#c9a227" />
    <path d="M16 92 Q22 166 100 166 Q178 166 184 92 Z" fill="#f4f1ea" stroke="#d8d2c4" strokeWidth={4} />
    <path d="M30 120 Q100 140 170 120" stroke="#2a6fb0" strokeWidth={6} fill="none" opacity={0.6} />
  </svg>
);
export const Kabab: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <ellipse cx={100} cy={128} rx={92} ry={50} fill="#f6f2e8" stroke="#ddd6c6" strokeWidth={4} />
    <path d="M60 118 Q76 92 100 96 Q120 92 132 116 Z" fill="#fffdf6" />
    <path d="M76 104 Q96 88 116 104" fill="#ffc21a" opacity={0.9} />
    {[0, 1].map((k) => (
      <g key={k} transform={`translate(0 ${k * 26})`}>
        <rect x={14} y={128} width={172} height={6} rx={3} fill="#9aa1a8" />
        <rect x={26} y={118} width={146} height={26} rx={13} fill="#8a4a24" />
        {[40, 62, 84, 106, 128, 150].map((x) => <line key={x} x1={x} y1={120} x2={x} y2={142} stroke="#5e2f14" strokeWidth={4} />)}
      </g>
    ))}
    <circle cx={160} cy={96} r={18} fill="#e8402a" /><path d="M150 84 l10 6 l10 -6" stroke="#2e7d32" strokeWidth={4} fill="none" />
  </svg>
);
export const Dizi: React.FC<{ size: number; t?: number }> = ({ size, t = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
    {[0, 1, 2].map((i) => {
      const u = ((t * 0.5 + i / 3) % 1 + 1) % 1;
      return <path key={i} d={`M${86 + i * 14} ${66 - u * 40} q8 -10 0 -20 q-8 -10 0 -20`} stroke="#fff" strokeWidth={5} fill="none" opacity={(1 - u) * 0.6} strokeLinecap="round" />;
    })}
    <ellipse cx={100} cy={176} rx={78} ry={10} fill="rgba(0,0,0,.2)" />
    <path d="M38 84 Q34 172 100 172 Q166 172 162 84 Z" fill="#5a4a42" stroke="#2f2622" strokeWidth={4} />
    <ellipse cx={100} cy={84} rx={64} ry={16} fill="#7a3d18" stroke="#2f2622" strokeWidth={4} />
    {[[78, 82], [96, 86], [118, 80], [130, 88], [88, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#e7c27a" />)}
    <rect x={20} y={100} width={22} height={12} rx={6} fill="#3e322c" /><rect x={158} y={100} width={22} height={12} rx={6} fill="#3e322c" />
  </svg>
);

/* manga speed lines (screen-size svg) */
export const SpeedLines: React.FC<{ w: number; h: number; t: number; o: number; cx?: number; cy?: number; color?: string }> = ({ w, h, t, o, cx = w / 2, cy = h / 2, color = "#fff" }) => {
  if (o <= 0.001) return null;
  const N = 90;
  const f = Math.floor(t * 15);
  const lines = Array.from({ length: N }, (_, i) => {
    const r1 = Math.sin(i * 12.9898 + f * 78.233) * 43758.5453;
    const rnd = r1 - Math.floor(r1);
    const a = (i / N) * Math.PI * 2 + rnd * 0.05;
    const inner = 260 + rnd * 260, outer = 1500;
    const wd = 0.006 + rnd * 0.014;
    const p = (ang: number, rr: number) => `${cx + Math.cos(ang) * rr},${cy + Math.sin(ang) * rr}`;
    return <polygon key={i} points={`${p(a, inner)} ${p(a - wd, outer)} ${p(a + wd, outer)}`} fill={color} opacity={0.5 + rnd * 0.5} />;
  });
  return <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, opacity: o }}>{lines}</svg>;
};

/* the classic film countdown leader */
export const FilmLeader: React.FC<{ t: number; n: number; k: number; o: number }> = ({ t, n, k, o }) => {
  if (o <= 0.001) return null;
  const a = k * 360;
  const R = 330;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const sweep = `M540,960 L${540 + Math.cos(rad(0)) * R * 1.6},${960 + Math.sin(rad(0)) * R * 1.6} A${R * 1.6},${R * 1.6} 0 ${a > 180 ? 1 : 0} 1 ${540 + Math.cos(rad(a)) * R * 1.6},${960 + Math.sin(rad(a)) * R * 1.6} Z`;
  const scratch = (i: number) => ((Math.sin(i * 33.7 + Math.floor(t * 12) * 7.1) + 1) / 2) * 1080;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, background: "#26231f", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={sweep} fill="#3f3a33" />
        <line x1={0} y1={960} x2={1080} y2={960} stroke="#bdb4a2" strokeWidth={5} />
        <line x1={540} y1={0} x2={540} y2={1920} stroke="#bdb4a2" strokeWidth={5} />
        <circle cx={540} cy={960} r={R} fill="none" stroke="#efe8d8" strokeWidth={14} />
        <circle cx={540} cy={960} r={R - 40} fill="none" stroke="#bdb4a2" strokeWidth={6} />
        {[0, 1, 2].map((i) => <line key={i} x1={scratch(i)} y1={0} x2={scratch(i) + 6} y2={1920} stroke="#fff" strokeWidth={2} opacity={0.35} />)}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT_HERO, fontSize: 380, color: "#f4efe2", lineHeight: 1, textShadow: "0 0 30px rgba(0,0,0,.6)" }}>{FA(n)}</div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,.6) 100%)" }} />
    </div>
  );
};
