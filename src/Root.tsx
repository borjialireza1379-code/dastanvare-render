import { Composition } from "remotion";
import { V50, V50_FPS, V50_FRAMES } from "./v50/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V50-Silent" component={V50} durationInFrames={V50_FRAMES} fps={V50_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
