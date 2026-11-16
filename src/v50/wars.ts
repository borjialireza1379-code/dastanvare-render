// v50 · ۱۸ جنگ بزرگ ایران، از جدید به قدیم (منبع: videos/50/data/wars.md)
// طلایی = ایران، آجری = طرف مقابل. k = پیشرفت موشن همان جنگ (۰ تا ۱).
import { BRICK, GOLD, Pt } from "./lib";
import { Ctx, border, circling, clash, front, glyph, march, missile, pin, power, ships, siege, tag, zone } from "./region";

export type War = {
  year: number; // منفی = پیش از میلاد
  name: string;
  sub: string;
  ticker?: { unit: string; to: number }; // شمارنده‌ی روز/سال
  cam: [number, number, number]; // lon, lat, zoom
  dur: number;
  draw: (x: Ctx) => void;
};

// جاها (lon, lat)
const L: Record<string, Pt> = {
  tehran: [51.39, 35.69], isfahan: [51.67, 32.65], natanz: [51.92, 33.72], fordow: [50.99, 34.88], tabriz: [46.29, 38.08], bandar: [56.27, 27.18],
  hormuz: [56.45, 26.55], bushehr: [50.84, 28.97], ahvaz: [48.67, 31.32], khorram: [48.18, 30.44], basra: [47.8, 30.5], baghdad: [44.36, 33.31],
  telaviv: [34.85, 32.05], udeid: [51.31, 25.12], bahrain: [50.6, 26.1], arabsea: [59.5, 22.0], med: [33.0, 34.4], qazvin: [50.0, 36.27],
  mashhad: [59.6, 36.3], kermanshah: [47.07, 34.31], rasht: [49.58, 37.28], urmia: [45.07, 37.55], tbilisi: [44.79, 41.72], ganja: [46.36, 40.68],
  erevan: [44.51, 40.18], karnal: [76.98, 29.69], kandahar: [65.7, 31.6], kabul: [69.2, 34.5], lahore: [74.3, 31.5], kerman: [57.08, 30.28],
  chaldiran: [44.2, 39.07], istanbul: [28.98, 41.01], ankara: [32.85, 39.93], erzurum: [41.27, 39.9], samarkand: [66.97, 39.65], herat: [62.2, 34.35],
  shiraz: [52.53, 29.59], otrar: [68.3, 42.85], bukhara: [64.42, 39.77], urgench: [60.6, 41.55], merv: [61.84, 37.66], nishapur: [58.8, 36.2],
  rey: [51.43, 35.6], balkh: [66.9, 36.75], medina: [39.6, 24.47], qadisiyyah: [44.4, 31.85], ctesiphon: [44.58, 33.09], nahavand: [48.37, 34.19],
  edessa: [38.79, 37.16], antioch: [36.16, 36.2], carrhae: [39.03, 36.86], zeugma: [37.87, 37.06], pella: [22.52, 40.76], hellespont: [26.4, 40.2],
  issus: [36.2, 36.85], gaugamela: [43.45, 36.57], babylon: [44.42, 32.54], persepolis: [52.89, 29.93], sardis: [28.04, 38.49], thermopylae: [22.54, 38.8],
  athens: [23.73, 37.98], salamis: [23.5, 37.95], pasargadae: [53.17, 30.2], susa: [48.25, 32.19], opis: [44.5, 33.4], tarsus: [34.9, 36.9],
};

export const WARS: War[] = [
  {
    year: 2026, name: "جنگ ۴۰ روزه", sub: "آمریکا و اسرائیل · اسفند ۱۴۰۴ تا فروردین ۱۴۰۵", ticker: { unit: "روز", to: 40 },
    cam: [47.2, 29.8, 1.12], dur: 2.6,
    draw: (x) => {
      missile(x, L.telaviv, L.tehran, 0.0, 0.45, BRICK);
      missile(x, L.arabsea, L.bandar, 0.06, 0.45, BRICK, 0.25);
      missile(x, L.telaviv, L.isfahan, 0.14, 0.58, BRICK);
      missile(x, L.tehran, L.telaviv, 0.22, 0.66, GOLD);
      missile(x, L.arabsea, L.bushehr, 0.3, 0.68, BRICK, 0.25);
      missile(x, L.isfahan, L.bahrain, 0.36, 0.7, GOLD, 0.4);
      missile(x, L.telaviv, L.tabriz, 0.42, 0.82, BRICK);
      missile(x, L.tabriz, L.telaviv, 0.5, 0.92, GOLD);
      pin(x, L.hormuz, 0.55, "تنگه‌ی هرمز", GOLD, "r", 26);
      tag(x, [34.3, 30.2], 0.1, "اسرائیل");
      tag(x, [58.8, 21.2], 0.2, "آمریکا");
    },
  },
  {
    year: 2025, name: "جنگ ۱۲ روزه", sub: "اسرائیل و آمریکا · خرداد ۱۴۰۴", ticker: { unit: "روز", to: 12 },
    cam: [45.0, 32.5, 1.25], dur: 2.4,
    draw: (x) => {
      missile(x, L.telaviv, L.tehran, 0.0, 0.42, BRICK);
      missile(x, L.telaviv, L.natanz, 0.08, 0.5, BRICK);
      missile(x, L.tehran, L.telaviv, 0.22, 0.62, GOLD);
      missile(x, L.isfahan, L.telaviv, 0.3, 0.7, GOLD);
      missile(x, L.med, L.fordow, 0.42, 0.82, BRICK, 0.22);
      missile(x, L.tehran, L.udeid, 0.62, 0.95, GOLD, 0.35);
      pin(x, L.fordow, 0.78, "فردو", BRICK, "r", 24);
      tag(x, [34.3, 30.4], 0.1, "اسرائیل");
      tag(x, [33.8, 35.6], 0.42, "آمریکا");
    },
  },
  {
    year: 1980, name: "جنگ ایران و عراق", sub: "۱۳۵۹ تا ۱۳۶۷ · هشت سال", ticker: { unit: "سال", to: 8 },
    cam: [47.6, 32.6, 2.3], dur: 2.4,
    draw: (x) => {
      front(x, [[45.6, 35.6], [45.9, 34.6], [45.7, 33.9], [46.4, 33.1], [47.3, 32.4], [47.7, 31.6], [47.9, 30.9], [48.4, 30.0]], 0.0, 0.45, BRICK);
      march(x, [L.basra, L.khorram, L.ahvaz], 0.12, 0.5, BRICK);
      march(x, [[49.3, 31.6], [48.6, 30.9], L.khorram], 0.55, 0.9, GOLD);
      pin(x, L.khorram, 0.85, "خرمشهر", GOLD, "l", 26);
      tag(x, [44.6, 32.4], 0.15, "عراق");
    },
  },
  {
    year: 1941, name: "حمله‌ی انگلیس و شوروی", sub: "شهریور ۱۳۲۰",
    cam: [51.8, 34.0, 1.75], dur: 2.1,
    draw: (x) => {
      march(x, [[46.6, 40.6], [46.4, 38.9], L.tabriz, L.qazvin], 0.0, 0.55, BRICK);
      march(x, [[58.4, 38.4], L.mashhad], 0.1, 0.5, BRICK);
      march(x, [[49.6, 28.6], [49.2, 30.0], L.ahvaz], 0.15, 0.6, BRICK);
      march(x, [[45.3, 34.4], L.kermanshah], 0.22, 0.55, BRICK);
      tag(x, [52.5, 39.6], 0.25, "شوروی");
      tag(x, [48.8, 27.6], 0.3, "انگلیس");
    },
  },
  {
    year: 1914, name: "جنگ جهانی اول در ایران", sub: "ایران بی‌طرف بود، ولی میدون جنگ شد",
    cam: [49.0, 34.0, 1.7], dur: 2.1,
    draw: (x) => {
      power(x, [49.0, 38.4], 0.05, "روسیه");
      power(x, [44.6, 36.2], 0.2, "عثمانی");
      power(x, [50.5, 28.2], 0.35, "انگلیس");
      march(x, [[49.0, 38.4], L.qazvin], 0.15, 0.6, BRICK, 5);
      march(x, [[44.6, 36.2], L.kermanshah], 0.3, 0.7, BRICK, 5);
      march(x, [[50.5, 28.2], L.shiraz], 0.45, 0.85, BRICK, 5);
    },
  },
  {
    year: 1856, name: "جنگ ایران و انگلیس", sub: "انگلیس بوشهر رو گرفت",
    cam: [51.2, 28.6, 2.6], dur: 2.0,
    draw: (x) => {
      ships(x, [[54.6, 26.0], [52.8, 27.2], [51.3, 28.5]], 0.0, 0.6, 4, BRICK);
      march(x, [[51.6, 28.1], L.bushehr], 0.45, 0.75, BRICK, 6);
      pin(x, L.bushehr, 0.6, "بوشهر", BRICK, "r", 28);
      tag(x, [51.4, 26.8], 0.1, "خلیج فارس", GOLD, 24);
    },
  },
  {
    year: 1804, name: "جنگ‌های ایران و روسیه", sub: "۱۸۰۴ تا ۱۸۲۸ · قفقاز از دست رفت",
    cam: [45.8, 40.2, 2.2], dur: 2.1,
    draw: (x) => {
      march(x, [[44.6, 43.6], L.tbilisi, L.ganja, L.erevan], 0.0, 0.5, BRICK);
      zone(x, [[41.5, 43.2], [46.6, 41.9], [49.6, 41.3], [49.0, 39.6], [47.8, 39.6], [46.5, 38.9], [44.8, 39.7], [43.6, 40.1], [41.4, 41.4]], 0.4);
      border(x, [[43.6, 40.1], [44.8, 39.7], [45.6, 39.4], [46.5, 38.9], [47.5, 39.4], [48.3, 39.6]], 0.6, GOLD);
      pin(x, L.tbilisi, 0.3, "تفلیس", BRICK, "r", 24);
      tag(x, [47.8, 40.6], 0.55, "قفقاز", BRICK, 30);
      tag(x, [46.0, 38.75], 0.72, "رود ارس", GOLD, 22);
    },
  },
  {
    year: 1739, name: "نادرشاه در هند", sub: "نبرد کرنال",
    cam: [67.5, 32.5, 1.25], dur: 2.1,
    draw: (x) => {
      march(x, [L.mashhad, L.herat, L.kandahar, L.kabul, L.lahore, L.karnal], 0.0, 0.75, GOLD, 8);
      pin(x, L.karnal, 0.7, "کرنال", GOLD, "t", 28);
      glyph(x, L.karnal, 0.78, "crown", 0, 90);
    },
  },
  {
    year: 1722, name: "سقوط اصفهان", sub: "هفت ماه محاصره",
    cam: [57.5, 31.5, 1.6], dur: 2.1,
    draw: (x) => {
      march(x, [L.kandahar, [61.2, 30.8], L.kerman, [54.2, 31.8], L.isfahan], 0.0, 0.55, BRICK, 7);
      siege(x, L.isfahan, 0.5, 0.95);
      glyph(x, L.isfahan, 0.6, "dome", 0, -96);
      pin(x, L.isfahan, 0.55, "اصفهان", GOLD, "l", 26);
      tag(x, [65.7, 30.6], 0.05, "افغان‌ها", BRICK, 26);
    },
  },
  {
    year: 1514, name: "نبرد چالدران", sub: "صفویه و عثمانی",
    cam: [39.0, 39.3, 1.55], dur: 2.1,
    draw: (x) => {
      march(x, [L.istanbul, L.ankara, L.erzurum, [43.6, 39.2]], 0.0, 0.55, BRICK, 7);
      march(x, [L.tabriz, [45.2, 38.7], [44.5, 39.0]], 0.2, 0.55, GOLD, 7);
      clash(x, L.chaldiran, 0.55);
      glyph(x, L.erzurum, 0.3, "cannon", 0, -70);
      pin(x, L.chaldiran, 0.6, "چالدران", GOLD, "b", 26);
      tag(x, [31.0, 40.2], 0.05, "عثمانی", BRICK, 28);
    },
  },
  {
    year: 1381, name: "حمله‌ی تیمور", sub: "از سمرقند تا سراسر ایران",
    cam: [58.5, 35.0, 1.2], dur: 2.0,
    draw: (x) => {
      pin(x, L.samarkand, 0.0, "سمرقند", BRICK, "r", 26);
      march(x, [L.samarkand, L.balkh, L.herat], 0.05, 0.4, BRICK, 6);
      march(x, [L.herat, L.nishapur, L.rey, L.tabriz], 0.25, 0.7, BRICK, 6);
      march(x, [L.herat, [57.5, 32.5], L.isfahan, L.shiraz], 0.35, 0.8, BRICK, 6);
      march(x, [L.tabriz, L.baghdad], 0.6, 0.92, BRICK, 6);
    },
  },
  {
    year: 1219, name: "حمله‌ی مغول", sub: "خوارزمشاهیان فرو ریخت",
    cam: [62.5, 38.5, 1.3], dur: 2.2,
    draw: (x) => {
      tag(x, [74.5, 43.5], 0.0, "مغول‌ها", BRICK, 28);
      march(x, [[76.5, 43.0], L.otrar, L.bukhara], 0.0, 0.35, BRICK, 7);
      march(x, [[76.0, 41.5], [71.0, 40.5], L.samarkand], 0.05, 0.4, BRICK, 7);
      march(x, [L.bukhara, L.urgench], 0.3, 0.6, BRICK, 6);
      march(x, [L.samarkand, L.balkh, L.herat], 0.35, 0.65, BRICK, 6);
      march(x, [L.bukhara, L.merv, L.nishapur, L.rey], 0.4, 0.85, BRICK, 6);
      march(x, [L.rey, [48.5, 36.8], L.tabriz], 0.7, 0.98, BRICK, 5);
      pin(x, L.urgench, 0.55, "خوارزم", GOLD, "l", 24);
    },
  },
  {
    year: 636, name: "حمله‌ی اعراب", sub: "قادسیه و نهاوند · پایان ساسانیان",
    cam: [48.0, 31.5, 1.3], dur: 2.2,
    draw: (x) => {
      march(x, [L.medina, [42.0, 29.0], L.qadisiyyah], 0.0, 0.35, BRICK, 7);
      march(x, [L.qadisiyyah, L.ctesiphon], 0.3, 0.45, BRICK, 7);
      march(x, [L.ctesiphon, L.nahavand], 0.45, 0.62, BRICK, 7);
      march(x, [L.nahavand, [53.0, 34.6], L.nishapur, L.merv], 0.62, 0.95, BRICK, 6);
      pin(x, L.qadisiyyah, 0.3, "قادسیه", BRICK, "l", 24);
      pin(x, L.ctesiphon, 0.42, "تیسفون", GOLD, "l", 24);
      pin(x, L.nahavand, 0.58, "نهاوند", BRICK, "r", 24);
    },
  },
  {
    year: 260, name: "شاپور و روم", sub: "اسارت والرین، امپراتور روم",
    cam: [40.0, 36.0, 1.9], dur: 2.0,
    draw: (x) => {
      march(x, [L.antioch, [37.8, 36.9], L.edessa], 0.0, 0.45, BRICK, 7);
      march(x, [L.ctesiphon, [41.5, 35.4], L.edessa], 0.1, 0.5, GOLD, 8);
      clash(x, L.edessa, 0.5);
      pin(x, L.edessa, 0.55, "ادسا", GOLD, "t", 26);
      glyph(x, L.edessa, 0.65, "crown", 0, 92);
      tag(x, [35.6, 35.2], 0.05, "روم", BRICK, 28);
    },
  },
  {
    year: -53, name: "نبرد حران", sub: "اشکانیان و روم",
    cam: [39.2, 36.6, 2.5], dur: 2.0,
    draw: (x) => {
      march(x, [[36.8, 37.2], L.zeugma, [38.5, 37.0], L.carrhae], 0.0, 0.45, BRICK, 7);
      circling(x, L.carrhae, 0.4, GOLD);
      pin(x, L.carrhae, 0.5, "حران", GOLD, "b", 26);
      tag(x, [36.9, 37.65], 0.05, "روم", BRICK, 26);
    },
  },
  {
    year: -331, name: "نبرد گوگمل", sub: "اسکندر و داریوش سوم",
    cam: [37.5, 36.0, 0.95], dur: 2.2,
    draw: (x) => {
      march(x, [L.pella, L.hellespont, L.sardis, L.tarsus, L.issus, [40.5, 36.9], L.gaugamela], 0.0, 0.55, BRICK, 7);
      march(x, [L.babylon, [44.3, 34.8], [43.9, 36.2]], 0.25, 0.55, GOLD, 7);
      clash(x, L.gaugamela, 0.55);
      march(x, [L.gaugamela, L.babylon, L.susa, L.persepolis], 0.6, 0.95, BRICK, 6);
      pin(x, L.gaugamela, 0.55, "گوگمل", GOLD, "t", 24);
      pin(x, L.persepolis, 0.9, "تخت جمشید", GOLD, "r", 24);
      tag(x, [22.0, 41.6], 0.05, "مقدونیه", BRICK, 24);
    },
  },
  {
    year: -480, name: "لشکرکشی خشایارشا به یونان", sub: "ترموپیل و سالامیس",
    cam: [26.0, 38.8, 2.0], dur: 2.1,
    draw: (x) => {
      march(x, [L.sardis, [27.0, 39.6], L.hellespont, [24.5, 40.8], [22.6, 40.0], L.thermopylae], 0.0, 0.55, GOLD, 8);
      ships(x, [[26.2, 39.6], [24.6, 39.2], [23.6, 38.2]], 0.15, 0.7, 4, GOLD);
      march(x, [L.thermopylae, L.athens], 0.55, 0.8, GOLD, 6);
      pin(x, L.thermopylae, 0.5, "ترموپیل", GOLD, "l", 24);
      pin(x, L.salamis, 0.75, "سالامیس", BRICK, "b", 24);
      tag(x, [22.0, 37.4], 0.1, "یونان", BRICK, 26);
    },
  },
  {
    year: -539, name: "کوروش و فتح بابل", sub: "آغاز هخامنشیان",
    cam: [48.3, 31.8, 1.6], dur: 2.3,
    draw: (x) => {
      march(x, [L.pasargadae, [50.6, 31.1], L.susa, L.opis, L.babylon], 0.0, 0.55, GOLD, 8);
      pin(x, L.pasargadae, 0.0, "پاسارگاد", GOLD, "r", 24);
      pin(x, L.babylon, 0.55, "بابل", GOLD, "l", 26);
      glyph(x, L.babylon, 0.62, "cylinder", 0, -92);
    },
  },
];
