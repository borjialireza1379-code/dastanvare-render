import { continueRender, delayRender, staticFile } from "remotion";

if (typeof window !== "undefined") {
  const h = delayRender("v50 fonts");
  Promise.all(
    [["Vazirmatn", "fonts/Vazirmatn-Bold.ttf", "700"], ["Vazirmatn", "fonts/Vazirmatn-SemiBold.ttf", "600"], ["Vazirmatn", "fonts/Vazirmatn-Black.ttf", "900"], ["Estedad", "fonts/Estedad-Black.woff2", "900"], ["Lalezar", "fonts/Lalezar-Regular.ttf", "400"], ["Nastaliq", "fonts/NotoNastaliqUrdu.ttf", "400 700"], ["Chakra Petch", "fonts/ChakraPetch-Bold.ttf", "700"]].map(([f, u, w]) =>
      new FontFace(f, `url('${staticFile(u)}')`, { weight: w }).load().then((ff) => document.fonts.add(ff)),
    ),
  ).then(() => continueRender(h)).catch(() => continueRender(h));
}
