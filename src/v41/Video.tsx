import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import VO from "./vo.json";

// v41 · Dastanvare · «وسنا وولوویچ»: the user's own text, wooden-puppet stills with camera moves + 8 Flow clips
// (the opening is almost all clips, the user wanted a moving start), code overlays (10 km, flight card, route,
// 28 people, coma day counter, falling altimeter past Everest), word-by-word captions, the real photo at the end.
// Built from v39; self-contained for the GitHub render.
export const V41_FPS = 30;
type Word = { w: string; s: number; e: number };
const LINES = VO.lines as { n: number; text: string; s: number; e: number; words: Word[] }[];
const FPS = V41_FPS;

const FA = "Vazirmatn", SERIF = "Cormorant Garamond";
if (typeof window !== "undefined") {
  const h = delayRender("v41 fonts");
  Promise.all(
    ([
      [FA, "fonts/Vazirmatn-Bold.ttf", { weight: "700" }],
      [FA, "fonts/Vazirmatn-Black.ttf", { weight: "900" }],
      [SERIF, "fonts/CormorantGaramond.ttf", { weight: "300 700" }],
    ] as [string, string, FontFaceDescriptors][]).map(([f, u, d]) =>
      new FontFace(f, `url('${staticFile(u)}')`, d).load().then((ff) => document.fonts.add(ff)),
    ),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}

const GOLD = "#F5C36B", CREAM = "#FFF4E2", RED = "#E0573F";
const goldText: React.CSSProperties = {
  background: "linear-gradient(180deg,#FFE7B0 0%,#F5C36B 55%,#B07A30 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  filter: "drop-shadow(0 4px 10px rgba(0,0,0,.7))",
};
const shadow = "0 2px 4px rgba(0,0,0,.9), 0 4px 24px rgba(0,0,0,.9)";
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
const IO = Easing.bezier(0.45, 0, 0.55, 1);
const IN = Easing.bezier(0.55, 0, 0.9, 0.6);
const fa = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/* ---------- timing from the narration ---------- */
const L = (n: number) => LINES[n];
const W = (n: number, i: number) => LINES[n].words[i].s;
const pre = (n: number) => L(n).s - 0.15;
const REVEAL = L(10).e + 0.35; // after the last word → the real photo
const TOTAL = Math.max(VO.total, REVEAL) + 2.6;
export const V41_FRAMES = Math.ceil(TOTAL * FPS);

type Shot = { t: number; img?: string; clip?: string; from?: number; zoom?: [number, number]; pan?: [number, number]; rot?: [number, number]; shake?: number; snow?: boolean };
// cut times (seconds) → what is on screen until the next cut
const SHOTS: Shot[] = [
  { t: 0, clip: "01" },                                          // explosion (hook)
  { t: W(0, 7) - 0.1, clip: "02", from: 0.4 },                   // «همه کشته شدن…» the cap falls
  { t: pre(1), clip: "03" },                                     // Vesna
  { t: W(1, 7) - 0.1, img: "04", zoom: [1.14, 1.0], pan: [40, -10], snow: true }, // boarding in the snow
  { t: pre(2), clip: "05" },                                     // calm cabin
  { t: W(2, 13) - 0.1, clip: "06", from: 3.2 },                  // «ناگهان انفجاری…»
  { t: W(2, 20), img: "07", zoom: [1.18, 1.0], rot: [-1.5, 1.5], shake: 9 }, // «و بدنه… متلاشی شد»
  { t: pre(3), img: "08", zoom: [1.04, 1.14], rot: [1.5, -2] },  // 28 people
  { t: W(3, 11) + 0.25, img: "09", zoom: [1.16, 1.04] },         // «اما وسنا هنوز زنده بود!»
  { t: pre(4), img: "10", zoom: [1.14, 1.06], pan: [70, -70], rot: [-3, 3] }, // the tail falls
  { t: W(4, 9) - 0.1, clip: "11" },                              // the food trolley
  { t: pre(5), img: "12", zoom: [1.2, 1.02], shake: 6, snow: true }, // crash into the forest
  { t: W(5, 9) - 0.05, img: "13", zoom: [1.02, 1.12], pan: [0, 20], snow: true },
  { t: pre(6), clip: "14" },                                     // rescuers
  { t: W(6, 12) - 0.15, img: "15", zoom: [1.04, 1.18], snow: true }, // «وسنا هنوز نفس می‌کشید!»
  { t: pre(7), img: "16", zoom: [1.02, 1.1] },
  { t: W(7, 8) - 0.1, img: "17", zoom: [1.12, 1.0], rot: [0, 2] }, // injuries + coma counter
  { t: pre(8), clip: "18" },                                     // eyes open
  { t: W(8, 5) - 0.1, img: "19", zoom: [1.02, 1.12], pan: [0, -20] }, // first step
  { t: pre(9), img: "20", zoom: [1.12, 1.0] },                   // world record
  { t: pre(10), img: "21", zoom: [1.0, 1.08], pan: [0, 30] },    // higher than Everest
  { t: W(10, 13) - 0.1, img: "22", zoom: [1.02, 1.12] },          // calm at the window
];
const CLIP_LEN = 7.9;
const FADE = 5; // frames of dissolve into each shot

const KB = ({ src, dur, s, at }: { src: string; dur: number; s: Shot; at: number }) => {
  const p = IO(cl(at / Math.max(1, dur)));
  const zoom = s.zoom ?? [1.02, 1.1], pan = s.pan ?? [0, 0], rot = s.rot ?? [0, 0];
  const z = zoom[0] + (zoom[1] - zoom[0]) * p;
  const k = s.shake ? s.shake * Math.max(0, 1 - at / 22) : 0; // a hit that settles in ~0.7 s
  const sx = k * Math.sin(at * 2.1), sy = k * Math.cos(at * 2.9);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover",
        transform: `translate(${sx}px,${pan[0] + (pan[1] - pan[0]) * p + sy}px) rotate(${rot[0] + (rot[1] - rot[0]) * p}deg) scale(${z})` }} />
    </AbsoluteFill>
  );
};

// falling snow in front of the snowy stills
const Snow = ({ at }: { at: number }) => {
  const flakes = Array.from({ length: 70 }, (_, i) => {
    const r = (k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    const size = 3 + r(1) * 7, speed = 1.6 + r(2) * 2.6 + size * 0.25;
    const y = ((r(3) * 2000 + at * speed * 2) % 2000) - 40;
    const x = r(4) * 1080 + Math.sin(at / 25 + r(5) * 6) * 30;
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,.85)", filter: size > 7 ? "blur(2px)" : "blur(.6px)", opacity: 0.35 + r(6) * 0.5 }} />;
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{flakes}</AbsoluteFill>;
};

// inside a Sequence that starts FADE frames before the cut: dissolve in over those frames
const ShotLayer = ({ s, dur }: { s: Shot; dur: number }) => {
  const f = useCurrentFrame();
  const op = cl(f / FADE), at = f - FADE;
  if (s.clip) {
    const from = s.from ?? 0, avail = CLIP_LEN - from - 0.05, need = (dur + FADE) / FPS;
    const rate = need > avail ? avail / need : 1;
    return (
      <AbsoluteFill style={{ opacity: op }}>
        <OffthreadVideo src={staticFile(`v41/clips/${s.clip}.mp4`)} muted startFrom={Math.round(from * FPS)} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <KB src={`v41/shots/${s.img}.jpg`} dur={dur} s={s} at={Math.max(0, at)} />
      {s.snow && <Snow at={f} />}
    </AbsoluteFill>
  );
};

/* ---------- captions ---------- */
const KEY = new Set(["۱۰", "کیلومتری", "منفجر", "مهماندار", "وسنا", "وولوویچ", "۲۲", "۱۹۷۲", "۳۶۷", "۴۶", "انفجاری", "متلاشی", "۲۸", "۲۷", "زنده", "چرخ‌دستی", "غذا", "برف", "نفس", "می‌کشید", "کما", "۱۶", "راه", "رکورد", "جهانی", "چتر", "اورست", "عجیب‌ترین"]);
const bare = (w: string) => w.replace(/[.،,:؛؟?!…«»]/g, "");
type Chunk = { words: Word[]; s: number; e: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  for (const l of LINES) {
    let cur: Word[] = [];
    const flush = () => { if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur.at(-1)!.e }); cur = []; };
    for (const w of l.words) {
      const len = cur.reduce((a, x) => a + bare(x.w).length, 0) + bare(w.w).length;
      if (cur.length && (cur.length >= 3 || (cur.length >= 2 && len > 13))) flush();
      cur.push(w);
      if (/[.،:؛…!؟]$/.test(w.w)) flush();
    }
    flush();
  }
  return out.map((c, i) => ({ ...c, e: Math.min(out[i + 1]?.s ?? c.e + 0.6, c.e + 0.45) }));
})();

const Captions = ({ t }: { t: number }) => {
  if (t >= REVEAL) return null;
  const c = CHUNKS.find((k) => t >= k.s - 0.03 && t < k.e);
  if (!c) return null;
  const k = cl((t - c.s + 0.03) / 0.14);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1235, textAlign: "center", direction: "rtl", fontFamily: FA, fontWeight: 700, fontSize: 70, lineHeight: 1.25, color: CREAM,
      transform: `scale(${0.92 + 0.08 * OUT(k)})`, opacity: k, textShadow: "0 3px 6px rgba(0,0,0,.85), 0 0 22px rgba(0,0,0,.6)" }}>
      {c.words.map((w, i) => {
        const txt = w.w.replace(/[؛]$/, "،");
        const key = KEY.has(bare(w.w));
        return <span key={i} style={key ? { ...goldText, textShadow: "none" } : undefined}>{txt}{i < c.words.length - 1 ? " " : ""}</span>;
      })}
    </div>
  );
};

const PageName = () => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1370, display: "flex", alignItems: "center", justifyContent: "center", gap: 22, opacity: 0.78 }}>
    <div style={{ width: 70, height: 1, background: "linear-gradient(90deg,transparent,#F3E3C8)" }} />
    <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 34, letterSpacing: 7, color: "#F3E3C8", textShadow: "0 2px 6px rgba(0,0,0,.8)" }}>Dastanvare</div>
    <div style={{ width: 70, height: 1, background: "linear-gradient(90deg,#F3E3C8,transparent)" }} />
  </div>
);

/* ---------- titles and overlays ---------- */
const Title = ({ t, from, to, top = 230, children }: { t: number; from: number; to: number; top?: number; children: React.ReactNode }) => {
  if (t < from - 0.1 || t > to + 0.3) return null;
  const a = cl((t - from) / 0.5), b = cl((to - t) / 0.4);
  return <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: Math.min(a, b), transform: `translateY(${(1 - OUT(a)) * 18}px)` }}>{children}</div>;
};
const Place = ({ name, sub }: { name: string; sub: string }) => (
  <>
    <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 64, letterSpacing: 12, color: CREAM, textShadow: shadow }}>{name}</div>
    <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 36, letterSpacing: 8, color: GOLD, marginTop: 6, textShadow: shadow }}>{sub}</div>
  </>
);
const Big = ({ children, size = 110 }: { children: React.ReactNode; size?: number }) => (
  <div style={{ direction: "rtl", fontFamily: FA, fontWeight: 900, fontSize: size, lineHeight: 1.15, ...goldText }}>{children}</div>
);

// Stockholm → Belgrade with a plane moving along a dashed line
const Route = ({ t, from, to }: { t: number; from: number; to: number }) => {
  if (t < from - 0.1 || t > to + 0.3) return null;
  const a = cl((t - from) / 0.5), b = cl((to - t) / 0.4), p = IO(cl((t - from - 0.2) / (to - from - 0.2)));
  const x0 = 170, x1 = 910, x = x0 + (x1 - x0) * p;
  return (
    <div style={{ position: "absolute", left: 0, top: 215, width: 1080, height: 170, opacity: Math.min(a, b) }}>
      <svg width="1080" height="170" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={x0} y1={92} x2={x1} y2={92} stroke="rgba(255,244,226,.45)" strokeWidth={3} strokeDasharray="10 12" />
        <line x1={x0} y1={92} x2={x} y2={92} stroke={GOLD} strokeWidth={4} />
        <circle cx={x0} cy={92} r={9} fill={GOLD} /><circle cx={x1} cy={92} r={9} fill="none" stroke={GOLD} strokeWidth={3} />
        <g transform={`translate(${x},92) rotate(90)`}><path d="M0,-26 L5,-8 L24,4 L24,9 L5,3 L4,16 L10,21 L10,25 L0,22 L-10,25 L-10,21 L-4,16 L-5,3 L-24,9 L-24,4 L-5,-8 Z" fill={CREAM} stroke="rgba(0,0,0,.5)" strokeWidth={1} /></g>
      </svg>
      <div style={{ position: "absolute", left: x0 - 150, width: 300, top: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 40, letterSpacing: 6, color: CREAM, textShadow: shadow }}>STOCKHOLM</div>
      <div style={{ position: "absolute", left: x1 - 150, width: 300, top: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 40, letterSpacing: 6, color: CREAM, textShadow: shadow }}>BELGRADE</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 118, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 32, letterSpacing: 8, color: GOLD, textShadow: shadow }}>26 · 01 · 1972</div>
    </div>
  );
};

// 28 people on board: 27 go dark, one stays gold
const Person = ({ c, glow }: { c: string; glow: number }) => (
  <svg width="70" height="96" viewBox="0 0 70 96" style={{ filter: glow ? `drop-shadow(0 0 ${14 * glow}px rgba(245,195,107,.9))` : "drop-shadow(0 2px 4px rgba(0,0,0,.8))" }}>
    <circle cx="35" cy="20" r="15" fill={c} />
    <path d="M8,92 C8,58 16,42 35,42 C54,42 62,58 62,92 Z" fill={c} />
  </svg>
);
const People = ({ t }: { t: number }) => {
  const from = pre(3) + 0.1, to = W(3, 11) + 0.25;
  if (t < from - 0.1 || t > to + 0.3) return null;
  const a = cl((t - from) / 0.4), b = cl((to - t) / 0.3), die = W(3, 7) - 0.1, hope = W(3, 10) + 0.25;
  const SURV = 17;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", opacity: Math.min(a, b) }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 86px)", rowGap: 14, direction: "rtl" }}>
        {Array.from({ length: 28 }, (_, i) => {
          const inA = cl((t - from - i * 0.035) / 0.25);
          const d = i === SURV ? 0 : cl((t - die - ((i * 7) % 28) * 0.03) / 0.3);
          const g = i === SURV ? cl((t - hope) / 0.3) : 0;
          const col = i === SURV && g > 0 ? GOLD : `rgba(${Math.round(255 - d * 140)},${Math.round(244 - d * 190)},${Math.round(226 - d * 190)},${1 - d * 0.55})`;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "center", opacity: inA, transform: `scale(${(0.6 + 0.4 * OUT(inA)) * (1 + 0.25 * g * (1 + 0.15 * Math.sin(t * 7)))})` }}>
              <Person c={col} glow={g} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// days in a coma, counting up to 27
const Coma = ({ t }: { t: number }) => {
  const from = W(7, 8) + 0.1, to = pre(8) - 0.15, land = W(7, 18);
  if (t < from - 0.1 || t > to + 0.3) return null;
  const a = cl((t - from) / 0.4), b = cl((to - t) / 0.4);
  const n = Math.max(1, Math.round(1 + 26 * Easing.out(Easing.cubic)(cl((t - from) / (land - from)))));
  const hit = cl((t - land) / 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 205, textAlign: "center", opacity: Math.min(a, b) }}>
      <div style={{ fontFamily: FA, fontWeight: 700, fontSize: 44, color: CREAM, direction: "rtl", textShadow: shadow }}>در کما</div>
      <div style={{ transform: `scale(${1 + 0.12 * Math.sin(Math.PI * hit)})` }}><Big size={150}>{fa(n)} روز</Big></div>
    </div>
  );
};

// altimeter: a marker falls from 10,160 m to the ground, past the Everest line
const Altimeter = ({ t }: { t: number }) => {
  const from = pre(10) + 0.1, to = W(10, 13) - 0.2;
  if (t < from - 0.1 || t > to + 0.3) return null;
  const a = cl((t - from) / 0.4), b = cl((to - t) / 0.4);
  // scale chosen so the Everest line sits on the summit in shot 21 (y≈556) and 0 m at the cloud floor
  const bot = 1150, H = 10160, EV = 8849, SUMMIT = 556;
  const y = (m: number) => bot - ((bot - SUMMIT) * m) / EV, top = y(H);
  const fall = IN(cl((t - W(10, 3)) / (W(10, 12) - W(10, 3))));
  const alt = H * (1 - fall), my = y(alt);
  const past = alt < EV, flash = past ? cl(1 - (t - (W(10, 3) + (W(10, 12) - W(10, 3)) * 0.42)) / 0.6) : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: Math.min(a, b) }}>
      <div style={{ position: "absolute", left: 790, top, width: 4, height: bot - top, background: "linear-gradient(180deg,rgba(255,244,226,.85),rgba(255,244,226,.35))", boxShadow: "0 0 10px rgba(0,0,0,.6)" }} />
      {[0, 2000, 4000, 6000, 8000, 10000].map((m) => (
        <div key={m} style={{ position: "absolute", left: 780, top: y(m) - 1, width: 24, height: 2, background: "rgba(255,244,226,.6)" }} />
      ))}
      <div style={{ position: "absolute", left: 420, width: 400, top: y(EV) - 2, height: 3, background: past ? GOLD : "rgba(255,244,226,.75)", boxShadow: past ? "0 0 14px rgba(245,195,107,.8)" : "0 0 6px rgba(0,0,0,.6)" }} />
      <div style={{ position: "absolute", left: 500, top: y(EV) - 70, fontFamily: SERIF, fontWeight: 700, fontSize: 42, letterSpacing: 4, color: past ? GOLD : CREAM, textShadow: shadow, transform: `scale(${1 + 0.15 * flash})`, transformOrigin: "left bottom" }}>EVEREST · 8,849 m</div>
      <div style={{ position: "absolute", left: 680, top: y(0) - 56, fontFamily: SERIF, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: CREAM, textShadow: shadow }}>0 m</div>
      <div style={{ position: "absolute", left: 814, top: my - 30, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 0, height: 0, borderTop: "18px solid transparent", borderBottom: "18px solid transparent", borderRight: `28px solid ${RED}`, filter: "drop-shadow(0 0 8px rgba(224,87,63,.8))" }} />
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 48, color: CREAM, textShadow: shadow }}>{Math.round(alt / 10) * 10 >= 1000 ? Math.round(alt).toLocaleString("en-US") : Math.round(alt)} m</div>
      </div>
    </div>
  );
};

const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.16, pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 30} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="1080" height="1920" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

// the real Vesna: a black-and-white print over a blurred copy of itself
const Reveal = ({ t }: { t: number }) => {
  if (t < REVEAL) return null;
  const a = cl((t - REVEAL) / 0.4);
  const z = 1.0 + 0.05 * IO(cl((t - REVEAL) / 3));
  const card = OUT(cl((t - REVEAL) / 0.7));
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <AbsoluteFill style={{ background: "#0b0806" }} />
      <Img src={staticFile("v41/vesna-real.jpg")} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(.35) grayscale(1)", transform: "scale(1.2)" }} />
      <div style={{ position: "absolute", left: 60, top: 520, width: 960, height: 767, transform: `translateY(${(1 - card) * 40}px) rotate(${-1.2 + 0.6 * card}deg) scale(${z})`,
        background: "#F4EEE2", padding: 18, boxShadow: "0 30px 80px rgba(0,0,0,.75)" }}>
        <Img src={staticFile("v41/vesna-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) sepia(.15) contrast(1.05)" }} />
      </div>
      <AbsoluteFill style={{ background: "#FFF6E6", opacity: 0.5 * (1 - cl((t - REVEAL) / 0.3)) * (t - REVEAL < 0.3 ? 1 : 0) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", opacity: cl((t - REVEAL - 0.5) / 0.6) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 84, letterSpacing: 12, color: CREAM, textShadow: "0 4px 16px rgba(0,0,0,.85)" }}>VESNA VULOVIĆ</div>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 36, letterSpacing: 10, color: GOLD, marginTop: 4, textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>1950 – 2016</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1450, textAlign: "center", direction: "rtl", fontFamily: FA, fontWeight: 700, fontSize: 40, color: "rgba(255,244,226,.8)", opacity: cl((t - REVEAL - 0.9) / 0.6) }}>عکس واقعی، بیمارستان، ۱۹۷۲</div>
    </AbsoluteFill>
  );
};

export const V41: React.FC<{ silent?: boolean; times?: number[] }> = ({ silent, times }) => {
  const frame = useCurrentFrame();
  const t = times ? times[frame] ?? 0 : frame / FPS;
  const fr = Math.round(t * FPS);
  return (
    <AbsoluteFill style={{ background: "#0b0806" }}>
      {!silent && !times && <Html5Audio src={staticFile("v41/mix-norm.wav")} />}
      {SHOTS.map((s, i) => {
        const a = Math.round(s.t * FPS), b = Math.round((SHOTS[i + 1]?.t ?? TOTAL) * FPS);
        if (fr < a - FADE || fr >= b) return null;
        if (times) return fr >= a || i === 0 ? <FrozenShot key={i} s={s} at={fr - a} dur={b - a} /> : null;
        return (
          <Sequence key={i} from={a - FADE} durationInFrames={b - a + FADE} layout="none">
            <ShotLayer s={s} dur={b - a} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 24%,rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 72%,rgba(0,0,0,.25) 100%)" }} />
      <Title t={t} from={W(0, 3) - 0.1} to={W(0, 7) - 0.2}><Big size={130}>{fa(10)} کیلومتر</Big></Title>
      <Title t={t} from={W(1, 1)} to={W(1, 7) - 0.25}><Place name="VESNA VULOVIĆ" sub="22" /></Title>
      <Title t={t} from={W(1, 9) - 0.1} to={pre(2) - 0.2}><Place name="FLIGHT 367" sub="26 · 01 · 1972" /></Title>
      <Route t={t} from={pre(2) + 0.1} to={W(2, 9) - 0.2} />
      <Title t={t} from={W(2, 9) - 0.1} to={W(2, 20) - 0.2}><Big>{fa(46)} دقیقه بعد</Big></Title>
      <People t={t} />
      <Coma t={t} />
      <Title t={t} from={W(8, 8) - 0.1} to={pre(9) - 0.2}><Big>{fa(16)} ماه</Big></Title>
      <Title t={t} from={pre(9) + 0.2} to={pre(10) - 0.2}><Place name="WORLD RECORD" sub="10,160 m · NO PARACHUTE" /></Title>
      <Altimeter t={t} />
      <Reveal t={t} />
      <Grain />
      <Captions t={t} />
      <PageName />
    </AbsoluteFill>
  );
};

// for the Look sheet: render a shot at a given local frame without a running Sequence clock
const FrozenShot = ({ s, at, dur }: { s: Shot; at: number; dur: number }) => {
  const img = s.clip ?? s.img!; // a clip's own start image
  return (
    <AbsoluteFill>
      <KB src={`v41/shots/${img}.jpg`} dur={dur} s={s.clip ? { ...s, zoom: [1, 1] } : s} at={at} />
      {s.snow && <Snow at={at} />}
    </AbsoluteFill>
  );
};

// Look frames: one moment from each part of the story
export const V41_LOOK = [0.5, W(0, 4), W(1, 2), W(1, 12), W(2, 3), W(2, 11), W(2, 22), W(3, 4), W(3, 13), W(4, 4), W(5, 3), W(6, 14), W(7, 16), W(8, 9), W(9, 4), W(10, 7), W(10, 18), REVEAL + 1.5];
