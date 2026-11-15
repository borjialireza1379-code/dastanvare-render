// v48 timing: words of the user's own voiceover (1.25×), aligned once → vo.json { words: [{ w, s, e, line }] }.
import vo from "./vo.json";

export const FPS = 30;
// the user's text, verbatim (videos/48/script.txt)
export const LINES = [
  "۵ دروغی که ایرانیا هر روز میگن!",
  "«تو راهم!»",
  "طرف هنوز زیر پتوئه، ولی از نظر خودش تا دو دقیقه دیگه می‌رسه!",
  "«قابل نداره!»",
  "آره، قابل نداره... فقط آخرش باید یه قسط وام براش بدی!",
  "«یه روز حتماً بریم بیرون!»",
  "این «یه روز» رو از بچگی داریم می‌شنویم، هنوز تاریخش مشخص نشده!",
  "«نه بابا، من سیرم!»",
  "بعد می‌گه فقط یه گاز از غذات بزنم... آخرش باید سفارش غذای جدید بدی!",
  "«از فردا شروع می‌کنم!»",
  "این جمله رو انقدر گفتیم که فردا دیگه حاضر نیست باهامون همکاری کنه!",
  "حالا بگو، کدومو بیشتر میگی؟",
  "دروغ شیشمی رو تو اضافه کن؟",
];

export type Word = { w: string; s: number; e: number; line: number };
export const WORDS: Word[] = (vo as { words: Word[] }).words;
export const LINE_AT = LINES.map((_, i) => {
  const ws = WORDS.filter((w) => w.line === i);
  return { s: ws[0].s, e: ws[ws.length - 1].e };
});
export const VO_END = LINE_AT[LINE_AT.length - 1].e;
export const END = VO_END + 2.8; // end card holds after the last word
export const FRAMES = Math.round(END * FPS);

export const norm = (s: string) => s.replace(/[‌،؛…؟.:!«»]/g, "");
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
/** start of the i-th word of a line */
export const wi = (line: number, i: number) => WORDS.filter((w) => w.line === line)[i]?.s ?? LINE_AT[line].s;
/** which line is on at t (the gap before a line belongs to it) */
export const lineAt = (t: number) => {
  for (let i = LINE_AT.length - 1; i >= 0; i--) if (t >= LINE_AT[i].s - 0.2) return i;
  return 0;
};
/** where each line's picture starts (a hair before its first word) */
export const cutAt = (i: number) => (i === 0 ? 0 : LINE_AT[i].s - 0.2);
/** the «دروغ!» stamp of lie n (1–5) lands just after its punchline */
export const stampAt = (n: number) => LINE_AT[n * 2].e + 0.12;

// ─── captions: chunks of up to 4 words, breaking after punctuation ───
const KEYS = ["پتوئه", "دو", "دقیقه", "قسط", "وام", "بچگی", "تاریخش", "گاز", "سفارش", "جدید", "فردا", "همکاری", "کدومو", "شیشمی", "اضافه"];
export type Chunk = { a: number; b: number; line: number; words: { w: string; at: number; key: boolean }[] };
export const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  LINES.forEach((_, line) => {
    const ws = WORDS.filter((w) => w.line === line);
    let cur: Word[] = [];
    const flush = () => {
      if (!cur.length) return;
      out.push({ a: cur[0].s - 0.08, b: 0, line, words: cur.map((w) => ({ w: w.w, at: w.s, key: KEYS.includes(norm(w.w)) })) });
      cur = [];
    };
    ws.forEach((w) => {
      cur.push(w);
      if (cur.length >= 4 || /[،؛…؟:.!]»?$/.test(w.w)) flush();
    });
    flush();
  });
  out.forEach((c, i) => (c.b = i + 1 < out.length ? Math.min(out[i + 1].a, c.words[c.words.length - 1].at + 1.3) : VO_END + 0.3));
  return out;
})();
