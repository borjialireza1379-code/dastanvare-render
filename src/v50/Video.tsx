import React, { useEffect, useRef } from "react";
import { AbsoluteFill, Html5Audio, Img, staticFile, useCurrentFrame } from "remotion";
import "./fonts";
import { H, W, cl, drawBg, drawOver, eio, eo, fa, lerp, sm } from "./lib";
import { Cam, camAt, drawRegion, iranHalo, toScreen } from "./region";
import { WARS } from "./wars";
import TM from "./timing.json";
// زمان‌بندی از نریشن کاربر (videos/50/build-vo.mjs)
TM.dur.forEach((d, i) => (WARS[i].dur = d));

// ۵۰ (نسخه‌ی ۲) · «ایران چندتا جنگ بزرگ دیده؟» از جنگ ۴۰ روزه تا کوروش، رو به عقب · ریتم تند، بی‌نریشن
export const V50_FPS = 30;
export const HOOK = TM.hook;
export const T0 = (() => { const a: number[] = []; let t = HOOK; for (const w of WARS) { a.push(t); t += w.dur; } return a; })();
export const T_END = T0[T0.length - 1] + WARS[WARS.length - 1].dur;
const FIN = TM.fin;
export const V50_TOTAL = +(T_END + FIN).toFixed(2);
export const V50_FRAMES = Math.round(V50_TOTAL * V50_FPS);
const N = WARS.length;
const FLY = 0.55; // پرواز دوربین بین دو جنگ
export const V50_LOOK = [0.1, 1.6, T0[0] + 0.3, T0[0] + 1.6, T0[1] + 1.5, T0[2] + 1.8, T0[3] + 1.4, T0[5] + 1.5, T0[6] + 1.6, T0[7] + 1.6, T0[8] + 1.6, T0[9] + 1.5, T0[11] + 1.6, T0[12] + 1.6, T0[13] + 1.5, T0[14] + 1.5, T0[15] + 1.6, T0[17] + 1.7, T_END + 2.0, V50_TOTAL - 1.0]
  .map((s) => Math.min(V50_FRAMES - 1, Math.round(s * V50_FPS)));

const INK = "#FBEBCB", ACC = "#F2B860", LAB = "#F2DDB2";
const HEAD = "Estedad", UI = "Vazirmatn";
const TS = "0 3px 16px rgba(10,6,2,.95), 0 1px 3px rgba(10,6,2,.9)";

const OVER = camAt(49.5, 33.0, 0.6);
const camW = (i: number): Cam => { const [lon, lat, z] = WARS[i].cam; return camAt(lon, lat, z); };
const fly = (a: Cam, b: Cam, k: number): Cam => {
  const e = eio(k);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) * (1 - 0.28 * Math.sin(Math.PI * e)) };
};
const curOf = (t: number) => { let i = -1; for (let j = 0; j < N; j++) if (t >= T0[j]) i = j; return t >= T_END ? N : i; };

function camOf(t: number): Cam {
  if (t < T0[0]) { const z = lerp(0.5, 0.56, cl(t / HOOK)); return { ...OVER, z }; }
  const i = curOf(t);
  if (i >= N) return fly(camW(N - 1), { ...OVER, z: 0.6 }, cl((t - T_END) / 0.9));
  const from = i === 0 ? { ...OVER, z: 0.56 } : camW(i - 1);
  const to = camW(i);
  const k = (t - T0[i]) / FLY;
  if (k < 1) return fly(from, to, k);
  const push = 1 + 0.05 * cl((t - T0[i] - FLY) / WARS[i].dur);
  return { ...to, z: to.z * push };
}
const kOf = (i: number, t: number) => cl((t - T0[i] - 0.42) / (WARS[i].dur - 0.55));

// سال روی صفحه (منفی = پیش از میلاد)
function yearOf(t: number) {
  const i = curOf(t);
  if (i < 0 || i >= N) return null;
  if (i === 0) return WARS[0].year;
  return Math.round(lerp(WARS[i - 1].year, WARS[i].year, eio((t - T0[i]) / FLY)));
}
const yearTxt = (y: number) => (y > 0 ? fa(y) : fa(Math.max(1, -y)));

export const V50: React.FC<{ silent?: boolean; frames?: number[]; mix?: string }> = ({ silent = false, frames, mix = "a" }) => {
  const frame = useCurrentFrame();
  const t = (frames ? frames[frame] ?? 0 : frame) / V50_FPS;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    const cam = camOf(t);
    const S = toScreen(cam);
    const i = curOf(t);
    c.setTransform(1, 0, 0, 1, 0, 0);
    drawBg(c);
    drawRegion(c, cam, t < T0[0] ? 0.6 + 0.4 * Math.sin(t * 2) : t >= T_END ? sm(T_END + 0.6, T_END + 1.4, t) : 0, t);
    iranHalo(c, cam, t < T0[0] ? 1 - sm(T0[0], T0[0] + 0.4, t) : t >= T_END ? sm(T_END + 0.6, T_END + 1.6, t) : 0);
    // رد جنگ‌های گذشته (و در پایان همه، پشت‌سرهم روشن)
    for (let j = 0; j < N; j++) {
      const end = T0[j] + WARS[j].dur;
      if (t < end) continue;
      let a = 0.26 * sm(end, end + 0.35, t);
      if (t >= T_END) a = 0.26 + 0.6 * sm(T_END + 0.7 + j * 0.07, T_END + 1.0 + j * 0.07, t);
      WARS[j].draw({ c, S, k: 1, t, scar: a, z: cam.z });
    }
    // جنگ قبلی (محو) و جنگ فعلی
    if (i > 0 && i < N) {
      const a = 1 - sm(T0[i], T0[i] + 0.25, t);
      if (a > 0.01) { c.save(); c.globalAlpha = a; WARS[i - 1].draw({ c, S, k: 1, t, scar: 0, z: cam.z }); c.restore(); }
    }
    if (i >= 0 && i < N) WARS[i].draw({ c, S, k: kOf(i, t), t, scar: 0, z: cam.z });
    if (i === N) {
      const a = 1 - sm(T_END, T_END + 0.25, t);
      if (a > 0.01) { c.save(); c.globalAlpha = a; WARS[N - 1].draw({ c, S, k: 1, t, scar: 0, z: cam.z }); c.restore(); }
    }
    drawOver(c);
    const out = sm(V50_TOTAL - 0.6, V50_TOTAL, t);
    if (out > 0) { c.fillStyle = `rgba(20,12,6,${0.92 * out})`; c.fillRect(0, 0, W, H); }
  }, [t]);
  const out = 1 - sm(V50_TOTAL - 0.6, V50_TOTAL, t);
  return (
    <AbsoluteFill style={{ background: "#140C06", overflow: "hidden" }}>
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />
      <div style={{ position: "absolute", inset: 0, opacity: out }}>
        <Hook t={t} />
        <WarText t={t} />
        <Tally t={t} />
        <Finale t={t} />
        <Logo t={t} />
      </div>
      {!silent && !frames && <Html5Audio src={staticFile(`v50/mix-${mix}.wav`)} />}
    </AbsoluteFill>
  );
};

const win = (t: number, a: number, b: number, fi = 0.22, fo = 0.14) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));
const pop = (t: number, a: number, amt = 0.12, d = 0.35) => (t >= a ? 1 + amt * (1 - eo((t - a) / d)) : 1);

/* ---------------- هوک ---------------- */
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const a = 1 - sm(T0[0] - 0.15, T0[0] + 0.1, t);
  if (a <= 0.01) return null;
  const b = sm(0.55, 0.85, t);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 200, opacity: a, direction: "rtl", textAlign: "center", fontFamily: HEAD, fontWeight: 900, color: INK, textShadow: TS }}>
      <div style={{ fontSize: 62, lineHeight: 1.25 }}>
        ایران تو <span style={{ display: "inline-block", fontSize: 112, color: ACC, transform: `scale(${pop(t, 0.05, 0.1)})` }}>۲۵۰۰</span> سال
      </div>
      <div style={{ fontSize: 66, lineHeight: 1.3, marginTop: 8, opacity: b, transform: `translateY(${18 * (1 - eo((t - 0.55) / 0.4))}px)` }}>
        <span style={{ color: ACC }}>چندتا</span> جنگ بزرگ دیده؟
      </div>
    </div>
  );
};

/* ---------------- متن هر جنگ ---------------- */
const WarText: React.FC<{ t: number }> = ({ t }) => {
  const i = curOf(t);
  if (i < 0 || i >= N) return null;
  const w = WARS[i], t0 = T0[i], t1 = T0[i] + w.dur;
  const y = yearOf(t)!;
  const aYear = i === 0 ? sm(t0, t0 + 0.2, t) : 1;
  const aYearOut = 1 - sm(T_END - 0.15, T_END + 0.1, t);
  const aName = win(t, t0 + 0.28, t1 + 0.02);
  const aSub = win(t, t0 + 0.42, t1 + 0.02);
  const rolling = i > 0 && t < t0 + FLY;
  const tk = w.ticker ? Math.max(1, Math.round(w.ticker.to * eo(cl((t - t0 - 0.45) / (w.dur * 0.62))))) : 0;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 150, direction: "rtl", textAlign: "center", color: INK, textShadow: TS }}>
      <div style={{ height: 52, opacity: aYear * aYearOut }}>
        <span style={{ display: "inline-block", padding: "4px 22px", borderRadius: 30, border: "1.5px solid rgba(242,184,96,.55)", background: "rgba(30,18,8,.6)", fontFamily: UI, fontWeight: 800, fontSize: 30, color: ACC, transform: `scale(${pop(t, t0 + 0.15, 0.25, 0.3)})` }}>جنگ {fa(i + 1)}</span>
      </div>
      <div style={{ height: 150, opacity: aYear * aYearOut, whiteSpace: "nowrap", filter: rolling ? "blur(1.2px)" : "none" }}>
        <span style={{ display: "inline-block", fontFamily: HEAD, fontWeight: 900, fontSize: 126, lineHeight: 1.2, color: ACC, textShadow: `${TS}, 0 0 30px rgba(242,184,96,.35)`, transform: `scale(${rolling ? 1 : pop(t, t0 + FLY, 0.08, 0.3)})` }}>{yearTxt(y)}</span>
        {y <= 0 && <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 46, marginRight: 16, color: LAB }}>پ.م</span>}
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 56, lineHeight: 1.3, opacity: aName, transform: `translateY(${16 * (1 - eo((t - t0 - 0.28) / 0.3))}px)` }}>{w.name}</div>
      <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 34, lineHeight: 1.5, color: LAB, opacity: aSub, marginTop: 4 }}>{w.sub}</div>
      {w.ticker && (
        <div style={{ marginTop: 12, opacity: aSub }}>
          <span style={{ display: "inline-block", padding: "4px 20px", borderRadius: 26, background: "rgba(216,128,88,.16)", border: "1.5px solid rgba(216,128,88,.6)", fontFamily: UI, fontWeight: 800, fontSize: 32, color: "#E8A27A" }}>{w.ticker.unit} {fa(tk)}</span>
        </div>
      )}
    </div>
  );
};

/* ---------------- شمارش خط‌خطی پایین ---------------- */
const Tally: React.FC<{ t: number }> = ({ t }) => {
  const a = sm(0.9, 1.3, t) * (1 - sm(T_END + 0.2, T_END + 0.6, t));
  if (a <= 0.01) return null;
  const i = curOf(t);
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 1612, display: "flex", justifyContent: "center", gap: 14, direction: "rtl", opacity: a }}>
      {WARS.map((_, j) => {
        const on = sm(T0[j] + 0.15, T0[j] + 0.3, t);
        const now = j === i;
        return (
          <div key={j} style={{
            width: 9, height: now ? 46 : 34, marginTop: now ? 0 : 6, borderRadius: 3,
            background: on > 0.5 ? (now ? "#FFE7B8" : "#E9B460") : "rgba(233,180,96,.18)",
            boxShadow: on > 0.5 ? `0 0 ${now ? 18 : 8}px rgba(242,184,96,${now ? 0.9 : 0.45})` : "none",
          }} />
        );
      })}
    </div>
  );
};

/* ---------------- پایان ---------------- */
const Finale: React.FC<{ t: number }> = ({ t }) => {
  if (t < T_END + 0.2) return null;
  const n = Math.max(1, Math.round(N * eo(cl((t - T_END - 0.6) / 1.3))));
  const a1 = sm(T_END + 0.3, T_END + 0.6, t);
  const a2 = sm(T_END + TM.f2, T_END + TM.f2 + 0.3, t);
  const a3 = sm(T_END + TM.f3, T_END + TM.f3 + 0.35, t);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 170, direction: "rtl", textAlign: "center", color: INK, textShadow: TS, fontFamily: HEAD, fontWeight: 900 }}>
      <div style={{ opacity: a1, whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-block", fontSize: 190, lineHeight: 1.05, color: ACC, transform: `scale(${pop(t, T_END + 1.9, 0.1, 0.4)})`, textShadow: `${TS}, 0 0 50px rgba(242,184,96,.45)` }}>{fa(n)}</span>
        <span style={{ fontSize: 66, marginRight: 22 }}>جنگ بزرگ</span>
      </div>
      <div style={{ fontSize: 52, lineHeight: 1.35, opacity: a2, transform: `translateY(${14 * (1 - eo((t - T_END - TM.f2) / 0.4))}px)` }}>
        از کوروش تا <span style={{ color: ACC }}>امروز</span>
      </div>
      <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 38, lineHeight: 1.5, marginTop: 1040, color: LAB, opacity: a3, transform: `translateY(${14 * (1 - eo((t - T_END - TM.f3) / 0.4))}px)` }}>
        به نظرت کدوم جنگ ایران رو<br /><span style={{ color: ACC, fontFamily: HEAD, fontWeight: 900, fontSize: 46 }}>بیشتر از همه</span> عوض کرد؟
      </div>
    </div>
  );
};

/* ---------------- لوگو ---------------- */
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = 0.6 * (1 - sm(T_END, T_END + 0.4, t));
  if (a <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: 60, top: 96, width: 112, display: "flex", flexDirection: "column", alignItems: "center", opacity: a }}>
      <Img src={staticFile("v50/logo-mark.png")} style={{ width: 90, height: 75, filter: "drop-shadow(0 0 3px rgba(0,0,0,.6))" }} />
      <div style={{ fontFamily: "'Chakra Petch'", fontWeight: 700, fontSize: 22, letterSpacing: 1.2, color: "#fff", marginTop: 2, textShadow: "0 2px 6px rgba(0,0,0,.7)" }}>Agarlogy</div>
    </div>
  );
};
