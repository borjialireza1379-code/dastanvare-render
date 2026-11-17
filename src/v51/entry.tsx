// v51-only entry (local checks with a slim --public-dir; the main Root loads every video's assets):
// npx remotion render src/v51/entry.tsx V51-Look videos/51/look --sequence --image-format=jpeg --public-dir=<slim>
import React from "react";
import { Composition, registerRoot } from "remotion";
import { V51, V51_FPS, V51_FRAMES, V51_LOOK } from "./Video";

const Root: React.FC = () => (
  <>
    <Composition id="V51" component={V51} durationInFrames={V51_FRAMES} fps={V51_FPS} width={1080} height={1920} />
    <Composition id="V51-Silent" component={V51} durationInFrames={V51_FRAMES} fps={V51_FPS} width={1080} height={1920} defaultProps={{ silent: true }} />
    <Composition id="V51-Look" component={V51} durationInFrames={V51_LOOK.length} fps={V51_FPS} width={1080} height={1920} defaultProps={{ silent: true, times: V51_LOOK }} />
  </>
);
registerRoot(Root);
