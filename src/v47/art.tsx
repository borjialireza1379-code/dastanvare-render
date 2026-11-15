// v47 · drawn pieces for the «ردپا · چالش» look: HUD, backgrounds, tags, receipt, flags, stamps.
import React from "react";
import { INK, PAPER, YEL, back, clamp, eio, eo, fa } from "./kit";

export const W = 1080, H = 1920;
export const LAT = `"V47Anton"`; // Latin display (PS5, GTA VI)

// ─── backgrounds ───
/** bright yellow with slowly turning rays and halftone corners */
export const YellowBurst: React.FC<{ t: number; cx?: number; cy?: number; o?: number }> = ({ t, cx = 540, cy = 860, o = 1 }) => (
  <div style={{ position: "absolute", inset: 0, background: YEL, opacity: o, overflow: "hidden" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${cx} ${cy}) rotate(${t * 9})`}>
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i * 20 * Math.PI) / 180, b = ((i * 20 + 9) * Math.PI) / 180, R = 2400;
          return <path key={i} d={`M0 0 L${Math.cos(a) * R} ${Math.sin(a) * R} L${Math.cos(b) * R} ${Math.sin(b) * R} Z`} fill="#F2C500" />;
        })}
      </g>
      <defs>
        <radialGradient id="v47-ht-fade" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="1" />
        </radialGradient>
        <pattern id="v47-ht" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="11" cy="11" r="4.2" fill={INK} />
        </pattern>
        <mask id="v47-ht-mask">
          <rect width={W} height={H} fill="url(#v47-ht-fade)" style={{ filter: "invert(1)" }} />
        </mask>
      </defs>
      <rect width={W} height={H} fill="url(#v47-ht)" opacity="0.13" mask="url(#v47-ht-mask)" />
    </svg>
  </div>
);

/** near-black stage with a drifting yellow dot grid (game board) */
export const DotStage: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => (
  <div style={{ position: "absolute", inset: 0, opacity: o, background: "radial-gradient(ellipse at 50% 40%, #2A2A2A 0%, #161616 55%, #0B0B0B 100%)" }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.22 }}>
      <defs>
        <pattern id="v47-dots" width="54" height="54" patternUnits="userSpaceOnUse" patternTransform={`translate(${(t * 12) % 54} ${(t * 20) % 54})`}>
          <circle cx="27" cy="27" r="2.6" fill={YEL} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#v47-dots)" />
    </svg>
  </div>
);

/** speed lines from the edges toward a point (impact moments) */
export const SpeedLines: React.FC<{ t: number; o: number; cx?: number; cy?: number; color?: string }> = ({ t, o, cx = 540, cy = 860, color = INK }) => {
  if (o <= 0.01) return null;
  const seed = Math.floor(t * 15);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      {Array.from({ length: 46 }, (_, i) => {
        const r = Math.sin((i + 1) * 91.7 + seed * 13.1) * 0.5 + 0.5;
        const a = (i / 46) * Math.PI * 2 + r * 0.09;
        const r0 = 560 + r * 260, r1 = 1500, wd = 4 + r * 10;
        const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0;
        const px = -Math.sin(a) * wd, py = Math.cos(a) * wd;
        return <path key={i} d={`M${x0} ${y0} L${cx + Math.cos(a) * r1 + px} ${cy + Math.sin(a) * r1 + py} L${cx + Math.cos(a) * r1 - px} ${cy + Math.sin(a) * r1 - py} Z`} fill={color} />;
      })}
    </svg>
  );
};

// ─── icons ───
export const ForkKnife: React.FC<{ size: number; color?: string }> = ({ size, color = YEL }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <g fill={color}>
      <rect x="10" y="4" width="3" height="14" rx="1.5" />
      <rect x="15.5" y="4" width="3" height="14" rx="1.5" />
      <rect x="21" y="4" width="3" height="14" rx="1.5" />
      <path d="M10 16 h14 a7 7 0 0 1 -7 8 a7 7 0 0 1 -7 -8 Z" />
      <rect x="15" y="22" width="4" height="22" rx="2" />
      <path d="M34 4 c6 3 7 14 3 20 v20 a2 2 0 0 1 -4 0 V4 Z" />
    </g>
  </svg>
);
export const WalletIcon: React.FC<{ size: number; color?: string }> = ({ size, color = YEL }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M6 14 h32 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4 Z" fill={color} />
    <path d="M6 14 l24 -8 a2 2 0 0 1 2.6 1.9 V14" fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round" />
    <rect x="30" y="23" width="14" height="10" rx="3" fill={INK} />
    <circle cx="35" cy="28" r="2.2" fill={color} />
  </svg>
);
export const Check: React.FC<{ size: number; k: number }> = ({ size, k }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" style={{ transform: `scale(${back(k, 2.4)})`, opacity: clamp(k * 5) }}>
    <circle cx="30" cy="30" r="27" fill={YEL} stroke={INK} strokeWidth="5" />
    <path d="M17 31 l9 9 l17 -19" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset={50 * (1 - clamp((k - 0.2) / 0.6))} />
  </svg>
);

// ─── the game HUD (top band): fullness bar on the right, wallet on the left ───
export const Hud: React.FC<{ t: number; o: number; full: number; money: number; goal: number; done: number }> = ({ t, o, full, money, goal, done }) => {
  if (o <= 0.01) return null;
  const segs = 10, lit = full * segs;
  const low = full < 0.35;
  const blink = low ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7)) : 1;
  const mm = money >= 1e6 ? `${fa(Math.floor(money / 1e6))} میلیون` : money > 0 ? `${fa(Math.round(money / 1e3))} هزار` : "۰";
  const box: React.CSSProperties = { background: "rgba(14,14,14,0.86)", borderRadius: 22, border: `3px solid rgba(255,214,10,0.55)`, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", height: 92, display: "flex", alignItems: "center", direction: "rtl" };
  return (
    <div style={{ position: "absolute", left: 36, right: 36, top: 150, display: "flex", justifyContent: "space-between", opacity: o, transform: `translateY(${(1 - o) * -40}px)` }}>
      {/* right: fullness */}
      <div style={{ ...box, padding: "0 18px 0 20px", gap: 12 }}>
        <ForkKnife size={46} />
        <div>
          <div style={{ font: `800 22px "RVazir"`, color: low ? YEL : "#ddd", marginBottom: 4, opacity: blink }}>{low ? "گرسنه!" : "سیری"}</div>
          <div style={{ display: "flex", gap: 4, direction: "rtl" }}>
            {Array.from({ length: segs }, (_, i) => {
              const f = clamp(lit - i);
              return <div key={i} style={{ width: 20, height: 26, borderRadius: 5, background: "#3A3A3A", overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${f * 100}%`, background: low ? `rgba(255,214,10,${blink})` : YEL }} />
              </div>;
            })}
          </div>
        </div>
      </div>
      {/* left: wallet */}
      <div style={{ ...box, padding: "0 20px 0 18px", gap: 12, minWidth: 360 }}>
        <WalletIcon size={46} />
        <div style={{ flex: 1 }}>
          <div style={{ font: `800 22px "RVazir"`, color: "#ddd", display: "flex", justifyContent: "space-between" }}>
            <span>کیف پول</span>
            <span style={{ color: "#999" }}>{goal > 0 ? `از ${fa(goal / 1e6)} میلیون` : ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ font: `400 40px/1.15 "RLalezar"`, color: done > 0.5 ? YEL : "#fff", whiteSpace: "nowrap" }}>{mm}</div>
            {goal > 0 && (
              <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#3A3A3A", overflow: "hidden" }}>
                <div style={{ marginRight: 0, marginLeft: "auto", width: `${clamp(money / goal) * 100}%`, height: "100%", background: YEL }} />
              </div>
            )}
            {done > 0 && <Check size={40} k={done} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── price tag hanging on a string from (ax, ay), swinging after it lands ───
export const PriceTag: React.FC<{ t: number; t0: number; ax: number; ay: number; value: number; unit: string; len?: number; side?: 1 | -1; scale?: number; o?: number }> = ({ t, t0, ax, ay, value, unit, len = 120, side = 1, scale = 1, o = 1 }) => {
  if (t < t0) return null;
  const u = t - t0;
  const drop = eo(u / 0.35);
  const swing = 26 * side * Math.exp(-2.6 * u) * Math.cos(8 * u) + 3 * Math.sin(t * 1.7);
  const shown = value * eo((u - 0.1) / 0.6);
  return (
    <div style={{ position: "absolute", left: ax, top: ay, width: 0, height: 0, opacity: clamp(u / 0.08) * o, transform: `scale(${scale}) rotate(${swing}deg)`, transformOrigin: "0 0" }}>
      <svg width="6" height={len * drop} style={{ position: "absolute", left: -3, top: 0 }}>
        <line x1="3" y1="0" x2="3" y2={len * drop} stroke="#EDEDED" strokeWidth="3" />
      </svg>
      <div style={{ position: "absolute", left: -150, top: len * drop - 6, width: 300, direction: "rtl", filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.45))" }}>
        <svg width="300" height="190" viewBox="0 0 300 190" style={{ position: "absolute", inset: 0 }}>
          <path d="M150 0 L200 34 H284 a12 12 0 0 1 12 12 V176 a12 12 0 0 1 -12 12 H16 a12 12 0 0 1 -12 -12 V46 a12 12 0 0 1 12 -12 H100 Z" fill={YEL} stroke={INK} strokeWidth="4" />
          <circle cx="150" cy="22" r="9" fill="#EDEDED" stroke={INK} strokeWidth="4" />
        </svg>
        <div style={{ position: "relative", paddingTop: 42, textAlign: "center" }}>
          <div style={{ font: `400 92px/1.05 "RLalezar"`, color: INK }}>{fa(Math.round(shown))}</div>
          <div style={{ font: `900 30px "RVazir"`, color: INK, marginTop: -2 }}>{unit}</div>
        </div>
      </div>
    </div>
  );
};

// ─── comic burst bubble («قار و قور!») ───
export const Burst: React.FC<{ t: number; t0: number; x: number; y: number; text: string; size?: number; o?: number }> = ({ t, t0, x, y, text, size = 1, o = 1 }) => {
  if (t < t0) return null;
  const k = back((t - t0) / 0.3, 2.6);
  const jit = Math.sin(t * 40) * 2;
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2, r = i % 2 ? 150 : 205 + (i % 4 === 0 ? 18 : 0);
    return `${200 + Math.cos(a) * r * 1.15},${150 + Math.sin(a) * r * 0.62}`;
  }).join(" ");
  return (
    <div style={{ position: "absolute", left: x - 200 * size, top: y - 150 * size, width: 400 * size, height: 300 * size, transform: `scale(${k}) rotate(${-8 + jit}deg)`, opacity: clamp((t - t0) / 0.06) * o }}>
      <svg width={400 * size} height={300 * size} viewBox="0 0 400 300" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <polygon points={pts} fill="#fff" stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: `400 ${78 * size}px "RLalezar"`, color: INK, direction: "rtl" }}>{text}</div>
    </div>
  );
};

// ─── stamp «✗» that slams onto a card ───
export const XStamp: React.FC<{ t: number; t0: number; size?: number }> = ({ t, t0, size = 220 }) => {
  if (t < t0) return null;
  const k = clamp((t - t0) / 0.16);
  const sc = 1.9 - 0.9 * eo(k);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -size / 2, marginTop: -size / 2, transform: `scale(${sc}) rotate(-8deg)`, opacity: k, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))" }}>
      <path d="M18 18 L82 82 M82 18 L18 82" stroke={INK} strokeWidth="22" strokeLinecap="round" />
      <path d="M18 18 L82 82 M82 18 L18 82" stroke={YEL} strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
};

// ─── slot-machine number (spins, then lands) ───
export const SlotNumber: React.FC<{ t: number; spinFrom: number; land: number; text: string; size?: number }> = ({ t, spinFrom, land, text, size = 140 }) => {
  const spinning = t < land;
  const rnd = (i: number) => Math.floor((Math.sin(Math.floor(t * 24) * 12.9898 + i * 78.233) * 43758.5453) % 10 + 10) % 10;
  const shown = spinning ? [0, 1, 2].map((i) => fa(rnd(i))).join("") : text;
  const k = spinning ? 0 : back((t - land) / 0.3, 2.2);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 18, direction: "rtl", background: INK, borderRadius: 26, padding: "4px 34px 10px", border: `5px solid ${INK}`, boxShadow: "0 18px 40px rgba(0,0,0,0.35)", opacity: clamp((t - spinFrom) / 0.1) }}>
      <div style={{ font: `400 ${size}px/1.1 "RLalezar"`, color: YEL, filter: spinning ? "blur(1.5px)" : "none", transform: `translateY(${spinning ? Math.sin(t * 60) * 6 : 0}px) scale(${spinning ? 1 : 0.85 + 0.15 * k})`, minWidth: size * 1.4, textAlign: "center" }}>{shown}</div>
      <div style={{ font: `400 ${size * 0.62}px/1.1 "RLalezar"`, color: "#fff" }}>روز</div>
    </div>
  );
};

// ─── flags (simple, drawn) ───
export const Flag: React.FC<{ c: "us" | "de" | "tr" | "ir"; w?: number }> = ({ c, w = 132 }) => {
  const h = w * 0.62;
  const frame: React.CSSProperties = { width: w, height: h, borderRadius: 8, overflow: "hidden", boxShadow: "0 6px 16px rgba(0,0,0,0.45)", border: "2px solid rgba(255,255,255,0.25)" };
  if (c === "de") return <div style={{ ...frame, background: "linear-gradient(#000 0 33.3%, #DD0000 33.3% 66.6%, #FFCE00 66.6%)" }} />;
  if (c === "ir") return <div style={{ ...frame, background: "linear-gradient(#239F40 0 33.3%, #fff 33.3% 66.6%, #DA0000 66.6%)" }} />;
  if (c === "tr")
    return (
      <div style={{ ...frame, background: "#E30A17" }}>
        <svg width={w} height={h} viewBox="0 0 150 100">
          <circle cx="53" cy="50" r="25" fill="#fff" />
          <circle cx="59.3" cy="50" r="20" fill="#E30A17" />
          <polygon fill="#fff" points={Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4.8 : 12.5; return `${86 + Math.cos(a) * r},${50 + Math.sin(a) * r}`; }).join(" ")} transform="rotate(-90 86 50)" />
        </svg>
      </div>
    );
  // us
  return (
    <div style={frame}>
      <svg width={w} height={h} viewBox="0 0 190 100" preserveAspectRatio="none">
        {Array.from({ length: 13 }, (_, i) => <rect key={i} x="0" y={(i * 100) / 13} width="190" height={100 / 13 + 0.3} fill={i % 2 ? "#fff" : "#B22234"} />)}
        <rect x="0" y="0" width="76" height={(7 * 100) / 13} fill="#3C3B6E" />
        {Array.from({ length: 9 }, (_, r) => Array.from({ length: r % 2 ? 5 : 6 }, (_, k) => <circle key={`${r}-${k}`} cx={(r % 2 ? 12.6 : 6.3) + k * 12.6} cy={5.4 + r * 5.4} r="1.7" fill="#fff" />))}
      </svg>
    </div>
  );
};

// ─── a photo card (white border, shadow), content is any child ───
export const Card: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; sc?: number; o?: number; border?: number; radius?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, rot = 0, sc = 1, o = 1, border = 10, radius = 26, children, style }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${sc})`, opacity: o, borderRadius: radius, background: "#fff", padding: border, boxShadow: "0 30px 70px rgba(0,0,0,0.45)", ...style }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: radius - border / 2, overflow: "hidden", background: "#111" }}>{children}</div>
  </div>
);

// ─── tape label (Radpa annotation chip) ───
export const Tape: React.FC<{ text: string; k: number; dark?: boolean; size?: number; rot?: number }> = ({ text, k, dark, size = 44, rot = -3 }) => (
  <div style={{ display: "inline-block", transform: `rotate(${rot}deg) scale(${back(k, 2)})`, opacity: clamp(k * 6), background: dark ? INK : YEL, color: dark ? YEL : INK, font: `900 ${size}px "RVazir"`, padding: `${size * 0.1}px ${size * 0.5}px ${size * 0.24}px`, direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }}>{text}</div>
);

/** game controller (simple flat, dark) */
export const Pad: React.FC<{ w: number; rot?: number }> = ({ w, rot = 0 }) => (
  <svg width={w} height={w * 0.62} viewBox="0 0 200 124" style={{ transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.4))" }}>
    <path d="M52 14 h96 c22 0 34 12 40 34 l10 44 c4 18 -10 30 -24 24 c-10 -4 -18 -18 -26 -28 h-96 c-8 10 -16 24 -26 28 c-14 6 -28 -6 -24 -24 l10 -44 c6 -22 18 -34 40 -34 Z" fill="#F4F4F4" stroke={INK} strokeWidth="5" />
    <path d="M70 26 h60 v34 h-60 Z" fill="#1E1E1E" rx="6" />
    <circle cx="44" cy="52" r="5" fill={INK} /><rect x="30" y="49" width="28" height="7" rx="3" fill={INK} /><rect x="40.5" y="38" width="7" height="28" rx="3" fill={INK} />
    <circle cx="156" cy="42" r="6" fill={INK} /><circle cx="168" cy="54" r="6" fill={INK} /><circle cx="144" cy="54" r="6" fill={INK} /><circle cx="156" cy="66" r="6" fill={INK} />
    <circle cx="74" cy="80" r="11" fill="#2A2A2A" /><circle cx="126" cy="80" r="11" fill="#2A2A2A" />
  </svg>
);

// ─── PS5 Slim (stylised vector, standing). Replaced by a photo when the user's GPT image arrives ───
export const Ps5Art: React.FC<{ h: number; glow?: number }> = ({ h, glow = 1 }) => (
  <svg width={h * 0.5} height={h} viewBox="0 0 200 400" style={{ overflow: "visible", filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.55))" }}>
    <defs>
      <linearGradient id="ps-panel-l" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.6" stopColor="#F1F1F1" /><stop offset="1" stopColor="#CFCFCF" />
      </linearGradient>
      <linearGradient id="ps-panel-r" x1="1" x2="0" y1="0" y2="0">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.6" stopColor="#EDEDED" /><stop offset="1" stopColor="#C8C8C8" />
      </linearGradient>
      <linearGradient id="ps-core" x1="0" x2="1">
        <stop offset="0" stopColor="#050505" /><stop offset="0.5" stopColor="#2A2A2A" /><stop offset="1" stopColor="#050505" />
      </linearGradient>
      <linearGradient id="ps-gloss" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#1A1A1A" /><stop offset="1" stopColor="#3B3B3B" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="392" rx="70" ry="9" fill="rgba(0,0,0,0.5)" />
    {/* black core */}
    <rect x="76" y="22" width="48" height="362" rx="10" fill="url(#ps-core)" />
    {/* lower white panels */}
    <path d="M78 382 L78 150 C 64 146 40 140 22 132 L 30 382 Z" fill="url(#ps-panel-l)" />
    <path d="M122 382 L122 150 C 136 146 160 140 178 132 L 170 382 Z" fill="url(#ps-panel-r)" />
    {/* upper white panels (Slim: split in two) */}
    <path d="M78 140 L78 40 C 66 30 46 18 16 8 C 18 50 20 92 22 126 C 40 132 62 137 78 140 Z" fill="url(#ps-panel-l)" />
    <path d="M122 140 L122 40 C 134 30 154 18 184 8 C 182 50 180 92 178 126 C 160 132 138 137 122 140 Z" fill="url(#ps-panel-r)" />
    {/* glossy black band on the top part */}
    <path d="M78 140 C 62 137 40 132 22 126 L22 132 C 40 140 64 146 78 150 Z" fill="url(#ps-gloss)" />
    <path d="M122 140 C 138 137 160 132 178 126 L178 132 C 160 140 136 146 122 150 Z" fill="url(#ps-gloss)" />
    {/* blue light strips */}
    <rect x="78.5" y="30" width="2.4" height="350" fill="#4C8DFF" opacity={0.55 + 0.45 * glow} style={{ filter: "drop-shadow(0 0 5px #4C8DFF)" }} />
    <rect x="119.1" y="30" width="2.4" height="350" fill="#4C8DFF" opacity={0.55 + 0.45 * glow} style={{ filter: "drop-shadow(0 0 5px #4C8DFF)" }} />
    {/* disc slot + buttons */}
    <rect x="40" y="250" width="3" height="90" rx="1.5" fill="#BDBDBD" />
    <rect x="86" y="300" width="6" height="12" rx="2" fill="#555" />
    <rect x="86" y="318" width="6" height="12" rx="2" fill="#555" />
    <circle cx="100" cy="90" r="5" fill="#3A3A3A" />
  </svg>
);

// ─── food, drawn: top-down plate on a dark table ───
export type FoodKind = "plate" | "breadcheese" | "egg" | "rice" | "ricepotato" | "riceegg" | "bread";
const Egg: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-52 -8 C -60 -40 -20 -58 6 -50 C 34 -60 62 -34 54 -6 C 66 22 34 52 4 46 C -26 58 -64 34 -52 -8 Z" fill="#FFFDF6" />
    <circle cx="2" cy="-2" r="22" fill="#FFB300" />
    <circle cx="-6" cy="-10" r="6" fill="#FFE08A" />
  </g>
);
const Bread: React.FC<{ x: number; y: number; r?: number; s?: number }> = ({ x, y, r = -8, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path d="M-110 -40 C -60 -62 60 -60 110 -42 C 122 -10 120 22 108 44 C 50 60 -60 62 -108 44 C -122 10 -122 -16 -110 -40 Z" fill="#D9A55B" />
    <path d="M-100 -30 C -50 -48 50 -46 98 -32" stroke="#C08842" strokeWidth="6" fill="none" />
    {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={-90 + (i % 8) * 25 + (i > 7 ? 12 : 0)} cy={i > 7 ? 18 : -8} r="3.2" fill="#8A5A22" opacity="0.7" />)}
  </g>
);
const Cheese: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y}) rotate(10)`}>
    <rect x="-46" y="-30" width="92" height="60" rx="10" fill="#F6F1DE" />
    <rect x="-46" y="-30" width="92" height="14" rx="7" fill="#FFFFFF" opacity="0.8" />
    <circle cx="-18" cy="6" r="4" fill="#E6DDC0" /><circle cx="16" cy="12" r="3" fill="#E6DDC0" />
  </g>
);
const RiceMound: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="0" cy="0" rx="92" ry="72" fill="#FBFAF4" />
    <ellipse cx="-8" cy="-10" rx="70" ry="50" fill="#FFFFFF" />
    {Array.from({ length: 70 }, (_, i) => {
      const a = i * 2.39996, r = 8 * Math.sqrt(i) * 1.05;
      return <ellipse key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * 0.78} rx="5.5" ry="2.1" transform={`rotate(${(i * 47) % 180} ${Math.cos(a) * r} ${Math.sin(a) * r * 0.78})`} fill="#E9E5D6" />;
    })}
    <path d="M-30 -60 C -10 -66 20 -64 34 -58" stroke="#F2B23A" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.85" />
  </g>
);
const Fries: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-60 + i * 13} y={-40 + ((i * 17) % 23)} width="14" height="70" rx="5" fill={i % 2 ? "#F4C14E" : "#E8AE33"} transform={`rotate(${-30 + i * 8} ${-53 + i * 13} 0)`} />)}
  </g>
);
export const Food: React.FC<{ kind: FoodKind; w: number; h: number }> = ({ kind, w, h }) => (
  <svg width={w} height={h} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="food-table" cx="50%" cy="45%" r="70%">
        <stop offset="0" stopColor="#3A3027" /><stop offset="1" stopColor="#17120E" />
      </radialGradient>
      <radialGradient id="food-plate" cx="45%" cy="40%" r="60%">
        <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.8" stopColor="#F1EFEA" /><stop offset="1" stopColor="#DAD6CD" />
      </radialGradient>
    </defs>
    <rect width="400" height="300" fill="url(#food-table)" />
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M0 ${30 + i * 42} C 120 ${20 + i * 42} 280 ${46 + i * 42} 400 ${32 + i * 42}`} stroke="#000" strokeWidth="2" opacity="0.18" fill="none" />)}
    <ellipse cx="206" cy="160" rx="132" ry="118" fill="rgba(0,0,0,0.45)" />
    <ellipse cx="200" cy="150" rx="132" ry="118" fill="url(#food-plate)" />
    <ellipse cx="200" cy="150" rx="100" ry="88" fill="none" stroke="#E2DED4" strokeWidth="3" />
    {kind === "breadcheese" && (<><Bread x={180} y={128} r={-10} s={0.85} /><Cheese x={232} y={190} /></>)}
    {kind === "bread" && (<><Bread x={196} y={120} r={6} s={0.8} /><Cheese x={176} y={192} /><circle cx="262" cy="196" r="16" fill="#7BB661" /><circle cx="262" cy="196" r="10" fill="#CFE7B0" /></>)}
    {kind === "egg" && (<><Egg x={170} y={150} s={0.9} /><Egg x={252} y={142} s={0.75} /></>)}
    {kind === "rice" && <RiceMound x={200} y={150} s={1.1} />}
    {kind === "ricepotato" && (<><RiceMound x={176} y={150} s={0.9} /><Fries x={262} y={150} /></>)}
    {kind === "riceegg" && (<><RiceMound x={190} y={156} s={1.0} /><Egg x={214} y={128} s={0.72} /></>)}
    {kind === "plate" && (<>
      <g fill="#CFCFCF">
        <rect x="44" y="120" width="7" height="110" rx="3.5" />
        <path d="M36 70 h3 v40 h3 v-40 h3 v40 h3 v-40 h3 v44 a10 10 0 0 1 -15 8 Z" />
      </g>
      <path d="M350 66 c 12 6 14 50 4 70 v 94 a4 4 0 0 1 -8 0 V66 Z" fill="#CFCFCF" />
    </>)}
  </svg>
);

// ─── icons for «نه اجاره، نه قبض، نه چایی» ───
export const BuildingArt: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} viewBox="0 0 280 420" style={{ position: "absolute", inset: 0 }}>
    <rect width="280" height="420" fill="#20252B" />
    <circle cx="210" cy="80" r="40" fill={YEL} opacity="0.9" />
    <rect x="40" y="110" width="200" height="310" fill="#E9E4D6" />
    <rect x="40" y="96" width="200" height="20" fill="#C9C2AE" />
    {Array.from({ length: 7 }, (_, r) => Array.from({ length: 4 }, (_, c) => (
      <rect key={`${r}-${c}`} x={60 + c * 44} y={130 + r * 38} width="28" height="24" rx="3" fill={(r * 3 + c) % 5 === 0 ? YEL : "#4A5560"} />
    )))}
    <rect x="118" y="374" width="44" height="46" fill="#4A5560" />
    <rect x="0" y="404" width="280" height="16" fill="#111" />
  </svg>
);
export const TeaArt: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} viewBox="0 0 280 420" style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="tea-liq" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#C2410C" /><stop offset="1" stopColor="#7C1D06" /></linearGradient>
    </defs>
    <rect width="280" height="420" fill="#2A1F1A" />
    <ellipse cx="140" cy="330" rx="118" ry="34" fill="#1D4ED8" />
    <ellipse cx="140" cy="326" rx="96" ry="24" fill="#E8EDF7" />
    <ellipse cx="140" cy="326" rx="70" ry="16" fill={YEL} opacity="0.85" />
    <path d="M86 120 C 80 170 112 200 106 240 C 100 280 96 300 104 318 L 176 318 C 184 300 180 280 174 240 C 168 200 200 170 194 120 Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.6)" strokeWidth="3" />
    <path d="M90 150 C 88 180 114 204 108 240 C 102 280 98 300 106 316 L 174 316 C 182 300 178 280 172 240 C 166 204 192 180 190 150 Z" fill="url(#tea-liq)" />
    <rect x="98" y="232" width="84" height="8" fill={YEL} opacity="0.8" />
    <path d="M118 100 C 108 80 132 70 122 50 M158 100 C 148 80 172 70 162 50" stroke="rgba(255,255,255,0.45)" strokeWidth="5" fill="none" strokeLinecap="round" />
  </svg>
);

export const PAPER_C = PAPER;
export { eio };
