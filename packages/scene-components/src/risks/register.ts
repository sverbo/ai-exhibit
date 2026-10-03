// Registers the "risks" scene components. Props and reveal steps: ./README.md.
import { registerSceneComponent } from "../contract.ts";
import { IncidentStory } from "./IncidentStory.tsx";
import { OpinionGap } from "./OpinionGap.tsx";
import { PictureCards } from "./PictureCards.tsx";
import { ResourceList } from "./ResourceList.tsx";
import { SingleCase } from "./SingleCase.tsx";

registerSceneComponent("PictureCards", PictureCards);
registerSceneComponent("IncidentStory", IncidentStory);
registerSceneComponent("SingleCase", SingleCase);
registerSceneComponent("OpinionGap", OpinionGap);
registerSceneComponent("ResourceList", ResourceList);
