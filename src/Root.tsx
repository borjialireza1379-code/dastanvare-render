import { Composition } from "remotion";
import { V52, V52_FPS, V52_FRAMES } from "./v52/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V52-Silent" component={V52} durationInFrames={V52_FRAMES} fps={V52_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
