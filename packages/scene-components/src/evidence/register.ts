// Registers the "evidence" scene components. Props and reveal steps: ./README.md.
import { registerSceneComponent } from "../contract.ts";
import { DefenseInDepth } from "./DefenseInDepth.tsx";
import { RaceDilemma } from "./RaceDilemma.tsx";

registerSceneComponent("DefenseInDepth", DefenseInDepth);
registerSceneComponent("RaceDilemma", RaceDilemma);
