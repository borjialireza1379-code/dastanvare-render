// v55-only entry for quick local stills: npx remotion still src/v55/entry.tsx V55-Silent out.png --frame=N
import React from "react";
import { Composition, registerRoot } from "remotion";
import { V55, V55_FPS, V55_FRAMES, V55Look, LOOK_T } from "./Video";

const Root: React.FC = () => (
  <>
    <Composition id="V55-Silent" component={V55} durationInFrames={V55_FRAMES} fps={V55_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
    <Composition id="V55-Look" component={V55Look} durationInFrames={LOOK_T.length} fps={V55_FPS} width={1080} height={1920} />
  </>
);
registerRoot(Root);
