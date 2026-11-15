// ردپا (@RadpaStory) · house style kit, picked by the user on 2026-11-15:
//   T3 «هایلایت» (yellow #FFD60A / black / white, Lalezar, marker highlights, circle + tape annotations, yellow end card)
//   + T2's stage (girih pattern behind a framed footage window), recoloured to black + yellow
//   + T1's counting number with a needle gauge.
// Rule from the user: text never covers the subject → footage lives in the window, all text sits in the zones under it.
import React from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";

// ─── fonts ───
const FACES: [string, string, string][] = [
  ["RVazir", "fonts/Vazirmatn-Regular.ttf", "400"],
  ["RVazir", "fonts/Vazirmatn-SemiBold.ttf", "600"],
  ["RVazir", "fonts/Vazirmatn-Bold.ttf", "700"],
  ["RVazir", "fonts/Vazirmatn-Black.ttf", "900"],
  ["RLalezar", "fonts/Lalezar-Regular.ttf", "400"],
];
const fontHandle = delayRender("radpa kit fonts");
Promise.all(FACES.map(([fam, file, weight]) => new FontFace(fam, `url('${staticFile(file)}')`, { weight }).load().then((f) => document.fonts.add(f))))
  .then(() => continueRender(fontHandle))
  .catch((e) => {
    console.error(e);
    continueRender(fontHandle);
  });

// ─── palette + layout ───
export const YEL = "#FFD60A", INK = "#111111", PAPER = "#FBFAF5";
export const W = 1080, H = 1920;
export const WIN = { x: 40, y: 196, w: 1000, h: 860, r: 36 }; // footage window
export const ZONE = { info: 1095, cap: 1395 }; // info slot (hook / data card) and caption, both under the window; nothing below ~1600 (Shorts UI)

// ─── easing ───
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const eio = (x: number) => {
  const v = clamp(x);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
export const back = (x: number, k = 1.6) => {
  const v = clamp(x);
  return 1 + (k + 1) * Math.pow(v - 1, 3) + k * Math.pow(v - 1, 2);
};
/** 0→1 over fin after a, 1→0 over fout before b */
export const win = (t: number, a: number, b: number, fin = 0.3, fout = 0.3) => clamp((t - a) / fin) * clamp((b - t) / fout);
export const fa = (n: number, dec = 0) => Number(n.toFixed(dec)).toLocaleString("fa-IR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ─── stage: near-black with a slow yellow girih pattern ───
export const Stage: React.FC<{ t: number; o?: number }> = ({ t, o = 0.13 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 32%, #262626 0%, #141414 55%, #0A0A0A 100%)` }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o }}>
      <defs>
        <pattern id="rp-girih" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform={`translate(${t * 7} ${t * 4})`}>
          <g fill="none" stroke={YEL} strokeWidth="2">
            <polygon points="90,30 104,76 150,90 104,104 90,150 76,104 30,90 76,76" />
            <rect x="62" y="62" width="56" height="56" transform="rotate(45 90 90)" />
            <circle cx="90" cy="90" r="10" />
            <path d="M0 0 L30 90 L0 180 M180 0 L150 90 L180 180" opacity="0.6" />
          </g>
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#rp-girih)" />
    </svg>
    {/* keep the text zones calm: darker under the window */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0) 55%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.8) 100%)" }} />
  </AbsoluteFill>
);

// ─── footage window with a yellow frame that draws itself ───
export const Window: React.FC<{ t: number; open?: number; frame?: number; children: React.ReactNode }> = ({ open = 1, frame = 1, children }) => {
  const inset = (1 - open) * 50;
  const per = 2 * (WIN.w + WIN.h);
  return (
    <>
      <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: WIN.r, overflow: "hidden", clipPath: `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${WIN.r}px)`, background: "#000", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
        {children}
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={WIN.r} fill="none" stroke={YEL} strokeWidth="4" strokeDasharray={per} strokeDashoffset={per * (1 - frame)} opacity={open > 0.02 ? 1 : 0} />
      </svg>
    </>
  );
};

// ─── a still image filling a box: sw×sh source, centred on (fx, fy), zoom z (1 = cover) ───
export type Cam = { s: number; x0: number; y0: number };
export const camFor = (bw: number, bh: number, sw: number, sh: number, fx: number, fy: number, z: number): Cam => {
  const s = Math.max(bw / sw, bh / sh) * z;
  const x0 = clamp(bw / 2 - fx * sw * s, bw - sw * s, 0);
  const y0 = clamp(bh / 2 - fy * sh * s, bh - sh * s, 0);
  return { s, x0, y0 };
};
export const camAt = (c: Cam, X: number, Y: number) => [c.x0 + X * c.s, c.y0 + Y * c.s] as const;
export const Still: React.FC<{ src: string; sw: number; sh: number; c: Cam; opacity?: number; filter?: string }> = ({ src, sw, sh, c, opacity = 1, filter }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", left: c.x0, top: c.y0, width: sw * c.s, height: sh * c.s, opacity, filter, maxWidth: "none" }} />
);
export const GRADE = "contrast(1.1) saturate(1.15) brightness(1.03)";

// ─── footprint mark + logo pieces ───
export const Print: React.FC<{ x: number; y: number; r: number; size: number; color: string; left?: boolean; o?: number; sc?: number }> = ({ x, y, r, size, color, left, o = 1, sc = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${(size / 80) * sc * (left ? -1 : 1)} ${(size / 80) * sc})`} opacity={o}>
    <path d="M -2 -22 C 10 -24 16 -12 14 0 C 12 12 16 22 10 30 C 4 38 -10 36 -12 26 C -14 16 -8 8 -12 -4 C -14 -14 -12 -21 -2 -22 Z" fill={color} />
    <circle cx="-6" cy="-32" r="6.2" fill={color} />
    <circle cx="3.5" cy="-34.5" r="4.4" fill={color} />
    <circle cx="10" cy="-31.5" r="3.8" fill={color} />
    <circle cx="14.6" cy="-26.5" r="3.3" fill={color} />
    <circle cx="17.4" cy="-20.5" r="2.8" fill={color} />
  </g>
);
export const Walk: React.FC<{ t: number; t0: number; color: string; size?: number; step?: number }> = ({ t, t0, color, size = 60, step = 0.12 }) => {
  const d = [-0.78, -0.63], p = [0.63, -0.78], ang = (Math.atan2(d[0], -d[1]) * 180) / Math.PI;
  return (
    <svg width="300" height="230" viewBox="0 0 300 230" style={{ overflow: "visible" }}>
      {[0, 1, 2, 3].map((i) => {
        const side = i % 2 ? -1 : 1;
        const k = clamp((t - t0 - i * step) / 0.22);
        return <Print key={i} x={250 + d[0] * 62 * i + p[0] * 16 * side} y={195 + d[1] * 62 * i + p[1] * 16 * side} r={ang} size={size} color={color} left={side < 0} o={k} sc={0.6 + 0.4 * back(k, 2.2)} />;
      })}
    </svg>
  );
};
/** small logo in the window's top-right corner */
export const Bug: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", right: W - WIN.x - WIN.w + 20, top: WIN.y + 20, display: "flex", alignItems: "center", gap: 10, direction: "rtl", opacity: o, background: "rgba(17,17,17,0.72)", borderRadius: 16, padding: "6px 8px 6px 18px" }}>
    <svg width="44" height="44" viewBox="0 0 56 56">
      <Print x={20} y={31} r={-8} size={34} color={YEL} left />
      <Print x={36} y={25} r={8} size={34} color={YEL} />
    </svg>
    <div style={{ font: `900 32px "RVazir"`, color: "#fff" }}>ردپا</div>
  </div>
);

// ─── source tag inside the window (bottom-left) ───
export const SourceTag: React.FC<{ text: string; o: number }> = ({ text, o }) => (
  <div style={{ position: "absolute", left: WIN.x + 22, top: WIN.y + WIN.h - 66, opacity: o, direction: "rtl", display: "flex", alignItems: "center", gap: 10, background: "rgba(17,17,17,0.72)", borderRadius: 10, padding: "4px 14px 8px", font: `600 24px "RVazir"`, color: "#eee" }}>
    <div style={{ width: 10, height: 10, borderRadius: 5, background: YEL }} />
    {text}
  </div>
);

// ─── hook title in the info slot: line 1 white, line 2 on a yellow marker ───
export const Hook: React.FC<{ t: number; t0?: number; line1: string; line2: string; size?: number; out?: number; top?: number }> = ({ t, t0 = 0.15, line1, line2, size = 104, out = 0, top = ZONE.info }) => {
  const bar = eio((t - t0 - 0.5) / 0.35);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, direction: "rtl", textAlign: "center", opacity: 1 - out, transform: `translateY(${out * 30}px)` }}>
      <div style={{ font: `400 ${size}px/1.22 "RLalezar"`, color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,0.6)", transform: `translateY(${(1 - back((t - t0) / 0.4, 2)) * 50}px)`, opacity: clamp((t - t0) / 0.12) }}>{line1}</div>
      <div style={{ position: "relative", display: "inline-block", marginTop: 4 }}>
        <div style={{ position: "absolute", left: -18, right: -18, top: size * 0.17, bottom: size * 0.04, background: YEL, transform: `scaleX(${bar}) rotate(-1.5deg)`, transformOrigin: "right center" }} />
        <div style={{ position: "relative", font: `400 ${size * 1.06}px/1.22 "RLalezar"`, color: bar > 0.5 ? INK : "#fff", opacity: clamp((t - t0 - 0.3) / 0.12) }}>{line2}</div>
      </div>
    </div>
  );
};

// ─── needle gauge (from T1), yellow arc on paper ───
export const Gauge: React.FC<{ k: number; size?: number }> = ({ k, size = 170 }) => (
  <svg width={size} height={size} viewBox="0 0 150 150">
    <circle cx="75" cy="75" r="70" fill="#F1EEE2" />
    <path d="M 30 100 A 50 50 0 1 1 120 100" fill="none" stroke="#E2DCC4" strokeWidth="12" strokeLinecap="round" />
    <path d="M 30 100 A 50 50 0 1 1 120 100" fill="none" stroke={YEL} strokeWidth="12" strokeLinecap="round" strokeDasharray="236" strokeDashoffset={236 * (1 - k)} />
    {Array.from({ length: 9 }, (_, i) => {
      const a = ((-210 + i * 30) * Math.PI) / 180;
      return <line key={i} x1={75 + Math.cos(a) * 34} y1={80 + Math.sin(a) * 34} x2={75 + Math.cos(a) * 40} y2={80 + Math.sin(a) * 40} stroke={INK} strokeWidth="3" opacity="0.5" />;
    })}
    <g transform={`rotate(${-120 + 240 * k} 75 80)`}>
      <line x1="75" y1="88" x2="75" y2="40" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    </g>
    <circle cx="75" cy="80" r="9" fill={YEL} stroke={INK} strokeWidth="4" />
  </svg>
);

// ─── data card in the info slot: paper label, tape, gauge, counting number ───
export const DataCard: React.FC<{ t: number; t0: number; label: string; value: number; unit: string; dec?: number; prefix?: string; gauge?: boolean; out?: number; dur?: number; from?: number; max?: number; top?: number }> = ({ t, t0, label, value, unit, dec = 0, prefix = "", gauge = true, out = 0, dur = 1.1, from = 0, max, top = ZONE.info + 22 }) => {
  const inK = back((t - t0) / 0.45, 1.8);
  const p = from === 0 ? eo((t - t0 - 0.15) / dur) : clamp((t - t0 - 0.15) / dur);
  const shown = from + (value - from) * p;
  const count = clamp(shown / (max ?? Math.max(value, from)));
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top, transform: `rotate(-2deg) scale(${inK * (1 - out * 0.1)})`, opacity: clamp((t - t0) / 0.1) * (1 - out), direction: "rtl" }}>
      <div style={{ background: PAPER, padding: "16px 32px 18px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", position: "relative", display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ position: "absolute", top: -22, right: 60, width: 130, height: 40, background: "rgba(255,214,10,0.88)", transform: "rotate(6deg)" }} />
        <div style={{ position: "absolute", top: -18, left: 50, width: 110, height: 38, background: "rgba(255,214,10,0.88)", transform: "rotate(-8deg)" }} />
        {gauge && <Gauge k={count} size={150} />}
        <div style={{ flex: 1 }}>
          <div style={{ font: `800 32px "RVazir"`, color: "#555" }}>{label}</div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, height: 26, background: YEL, transform: `scaleX(${eio((t - t0 - dur - 0.1) / 0.3)})`, transformOrigin: "right" }} />
            <div style={{ position: "relative", font: `400 110px/1.12 "RLalezar"`, color: INK }}>{prefix}{fa(shown, dec)}</div>
          </div>
          <div style={{ font: `900 36px "RVazir"`, color: INK }}>{unit}</div>
        </div>
      </div>
    </div>
  );
};

// ─── word-by-word caption under the window ───
export type CapWord = { w: string; at: number; key?: boolean };
/** shows the words of one chunk; each word pops in at its own time */
export const Caption: React.FC<{ t: number; words: CapWord[]; o?: number; size?: number; top?: number }> = ({ t, words, o = 1, size = 66, top = ZONE.cap }) => (
  <div style={{ position: "absolute", left: 50, right: 50, top, direction: "rtl", textAlign: "center", font: `900 ${size}px/1.45 "RVazir"`, opacity: o }}>
    {words.map(({ w, at, key }, i) => {
      const k = clamp((t - at) / 0.18);
      return (
        <span key={i} style={{ display: "inline-block", margin: key ? "0 22px 0 26px" : "0 0 0 16px", padding: key ? "0 14px 8px" : 0, background: key && k > 0 ? YEL : "transparent", color: key && k > 0 ? INK : "#fff", opacity: k > 0 ? 0.35 + 0.65 * k : 0.0, transform: `scale(${k > 0 ? 0.75 + 0.25 * back(k, 2.4) : 0.75}) rotate(${key ? -2 : 0}deg)`, textShadow: key ? "none" : "0 4px 18px rgba(0,0,0,0.7)" }}>{w}</span>
      );
    })}
  </div>
);

// ─── annotation drawn on the footage: circle + arrow + tape label ───
export const Annotate: React.FC<{ t: number; t0: number; x: number; y: number; rx?: number; ry?: number; label?: string; side?: 1 | -1; o?: number }> = ({ t, t0, x, y, rx = 110, ry = 96, label, side = 1, o = 1 }) => {
  const circ = eio((t - t0) / 0.5);
  const arr = eio((t - t0 - 0.4) / 0.3);
  const lab = back((t - t0 - 0.6) / 0.35, 2);
  const ax = x + side * (rx + 110), ay = y - ry - 120;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={YEL} strokeWidth="8" strokeLinecap="round" strokeDasharray="760" strokeDashoffset={760 * (1 - circ)} transform={`rotate(-14 ${x} ${y})`} style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))" }} />
        {label && <path d={`M ${ax} ${ay + 40} Q ${x + side * (rx + 60)} ${y - ry - 40} ${x + side * rx * 0.75} ${y - ry * 0.85}`} fill="none" stroke={YEL} strokeWidth="7" strokeLinecap="round" strokeDasharray="260" strokeDashoffset={260 * (1 - arr)} />}
      </svg>
      {label && (
        <div style={{ position: "absolute", left: ax - (side > 0 ? 0 : 260), top: ay - 30, width: 260, display: "flex", justifyContent: side > 0 ? "flex-start" : "flex-end" }}>
          <div style={{ transform: `rotate(${side * 4}deg) scale(${lab})`, opacity: clamp((t - t0 - 0.6) / 0.1), background: YEL, color: INK, font: `900 40px "RVazir"`, padding: "4px 22px 10px", direction: "rtl", boxShadow: "0 8px 20px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{label}</div>
        </div>
      )}
    </div>
  );
};

// ─── chip (date, place, label) in the info slot ───
export const Chip: React.FC<{ t: number; t0: number; text: string; top?: number; dark?: boolean; o?: number }> = ({ t, t0, text, top = ZONE.info, dark, o = 1 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: clamp((t - t0) / 0.12) * o }}>
    <div style={{ transform: `rotate(-2deg) scale(${back((t - t0) / 0.35, 2)})`, background: dark ? INK : YEL, color: dark ? YEL : INK, font: `900 54px "RVazir"`, padding: "8px 34px 16px", direction: "rtl", boxShadow: "0 10px 26px rgba(0,0,0,0.45)" }}>{text}</div>
  </div>
);

// ─── end card: yellow wipe with a black girih pattern, footprints, logo, follow button ───
export const EndCard: React.FC<{ t: number; t0: number; tagline?: string }> = ({ t, t0, tagline = "هر ماجرا یک ردپا دارد" }) => {
  const k = eio((t - t0) / 0.35);
  if (t < t0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: YEL, clipPath: `polygon(${100 - k * 130}% 0, 100% 0, 100% 100%, ${100 - k * 130 + 30}% 100%)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.09 }}>
        <defs>
          <pattern id="rp-girih-ink" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform={`translate(${t * 10} ${t * 6})`}>
            <g fill="none" stroke={INK} strokeWidth="3">
              <polygon points="90,30 104,76 150,90 104,104 90,150 76,104 30,90 76,76" />
              <rect x="62" y="62" width="56" height="56" transform="rotate(45 90 90)" />
              <circle cx="90" cy="90" r="10" />
            </g>
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#rp-girih-ink)" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
        <Walk t={t} t0={t0 + 0.3} color={INK} size={70} step={0.1} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", font: `400 270px/1.1 "RLalezar"`, color: INK, transform: `scale(${back((t - t0 - 0.55) / 0.4, 2.2)}) rotate(-3deg)`, opacity: clamp((t - t0 - 0.55) / 0.08) }}>ردپا</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1130, textAlign: "center", direction: "rtl", font: `800 56px "RVazir"`, color: INK, opacity: clamp((t - t0 - 0.85) / 0.25) }}>{tagline}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1270, display: "flex", justifyContent: "center", opacity: clamp((t - t0 - 1.0) / 0.2), transform: `rotate(-2deg) scale(${1 + 0.03 * Math.sin(t * 6)})` }}>
        <div style={{ background: INK, color: YEL, padding: "18px 64px 24px", font: `900 52px "RVazir"` }}>دنبال کن · ‎@RadpaStory</div>
      </div>
    </div>
  );
};
