import { Composition } from "remotion";
import { V49, V49_FPS, V49_FRAMES } from "./v49/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V49-Silent" component={V49} durationInFrames={V49_FRAMES} fps={V49_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
