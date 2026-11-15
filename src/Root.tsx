import { Composition } from "remotion";
import { V45, V45_FPS, V45_FRAMES } from "./v45/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V45-Silent" component={V45} durationInFrames={V45_FRAMES} fps={V45_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
