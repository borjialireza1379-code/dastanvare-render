// v48 · cover (1080×1920). Headline = the user's own title. Important parts stay inside y ≈ 260–1640 (grid crops).
import React from "react";
import { AbsoluteFill } from "remotion";
import { INK, YEL, fa } from "./kit";
import { YellowBurst } from "./art";
import { Bubble, LieStamp, RED } from "./parts";

const LIES = [
  { text: "تو راهم!", x: 290, y: 712, rot: -5, tail: 0.75, down: true },
  { text: "قابل نداره!", x: 780, y: 830, rot: 4, tail: 0.3, down: true },
  { text: "یه روز حتماً بریم بیرون!", x: 470, y: 958, rot: -3, tail: 0.7, down: true },
  { text: "نه بابا، من سیرم!", x: 720, y: 1088, rot: 3, tail: 0.3, down: false },
  { text: "از فردا شروع می‌کنم!", x: 400, y: 1216, rot: -4, tail: 0.7, down: false },
];

// a frozen polygraph trace that goes wild in the middle
const trace = (() => {
  const pts: string[] = [];
  for (let x = 0; x <= 880; x += 4) {
    const wild = Math.exp(-Math.pow((x - 520) / 150, 2));
    const y = 60 + (6 + 46 * wild) * (0.62 * Math.sin(x * 0.21) + 0.38 * Math.sin(x * 0.47 + 1.3));
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(" ");
})();

export const V48Cover: React.FC = () => (
  <AbsoluteFill style={{ background: YEL, overflow: "hidden" }}>
    <YellowBurst t={1.2} cy={1000} />
    {/* headline: «۵ دروغی که ایرانیا هر روز میگن!» */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
        <span style={{ display: "inline-flex", width: 190, height: 190, borderRadius: 95, background: INK, color: YEL, alignItems: "center", justifyContent: "center", font: `400 170px/1 "RLalezar"`, paddingTop: 16, boxSizing: "border-box", transform: "rotate(-6deg)", boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }}>{fa(5)}</span>
        <span style={{ font: `400 150px/1.1 "RLalezar"`, color: INK }}>دروغی که</span>
      </div>
      <div style={{ font: `400 150px/1.15 "RLalezar"`, color: INK, marginTop: -4 }}>ایرانیا</div>
      <div style={{ display: "inline-block", marginTop: 6, background: INK, color: YEL, font: `400 150px/1.12 "RLalezar"`, padding: "0 46px 24px", borderRadius: 28, transform: "rotate(-3deg)", boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }}>هر روز میگن!</div>
    </div>
    {/* the five lies */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 120 }}>
      {LIES.map((l, i) => (
        <Bubble key={i} t={10} words={[{ w: l.text, at: 0 }]} x={l.x} y={l.y} maxW={1000} size={60} theme="white" rot={l.rot} tail={l.tail} tailDown={l.down} />
      ))}
    </div>
    <LieStamp t={10} t0={0} x={790} y={1400} size={0.95} rot={-14} />
    {/* the lie detector, off the chart */}
    <div style={{ position: "absolute", left: 70, top: 1490, width: 940, height: 150, borderRadius: 30, background: INK, border: `5px solid ${YEL}`, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
      <svg width="940" height="150" style={{ position: "absolute", inset: 0 }}>
        {[38, 75, 112].map((y) => <line key={y} x1="0" x2="940" y1={y} y2={y} stroke="#2E2E2E" strokeWidth="2" />)}
        <g transform="translate(30 15)">
          <polyline points={trace} fill="none" stroke={RED} strokeWidth="6" strokeLinejoin="round" />
        </g>
      </svg>
      <div style={{ position: "absolute", right: 22, top: 12, background: RED, color: "#fff", font: `900 32px "RVazir"`, padding: "0 16px 6px", borderRadius: 10, direction: "rtl" }}>دروغ‌سنج</div>
    </div>
    <div style={{ position: "absolute", right: 44, top: 1676, font: `900 46px "RVazir"`, color: INK, direction: "rtl" }}>ردپا</div>
  </AbsoluteFill>
);
