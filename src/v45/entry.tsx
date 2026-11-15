import "../fonts";
import React from "react";
import { Composition, registerRoot, useCurrentFrame } from "remotion";
import { V45, V45_FPS, V45_FRAMES } from "./Video";

// Look: frame i shows the film at frame times[i]
const Look: React.FC<{ times: number[] }> = ({ times }) => {
  const f = useCurrentFrame();
  return <V45 silent at={times[Math.min(f, times.length - 1)]} />;
};

const Root: React.FC = () => (
  <>
    <Composition id="V45" component={V45} durationInFrames={V45_FRAMES} fps={V45_FPS} width={1080} height={1920} />
    <Composition id="V45-Silent" component={V45} durationInFrames={V45_FRAMES} fps={V45_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
    <Composition id="V45-Look" component={Look} durationInFrames={60} fps={V45_FPS} width={1080} height={1920} defaultProps={{ times: [0] }}
      calculateMetadata={({ props }) => ({ durationInFrames: props.times.length })} />
  </>
);
registerRoot(Root);