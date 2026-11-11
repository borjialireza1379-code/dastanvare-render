import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import VO from "./vo.json";

// v39 · Dastanvare · «جکی چان»: wooden-puppet stills (Flow/ChatGPT) with slow camera moves + 6 Flow clips,
// word-by-word Persian captions with gold keywords, the page name under them, a real photo for the reveal.
// Self-contained for the GitHub render.
export const V39_FPS = 30;
type Word = { w: string; s: number; e: number };
const LINES = VO.lines as { n: number; text: string; s: number; e: number; words: Word[] }[];
const TOTAL = VO.total + 1.8; // hold the reveal a little
export const V39_FRAMES = Math.ceil(TOTAL * V39_FPS);
const FPS = V39_FPS;

const FA = "Vazirmatn", SERIF = "Cormorant Garamond";
if (typeof window !== "undefined") {
  const h = delayRender("v39 fonts");
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

const GOLD = "#F5C36B", CREAM = "#FFF4E2";
const goldText: React.CSSProperties = {
  background: "linear-gradient(180deg,#FFE7B0 0%,#F5C36B 55%,#B07A30 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  filter: "drop-shadow(0 4px 10px rgba(0,0,0,.7))",
};
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
const IO = Easing.bezier(0.45, 0, 0.55, 1);

/* ---------- timing from the narration ---------- */
const L = (n: number) => LINES[n];
const W = (n: number, i: number) => LINES[n].words[i].s;
const pre = (n: number) => L(n).s - 0.15;

type Shot = { t: number; img?: string; clip?: string; from?: number; zoom?: [number, number]; pan?: [number, number] };
// cut times (seconds) → what is on screen until the next cut
const SHOTS: Shot[] = [
  { t: 0, clip: "01" },
  { t: pre(1), img: "03" },
  { t: W(1, 5), img: "02", zoom: [1.12, 1.02] },
  { t: pre(2), img: "04" },
  { t: pre(3), clip: "05" },
  { t: W(3, 8), img: "06", zoom: [1.0, 1.1], pan: [0, -30] },
  { t: pre(4), img: "07" },
  { t: W(4, 6), img: "08", zoom: [1.02, 1.12] },
  { t: pre(5), img: "09", zoom: [1.12, 1.0] },
  { t: pre(6), img: "10" },
  { t: pre(7), img: "11", zoom: [1.0, 1.06] },
  { t: W(7, 9) - 0.1, clip: "11" },
  { t: pre(8), clip: "12" },
  { t: pre(9), img: "13", zoom: [1.0, 1.1] },
  { t: W(9, 6), img: "14", zoom: [1.1, 1.0] },
  { t: pre(10), img: "15" },
  { t: pre(11), img: "16" },
  { t: pre(12), img: "17", zoom: [1.0, 1.1] },
  { t: W(12, 6), img: "18" },
  { t: pre(13), img: "19" },
  { t: W(13, 7), img: "20", zoom: [1.1, 1.0] },
  { t: pre(14), img: "21", zoom: [1.0, 1.1] },
  { t: pre(15), img: "x06" },
  { t: W(15, 5) - 0.1, clip: "21-22", from: 0.3 },
  { t: pre(16), img: "23" },
  { t: pre(17), clip: "24", from: 0.6 },
  { t: W(17, 6), img: "25" },
  { t: W(17, 10), img: "26", zoom: [1.1, 1.0] },
  { t: pre(18), clip: "01" },
  { t: W(18, 11), img: "28", zoom: [1.0, 1.1] },
  { t: pre(19), img: "29" },
  { t: pre(20), img: "30", zoom: [1.0, 1.12] },
];
const REVEAL = W(20, 2) - 0.05; // «جکی.» → the real photo
const CLIP_LEN = 5.03;
const FADE = 5; // frames of dissolve into each shot

const KB = ({ src, dur, zoom = [1.02, 1.1], pan = [0, 0] }: { src: string; dur: number; zoom?: [number, number]; pan?: [number, number] }) => {
  const f = useCurrentFrame();
  const p = IO(cl(f / Math.max(1, dur)));
  const z = zoom[0] + (zoom[1] - zoom[0]) * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `translateY(${pan[0] + (pan[1] - pan[0]) * p}px) scale(${z})` }} />
    </AbsoluteFill>
  );
};

// inside a Sequence that starts FADE frames before the cut: dissolve in over those frames
const ShotLayer = ({ s, dur }: { s: Shot; dur: number }) => {
  const op = cl(useCurrentFrame() / FADE);
  if (s.clip) {
    const from = s.from ?? 0, avail = CLIP_LEN - from - 0.05, need = dur / FPS;
    const rate = need > avail ? avail / need : 1;
    return (
      <AbsoluteFill style={{ opacity: op }}>
        <OffthreadVideo src={staticFile(`v39/clips/${s.clip}.mp4`)} muted startFrom={Math.round(from * FPS)} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover", maxWidth: "none" }} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ opacity: op }}><KB src={`v39/shots/${s.img}.jpg`} dur={dur} zoom={s.zoom} pan={s.pan} /></AbsoluteFill>;
};

/* ---------- captions ---------- */
const KEY = new Set(["فروخته", "پول", "قرض", "استرالیا", "اپرای", "چینی", "کتک", "بدلکار", "چوب", "ناله", "مُرد", "شکست", "ساختمون", "اسم", "تازه", "برعکس", "استاد", "مست", "استخون‌هاش", "بیمه‌ای", "اسکار", "جک", "کوچولو", "جکی", "چان"]);
const bare = (w: string) => w.replace(/[.،,:؟?!…«»]/g, "");
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
      if (/[.،:…!؟]$|\.\.\.$/.test(w.w)) flush();
    }
    flush();
  }
  return out.map((c, i) => ({ ...c, e: Math.min(out[i + 1]?.s ?? c.e + 0.6, c.e + 0.45) }));
})();

const Captions = ({ t }: { t: number }) => {
  const c = CHUNKS.find((k) => t >= k.s - 0.03 && t < k.e);
  if (!c) return null;
  const k = cl((t - c.s + 0.03) / 0.14);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1235, textAlign: "center", direction: "rtl", fontFamily: FA, fontWeight: 700, fontSize: 70, lineHeight: 1.25, color: CREAM,
      transform: `scale(${0.92 + 0.08 * OUT(k)})`, opacity: k, textShadow: "0 3px 6px rgba(0,0,0,.85), 0 0 22px rgba(0,0,0,.6)" }}>
      {c.words.map((w, i) => {
        const txt = w.w.replace(/\.\.\.$/, "…");
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

/* ---------- titles ---------- */
const Title = ({ t, from, to, children }: { t: number; from: number; to: number; children: React.ReactNode }) => {
  if (t < from - 0.1 || t > to + 0.3) return null;
  const a = cl((t - from) / 0.5), b = cl((to - t) / 0.4);
  return <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", opacity: Math.min(a, b), transform: `translateY(${(1 - OUT(a)) * 18}px)` }}>{children}</div>;
};
const Place = ({ name, year }: { name: string; year: string }) => (
  <>
    <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 68, letterSpacing: 14, color: CREAM, textShadow: "0 2px 4px rgba(0,0,0,.9), 0 4px 24px rgba(0,0,0,.9)" }}>{name}</div>
    <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 36, letterSpacing: 10, color: GOLD, marginTop: 6, textShadow: "0 2px 4px rgba(0,0,0,.9), 0 3px 14px rgba(0,0,0,.9)" }}>{year}</div>
  </>
);
const Big = ({ children }: { children: React.ReactNode }) => (
  <div style={{ direction: "rtl", fontFamily: FA, fontWeight: 900, fontSize: 110, ...goldText }}>{children}</div>
);

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

const Reveal = ({ t }: { t: number }) => {
  if (t < REVEAL) return null;
  const a = cl((t - REVEAL) / 0.35);
  const z = 1.06 - 0.06 * IO(cl((t - REVEAL) / 3));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: a }}>
        <Img src={staticFile("v39/jackie-real.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, filter: "sepia(.18) saturate(.92) contrast(1.04)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 55%,rgba(0,0,0,.7) 100%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#FFF6E6", opacity: 0.55 * (1 - cl((t - REVEAL) / 0.3)) * (t - REVEAL < 0.3 ? 1 : 0) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", opacity: cl((t - REVEAL - 0.5) / 0.6) }}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 92, letterSpacing: 16, color: CREAM, textShadow: "0 4px 16px rgba(0,0,0,.85)" }}>JACKIE CHAN</div>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 34, letterSpacing: 10, color: GOLD, marginTop: 4, textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>1954</div>
      </div>
      <div style={{ position: "absolute", right: 24, bottom: 18, fontFamily: SERIF, fontSize: 20, color: "rgba(255,244,226,.55)", opacity: a }}>Photo: Gage Skidmore · CC BY-SA 2.0</div>
    </AbsoluteFill>
  );
};

export const V39: React.FC<{ silent?: boolean; times?: number[] }> = ({ silent, times }) => {
  const frame = useCurrentFrame();
  const t = times ? times[frame] ?? 0 : frame / FPS;
  const fr = Math.round(t * FPS);
  return (
    <AbsoluteFill style={{ background: "#0b0806" }}>
      {!silent && !times && <Html5Audio src={staticFile("v39/mix-norm.wav")} />}
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
      <Reveal t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 24%,rgba(0,0,0,0) 55%,rgba(0,0,0,.45) 72%,rgba(0,0,0,.25) 100%)" }} />
      <Grain />
      <Title t={t} from={0.3} to={pre(1) - 0.2}><Place name="HONG KONG" year="1954" /></Title>
      <Title t={t} from={pre(3) + 0.2} to={W(3, 8) - 0.2}><Big>۷ ساله</Big></Title>
      <Title t={t} from={pre(4) + 0.2} to={W(4, 6) - 0.2}><Big>۱۰ سال</Big></Title>
      <Title t={t} from={pre(10) + 0.2} to={pre(11) - 0.2}><Place name="AUSTRALIA" year="1975" /></Title>
      <Title t={t} from={W(18, 11) - 0.1} to={pre(19) - 0.2}><Big>۲۰۱۶</Big></Title>
      <Captions t={t} />
      <PageName />
    </AbsoluteFill>
  );
};

// for the Look sheet: render a shot at a given local frame without a running Sequence clock
const FrozenShot = ({ s, at, dur }: { s: Shot; at: number; dur: number }) => {
  const img = s.clip ? s.clip.split("-")[0] : s.img; // a clip's own start image
  const p = IO(cl(at / Math.max(1, dur))), zoom = s.clip ? [1, 1] : s.zoom ?? [1.02, 1.1], pan = s.pan ?? [0, 0];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(`v39/shots/${img}.jpg`)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `translateY(${pan[0] + (pan[1] - pan[0]) * p}px) scale(${zoom[0] + (zoom[1] - zoom[0]) * p})` }} />
    </AbsoluteFill>
  );
};

// Look frames: one moment from each part of the story
export const V39_LOOK = [0.5, pre(1) + 1, pre(3) + 1, pre(4) + 1, W(7, 9) + 0.3, pre(8) + 2.5, pre(10) + 1, W(15, 5) + 1, W(17, 6) + 0.5, W(18, 11) + 1, REVEAL + 1.2];
