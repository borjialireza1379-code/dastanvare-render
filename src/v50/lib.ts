// v50 · helpers, colours, parchment background (from v15 «scroll» style)
export const W = 1080, H = 1920, CX = 540;
export type RGB = [number, number, number];
export type Pt = [number, number];

export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (a: number, b: number, x: number) => { const k = cl((x - a) / (b - a)); return k * k * (3 - 2 * k); };
export const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
export const eio = (x: number) => { const k = cl(x); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const h2 = (g: number, i: number) => {
  const v = Math.sin(g * 91.345 + i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};
export const fa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
export const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const mix = (a: RGB, b: RGB, k: number): RGB => [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * k)) as RGB;

// طلایی = ایران، آجری = طرف مقابل
export const GOLD: RGB = [242, 190, 104];
export const BRICK: RGB = [216, 128, 88];
export const CREAM: RGB = [251, 235, 203];
export const HOT: RGB = [255, 238, 200];

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

export function drawBg(c: CanvasRenderingContext2D) {
  c.fillStyle = "#140C06";
  c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(CX, 1050, 0, CX, 1050, 1300);
  g.addColorStop(0, "#3E2C1A");
  g.addColorStop(1, "#140C06");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

// دانه‌ی کاغذ + سایه‌ی بالا و پایین (برای خوانایی متن) + قاب دوخط
export function drawOver(c: CanvasRenderingContext2D, topShade = 1) {
  c.save();
  const t = c.createLinearGradient(0, 0, 0, 640);
  t.addColorStop(0, `rgba(20,12,6,${0.96 * topShade})`);
  t.addColorStop(0.62, `rgba(20,12,6,${0.82 * topShade})`);
  t.addColorStop(1, "rgba(20,12,6,0)");
  c.fillStyle = t;
  c.fillRect(0, 0, W, 640);
  const b = c.createLinearGradient(0, 1500, 0, H);
  b.addColorStop(0, "rgba(20,12,6,0)");
  b.addColorStop(0.45, "rgba(20,12,6,0.85)");
  b.addColorStop(1, "rgba(20,12,6,0.97)");
  c.fillStyle = b;
  c.fillRect(0, 1500, W, H - 1500);
  const v = c.createRadialGradient(CX, 1060, 500, CX, 1060, 1150);
  v.addColorStop(0, "rgba(20,12,6,0)");
  v.addColorStop(1, "rgba(20,12,6,0.55)");
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.2;
  c.globalCompositeOperation = "overlay";
  c.drawImage(grain(), 0, 0, W, H);
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
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
