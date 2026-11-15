// v48 · drawn pieces for «۵ دروغی که ایرانیا هر روز میگن!»: lie-detector HUD, «دروغ!» stamp, lie badge,
// speech bubbles, phone chat, nav card, bank SMS, delivery app, desk calendar, poll, and stand-ins for the GPT photos.
import React from "react";
import { INK, YEL, back, clamp, eio, eo, fa } from "./kit";
import { ForkKnife } from "./art";

export const RED = "#E3262B"; // only for «دروغ!» (stamp + detector alarm)
export const W = 1080, H = 1920;

// ─── the lie-detector HUD (top band): polygraph on the right, lie counter on the left ───
export const LieHud: React.FC<{ t: number; o: number; env: (tt: number) => number; count: number; countAt: number[] }> = ({ t, o, env, count, countAt }) => {
  if (o <= 0.01) return null;
  const box: React.CSSProperties = { background: "rgba(14,14,14,0.88)", borderRadius: 22, border: `3px solid rgba(255,214,10,0.55)`, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", height: 92, display: "flex", alignItems: "center", direction: "rtl" };
  const now = env(t);
  const alarm = now > 0.45;
  const blink = alarm ? 0.6 + 0.4 * Math.abs(Math.sin(t * 9)) : 1;
  const TW = 290, TH = 50;
  const pts: string[] = [];
  for (let x = 0; x <= TW; x += 3) {
    const tt = t - (TW - x) / 105;
    const e = env(tt);
    const amp = 3 + 21 * e;
    const y = TH / 2 + amp * (0.62 * Math.sin(tt * 29 + Math.sin(tt * 5)) + 0.38 * Math.sin(tt * 61 + 1.3));
    pts.push(`${x},${Math.max(2, Math.min(TH - 2, y)).toFixed(1)}`);
  }
  const last = pts[pts.length - 1].split(",");
  return (
    <div style={{ position: "absolute", left: 36, right: 36, top: 150, display: "flex", justifyContent: "space-between", opacity: o, transform: `translateY(${(1 - o) * -40}px)` }}>
      {/* right: polygraph */}
      <div style={{ ...box, padding: "0 18px 0 16px", gap: 14 }}>
        <svg width="44" height="44" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke={YEL} strokeWidth="4" />
          <path d="M8 28 L15 28 L19 16 L25 36 L30 22 L33 28 L40 28" fill="none" stroke={alarm ? RED : YEL} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <span style={{ font: `800 22px "RVazir"`, color: "#ddd" }}>دروغ‌سنج</span>
            <span style={{ font: `900 19px "RVazir"`, color: alarm ? "#fff" : "#999", background: alarm ? RED : "#2E2E2E", padding: "0 10px 3px", borderRadius: 8, opacity: blink }}>{alarm ? "دروغ!" : "عادی"}</span>
          </div>
          <svg width={TW} height={TH} style={{ display: "block", direction: "ltr" }}>
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={TW} y1={TH * f} y2={TH * f} stroke="#333" strokeWidth="1.5" />)}
            <polyline points={pts.join(" ")} fill="none" stroke={alarm ? RED : YEL} strokeWidth="3.2" strokeLinejoin="round" />
            <circle cx={+last[0]} cy={+last[1]} r="5" fill="#fff" />
          </svg>
        </div>
      </div>
      {/* left: lies caught */}
      <div style={{ ...box, padding: "0 20px 0 18px", gap: 14 }}>
        <div>
          <div style={{ font: `800 22px "RVazir"`, color: "#ddd", marginBottom: 6 }}>دروغ‌های امروز</div>
          <div style={{ display: "flex", gap: 7, direction: "rtl" }}>
            {Array.from({ length: 5 }, (_, i) => {
              const on = count > i;
              const k = on ? back((t - countAt[i]) / 0.3, 2.6) : 1;
              return (
                <svg key={i} width="34" height="30" viewBox="0 0 34 30" style={{ transform: `scale(${k})` }}>
                  <path d="M4 3 h26 a3 3 0 0 1 3 3 v13 a3 3 0 0 1 -3 3 h-15 l-7 6 v-6 h-4 a3 3 0 0 1 -3 -3 v-13 a3 3 0 0 1 3 -3 Z" fill={on ? YEL : "#3A3A3A"} />
                  {on && <path d="M12 9 L22 17 M22 9 L12 17" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />}
                </svg>
              );
            })}
          </div>
        </div>
        <div style={{ font: `400 50px/1 "RLalezar"`, color: count >= 5 ? YEL : "#fff", minWidth: 76, textAlign: "center", paddingBottom: 4 }}>{fa(count)}/{fa(5)}</div>
      </div>
    </div>
  );
};

// ─── red rubber stamp «دروغ!» that slams onto the punchline ───
export const LieStamp: React.FC<{ t: number; t0: number; x: number; y: number; size?: number; rot?: number; text?: string }> = ({ t, t0, x, y, size = 1, rot = -11, text = "دروغ!" }) => {
  if (t < t0) return null;
  const k = clamp((t - t0) / 0.13);
  const sc = 2.3 - 1.3 * eo(k);
  const w = 430 * size, h = 210 * size;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${sc})`, opacity: clamp(k * 3), pointerEvents: "none" }}>
      <svg width={w} height={h} viewBox="0 0 430 210" style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))" }}>
        <defs>
          <filter id="v48-grunge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.55" result="m" />
            <feComposite in="SourceGraphic" in2="m" operator="in" />
          </filter>
        </defs>
        <g filter="url(#v48-grunge)">
          <rect x="8" y="8" width="414" height="194" rx="26" fill="rgba(255,255,255,0.06)" stroke={RED} strokeWidth="13" />
          <rect x="26" y="26" width="378" height="158" rx="14" fill="none" stroke={RED} strokeWidth="4.5" />
          <text x="215" y="150" textAnchor="middle" direction="rtl" style={{ font: `400 132px "RLalezar"` }} fill={RED}>{text}</text>
        </g>
      </svg>
    </div>
  );
};

// ─── lie number badge (top right, under the HUD) ───
const ORD = ["اول", "دوم", "سوم", "چهارم", "پنجم"];
export const LieBadge: React.FC<{ t: number; t0: number; n: number }> = ({ t, t0, n }) => {
  const k = back((t - t0 - 0.05) / 0.35, 2);
  return (
    <div style={{ position: "absolute", right: 40, top: 270, display: "flex", alignItems: "center", direction: "rtl", gap: 0, transform: `translateX(${(1 - eo((t - t0) / 0.3)) * 380}px)`, opacity: clamp((t - t0) / 0.1) }}>
      <div style={{ width: 104, height: 104, borderRadius: 52, background: YEL, border: `6px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", font: `400 84px/1 "RLalezar"`, color: INK, paddingTop: 6, boxSizing: "border-box", transform: `scale(${k}) rotate(${-8 + 3 * Math.sin(t * 3)}deg)`, boxShadow: "0 8px 22px rgba(0,0,0,0.4)", zIndex: 1 }}>{fa(n)}</div>
      <div style={{ marginRight: -14, background: INK, color: YEL, font: `900 40px "RVazir"`, padding: "6px 26px 12px 24px", borderRadius: "0 12px 12px 0", boxShadow: "0 8px 22px rgba(0,0,0,0.35)" }}>دروغ {ORD[n - 1]}</div>
    </div>
  );
};

// ─── speech bubble whose words pop in at their spoken times ───
export type BWord = { w: string; at: number };
export const Bubble: React.FC<{ t: number; words: BWord[]; x: number; y: number; maxW?: number; size?: number; theme?: "yel" | "white" | "ink"; tail?: number; tailDown?: boolean; rot?: number; o?: number; wob?: number }> = ({ t, words, x, y, maxW = 900, size = 96, theme = "yel", tail = 0.5, tailDown = true, rot = -2, o = 1, wob = 0 }) => {
  const t0 = words[0].at - 0.1;
  if (t < t0) return null;
  const k = back((t - t0) / 0.32, 2.2);
  const bg = theme === "yel" ? YEL : theme === "white" ? "#fff" : INK;
  const fg = theme === "ink" ? YEL : INK;
  const bd = theme === "ink" ? YEL : INK;
  const r = rot + wob * Math.sin(t * 14) * Math.exp(-3 * Math.max(0, t - t0 - 0.4)) + 1.2 * Math.sin(t * 2.2);
  return (
    <div style={{ position: "absolute", left: x - maxW / 2, top: y, width: maxW, display: "flex", justifyContent: "center", opacity: clamp((t - t0) / 0.06) * o }}>
      <div style={{ position: "relative", transform: `rotate(${r}deg) scale(${k})`, transformOrigin: `${tail * 100}% ${tailDown ? "120%" : "-20%"}` }}>
        <div style={{ background: bg, border: `7px solid ${bd}`, borderRadius: 44, padding: `${size * 0.12}px ${size * 0.42}px ${size * 0.26}px`, direction: "rtl", textAlign: "center", boxShadow: "0 18px 40px rgba(0,0,0,0.35)", font: `400 ${size}px/1.25 "RLalezar"`, color: fg, whiteSpace: "nowrap" }}>
          {words.map((wd, i) => {
            const kw = clamp((t - wd.at) / 0.12);
            return <span key={i} style={{ display: "inline-block", margin: "0 0.12em", opacity: kw > 0 ? 0.25 + 0.75 * kw : 0, transform: `translateY(${(1 - eo(kw)) * 16}px)` }}>{wd.w}</span>;
          })}
        </div>
        <svg width="70" height="56" viewBox="0 0 70 56" style={{ position: "absolute", left: `calc(${tail * 100}% - 35px)`, ...(tailDown ? { bottom: -48 } : { top: -48, transform: "scaleY(-1)" }) }}>
          <path d="M6 0 L64 0 L20 52 Z" fill={bg} stroke={bd} strokeWidth="7" strokeLinejoin="round" />
          <rect x="0" y="-8" width="70" height="12" fill={bg} />
        </svg>
      </div>
    </div>
  );
};

// ─── phone chat ───
export type Msg = { kind: "in" | "out" | "sep"; text: string; at: number; name?: string; time?: string; big?: boolean; words?: BWord[]; h?: number };
export const ChatPhone: React.FC<{ t: number; x?: number; top: number; w: number; h: number; title: string; sub: string; msgs: Msg[]; scroll?: number; children?: React.ReactNode; avatar?: string }> = ({ t, x = 540, top, w, h, title, sub, msgs, scroll = 0, children, avatar = "م" }) => {
  const shown = msgs.filter((m) => t >= m.at - 0.02);
  // new messages push the stack up smoothly
  let push = 0;
  shown.forEach((m) => (push += (m.h ?? (m.big ? 150 : 112)) * (1 - eo((t - m.at) / 0.22))));
  return (
    <div style={{ position: "absolute", left: x - w / 2, top, width: w, height: h, borderRadius: 64, background: "#050505", padding: 16, boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #2A2A2A" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 50, overflow: "hidden", background: "#0F1115" }}>
        {/* wallpaper dots */}
        <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
          <defs>
            <pattern id={`v48-wp-${top}`} width="46" height="46" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="3" fill={YEL} />
              <circle cx="33" cy="33" r="2" fill="#fff" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill={`url(#v48-wp-${top})`} />
        </svg>
        {/* messages, bottom-anchored */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, padding: "0 26px", display: "flex", flexDirection: "column", gap: 14, transform: `translateY(${push + scroll}px)` }}>
          {shown.map((m, i) => {
            const k = back((t - m.at) / 0.3, 2.2);
            if (m.kind === "sep")
              return (
                <div key={i} style={{ alignSelf: "center", background: "rgba(255,255,255,0.12)", color: "#ddd", font: `800 28px "RVazir"`, padding: "4px 22px 8px", borderRadius: 20, direction: "rtl", margin: "10px 0" }}>{m.text}</div>
              );
            const out = m.kind === "out";
            return (
              <div key={i} style={{ alignSelf: out ? "flex-end" : "flex-start", maxWidth: "82%", transform: `scale(${k})`, transformOrigin: out ? "100% 100%" : "0% 100%", direction: "rtl" }}>
                <div style={{ background: out ? YEL : "#23262D", color: out ? INK : "#fff", borderRadius: 30, borderBottomRightRadius: out ? 8 : 30, borderBottomLeftRadius: out ? 30 : 8, padding: m.big ? "10px 34px 14px" : "10px 26px 12px", boxShadow: "0 8px 18px rgba(0,0,0,0.3)" }}>
                  {m.name && <div style={{ font: `800 24px "RVazir"`, color: YEL, marginBottom: 2 }}>{m.name}</div>}
                  <div style={{ font: m.big ? `400 76px/1.25 "RLalezar"` : `600 38px/1.45 "RVazir"`, whiteSpace: "nowrap" }}>
                    {m.words
                      ? m.words.map((wd, j) => <span key={j} style={{ display: "inline-block", margin: "0 0.12em", opacity: t >= wd.at - 0.02 ? 1 : 0.0 }}>{wd.w}</span>)
                      : m.text}
                  </div>
                  <div style={{ font: `600 20px "RVazir"`, color: out ? "rgba(17,17,17,0.6)" : "#8A8F99", textAlign: "left", marginTop: -2, direction: "ltr" }}>
                    {m.time ?? "۲۰:۴۸"} {out && <span style={{ letterSpacing: -6, marginLeft: 6 }}>✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* header */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 128, background: "rgba(23,25,30,0.97)", display: "flex", alignItems: "center", gap: 20, padding: "16px 34px 0", direction: "rtl", borderBottom: "2px solid #2A2D35" }}>
          <div style={{ width: 76, height: 76, borderRadius: 38, background: YEL, color: INK, display: "flex", alignItems: "center", justifyContent: "center", font: `400 46px/1 "RLalezar"`, paddingTop: 6, boxSizing: "border-box" }}>{avatar}</div>
          <div>
            <div style={{ font: `800 36px "RVazir"`, color: "#fff" }}>{title}</div>
            <div style={{ font: `600 24px "RVazir"`, color: "#8A8F99" }}>{sub}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── navigation ETA card: «۲ دقیقه تا مقصد» while the pin hasn't moved ───
export const NavCard: React.FC<{ t: number; t0: number; x?: number; y: number }> = ({ t, t0, x = 540, y }) => {
  if (t < t0 - 0.02) return null;
  const k = back((t - t0) / 0.38, 1.8);
  const dash = (t * 40) % 28;
  const pulse = (t * 1.6) % 1;
  return (
    <div style={{ position: "absolute", left: x - 470, top: y, width: 940, height: 250, transform: `translateY(${(1 - k) * -120}px) scale(${0.9 + 0.1 * k})`, opacity: clamp((t - t0) / 0.1), borderRadius: 34, background: "#fff", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", direction: "rtl", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "26px 34px 0 10px" }}>
        <div style={{ font: `800 28px "RVazir"`, color: "#666" }}>زمان رسیدن به مقصد</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ font: `400 120px/1.05 "RLalezar"`, color: INK }}>{fa(2)}</span>
          <span style={{ font: `400 64px/1 "RLalezar"`, color: INK }}>دقیقه</span>
        </div>
        <div style={{ font: `700 26px "RVazir"`, color: "#888", marginTop: 4 }}>۱۸ کیلومتر · هنوز حرکت نکرده</div>
      </div>
      {/* mini map */}
      <svg width="360" height="250" viewBox="0 0 360 250" style={{ direction: "ltr" }}>
        <rect width="360" height="250" fill="#EDEAE2" />
        {[40, 110, 180, 230].map((yy) => <rect key={yy} x="0" y={yy} width="360" height="12" fill="#fff" />)}
        {[60, 160, 270].map((xx) => <rect key={xx} x={xx} y="0" width="12" height="250" fill="#fff" />)}
        <rect x="190" y="130" width="60" height="40" fill="#D7E7CF" />
        <path d="M60 196 C 120 196, 120 116, 166 116 S 250 46, 316 46" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeDasharray="16 12" strokeDashoffset={-dash} />
        {/* home pin (pulsing, not moving) */}
        <circle cx="60" cy="196" r={14 + 26 * pulse} fill="none" stroke={YEL} strokeWidth="5" opacity={1 - pulse} />
        <circle cx="60" cy="196" r="15" fill={YEL} stroke={INK} strokeWidth="5" />
        {/* destination flag */}
        <path d="M316 46 V8 M316 8 L344 16 L316 26" fill={RED} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ─── bank SMS / notification: the loan instalment ───
export const BankSms: React.FC<{ t: number; t0: number; y: number; x?: number }> = ({ t, t0, y, x = 540 }) => {
  if (t < t0 - 0.02) return null;
  const k = back((t - t0) / 0.4, 1.8);
  return (
    <div style={{ position: "absolute", left: x - 480, top: y, width: 960, transform: `translateY(${(1 - k) * -260}px)`, opacity: clamp((t - t0) / 0.08), borderRadius: 40, background: "rgba(246,246,244,0.97)", boxShadow: "0 30px 70px rgba(0,0,0,0.55)", padding: "26px 34px 30px", direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <rect width="60" height="60" rx="14" fill={INK} />
          <path d="M10 24 L30 12 L50 24 Z" fill={YEL} />
          {[16, 26, 36, 44].map((xx) => <rect key={xx} x={xx - 2} y="27" width="5" height="16" fill={YEL} />)}
          <rect x="10" y="45" width="40" height="5" fill={YEL} />
        </svg>
        <span style={{ font: `800 32px "RVazir"`, color: "#555" }}>پیامک بانک</span>
        <span style={{ marginRight: "auto", font: `600 26px "RVazir"`, color: "#999" }}>همین الان</span>
      </div>
      <div style={{ font: `800 40px/1.5 "RVazir"`, color: INK, marginTop: 14 }}>برداشت از حساب: قسط وام</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ font: `400 96px/1.1 "RLalezar"`, color: INK }}>{fa(Math.round(4.8e6 * eo((t - t0 - 0.15) / 0.5))).replace(/٬/g, "٬")}</span>
        <span style={{ font: `400 50px "RLalezar"`, color: INK }}>تومن</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
        <span style={{ font: `800 30px "RVazir"`, color: "#555", whiteSpace: "nowrap" }}>قسط {fa(1)} از {fa(36)}</span>
        <div style={{ display: "flex", gap: 4, direction: "rtl" }}>
          {Array.from({ length: 36 }, (_, i) => <div key={i} style={{ width: 14, height: 26, borderRadius: 4, background: i === 0 ? YEL : "#D9D9D6", border: i === 0 ? `2px solid ${INK}` : "none", boxSizing: "border-box" }} />)}
        </div>
      </div>
    </div>
  );
};

// ─── delivery app cart: «ثبت سفارش» → «سفارش ثبت شد» ───
export const MiniBurger: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 60 60">
    <path d="M8 26 C 8 10, 52 10, 52 26 Z" fill="#E0A04A" />
    <rect x="6" y="27" width="48" height="6" rx="3" fill="#6BBF59" />
    <rect x="7" y="33" width="46" height="9" rx="4" fill="#5A3420" />
    <path d="M8 44 h44 a4 4 0 0 1 -4 6 h-36 a4 4 0 0 1 -4 -6 Z" fill="#D8923E" />
  </svg>
);
export const DeliveryCard: React.FC<{ t: number; t0: number; tPress: number; tDone: number; y: number }> = ({ t, t0, tPress, tDone, y }) => {
  if (t < t0 - 0.02) return null;
  const k = back((t - t0) / 0.38, 1.6);
  const press = t >= tPress ? 1 - 0.07 * Math.exp(-12 * (t - tPress)) * Math.sin(Math.min(1, (t - tPress) / 0.15) * Math.PI) : 1;
  const done = clamp((t - tDone) / 0.18);
  const rip = clamp((t - tPress) / 0.45);
  return (
    <div style={{ position: "absolute", left: 70, top: y, width: 940, transform: `translateY(${(1 - k) * 500}px)`, borderRadius: 40, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.55)", padding: "24px 34px 30px", direction: "rtl", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, font: `800 34px "RVazir"`, color: INK }}>
        <svg width="46" height="46" viewBox="0 0 48 48"><path d="M8 16 h32 l-3 26 h-26 Z" fill={YEL} stroke={INK} strokeWidth="4" strokeLinejoin="round" /><path d="M17 16 v-4 a7 7 0 0 1 14 0 v4" fill="none" stroke={INK} strokeWidth="4" /></svg>
        سبد خرید
        <span style={{ marginRight: "auto", font: `700 26px "RVazir"`, color: "#999" }}>ارسال ۴۵ دقیقه</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "16px 0 20px", padding: "14px 18px", background: "#F4F3EF", borderRadius: 24 }}>
        <MiniBurger s={84} />
        <div style={{ flex: 1 }}>
          <div style={{ font: `800 38px "RVazir"`, color: INK }}>همبرگر مخصوص</div>
          <div style={{ font: `700 28px "RVazir"`, color: "#777" }}>تعداد: {fa(1)}</div>
        </div>
        <div style={{ font: `400 52px "RLalezar"`, color: INK, whiteSpace: "nowrap" }}>{fa(450000)} <span style={{ fontSize: 32 }}>تومن</span></div>
      </div>
      <div style={{ position: "relative", height: 104, borderRadius: 28, overflow: "hidden", transform: `scale(${press})`, background: done > 0 ? INK : YEL, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {t >= tPress && done === 0 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 900 * rip, height: 900 * rip, marginLeft: -450 * rip, marginTop: -450 * rip, borderRadius: "50%", background: "rgba(255,255,255,0.45)", opacity: 1 - rip }} />}
        <span style={{ font: `400 56px/1 "RLalezar"`, color: done > 0 ? YEL : INK, paddingTop: 6 }}>{done > 0 ? "سفارش ثبت شد" : "ثبت سفارش"}</span>
        {done > 0 && (
          <svg width="56" height="56" viewBox="0 0 60 60" style={{ transform: `scale(${back(done, 2.4)})` }}>
            <circle cx="30" cy="30" r="26" fill={YEL} />
            <path d="M17 31 l9 9 l17 -19" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

/** a pointing hand (tap cursor) */
export const Hand: React.FC<{ x: number; y: number; s?: number; press?: number; o?: number }> = ({ x, y, s = 1, press = 0, o = 1 }) => (
  <svg width={120 * s} height={140 * s} viewBox="0 0 120 140" style={{ position: "absolute", left: x - 34 * s, top: y - 6 * s, opacity: o, transform: `scale(${1 - 0.12 * press})`, transformOrigin: "30% 5%", filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.45))", pointerEvents: "none" }}>
    <path d="M34 8 c0-8 14-8 14 0 v46 l4-2 c2-8 14-7 14 1 l3-1 c2-7 14-6 14 2 l2 0 c3-6 13-4 13 4 v34 c0 20-14 40-36 40 h-6 c-14 0-22-8-30-20 l-22-30 c-5-7 4-15 11-9 l12 11 Z" fill="#fff" stroke={INK} strokeWidth="6" strokeLinejoin="round" />
  </svg>
);

// ─── crumbs flying from a bite ───
export const Crumbs: React.FC<{ t: number; t0: number; x: number; y: number; n?: number; seed?: number }> = ({ t, t0, x, y, n = 12, seed = 1 }) => {
  const u = t - t0;
  if (u < 0 || u > 0.9) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r = (k: number) => (Math.sin((i + 1) * 12.9898 * k + seed * 78.233) * 43758.5453) % 1;
        const a = -Math.PI / 2 + (Math.abs(r(1)) - 0.5) * 2.4 + 0.5;
        const sp = 420 + Math.abs(r(2)) * 520;
        const px = x + Math.cos(a) * sp * u, py = y + Math.sin(a) * sp * u + 1500 * u * u;
        const sz = 8 + Math.abs(r(3)) * 12;
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: sz, height: sz * 0.8, borderRadius: 3, background: i % 3 ? "#D8923E" : "#8A5428", opacity: 1 - u / 0.9, transform: `rotate(${u * 600 * r(4)}deg)` }} />;
      })}
    </>
  );
};

// ─── tear-off desk calendar page ───
export const CalPage: React.FC<{ w: number; h: number; word?: string; sub?: string; eyes?: number; brow?: number; look?: number }> = ({ w, h, word = "فردا", sub = "شروع رژیم و باشگاه", eyes = 0, brow = 0, look = 0 }) => (
  <div style={{ position: "relative", width: w, height: h, background: "#FFFDF7", borderRadius: 18, overflow: "hidden", boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.05)" }}>
    <div style={{ height: h * 0.18, background: INK, display: "flex", alignItems: "center", justifyContent: "center", font: `800 ${h * 0.065}px "RVazir"`, color: YEL, direction: "rtl" }}>تقویم من</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.26, textAlign: "center", font: `400 ${h * 0.34}px/1 "RLalezar"`, color: INK, direction: "rtl" }}>{word}</div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: h * 0.08, textAlign: "center", font: `800 ${h * 0.055}px "RVazir"`, color: "#777", direction: "rtl" }}>{sub}</div>
    {eyes > 0 && (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        {[-1, 1].map((sd) => {
          const ex = w / 2 + sd * w * 0.2, ey = h * 0.66;
          return (
            <g key={sd} opacity={eyes}>
              <ellipse cx={ex + look * 8} cy={ey} rx={w * 0.05} ry={w * 0.07 * eyes} fill={INK} />
              <ellipse cx={ex + look * 8 - w * 0.015} cy={ey - w * 0.025} rx={w * 0.014} ry={w * 0.018} fill="#fff" />
              <path d={`M ${ex - sd * w * 0.09} ${ey - w * 0.1 - brow * w * 0.02} L ${ex + sd * w * 0.08} ${ey - w * 0.1 + brow * w * 0.06}`} stroke={INK} strokeWidth={w * 0.03} strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
    )}
  </div>
);

// ─── stand-ins for the GPT photos (used until public/v48/gpt/<name>.jpg arrives) ───
export const BedroomArt: React.FC<{ t: number }> = ({ t }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="v48-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C2434" /><stop offset="1" stopColor="#0B0E15" /></linearGradient>
      <linearGradient id="v48-blanket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3F1EC" /><stop offset="1" stopColor="#9DA3B0" /></linearGradient>
      <radialGradient id="v48-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#CFE6FF" stopOpacity="0.85" /><stop offset="1" stopColor="#CFE6FF" stopOpacity="0" /></radialGradient>
      <linearGradient id="v48-ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE8B0" stopOpacity="0.5" /><stop offset="1" stopColor="#FFE8B0" stopOpacity="0" /></linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#v48-room)" />
    {/* window with closed curtains and one line of daylight */}
    <rect x="60" y="260" width="300" height="640" fill="#141A26" />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={60 + i * 50} y="260" width="48" height="660" fill={i % 2 ? "#232C3E" : "#1D2536"} />)}
    <rect x="203" y="260" width="6" height="660" fill="#FFE9B8" opacity={0.85 + 0.1 * Math.sin(t * 2)} />
    <path d="M206 300 L760 1300 L640 1300 L200 330 Z" fill="url(#v48-ray)" opacity="0.35" />
    {/* headboard, bed */}
    <rect x="110" y="700" width="860" height="300" rx="40" fill="#2A3142" />
    <rect x="70" y="960" width="940" height="620" rx="30" fill="#7E8594" />
    <ellipse cx="300" cy="960" rx="190" ry="70" fill="#C9CDD5" />
    {/* the blanket mound, breathing */}
    <g transform={`translate(540 1130) scale(1 ${1 + 0.012 * Math.sin(t * 1.8)}) translate(-540 -1130)`}>
      <path d="M120 1300 C 150 980, 330 860, 540 880 C 760 900, 940 1000, 960 1300 Z" fill="url(#v48-blanket)" />
      <path d="M280 1050 C 380 1000, 470 1010, 560 1090 M620 960 C 700 1010, 760 1080, 800 1180 M200 1220 C 320 1160, 420 1180, 520 1250" fill="none" stroke="#8C93A1" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
      <path d="M90 1280 C 300 1330, 760 1330, 990 1280 L1000 1420 L80 1420 Z" fill="#B9BEC9" />
    </g>
    {/* the hand and the glowing phone */}
    <circle cx="760" cy="1120" r="190" fill="url(#v48-glow)" opacity={0.75 + 0.15 * Math.sin(t * 5)} />
    <g transform="rotate(-14 760 1120)">
      <rect x="700" y="1150" width="110" height="70" rx="30" fill="#C99A7A" />
      <rect x="722" y="1030" width="76" height="140" rx="14" fill="#111" />
      <rect x="728" y="1038" width="64" height="124" rx="9" fill="#DDEEFF" />
    </g>
    {/* nightstand + alarm clock */}
    <rect x="930" y="980" width="150" height="360" fill="#262D3C" />
    <circle cx="1000" cy="930" r="44" fill="#F0E6D2" stroke="#555" strokeWidth="6" />
    <path d="M1000 930 L1000 902 M1000 930 L1020 940" stroke="#333" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const ShopArt: React.FC<{ t: number }> = ({ t }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
    <rect width={W} height={H} fill="#2E2116" />
    {[380, 640, 900, 1160].map((yy, r) => (
      <g key={yy}>
        <rect x="0" y={yy + 180} width={W} height="22" fill="#5A4030" />
        {Array.from({ length: 9 }, (_, i) => {
          const c = ["#C8A464", "#8E4B32", "#E8D9B5", "#6E7B45", "#B5652C", "#D9C27A"][(i + r * 2) % 6];
          const hh = 110 + ((i * 37 + r * 13) % 60);
          return <rect key={i} x={20 + i * 118} y={yy + 180 - hh} width="96" height={hh} rx="8" fill={c} opacity="0.75" />;
        })}
      </g>
    ))}
    <rect width={W} height={H} fill="#000" opacity="0.25" />
    {/* shopkeeper silhouette, hand on chest */}
    <g transform={`translate(0 ${2 * Math.sin(t * 2)})`}>
      <path d="M260 1500 C 270 1150, 380 1040, 540 1040 C 700 1040, 810 1150, 820 1500 Z" fill="#3B4250" />
      <rect x="490" y="930" width="100" height="130" rx="40" fill="#B98563" />
      <ellipse cx="540" cy="820" rx="140" ry="165" fill="#C9936E" />
      <path d="M405 780 C 410 650, 670 650, 675 780 C 640 700, 440 700, 405 780 Z" fill="#9A9A9A" />
      <path d="M430 870 C 450 990, 630 990, 650 870 C 620 930, 460 930, 430 870 Z" fill="#9A9A9A" />
      <path d="M470 900 C 500 930, 580 930, 610 900" stroke="#5A2E1E" strokeWidth="10" fill="none" strokeLinecap="round" />
      <ellipse cx="490" cy="800" rx="14" ry="10" fill="#2A1A12" /><ellipse cx="590" cy="800" rx="14" ry="10" fill="#2A1A12" />
      <ellipse cx="560" cy="1180" rx="90" ry="60" fill="#C9936E" />
    </g>
    <rect x="0" y="1500" width={W} height="420" fill="#4A3020" />
    <rect x="0" y="1500" width={W} height="26" fill="#6E4A32" />
  </svg>
);

export const BurgerArt: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 600 600" style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="v48-bun" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stopColor="#F2B562" /><stop offset="1" stopColor="#B86B24" /></radialGradient>
    </defs>
    <ellipse cx="300" cy="470" rx="250" ry="30" fill="#000" opacity="0.45" />
    <path d="M80 400 h440 c0 40 -30 62 -70 62 h-300 c-40 0 -70 -22 -70 -62 Z" fill="#D3893A" />
    <path d="M70 340 c0 -14 10 -22 26 -22 h408 c16 0 26 8 26 22 v32 c0 20 -14 30 -30 30 h-400 c-16 0 -30 -10 -30 -30 Z" fill="#5B341F" />
    {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={95 + i * 19} cy={350 + (i % 3) * 14} r="4" fill="#3E2214" />)}
    <path d="M66 318 L534 318 L520 340 L470 384 L440 340 L380 372 L330 340 L270 380 L230 340 L170 376 L130 340 L80 340 Z" fill="#F6B91C" />
    <rect x="76" y="292" width="448" height="30" rx="14" fill="#D9412F" />
    <path d="M56 290 q 30 -30 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 l 0 14 h -480 Z" fill="#6CBF4B" />
    <path d="M70 290 C 70 140, 530 140, 530 290 Z" fill="url(#v48-bun)" />
    {Array.from({ length: 16 }, (_, i) => {
      const a = 0.25 + (i / 15) * 2.64, rr = 150 + (i % 3) * 30;
      return <ellipse key={i} cx={300 - Math.cos(a) * rr * 1.25} cy={282 - Math.sin(a) * rr * 0.55} rx="9" ry="5" fill="#FFF2D6" transform={`rotate(${(i * 37) % 60 - 30} ${300 - Math.cos(a) * rr * 1.25} ${282 - Math.sin(a) * rr * 0.55})`} />;
    })}
  </svg>
);

/** small fork + knife «سیری» meter chip */
export const FullChip: React.FC<{ t: number; t0: number; x: number; y: number; o?: number }> = ({ t, t0, x, y, o = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12, direction: "rtl", background: "rgba(14,14,14,0.9)", border: `3px solid ${YEL}`, borderRadius: 20, padding: "8px 18px", opacity: clamp((t - t0) / 0.15) * o, transform: `scale(${back((t - t0) / 0.3, 2)}) rotate(3deg)` }}>
    <ForkKnife size={44} />
    <div>
      <div style={{ font: `800 22px "RVazir"`, color: "#ddd" }}>سیری</div>
      <div style={{ display: "flex", gap: 4 }}>{Array.from({ length: 8 }, (_, i) => <div key={i} style={{ width: 18, height: 22, borderRadius: 4, background: YEL }} />)}</div>
    </div>
    <div style={{ font: `400 44px "RLalezar"`, color: YEL }}>{fa(100)}٪</div>
  </div>
);

export const eioX = eio;
