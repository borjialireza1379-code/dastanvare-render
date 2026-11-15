import { Composition } from "remotion";
import { V44, V44_FPS, V44_FRAMES } from "./v44/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V44-Silent" component={V44} durationInFrames={V44_FRAMES} fps={V44_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
