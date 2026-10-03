// Registers the "story" scene components. Props and reveal steps: ./README.md.
import { registerSceneComponent } from "../contract.ts";
import { AIEnvelopes } from "./AIEnvelopes.tsx";
import { AITimeline } from "./AITimeline.tsx";
import { IndustryStack } from "./IndustryStack.tsx";
import { IntelligenceScale } from "./IntelligenceScale.tsx";

registerSceneComponent("AIEnvelopes", AIEnvelopes);
registerSceneComponent("AITimeline", AITimeline);
registerSceneComponent("IndustryStack", IndustryStack);
registerSceneComponent("IntelligenceScale", IntelligenceScale);
