import { Composition } from "remotion";
import { V47, V47_FPS, V47_FRAMES } from "./v47/Video";

export const RemotionRoot: React.FC = () => (
  <Composition id="V47-Silent" component={V47} durationInFrames={V47_FRAMES} fps={V47_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
);
