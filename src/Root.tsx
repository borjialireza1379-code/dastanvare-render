import { Composition } from "remotion";
import { V46, V46_FPS, V46_FRAMES } from "./v46/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V46-Silent" component={V46} durationInFrames={V46_FRAMES} fps={V46_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
