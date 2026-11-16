import React, { useEffect, useRef } from "react";
import { AbsoluteFill, Html5Audio, Img, staticFile, useCurrentFrame } from "remotion";
import "./fonts";
import { drawMap, MapState } from "./map";
import { CX, GMAX, H, W, YR, cl, drawAxis, drawBg, drawTree, eo, fa, lay, sm } from "./tree";

// ۵۰ · «چند نفر از اجدادت جنگ دیدن؟» · هم‌قالب ۱۵ (شجره‌نامه‌ی قدیمی)، ریتم تند
// نسخه‌ی A با نریشن (mix-a.wav)، نسخه‌ی B بی‌نریشن (mix-b.wav)؛ تصویر یکی است
export const V50_FPS = 30;
// شروع هر نسل (ثانیه)؛ TG[g]
export const TG = [0, 4.4, 7.2, 9.6, 12.3, 16.0, 19.6, 21.8, 24.2, 25.6, 27.0];
export const T_FIN = 28.8, T_E1 = 32.0, T_E2 = 34.2, T_OUT = 37.0;
export const V50_TOTAL = 37.6;
export const V50_FRAMES = Math.round(V50_TOTAL * V50_FPS);
export const V50_LOOK = [0.1, 1.0, 2.7, 3.7, 4.25, 5.7, 8.4, 11.2, 13.6, 15.2, 17.8, 20.8, 23.2, 25.0, 26.4, 28.2, 30.2, 33.0, 35.6, 37.3].map((s) => Math.min(V50_FRAMES - 1, Math.round(s * V50_FPS)));

const INK = "#FBEBCB", ACC = "#F2B860", LAB = "#F2DDB2", BRK = "#D48A60";
const HEAD = "Estedad", UI = "Vazirmatn";
const TS = "0 3px 16px rgba(10,6,2,.95), 0 1px 3px rgba(10,6,2,.9)";

type Seg = [string, boolean]; // [متن، طلایی؟]
type Gen = { role: string; n: number; title: Seg[]; chips: { txt: string; at: number; kind?: "peace" | "war" }[]; icon?: boolean };
const GENS: (Gen | null)[] = [
  null,
  { role: "پدر و مادرت", n: 2, title: [["جنگ ایران و عراق · ", false], ["۱۳۵۹ تا ۱۳۶۷", true]], chips: [{ txt: "بچه بودن: ۱۰ تا ۱۸ ساله", at: 0.6 }] },
  { role: "پدربزرگ و مادربزرگ‌ها", n: 4, title: [["همون جنگ", false]], chips: [{ txt: "حدود ۴۰ ساله", at: 0.45 }] },
  { role: "نسل ۳", n: 8, title: [["۱۹۴۱: ", true], ["انگلیس از جنوب، شوروی از شمال", false]], chips: [{ txt: "حدود ۳۰ ساله", at: 0.6 }] },
  { role: "نسل ۴", n: 16, title: [["۱۹۱۴ تا ۱۹۱۸: ", true], ["ایران بی‌طرف بود ولی شد میدون جنگ", false]], chips: [{ txt: "قحطی ۱۹۱۷ تا ۱۹۱۹", at: 1.7, kind: "war" }] },
  { role: "نسل ۵", n: 32, title: [["۱۸۶۰ تا ۱۸۹۵: ", true], ["جنگ بزرگی نبود", false]], chips: [{ txt: "تنها نسل صلح", at: 0.7, kind: "peace" }] },
  { role: "نسل ۶", n: 64, title: [["۱۸۵۶: ", true], ["انگلیس بوشهر رو گرفت", false]], chips: [] },
  { role: "نسل ۷", n: 128, title: [["۱۸۰۴ تا ۱۸۲۸: ", true], ["دو جنگ با روسیه", false]], chips: [] },
  { role: "نسل ۸", n: 256, title: [["جنگ‌های زندیه و قاجار", false]], chips: [] },
  { role: "نسل ۹", n: 512, title: [["لشکرکشی‌های نادرشاه", false]], chips: [] },
  { role: "نسل ۱۰", n: 1024, title: [["۱۷۲۲: ", true], ["سقوط اصفهان", false]], chips: [], icon: true },
];

const genAt = (t: number) => {
  let g = 0;
  for (let k = 1; k <= GMAX; k++) if (t >= TG[k]) g = k;
  return g;
};
const endOf = (g: number) => (g < GMAX ? TG[g + 1] : T_FIN);

// ----- حالت درخت -----
const HOOK_IN = 0.05, HOOK_GROW = 1.35, HOOK_RET0 = 3.95, HOOK_RET1 = 4.35;
const Lof = (t: number) => {
  if (t < TG[1]) return 10 * eo((t - HOOK_IN) / HOOK_GROW) * (1 - sm(HOOK_RET0, HOOK_RET1, t));
  const g = genAt(t);
  const st = TG[g] + (g >= 8 ? 0.2 : 0.35), d = g >= 8 ? 0.5 : 0.6;
  return g - 1 + eo((t - st) / d);
};
const hookMark = (t: number) => sm(2.0, 2.5, t) * (1 - sm(3.8, 4.2, t));
const warOf = (t: number) => {
  const w: number[] = [];
  const fin = sm(T_FIN + 0.2, T_FIN + 0.9, t);
  for (let g = 0; g <= GMAX; g++) w[g] = g === 5 || g === 0 ? 0 : Math.max(hookMark(t), t >= TG[1] ? sm(TG[g] + 0.7, TG[g] + 1.2, t) : 0, fin);
  return w;
};
const peaceOf = (t: number) => Math.max(
  hookMark(t),
  sm(TG[5] + 0.7, TG[5] + 1.3, t) * (1 - 0.7 * sm(TG[6], TG[6] + 0.6, t)),
  sm(T_FIN + 0.3, T_FIN + 1.1, t),
);
const dimOf = (t: number) => Math.max(0.6 * hookMark(t), sm(T_FIN + 0.3, T_FIN + 1.1, t) * (1 - 0.5 * sm(T_E1 + 0.4, T_E1 + 1.0, t)));
const waveOf = (t: number) => (t < T_E1 + 0.5 || t > T_E1 + 2.8 ? -99 : 10.8 - 11.6 * sm(T_E1 + 0.5, T_E1 + 2.5, t));
const camOf = (t: number) => 1 - 0.07 * sm(T_FIN, T_E2 + 2.5, t);
const CAM_Y = 1180;

const mapOf = (t: number): MapState => {
  const on = (a: number, b: number, d = 1.1) => cl((t - a) / d) * (1 - sm(b - 0.1, b + 0.2, t));
  return {
    a: sm(4.5, 4.9, t) * (1 - sm(TG[8] - 0.15, TG[8] + 0.3, t)),
    khuz: on(TG[1] + 0.25, TG[3]),
    pulse: Math.sin(Math.PI * cl((t - TG[2] - 0.2) / 1.0)),
    arrows: on(TG[3] + 0.3, TG[4], 1.2),
    powers: on(TG[4] + 0.3, TG[5], 1.0),
    famine: sm(TG[4] + 1.6, TG[4] + 2.2, t) * (1 - sm(TG[5] - 0.1, TG[5] + 0.3, t)),
    peace: sm(TG[5] + 0.4, TG[5] + 1.0, t) * (1 - sm(TG[6] - 0.1, TG[6] + 0.3, t)),
    bushehr: on(TG[6] + 0.25, TG[7]),
    caucasus: on(TG[7] + 0.25, TG[8]),
  };
};

export const V50: React.FC<{ silent?: boolean; frames?: number[]; mix?: "a" | "b" }> = ({ silent = false, frames, mix = "a" }) => {
  const frame = useCurrentFrame();
  const t = (frames ? frames[frame] ?? 0 : frame) / V50_FPS;
  const L = Lof(t);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    const m = mapOf(t);
    c.clearRect(0, 0, W, H);
    drawBg(c, 0.8 * m.peace, m.famine);
    drawMap(c, m, t);
    const st = lay(L, t, warOf(t), peaceOf(t), dimOf(t), waveOf(t));
    const k = camOf(t);
    c.save();
    c.translate(CX, CAM_Y);
    c.scale(k, k);
    c.translate(-CX, -CAM_Y);
    drawTree(c, st, 1, t < TG[1] ? 0 : 1, m.a > 0.02 ? 1050 : 640);
    drawAxis(c, st, sm(4.6, 5.1, t) * (1 - sm(T_FIN - 0.2, T_FIN + 0.2, t)));
    c.restore();
    // پایان: محو آرام
    const out = sm(T_OUT, T_OUT + 0.6, t);
    if (out > 0) {
      c.fillStyle = `rgba(20,12,6,${0.92 * out})`;
      c.fillRect(0, 0, W, H);
    }
  }, [t, L]);
  const out = 1 - sm(T_OUT, T_OUT + 0.6, t);
  const k = camOf(t);
  const youA = (1 - sm(T_FIN, T_FIN + 0.35, t) + sm(T_E1 + 2.0, T_E1 + 2.5, t)) * out;
  return (
    <AbsoluteFill style={{ background: "#140C06", overflow: "hidden" }}>
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />
      <Hook t={t} L={L} />
      <GenText t={t} />
      <Finale t={t} />
      <div style={{ position: "absolute", left: 0, width: W, top: CAM_Y + (YR + 30 - CAM_Y) * k, textAlign: "center", fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: INK, opacity: cl(youA), textShadow: "0 0 24px rgba(10,6,2,.95)" }}>تو</div>
      <Note t={t} />
      <Logo t={t} />
      {!silent && !frames && <Html5Audio src={staticFile(`v50/mix-${mix}.wav`)} />}
    </AbsoluteFill>
  );
};

const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.15) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));
const pop = (t: number, a: number, amt = 0.12, d = 0.35) => 1 + amt * (1 - eo((t - a) / d)) * (t >= a ? 1 : 0);

/* ---------------- هوک (۰ تا ۴.۴) ---------------- */
const Hook: React.FC<{ t: number; L: number }> = ({ t, L }) => {
  if (t >= TG[1]) return null;
  const a = 1 - sm(3.95, 4.3, t);
  const count = Math.max(2, Math.round(Math.pow(2, L + 1) - 2));
  const done = sm(1.25, 1.45, t);
  const b = sm(1.5, 1.8, t);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 168, opacity: a, direction: "rtl", textAlign: "center", fontFamily: HEAD, fontWeight: 900, color: INK, textShadow: TS, transform: `translateY(${-14 * sm(3.95, 4.3, t)}px)` }}>
      <div style={{ display: "inline-block", padding: "4px 20px", borderRadius: 30, border: "1.5px solid rgba(242,184,96,.5)", background: "rgba(30,18,8,.55)", fontFamily: UI, fontWeight: 700, fontSize: 28, color: LAB }}>روی کاغذ</div>
      <div style={{ fontSize: 54, lineHeight: 1.2, marginTop: 18, whiteSpace: "nowrap" }}>
        ۳۰۰ سال ·{" "}
        <span style={{ display: "inline-block", minWidth: 250, fontSize: 112, color: ACC, transform: `scale(${pop(t, 1.35, 0.1)})`, textShadow: `${TS}, 0 0 ${36 * done}px rgba(242,184,96,.5)` }}>{fa(count)}</span>
        {" "}نفر از اجدادت
      </div>
      <div style={{ fontSize: 56, lineHeight: 1.3, marginTop: 26, opacity: b, transform: `translateY(${18 * (1 - eo((t - 1.5) / 0.4))}px)` }}>
        فقط{" "}
        <span style={{ display: "inline-block", fontSize: 92, color: ACC, transform: `scale(${pop(t, 2.0, 0.28, 0.4)})`, textShadow: `${TS}, 0 0 ${30 * sm(2.0, 2.3, t)}px rgba(255,236,190,.6)` }}>۳۲</span>
        {" "}نفرشون جنگ بزرگی ندیدن
      </div>
    </div>
  );
};

/* ---------------- متن هر نسل ---------------- */
const Chip: React.FC<{ txt: string; kind?: "peace" | "war"; a: number; y: number }> = ({ txt, kind, a, y }) => (
  <div style={{
    display: "inline-block", margin: "0 8px", padding: "6px 24px", borderRadius: 30, opacity: a, transform: `translateY(${y}px)`,
    border: `1.5px solid ${kind === "peace" ? "rgba(255,244,214,.85)" : kind === "war" ? "rgba(212,138,96,.7)" : "rgba(242,184,96,.55)"}`,
    background: kind === "peace" ? "rgba(255,240,205,.14)" : "rgba(30,18,8,.65)",
    boxShadow: kind === "peace" ? "0 0 26px rgba(255,236,190,.35)" : "none",
    fontFamily: UI, fontWeight: 700, fontSize: 32, color: kind === "peace" ? "#FFF3D6" : kind === "war" ? BRK : ACC,
  }}>{txt}</div>
);

const GenText: React.FC<{ t: number }> = ({ t }) => {
  if (t < TG[1] || t >= T_FIN) return null;
  const g = genAt(t), G = GENS[g]!;
  const t0 = TG[g], t1 = endOf(g) - 0.02;
  const fast = g >= 8;
  const aRole = win(t, t0, t1, 0.2, 0.12);
  const aNum = win(t, t0, t1, 0.15, 0.12);
  const tTitle = t0 + (fast ? 0.12 : 0.2);
  const aTitle = win(t, tTitle, t1, 0.25, 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 172, direction: "rtl", textAlign: "center", color: INK, textShadow: TS }}>
      <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 36, color: LAB, opacity: aRole, height: 50 }}>{G.role}</div>
      <div style={{ opacity: aNum, height: 150, whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", fontFamily: HEAD, fontWeight: 900, fontSize: 128, lineHeight: 1.15, color: ACC, transform: `scale(${pop(t, t0, 0.14, 0.3)})`, textShadow: `${TS}, 0 0 30px rgba(242,184,96,.35)` }}>{fa(G.n)}</span>
        <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 50, marginRight: 18 }}>نفر</span>
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 46, lineHeight: 1.42, opacity: aTitle, transform: `translateY(${16 * (1 - eo((t - tTitle) / 0.35))}px)`, padding: "0 20px" }}>
        {G.title.map(([s, gold], i) => <span key={i} style={{ color: gold ? ACC : INK }}>{s}</span>)}
      </div>
      <div style={{ marginTop: 14 }}>
        {G.chips.map((ch, i) => {
          const a = win(t, t0 + ch.at, t1, 0.25, 0.12);
          return a > 0.01 ? <Chip key={i} txt={ch.txt} kind={ch.kind} a={a} y={12 * (1 - eo((t - t0 - ch.at) / 0.35))} /> : null;
        })}
      </div>
      {G.icon && <div style={{ display: "flex", justifyContent: "center" }}><Isfahan a={win(t, t0 + 0.35, t1, 0.3, 0.12)} t={t - t0} /></div>}
    </div>
  );
};

// نماد ساده‌ی اصفهان: گنبد و دو مناره، خط طلایی (کشیده می‌شود)
const Isfahan: React.FC<{ a: number; t: number }> = ({ a, t }) => {
  if (a <= 0.01) return null;
  const d = 1 - eo((t - 0.35) / 0.8);
  const st = { fill: "none", stroke: ACC, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: d };
  return (
    <svg width={230} height={120} viewBox="0 0 230 120" style={{ opacity: a, marginTop: 6, filter: "drop-shadow(0 0 8px rgba(242,184,96,.45))" }}>
      <path {...st} d="M10 116 H220" />
      <path {...st} d="M70 116 V74 H160 V116 M98 116 V94 A17 17 0 0 1 132 94 V116" />
      <path {...st} d="M78 74 C78 44 100 30 115 18 C130 30 152 44 152 74" />
      <path {...st} d="M115 18 V6" />
      <path {...st} d="M40 116 V36 M52 116 V36 M36 36 H56 M40 36 L46 20 L52 36" />
      <path {...st} d="M178 116 V36 M190 116 V36 M174 36 H194 M178 36 L184 20 L190 36" />
    </svg>
  );
};

/* ---------------- ۲۰۴۶ و پایان ---------------- */
const Finale: React.FC<{ t: number }> = ({ t }) => {
  if (t < T_FIN - 0.05) return null;
  const out = 1 - sm(T_OUT, T_OUT + 0.6, t);
  const aNum = sm(T_FIN, T_FIN + 0.3, t) * out;
  const k = cl((t - T_E1 - 0.3) / 0.9);
  const n = Math.round(2046 - 32 * eo(k));
  const aTop = sm(T_E1, T_E1 + 0.3, t) * out;
  const aBot = sm(T_E1 + 0.9, T_E1 + 1.2, t) * out;
  const aQ = sm(T_E2, T_E2 + 0.35, t) * out;
  const shift = -40 * sm(T_E2 - 0.1, T_E2 + 0.4, t);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 178 + shift, direction: "rtl", textAlign: "center", color: INK, textShadow: TS, fontFamily: HEAD, fontWeight: 900 }}>
      <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 38, color: LAB, opacity: aTop, height: 56 }}>روی کاغذ:</div>
      <div style={{ fontSize: 210, lineHeight: 1.05, color: ACC, opacity: aNum, transform: `scale(${pop(t, T_FIN, 0.12, 0.5) * (1 + 0.05 * sm(T_FIN, T_E1, t))})`, textShadow: `${TS}, 0 0 60px rgba(242,184,96,.45)` }}>{fa(n)}</div>
      <div style={{ fontSize: 60, lineHeight: 1.3, opacity: aBot, transform: `translateY(${16 * (1 - eo((t - T_E1 - 0.9) / 0.4))}px)` }}>نفرشون جنگ دیدن</div>
      <div style={{ fontSize: 54, lineHeight: 1.35, marginTop: 34, opacity: aQ, transform: `translateY(${18 * (1 - eo((t - T_E2) / 0.45))}px)` }}>
        پدربزرگت <span style={{ color: ACC }}>کدوم جنگ</span> رو یادشه؟
      </div>
    </div>
  );
};

/* ---------------- خط ریز ثابت پایین ---------------- */
const Note: React.FC<{ t: number }> = ({ t }) => {
  const a = sm(4.5, 5.0, t) * (1 - sm(T_FIN - 0.3, T_FIN, t)) * 0.75;
  if (a <= 0.01) return null;
  return <div style={{ position: "absolute", left: 0, width: W, top: 1606, textAlign: "center", direction: "rtl", fontFamily: UI, fontWeight: 600, fontSize: 26, color: LAB, opacity: a, textShadow: TS }}>روی کاغذ · هر نسل ۳۰ سال</div>;
};

/* ---------------- لوگو ---------------- */
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = 0.6 * (1 - sm(T_FIN - 0.3, T_FIN, t));
  if (a <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 96, width: 112, display: "flex", flexDirection: "column", alignItems: "center", opacity: a }}>
      <Img src={staticFile("v50/logo-mark.png")} style={{ width: 90, height: 75, filter: "drop-shadow(0 0 3px rgba(0,0,0,.6))" }} />
      <div style={{ fontFamily: "'Chakra Petch'", fontWeight: 700, fontSize: 22, letterSpacing: 1.2, color: "#fff", marginTop: 2, textShadow: "0 2px 6px rgba(0,0,0,.7)" }}>Agarlogy</div>
    </div>
  );
};
