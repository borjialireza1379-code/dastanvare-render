import { Composition } from "remotion";
import { V54, V54_FPS, V54_FRAMES } from "./v54/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V54-Silent" component={V54} durationInFrames={V54_FRAMES} fps={V54_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
