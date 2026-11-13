import { Composition } from "remotion";
import { V41, V41_FPS, V41_FRAMES } from "./v41/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V41-Silent" component={V41} durationInFrames={V41_FRAMES} fps={V41_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
