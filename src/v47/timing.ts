// v47 timing. Until the user's voiceover arrives the words are spaced by an estimate;
// then vo.json (from the real audio) replaces it: { words: [{ w, s, e, line }] }.
import vo from "./vo.json";

export const FPS = 30;
// the user's text, verbatim (videos/47/script.txt)
export const LINES = [
  "چند روز باید گرسنه بمونی تا PS5 و GTA VI بخری؟",
  "قیمت یه PS5 اسلیم دیسک‌خور حدود ۱۹۵ میلیون تومنه و GTA VI هم با قیمت جهانی تقریباً ۲۱ میلیون تومن درمیاد!",
  "یعنی روی هم حدود ۲۱۶ میلیون تومن!",
  "حالا ببینیم پول سه وعده غذای حداقلی چقدره.",
  "فرض کن صبحونه نون و پنیر یا تخم‌مرغ بخوری، ناهار یه بشقاب برنج و سیب‌زمینی یا یه غذای ساده با تخم‌مرغ، و شام هم دوباره نون و پنیر و یه چیز جمع‌وجور!",
  "با یه برآورد حداقلی، روزی حدود ۳۵۰ هزار تومن باید برای این سه وعده کنار بذاری.",
  "حالا اگه همین پول غذا رو پس‌انداز کنی، باید حدود ۶۲۰ روز چیزی نخوری تا پول PS5 و GTA VI جور بشه!",
  "یعنی تقریباً یک سال و هشت ماه!",
  "اگه کل حقوق پایه‌ات رو هم پس‌انداز کنی، حدود ۱۳ ماه طول می‌کشه؛ البته به شرطی که نه اجاره بدی، نه قبض داشته باشی، نه حتی یه چایی بخوری!",
  "حالا قسمت جالب ماجرا:",
  "برای خرید همین کنسول و بازی، تو آمریکا با پس‌انداز پول غذا حدود ۱۲ روز، تو آلمان ۱۶ روز و تو ترکیه حدود ۴۴ روز زمان لازمه!",
  "حالا تو بگو:",
  "حاضری چند روز از غذا زدنت تا GTA VI بازی کنی؟",
];

export type Word = { w: string; s: number; e: number; line: number };

// spoken length of a written word (digits and Latin letters are said as longer words)
const spoken = (w: string) => {
  const c = w.replace(/[‌،؛…؟.:!]/g, "");
  if (/^[۰-۹0-9]+$/.test(c)) return c.length * 3.2;
  if (/^[A-Za-z0-9]+$/.test(c)) return c.length * 2.2;
  return c.length;
};
const estimate = (): Word[] => {
  const out: Word[] = [];
  let t = 0.12;
  LINES.forEach((ln, line) => {
    for (const w of ln.split(/\s+/).filter(Boolean)) {
      const d = (0.16 + 0.03 * spoken(w)) / 1.0;
      out.push({ w, s: t, e: t + d, line });
      t += d + (/[،؛…؟:.!]$/.test(w) ? 0.22 : 0.03);
    }
    t += 0.3;
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
export const END = VO_END + 2.8; // end card holds after the last word
export const FRAMES = Math.round(END * FPS);

const norm = (s: string) => s.replace(/[‌،؛…؟.:!]/g, "");
/** start of the nth word in `line` that contains `part` (falls back to the line start) */
export const wt = (line: number, part: string, nth = 0) => {
  const ws = WORDS.filter((w) => w.line === line && norm(w.w).includes(part));
  return (ws[nth] ?? ws[ws.length - 1])?.s ?? LINE_AT[line].s;
};
/** end of that word */
export const we = (line: number, part: string, nth = 0) => {
  const ws = WORDS.filter((w) => w.line === line && norm(w.w).includes(part));
  return (ws[nth] ?? ws[ws.length - 1])?.e ?? LINE_AT[line].e;
};
/** which line is on at t (the gap before a line belongs to it) */
export const lineAt = (t: number) => {
  for (let i = LINE_AT.length - 1; i >= 0; i--) if (t >= LINE_AT[i].s - 0.2) return i;
  return 0;
};
/** where each line's picture starts (a hair before its first word) */
export const cutAt = (i: number) => (i === 0 ? 0 : LINE_AT[i].s - 0.2);

// ─── captions: chunks of up to 4 words, breaking after punctuation; Latin runs (GTA VI) stay one token ───
const KEYS = ["PS5", "GTA VI", "۱۹۵", "۲۱", "۲۱۶", "سه", "صبحونه", "ناهار", "شام", "۳۵۰", "۶۲۰", "نخوری", "یک", "هشت", "۱۳", "اجاره", "قبض", "چایی", "جالب", "آمریکا", "آلمان", "ترکیه", "۱۲", "۱۶", "۴۴", "تو", "حاضری"];
export type Chunk = { a: number; b: number; line: number; words: { w: string; at: number; key: boolean; latin: boolean }[] };
export const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  LINES.forEach((_, line) => {
    const raw = WORDS.filter((w) => w.line === line);
    // merge consecutive Latin words
    const ws: Word[] = [];
    raw.forEach((w) => {
      const prev = ws[ws.length - 1];
      if (prev && /^[A-Za-z0-9]+$/.test(norm(prev.w)) && /^[A-Za-z0-9]+[؟!،.]?$/.test(w.w) && !/^[0-9]+$/.test(norm(w.w)) && /[A-Za-z]/.test(w.w)) {
        ws[ws.length - 1] = { ...prev, w: prev.w + " " + w.w, e: w.e };
      } else ws.push({ ...w });
    });
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      out.push({
        a: cur[0].s - 0.08,
        b: 0,
        line,
        words: cur.map((w) => {
          const n = norm(w.w);
          const key = KEYS.includes(n) && !(n === "تو" && line !== 11) && !(n === "سه" && line !== 3) && !(n === "یک" && line !== 7);
          return { w: w.w, at: w.s, key, latin: /[A-Za-z]/.test(w.w) };
        }),
      });
      cur = [];
    };
    ws.forEach((w) => {
      cur.push(w);
      if (cur.length >= 4 || /[،؛…؟:.!]$/.test(w.w)) flush();
    });
    flush();
  });
  out.forEach((c, i) => (c.b = i + 1 < out.length ? Math.min(out[i + 1].a, c.words[c.words.length - 1].at + 1.3) : VO_END + 0.3));
  return out;
})();
