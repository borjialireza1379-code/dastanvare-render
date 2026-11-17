// v51 map bake entry (kept out of the main Root). See Bake.tsx for the command.
import React from "react";
import { registerRoot, Still } from "remotion";
import { Bake, BW, BH } from "./Bake";

const Root: React.FC = () => React.createElement(Still, { id: "V51-Bake", component: Bake, width: BW, height: BH });
registerRoot(Root);
