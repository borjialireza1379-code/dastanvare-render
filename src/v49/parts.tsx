import React from "react";
import { Img, staticFile } from "remotion";
import { Cam, FA, MAP_H, MAP_W, SW, WORDS, clamp01, noise1, proj } from "./geo";

// v49 pieces · same look as v03 (satellite map, white glowing outlines, dark chips, Lalezar headlines, word-timed captions)
export const FONT_UI = "Vazirmatn";
export const FONT_HERO = "Lalezar";
export const GOLD = "#FFD34D";
export const IR = { g: "#239F40", w: "#FFFFFF", r: "#DA0000" }; // plain tricolour, no emblem (the user's rule)
export const JP = { w: "#FFFFFF", r: "#BC002D" };
const SHADOW = "0 3px 12px rgba(0,0,0,.85), 0 0 3px rgba(0,0,0,.9)";
export type Kind = "ir" | "jp";

/* ---------------- map view: map.jpg + map-space children under a camera, inside a w×h box ---------------- */
export const MapView: React.FC<{ cam: Cam; w?: number; h: number; top?: number; left?: number; blur?: number; dim?: number; shake?: { x: number; y: number }; radius?: number; children?: React.ReactNode }> = ({ cam, w = SW, h, top = 0, left = 0, blur = 0, dim = 0, shake = { x: 0, y: 0 }, radius = 0, children }) => {
  const o = proj(cam.lon, cam.lat);
  return (
    <div style={{ position: "absolute", left, top, width: w, height: h, overflow: "hidden", background: "#0b2a36", borderRadius: radius }}>
      <div style={{
        position: "absolute", left: 0, top: 0, width: MAP_W, height: MAP_H, transformOrigin: "0 0",
        transform: `translate(${w / 2 - o.x * cam.s + shake.x}px, ${h / 2 - o.y * cam.s + shake.y}px) scale(${cam.s})`,
        filter: blur > 0.6 ? `blur(${Math.min(blur, 30).toFixed(1)}px)` : undefined,
      }}>
        <Img src={staticFile("v49/map.jpg")} style={{ position: "absolute", left: 0, top: 0, width: MAP_W, height: MAP_H, maxWidth: "none" }} />
        {children}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,10,20,.55) 100%)" }} />
      {dim > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(4,12,20,${dim})` }} />}
    </div>
  );
};

/* ---------------- map-space country pieces ---------------- */
type Box = [number, number, number, number];
// a country tinted with a flag: the tint says who lives there now
export const FlagTint: React.FC<{ id: string; d: string; box: Box; kind: Kind; o: number; t: number; sw: number; edge?: string; disc?: [number, number] }> = ({ id, d, box, kind, o, t, sw, edge = "rgba(255,255,255,.95)", disc }) => {
  if (o <= 0.001) return null;
  const [x0, y0, x1, y1] = box;
  const bw = x1 - x0, bh = y1 - y0;
  const sheen = ((t * 0.18) % 1.6) - 0.3;
  let body: React.ReactNode;
  if (kind === "ir") {
    body = <g opacity={0.36}>{[IR.g, IR.w, IR.r].map((c, i) => <rect key={i} x={x0 - 20} y={y0 + (bh * i) / 3} width={bw + 40} height={bh / 3 + 1} fill={c} />)}</g>;
  } else {
    const [cx, cy] = disc ?? [x0 + bw / 2, y0 + bh / 2];
    body = (
      <>
        <rect x={x0 - 20} y={y0 - 20} width={bw + 40} height={bh + 40} fill={JP.w} opacity={0.32} />
        <circle cx={cx} cy={cy} r={Math.min(bw, bh) * 0.17} fill={JP.r} opacity={0.45} />
      </>
    );
  }
  return (
    <svg width={MAP_W} height={MAP_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
      <defs>
        <clipPath id={`clip-${id}`}><path d={d} /></clipPath>
        <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset={Math.max(0, sheen - 0.15)} stopColor="#fff" stopOpacity={0} />
          <stop offset={clamp01(sheen)} stopColor="#fff" stopOpacity={0.35} />
          <stop offset={Math.min(1, sheen + 0.15)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        {body}
        <rect x={x0} y={y0} width={bw} height={bh} fill={`url(#sheen-${id})`} />
      </g>
      <path d={d} fill="none" stroke={edge} strokeWidth={sw} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${sw * 2}px rgba(255,255,255,.6))` }} />
    </svg>
  );
};

export const Shape: React.FC<{ d: string; o: number; fill?: string; stroke?: string; sw: number; dash?: number; glow?: string; draw?: number }> = ({ d, o, fill = "none", stroke = "#fff", sw, dash, glow, draw }) => {
  if (o <= 0.001) return null;
  return (
    <svg width={MAP_W} height={MAP_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"
        pathLength={draw !== undefined ? 1 : undefined}
        strokeDasharray={draw !== undefined ? `${draw} 1` : dash ? `${dash} ${dash * 0.7}` : undefined}
        style={glow ? { filter: `drop-shadow(0 0 ${sw * 2.5}px ${glow})` } : undefined} />
    </svg>
  );
};

/* ---------------- waving flag (screen space) ---------------- */
export const Flag: React.FC<{ kind: Kind; x: number; y: number; w: number; t: number; o?: number; s?: number; rot?: number; pole?: boolean }> = ({ kind, x, y, w, t, o = 1, s = 1, rot = 0, pole = false }) => {
  if (o <= 0.001) return null;
  const h = kind === "ir" ? w * 0.57 : w * 0.667;
  const N = 22;
  const wave = (u: number) => Math.sin(u * 6.2 - t * 7) * h * 0.06 * u;
  const band = (v0: number, v1: number, u0 = 0, u1 = 1) => {
    const top: string[] = [], bot: string[] = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + ((u1 - u0) * i) / N;
      top.push(`${(u * w).toFixed(1)},${(v0 * h + wave(u)).toFixed(1)}`);
      bot.unshift(`${(u * w).toFixed(1)},${(v1 * h + wave(u)).toFixed(1)}`);
    }
    return [...top, ...bot].join(" ");
  };
  const shade: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, k = Math.cos(u * 6.2 - t * 7) * u;
    shade.push(<polygon key={i} points={band(0, 1, i / N, (i + 1) / N)} fill={k > 0 ? "#fff" : "#000"} opacity={Math.abs(k) * 0.16} />);
  }
  let body: React.ReactNode;
  if (kind === "ir") body = [IR.g, IR.w, IR.r].map((c, i) => <polygon key={i} points={band(i / 3, (i + 1) / 3 + 0.004)} fill={c} />);
  else body = (
    <>
      <polygon points={band(0, 1)} fill={JP.w} />
      <circle cx={w * 0.5} cy={h * 0.5 + wave(0.5)} r={h * 0.3} fill={JP.r} />
    </>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})` }}>
      <svg width={w + 12} height={h * 1.6} style={{ overflow: "visible", filter: "drop-shadow(0 10px 18px rgba(0,0,0,.55))" }}>
        {pole && <rect x={-7} y={-h * 0.08} width={7} height={h * 2.1} rx={3} fill="#e9e3d4" />}
        {body}
        {shade}
      </svg>
    </div>
  );
};
export const MiniFlag: React.FC<{ kind: Kind; w?: number }> = ({ kind, w = 54 }) => {
  const h = w * (kind === "ir" ? 0.57 : 0.667);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 4, boxShadow: "0 0 0 2px rgba(255,255,255,.25)" }}>
      {kind === "ir"
        ? [IR.g, IR.w, IR.r].map((c, i) => <rect key={i} y={(i * h) / 3} width={w} height={h / 3 + 0.5} fill={c} />)
        : <><rect width={w} height={h} fill={JP.w} /><circle cx={w / 2} cy={h / 2} r={h * 0.3} fill={JP.r} /></>}
    </svg>
  );
};

/* ---------------- captions (word-timed, keyword in gold) ---------------- */
const norm = (s: string) => s.replace(/[‌،؛…؟.:!«»]/g, "").replace(/[ً-ْ]/g, "");
const KEYS = new Set([
  "۹۱", "۱۲۴", "۱۸۵", "زلزلههای", "آتشفشان", "نفته", "بدون", "آره", "وارد", "۹۰", "خشکه", "۶", "هزار", "کیلومتر", "هیچوقت",
  "عجیبتر", "انیمهسازی", "غذاست", "سوشی", "رامن", "نودل", "قرمهسبزی", "کباب", "دیزی", "سنگک", "فرهنگ", "خاطرات",
  "19:ژاپن", "19:ایران", "1:ژاپن", "1:ایران", "2:ژاپن", "2:ایران",
]);
type CW = { w: string; s: number; e: number; kw: boolean };
type Chunk = { words: CW[]; s: number; e: number; line: number };
export const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  const lines = [...new Set(WORDS.map((w) => w.line))];
  for (const line of lines) {
    const ws = WORDS.filter((w) => w.line === line);
    let cur: CW[] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, s: cur[0].s, e: 0, line }); cur = []; };
    ws.forEach((w, i) => {
      const n = norm(w.w);
      cur.push({ w: w.w.replace(/\.\.\.$/, "…").replace("۱۸.۵", "۱۸٫۵"), s: w.s, e: w.e, kw: KEYS.has(n) || KEYS.has(`${line}:${n}`) });
      const left = ws.length - i - 1;
      if ((cur.length >= 4 && left !== 1) || /[،؛…؟:!.]$/.test(w.w)) flush();
    });
    flush();
  }
  out.forEach((c, i) => {
    const lastE = c.words[c.words.length - 1].e, next = out[i + 1];
    c.e = next ? Math.max(lastE + 0.15, Math.min(next.s - 0.1, lastE + 0.9)) : lastE + 0.6;
  });
  return out;
})();

export const Captions: React.FC<{ t: number; y?: number; hide?: boolean }> = ({ t, y = 1330, hide }) => {
  if (hide) return null;
  const c = CHUNKS.find((c) => t >= c.s - 0.08 && t < c.e);
  if (!c) return null;
  const k = clamp01((t - c.s + 0.08) / 0.16);
  return (
    <div dir="rtl" style={{
      position: "absolute", left: 40, right: 40, top: y, textAlign: "center",
      fontFamily: FONT_UI, fontWeight: 900, fontSize: 64, lineHeight: 1.35,
      transform: `translateY(${(1 - k) * 16}px) scale(${0.96 + 0.04 * k})`, opacity: k,
    }}>
      {/* a soft dark pill keeps the words readable over flags, dots and photos */}
      <div style={{ display: "inline-block", background: "rgba(6,14,22,.5)", borderRadius: 26, padding: "4px 14px 10px", boxShadow: "0 6px 24px rgba(0,0,0,.25)" }}>
      {c.words.map((w, j) => {
        const on = t >= w.s - 0.03;
        const hit = on && t < w.e;
        return (
          <span key={j} style={{
            color: w.kw ? (on ? GOLD : "rgba(255,211,77,.55)") : on ? "#fff" : "rgba(255,255,255,.55)",
            textShadow: SHADOW, margin: "0 8px", display: "inline-block",
            transform: `scale(${hit ? (w.kw ? 1.12 : 1.05) : 1})`,
          }}>{w.w.replace(/[«»]/g, "")}</span>
        );
      })}
      </div>
    </div>
  );
};

/* ---------------- screen pieces ---------------- */
export const Chip: React.FC<{ x: number; y: number; text: string; o: number; s?: number; size?: number; bg?: string; color?: string; icon?: React.ReactNode; anchor?: "c" | "l" | "r" }> = ({ x, y, text, o, s = 1, size = 44, bg = "rgba(10,20,30,.78)", color = "#fff", icon, anchor = "c" }) => {
  if (o <= 0.001) return null;
  const tx = anchor === "c" ? "-50%" : anchor === "l" ? "-100%" : "0%";
  return (
    <div dir="rtl" style={{
      position: "absolute", left: x, top: y, transform: `translate(${tx}, -50%) scale(${s})`, opacity: o, transformOrigin: "50% 50%",
      display: "flex", alignItems: "center", gap: size * 0.3, padding: `${size * 0.28}px ${size * 0.55}px`, borderRadius: size,
      background: bg, color, fontFamily: FONT_UI, fontWeight: 800, fontSize: size, whiteSpace: "nowrap",
      boxShadow: "0 8px 24px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.14)",
    }}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

// pin + label anchored on a map point (screen coords)
export const Pin: React.FC<{ x: number; y: number; text: string; o: number; s?: number; t: number; size?: number; color?: string; up?: number; dx?: number }> = ({ x, y, text, o, s = 1, t, size = 40, color = "#fff", up = 70, dx = 0 }) => {
  if (o <= 0.001) return null;
  const pulse = (t * 1.1) % 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o }}>
      <div style={{ position: "absolute", left: -9, top: -9, width: 18, height: 18, borderRadius: 9, background: color, boxShadow: `0 0 18px ${color}` }} />
      <div style={{ position: "absolute", left: -9 - 26 * pulse, top: -9 - 26 * pulse, width: 18 + 52 * pulse, height: 18 + 52 * pulse, borderRadius: "50%", border: `3px solid ${color}`, opacity: 1 - pulse }} />
      {up > 0 && <div style={{ position: "absolute", left: -1.5, top: -up * s, width: 3, height: up * s - 10, background: "rgba(255,255,255,.8)" }} />}
      <div dir="rtl" style={{
        position: "absolute", left: dx, top: -up * s, transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: "50% 100%",
        padding: `${size * 0.22}px ${size * 0.5}px`, borderRadius: 14, background: "rgba(10,20,30,.82)", color: "#fff",
        fontFamily: FONT_UI, fontWeight: 800, fontSize: size, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,.5)",
      }}>{text}</div>
    </div>
  );
};

export const BigText: React.FC<{ text: React.ReactNode; o: number; s?: number; y: number; size?: number; color?: string; glow?: string }> = ({ text, o, s = 1, y, size = 130, color = "#fff", glow = "rgba(255,190,60,.8)" }) => {
  if (o <= 0.001) return null;
  return (
    <div dir="rtl" style={{
      position: "absolute", left: 0, right: 0, top: y, textAlign: "center", opacity: o, transform: `translateY(-50%) scale(${s})`,
      fontFamily: FONT_HERO, fontSize: size, color, lineHeight: 1.15,
      textShadow: `0 0 20px ${glow}, 0 0 60px ${glow}, 0 6px 16px rgba(0,0,0,.7)`,
    }}>{text}</div>
  );
};

export const Stamp: React.FC<{ x: number; y: number; text: string; t: number; at: number; o?: number; color?: string; size?: number; rot?: number }> = ({ x, y, text, t, at, o = 1, color = "#E3262E", size = 120, rot = -12 }) => {
  if (t < at || o <= 0.001) return null;
  const k = clamp01((t - at) / 0.16);
  const sc = 2.3 - 1.3 * (1 - Math.pow(1 - k, 3));
  return (
    <div dir="rtl" style={{
      position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`, opacity: o * Math.min(1, k * 2.5),
      padding: `${size * 0.08}px ${size * 0.35}px`, border: `${size * 0.075}px solid ${color}`, borderRadius: size * 0.12, color,
      fontFamily: FONT_HERO, fontSize: size, lineHeight: 1.1, whiteSpace: "nowrap", background: "rgba(255,255,255,.08)",
      boxShadow: `0 0 30px ${color}55`,
    }}>{text}</div>
  );
};

/* a photo filling a w×h box, with a slow camera move; fy0/fy1 = which vertical slice of the picture the box shows */
export const Photo: React.FC<{ src: string; t: number; a: number; b: number; z0?: number; z1?: number; x0?: number; x1?: number; y0?: number; y1?: number; o?: number; h?: number; top?: number; focusY?: number; style?: React.CSSProperties; grade?: boolean }> = ({ src, t, a, b, z0 = 1.04, z1 = 1.14, x0 = 0, x1 = 0, y0 = 0, y1 = 0, o = 1, h = 1920, top = 0, focusY = 0.5, style, grade = true }) => {
  if (o <= 0.001) return null;
  const k = clamp01((t - a) / (b - a));
  const z = z0 + (z1 - z0) * k;
  // the picture is 9:16: at full width it is 1920 tall; show the slice around focusY
  const ih = SW * (1672 / 941);
  const off = Math.min(0, Math.max(h - ih, h / 2 - ih * focusY));
  return (
    <div style={{ position: "absolute", left: 0, top, width: SW, height: h, overflow: "hidden", opacity: o, ...style }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: h, transform: `translate(${x0 + (x1 - x0) * k}px, ${y0 + (y1 - y0) * k}px) scale(${z})` }}>
        <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: off, width: SW, height: ih }} />
      </div>
      {grade && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,.55) 100%)" }} />}
    </div>
  );
};

// a rounded card (phone-like panels)
export const Card: React.FC<{ x: number; y: number; w: number; h?: number; o: number; s?: number; rot?: number; bg?: string; children: React.ReactNode }> = ({ x, y, w, h, o, s = 1, rot = 0, bg = "#17212b", children }) => {
  if (o <= 0.001) return null;
  return (
    <div dir="rtl" style={{
      position: "absolute", left: x, top: y, width: w, height: h, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, opacity: o,
      background: bg, borderRadius: 34, boxShadow: "0 30px 70px rgba(0,0,0,.6), inset 0 0 0 2px rgba(255,255,255,.1)", overflow: "hidden",
      fontFamily: FONT_UI, color: "#fff",
    }}>{children}</div>
  );
};

// particles that drift a tiny bit (living decoration)
export const Motes: React.FC<{ t: number; o: number; n?: number; color?: string }> = ({ t, o, n = 26, color = "255,220,150" }) => {
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const x = ((Math.sin(i * 91.7) + 1) / 2) * SW + noise1(i + 10, t * 0.2) * 60;
        const y = ((((Math.sin(i * 37.3) + 1) / 2) * 1920 - t * (14 + (i % 5) * 6)) % 1920 + 1920) % 1920;
        const r = 2 + (i % 4);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: `rgba(${color},.7)`, boxShadow: `0 0 ${r * 4}px rgba(${color},.8)` }} />;
      })}
    </div>
  );
};

export const Dot: React.FC<{ c: string }> = ({ c }) => <div style={{ width: 18, height: 18, borderRadius: 9, background: c, boxShadow: `0 0 10px ${c}` }} />;

export const Bubble: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M8 8 H40 Q44 8 44 12 V30 Q44 34 40 34 H22 L12 42 V34 H8 Q4 34 4 30 V12 Q4 8 8 8 Z" fill="#fff" />
    <circle cx={16} cy={21} r={3} fill="#1b2a38" /><circle cx={24} cy={21} r={3} fill="#1b2a38" /><circle cx={32} cy={21} r={3} fill="#1b2a38" />
  </svg>
);

export const fa = FA;
