import { Composition } from "remotion";
import { V48, V48_FPS, V48_FRAMES } from "./v48/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V48-Silent" component={V48} durationInFrames={V48_FRAMES} fps={V48_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
