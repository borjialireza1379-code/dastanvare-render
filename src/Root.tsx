import { Composition } from "remotion";
import { V39, V39_FPS, V39_FRAMES } from "./v39/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V39-Silent" component={V39} durationInFrames={V39_FRAMES} fps={V39_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
