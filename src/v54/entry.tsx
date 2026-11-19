// v54-only entry for quick local stills: npx remotion still src/v54/entry.tsx V54-Silent out.png --frame=N --public-dir=cloud-render-dv/public
import React from "react";
import { Composition, registerRoot } from "remotion";
import { V54, V54_FPS, V54_FRAMES } from "./Video";

const Root: React.FC = () => (
  <Composition id="V54-Silent" component={V54} durationInFrames={V54_FRAMES} fps={V54_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
registerRoot(Root);
