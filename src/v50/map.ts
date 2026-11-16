// v50 · نقشه‌ی ساده‌ی ایران روی کاغذ کهنه (داده: src/v50/geo.json از videos/50/build-geo.mjs)
import geo from "./geo.json";
import { BRICK, GOLD, PEACE, RGB, cl, eo, mix, rgba } from "./tree";

type Geo = { w: number; h: number; countries: { id: string; name: string; d: string }[]; provs: Record<string, string>; iraqBorder: string; cities: Record<string, [number, number]> };
const G = geo as unknown as Geo;

let cache: { land: Path2D; iran: Path2D; provs: Path2D; prov: Record<string, Path2D>; cc: Record<string, Path2D>; border: Path2D } | null = null;
const P = () => {
  if (cache) return cache;
  const land = new Path2D(), provs = new Path2D(), cc: Record<string, Path2D> = {}, prov: Record<string, Path2D> = {};
  let iran = new Path2D();
  for (const c of G.countries) {
    const p = new Path2D(c.d);
    cc[c.id] = p;
    if (c.id === "IRN") iran = p; else land.addPath(p);
  }
  for (const [k, d] of Object.entries(G.provs)) {
    const p = new Path2D(d);
    prov[k.split(":")[1]] = p;
    provs.addPath(p);
  }
  cache = { land, iran, provs, prov, cc, border: new Path2D(G.iraqBorder) };
  return cache;
};

// حالت نقشه در هر لحظه (همه ۰ تا ۱)
export type MapState = {
  a: number; // دیده‌شدن کل نقشه
  khuz: number; // جنگ ایران و عراق: خوزستان + مرز
  pulse: number; // تپش دوباره (نسل ۲)
  arrows: number; // ۱۹۴۱: دو پیکان
  powers: number; // جنگ جهانی اول: سه قدرت
  famine: number; // قحطی: نور کم
  peace: number; // نسل صلح
  bushehr: number; // ۱۸۵۶
  caucasus: number; // ۱۸۰۴–۱۸۲۸
};

export const MAP_BOX = { x: 540 - 235, y: 596, w: 470 }; // ارتفاع = w × h/1000
export const mapH = () => (MAP_BOX.w * G.h) / G.w;
export const cityXY = (k: string): [number, number] => {
  const s = MAP_BOX.w / G.w, [x, y] = G.cities[k];
  return [MAP_BOX.x + x * s, MAP_BOX.y + y * s];
};

const arrow = (c: CanvasRenderingContext2D, pts: [number, number][], k: number, col: RGB, lw: number, t: number) => {
  // پیکان خمیده‌ی سه‌نقطه‌ای که از دُم به سر رشد می‌کند
  if (k <= 0.01) return;
  const [a, m, b] = pts;
  const q = (u: number): [number, number] => {
    const v = 1 - u;
    return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1]];
  };
  const e = eo(k), N = 40;
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  c.strokeStyle = rgba(col, 0.95);
  c.lineWidth = lw;
  c.shadowColor = "rgba(10,6,3,0.9)";
  c.shadowBlur = 8;
  c.setLineDash([lw * 2.2, lw * 1.4]);
  c.lineDashOffset = -t * lw * 6;
  c.beginPath();
  for (let i = 0; i <= N; i++) {
    const [x, y] = q((i / N) * e);
    if (i) c.lineTo(x, y); else c.moveTo(x, y);
  }
  c.stroke();
  c.setLineDash([]);
  // سر پیکان
  const [hx, hy] = q(e), [px, py] = q(Math.max(0, e - 0.04));
  const ang = Math.atan2(hy - py, hx - px), hs = lw * 3.4;
  c.fillStyle = rgba(col, 1);
  c.beginPath();
  c.moveTo(hx + Math.cos(ang) * hs * 0.6, hy + Math.sin(ang) * hs * 0.6);
  c.lineTo(hx + Math.cos(ang + 2.5) * hs, hy + Math.sin(ang + 2.5) * hs);
  c.lineTo(hx + Math.cos(ang - 2.5) * hs, hy + Math.sin(ang - 2.5) * hs);
  c.closePath();
  c.fill();
  c.restore();
};

const label = (c: CanvasRenderingContext2D, txt: string, x: number, y: number, a: number, size = 26, col = "rgba(244,226,190,1)") => {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha = a;
  c.font = `700 ${size}px Vazirmatn`;
  c.direction = "rtl";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.shadowColor = "rgba(12,7,3,1)";
  c.shadowBlur = 10;
  c.fillStyle = col;
  c.fillText(txt, x, y);
  c.fillText(txt, x, y);
  c.restore();
};

const ring = (c: CanvasRenderingContext2D, x: number, y: number, k: number, t: number, col: RGB) => {
  if (k <= 0.01) return;
  c.save();
  for (let j = 0; j < 2; j++) {
    const u = ((t * 0.9 + j * 0.5) % 1);
    c.strokeStyle = rgba(col, 0.75 * (1 - u) * k);
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(x, y, 8 + 34 * u, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = rgba(col, k);
  c.beginPath();
  c.arc(x, y, 7 * eo(k), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = rgba([255, 240, 214], k);
  c.beginPath();
  c.arc(x, y, 2.6 * eo(k), 0, Math.PI * 2);
  c.fill();
  c.restore();
};

export function drawMap(c: CanvasRenderingContext2D, m: MapState, t: number) {
  if (m.a <= 0.01) return;
  const p = P();
  const s = MAP_BOX.w / G.w, h = mapH();
  const zoom = 1 + 0.025 * Math.sin(t * 0.25) + 0.02 * eo(m.a);
  const cx = MAP_BOX.x + MAP_BOX.w / 2, cy = MAP_BOX.y + h / 2;
  const light = 1 - 0.55 * m.famine;
  c.save();
  c.globalAlpha = m.a;
  // سایه‌ی بیضی پشت نقشه تا از زمینه جدا شود
  const bg = c.createRadialGradient(cx, cy, 0, cx, cy, 330);
  bg.addColorStop(0, "rgba(14,8,4,0.55)");
  bg.addColorStop(1, "rgba(14,8,4,0)");
  c.fillStyle = bg;
  c.fillRect(cx - 340, cy - 340, 680, 680);

  c.translate(cx, cy);
  c.scale(zoom, zoom);
  c.translate(-MAP_BOX.w / 2, -h / 2);
  c.scale(s, s);
  const px = 1 / s; // یک پیکسل صفحه در واحد نقشه

  // همسایه‌ها: لبه‌ها نرم محو می‌شوند (بدون قاب مستطیلی برش)
  const fadeG = (col: RGB, a: number) => {
    const g = c.createRadialGradient(500, 470, 0, 500, 470, 560);
    g.addColorStop(0, rgba(col, a));
    g.addColorStop(0.55, rgba(col, a));
    g.addColorStop(1, rgba(col, 0));
    return g;
  };
  c.fillStyle = fadeG(mix([62, 44, 26], [30, 20, 12], m.famine), 0.75);
  c.fill(p.land);
  c.strokeStyle = fadeG([226, 186, 110], 0.24 * light);
  c.lineWidth = 1.1 * px;
  c.stroke(p.land);
  // قفقاز
  if (m.caucasus > 0.01) {
    c.fillStyle = rgba(BRICK, 0.42 * m.caucasus);
    for (const id of ["GEO", "ARM", "AZE"]) if (p.cc[id]) c.fill(p.cc[id]);
  }
  // ایران
  const fillI = mix(mix([96, 70, 40], [128, 98, 58], m.peace), [44, 30, 18], m.famine);
  c.fillStyle = rgba(fillI, 0.92);
  c.fill(p.iran);
  c.strokeStyle = `rgba(242,184,96,${0.13 * light})`;
  c.lineWidth = 0.9 * px;
  c.stroke(p.provs);
  // خوزستان
  if (m.khuz > 0.01) {
    const pk = p.prov["Khuzestan"];
    if (pk) {
      c.fillStyle = rgba(BRICK, (0.5 + 0.25 * m.pulse) * m.khuz);
      c.fill(pk);
    }
  }
  c.save();
  c.shadowColor = rgba(m.peace > 0.01 ? PEACE : GOLD, 0.35 + 0.4 * m.peace);
  c.shadowBlur = 12 + 14 * m.peace;
  c.strokeStyle = rgba(mix(GOLD, PEACE, 0.6 * m.peace), 0.95 * light);
  c.lineWidth = 2.4 * px;
  c.stroke(p.iran);
  c.restore();
  // مرز عراق: رگه‌ی آجری که از شمال به جنوب کشیده می‌شود
  if (m.khuz > 0.01) {
    const L = 900;
    c.save();
    c.strokeStyle = rgba(mix(BRICK, [214, 132, 92], 0.5 * m.pulse), 0.95);
    c.lineWidth = 3.4 * px;
    c.lineCap = "round";
    c.shadowColor = rgba(BRICK, 0.8);
    c.shadowBlur = 10;
    c.setLineDash([L, L]);
    c.lineDashOffset = L * (1 - eo(m.khuz));
    c.stroke(p.border);
    c.restore();
  }
  c.restore();

  // برچسب‌ها و پیکان‌ها در مختصات صفحه
  c.save();
  c.globalAlpha = m.a;
  const C = cityXY;
  if (m.khuz > 0.01) label(c, "خوزستان", C("ahvaz")[0] + 6, C("ahvaz")[1] - 2, eo((m.khuz - 0.4) / 0.6), 24);
  if (m.arrows > 0.01) {
    const [qx, qy] = C("qazvin"), [ax, ay] = C("ahvaz");
    arrow(c, [[C("ganja")[0] + 20, C("ganja")[1] - 30], [C("tabriz")[0] + 60, C("tabriz")[1] - 40], [qx - 6, qy - 10]], m.arrows, [214, 138, 96], 6.5, t);
    arrow(c, [[C("gulf")[0] - 10, C("gulf")[1] + 20], [C("bushehr")[0] - 60, C("bushehr")[1] - 20], [ax + 8, ay + 14]], cl((m.arrows - 0.12) / 0.88), [214, 138, 96], 6.5, t);
    label(c, "شوروی", C("ganja")[0] + 30, C("ganja")[1] - 64, eo((m.arrows - 0.2) / 0.5), 26);
    label(c, "انگلیس", C("gulf")[0] + 20, C("gulf")[1] + 44, eo((m.arrows - 0.3) / 0.5), 26);
  }
  if (m.powers > 0.01) {
    const pw: [string, number, number, number][] = [
      ["روسیه", C("rasht")[0] - 34, C("rasht")[1] - 20, 0],
      ["عثمانی", C("kermanshah")[0] - 30, C("kermanshah")[1] + 4, 0.15],
      ["انگلیس", C("bushehr")[0] + 6, C("bushehr")[1] + 4, 0.3],
    ];
    for (const [n, x, y, d] of pw) {
      const k = eo((m.powers - d) / 0.45);
      ring(c, x, y, k, t + d, [214, 138, 96]);
      label(c, n, x, y - 34, k, 25);
    }
  }
  if (m.bushehr > 0.01) {
    const [bx, by] = C("bushehr");
    arrow(c, [[C("gulf")[0] + 40, C("gulf")[1] + 40], [C("gulf")[0] - 10, C("gulf")[1] + 6], [bx + 8, by + 10]], m.bushehr, [214, 138, 96], 6, t);
    ring(c, bx, by, eo((m.bushehr - 0.5) / 0.5), t, [214, 138, 96]);
    label(c, "بوشهر", bx - 52, by - 6, eo((m.bushehr - 0.5) / 0.5), 25);
    label(c, "خلیج فارس", C("gulf")[0] + 70, C("gulf")[1] + 56, 0.75 * eo((m.bushehr - 0.2) / 0.5), 21, "rgba(226,200,150,1)");
  }
  if (m.caucasus > 0.01) {
    const [ex, ey] = C("erevan"), [gx, gy] = C("ganja");
    const [tx, ty] = C("tbilisi");
    label(c, "قفقاز", (tx + ex) / 2 - 6, (ty + ey) / 2 + 4, eo((m.caucasus - 0.3) / 0.5), 27);
    arrow(c, [[gx + 70, gy - 70], [gx + 40, gy - 10], [C("tabriz")[0] + 10, C("tabriz")[1] - 18]], cl((m.caucasus - 0.15) / 0.85), [214, 138, 96], 6, t);
  }
  c.restore();
}
