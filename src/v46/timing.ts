// v46 timing. Until the user's voiceover arrives the words are spaced by an estimate (≈0.36 s a word);
// then vo.json (from the real audio) replaces it: { words: [{ w, s, e, line }] }.
import vo from "./vo.json";

export const FPS = 30;
export const LINES = [
  "یه برج، یه سفینه‌ی برگشته از فضا رو وسط هوا قاپید… کاری که حتی ناسا هم نکرده بود.",
  "شصت ساله ناسا، روسیه و چین، طبقه‌ی بالای موشک‌هاشون رو بعد از هر پرواز دور می‌ندازن. میلیاردها دلار، یه‌بارمصرف.",
  "حتی فالکون ۹ که بوسترش رو نزدیک ششصد بار نشونده، طبقه‌ی دومش رو هر بار از دست می‌ده.",
  "بیست‌وسوم آبان، همه نفسشون رو حبس کرده بودن. خود ماسک شانس موفقیت رو حدود پنجاه‌پنجاه می‌دونست.",
  "سفینه با سرعت بیست‌وهشت هزار کیلومتر بر ساعت خورد به جو، و با شکم شیرجه زد تا هوا ترمزش کنه.",
  "هجده هزار کاشی سرامیکی، تنها چیزی بودن که بین سفینه و پلاسمای هزار و چهارصد درجه‌ای فاصله انداختن.",
  "هجده ثانیه‌ی آخر، موتورها روشن شدن، توی دو ثانیه صاف ایستاد… و نشست وسط بازوهای برج.",
  "ولی نصف دیگه‌ی موشک؟ بوستر همین پرواز سوختش کم اومد، و کامپیوتر خودش فرستادش ته خلیج مکزیک.",
  "اگه موشک مثل هواپیما دوباره پرواز کنه، رفتن به فضا تا صد برابر ارزون‌تر می‌شه… و بقیه‌ی شرکت‌های موشکی چی؟",
  "ماسک داره آینده‌ی فضا رو می‌سازه… یا انحصاری‌ش می‌کنه؟ نظرت رو بنویس.",
];

export type Word = { w: string; s: number; e: number; line: number };

const estimate = (): Word[] => {
  const out: Word[] = [];
  let t = 0.15;
  LINES.forEach((ln, line) => {
    for (const w of ln.split(/\s+/).filter(Boolean)) {
      const d = 0.2 + 0.035 * w.replace(/[‌،؛…؟.:]/g, "").length;
      out.push({ w, s: t, e: t + d, line });
      t += d + (/[،؛…؟:.]$/.test(w) ? 0.28 : 0.04);
    }
    t += 0.4;
  });
  return out;
};

const real = (vo as { words?: Word[] }).words;
export const WORDS: Word[] = real && real.length ? real : estimate();
export const LINE_AT = LINES.map((_, i) => {
  const ws = WORDS.filter((w) => w.line === i);
  return { s: ws[0].s, e: ws[ws.length - 1].e };
});
export const VO_END = LINE_AT[LINE_AT.length - 1].e;
export const END = VO_END + 2.6; // end card holds after the last word
export const FRAMES = Math.round(END * FPS);

/** start of the first word in `line` that contains `part` (falls back to the line start) */
export const wt = (line: number, part: string, nth = 0) => {
  const ws = WORDS.filter((w) => w.line === line && w.w.includes(part));
  return (ws[nth] ?? ws[0])?.s ?? LINE_AT[line].s;
};
/** which line is on at t (the gap before a line belongs to it) */
export const lineAt = (t: number) => {
  for (let i = LINE_AT.length - 1; i >= 0; i--) if (t >= LINE_AT[i].s - 0.25) return i;
  return 0;
};
/** where each line's picture starts (a hair before its first word) */
export const cutAt = (i: number) => (i === 0 ? 0 : LINE_AT[i].s - 0.25);

// ─── captions: each line in chunks of up to 4 words, breaking after punctuation ───
const KEYS = ["قاپید", "ناسا", "شصت", "میلیاردها", "یه‌بارمصرف", "ششصد", "فالکون", "بیست‌وسوم", "پنجاه‌پنجاه", "بیست‌وهشت", "شکم", "هجده", "کاشی", "بازوهای", "نصف", "خلیج", "صد", "برابر", "انحصاری‌ش", "نظرت"];
export type Chunk = { a: number; b: number; words: { w: string; at: number; key: boolean }[] };
export const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  LINES.forEach((_, line) => {
    const ws = WORDS.filter((w) => w.line === line);
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      out.push({ a: cur[0].s - 0.08, b: 0, words: cur.map((w) => ({ w: w.w, at: w.s, key: KEYS.some((k) => w.w.replace(/[،؛…؟.]/g, "") === k || w.w.startsWith(k)) })) });
      cur = [];
    };
    ws.forEach((w) => {
      cur.push(w);
      if (cur.length >= 4 || /[،؛…؟:.]$/.test(w.w)) flush();
    });
    flush();
  });
  out.forEach((c, i) => (c.b = i + 1 < out.length ? Math.min(out[i + 1].a, c.words[c.words.length - 1].at + 1.2) : VO_END + 0.3));
  return out;
})();
