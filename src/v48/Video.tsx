// v48 · ردپا · «چالش»: ۵ دروغی که ایرانیا هر روز میگن!
// Narration: the user's own ElevenLabs take at 1.25× (public/v48/vo.wav), words aligned → vo.json.
// Look: Radpa yellow/black + a lie-detector HUD (polygraph + 0/5 counter). Each lie = quote bubble → the reality → red «دروغ!» stamp.
// Pictures: only 3 GPT photos from the user (public/v48/gpt/); everything else is drawn in code.
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, staticFile, useCurrentFrame } from "remotion";
import { EndCard, INK, Stage, YEL, back, clamp, eio, eo, fa } from "./kit";
import { DotStage, PriceTag, SpeedLines, Tape, YellowBurst } from "./art";
import { BankSms, BedroomArt, Bubble, BurgerArt, CalPage, ChatPhone, Crumbs, DeliveryCard, FullChip, Hand, LieBadge, LieHud, LieStamp, Msg, NavCard, ShopArt } from "./parts";
import { CHUNKS, FPS, FRAMES, LINE_AT, VO_END, WORDS, cutAt, lineAt, stampAt, wi, wt } from "./timing";

export const V48_FPS = FPS;
export const V48_FRAMES = FRAMES;
const W = 1080, H = 1920;
const CAP = 1395;
const VOICE = "v48/vo.wav";
const MIX = "v48/mix-norm.wav"; // final mix (videos/48/build-audio.mjs + tools/doc-mix.mjs); replaces VOICE

// pictures the user makes with GPT (public/v48/gpt/<name>.jpg); flip to true when a file arrives
const GPT = { blanket: true, shopkeeper: true, burger: false }; // burger: the user kept the code-drawn one
const gptSrc = (n: keyof typeof GPT) => `v48/gpt/${n}.jpg`;
const Pic: React.FC<{ src: string; fx?: number; fy?: number; z?: number; filter?: string }> = ({ src, fx = 0.5, fy = 0.5, z = 1, filter }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%`, filter }} />
);

const pulse = (t: number, a: number, k = 7) => (t >= a ? Math.exp(-k * (t - a)) : 0);
const shakeXY = (t: number, a: number, amp = 14, k = 7) => {
  const p = pulse(t, a, k);
  return [Math.sin(t * 97) * amp * p, Math.cos(t * 83) * amp * 0.7 * p] as const;
};
/** words of a line as bubble words (quotes «» dropped) */
const lineWords = (line: number) => WORDS.filter((w) => w.line === line).map((w) => ({ w: w.w.replace(/[«»]/g, ""), at: w.s }));

/** hand-drawn ring + tape label around something in a photo */
const Ring: React.FC<{ t: number; t0: number; x: number; y: number; rx: number; ry: number; label: string; lx: number; ly: number }> = ({ t, t0, x, y, rx, ry, label, lx, ly }) => {
  if (t < t0) return null;
  const L = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))) * 1.08;
  const k = eio((t - t0) / 0.45);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={YEL} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${L} ${L}`} strokeDashoffset={L * (1 - k)} transform={`rotate(-8 ${x} ${y})`} style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" }} />
      </svg>
      <div style={{ position: "absolute", left: lx, top: ly }}>
        <Tape text={label} k={clamp((t - t0 - 0.25) / 0.35)} size={46} rot={-4} />
      </div>
    </>
  );
};

// ═════════════════════════ hook (line 0) ═════════════════════════
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const at = (i: number) => wi(0, i);
  const t5 = at(0) - 0.5; // already landing on frame 0 (no empty first frame)
  const k5 = back((t - t5) / 0.42, 2.2);
  const [sx, sy] = shakeXY(t, t5 + 0.14, 18, 6);
  const tok = (txt: string, a: number, key = false) => {
    const k = clamp((t - a) / 0.2);
    return (
      <span style={{ display: "inline-block", margin: "0 12px", opacity: k > 0 ? 1 : 0, transform: `translateY(${(1 - back(k, 2.4)) * 40}px) scale(${0.7 + 0.3 * back(k, 2.4)})`, font: `400 112px/1.22 "RLalezar"`, color: key ? YEL : INK, background: key ? INK : "transparent", padding: key ? "0 24px 8px" : 0, borderRadius: key ? 16 : 0, transformOrigin: "50% 80%" }}>{txt}</span>
    );
  };
  const bubbles = [
    { text: "تو راهم!", x: 225, y: 770, a: at(1) + 0.05, rot: -6, down: true },
    { text: "قابل نداره!", x: 850, y: 720, a: at(2) + 0.12, rot: 5, down: true },
    { text: "یه روز بریم بیرون!", x: 280, y: 1250, a: at(3) + 0.12, rot: 4, down: false },
    { text: "نه بابا، سیرم!", x: 820, y: 1290, a: at(4) + 0.05, rot: -5, down: false },
    { text: "از فردا شروع می‌کنم!", x: 540, y: 1450, a: at(5) + 0.05, rot: -2, down: false },
  ];
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <YellowBurst t={t} cy={1000} />
      <SpeedLines t={t} o={0.3 * pulse(t, t5 + 0.1, 5)} cy={1000} />
      {/* the big ۵ */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", font: `400 640px/1 "RLalezar"`, color: INK, opacity: clamp((t - t5) / 0.06), transform: `scale(${k5}) rotate(${-6 + 2 * Math.sin(t * 2.4)}deg)`, textShadow: "14px 16px 0 rgba(0,0,0,0.16)" }}>{fa(5)}</div>
      {/* title */}
      <div style={{ position: "absolute", left: 20, right: 20, top: 290, direction: "rtl", textAlign: "center" }}>
        <div>{tok("دروغی", at(1), true)}{tok("که", at(2))}{tok("ایرانیا", at(3))}</div>
        <div style={{ marginTop: 4 }}>{tok("هر", at(4))}{tok("روز", at(5))}{tok("میگن!", at(6))}</div>
      </div>
      {/* the five lies, as a preview */}
      {bubbles.map((b, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, transform: `translateY(${7 * Math.sin(t * 2.6 + i * 1.7)}px)` }}>
          <Bubble t={t} words={[{ w: b.text, at: b.a }]} x={b.x} y={b.y - 60} maxW={560} size={52} theme="white" rot={b.rot} tail={i % 2 ? 0.3 : 0.7} tailDown={b.down} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ═════════════════════════ lie 1 · «تو راهم!» (line 1): the chat ═════════════════════════
const Q1: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(1);
  const k = eo((t - A) / 0.3);
  const msgs: Msg[] = [
    { kind: "sep", text: "دیروز", at: -10, h: 70 },
    { kind: "in", name: "رضا", text: "فردا ساعت ۸، دیر نکنید!", at: -10, time: "۲۲:۱۰" },
    { kind: "out", text: "حتماً، سر وقت میام!", at: -10, time: "۲۲:۱۱" },
    { kind: "sep", text: "امروز", at: -10, h: 70 },
    { kind: "in", name: "رضا", text: "کجایی پس؟! همه رسیدن", at: -10, time: "۲۰:۴۷" },
    { kind: "in", name: "سارا", text: "زود باش دیگه!", at: A + 0.04, time: "۲۰:۴۸" },
    { kind: "out", text: "", big: true, words: lineWords(1), at: wi(1, 0) - 0.06, time: "۲۰:۴۸", h: 150 },
  ];
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - k) * 1000}px) rotate(${(1 - k) * 6 + 0.6 * Math.sin(t * 1.5)}deg)` }}>
        <ChatPhone t={t} top={410} w={860} h={980} title="مهمونی امشب" sub="۱۲ عضو · سارا در حال نوشتن…" msgs={msgs} avatar="م" />
      </div>
      <LieBadge t={t} t0={A} n={1} />
    </AbsoluteFill>
  );
};

// ═════════════════════════ lie 1 · the reality (line 2): under the blanket ═════════════════════════
const R1: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(2);
  const z = 1.04 + 0.08 * eio((t - A) / 3.8);
  const tEta = wt(2, "دو") - 0.12;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "55% 51%" }}>
        {GPT.blanket ? <Pic src={gptSrc("blanket")} filter="contrast(1.08) saturate(1.1) brightness(1.08)" /> : <BedroomArt t={t} />}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 26%, rgba(0,0,0,0) 45%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.7) 84%, rgba(0,0,0,0.85) 100%)" }} />
      {/* the phone glow under the duvet (photo: phone at ≈ 600, 990) */}
      {GPT.blanket && <div style={{ position: "absolute", left: 600 - 260, top: 990 - 260, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(190,220,255,0.28) 0%, rgba(190,220,255,0) 65%)", opacity: 0.7 + 0.3 * Math.sin(t * 5), mixBlendMode: "screen" }} />}
      {GPT.blanket ? (
        <Ring t={t} t0={wt(2, "پتوئه") - 0.05} x={610} y={950} rx={300} ry={200} label="موقعیت فعلی" lx={60} ly={690} />
      ) : (
        <Ring t={t} t0={wt(2, "پتوئه") - 0.05} x={560} y={1110} rx={330} ry={210} label="موقعیت فعلی" lx={90} ly={830} />
      )}
      <NavCard t={t} t0={tEta} y={400} />
      <LieStamp t={t} t0={stampAt(1)} x={300} y={525} size={0.82} />
      <LieBadge t={t} t0={cutAt(1)} n={1} />
    </AbsoluteFill>
  );
};

// ═════════════════════════ lie 2 · «قابل نداره!» (lines 3–4): the shop, then the loan ═════════════════════════
const Shop: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(3);
  const tFaghat = wt(4, "فقط"), tTag = wt(4, "آخرش") - 0.05, tSms = wt(4, "قسط") - 0.22;
  const dim = eio((t - tFaghat) / 0.5);
  const z = 1 + 0.04 * eio((t - A) / 2) + 0.1 * dim;
  const [sx, sy] = shakeXY(t, wi(3, 0) + 0.05, 10, 8);
  const P = GPT.shopkeeper;
  // photo: his head starts at y≈425 → shifted down so the bubble fits above it (head top ≈ 526), text stays off his face
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${z})`, transformOrigin: "50% 30%", filter: dim > 0.01 ? `brightness(${1 - 0.5 * dim}) blur(${6 * dim}px)` : undefined }}>
        {P ? (
          <AbsoluteFill style={{ transform: "translateY(80px) scale(1.05)", transformOrigin: "50% 0%" }}>
            <Pic src={gptSrc("shopkeeper")} filter="contrast(1.06) saturate(1.12)" />
          </AbsoluteFill>
        ) : (
          <ShopArt t={t} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 14%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 64%, rgba(0,0,0,0.65) 82%, rgba(0,0,0,0.85) 100%)" }} />
      {P ? (
        <Bubble t={t} words={lineWords(3)} x={360} y={292} maxW={620} size={88} theme="yel" tail={0.75} rot={-3} wob={2.5} o={1 - 0.6 * dim} />
      ) : (
        <Bubble t={t} words={lineWords(3)} x={540} y={400} size={118} theme="yel" tail={0.62} rot={-3} wob={2.5} o={1 - 0.6 * dim} />
      )}
      {/* «آره» → the fine print (left of his head, over the hanging bags) */}
      {t >= wt(4, "آره") && (
        <div style={{ position: "absolute", left: P ? 34 : 150, top: P ? 540 : 640, transform: `rotate(-4deg) scale(${back((t - wt(4, "آره")) / 0.3, 2)})`, opacity: clamp((t - wt(4, "آره")) / 0.08) * (1 - 0.6 * dim), background: "#fff", color: INK, font: `800 34px/1.45 "RVazir"`, padding: "4px 20px 10px", direction: "rtl", boxShadow: "0 8px 20px rgba(0,0,0,0.4)", textAlign: "center" }}>
          {P ? <>* شرایط و اقساط<br />اعمال می‌شود</> : "* شرایط و اقساط اعمال می‌شود"}
        </div>
      )}
      <PriceTag t={t} t0={tTag} ax={P ? 880 : 810} ay={600} value={48} unit="میلیون تومن" len={110} side={-1} o={1 - clamp((t - tSms) / 0.2)} />
      <BankSms t={t} t0={tSms} y={760} />
      <LieStamp t={t} t0={stampAt(2)} x={330} y={1060} size={0.85} rot={-9} />
      <LieBadge t={t} t0={A} n={2} />
    </AbsoluteFill>
  );
};

// ═════════════════════════ lie 3 · «یه روز حتماً بریم بیرون!» (lines 5–6): the same message since childhood ═════════════════════════
const YEARS = ["۱۳۸۲", "۱۳۸۸", "۱۳۹۴", "۱۴۰۰"];
const NAMES = ["علی", "مریم", "رضا", "سارا"];
const REPLIES = ["حتماً!", "پایه‌ام!", "قطعاً!", "آره حتماً!"];
const Chat3: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(5);
  const k = eo((t - A) / 0.3);
  const history: Msg[] = YEARS.flatMap((y, i) => [
    { kind: "sep", text: y, at: -10, h: 74 },
    { kind: "out", text: "یه روز حتماً بریم بیرون!", at: -10, time: "۱۸:۰۵" },
    { kind: "in", name: NAMES[i], text: REPLIES[i], at: -10, time: "۱۸:۰۶" },
  ] as Msg[]);
  const msgs: Msg[] = [
    ...history,
    { kind: "sep", text: "امروز", at: -10, h: 74 },
    { kind: "out", text: "", big: true, words: lineWords(5), at: wi(5, 0) - 0.06, time: "۲۱:۱۰", h: 140 },
    { kind: "in", name: "علی", text: "حتماً!", at: wt(5, "بیرون") + 0.08, time: "۲۱:۱۰" },
    { kind: "in", name: "مریم", text: "پایه‌ام!", at: wt(5, "بیرون") + 0.36, time: "۲۱:۱۱" },
  ];
  // scroll back in time: «این "یه روز" رو از بچگی داریم می‌شنویم»
  const s0 = wi(6, 0) - 0.05, s1 = wt(6, "بچگی") + 0.1;
  const sp = eio((t - s0) / (s1 - s0));
  const SCROLL = 1290;
  const yearIdx = Math.min(YEARS.length, Math.floor(sp * (YEARS.length + 0.999)));
  const yearShown = sp <= 0 ? "" : ["۱۴۰۵", ...[...YEARS].reverse()][Math.min(4, yearIdx)];
  // date picker: «هنوز تاریخش مشخص نشده!»
  const tPick = wt(6, "هنوز") - 0.15;
  const kp = eo((t - tPick) / 0.35);
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - k) * -1000}px) rotate(${(1 - k) * -6 - 0.5 * Math.sin(t * 1.4)}deg)` }}>
        <ChatPhone t={t} top={410} w={860} h={980} title="رفقای مدرسه" sub="۸ عضو" msgs={msgs} scroll={SCROLL * sp} avatar="ر">
          {/* the year we have scrolled back to */}
          {sp > 0.02 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 14, direction: "rtl", opacity: clamp(sp * 8) * (1 - kp) }}>
              <div style={{ background: YEL, color: INK, font: `400 74px/1.1 "RLalezar"`, padding: "4px 34px 10px", borderRadius: 22, boxShadow: "0 12px 30px rgba(0,0,0,0.5)", transform: `scale(${1 + 0.12 * pulse(t, s0 + (s1 - s0) * (yearIdx / 5), 10)})` }}>{yearShown}</div>
              {sp >= 0.98 && <div style={{ alignSelf: "center" }}><Tape text="کلاس سوم دبستان" k={clamp((t - s1) / 0.3)} dark size={36} rot={4} /></div>}
            </div>
          )}
          {/* date picker sheet */}
          {t >= tPick - 0.02 && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 560, transform: `translateY(${(1 - kp) * 600}px)`, background: "#1B1E25", borderRadius: "40px 40px 0 0", boxShadow: "0 -20px 50px rgba(0,0,0,0.55)", direction: "rtl", padding: "26px 40px" }}>
              <div style={{ width: 90, height: 10, borderRadius: 5, background: "#3A3E48", margin: "0 auto 18px" }} />
              <div style={{ font: `400 64px/1.2 "RLalezar"`, color: "#fff", textAlign: "center" }}>تاریخ قرار؟</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 20 }}>
                {["روز", "ماه", "سال"].map((lab, c) => {
                  const off = ((t * (7 + c * 3)) % 1) * 90;
                  return (
                    <div key={lab} style={{ textAlign: "center" }}>
                      <div style={{ position: "relative", width: c === 2 ? 220 : 160, height: 270, borderRadius: 24, background: "#0F1115", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, right: 0, top: -90 + off, filter: "blur(2.5px)", opacity: 0.55 }}>
                          {Array.from({ length: 5 }, (_, i) => <div key={i} style={{ height: 90, font: `400 60px/90px "RLalezar"`, color: "#fff" }}>{(((Math.floor(t * (7 + c * 3)) + i * 7 + c * 3) % (c === 2 ? 90 : 12)) + (c === 2 ? 1400 : 1)).toLocaleString("fa-IR", { useGrouping: false })}</div>)}
                        </div>
                        <div style={{ position: "absolute", left: 8, right: 8, top: 90, height: 90, borderRadius: 16, border: `4px solid ${YEL}`, background: "rgba(15,17,21,0.75)", display: "flex", alignItems: "center", justifyContent: "center", font: `400 76px/1 "RLalezar"`, color: YEL, paddingTop: 8, boxSizing: "border-box", transform: `scale(${1 + 0.06 * Math.sin(t * 9 + c)})` }}>؟</div>
                      </div>
                      <div style={{ font: `800 28px "RVazir"`, color: "#9AA0AA", marginTop: 10 }}>{lab}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChatPhone>
      </div>
      <LieStamp t={t} t0={stampAt(3)} x={560} y={1120} size={0.95} rot={-10} text="تعیین نشده!" />
      <LieBadge t={t} t0={A} n={3} />
    </AbsoluteFill>
  );
};

// ═════════════════════════ lie 4 · «نه بابا، من سیرم!» (lines 7–8): the burger disappears, a new order ═════════════════════════
// bites in box units (0–1), each a big circle with a scalloped rim; times from the words
const BITES = () => [
  { x: 0.92, y: 0.5, r: 0.13, at: wt(8, "گاز") + 0.1 },
  { x: 0.83, y: 0.36, r: 0.13, at: wt(8, "بزنم") + 0.05 },
  { x: 0.82, y: 0.63, r: 0.14, at: wt(8, "بزنم") + 0.3 },
  { x: 0.68, y: 0.47, r: 0.17, at: wt(8, "آخرش") + 0.13 },
  { x: 0.55, y: 0.38, r: 0.16, at: wt(8, "آخرش") + 0.33 },
  { x: 0.52, y: 0.62, r: 0.17, at: wt(8, "باید") + 0.05 },
];
const biteMask = (t: number, S: number) => {
  const layers: string[] = [];
  BITES().forEach((b, bi) => {
    if (t < b.at) return;
    const g = eo((t - b.at) / 0.07);
    const add = (cx: number, cy: number, r: number) => layers.push(`radial-gradient(circle ${(r * g).toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, transparent ${(r * g - 0.5).toFixed(1)}px, #000 ${(r * g + 0.5).toFixed(1)}px)`);
    const cx = b.x * S, cy = b.y * S, r = b.r * S;
    add(cx, cy, r);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (0.55 + (i / 5) * 0.9) + bi;
      add(cx + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98, r * 0.24);
    }
  });
  return layers;
};
const Burger: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(7);
  const S = 760;
  const tOrder = wt(8, "سفارش") - 0.3;
  const mv = eio((t - tOrder) / 0.45);
  const cy = 930 - 250 * mv, sc = 1 - 0.3 * mv;
  const kin = back((t - A) / 0.4, 1.6);
  const layers = biteMask(t, S);
  const maskStyle: React.CSSProperties = layers.length ? { maskImage: layers.join(", "), maskComposite: "intersect", maskRepeat: "no-repeat" } : {};
  const lastBite = BITES().filter((b) => t >= b.at).pop();
  const [bx, by] = lastBite ? shakeXY(t, lastBite.at, 12, 10) : [0, 0];
  return (
    <AbsoluteFill>
      <DotStage t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(255,170,60,0.28) 0%, rgba(255,170,60,0) 55%)" }} />
      <div style={{ position: "absolute", left: 540 - S / 2 + bx, top: cy - S / 2 + by, width: S, height: S, transform: `scale(${sc * kin}) rotate(${1.5 * Math.sin(t * 2)}deg)` }}>
        <div style={{ position: "absolute", inset: 0, ...maskStyle }}>
          {GPT.burger ? <Pic src={gptSrc("burger")} filter="contrast(1.06) saturate(1.15)" /> : <BurgerArt s={S} />}
        </div>
        {BITES().map((b, i) => <Crumbs key={i} t={t} t0={b.at} x={b.x * S} y={b.y * S} seed={i + 3} />)}
      </div>
      <Bubble t={t} words={lineWords(7)} x={540} y={395} size={92} theme="white" tail={0.35} rot={-3} wob={2} o={1 - clamp((t - cutAt(8)) / 0.3)} />
      <FullChip t={t} t0={wt(7, "سیرم")} x={50} y={286} o={1 - clamp((t - cutAt(8)) / 0.3)} />
      {/* «فقط یه گاز» tag */}
      {t >= wt(8, "فقط") && t < tOrder + 0.2 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", opacity: 1 - clamp((t - tOrder) / 0.2) }}>
          <Tape text={t < wt(8, "آخرش") ? "فقط یه گاز!" : "…و یه گاز دیگه!"} k={clamp((t - wt(8, "فقط")) / 0.3)} size={58} rot={-3} />
        </div>
      )}
      <DeliveryCard t={t} t0={tOrder} tPress={wt(8, "سفارش") + 0.15} tDone={wt(8, "جدید")} y={1000} />
      {t >= tOrder + 0.2 && <Hand x={560 + 60 * (1 - eo((t - tOrder - 0.2) / 0.35))} y={1270 + 120 * (1 - eo((t - tOrder - 0.2) / 0.35))} press={pulse(t, wt(8, "سفارش") + 0.15, 9)} o={clamp((t - tOrder - 0.2) / 0.1) * (1 - clamp((t - wt(8, "جدید") - 0.3) / 0.2))} />}
      <LieStamp t={t} t0={stampAt(4)} x={560} y={1180} size={0.95} rot={-8} />
      <LieBadge t={t} t0={A} n={4} />
    </AbsoluteFill>
  );
};

// ═════════════════════════ lie 5 · «از فردا شروع می‌کنم!» (lines 9–10): tomorrow refuses ═════════════════════════
const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(9);
  const PW = 520, PH = 600, CX = 600, TOP = 650;
  const kin = back((t - A) / 0.45, 1.8);
  const tTear = wt(10, "انقدر") - 0.1, tAngry = wt(10, "فردا"), tNo = wt(10, "حاضر"), tSign = wt(10, "همکاری") - 0.1;
  const N = 9;
  const angry = eo((t - tAngry) / 0.25);
  const shake = t > tAngry ? 9 * Math.sin((t - tAngry) * 26) * Math.exp(-1.6 * Math.max(0, t - tNo)) : 0;
  const count = Math.round(1 + 998 * eio((t - tTear) / (tAngry - tTear)));
  const signK = t >= tSign ? 1 : 0;
  const swing = t >= tSign ? 28 * Math.exp(-3 * (t - tSign)) * Math.cos(9 * (t - tSign)) : 0;
  return (
    <AbsoluteFill>
      <YellowBurst t={t} cx={CX} cy={TOP + 300} />
      <SpeedLines t={t} o={0.25 * pulse(t, tAngry, 5)} cx={CX} cy={TOP + 300} />
      {/* to-do sticky */}
      <div style={{ position: "absolute", left: 40, top: 1010, width: 300, transform: `rotate(-7deg) translateX(${(1 - eo((t - A - 0.2) / 0.35)) * -420}px)`, background: INK, borderRadius: 18, padding: "18px 24px 22px", boxShadow: "0 16px 34px rgba(0,0,0,0.35)", direction: "rtl" }}>
        <div style={{ font: `400 40px "RLalezar"`, color: YEL, marginBottom: 6 }}>برنامه‌ی فردا</div>
        {["رژیم", "باشگاه", "زبان انگلیسی"].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, font: `800 32px/1.6 "RVazir"`, color: "#fff" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, border: `4px solid ${YEL}` }} />{s}
          </div>
        ))}
      </div>
      {/* the calendar on its stand */}
      <div style={{ position: "absolute", left: CX - PW / 2, top: TOP, width: PW, height: PH + 70, transform: `scale(${kin}) rotate(${-3 + shake + 0.8 * Math.sin(t * 2)}deg)`, transformOrigin: "50% 100%" }}>
        <div style={{ position: "absolute", left: -30, right: -30, bottom: 0, height: 90, background: INK, borderRadius: "0 0 26px 26px", clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, boxShadow: "0 24px 50px rgba(0,0,0,0.35)", borderRadius: 18 }}>
          <CalPage w={PW} h={PH} eyes={angry} brow={angry} look={Math.sin(t * 3) * angry} sub={angry > 0.5 ? "" : "شروع رژیم و باشگاه"} />
        </div>
        {/* pages flying off: every one says «فردا» */}
        {Array.from({ length: N }, (_, i) => {
          const ts = tTear + i * ((tAngry - tTear - 0.1) / N);
          const u = t - ts;
          if (u > 0.6) return null;
          const on = u < 0 ? 0 : 1;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: 0, opacity: u < 0 ? (i === 0 ? 1 : 0) : 1 - clamp((u - 0.3) / 0.3), transform: on ? `translate(${(i % 2 ? 1 : -1) * 1300 * u}px, ${-320 * u + 1500 * u * u}px) rotate(${(i % 2 ? 1 : -1) * 80 * u}deg)` : undefined, transformOrigin: "50% 0%" }}>
              {(u >= 0 || i === 0) && t >= tTear - 2 && <CalPage w={PW} h={PH} sub="شروع رژیم و باشگاه" />}
            </div>
          );
        })}
        {/* rings */}
        {[0.3, 0.7].map((f) => <div key={f} style={{ position: "absolute", left: PW * f - 16, top: -26, width: 32, height: 56, borderRadius: 16, border: `7px solid #333`, background: "transparent" }} />)}
        {/* «تعطیله!» sign swinging on the page */}
        {signK > 0 && (
          <div style={{ position: "absolute", left: PW / 2 - 200, top: PH * 0.97, width: 400, transform: `rotate(${swing - 4}deg) scale(${back((t - tSign) / 0.25, 2)})`, transformOrigin: "50% -60px" }}>
            <svg width="400" height="70" style={{ position: "absolute", top: -64, left: 0 }}><path d="M90 66 L200 4 L310 66" fill="none" stroke="#333" strokeWidth="6" /><circle cx="200" cy="6" r="9" fill="#333" /></svg>
            <div style={{ background: INK, color: YEL, border: `6px solid ${YEL}`, borderRadius: 18, font: `400 82px/1.15 "RLalezar"`, textAlign: "center", padding: "0 0 10px", direction: "rtl", boxShadow: "0 16px 30px rgba(0,0,0,0.4)" }}>تعطیله!</div>
          </div>
        )}
      </div>
      {/* how many times we said it */}
      {t >= tTear && (
        <div style={{ position: "absolute", left: 700, top: 560, transform: `rotate(6deg) scale(${back((t - tTear) / 0.3, 2) * (1 + 0.1 * pulse(t, tAngry, 8))})`, background: INK, color: "#fff", borderRadius: 22, padding: "6px 26px 12px", direction: "rtl", boxShadow: "0 12px 26px rgba(0,0,0,0.35)" }}>
          <span style={{ font: `800 30px "RVazir"`, color: "#bbb" }}>گفتیم: </span>
          <span style={{ font: `400 64px "RLalezar"`, color: YEL }}>{count >= 999 ? "۹۹۹+" : fa(count)}</span>
          <span style={{ font: `800 30px "RVazir"`, color: "#bbb" }}> بار</span>
        </div>
      )}
      <Bubble t={t} words={lineWords(9)} x={540} y={390} size={90} theme="ink" tail={0.6} rot={-2} wob={2} o={1 - clamp((t - cutAt(10)) / 0.3)} />
      <LieStamp t={t} t0={stampAt(5)} x={CX} y={TOP + 260} size={1} rot={-12} />
      <LieBadge t={t} t0={A} n={5} />
    </AbsoluteFill>
  );
};

// ═════════════════════════ the poll (lines 11–12) ═════════════════════════
const POLL = ["تو راهم!", "قابل نداره!", "یه روز حتماً بریم بیرون!", "نه بابا، من سیرم!", "از فردا شروع می‌کنم!"];
const Poll: React.FC<{ t: number }> = ({ t }) => {
  const A = cutAt(11);
  const RH = 118, G = 12, TOP = 330, HEAD = 110;
  const kc = back((t - A) / 0.4, 1.6);
  const t6 = wt(12, "دروغ") - 0.1, tType = wt(12, "اضافه");
  const rowY = (i: number) => TOP + HEAD + i * (RH + G);
  // the hand can't decide: hovers 1 → 3 → 2 → 5 → 4, then goes to the empty sixth row
  const stops = [
    { at: A + 0.55, r: 0 }, { at: A + 0.85, r: 2 }, { at: A + 1.1, r: 1 }, { at: A + 1.35, r: 4 }, { at: A + 1.6, r: 3 }, { at: t6 + 0.35, r: 5 },
  ];
  let hy = rowY(0) + RH / 2;
  for (let i = 0; i < stops.length; i++) {
    const prev = i ? rowY(stops[i - 1].r) + RH / 2 : rowY(0) + RH / 2 + 200;
    if (t >= stops[i].at - 0.22) hy = prev + (rowY(stops[i].r) + RH / 2 - prev) * eio((t - stops[i].at + 0.22) / 0.22);
  }
  const caret = Math.floor(t * 3) % 2 === 0;
  const typed = clamp((t - tType) / 0.5);
  return (
    <AbsoluteFill>
      <Stage t={t} o={0.16} />
      <div style={{ position: "absolute", left: 80, top: TOP, width: 920, transform: `translateY(${(1 - kc) * 900}px)`, borderRadius: 36, background: "#151515", border: `4px solid ${YEL}`, boxShadow: "0 30px 70px rgba(0,0,0,0.55)", padding: "0 0 14px", direction: "rtl" }}>
        <div style={{ height: HEAD, display: "flex", alignItems: "center", gap: 16, padding: "0 34px" }}>
          <svg width="52" height="52" viewBox="0 0 48 48"><rect x="6" y="26" width="8" height="16" rx="2" fill={YEL} /><rect x="20" y="14" width="8" height="28" rx="2" fill={YEL} /><rect x="34" y="20" width="8" height="22" rx="2" fill={YEL} /></svg>
          <span style={{ font: `400 58px/1 "RLalezar"`, color: "#fff", paddingTop: 6 }}>نظرسنجی</span>
          <span style={{ marginRight: "auto", font: `700 28px "RVazir"`, color: "#888" }}>دروغ محبوب تو؟</span>
        </div>
      </div>
      {POLL.map((p, i) => {
        const a = A + 0.18 + i * 0.09;
        const k = back((t - a) / 0.3, 1.8);
        return (
          <div key={i} style={{ position: "absolute", left: 110, top: rowY(i) + (1 - kc) * 900, width: 860, height: RH, display: "flex", alignItems: "center", gap: 20, padding: "0 22px", boxSizing: "border-box", direction: "rtl", borderRadius: 24, background: Math.abs(hy - (rowY(i) + RH / 2)) < 30 ? "#2A2A2A" : "#1E1E1E", transform: `translateX(${(1 - k) * 300}px)`, opacity: clamp((t - a) / 0.1) }}>
            <div style={{ width: 74, height: 74, borderRadius: 37, background: YEL, color: INK, display: "flex", alignItems: "center", justifyContent: "center", font: `400 54px/1 "RLalezar"`, paddingTop: 6, boxSizing: "border-box", flexShrink: 0 }}>{fa(i + 1)}</div>
            <div style={{ flex: 1, font: `400 54px/1.2 "RLalezar"`, color: "#fff", whiteSpace: "nowrap" }}>{p}</div>
            <div style={{ width: 46, height: 46, borderRadius: 23, border: "5px solid #666" }} />
          </div>
        );
      })}
      {/* the sixth: yours */}
      {t >= t6 && (
        <div style={{ position: "absolute", left: 110, top: rowY(5) + (1 - kc) * 900, width: 860, height: RH, display: "flex", alignItems: "center", gap: 20, padding: "0 22px", boxSizing: "border-box", direction: "rtl", borderRadius: 24, border: `5px dashed ${YEL}`, background: "rgba(255,214,10,0.08)", transform: `scale(${back((t - t6) / 0.35, 2.2)})` }}>
          <div style={{ width: 74, height: 74, borderRadius: 37, background: INK, border: `4px solid ${YEL}`, color: YEL, display: "flex", alignItems: "center", justifyContent: "center", font: `400 54px/1 "RLalezar"`, paddingTop: 6, boxSizing: "border-box", flexShrink: 0 }}>{fa(6)}</div>
          <div style={{ flex: 1, font: `400 54px/1.2 "RLalezar"`, color: typed > 0 ? YEL : "#777", whiteSpace: "nowrap" }}>
            {typed > 0 ? "…".repeat(Math.max(1, Math.ceil(typed * 3))) : "دروغ ششم؟"}
            <span style={{ color: YEL, opacity: caret ? 1 : 0 }}>|</span>
          </div>
        </div>
      )}
      <Hand x={250} y={hy - 10} press={pulse(t, tType, 9)} o={clamp((t - A - 0.4) / 0.15)} />
      <div style={{ position: "absolute", left: 0, right: 0, top: rowY(6) + 24, display: "flex", justifyContent: "center" }}>
        <Tape text="تو کامنت بنویس" k={clamp((t - t6 - 0.4) / 0.35)} size={50} />
      </div>
    </AbsoluteFill>
  );
};

// ─── captions ───
const Cap: React.FC<{ t: number; words: { w: string; at: number; key: boolean }[]; o: number; light: boolean }> = ({ t, words, o, light }) => (
  <div style={{ position: "absolute", left: 50, right: 50, top: CAP, direction: "rtl", textAlign: "center", font: `900 64px/1.45 "RVazir"`, opacity: o }}>
    {words.map(({ w, at, key }, i) => {
      const k = clamp((t - at) / 0.16);
      const fg = key ? (light ? YEL : INK) : light ? INK : "#fff";
      const bg = key && k > 0 ? (light ? INK : YEL) : "transparent";
      return (
        <span key={i} style={{ display: "inline-block", margin: key ? "0 18px 0 22px" : "0 0 0 16px", padding: key ? "0 14px 8px" : 0, background: bg, color: fg, opacity: k > 0 ? 0.35 + 0.65 * k : 0, transform: `scale(${k > 0 ? 0.75 + 0.25 * back(k, 2.4) : 0.75}) rotate(${key ? -2 : 0}deg)`, textShadow: key || light ? "none" : "0 4px 18px rgba(0,0,0,0.8)" }}>{w}</span>
      );
    })}
  </div>
);

// ─── acts + transitions ───
type Mode = "zoom" | "whipL" | "whipU" | "whipR" | "drop";
const ACTS: { s: () => number; C: React.FC<{ t: number }>; mode: Mode }[] = [
  { s: () => 0, C: Hook, mode: "zoom" },
  { s: () => cutAt(1), C: Q1, mode: "drop" },
  { s: () => cutAt(2), C: R1, mode: "whipL" },
  { s: () => cutAt(3), C: Shop, mode: "zoom" },
  { s: () => cutAt(5), C: Chat3, mode: "whipU" },
  { s: () => cutAt(7), C: Burger, mode: "whipR" },
  { s: () => cutAt(9), C: Calendar, mode: "drop" },
  { s: () => cutAt(11), C: Poll, mode: "zoom" },
];
const LIGHT_LINES = new Set([10]); // captions sit on yellow → dark text
const NO_CAP = new Set([0, 1, 3, 5, 7, 9]); // the title / the quote bubble is the caption

// the lie detector: wild in the hook, alarm while a lie is being said, a jolt on each stamp
const QUOTES = [1, 3, 5, 7, 9];
const env = (tt: number) => {
  let e = 0;
  if (tt > 0.2 && tt < 2.9) e = 0.5 * clamp((tt - 0.2) / 0.3) * clamp((2.9 - tt) / 0.3);
  for (const i of QUOTES) e = Math.max(e, clamp((tt - LINE_AT[i].s + 0.05) / 0.15) * clamp((LINE_AT[i].e + 0.45 - tt) / 0.3));
  for (let n = 1; n <= 5; n++) e = Math.max(e, 0.9 * Math.exp(-Math.pow((tt - stampAt(n)) / 0.22, 2)));
  return e;
};
const STAMPS = [1, 2, 3, 4, 5].map(stampAt);

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
  // every stamp shakes the whole frame a little
  let sx = 0, sy = 0;
  STAMPS.forEach((s) => {
    const [x, y] = shakeXY(t, s, 12, 9);
    sx += x;
    sy += y;
  });
  const tf = `${kOut > 0 ? mv(outMode, kOut, 1) : kIn > 0 ? mv(inMode, kIn, -1) : ""} translate(${sx}px, ${sy}px)`;
  const blur = (kOut + kIn) * 14;
  const li = lineAt(t);
  const cap = CHUNKS.find((c) => t >= c.a && t < c.b);
  const endT = VO_END + 0.35;
  const count = STAMPS.filter((s) => t >= s).length;
  const hudO = clamp((t - 0.1) / 0.3) * (1 - clamp((t - endT) / 0.2));
  return (
    <AbsoluteFill style={{ background: "#0B0B0B", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: tf, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        <act.C t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: 0.22 * Math.max(0, 1 - Math.abs(t - a) / 0.06) * (ai > 0 ? 1 : 0), pointerEvents: "none" }} />
      {/* red edge glow while the detector screams */}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 120px rgba(227,38,43,${0.45 * clamp((env(t) - 0.45) / 0.4)})`, pointerEvents: "none" }} />
      <LieHud t={t} o={hudO} env={env} count={count} countAt={STAMPS} />
      {cap && !NO_CAP.has(cap.line) && <Cap t={t} words={cap.words} o={clamp((cap.b - t) / 0.12)} light={LIGHT_LINES.has(li)} />}
      <EndCard t={t} t0={endT} tagline="دروغ ششم رو کامنت کن!" />
      {!silent && <Audio src={staticFile(MIX || VOICE)} />}
    </AbsoluteFill>
  );
};

export const V48: React.FC<{ silent?: boolean }> = ({ silent = false }) => {
  const f = useCurrentFrame();
  return <Frame t={f / FPS} silent={silent} />;
};

/** stills for checking */
export const V48_LOOK = [0.15, 0.9, 2.6, 3.45, 3.8, 5.3, 6.9, 7.7, 8.7, 9.9, 10.7, 11.5, 12.1, 13.3, 13.9, 15.2, 16.8, 17.9, 18.9, 20.9, 21.7, 22.5, 23.4, 24.6, 26.4, 27.2, 28.3, 28.9, 29.9, 31.2, 31.9, 33.6];
export const V48Look: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Freeze frame={Math.round((V48_LOOK[f] ?? 0) * FPS)}>
      <V48 silent />
    </Freeze>
  );
};
