// v51 timing: the user's narration (Gemini voice, sped to 1.2×), aligned once with ElevenLabs (videos/51/words.json),
// times divided by the tempo → vo.json { tempo, words: [{ w, s, e, line }] }. Lines = videos/51/script.txt.
import vo from "./vo.json";

export const FPS = 30;
export type Word = { w: string; s: number; e: number; line: number };
export const WORDS: Word[] = (vo as { words: Word[] }).words;

const lineWords = (n: number) => {
  const ws = WORDS.filter((w) => w.line === n);
  if (!ws.length) throw new Error(`v51: no words on line ${n}`);
  return ws;
};
/** line start / end (s) */
export const S = (n: number) => lineWords(n)[0].s;
export const E = (n: number) => { const ws = lineWords(n); return ws[ws.length - 1].e; };
/** onset of the (occ-th) word on line n that contains `needle` */
export const Wd = (n: number, needle: string, occ = 0) => {
  const ws = lineWords(n).filter((w) => w.w.includes(needle));
  if (!ws[occ]) throw new Error(`v51: «${needle}» not on line ${n}`);
  return ws[occ].s;
};
export const WdE = (n: number, needle: string, occ = 0) => {
  const ws = lineWords(n).filter((w) => w.w.includes(needle));
  if (!ws[occ]) throw new Error(`v51: «${needle}» not on line ${n}`);
  return ws[occ].e;
};
export const LAST_LINE = WORDS[WORDS.length - 1].line;
export const END = E(LAST_LINE) + 2.6;
export const FRAMES = Math.ceil(END * FPS);

// ---- easing / animation helpers (time in seconds) ----
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lin = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const back = (x: number) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
/** 0→1 entrance (fast in, soft landing) and 1→0 exit; visible between t0 and t1 */
export const life = (t: number, t0: number, t1: number, inDur = 0.35, outDur = 0.3) =>
  Math.min(easeOut(lin(t, t0, t0 + inDur)), 1 - easeIn(lin(t, t1 - outDur, t1)));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
