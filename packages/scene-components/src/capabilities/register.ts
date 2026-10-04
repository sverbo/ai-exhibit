// Registers the "capabilities" scene components (chapter 01). See README.md for props and reveal steps.
import { registerSceneComponent } from "../contract.ts";
import { ConnectedAssistant } from "./connected/ConnectedAssistant.tsx";
import { AgentRunExplainer } from "./run/AgentRunExplainer.tsx";
import { VideoScene } from "./video/VideoScene.tsx";
import { YouTubeScene } from "./video/YouTubeScene.tsx";
import { HoldingSlide } from "./intro/HoldingSlide.tsx";
import { FrontierProgress } from "./progress/FrontierProgress.tsx";
import { Agenda } from "./agenda/Agenda.tsx";
import { SectionDivider } from "./agenda/SectionDivider.tsx";

registerSceneComponent("ConnectedAssistant", ConnectedAssistant);
registerSceneComponent("AgentRunExplainer", AgentRunExplainer);
registerSceneComponent("VideoScene", VideoScene);
registerSceneComponent("YouTubeScene", YouTubeScene);
registerSceneComponent("HoldingSlide", HoldingSlide);
registerSceneComponent("FrontierProgress", FrontierProgress);
registerSceneComponent("Agenda", Agenda);
registerSceneComponent("SectionDivider", SectionDivider);
