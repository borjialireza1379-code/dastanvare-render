// v51 game UI kit: palette, fonts, icons, panels, cards, stamps, HUD, captions.
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, Img, staticFile } from "remotion";
import { clamp, easeOut, lin, WORDS } from "./timing";

export const C = {
  gold: "#D9A845", goldHi: "#F5D37E", text: "#F6EBCF", dim: "#C2A878", ink: "#1E1208",
  red: "#9E2A22", redHi: "#D5483A", green: "#24614A", greenHi: "#3D9C70",
};
export const FONT_T = "Lalezar", FONT_B = "Vazirmatn";
export const fa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(/,/g, "٬");
export const faNum = (n: number) => fa(Math.round(n).toLocaleString("en-US"));

let fontsReady = false;
let fontsP: Promise<void> | null = null;
export const useFonts = () => {
  const [ok, setOk] = useState(fontsReady);
  const [h] = useState(() => (fontsReady ? null : delayRender("v51 fonts")));
  useEffect(() => {
    if (fontsReady) return;
    fontsP ??= Promise.all([
      new FontFace(FONT_T, `url('${staticFile("fonts/Lalezar-Regular.ttf")}')`).load(),
      new FontFace(FONT_B, `url('${staticFile("fonts/Vazirmatn-Bold.ttf")}')`, { weight: "700" }).load(),
      new FontFace(FONT_B, `url('${staticFile("fonts/Vazirmatn-Black.ttf")}')`, { weight: "900" }).load(),
    ]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); fontsReady = true; });
    fontsP.then(() => { setOk(true); if (h !== null) continueRender(h); }).catch((e) => { console.error(e); if (h !== null) continueRender(h); });
  }, [h]);
  return ok;
};

export const panel: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(46,30,15,0.95), rgba(19,12,5,0.95))",
  border: `3px solid ${C.gold}`,
  boxShadow: "0 12px 34px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(0,0,0,0.7), inset 0 0 0 6px rgba(217,168,69,0.18)",
};

// ---------- icons ----------
export type IconKind = "year" | "road" | "men" | "gem" | "goal" | "crown" | "chest" | "scroll" | "eye" | "fire" | "clock" | "hammer" | "coin" | "check";
export const Icon: React.FC<{ kind: IconKind; size?: number; color?: string }> = ({ kind, size = 40, color = C.goldHi }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {kind === "year" && (<><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" /></>)}
    {kind === "road" && (<><circle cx={12} cy={12} r={9} /><path d="M12 5.5 14.6 12 12 18.5 9.4 12Z" fill={color} /></>)}
    {kind === "men" && (<><path d="M4.5 15.5C4.5 8.5 8 4.5 12 4.5s7.5 4 7.5 11Z" fill={color} fillOpacity={0.25} /><path d="M3 15.5h18v3H3zM12 9v10" /></>)}
    {kind === "gem" && (<><path d="M6 4h12l3 5-9 11L3 9z" fill={color} fillOpacity={0.25} /><path d="M3 9h18M9 4l3 16 3-16" /></>)}
    {kind === "goal" && (<><circle cx={12} cy={12} r={9} /><circle cx={12} cy={12} r={5} /><circle cx={12} cy={12} r={1.6} fill={color} /></>)}
    {kind === "crown" && (<><path d="M3 18 4.5 7l5 5L12 5l2.5 7 5-5L21 18Z" fill={color} fillOpacity={0.3} /><path d="M3 21h18" /></>)}
    {kind === "chest" && (<><path d="M3.5 10C3.5 5 20.5 5 20.5 10" /><rect x={3.5} y={10} width={17} height={10} rx={1.5} fill={color} fillOpacity={0.25} /><rect x={10.5} y={11.5} width={3} height={4} fill={color} stroke="none" /></>)}
    {kind === "scroll" && (<><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4Z" fill={color} fillOpacity={0.2} /><path d="M6 4a2 2 0 0 0-2 2v2h2M10 9h6M10 13h6" /></>)}
    {kind === "eye" && (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx={12} cy={12} r={3} fill={color} /></>)}
    {kind === "fire" && (<><path d="M12 21c-4 0-7-3-7-7 0-4 4-6 4-11 3 2 5 5 5 8 1-1 2-2 2-4 2 2 3 4 3 7 0 4-3 7-7 7Z" fill={color} fillOpacity={0.3} /></>)}
    {kind === "clock" && (<><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 3" /></>)}
    {kind === "hammer" && (<><path d="M14 4l6 6-3 3-6-6zM11 7 3 15l3 3 8-8" /></>)}
    {kind === "coin" && (<><ellipse cx={12} cy={7} rx={7} ry={3} fill={color} fillOpacity={0.25} /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></>)}
    {kind === "check" && (<><circle cx={12} cy={12} r={9} /><path d="m7.5 12 3 3 6-6" /></>)}
  </svg>
);

export const Swords: React.FC<{ s?: number; color?: string }> = ({ s = 1, color = C.goldHi }) => {
  const one = (rot: number) => (
    <g transform={`rotate(${rot})`}>
      <path d="M0,-31 L3.6,-25 L3.6,9 L-3.6,9 L-3.6,-25 Z" fill={color} stroke={C.ink} strokeWidth={1.6} />
      <rect x={-12} y={9} width={24} height={4.5} rx={2} fill={color} stroke={C.ink} strokeWidth={1.4} />
      <rect x={-2.6} y={13.5} width={5.2} height={11} fill="#6B4320" stroke={C.ink} strokeWidth={1.2} />
      <circle cy={27} r={3.6} fill={color} stroke={C.ink} strokeWidth={1.2} />
    </g>
  );
  return <g transform={`scale(${s})`}>{one(-42)}{one(42)}</g>;
};

export const Shield: React.FC<{ color: string; hi: string; emblem: "sun" | "star"; size?: number }> = ({ color, hi, emblem, size = 96 }) => {
  const id = `sh-${emblem}`;
  return (
    <svg width={size} height={size * 1.12} viewBox="-48 -50 96 108">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={hi} /><stop offset="1" stopColor={color} /></linearGradient></defs>
      <path d="M0,-44 C18,-38 32,-40 42,-44 L42,2 C42,28 22,44 0,52 C-22,44 -42,28 -42,2 L-42,-44 C-32,-40 -18,-38 0,-44 Z" fill={`url(#${id})`} stroke={C.goldHi} strokeWidth={4} />
      {emblem === "sun" ? (
        <g fill={C.goldHi}><circle r={11} />{Array.from({ length: 12 }, (_, i) => <path key={i} d="M-3,-15 L0,-25 L3,-15 Z" transform={`rotate(${i * 30})`} />)}</g>
      ) : (
        <g fill={C.goldHi}>
          <path d="M0,-24 L6,-6 L24,0 L6,6 L0,24 L-6,6 L-24,0 L-6,-6 Z" />
          <path d="M0,-24 L6,-6 L24,0 L6,6 L0,24 L-6,6 L-24,0 L-6,-6 Z" transform="rotate(45) scale(0.7)" />
        </g>
      )}
    </svg>
  );
};

// ---------- cards ----------
/** k: 0..1 life (entrance/exit). Pop scale + fade. */
export const popStyle = (k: number, from = 0.86): React.CSSProperties => ({
  opacity: clamp(k * 1.4), transform: `scale(${from + (1 - from) * k})`,
});

/** real photo in a gold game frame, with a slow push; credit line in small print */
export const PhotoCard: React.FC<{
  src: string; k: number; x: number; y: number; w: number; h: number; title?: string; sub?: string; credit?: string;
  push?: number; focus?: [number, number]; rot?: number; fit?: "cover" | "contain"; tag?: string; tagColor?: string; plain?: boolean;
}> = ({ src, k, x, y, w, h, title, sub, credit, push = 0, focus = [50, 50], rot = 0, fit = "cover", tag, tagColor = C.red, plain }) => {
  if (k <= 0.001) return null;
  return (
    <div dir="rtl" style={{ position: "absolute", left: x, top: y, width: w, transformOrigin: "50% 40%", ...popStyle(k), rotate: `${rot}deg` }}>
      <div style={{ ...(plain ? { border: "2px solid rgba(255,255,255,0.75)", boxShadow: "0 18px 50px rgba(0,0,0,0.7)" } : panel),
        borderRadius: plain ? 4 : 18, padding: plain ? 0 : 10, overflow: "hidden" }}>
        <div style={{ position: "relative", width: "100%", height: h, overflow: "hidden", borderRadius: plain ? 2 : 10, background: "#120c06" }}>
          {fit === "contain" && (
            <Img src={staticFile(src)} style={{ position: "absolute", inset: -40, width: "calc(100% + 80px)", height: "calc(100% + 80px)", objectFit: "cover", filter: "blur(22px) brightness(0.55)" }} />
          )}
          <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit,
            objectPosition: `${focus[0]}% ${focus[1]}%`, transform: `scale(${1 + push * 0.12})`, transformOrigin: `${focus[0]}% ${focus[1]}%` }} />
          {tag && (
            <div style={{ position: "absolute", top: 14, right: 14, padding: "4px 16px 8px", borderRadius: 10, background: tagColor,
              border: `2px solid ${C.goldHi}`, fontFamily: FONT_B, fontWeight: 900, fontSize: 26, color: "#FFEFC8" }}>{tag}</div>
          )}
        </div>
        {(title || sub) && !plain && (
          <div style={{ padding: "12px 12px 4px", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
            {title && <span style={{ fontFamily: FONT_T, fontSize: 54, color: C.goldHi, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>{title}</span>}
            {sub && <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 26, color: C.dim, marginTop: 4 }}>{sub}</span>}
          </div>
        )}
      </div>
      {credit && <div style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 19, color: "rgba(255,240,215,0.75)", marginTop: 6, textAlign: "center", textShadow: "0 2px 4px #000" }}>{credit}</div>}
    </div>
  );
};

/** text event card (no photo): icon + kicker + title + body */
export const EventCard: React.FC<{ k: number; icon: IconKind; kicker: string; title: string; body?: string; y?: number; accent?: string }> =
  ({ k, icon, kicker, title, body, y = 360, accent = C.gold }) => {
    if (k <= 0.001) return null;
    return (
      <div dir="rtl" style={{ ...panel, borderColor: accent, position: "absolute", left: 90, right: 90, top: y, borderRadius: 22, padding: "22px 28px",
        display: "flex", alignItems: "center", gap: 22, ...popStyle(k) }}>
        <div style={{ width: 104, height: 104, borderRadius: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle at 40% 35%, rgba(245,211,126,0.35), rgba(80,50,20,0.4))", border: `3px solid ${accent}` }}>
          <Icon kind={icon} size={62} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 25, color: C.dim }}>{kicker}</span>
          <span style={{ fontFamily: FONT_T, fontSize: 52, color: C.goldHi, marginTop: 2 }}>{title}</span>
          {body && <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 28, color: C.text, marginTop: 6 }}>{body}</span>}
        </div>
      </div>
    );
  };

export const Stamp: React.FC<{ text: string; k: number; x?: string | number; y: number; size?: number; rot?: number; color?: string }> =
  ({ text, k, x = "50%", y, size = 92, rot = -8, color = "rgba(150,32,22,0.96)" }) => {
    if (k <= 0.001) return null;
    const s = 1.9 - 0.9 * easeOut(clamp(k * 1.3));
    return (
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: clamp(k * 2.5),
        fontFamily: FONT_T, fontSize: size, lineHeight: 1, color: "#FFE2A0", padding: "4px 34px 14px", whiteSpace: "nowrap",
        background: `linear-gradient(180deg, ${color}, rgba(96,16,10,0.96))`, borderRadius: 18, border: `6px solid ${C.goldHi}`,
        boxShadow: "0 0 0 4px rgba(20,8,2,0.85), 0 16px 40px rgba(0,0,0,0.6), 0 0 60px rgba(255,190,90,0.45)", textShadow: "0 4px 0 rgba(0,0,0,0.5)" }}>{text}</div>
    );
  };

export const Toast: React.FC<{ text: string; k: number; y: number; icon?: IconKind; color?: string }> = ({ text, k, y, icon = "check", color = C.gold }) => {
  if (k <= 0.001) return null;
  return (
    <div dir="rtl" style={{ ...panel, borderColor: color, position: "absolute", left: "50%", top: y, transform: `translate(-50%,0) translateY(${(1 - k) * -30}px)`, opacity: clamp(k * 1.5),
      borderRadius: 40, padding: "10px 30px 14px", display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap" }}>
      <Icon kind={icon} size={40} color={color === C.gold ? C.goldHi : color} />
      <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 36, color: C.text }}>{text}</span>
    </div>
  );
};

// ---------- HUD ----------
export const TopBar: React.FC<{ k: number; year: string; km: string; men: string; loot: string; bump?: number[] }> = ({ k, year, km, men, loot, bump = [0, 0, 0, 0] }) => {
  if (k <= 0.001) return null;
  const slots: { icon: IconKind; label: string; value: string }[] = [
    { icon: "year", label: "سال", value: year },
    { icon: "road", label: "کیلومتر", value: km },
    { icon: "men", label: "سپاه (تخمینی)", value: men },
    { icon: "gem", label: "گنج افسانه‌ای", value: loot },
  ];
  return (
    <div dir="rtl" style={{ ...panel, position: "absolute", top: 112, left: 26, right: 26, height: 120, borderRadius: 20, display: "flex",
      transform: `translateY(${(1 - k) * -200}px)`, opacity: k }}>
      {slots.map((s, i) => (
        <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
          borderLeft: i < slots.length - 1 ? "2px solid rgba(217,168,69,0.35)" : "none" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: `rgba(217,168,69,${0.14 + bump[i] * 0.5})`, border: "2px solid rgba(217,168,69,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: bump[i] > 0 ? `0 0 ${24 * bump[i]}px ${C.goldHi}` : "none" }}>
            <Icon kind={s.icon} size={34} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, minWidth: 0 }}>
            <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 20, color: C.dim, whiteSpace: "nowrap" }}>{s.label}</span>
            <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 38, color: bump[i] > 0.3 ? C.goldHi : C.text, marginTop: 8,
              transform: `scale(${1 + bump[i] * 0.18})`, transformOrigin: "right center", whiteSpace: "nowrap" }}>{s.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Objective: React.FC<{ k: number; text: string; prog: number; flash?: number; right?: string }> = ({ k, text, prog, flash = 0, right }) => {
  if (k <= 0.001) return null;
  return (
    <div dir="rtl" style={{ ...panel, position: "absolute", top: 244, left: 26, right: 26, height: 64, borderRadius: 32,
      display: "flex", alignItems: "center", gap: 16, padding: "0 22px", opacity: k, transform: `translateY(${(1 - k) * -40}px)`,
      boxShadow: flash > 0 ? `0 0 ${50 * flash}px rgba(245,211,126,${0.9 * flash}), 0 12px 34px rgba(0,0,0,0.6)` : panel.boxShadow }}>
      <Icon kind="goal" size={38} />
      <span style={{ fontFamily: FONT_B, fontWeight: 900, fontSize: 31, color: C.goldHi, whiteSpace: "nowrap", transform: `scale(${1 + flash * 0.12})`, transformOrigin: "right center" }}>{text}</span>
      <div style={{ flex: 1, height: 16, borderRadius: 8, background: "rgba(0,0,0,0.55)", border: "1.5px solid rgba(217,168,69,0.5)", overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${clamp(prog) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.goldHi}, ${C.gold})`, boxShadow: `0 0 12px ${C.gold}` }} />
      </div>
      {right && <span style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 24, color: C.dim, whiteSpace: "nowrap" }}>{right}</span>}
    </div>
  );
};

// ---------- captions: word by word, chunks of ≤4 words, current word in gold ----------
type Chunk = { words: { w: string; s: number; e: number }[]; s: number; e: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  const lines = [...new Set(WORDS.map((w) => w.line))];
  for (const n of lines) {
    const ws = WORDS.filter((w) => w.line === n);
    let cur: Chunk["words"] = [];
    ws.forEach((w, i) => {
      cur.push(w);
      const brk = /[،؛:!؟.]$/.test(w.w) || cur.length >= 4 || i === ws.length - 1;
      if (brk) { out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; }
    });
  }
  for (let i = 0; i < out.length; i++) out[i].e = Math.min(out[i].e + 0.45, out[i + 1]?.s ?? out[i].e + 0.8);
  return out;
})();
const KEY = /قندهار|دهلی|کرنال|خیبر|نادرآباد|اصفهان|کوه|نور|طاووس|۱۷|۲۸۷|۸۰|نادرشاه|محمدشاه|قتل‌عام|غافلگیر/;

export const Captions: React.FC<{ t: number; y?: number; k?: number }> = ({ t, y = 1350, k = 1 }) => {
  const c = CHUNKS.find((ch) => t >= ch.s - 0.06 && t < ch.e);
  if (!c || k <= 0.001) return null;
  const a = easeOut(lin(t, c.s - 0.06, c.s + 0.1));
  return (<>
    <div style={{ position: "absolute", left: 0, right: 0, top: y - 70, height: 230, opacity: a * k * 0.9, pointerEvents: "none",
      background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0) 100%)" }} />
    <div dir="rtl" style={{ position: "absolute", left: 40, right: 40, top: y, textAlign: "center", opacity: a * k, transform: `translateY(${(1 - a) * 14}px)`,
      fontFamily: FONT_B, fontWeight: 900, fontSize: 60, lineHeight: 1.4, color: "#fff",
      textShadow: "0 4px 0 rgba(0,0,0,0.85), 0 0 18px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.95)" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.04;
        const col = KEY.test(w.w) ? C.goldHi : on ? "#fff" : "rgba(255,255,255,0.78)";
        return <span key={i} style={{ color: col }}>{w.w}{i < c.words.length - 1 ? " " : ""}</span>;
      })}
    </div>
  </>);
};
