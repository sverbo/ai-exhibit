// Registers the "llm" scene components (storyboard v1). Props and steps: README.md.
import { registerSceneComponent } from "../contract.ts";
import { NextTokenVsClassifier } from "./NextTokenVsClassifier.tsx";
import { TrainingLoop } from "./TrainingLoop.tsx";

registerSceneComponent("NextTokenVsClassifier", NextTokenVsClassifier);
registerSceneComponent("TrainingLoop", TrainingLoop);
