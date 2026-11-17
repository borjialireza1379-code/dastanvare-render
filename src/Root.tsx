import { Composition } from "remotion";
import { V51, V51_FPS, V51_FRAMES } from "./v51/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V51-Silent" component={V51} durationInFrames={V51_FRAMES} fps={V51_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
