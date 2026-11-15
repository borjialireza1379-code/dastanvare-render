// v47 · ردپا · «چالش»: چند روز باید گرسنه بمونی تا PS5 و GTA VI بخری؟
// Narration: the user's own ElevenLabs take at 1.25× (public/v47/vo.wav), words aligned → vo.json.
// Look: Radpa yellow/black + a game HUD (fullness bar + wallet), yellow burst / dark dot-grid stages, real free photos.
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { DataCard, EndCard, INK, PAPER, YEL, back, camFor, clamp, eio, eo, fa } from "./kit";
import { BuildingArt, Burst, Card, Check, DotStage, Flag, Food, FoodKind, Hud, LAT, PriceTag, Ps5Art, SlotNumber, SpeedLines, Tape, TeaArt, XStamp, YellowBurst } from "./art";
import { CHUNKS, FPS, FRAMES, VO_END, WORDS, cutAt, lineAt, wt } from "./timing";

export const V47_FPS = FPS;
export const V47_FRAMES = FRAMES;
const W = 1080, H = 1920;
const CAP = 1395;
const VOICE = "v47/vo.wav";
const MIX = "v47/mix-norm.wav"; // final mix (videos/47/build-audio.mjs + tools/doc-mix.mjs); replaces VOICE

const antonH = delayRender("v47 anton");
new FontFace("V47Anton", `url('${staticFile("fonts/Anton-Regular.ttf")}')`)
  .load()
  .then((f) => {
    document.fonts.add(f);
    continueRender(antonH);
  })
  .catch((e) => {
    console.error(e);
    continueRender(antonH);
  });

// ─── media ───
type M = { src: string; w: number; h: number; video?: boolean };
// GTA VI pictures supplied by the user (public/v47/gta/): official cover art + Vice City frames
const MEDIA = {
  key: { src: "v47/gta/logo.jpg", w: 1400, h: 1400 },
  marina: { src: "v47/gta/13.jpg", w: 1130, h: 1200 },
  police: { src: "v47/gta/14.jpg", w: 1290, h: 2119 },
  tower: { src: "v47/gta/15.jpg", w: 1211, h: 2110 },
  palmst: { src: "v47/gta/16.jpg", w: 1221, h: 1939 },
  lane: { src: "v47/gta/17.jpg", w: 1210, h: 2146 },
  police2: { src: "v47/gta/18.jpg", w: 1290, h: 2223 },
  arch: { src: "v47/gta/19.jpg", w: 1215, h: 2003 },
} satisfies Record<string, M>;
// pictures the user makes with GPT (public/v47/gpt/<name>.png); flip to true when a file arrives
const GPT = { ps5: true, skeleton: true, breakfast: true, lunch: true, dinner: true };
const gptSrc = (n: keyof typeof GPT) => `v47/gpt/${n}.jpg`;
/** a picture of unknown size, covering its box */
const Pic: React.FC<{ src: string; fx?: number; fy?: number; z?: number; blend?: boolean; filter?: string }> = ({ src, fx = 0.5, fy = 0.5, z = 1, blend, filter }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%`, mixBlendMode: blend ? "lighten" : undefined, filter }} />
);
/** PS5: the GPT photo if there is one, else the vector */
const Ps5: React.FC<{ w: number; h: number; glow?: number }> = ({ w, h, glow = 1 }) =>
  GPT.ps5 ? (
    <div style={{ position: "relative", width: w, height: h }}><Pic src={gptSrc("ps5")} blend /></div>
  ) : (
    <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center" }}><Ps5Art h={h * 0.92} glow={glow} /></div>
  );
const FOOD_GPT: Record<FoodKind, keyof typeof GPT | null> = { plate: null, breadcheese: "breakfast", egg: "breakfast", rice: "lunch", ricepotato: "lunch", riceegg: "breakfast", bread: "dinner" };
// where each beat looks inside the GPT photo (breakfast: bread left, cheese top, tea top-right, egg bottom-right)
const FOOD_FOCUS: Record<FoodKind, { fx: number; fy: number; z: number }> = {
  plate: { fx: 0.5, fy: 0.5, z: 1 },
  breadcheese: { fx: 0.32, fy: 0.42, z: 1.15 },
  egg: { fx: 0.74, fy: 0.7, z: 1.9 },
  rice: { fx: 0.4, fy: 0.5, z: 1.45 },
  ricepotato: { fx: 0.5, fy: 0.5, z: 1.03 },
  riceegg: { fx: 0.72, fy: 0.66, z: 1.45 },
  bread: { fx: 0.5, fy: 0.5, z: 1.03 },
};
const Dish: React.FC<{ kind: FoodKind; w: number; h: number; z?: number }> = ({ kind, w, h, z = 1 }) => {
  const g = FOOD_GPT[kind];
  const fc = FOOD_FOCUS[kind];
  return g && GPT[g] ? <Pic src={gptSrc(g)} fx={fc.fx} fy={fc.fy} z={fc.z * z} /> : <Food kind={kind} w={w} h={h} />;
};

/** media covering a bw×bh box, centred on (fx, fy), zoom z; videos start at absolute time `at` */
const Fill: React.FC<{ m: M; bw: number; bh: number; fx?: number; fy?: number; z?: number; at?: number; from?: number; filter?: string }> = ({ m, bw, bh, fx = 0.5, fy = 0.5, z = 1, at = 0, from = 0, filter = "contrast(1.06) saturate(1.12)" }) => {
  const c = camFor(bw, bh, m.w, m.h, fx, fy, z);
  const style: React.CSSProperties = { position: "absolute", left: c.x0, top: c.y0, width: m.w * c.s, height: m.h * c.s, maxWidth: "none", filter };
  if (m.video)
    return (
      <Sequence from={Math.round(at * FPS)} layout="none">
        <OffthreadVideo src={staticFile(m.src)} muted startFrom={Math.round(from * FPS)} style={style} />
      </Sequence>
    );
  return <Img src={staticFile(m.src)} style={style} />;
};

const pulse = (t: number, a: number, k = 7) => (t >= a ? Math.exp(-k * (t - a)) : 0);
const shakeXY = (t: number, a: number, amp = 14, k = 7) => {
  const p = pulse(t, a, k);
  return [Math.sin(t * 97) * amp * p, Math.cos(t * 83) * amp * 0.7 * p] as const;
};

// GTA VI card face: the official cover art (user-supplied), centred on the logo
const GtaFace: React.FC<{ bw: number; bh: number; z?: number; fy?: number }> = ({ bw, bh, z = 1, fy = 0.5 }) => (
  <Fill m={MEDIA.key} bw={bw} bh={bh} fx={0.5} fy={fy} z={z} filter="contrast(1.05) saturate(1.12)" />
);
const PINK = "#FF4F9A";
const GTA_GRAD = "linear-gradient(180deg, #FFE36E 0%, #FF9A3C 45%, #FF4F9A 100%)";

// ═════════════════════════ ACT A · hook (line 0) ═════════════════════════
const ActA: React.FC<{ t: number }> = ({ t }) => {
  const L0 = WORDS.filter((w) => w.line === 0);
  const at = (i: number) => L0[i]?.s ?? 0;
  const hungry = at(3), tPs = at(6), tGta = at(8), tBuy = at(10);
  const [sx, sy] = shakeXY(t, hungry, 16, 6);
  const tok = (txt: string, a: number, o: { lat?: boolean; key?: boolean; gta?: boolean; size?: number } = {}) => {
    const k = clamp((t - a) / 0.22);
    const size = o.size ?? 112;
    return (
      <span style={{ display: "inline-block", margin: "0 12px", opacity: k > 0 ? 1 : 0, transform: `translateY(${(1 - back(k, 2.4)) * 40}px) scale(${0.7 + 0.3 * back(k, 2.4)})`, font: o.lat ? `400 ${size * (o.gta ? 1.05 : 0.92)}px/1.15 ${LAT}` : `400 ${size}px/1.2 "RLalezar"`, color: o.gta ? "transparent" : o.key ? INK : "#fff", background: o.gta ? GTA_GRAD : o.key ? YEL : "transparent", WebkitBackgroundClip: o.gta ? "text" : undefined, padding: o.key ? "0 22px 6px" : 0, borderRadius: o.key ? 14 : 0, direction: o.lat ? "ltr" : "rtl", unicodeBidi: "isolate" }}>{txt}</span>
    );
  };
  const kP = eo((t - tPs) / 0.35), kG = eo((t - tGta) / 0.35);
  const fl = Math.sin(t * 2.3) * 8;
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      {/* Vice City street, slow push */}
      <Fill m={MEDIA.palmst} bw={W} bh={H} fx={0.5} fy={0.55} z={1.04 + 0.05 * clamp(t / 4)} filter="contrast(1.08) saturate(1.2)" />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.55) 30%, rgba(10,10,10,0.15) 48%, rgba(10,10,10,0.25) 70%, rgba(10,10,10,0.7) 100%)" }} />
      <SpeedLines t={t} o={0.22 * (pulse(t, tPs, 6) + pulse(t, tGta, 6) + pulse(t, hungry, 6))} cy={960} color={YEL} />
      <div style={{ position: "absolute", left: 30, right: 30, top: 285, direction: "rtl", textAlign: "center", filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.7))" }}>
        <div>{tok("چند", at(0))}{tok("روز", at(1))}{tok("باید", at(2))}{tok("گرسنه", at(3), { key: true })}{tok("بمونی", at(4))}</div>
        <div style={{ marginTop: 6 }}>{tok("تا", at(5))}{tok("PS5", at(6), { lat: true })}{tok("و", at(7))}{tok("GTA VI", at(8), { lat: true, gta: true })}{tok("بخری؟", at(10))}</div>
      </div>
      {/* PS5 card from the right, the GTA VI cover from the left (bigger: the game is the star) */}
      {t >= tPs - 0.02 && (
        <Card x={810 + 700 * (1 - kP)} y={950 + fl} w={340} h={520} rot={7 + 25 * (1 - kP)} radius={30} border={8} style={{ background: "#151515" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, #2C3A55 0%, #0E0E12 70%)" }} />
          <div style={{ position: "absolute", left: 0, top: 10 }}><Ps5 w={324} h={480} glow={0.5 + 0.5 * Math.sin(t * 4)} /></div>
        </Card>
      )}
      {t >= tGta - 0.02 && (
        <>
          <div style={{ position: "absolute", left: 330 - 300, top: 950 - 380, width: 600, height: 760, borderRadius: 60, background: `radial-gradient(ellipse, rgba(255,79,154,${0.55 * kG}) 0%, rgba(255,79,154,0) 70%)` }} />
          <Card x={320 - 760 * (1 - kG)} y={950 - fl} w={480} h={640} rot={-5 - 25 * (1 - kG)} radius={30} border={8} style={{ background: YEL }}>
            <GtaFace bw={464} bh={624} z={1.02 + 0.04 * clamp((t - tGta) / 2)} />
          </Card>
        </>
      )}
      {t >= tGta && (
        <div style={{ position: "absolute", left: 600 - 56, top: 950 - 56, width: 112, height: 112, borderRadius: 56, background: YEL, color: INK, display: "flex", alignItems: "center", justifyContent: "center", font: `400 100px/1 ${LAT}`, transform: `scale(${back((t - tGta - 0.12) / 0.3, 2.4)})`, boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>+</div>
      )}
      <Burst t={t} t0={hungry} x={560} y={820} text="قار و قور!" size={0.95} o={1 - clamp((t - tPs + 0.05) / 0.15)} />
      {t >= tBuy - 0.15 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center", transform: `scale(${back((t - tBuy + 0.15) / 0.3, 2)})` }}>
          <SlotNumber t={t} spinFrom={tBuy - 0.15} land={tBuy + 0.55} text="؟؟؟" size={120} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT B · prices + receipt (lines 1–2) ═════════════════════════
const Receipt: React.FC<{ t: number; t0: number; t216: number }> = ({ t, t0, t216 }) => {
  const HH = 930;
  const h = HH * eo((t - t0 - 0.05) / 0.75);
  const row = (a: number) => ({ opacity: clamp((t - a) / 0.15), transform: `translateX(${(1 - eo((t - a) / 0.3)) * -60}px)` });
  const tot = 216 * eo((t - t216) / 0.55);
  const mark = eio((t - t216 - 0.5) / 0.25);
  const dash = <div style={{ borderTop: `4px dashed rgba(17,17,17,0.35)`, margin: "18px 0" }} />;
  const zig = Array.from({ length: 29 }, (_, i) => `${100 - (i / 28) * 100}% ${i % 2 ? 100 : 97.5}%`).join(", ");
  const bars = Array.from({ length: 46 }, (_, i) => 3 + ((Math.sin(i * 12.3) * 0.5 + 0.5) * 9) | 0);
  return (
    <>
      <div style={{ position: "absolute", left: 140, width: 800, top: 278, height: 30, borderRadius: 15, background: INK, boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", left: 180, width: 720, top: 296, height: h, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: HH, background: PAPER, clipPath: `polygon(0 0, 100% 0, ${zig})`, padding: "34px 48px", direction: "rtl", boxShadow: "inset 0 18px 20px -14px rgba(0,0,0,0.35)" }}>
          <div style={{ textAlign: "center", font: `400 74px/1.1 "RLalezar"`, color: INK }}>رسید خرید</div>
          <div style={{ textAlign: "center", font: `700 26px "RVazir"`, color: "#777" }}>چالش ردپا · بدون تخفیف!</div>
          {dash}
          <div style={{ display: "flex", alignItems: "center", gap: 20, ...row(t0 + 0.3) }}>
            <div style={{ width: 92, height: 112, borderRadius: 12, overflow: "hidden", position: "relative", background: "#1B2233" }}><Ps5 w={92} h={112} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `400 52px/1.1 ${LAT}`, color: INK, direction: "ltr", textAlign: "right" }}>PS5</div>
              <div style={{ font: `800 28px "RVazir"`, color: "#555" }}>اسلیم دیسک‌خور</div>
            </div>
            <div style={{ font: `400 76px/1 "RLalezar"`, color: INK }}>۱۹۵ <span style={{ font: `800 28px "RVazir"` }}>میلیون</span></div>
          </div>
          <div style={{ height: 22 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, ...row(t0 + 0.5) }}>
            <div style={{ width: 92, height: 112, borderRadius: 12, overflow: "hidden", position: "relative" }}><GtaFace bw={92} bh={112} z={1.3} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `400 52px/1.1 ${LAT}`, color: PINK, direction: "ltr", textAlign: "right" }}>GTA VI</div>
              <div style={{ font: `800 28px "RVazir"`, color: "#555" }}>قیمت جهانی</div>
            </div>
            <div style={{ font: `400 76px/1 "RLalezar"`, color: INK }}>۲۱ <span style={{ font: `800 28px "RVazir"` }}>میلیون</span></div>
          </div>
          {dash}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: clamp((t - t216 + 0.15) / 0.12) }}>
            <div style={{ font: `900 46px "RVazir"`, color: INK }}>جمع کل</div>
            <div style={{ position: "relative", textAlign: "center" }}>
              <div style={{ position: "absolute", left: -14, right: -14, top: 52, height: 92, background: YEL, transform: `scaleX(${mark}) rotate(-2deg)`, transformOrigin: "right" }} />
              <div style={{ position: "relative", font: `400 178px/1 "RLalezar"`, color: INK, transform: `scale(${1 + 0.18 * pulse(t, t216 + 0.55, 6)})` }}>{fa(Math.round(tot))}</div>
              <div style={{ position: "relative", font: `900 34px "RVazir"`, color: INK, marginTop: -6 }}>میلیون تومن</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 36, height: 84, direction: "ltr", opacity: 0.85 }}>
            {bars.map((b, i) => <div key={i} style={{ width: b, background: i % 3 === 2 ? "transparent" : INK }} />)}
          </div>
        </div>
      </div>
    </>
  );
};

const ActB: React.FC<{ t: number }> = ({ t }) => {
  const B0 = cutAt(1), c2 = cutAt(2);
  const t195 = wt(1, "۱۹۵"), tGta = wt(1, "GTA"), t21 = wt(1, "۲۱"), tSlim = wt(1, "اسلیم");
  const t216 = wt(2, "۲۱۶");
  const kIn = back((t - B0) / 0.5, 1.3);
  const kS = eio((t - tGta + 0.05) / 0.5);
  const kOut = eio((t - c2 + 0.05) / 0.3);
  const yel = clamp((t - c2) / 0.25);
  const s = (0.75 + 0.25 * kIn) * (1 - 0.28 * kS);
  const cx = 540 + 250 * kS, cy = 700 + Math.sin(t * 1.9) * 7;
  const ry = Math.sin(t * 1.3) * 9;
  const kG = eo((t - tGta) / 0.4);
  const gx = 290 - 820 * (1 - kG);
  const outY = -420 * kOut, outO = 1 - kOut;
  const [sx, sy] = shakeXY(t, t216 + 0.55, 12, 7);
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      {t < c2 + 0.4 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${outY}px)`, opacity: outO }}>
          {/* PS5: hero, then right column */}
          <div style={{ position: "absolute", left: cx - 250 * s, top: cy - 400 * s, width: 500 * s, height: 800 * s, transform: `perspective(1400px) rotateY(${ry}deg)`, opacity: clamp((t - B0) / 0.12) }}>
            <div style={{ position: "absolute", inset: -14 * s, borderRadius: 40 * s, background: "rgba(255,214,10,0.18)", filter: "blur(20px)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 34 * s, overflow: "hidden", border: `${5 * s}px solid ${YEL}`, background: "radial-gradient(circle at 50% 42%, #2C3A55 0%, #10131A 62%, #050505 100%)", boxShadow: "0 40px 90px rgba(0,0,0,0.6)" }}>
              <div style={{ position: "absolute", left: 0, top: 24 * s }}><Ps5 w={500 * s} h={740 * s} glow={0.5 + 0.5 * Math.sin(t * 3)} /></div>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: -30 * s, display: "flex", justifyContent: "center" }}>
              <Tape text="پلی‌استیشن ۵ اسلیم" k={clamp((t - tSlim) / 0.35)} size={40 * s + 4} />
            </div>
          </div>
          <PriceTag t={t} t0={t195 - 0.15} ax={cx} ay={cy + 400 * s} len={36} value={195} unit="میلیون تومن" scale={1 - 0.1 * kS} side={-1} />
          {/* GTA VI: left column, pink glow */}
          {t >= tGta - 0.02 && (
            <>
              <div style={{ position: "absolute", left: gx - 300, top: 700 - 400, width: 600, height: 800, background: `radial-gradient(ellipse, rgba(255,79,154,${0.5 * kG}) 0%, rgba(255,79,154,0) 68%)` }} />
              <Card x={gx} y={700 - Math.sin(t * 1.9) * 7} w={380} h={576} rot={-3 * kG} radius={30} border={6} style={{ border: `5px solid ${YEL}`, padding: 0, background: "#000" }}>
                <GtaFace bw={370} bh={566} z={1.0 + 0.05 * clamp((t - tGta) / 3)} />
              </Card>
              <div style={{ position: "absolute", left: 540 - 50, top: 700 - 50, width: 100, height: 100, borderRadius: 50, background: YEL, color: INK, display: "flex", alignItems: "center", justifyContent: "center", font: `400 92px/1 ${LAT}`, transform: `scale(${back((t - tGta - 0.2) / 0.3, 2.4)})` }}>+</div>
            </>
          )}
          <PriceTag t={t} t0={t21 - 0.15} ax={290} ay={988} len={36} value={21} unit="میلیون تومن" scale={0.9} side={1} />
        </div>
      )}
      {/* line 2: receipt on yellow */}
      {t >= c2 && (
        <AbsoluteFill style={{ opacity: yel, transform: `translate(${sx}px, ${sy}px)` }}>
          <YellowBurst t={t} cy={900} />
          <SpeedLines t={t} o={0.22 * pulse(t, t216 + 0.55, 5)} cy={1000} />
          <Receipt t={t} t0={c2} t216={t216} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT C · three meals (lines 3–5) ═════════════════════════
const ActC: React.FC<{ t: number }> = ({ t }) => {
  const C0 = cutAt(3), c5 = cutAt(5);
  const tThree = wt(3, "سه");
  const fills = [wt(4, "نون", 0), wt(4, "برنج"), wt(4, "نون", 1)];
  const lights = [wt(4, "صبحونه"), wt(4, "ناهار"), wt(4, "شام")];
  const drops: { at: number; kind: FoodKind; rot: number; label: string }[] = [
    { at: C0 + 0.05, kind: "plate", rot: -2, label: "" },
    { at: fills[0] - 0.08, kind: "breadcheese", rot: 3, label: "نون و پنیر" },
    { at: wt(4, "تخم", 0) - 0.08, kind: "egg", rot: -3, label: "یا تخم‌مرغ" },
    { at: fills[1] - 0.08, kind: "rice", rot: 2, label: "برنج" },
    { at: wt(4, "سیب") - 0.08, kind: "ricepotato", rot: -2, label: "و سیب‌زمینی" },
    { at: wt(4, "تخم", 1) - 0.1, kind: "riceegg", rot: 3, label: "یه غذای ساده با تخم‌مرغ" },
    { at: fills[2] - 0.08, kind: "bread", rot: -3, label: "دوباره نون و پنیر" },
  ];
  const kL5 = eio((t - c5) / 0.45);
  const heroO = 1 - kL5;
  // hero stack: last three cards
  const vis = drops.filter((d) => t >= d.at);
  const shown = vis.slice(-3);
  const slotNames = ["صبحونه", "ناهار", "شام"];
  const slotFood: FoodKind[] = ["breadcheese", "ricepotato", "bread"];
  // slot layout: row under the hero, then (line 5) up and smaller
  const sc = 1 - 0.2 * kL5;
  const top = 1030 + (470 - 1030) * kL5;
  const t350 = wt(5, "۳۵۰"), tPut = wt(5, "کنار");
  const noteK = clamp((t - tPut) / 0.65);
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      {/* hero photo stack */}
      {heroO > 0.01 && (
        <div style={{ position: "absolute", inset: 0, opacity: heroO, transform: `translateY(${-500 * kL5}px)` }}>
          {shown.map((d, i) => {
            const k = clamp((t - d.at) / 0.34);
            const y = 680 - 1150 * (1 - back(k, 1.2));
            const depth = shown.length - 1 - i;
            return (
              <Card key={d.at} x={540 + depth * 6} y={y + depth * 4} w={780} h={660} rot={d.rot + 14 * (1 - k)} sc={1 - depth * 0.03} radius={26}>
                <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.05 * clamp((t - d.at) / 3)})` }}>
                  <Dish kind={d.kind} w={760} h={640} />
                </div>
                {d.label === "" && t < drops[1].at && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", font: `400 300px/1 "RLalezar"`, color: INK, opacity: 0.85, transform: `translateY(${Math.sin(t * 5) * 10}px) rotate(${Math.sin(t * 3) * 6}deg) scale(${back((t - tThree) / 0.35, 2)})` }}>؟</div>
                )}
              </Card>
            );
          })}
          {shown.length > 0 && shown[shown.length - 1].label && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 326, display: "flex", justifyContent: "center" }}>
              <Tape key={shown[shown.length - 1].at} text={shown[shown.length - 1].label} k={clamp((t - shown[shown.length - 1].at - 0.18) / 0.3)} size={44} />
            </div>
          )}
        </div>
      )}
      {/* three meal slots */}
      {slotNames.map((name, i) => {
        const x0 = [850, 540, 230][i];
        const x = 540 + (x0 - 540) * sc;
        const k = back((t - tThree - i * 0.09) / 0.35, 2);
        if (t < tThree - 0.01) return null;
        const filled = t >= fills[i];
        const fk = clamp((t - fills[i]) / 0.3);
        const lit = t >= lights[i] - 0.05 && t < fills[i] + 0.4 && t < c5;
        const glow = lit ? 0.5 + 0.5 * Math.abs(Math.sin(t * 8)) : 0;
        const w = 280 * sc, h = 270 * sc;
        return (
          <div key={name} style={{ position: "absolute", left: x - w / 2, top, width: w, height: h, transform: `scale(${k})`, borderRadius: 26 * sc, background: "#191919", border: `${5 * sc}px ${filled ? "solid" : "dashed"} ${filled || lit ? YEL : "#555"}`, boxShadow: lit ? `0 0 ${40 * glow}px rgba(255,214,10,${0.7 * glow})` : "0 16px 40px rgba(0,0,0,0.5)", overflow: "hidden", direction: "rtl" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 56 * sc, background: filled || lit ? YEL : "#2A2A2A", color: filled || lit ? INK : "#bbb", font: `900 ${32 * sc}px/${56 * sc}px "RVazir"`, textAlign: "center", zIndex: 2 }}>{name}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 56 * sc, bottom: 0 }}>
              {filled ? (
                <div style={{ position: "absolute", inset: 0, transform: `scale(${0.6 + 0.4 * back(fk, 2)})`, opacity: clamp(fk * 4) }}>
                  <Dish kind={slotFood[i]} w={w - 10 * sc} h={h - 66 * sc} z={1.1} />
                </div>
              ) : (
                <div style={{ textAlign: "center", font: `400 ${110 * sc}px/${(h - 66 * sc) * 1.05}px "RLalezar"`, color: "#4A4A4A" }}>؟</div>
              )}
            </div>
            {filled && <div style={{ position: "absolute", left: 8, bottom: 8, zIndex: 3 }}><Check size={52 * sc} k={clamp((t - fills[i] - 0.15) / 0.35)} /></div>}
          </div>
        );
      })}
      {/* line 5: plus signs, equals, daily cost card, a note flying to the wallet */}
      {t >= c5 && (
        <>
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "absolute", left: [695, 385][i] - 26, top: 470 + 216 / 2 - 34, width: 52, height: 52, font: `400 64px/52px ${LAT}`, color: YEL, textAlign: "center", opacity: kL5 }}>+</div>
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", font: `400 96px/1 ${LAT}`, color: YEL, opacity: clamp((t - c5 - 0.35) / 0.2), transform: `rotate(90deg)` }}>‖</div>
          <DataCard t={t} t0={t350 - 0.45} label="خرج غذای هر روز" value={350} unit="هزار تومن" top={800} dur={0.8} />
          {t >= tPut && noteK < 1 && (
            <div style={{ position: "absolute", left: 540 + (250 - 540) * eio(noteK) - 90, top: 930 + (196 - 930) * eio(noteK) - 300 * Math.sin(Math.PI * noteK) - 48, width: 180, height: 96, transform: `rotate(${-20 + 380 * noteK}deg) scale(${1 - 0.6 * noteK})`, background: YEL, border: `5px solid ${INK}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", font: `400 54px "RLalezar"`, color: INK, boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>۳۵۰</div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT D · 620 days, plate, skeleton (lines 6–7) ═════════════════════════
const FILL_A = () => wt(6, "باید") - 0.55;
const FILL_B = () => wt(6, "چیزی") - 0.02;
const fillP = (t: number) => eio((t - FILL_A()) / (FILL_B() - FILL_A()));

const ActD: React.FC<{ t: number }> = ({ t }) => {
  const D0 = cutAt(6), c7 = cutAt(7);
  const tNo0 = wt(6, "چیزی") - 0.04, tNo1 = wt(6, "تا") - 0.06;
  const tPs = wt(6, "PS5"), tGta = wt(6, "GTA"), tOk = wt(6, "جور");
  const p = fillP(t);
  const days = Math.round(620 * p);
  const gridIn = clamp((t - D0) / 0.6);
  const x0 = (W - (25 * 34 - 6)) / 2, y0 = 470;
  if (t >= c7) {
    // ── line 7: «WASTED» (GTA's death screen, as a joke): grey Vice City or the GPT skeleton ──
    const gray = clamp((t - c7) / 0.35);
    const tYear = wt(7, "سال"), tEight = wt(7, "هشت");
    const segW = (900 - 19 * 6) / 20;
    const wk = clamp((t - c7 - 0.25) / 0.3);
    const wTop = GPT.skeleton ? 300 : 800, tapeTop = GPT.skeleton ? 1150 : 1060;
    return (
      <AbsoluteFill>
        {GPT.skeleton ? (
          <Pic src={gptSrc("skeleton")} fx={0.47} fy={0.4} z={1.02 + 0.06 * clamp((t - c7) / 2)} filter={`grayscale(${0.85 * gray}) contrast(1.1) brightness(${1.15 - 0.2 * gray})`} />
        ) : (
          <Fill m={MEDIA.lane} bw={W} bh={H} fx={0.5} fy={0.5} z={1.06 + 0.08 * clamp((t - c7) / 2)} filter={`grayscale(${gray}) contrast(1.15) brightness(${1 - 0.25 * gray})`} />
        )}
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.25 * gray})` }} />
        {/* the banner */}
        <div style={{ position: "absolute", left: 0, right: 0, top: wTop, height: 230, background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,${0.7 * wk}) 20%, rgba(0,0,0,${0.7 * wk}) 80%, rgba(0,0,0,0) 100%)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: wTop + 12, textAlign: "center", font: `400 190px/1.05 ${LAT}`, letterSpacing: 6, color: "#D7263D", opacity: wk, transform: `scale(${1.25 - 0.25 * eo(wk)})`, textShadow: "0 0 3px #000, 0 6px 24px rgba(0,0,0,0.8)" }}>WASTED</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: tapeTop, display: "flex", justifyContent: "center" }}>
          <Tape text="تو، بعد از ۶۲۰ روز گرسنگی" k={clamp((t - c7 - 0.55) / 0.35)} size={46} />
        </div>
        {/* 12 + 8 months */}
        <div style={{ position: "absolute", left: 90, width: 900, top: 1250, height: 64, display: "flex", gap: 6, direction: "rtl" }}>
          {Array.from({ length: 20 }, (_, i) => {
            const a = i < 12 ? tYear - 0.2 + i * 0.025 : tEight - 0.15 + (i - 12) * 0.03;
            const f = clamp((t - a) / 0.12);
            return <div key={i} style={{ width: segW, height: 64, borderRadius: 8, background: f > 0.5 ? YEL : "rgba(255,255,255,0.18)", transform: `scaleY(${0.7 + 0.3 * back(f, 2)})` }} />;
          })}
          <div style={{ position: "absolute", right: 0, width: 12 * segW + 11 * 6, top: 0, height: 64, display: "flex", alignItems: "center", justifyContent: "center", font: `900 36px "RVazir"`, color: INK, opacity: clamp((t - tYear) / 0.2) }}>۱ سال</div>
          <div style={{ position: "absolute", left: 0, width: 8 * segW + 7 * 6, top: 0, height: 64, display: "flex", alignItems: "center", justifyContent: "center", font: `900 36px "RVazir"`, color: INK, opacity: clamp((t - tEight - 0.1) / 0.2) }}>۸ ماه</div>
        </div>
      </AbsoluteFill>
    );
  }
  const plate = t >= tNo0 && t < tNo1;
  const prodK = (a: number) => back((t - a) / 0.35, 2.2);
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      {/* day counter */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 262, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 22, direction: "rtl", opacity: gridIn }}>
        <div style={{ font: `400 96px/1 "RLalezar"`, color: "#fff" }}>روز</div>
        <div style={{ font: `400 156px/1 "RLalezar"`, color: YEL, minWidth: 250, textAlign: "center", transform: `scale(${1 + 0.15 * pulse(t, FILL_B(), 6)})` }}>{fa(days)}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 418, textAlign: "center", direction: "rtl", font: `800 30px "RVazir"`, color: "#aaa", opacity: gridIn }}>هر خونه = یک روز بدون غذا</div>
      {/* 620 days grid */}
      {Array.from({ length: 625 }, (_, k) => {
        const r = Math.floor(k / 25), c = 24 - (k % 25);
        const on = k < days;
        const just = on && k > days - 25;
        const appear = clamp((t - D0 - (r * 0.012 + (24 - c) * 0.004)) / 0.2);
        if (k >= 620) return null;
        return <div key={k} style={{ position: "absolute", left: x0 + c * 34, top: y0 + r * 34, width: 28, height: 28, borderRadius: 7, background: on ? (just ? "#FFF3A6" : YEL) : "#262626", border: on ? "none" : "2px solid #3A3A3A", opacity: appear, transform: `scale(${0.4 + 0.6 * appear})` }} />;
      })}
      {/* PS5 + GTA VI → done */}
      {t >= tPs - 0.05 && !plate && (
        <div style={{ position: "absolute", left: 140, width: 800, top: 720, height: 360, borderRadius: 34, background: "rgba(12,12,12,0.9)", border: `5px solid ${YEL}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `scale(${prodK(tPs - 0.05)})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
          <div style={{ width: 200, height: 270, borderRadius: 18, overflow: "hidden", position: "relative", background: "radial-gradient(circle at 50% 42%, #2C3A55 0%, #0E0E12 70%)" }}><Ps5 w={200} h={260} /></div>
          <div style={{ font: `400 90px/1 ${LAT}`, color: YEL, opacity: clamp((t - tGta) / 0.1) }}>+</div>
          <div style={{ width: 230, height: 300, borderRadius: 18, overflow: "hidden", position: "relative", transform: `scale(${prodK(tGta - 0.05)})`, boxShadow: `0 0 50px rgba(255,79,154,0.6)` }}><GtaFace bw={230} bh={300} z={1.1} /></div>
          {t >= tOk && <div style={{ position: "absolute", left: -40, top: -50 }}><Check size={150} k={clamp((t - tOk) / 0.4)} /></div>}
        </div>
      )}
      {/* GTA-style «mission passed» */}
      {t >= tOk && !plate && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1110, textAlign: "center", direction: "rtl", opacity: clamp((t - tOk) / 0.12) }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: -6, height: 128, background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 18%, rgba(0,0,0,0.85) 82%, rgba(0,0,0,0) 100%)" }} />
          <div style={{ position: "relative", display: "inline-block", font: `400 92px/1.2 "RLalezar"`, color: YEL, transform: `scale(${back((t - tOk) / 0.35, 2.2)})`, textShadow: "0 0 4px #000, 0 6px 22px rgba(0,0,0,0.9)" }}>ماموریت انجام شد!</div>
        </div>
      )}
      {/* «چیزی نخوری»: the empty plate */}
      {plate && (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #3A3027 0%, #17120E 75%)" }}>
          <div style={{ position: "absolute", left: 0, top: 400, width: W, height: 900, transform: `scale(${1.0 + 0.08 * clamp((t - tNo0) / 0.8)})` }}>
            <Food kind="plate" w={W} h={900} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
            <Tape text="۶۲۰ روز، ۰ وعده" k={clamp((t - tNo0) / 0.25)} size={64} dark />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT E · base salary, conditions (line 8) ═════════════════════════
const Slip: React.FC<{ w: number; h: number; n?: number; big?: boolean }> = ({ w, h, n, big }) => (
  <div style={{ width: w, height: h, background: PAPER, borderRadius: big ? 14 : 8, boxShadow: "0 14px 30px rgba(0,0,0,0.45)", padding: big ? "22px 34px" : "10px 12px", direction: "rtl", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: big ? 16 : 7, background: YEL }} />
    {big ? (
      <>
        <div style={{ font: `400 60px/1.15 "RLalezar"`, color: INK }}>فیش حقوقی</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, font: `800 34px "RVazir"`, color: INK }}>
          <span>حقوق پایه</span>
          <span style={{ display: "inline-block", width: 220, height: 30, borderRadius: 6, background: "#D9D4C2" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, font: `800 30px "RVazir"`, color: "#777" }}>
          <span>پس‌انداز این ماه</span>
          <span style={{ font: `900 34px "RVazir"`, color: INK }}>همه‌اش!</span>
        </div>
      </>
    ) : (
      <>
        <div style={{ font: `900 22px "RVazir"`, color: INK }}>ماه {fa(n ?? 0)}</div>
        {[0, 1, 2].map((i) => <div key={i} style={{ height: 8, borderRadius: 4, background: "#D9D4C2", marginTop: 10, width: `${90 - i * 18}%` }} />)}
      </>
    )}
  </div>
);

const Bill: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ width: w, height: h, background: PAPER, direction: "rtl", padding: "26px 26px", position: "relative" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="54" height="54" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill={YEL} /><path d="M22 6 L11 22 h8 l-2 12 l12 -17 h-8 Z" fill={INK} /></svg>
      <div style={{ font: `400 52px/1.1 "RLalezar"`, color: INK }}>قبض برق</div>
    </div>
    {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 12, borderRadius: 6, background: "#D9D4C2", marginTop: 22, width: `${92 - i * 14}%` }} />)}
    <div style={{ marginTop: 28, font: `800 26px "RVazir"`, color: "#666" }}>مبلغ قابل پرداخت</div>
    <div style={{ height: 34, width: "70%", borderRadius: 6, background: INK, marginTop: 8 }} />
    <div style={{ position: "absolute", left: 26, right: 26, bottom: 26, height: 54, display: "flex", gap: 3, direction: "ltr" }}>
      {Array.from({ length: 34 }, (_, i) => <div key={i} style={{ width: 2 + (((Math.sin(i * 7.7) * 0.5 + 0.5) * 6) | 0), background: i % 4 === 3 ? "transparent" : INK }} />)}
    </div>
  </div>
);

const ActE: React.FC<{ t: number }> = ({ t }) => {
  const E0 = cutAt(8);
  const tSal = wt(8, "حقوق"), t13 = wt(8, "۱۳"), tCond = wt(8, "البته") - 0.1;
  const tRent = wt(8, "اجاره"), tBill = wt(8, "قبض"), tTea = wt(8, "چایی");
  const out1 = eio((t - tCond) / 0.35);
  const big = back((t - E0) / 0.45, 1.6);
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      {out1 < 1 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out1, transform: `translateY(${-300 * out1}px) scale(${1 - 0.1 * out1})` }}>
          <div style={{ position: "absolute", left: 230, top: 300 + 600 * (1 - big), transform: `rotate(-2deg)` }}>
            <Slip w={620} h={320} big />
          </div>
          {Array.from({ length: 13 }, (_, i) => {
            const a = tSal + 0.25 + (i * (t13 - tSal - 0.1)) / 13;
            const k = back((t - a) / 0.3, 2);
            const row = i < 7 ? 0 : 1, col = i < 7 ? i : i - 7;
            const x = 1080 - 95 - col * 130 - (row ? 65 : 0);
            if (t < a) return null;
            return (
              <div key={i} style={{ position: "absolute", left: x - 58, top: 700 + row * 170, transform: `rotate(${Math.sin(i * 3.1) * 7}deg) scale(${k})` }}>
                <Slip w={116} h={140} n={i + 1} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18, direction: "rtl", opacity: clamp((t - t13) / 0.1), transform: `scale(${back((t - t13) / 0.35, 2.2)})` }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: -16, right: -16, top: 50, bottom: 10, background: YEL, transform: "rotate(-2deg)" }} />
              <div style={{ position: "relative", font: `400 170px/1 "RLalezar"`, color: INK, padding: "0 10px" }}>۱۳</div>
            </div>
            <div style={{ font: `400 110px/1 "RLalezar"`, color: "#fff" }}>ماه</div>
          </div>
        </div>
      )}
      {t >= tCond && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
            <Tape text="به شرطی که…" k={clamp((t - tCond) / 0.35)} size={58} />
          </div>
          {[
            { a: tRent, x: 880, label: "نه اجاره", el: <BuildingArt w={280} h={420} /> },
            { a: tBill, x: 540, label: "نه قبض", el: <Bill w={280} h={420} /> },
            { a: tTea, x: 200, label: "نه حتی چایی!", el: <TeaArt w={280} h={420} /> },
          ].map(({ a, x, label, el }, i) => {
            if (t < a - 0.12) return null;
            const k = clamp((t - a + 0.12) / 0.32);
            return (
              <React.Fragment key={i}>
                <Card x={x} y={820 - 900 * (1 - back(k, 1.3))} w={300} h={440} rot={[-4, 2, 5][i] + 18 * (1 - k)} radius={22}>
                  {el}
                  <XStamp t={t} t0={a + 0.32} size={230} />
                </Card>
                <div style={{ position: "absolute", left: x - 200, width: 400, top: 1080, display: "flex", justifyContent: "center" }}>
                  <Tape text={label} k={clamp((t - a - 0.05) / 0.3)} size={40} dark rot={[-3, 2, -2][i]} />
                </div>
              </React.Fragment>
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT F · «حالا قسمت جالب ماجرا» (line 9) ═════════════════════════
const ActF: React.FC<{ t: number }> = ({ t }) => {
  const F0 = cutAt(9);
  const L9 = WORDS.filter((w) => w.line === 9);
  const at = (i: number) => L9[i]?.s ?? F0;
  const [sx, sy] = shakeXY(t, at(2), 18, 6);
  const gl = t - F0 < 0.18 ? ((Math.floor(t * 60) % 2) * 2 - 1) * 26 : 0;
  const pop = (a: number) => ({ opacity: clamp((t - a) / 0.08), transform: `scale(${back((t - a) / 0.3, 2.6)})`, display: "inline-block" });
  return (
    <AbsoluteFill style={{ transform: `translate(${sx + gl}px, ${sy}px) skewX(${gl * 0.2}deg)` }}>
      <YellowBurst t={t * 3} cy={900} />
      <SpeedLines t={t} o={0.16 + 0.15 * pulse(t, at(2), 5)} cy={900} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", direction: "rtl" }}>
        <div style={{ ...pop(at(0)), font: `900 78px "RVazir"`, color: INK }}>حالا</div>
        <div />
        <div style={{ ...pop(at(1)), font: `400 210px/1.15 "RLalezar"`, color: INK }}>قسمت</div>
        <div />
        <div style={{ ...pop(at(2)), font: `400 230px/1.1 "RLalezar"`, color: YEL, background: INK, padding: "0 40px 20px", borderRadius: 26, transform: `${pop(at(2)).transform} rotate(-3deg)` }}>جالب</div>
        <div />
        <div style={{ ...pop(at(3)), font: `400 150px/1.3 "RLalezar"`, color: INK }}>ماجرا</div>
      </div>
      {/* flags peeking in: what's next */}
      {(["us", "de", "tr"] as const).map((c, i) => {
        const k = eo((t - at(3) - 0.1 - i * 0.08) / 0.3);
        return (
          <div key={c} style={{ position: "absolute", left: [690, 440, 190][i], top: 1240 + 400 * (1 - k), transform: `rotate(${[-8, 3, 9][i]}deg)` }}>
            <Flag c={c} w={200} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT G · countries (lines 10–11) ═════════════════════════
const ActG: React.FC<{ t: number }> = ({ t }) => {
  const G0 = cutAt(10);
  const iA = wt(10, "لازمه") + 0.15;
  const z0 = iA + 0.45, z1 = iA + 1.4;
  const S0 = 15, S1 = 1.12;
  const S = Math.exp(Math.log(S0) + (Math.log(S1) - Math.log(S0)) * eio((t - z0) / (z1 - z0)));
  const rows: { c: "us" | "de" | "tr" | "ir"; name: string; d: number; a: number; b: number }[] = [
    { c: "us", name: "آمریکا", d: 12, a: wt(10, "آمریکا"), b: wt(10, "۱۲") + 0.35 },
    { c: "de", name: "آلمان", d: 16, a: wt(10, "آلمان"), b: wt(10, "۱۶") + 0.35 },
    { c: "tr", name: "ترکیه", d: 44, a: wt(10, "ترکیه"), b: wt(10, "۴۴") + 0.35 },
    { c: "ir", name: "ایران", d: 620, a: iA, b: iA + 0.6 },
  ];
  const [sx, sy] = shakeXY(t, iA + 0.1, 16, 5);
  const RX = 870;
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <DotStage t={t} />
      <SpeedLines t={t} o={0.14 * pulse(t, iA + 0.1, 3)} cx={0} cy={1170} color={YEL} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 282, textAlign: "center", opacity: clamp((t - G0 - 0.05) / 0.2), transform: `translateY(${(1 - eo((t - G0) / 0.4)) * -40}px)` }}>
        <div style={{ font: `400 92px/1.1 ${LAT}`, color: YEL, direction: "ltr" }}>PS5 + <span style={{ background: GTA_GRAD, WebkitBackgroundClip: "text", color: "transparent" }}>GTA VI</span></div>
        <div style={{ font: `400 72px/1.25 "RLalezar"`, color: "#fff", direction: "rtl" }}>با پول غذای چند روز؟</div>
      </div>
      {rows.map((r, i) => {
        if (t < r.a - 0.2) return null;
        const cy = [600, 790, 980, 1170][i];
        const kIn = eo((t - r.a + 0.2) / 0.35);
        const d = r.d * eo((t - r.a) / (r.b - r.a));
        const wpx = d * S;
        const ir = r.c === "ir";
        const lblRight = RX - wpx - 18;
        const inside = lblRight < 250;
        return (
          <React.Fragment key={r.c}>
            <div style={{ position: "absolute", left: 900 + 300 * (1 - kIn), top: cy - 62, width: 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Flag c={r.c} w={136} />
              <div style={{ font: `900 32px "RVazir"`, color: ir ? YEL : "#fff", direction: "rtl" }}>{r.name}</div>
            </div>
            <div style={{ position: "absolute", left: RX - wpx, top: cy - 40, width: wpx, height: 80, borderRadius: "14px 6px 6px 14px", background: ir ? `repeating-linear-gradient(135deg, ${YEL} 0 26px, #F0C400 26px 52px)` : YEL, boxShadow: ir ? "0 0 40px rgba(255,214,10,0.45)" : "0 8px 20px rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", top: cy - 44, ...(inside ? { left: Math.max(36, RX - wpx + 20) } : { right: W - lblRight }), direction: "rtl", font: `400 76px/1.15 "RLalezar"`, color: inside ? INK : "#fff", whiteSpace: "nowrap", opacity: clamp((t - r.a) / 0.15) }}>
              {fa(Math.round(d))} روز
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ═════════════════════════ ACT H · the question (line 12) + end card ═════════════════════════
const ActH: React.FC<{ t: number }> = ({ t }) => {
  const H0 = cutAt(12);
  const chips = ["۰ روز", "۷ روز", "۳۰ روز", "۶۲۰ روز!"];
  const kK = back((t - H0 - 0.05) / 0.5, 1.5);
  return (
    <AbsoluteFill>
      <Fill m={MEDIA.police2} bw={W} bh={H} fx={0.5} fy={0.5} z={1.05 + 0.06 * clamp((t - H0) / 4)} filter="contrast(1.08) saturate(1.2) brightness(0.8)" />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 28%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.2) 62%, rgba(0,0,0,0.65) 76%, rgba(0,0,0,0.8) 100%)" }} />
      {/* the game itself, big */}
      <div style={{ position: "absolute", left: 540 - 380, top: 960 - 330, width: 760, height: 660, background: "radial-gradient(ellipse, rgba(255,79,154,0.55) 0%, rgba(255,79,154,0) 68%)", opacity: clamp((t - H0) / 0.3) }} />
      <Card x={540} y={960 + 700 * (1 - kK)} w={520} h={520} rot={-3 + 1.5 * Math.sin(t * 2)} sc={1 + 0.02 * Math.sin(t * 5)} radius={30} border={8} style={{ background: YEL }}>
        <GtaFace bw={504} bh={504} z={1.0 + 0.05 * clamp((t - H0) / 3)} />
      </Card>
      <div style={{ position: "absolute", left: 90, right: 90, top: 290, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22, direction: "rtl" }}>
        {chips.map((c, i) => {
          const a = H0 + 0.25 + i * 0.22;
          const last = i === 3;
          return (
            <div key={c} style={{ width: 400, textAlign: "center", padding: "10px 0 18px", borderRadius: 20, background: last ? YEL : "rgba(20,20,20,0.85)", border: `4px solid ${YEL}`, color: last ? INK : "#fff", font: `400 66px/1.1 "RLalezar"`, opacity: clamp((t - a) / 0.1), transform: `scale(${back((t - a) / 0.3, 2.2)}) rotate(${last ? -3 : 0}deg)` }}>{c}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1250, display: "flex", justifyContent: "center" }}>
        <Tape text="جوابت رو کامنت کن" k={clamp((t - H0 - 1.3) / 0.35)} size={46} />
      </div>
    </AbsoluteFill>
  );
};

// ─── captions ───
const Cap: React.FC<{ t: number; words: { w: string; at: number; key: boolean; latin: boolean }[]; o: number; light: boolean }> = ({ t, words, o, light }) => (
  <div style={{ position: "absolute", left: 50, right: 50, top: CAP, direction: "rtl", textAlign: "center", font: `900 64px/1.45 "RVazir"`, opacity: o }}>
    {words.map(({ w, at, key, latin }, i) => {
      const k = clamp((t - at) / 0.16);
      const fg = key ? (light ? YEL : INK) : light ? INK : "#fff";
      const bg = key && k > 0 ? (light ? INK : YEL) : "transparent";
      return (
        <span key={i} style={{ display: "inline-block", margin: key ? "0 18px 0 22px" : "0 0 0 16px", padding: key ? "0 14px 8px" : 0, background: bg, color: fg, opacity: k > 0 ? 0.35 + 0.65 * k : 0, transform: `scale(${k > 0 ? 0.75 + 0.25 * back(k, 2.4) : 0.75}) rotate(${key ? -2 : 0}deg)`, textShadow: key || light ? "none" : "0 4px 18px rgba(0,0,0,0.8)", direction: latin ? "ltr" : "rtl", unicodeBidi: "isolate" }}>{w}</span>
      );
    })}
  </div>
);

// ─── acts + transitions ───
type Mode = "zoom" | "whipL" | "whipU" | "whipR" | "drop";
const ACTS: { s: () => number; C: React.FC<{ t: number }>; mode: Mode }[] = [
  { s: () => 0, C: ActA, mode: "zoom" },
  { s: () => cutAt(1), C: ActB, mode: "zoom" },
  { s: () => cutAt(3), C: ActC, mode: "whipL" },
  { s: () => cutAt(6), C: ActD, mode: "whipU" },
  { s: () => cutAt(8), C: ActE, mode: "zoom" },
  { s: () => cutAt(9), C: ActF, mode: "whipR" },
  { s: () => cutAt(10), C: ActG, mode: "whipL" },
  { s: () => cutAt(12), C: ActH, mode: "drop" },
];
const LIGHT_LINES = new Set([2]); // captions sit on yellow → dark text
const NO_CAP = new Set([0, 9]); // the title is the caption

const Frame: React.FC<{ t: number; silent: boolean }> = ({ t, silent }) => {
  let ai = 0;
  for (let i = ACTS.length - 1; i >= 0; i--) if (t >= ACTS[i].s()) { ai = i; break; }
  const act = ACTS[ai];
  const a = act.s();
  const next = ai + 1 < ACTS.length ? ACTS[ai + 1] : null;
  const nA = next ? next.s() : 1e9;
  const kOut = clamp((t - (nA - 0.12)) / 0.12);
  const kIn = ai > 0 ? 1 - clamp((t - a) / 0.16) : 0;
  const outMode = next?.mode ?? "zoom", inMode = act.mode;
  const mv = (m: Mode, k: number, dir: 1 | -1) => {
    if (m === "whipL") return `translateX(${dir * -340 * k}px)`;
    if (m === "whipR") return `translateX(${dir * 340 * k}px)`;
    if (m === "whipU") return `translateY(${dir * -380 * k}px)`;
    if (m === "drop") return `translateY(${dir * 300 * k}px) scale(${1 + 0.1 * k})`;
    return `scale(${1 + (dir > 0 ? 0.28 : -0.12) * k})`;
  };
  const tf = kOut > 0 ? mv(outMode, kOut, 1) : kIn > 0 ? mv(inMode, kIn, -1) : "none";
  const blur = (kOut + kIn) * 14;
  const li = lineAt(t);
  const cap = CHUNKS.find((c) => t >= c.a && t < c.b);
  const endT = VO_END + 0.35;
  // HUD state
  const t216 = wt(2, "۲۱۶"), noteLand = wt(5, "کنار") + 0.65, tOk = wt(6, "جور");
  const p = fillP(t);
  const full = t < FILL_A() ? 1 : 1 - 0.97 * p;
  const money = t < noteLand ? 0 : 350000 + (216e6 - 350000) * p;
  const goal = t >= t216 ? 216e6 : 0;
  const done = clamp((t - tOk) / 0.4);
  const hudO = clamp((t - 0.1) / 0.3) * (1 - clamp((t - endT) / 0.2));
  return (
    <AbsoluteFill style={{ background: "#0B0B0B", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: tf, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        <act.C t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: 0.22 * Math.max(0, 1 - Math.abs(t - a) / 0.06) * (ai > 0 ? 1 : 0), pointerEvents: "none" }} />
      <Hud t={t} o={hudO} full={full} money={money} goal={goal} done={done} />
      {cap && !NO_CAP.has(cap.line) && <Cap t={t} words={cap.words} o={clamp((cap.b - t) / 0.12)} light={LIGHT_LINES.has(li)} />}
      <EndCard t={t} t0={endT} tagline="چالش بعدی رو تو بگو!" />
      {!silent && <Audio src={staticFile(MIX || VOICE)} />}
    </AbsoluteFill>
  );
};

export const V47: React.FC<{ silent?: boolean }> = ({ silent = false }) => {
  const f = useCurrentFrame();
  return <Frame t={f / FPS} silent={silent} />;
};

/** stills for checking */
export const V47_LOOK = [0.2, 1.1, 2.2, 3.5, 5.6, 7.6, 9.8, 11.6, 13.2, 14.8, 17.2, 20.2, 23.2, 26.4, 30.4, 32.8, 35.2, 36.5, 37.6, 39.8, 41.2, 41.9, 44.2, 46.6, 49.4, 50.9, 51.5, 55.2, 59.6, 61.2, 61.9, 63.6, 66.4];
export const V47Look: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Freeze frame={Math.round((V47_LOOK[f] ?? 0) * FPS)}>
      <V47 silent />
    </Freeze>
  );
};
