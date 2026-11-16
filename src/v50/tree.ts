// v50 «چند نفر از اجدادت جنگ دیدن؟» · درخت ۱۰ نسله (بر پایه‌ی src/v15/tree.ts)
// state: L = نسل‌های باز‌شده (پیوسته، ۰ تا ۱۰)، t = زمان برای حرکت زنده، war[g] = رنگ جنگ نسل g (۰ تا ۱)، peace = درخشش نسل ۵
export const W = 1080, H = 1920, CX = 540, YR = 1490;
export const GMAX = 10;

export type RGB = [number, number, number];
export type Lay = { L: number; t: number; n: number; f: number; yTop: number; s: number; wMax: number; war: number[]; peace: number; dim: number; wave: number };

export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (a: number, b: number, x: number) => { const k = cl((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const pl = (keys: [number, number][], x: number) => {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) {
    const [a, va] = keys[i - 1], [b, vb] = keys[i];
    return va + (vb - va) * (x - a) / (b - a);
  }
  return keys[keys.length - 1][1];
};
export const h2 = (g: number, i: number) => {
  const v = Math.sin(g * 91.345 + (i % 65536) * 12.9898 + Math.floor(i / 65536) * 4.1414) * 43758.5453;
  return v - Math.floor(v);
};
export const fa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
export const faNum = (n: number) => fa(Math.round(n).toLocaleString("en-US").replace(/,/g, "٬"));
export const bornOf = (g: number) => 2000 - 30 * g; // متولد حدود (میلادی)
export const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const mix = (a: RGB, b: RGB, k: number): RGB => [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * k)) as RGB;

// رنگ‌ها: یک خانواده‌ی طلایی؛ جنگ = آجری کم‌رنگ (نه قرمز درخشان)
export const GOLD: RGB = [242, 184, 96];
export const DOT: RGB = [251, 233, 196];
export const BRICK: RGB = [176, 92, 64];
export const PEACE: RGB = [255, 244, 214];

// جای بالای درخت: تا نسل ۷ در نیمه‌ی پایین (بالایش نقشه)، از نسل ۸ تا لب متن بالا می‌رود
const Y_TOP: [number, number][] = [[0, 1400], [1, 1330], [2, 1262], [3, 1212], [4, 1168], [5, 1128], [6, 1094], [7, 1062], [8, 930], [9, 800], [10, 700]];
const W_MAX: [number, number][] = [[0, 160], [1, 250], [2, 330], [3, 380], [4, 410], [5, 430], [6, 445], [7, 460], [8, 480], [9, 494], [10, 505]];

// wave: موج نوری که از نسل ۱۰ به «تو» پایین می‌آید (برحسب نسل؛ −۹۹ = خاموش)
export function lay(L: number, t: number, war: number[], peace: number, dim = 0, wave = -99): Lay {
  const yTop = pl(Y_TOP, L);
  const s = (YR - 30 - yTop) / Math.max(L, 1);
  const n = Math.floor(L + 1e-6);
  return { L, t, n, f: L - n, yTop, s, wMax: pl(W_MAX, L), war, peace, dim, wave };
}
const waveAt = (st: Lay, g: number) => Math.exp(-Math.pow(g - st.wave, 2) / 0.9);

export const genY = (g: number, st: Lay) => {
  if (g === 0) return YR;
  const top = st.n + 1;
  if (g <= top) return YR - 30 - st.s * g;
  const yt = YR - 30 - st.s * top, sg = Math.max(st.s, 40);
  return yt - sg * (g - top);
};

function target(g: number, i: number, st: Lay): [number, number] {
  if (g === 0) return [CX, YR];
  const y = genY(g, st);
  const n2 = Math.pow(2, g);
  const u = (i + 0.5) / n2 + (h2(g, i) - 0.5) * (g >= 3 ? 0.7 : 0.25) / n2;
  const v = cl((YR - y) / (YR - st.yTop), 0, 1.8);
  const hw = v <= 1 ? st.wMax * Math.pow(v, 0.92) : st.wMax * (1 + 0.12 * (v - 1));
  let x = CX + (2 * u - 1) * hw;
  x += Math.sin(st.t * 0.7 + g * 1.3 + (i % 997) * 0.37) * Math.min(g, 6) * 0.6;
  return [x, y];
}

export function pos(g: number, i: number, st: Lay): [number, number] {
  const p1 = target(g, i, st);
  if (g !== st.n + 1) return p1;
  const p0 = target(g - 1, Math.floor(i / 2), st);
  const e = eo(st.f);
  return [p0[0] + (p1[0] - p0[0]) * e, p0[1] + (p1[1] - p0[1]) * e];
}

const edge = (c: CanvasRenderingContext2D, a: [number, number], b: [number, number]) => {
  const d = a[1] - b[1];
  c.moveTo(a[0], a[1]);
  c.bezierCurveTo(a[0], a[1] - d * 0.55, b[0], b[1] + d * 0.55, b[0], b[1]);
};

const lineCol = (k: number) => mix([246, 214, 150], [205, 160, 95], k);

// خط‌های بچه‌ها (نسل g) ← پدر و مادرشان (نسل g+1)
function band(c: CanvasRenderingContext2D, g: number, st: Lay, ghost: boolean) {
  const count = Math.pow(2, g + 1);
  const lw = Math.max(0.8, 3.4 * Math.pow(0.8, g));
  const hw = Math.max(40, Math.abs(target(g + 1, 0, st)[0] - CX));
  const d = (count * lw) / (2 * hw);
  let a = cl(0.81 / (1 + 1.3 * d), 0.05, 0.95);
  if (ghost) a = 0.2 * (0.55 + 0.45 * Math.min(1, 16 / count));
  // نسل صلح در پایان: شاخه‌های دیگر کمی کم‌نورتر
  if (!ghost) a *= 1 - 0.45 * st.dim * (g + 1 === 5 ? 0 : 1);
  const wb = ghost ? 0 : waveAt(st, g + 0.5);
  a += (0.95 - a) * 0.85 * wb;
  c.strokeStyle = rgba(mix(lineCol(cl(g / 10)), PEACE, Math.max(g + 1 === 5 ? 0.6 * st.peace : 0, 0.8 * wb)), a);
  c.lineWidth = ghost ? Math.max(0.7, lw * 0.7) : lw * (g + 1 === 5 ? 1 + 0.6 * st.peace : 1);
  c.lineCap = g >= 5 ? "butt" : "round";
  c.beginPath();
  const n2 = Math.pow(2, g);
  for (let i = 0; i < n2; i++) {
    const p = pos(g, i, st);
    edge(c, p, pos(g + 1, 2 * i, st));
    edge(c, p, pos(g + 1, 2 * i + 1, st));
  }
  c.stroke();
}

export function drawTree(c: CanvasRenderingContext2D, st: Lay, fade = 1, ghostOn = 1, ghostTop = 640) {
  c.save();
  c.globalAlpha = fade;
  c.globalCompositeOperation = "lighter";
  c.lineCap = "round";
  const top = st.n + 1; // نسلی که در حال رشد است
  // شاخه‌های کم‌رنگ آینده، فقط تا نسل ۱۰
  if (ghostOn > 0.01) {
    c.globalAlpha = fade * ghostOn;
    for (let g = top; g < GMAX; g++) {
      if (genY(g + 1, st) < ghostTop) break;
      band(c, g, st, true);
    }
    c.globalAlpha = fade;
  }
  for (let g = 0; g < Math.min(top, GMAX); g++) band(c, g, st, false);

  // خط درخشان بالای درخت (نسل در حال رشد)
  const bandA = cl((st.L - 0.6) * 2.5) * (st.L < GMAX - 0.02 ? 1 : 0.5);
  if (bandA > 0.01) {
    const yb = YR - 30 - st.s * (st.n + st.f);
    const x0 = CX - st.wMax - 60, x1 = CX + st.wMax + 60;
    const gr = c.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, rgba(GOLD, 0));
    gr.addColorStop(0.2, rgba(GOLD, 0.55 * bandA));
    gr.addColorStop(0.5, rgba(GOLD, 0.8 * bandA));
    gr.addColorStop(0.8, rgba(GOLD, 0.55 * bandA));
    gr.addColorStop(1, rgba(GOLD, 0));
    c.fillStyle = gr;
    c.fillRect(x0, yb - 2, x1 - x0, 4);
    const gv = c.createLinearGradient(0, yb - 30, 0, yb + 30);
    gv.addColorStop(0, rgba(GOLD, 0));
    gv.addColorStop(0.5, rgba(GOLD, 0.16 * bandA));
    gv.addColorStop(1, rgba(GOLD, 0));
    c.fillStyle = gv;
    c.fillRect(x0, yb - 30, x1 - x0, 60);
  }

  // پله‌ی هر نسل (برای نسل‌های ریز ۸ تا ۱۰ که نقطه ندارند): رنگ جنگ یا صلح
  c.globalCompositeOperation = "source-over";
  for (let g = 1; g <= Math.min(st.n, GMAX); g++) {
    const w = st.war[g] ?? 0, p = g === 5 ? st.peace : 0;
    if (g < 8 && p < 0.01) continue;
    const y = genY(g, st), hw = Math.abs(target(g, 0, st)[0] - CX) + 6;
    if (p > 0.01) {
      const gv = c.createLinearGradient(0, y - 26, 0, y + 26);
      gv.addColorStop(0, rgba(PEACE, 0));
      gv.addColorStop(0.5, rgba(PEACE, 0.2 * p));
      gv.addColorStop(1, rgba(PEACE, 0));
      c.fillStyle = gv;
      c.fillRect(CX - hw - 40, y - 26, 2 * hw + 80, 52);
    }
    if (g >= 8) {
      c.fillStyle = rgba(mix(DOT, BRICK, 0.85 * w), 0.55 * fade * (1 - 0.4 * st.dim));
      c.fillRect(CX - hw, y - 1.5, 2 * hw, 3);
    }
  }

  // نقطه‌ها (آدم‌ها): جنگ‌دیده‌ها آجری کم‌رنگ، نسل صلح روشن با هاله
  const gDots = Math.min(7, top);
  for (let g = gDots; g >= 1; g--) {
    const r = Math.max(2.4, 9 * Math.pow(0.8, g - 1));
    const a = g === top ? eo(st.f * 1.4) : 1;
    if (a <= 0.01) continue;
    const n2 = Math.pow(2, g);
    const w = st.war[g] ?? 0, p = g === 5 ? st.peace : 0;
    if (p > 0.01) {
      c.save();
      c.globalCompositeOperation = "lighter";
      for (let i = 0; i < n2; i++) {
        const [x, y] = pos(g, i, st);
        const rg = c.createRadialGradient(x, y, 0, x, y, 30);
        rg.addColorStop(0, rgba(PEACE, 0.4 * p * a));
        rg.addColorStop(1, rgba(PEACE, 0));
        c.fillStyle = rg;
        c.fillRect(x - 30, y - 30, 60, 60);
      }
      c.restore();
    }
    const col = p > 0.01 ? mix(DOT, PEACE, p) : mix(DOT, BRICK, 0.8 * w);
    c.fillStyle = rgba(col, 1);
    c.globalAlpha = fade * a * (1 - 0.35 * st.dim * (g === 5 ? 0 : 1));
    c.beginPath();
    const rr = r * (1 + 0.35 * p);
    for (let i = 0; i < n2; i++) {
      const [x, y] = pos(g, i, st);
      c.moveTo(x + rr, y);
      c.arc(x, y, rr, 0, Math.PI * 2);
    }
    c.fill();
  }
  c.globalAlpha = fade;

  // نور «تو»
  const pulse = (1 + 0.06 * Math.sin(st.t * 2.4)) * (1 + 1.3 * waveAt(st, 0));
  const rg = c.createRadialGradient(CX, YR, 0, CX, YR, 80 * pulse);
  rg.addColorStop(0, "rgba(250,200,120,0.85)");
  rg.addColorStop(0.35, "rgba(250,200,120,0.32)");
  rg.addColorStop(1, "rgba(250,200,120,0)");
  c.fillStyle = rg;
  const R = 82 * pulse;
  c.fillRect(CX - R, YR - R, 2 * R, 2 * R);
  c.fillStyle = "#FFF6E0";
  c.beginPath();
  c.arc(CX, YR, 11, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// سال تولد هر نسل (میلادی)، سمت چپ (سمت راست جای دکمه‌های اینستاگرام است)
export function drawAxis(c: CanvasRenderingContext2D, st: Lay, alpha: number) {
  if (alpha <= 0.01) return;
  c.save();
  c.font = "600 24px Vazirmatn";
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.direction = "ltr";
  c.shadowColor = "rgba(15,9,4,.95)";
  c.shadowBlur = 8;
  const top = Math.min(st.n + 1, GMAX);
  for (let g = 1; g <= top; g++) {
    let a = cl((st.s - 30) / 14);
    if (g === top && st.L < GMAX) a *= eo(st.f * 1.2);
    if (a <= 0.01) continue;
    const y = genY(g, st);
    c.globalAlpha = alpha * a;
    c.fillStyle = "rgba(232,205,150,.8)";
    c.fillRect(66, y - 1, 20, 2);
    c.fillText(fa(bornOf(g)), 94, y + 1);
  }
  c.restore();
}

// زمینه‌ی شجره‌نامه‌ی قدیمی (سبک ۴ ویدیوی ۱۵) + قاب
let grainCv: HTMLCanvasElement | null = null;
const grain = () => {
  if (grainCv) return grainCv;
  grainCv = document.createElement("canvas");
  grainCv.width = 540;
  grainCv.height = 960;
  const g = grainCv.getContext("2d")!;
  const im = g.createImageData(540, 960);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = Math.floor(h2(7, i / 4) * 255);
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
    im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return grainCv;
};
export function drawBg(c: CanvasRenderingContext2D, light = 0, gloom = 0) {
  c.fillStyle = "#140C06";
  c.fillRect(0, 0, W, H);
  const inner = mix([74, 53, 32], [104, 78, 48], light);
  const g = c.createRadialGradient(CX, 1000, 0, CX, 1000, 1300 * (1 - 0.25 * gloom));
  g.addColorStop(0, rgba(mix(inner, [40, 26, 16], gloom), 1));
  g.addColorStop(1, "#140C06");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.save();
  c.globalAlpha = 0.22;
  c.globalCompositeOperation = "overlay";
  c.drawImage(grain(), 0, 0, W, H);
  c.restore();
  c.save();
  c.strokeStyle = "rgba(226,186,110,0.55)";
  c.lineWidth = 2.5;
  c.strokeRect(34, 34, W - 68, H - 68);
  c.lineWidth = 1.2;
  c.strokeRect(48, 48, W - 96, H - 96);
  c.fillStyle = "rgba(226,186,110,0.6)";
  for (const [x, y] of [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]]) {
    c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-9, -9, 18, 18); c.restore();
  }
  c.restore();
}
