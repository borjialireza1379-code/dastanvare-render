import { Composition } from "remotion";
import { V55, V55_FPS, V55_FRAMES } from "./v55/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V55-Silent" component={V55} durationInFrames={V55_FRAMES} fps={V55_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
