// v50 · نقشه‌ی منطقه (یونان تا هند) با دوربین، و ابزار موشن جنگ‌ها (پیکان، موشک، پین، محاصره، کشتی…)
import geo from "./geo2.json";
import { BRICK, CX, GOLD, HOT, Pt, RGB, cl, eo, rgba, sm } from "./lib";

type Geo = { w: number; h: number; bb: number[]; k: number; s: number; land: string; iran: string; rivers: string };
const G = geo as unknown as Geo;
export const MAP_CY = 1060; // مرکز دوربین روی صفحه

let paths: { land: Path2D; iran: Path2D; rivers: Path2D } | null = null;
const P2 = () => (paths ??= { land: new Path2D(G.land), iran: new Path2D(G.iran), rivers: new Path2D(G.rivers) });

// lon/lat → px جهان
export const wp = ([lon, lat]: Pt): Pt => [(lon - G.bb[0]) * G.k * G.s, (G.bb[3] - lat) * G.s];

export type Cam = { x: number; y: number; z: number }; // مرکز (px جهان) و زوم
export const camAt = (lon: number, lat: number, z: number): Cam => { const [x, y] = wp([lon, lat]); return { x, y, z }; };
export const toScreen = (cam: Cam) => (ll: Pt): Pt => { const [x, y] = wp(ll); return [CX + (x - cam.x) * cam.z, MAP_CY + (y - cam.y) * cam.z]; };

let off: HTMLCanvasElement | null = null;
export function drawRegion(main: CanvasRenderingContext2D, cam: Cam, iranGlow: number, t: number) {
  // نقشه روی بوم جدا کشیده می‌شود تا لبه‌های مستطیلی برش داده‌ها نرم محو شوند
  off ??= Object.assign(document.createElement("canvas"), { width: main.canvas.width, height: main.canvas.height });
  const c = off.getContext("2d")!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, off.width, off.height);
  drawLand(c, cam, iranGlow, t);
  const X = (x: number) => CX + (x - cam.x) * cam.z, Y = (y: number) => MAP_CY + (y - cam.y) * cam.z;
  const f = 150 * cam.z, BIG = 4000;
  c.save();
  c.globalCompositeOperation = "destination-out";
  const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(rx, ry, rw, rh);
  };
  const xl = X(0), xr = X(G.w), yt = Y(0), yb = Y(G.h);
  edge(xl, 0, xl + f, 0, xl - BIG, -BIG, BIG + f, 3 * BIG);
  edge(xr, 0, xr - f, 0, xr - f, -BIG, BIG + f, 3 * BIG);
  edge(0, yt, 0, yt + f, -BIG, yt - BIG, 3 * BIG, BIG + f);
  edge(0, yb, 0, yb - f, -BIG, yb - f, 3 * BIG, BIG + f);
  c.restore();
  main.drawImage(off, 0, 0);
}

function drawLand(c: CanvasRenderingContext2D, cam: Cam, iranGlow: number, t: number) {
  const p = P2();
  c.save();
  c.setTransform(cam.z, 0, 0, cam.z, CX - cam.x * cam.z, MAP_CY - cam.y * cam.z);
  const px = 1 / cam.z;
  // خشکی: قهوه‌ای روشن‌تر از دریا، ساحل طلایی
  c.fillStyle = "rgba(92,66,38,0.88)";
  c.fill(p.land);
  // ایران امروز: کمی روشن‌تر + خط‌چین
  c.fillStyle = `rgba(150,112,62,${0.18 + 0.22 * iranGlow})`;
  c.fill(p.iran);
  c.strokeStyle = "rgba(15,9,4,0.6)";
  c.lineWidth = 4 * px;
  c.stroke(p.land);
  c.strokeStyle = "rgba(232,190,112,0.85)";
  c.lineWidth = 1.6 * px;
  c.stroke(p.land);
  c.strokeStyle = "rgba(170,200,210,0.16)";
  c.lineWidth = 1.2 * px;
  c.stroke(p.rivers);
  c.setLineDash([7 * px, 6 * px]);
  c.lineDashOffset = -t * 6 * px;
  c.strokeStyle = `rgba(242,200,120,${0.4 + 0.4 * iranGlow})`;
  c.lineWidth = 1.8 * px;
  c.stroke(p.iran);
  c.setLineDash([]);
  c.restore();
}

/* ---------------- ابزار موشن (همه در مختصات صفحه) ---------------- */
export type Ctx = { c: CanvasRenderingContext2D; S: (ll: Pt) => Pt; k: number; t: number; scar: number; z: number };
// scar > 0: فقط ردِ ثابت و کم‌رنگ (بعد از تمام شدن جنگ، روی نقشه می‌ماند)

const bez = (pts: Pt[], u: number): Pt => {
  // منحنی نرم از چند نقطه (Catmull-Rom → نقطه در u)
  const n = pts.length - 1;
  const f = cl(u) * n, i = Math.min(n - 1, Math.floor(f)), s = f - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const s2 = s * s, s3 = s2 * s;
  const q = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * s + (2 * a - 5 * b + 4 * c2 - d) * s2 + (-a + 3 * b - 3 * c2 + d) * s3);
  return [q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])];
};

/** پیکان لشکرکشی روی مسیر (lon/lat)، از a تا b در پیشرفت k رشد می‌کند */
export function march(x: Ctx, route: Pt[], a: number, b: number, col: RGB, lw0 = 7) {
  const lw = lw0 * 1.3;
  const { c } = x;
  const pts = route.map(x.S);
  const k = x.scar ? 1 : eo(cl((x.k - a) / (b - a)));
  if (k <= 0.005) return;
  const N = 60;
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  if (x.scar) {
    c.globalAlpha = x.scar;
    c.strokeStyle = rgba(col, 1);
    c.lineWidth = lw * (0.35 + 0.4 * x.scar);
  } else {
    c.strokeStyle = "rgba(12,7,3,0.55)";
    c.lineWidth = lw + 5;
    c.beginPath();
    for (let i = 0; i <= N; i++) { const [px, py] = bez(pts, (i / N) * k); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
    c.strokeStyle = rgba(col, 0.97);
    c.lineWidth = lw;
    c.shadowColor = rgba(col, 0.55);
    c.shadowBlur = 12;
    c.setLineDash([lw * 2.4, lw * 1.2]);
    c.lineDashOffset = -x.t * lw * 7;
  }
  c.beginPath();
  for (let i = 0; i <= N; i++) { const [px, py] = bez(pts, (i / N) * k); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
  c.stroke();
  c.setLineDash([]);
  const [hx, hy] = bez(pts, k), [qx, qy] = bez(pts, Math.max(0, k - 0.02));
  const ang = Math.atan2(hy - qy, hx - qx), hs = (x.scar ? lw * 0.45 : lw) * 2.8;
  c.fillStyle = rgba(col, 1);
  c.beginPath();
  c.moveTo(hx + Math.cos(ang) * hs * 0.7, hy + Math.sin(ang) * hs * 0.7);
  c.lineTo(hx + Math.cos(ang + 2.5) * hs, hy + Math.sin(ang + 2.5) * hs);
  c.lineTo(hx + Math.cos(ang - 2.5) * hs, hy + Math.sin(ang - 2.5) * hs);
  c.closePath();
  c.fill();
  c.restore();
}

/** موشک یا پهپاد: قوس از A به B، سر نورانی با دنباله، در هدف یک موج */
export function missile(x: Ctx, from: Pt, to: Pt, a: number, b: number, col: RGB, lift = 0.32) {
  const { c } = x;
  const A = x.S(from), B = x.S(to);
  const d = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const M: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - d * lift];
  const q = (u: number): Pt => { const v = 1 - u; return [v * v * A[0] + 2 * v * u * M[0] + u * u * B[0], v * v * A[1] + 2 * v * u * M[1] + u * u * B[1]]; };
  c.save();
  if (x.scar) {
    c.globalAlpha = x.scar * 0.8;
    c.strokeStyle = rgba(col, 1);
    c.lineWidth = 1.6;
    c.setLineDash([4, 5]);
    c.beginPath();
    for (let i = 0; i <= 30; i++) { const [px, py] = q(i / 30); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.stroke();
    c.restore();
    return;
  }
  const u = cl((x.k - a) / (b - a));
  if (u <= 0) { c.restore(); return; }
  const e = Math.min(1, u * 1.15);
  // دنباله
  const t0 = Math.max(0, e - 0.4);
  for (let i = 0; i < 16; i++) {
    const u0 = t0 + ((e - t0) * i) / 16, u1 = t0 + ((e - t0) * (i + 1)) / 16;
    const [x0, y0] = q(u0), [x1, y1] = q(u1);
    c.strokeStyle = rgba(col, (0.85 * (i + 1)) / 16 * (e < 1 ? 1 : Math.max(0, 1 - (u * 1.15 - 1) * 4)));
    c.lineWidth = 1.5 + (5 * (i + 1)) / 16;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  if (e < 1) {
    const [hx, hy] = q(e);
    const g = c.createRadialGradient(hx, hy, 0, hx, hy, 26);
    g.addColorStop(0, rgba(HOT, 1));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.fillRect(hx - 26, hy - 26, 52, 52);
  } else {
    const w = cl((u * 1.15 - 1) / 0.15);
    c.strokeStyle = rgba(HOT, 0.9 * (1 - w));
    c.lineWidth = 3;
    c.beginPath(); c.arc(B[0], B[1], 6 + 30 * eo(w), 0, Math.PI * 2); c.stroke();
    c.fillStyle = rgba(col, 0.9 * (1 - w * 0.6));
    c.beginPath(); c.arc(B[0], B[1], 5, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/** نقطه‌ی مهم با موج و برچسب */
export function pin(x: Ctx, ll: Pt, a: number, label: string, col: RGB = GOLD, side: "r" | "l" | "t" | "b" = "r", size = 28) {
  if (x.scar) return;
  const { c } = x;
  const k = eo(cl((x.k - a) / 0.18));
  if (k <= 0.01) return;
  const [px, py] = x.S(ll);
  c.save();
  for (let j = 0; j < 2; j++) {
    const u = (x.t * 0.9 + j * 0.5) % 1;
    c.strokeStyle = rgba(col, 0.7 * (1 - u) * k);
    c.lineWidth = 2.5;
    c.beginPath(); c.arc(px, py, 7 + 30 * u, 0, Math.PI * 2); c.stroke();
  }
  c.fillStyle = rgba(col, k);
  c.beginPath(); c.arc(px, py, 7 * k, 0, Math.PI * 2); c.fill();
  c.fillStyle = rgba(HOT, k);
  c.beginPath(); c.arc(px, py, 2.8 * k, 0, Math.PI * 2); c.fill();
  c.restore();
  const off = 20 + size * 0.5;
  const [lx, ly] = side === "r" ? [px + off, py] : side === "l" ? [px - off, py] : side === "t" ? [px, py - off] : [px, py + off];
  label2(c, label, lx, ly, k, size, side === "r" ? "left" : side === "l" ? "right" : "center");
}

export function label2(c: CanvasRenderingContext2D, txt: string, x: number, y: number, a: number, size = 28, align: CanvasTextAlign = "center", col = "rgba(251,235,203,1)") {
  if (a <= 0.01 || !txt) return;
  c.save();
  c.globalAlpha = a;
  c.font = `800 ${size}px Vazirmatn`;
  c.direction = "rtl";
  c.textAlign = align;
  c.textBaseline = "middle";
  c.lineJoin = "round";
  c.strokeStyle = "rgba(14,8,4,0.92)";
  c.lineWidth = 7;
  c.strokeText(txt, x, y);
  c.fillStyle = col;
  c.fillText(txt, x, y);
  c.restore();
}

/** برچسب آزاد روی نقشه (نام طرف‌ها) */
export function tag(x: Ctx, ll: Pt, a: number, txt: string, col: RGB = BRICK, size = 30) {
  if (x.scar) return;
  const k = eo(cl((x.k - a) / 0.2));
  const [px, py] = x.S(ll);
  label2(x.c, txt, px, py - 8 * (1 - k), k, size, "center", rgba(col, 1));
}

/** حلقه‌ی محاصره دور یک شهر */
export function siege(x: Ctx, ll: Pt, a: number, b: number, col: RGB = BRICK) {
  const { c } = x;
  const [px, py] = x.S(ll);
  const k = x.scar ? 1 : eo(cl((x.k - a) / (b - a)));
  if (k <= 0.01) return;
  c.save();
  c.globalAlpha = x.scar ? x.scar : 1;
  const r = 120 - 62 * k;
  c.strokeStyle = rgba(col, 0.95);
  c.lineWidth = x.scar ? 2 : 6;
  c.setLineDash([16, 10]);
  c.lineDashOffset = -x.t * 40;
  c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2 * k); c.stroke();
  c.restore();
}

/** دو پیکان به هم می‌رسند: جرقه */
export function clash(x: Ctx, ll: Pt, a: number) {
  if (x.scar) return;
  const { c } = x;
  const u = cl((x.k - a) / 0.3);
  if (u <= 0) return;
  const [px, py] = x.S(ll);
  c.save();
  c.strokeStyle = rgba(HOT, 1 - u * 0.7);
  c.lineWidth = 3;
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + 0.3;
    const r0 = 10 + 20 * eo(u), r1 = r0 + 22 * (1 - u * 0.6);
    c.beginPath(); c.moveTo(px + Math.cos(ang) * r0, py + Math.sin(ang) * r0); c.lineTo(px + Math.cos(ang) * r1, py + Math.sin(ang) * r1); c.stroke();
  }
  c.restore();
}

/** خط جبهه‌ی زیگزاگ که کشیده می‌شود */
export function front(x: Ctx, pts: Pt[], a: number, b: number, col: RGB = BRICK) {
  const { c } = x;
  const k = x.scar ? 1 : eo(cl((x.k - a) / (b - a)));
  if (k <= 0.01) return;
  const S = pts.map(x.S);
  c.save();
  c.globalAlpha = x.scar ? x.scar : 1;
  c.strokeStyle = rgba(col, 0.95);
  c.lineWidth = x.scar ? 2 : 4;
  c.lineJoin = "miter";
  c.beginPath();
  const N = 80;
  for (let i = 0; i <= N * k; i++) {
    const [px, py] = bez(S, i / N);
    const [qx, qy] = bez(S, Math.min(1, (i + 1) / N));
    const nx = -(qy - py), ny = qx - px, nl = Math.hypot(nx, ny) || 1;
    const z = (i % 2 ? 1 : -1) * 7;
    const X = px + (nx / nl) * z, Y = py + (ny / nl) * z;
    if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
  }
  c.stroke();
  c.restore();
}

/** کشتی‌های کوچک روی یک مسیر */
export function ships(x: Ctx, route: Pt[], a: number, b: number, n: number, col: RGB) {
  if (x.scar) return;
  const { c } = x;
  const S = route.map(x.S);
  const k = cl((x.k - a) / (b - a));
  if (k <= 0) return;
  for (let i = 0; i < n; i++) {
    const u = cl(k * 1.1 - i * 0.08);
    if (u <= 0) continue;
    const [px, py] = bez(S, eo(u));
    const [qx] = bez(S, Math.min(1, eo(u) + 0.02));
    const dir = qx >= px ? 1 : -1;
    const ox = (i % 2 ? 14 : -14), oy = (i % 3) * 12 - 12;
    c.save();
    c.translate(px + ox, py + oy + Math.sin(x.t * 4 + i) * 1.5);
    c.scale(dir, 1);
    c.fillStyle = rgba(col, 1);
    c.strokeStyle = "rgba(14,8,4,0.9)";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(15, 0); c.lineTo(10, 7); c.lineTo(-11, 7); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-1, -1); c.lineTo(-1, -22); c.lineTo(11, -4); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
}

/** سواره‌نظام کمان‌دار که دور یک نقطه می‌چرخد (حران) */
export function circling(x: Ctx, ll: Pt, a: number, col: RGB) {
  if (x.scar) return;
  const { c } = x;
  const k = eo(cl((x.k - a) / 0.25));
  if (k <= 0.01) return;
  const [px, py] = x.S(ll);
  c.save();
  for (let i = 0; i < 3; i++) {
    const a0 = x.t * 2.2 + (i * Math.PI * 2) / 3;
    c.strokeStyle = rgba(col, 0.95 * k);
    c.lineWidth = 6;
    c.lineCap = "round";
    c.beginPath(); c.arc(px, py, 95, a0, a0 + 1.3 * k); c.stroke();
    const hx = px + Math.cos(a0 + 1.3 * k) * 95, hy = py + Math.sin(a0 + 1.3 * k) * 95;
    const ang = a0 + 1.3 * k + Math.PI / 2;
    c.fillStyle = rgba(col, k);
    c.beginPath();
    c.moveTo(hx + Math.cos(ang) * 14, hy + Math.sin(ang) * 14);
    c.lineTo(hx + Math.cos(ang + 2.5) * 13, hy + Math.sin(ang + 2.5) * 13);
    c.lineTo(hx + Math.cos(ang - 2.5) * 13, hy + Math.sin(ang - 2.5) * 13);
    c.closePath(); c.fill();
    // تیرها به سمت مرکز
    for (let j = 0; j < 3; j++) {
      const u = (x.t * 1.6 + j / 3 + i * 0.21) % 1;
      const r = 95 - 70 * u;
      const aa = a0 + 0.4 * j;
      c.strokeStyle = rgba(col, 0.8 * (1 - u) * k);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px + Math.cos(aa) * r, py + Math.sin(aa) * r);
      c.lineTo(px + Math.cos(aa) * (r - 14), py + Math.sin(aa) * (r - 14));
      c.stroke();
    }
  }
  c.restore();
}

/** ناحیه‌ی ازدست‌رفته: لکه‌ی آجری هاشورخورده */
export function zone(x: Ctx, poly: Pt[], a: number, col: RGB = BRICK) {
  const { c } = x;
  const k = x.scar ? 1 : eo(cl((x.k - a) / 0.3));
  if (k <= 0.01) return;
  const S = poly.map(x.S);
  c.save();
  c.globalAlpha = (x.scar ? x.scar * 0.6 : 1) * k;
  c.beginPath();
  S.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
  c.closePath();
  c.fillStyle = rgba(col, 0.28);
  c.fill();
  c.clip();
  c.strokeStyle = rgba(col, 0.5);
  c.lineWidth = 2;
  const off = (x.t * 20) % 22;
  for (let i = -1200; i < 1200; i += 22) { c.beginPath(); c.moveTo(i + off, 0); c.lineTo(i + off + 900, 1920); c.stroke(); }
  c.restore();
}

/** خط مرز تازه */
export function border(x: Ctx, pts: Pt[], a: number, col: RGB = GOLD) {
  const { c } = x;
  const k = x.scar ? 1 : eo(cl((x.k - a) / 0.3));
  if (k <= 0.01) return;
  const S = pts.map(x.S);
  c.save();
  c.globalAlpha = x.scar ? x.scar : 1;
  c.strokeStyle = rgba(col, 1);
  c.lineWidth = x.scar ? 2 : 5;
  c.shadowColor = rgba(col, 0.7);
  c.shadowBlur = 10;
  c.beginPath();
  const N = 40;
  for (let i = 0; i <= N * k; i++) { const [px, py] = bez(S, i / N); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
  c.stroke();
  c.restore();
}

/** سه حلقه‌ی قدرت (جنگ جهانی اول) */
export function power(x: Ctx, ll: Pt, a: number, txt: string, col: RGB = BRICK) {
  if (x.scar) return;
  const { c } = x;
  const k = eo(cl((x.k - a) / 0.2));
  if (k <= 0.01) return;
  const [px, py] = x.S(ll);
  c.save();
  c.fillStyle = "rgba(20,12,6,0.85)";
  c.strokeStyle = rgba(col, k);
  c.lineWidth = 4;
  c.beginPath(); c.arc(px, py, 30 * k, 0, Math.PI * 2); c.fill(); c.stroke();
  // ستاره‌ی ساده (نشان نظامی)
  c.fillStyle = rgba(col, k);
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 7 : 16, an = (i * Math.PI) / 5 - Math.PI / 2;
    const X = px + Math.cos(an) * r * k, Y = py + Math.sin(an) * r * k;
    if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
  }
  c.closePath(); c.fill();
  c.restore();
  label2(c, txt, px, py + 54, k, 28, "center", rgba(col, 1));
}

/** نماد ساده: استوانه‌ی کوروش، گنبد، توپ … (خط طلایی) */
export function glyph(x: Ctx, ll: Pt, a: number, kind: "cylinder" | "dome" | "cannon" | "crown", dx = 0, dy = -80) {
  if (x.scar) return;
  const { c } = x;
  const k = eo(cl((x.k - a) / 0.3));
  if (k <= 0.01) return;
  const [p0, p1] = x.S(ll);
  const px = p0 + dx, py = p1 + dy;
  c.save();
  c.translate(px, py);
  c.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k);
  c.globalAlpha = k;
  c.strokeStyle = rgba(GOLD, 1);
  c.fillStyle = "rgba(20,12,6,0.85)";
  c.lineWidth = 3.5;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.shadowColor = rgba(GOLD, 0.6);
  c.shadowBlur = 10;
  if (kind === "cylinder") {
    c.beginPath(); c.ellipse(0, 0, 62, 30, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const y = i * 9, w = 52 * Math.sqrt(1 - (y / 30) ** 2);
      c.beginPath();
      for (let s = -w; s < w; s += 7) { c.moveTo(s, y); c.lineTo(s + 4 * (0.5 + h2s(i, s)), y); }
      c.stroke();
    }
  } else if (kind === "dome") {
    c.beginPath(); c.moveTo(-50, 30); c.lineTo(50, 30); c.stroke();
    c.beginPath(); c.moveTo(-30, 30); c.lineTo(-30, 4); c.lineTo(30, 4); c.lineTo(30, 30); c.stroke();
    c.beginPath(); c.moveTo(-24, 4); c.bezierCurveTo(-24, -20, -6, -28, 0, -40); c.bezierCurveTo(6, -28, 24, -20, 24, 4); c.stroke();
    c.beginPath(); c.moveTo(-42, 30); c.lineTo(-42, -24); c.moveTo(42, 30); c.lineTo(42, -24); c.stroke();
  } else if (kind === "cannon") {
    c.beginPath(); c.arc(-14, 14, 13, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-26, 4); c.lineTo(34, -14); c.lineTo(36, -4); c.lineTo(-22, 16); c.closePath(); c.fill(); c.stroke();
    const u = (x.t * 1.4) % 1;
    c.fillStyle = rgba(HOT, 0.7 * (1 - u));
    c.beginPath(); c.arc(46 + 30 * u, -18 - 10 * u, 8 + 14 * u, 0, Math.PI * 2); c.fill();
  } else if (kind === "crown") {
    c.beginPath(); c.moveTo(-34, 18); c.lineTo(-34, -10); c.lineTo(-17, 6); c.lineTo(0, -20); c.lineTo(17, 6); c.lineTo(34, -10); c.lineTo(34, 18); c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
}
const h2s = (i: number, s: number) => { const v = Math.sin(i * 17.1 + s * 3.7) * 9999; return v - Math.floor(v); };

/** «ایران امروز» در هوک و پایان: نور نرم روی مرکز ایران */
export function iranHalo(c: CanvasRenderingContext2D, cam: Cam, a: number) {
  if (a <= 0.01) return;
  const [px, py] = toScreen(cam)([53.5, 32.5]);
  const r = 330 * cam.z;
  const g = c.createRadialGradient(px, py, 0, px, py, r);
  g.addColorStop(0, `rgba(250,205,120,${0.22 * a})`);
  g.addColorStop(1, "rgba(250,205,120,0)");
  c.save();
  c.globalCompositeOperation = "lighter";
  c.fillStyle = g;
  c.fillRect(px - r, py - r, 2 * r, 2 * r);
  c.restore();
}
export { sm };
