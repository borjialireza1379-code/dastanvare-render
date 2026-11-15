// v46 · ردپا · «این ویدیو ساختگی نیست» (Starship Flight 15, Ship 42 caught by the tower, 23 Aban 1405).
// Full-screen footage (user, 2026-11-15: no window frame), text placed per shot so it never covers the subject.
// Footage: the user's SpaceX webcast clip (spacex.mp4, SpaceX's — used at the user's request, Content ID risk told)
// + public-domain archive in public/v46/footage (footage.json). House pieces: kit.tsx (copy of src/radpa/kit.tsx).
import React from "react";
import { AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BellyFlop, CostChart, Splash } from "./art";
import { Annotate, Caption, Chip, DataCard, EndCard, GRADE, Hook, Print, Still, YEL, camFor, clamp, eio } from "./kit";
import { CHUNKS, END, FPS, FRAMES, LINE_AT, VO_END, cutAt, lineAt, wt } from "./timing";

export const V46_FPS = FPS;
export const V46_FRAMES = FRAMES;
const W = 1080, H = 1920;
const TOP = 250; // cards / hook / chips at the top
const CAP = 1450; // caption
const VOICE = "v46/vo.wav";
const HAS_VOICE = false;
const MUSIC = "";
const SPX = "v46/footage/spacex.mp4";

// ─── a clip filling the screen. sh = usable source height (the SpaceX HUD sits below y=900) ───
const Full: React.FC<{ file: string; at: number; from?: number; w: number; h: number; sh?: number; fx?: number; fy?: number; z0?: number; z1?: number; rate?: number }> = ({ file, at, from = 0, w, h, sh = h, fx = 0.5, fy = 0.5, z0 = 1.02, z1 = 1.1, rate = 1 }) => {
  const t = useCurrentFrame() / FPS;
  const c = camFor(W, H, w, sh, fx, fy, z0 + (z1 - z0) * clamp((t - at) / 6));
  return (
    <Sequence from={Math.round(at * FPS)} layout="none">
      <OffthreadVideo src={staticFile(file)} muted startFrom={Math.round(from * FPS)} playbackRate={rate} style={{ position: "absolute", left: c.x0, top: c.y0, width: w * c.s, height: h * c.s, maxWidth: "none", filter: GRADE }} />
    </Sequence>
  );
};

// ─── one panel of the SpaceX split screen, scaled into a target rect ───
type Rect = { x: number; y: number; w: number; h: number };
const ONBOARD: Rect = { x: 45, y: 245, w: 905, h: 507 };
const CROWD: Rect = { x: 970, y: 245, w: 905, h: 507 };
/** k = scale; ax = which source x lands on the target's right edge (keeps the right part of the panel) */
const Panel: React.FC<{ at: number; from: number; src: Rect; dst: Rect; k: number; ax?: number; blur?: boolean }> = ({ at, from, src, dst, k, ax, blur }) => {
  const right = ax ?? src.x + src.w / 2 + dst.w / k / 2;
  const left = dst.w - right * k, top = -src.y * k;
  return (
    <div style={{ position: "absolute", left: dst.x, top: dst.y, width: dst.w, height: dst.h, overflow: "hidden" }}>
      <Sequence from={Math.round(at * FPS)} layout="none">
        <OffthreadVideo src={staticFile(SPX)} muted startFrom={Math.round(from * FPS)} style={{ position: "absolute", left, top, width: 1920 * k, height: 1080 * k, maxWidth: "none", filter: blur ? "blur(28px) brightness(0.45) saturate(1.2)" : GRADE }} />
      </Sequence>
    </div>
  );
};

const TAGS: string[] = [
  "پخش زنده‌ی اسپیس‌ایکس · پرواز ۱۵",
  "آرشیو · آپولو ۴ · ۱۹۶۷ · NASA",
  "آرشیو · فالکون ۹ · ۲۰۲۰",
  "پخش زنده‌ی اسپیس‌ایکس · پرواز ۱۵",
  "بازسازی گرافیکی",
  "دوربین روی خود سفینه‌ی ۴۲ · اسپیس‌ایکس",
  "پخش زنده‌ی اسپیس‌ایکس · پرواز ۱۵",
  "خلیج مکزیک از ایستگاه فضایی · NASA",
  "آرشیو · پرواز آزمایشی ۱ · ۲۰۲۳ · NASA",
  "پخش زنده‌ی اسپیس‌ایکس · پرواز ۱۵",
];

/** the picture for line i */
const Picture: React.FC<{ t: number; i: number }> = ({ t, i }) => {
  const a = cutAt(i);
  switch (i) {
    case 0: {
      const top = wt(0, "قاپید") - 0.35;
      return t < top ? <Full file={SPX} at={a} from={31} rate={1.35} w={1920} h={1080} sh={900} fx={0.5} fy={0.45} z0={1} z1={1.06} /> : <Full file={SPX} at={top} from={41.6} w={1920} h={1080} sh={900} fx={0.45} fy={0.5} z0={1.02} z1={1.08} />;
    }
    case 1:
      return <Full file="v46/footage/s02a.mp4" at={a} w={1450} h={1080} fx={0.5} fy={0.42} />;
    case 2:
      return <Full file="v46/footage/s03a.mp4" at={a} w={1920} h={1080} fx={0.47} fy={0.55} from={0.3} />;
    case 3:
      return (
        <>
          <Panel at={a} from={12} src={CROWD} dst={{ x: 0, y: 0, w: W, h: H }} k={3.8} blur />
          <Panel at={a} from={12} src={CROWD} dst={{ x: 0, y: 190, w: W, h: 620 }} k={1.22} />
          <Panel at={a} from={12} src={ONBOARD} dst={{ x: 0, y: 822, w: W, h: 620 }} k={1.22} />
        </>
      );
    case 4:
      return <BellyFlop t={t} a={a} b={LINE_AT[4].e + 0.3} w={W} h={H} />;
    case 5:
      return (
        <>
          <Panel at={a} from={2} src={ONBOARD} dst={{ x: 0, y: 0, w: W, h: H }} k={3.8} blur />
          <Panel at={a} from={2} src={ONBOARD} dst={{ x: 0, y: 200, w: W, h: 963 }} k={1.9} ax={948} />
        </>
      );
    case 6:
      return <Full file={SPX} at={a} from={33.4} w={1920} h={1080} sh={900} fx={0.5} fy={0.45} z0={1.04} z1={1.12} />;
    case 7: {
      const c = camFor(W, H, 3840, 2560, 0.36, 0.5, 1.05 + 0.08 * clamp((t - a) / 6));
      return (
        <>
          <Still src="v46/footage/s08a.jpg" sw={3840} sh={2560} c={c} filter={GRADE} />
          <Splash t={t} t0={wt(7, "فرستادش") - 0.7} x={520} y={1000} w={W} h={H} />
        </>
      );
    }
    case 8:
      return <Full file="v46/footage/s09a.mp4" at={a} w={1720} h={1080} fx={0.31} fy={0.5} from={6.8} z0={1.08} z1={1.14} />;
    case 9:
      return <Full file={SPX} at={a} from={50} w={1920} h={1080} sh={900} fx={0.48} fy={0.45} z0={1.05} z1={1.14} />;
  }
  return null;
};

/** cards, chips and the hook — placed where each picture has no subject */
const Info: React.FC<{ t: number; i: number }> = ({ t, i }) => {
  const a = cutAt(i), e = LINE_AT[i].e;
  const fadeOut = eio((t - e - 0.1) / 0.25);
  const swap = (word: string) => wt(i, word);
  switch (i) {
    case 0:
      return <Hook t={t} t0={0.02} line1="کاری که حتی ناسا" line2="هم نکرده بود!" size={108} out={Math.max(fadeOut, eio((t - wt(0, "قاپید") + 0.45) / 0.2))} top={TOP - 20} />;
    case 1: {
      const sw = swap("میلیاردها");
      return t < sw ? <DataCard t={t} t0={a + 0.1} label="موشک‌های یک‌بارمصرف" value={60} unit="سال" top={1110} out={eio((t - sw + 0.2) / 0.2)} /> : <Chip t={t} t0={sw} text="میلیاردها دلار، یه‌بارمصرف" top={1180} o={1 - fadeOut} />;
    }
    case 2:
      return <DataCard t={t} t0={swap("ششصد") - 0.3} label="فرود بوستر فالکون ۹ تا امروز" value={600} unit="بار، تقریباً" top={TOP} out={fadeOut} />;
    case 3: {
      const sw = swap("پنجاه‌پنجاه");
      return t < sw - 0.2 ? <Chip t={t} t0={a + 0.1} text="۲۳ آبان ۱۴۰۵ · پرواز ۱۵" top={230} o={1 - eio((t - sw) / 0.15)} /> : <DataCard t={t} t0={sw - 0.2} label="شانس موفقیت، به گفته‌ی ماسک" value={50} unit="درصد" top={225} dur={0.8} out={fadeOut} />;
    }
    case 4:
      return <DataCard t={t} t0={a + 0.15} label="سرعت در لحظه‌ی ورود به جو" value={28000} unit="کیلومتر بر ساعت" top={TOP} out={fadeOut} />;
    case 5:
      return <DataCard t={t} t0={swap("پلاسمای") - 0.25} label="دمای پلاسمای دور سفینه" value={1400} unit="درجه‌ی سانتی‌گراد" top={1185} out={fadeOut} />;
    case 6: {
      const nest = swap("نشست");
      return <DataCard t={t} t0={a + 0.05} label="ثانیه‌های آخر پرواز" value={0} from={18} max={18} unit="ثانیه" dur={Math.max(0.8, nest - a)} top={TOP} out={fadeOut} />;
    }
    case 7: {
      const sw = swap("خلیج");
      return t < sw ? <Chip t={t} t0={a + 0.1} text="نصف دیگه‌ی موشک کجاست؟" top={TOP} o={1 - eio((t - sw + 0.15) / 0.15)} /> : <Chip t={t} t0={sw} text="سوخت کم ← ته خلیج مکزیک" dark top={TOP} o={1 - fadeOut} />;
    }
    case 8: {
      const sw = swap("بقیه");
      return t < sw ? <CostChart t={t} t0={a + 0.2} stamp={swap("صد")} top={1110} out={eio((t - sw + 0.2) / 0.2)} /> : <Chip t={t} t0={sw} text="بقیه‌ی شرکت‌های موشکی چی؟" dark top={1220} o={1 - fadeOut} />;
    }
    case 9: {
      const sw = swap("نظرت");
      return t < sw ? <Chip t={t} t0={a + 0.05} text="آینده‌ی فضا… یا انحصار؟" top={TOP} o={1 - eio((t - sw + 0.1) / 0.15)} /> : <Chip t={t} t0={sw} text="نظرت رو کامنت کن" dark top={TOP} />;
    }
  }
  return null;
};

/** logo top-right + source tag top-left (kept small, above everything) */
const Corner: React.FC<{ t: number; i: number }> = ({ t, i }) => {
  const a = cutAt(i);
  const tagO = clamp((t - a - 0.25) / 0.25) * clamp((a + 3 - t) / 0.4);
  return (
    <>
      <div style={{ position: "absolute", right: 34, top: 150, display: "flex", alignItems: "center", gap: 8, direction: "rtl", background: "rgba(17,17,17,0.7)", borderRadius: 14, padding: "4px 8px 4px 16px", opacity: clamp((t - 0.2) / 0.3) }}>
        <svg width="38" height="38" viewBox="0 0 56 56">
          <Print x={20} y={31} r={-8} size={34} color={YEL} left />
          <Print x={36} y={25} r={8} size={34} color={YEL} />
        </svg>
        <div style={{ font: `900 28px "RVazir"`, color: "#fff" }}>ردپا</div>
      </div>
      <div style={{ position: "absolute", left: 34, top: 156, opacity: tagO, direction: "rtl", display: "flex", alignItems: "center", gap: 8, background: "rgba(17,17,17,0.7)", borderRadius: 10, padding: "3px 12px 7px", font: `600 22px "RVazir"`, color: "#eee" }}>
        <div style={{ width: 9, height: 9, borderRadius: 5, background: YEL }} />
        {TAGS[i]}
      </div>
    </>
  );
};

const Frame: React.FC<{ t: number; silent: boolean }> = ({ t, silent }) => {
  const i = lineAt(t);
  const a = cutAt(i);
  const next = i + 1 < LINE_AT.length ? cutAt(i + 1) : 1e9;
  const kOut = clamp((t - (next - 0.12)) / 0.12), kIn = i > 0 ? 1 - clamp((t - a) / 0.14) : 0;
  const shift = -kOut * 300 + kIn * 300, blur = (kOut + kIn) * 16;
  const cap = CHUNKS.find((c) => t >= c.a && t < c.b);
  const endT = VO_END + 0.35;
  return (
    <AbsoluteFill style={{ background: "#0A0A0A", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${shift}px) scale(${1 + (kOut + kIn) * 0.04})`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        <Picture t={t} i={i} />
      </AbsoluteFill>
      {/* calm bands for text: top and bottom only, the middle stays clean */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.35) 76%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: 0.25 * Math.max(0, 1 - Math.abs(t - a) / 0.06) * (i > 0 ? 1 : 0) }} />
      {i === 5 && <Annotate t={t} t0={wt(5, "کاشی") - 0.1} x={880} y={480} rx={150} ry={95} label="کاشی‌ها" side={-1} o={1 - eio((t - LINE_AT[5].e - 0.1) / 0.25)} />}
      <Info t={t} i={i} />
      {cap && <Caption t={t} words={cap.words} o={clamp((cap.b - t) / 0.12)} size={62} top={i === 5 ? 1480 : CAP} />}
      <Corner t={t} i={i} />
      <EndCard t={t} t0={endT} />
      {!silent && HAS_VOICE && <Audio src={staticFile(VOICE)} />}
      {!silent && MUSIC && <Audio src={staticFile(MUSIC)} />}
    </AbsoluteFill>
  );
};

export const V46: React.FC<{ silent?: boolean }> = ({ silent = false }) => {
  const f = useCurrentFrame();
  return <Frame t={f / FPS} silent={silent} />;
};

/** stills for checking: two per line, plus the hook and the end card */
export const V46_LOOK = [0.25, 1.0, ...LINE_AT.flatMap((l, i) => [+(cutAt(i) + 0.9).toFixed(2), +((l.s + l.e) / 2 + 0.6).toFixed(2)]), +(END - 0.3).toFixed(2)];
export const V46Look: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Freeze frame={Math.round((V46_LOOK[f] ?? 0) * FPS)}>
      <V46 silent />
    </Freeze>
  );
};
