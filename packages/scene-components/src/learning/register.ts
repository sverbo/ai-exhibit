// Registers the "learning" scene components. See README.md for props and reveal steps.
import { registerSceneComponent } from "../contract.ts";
import { ApplesAndPears } from "./fruit/ApplesAndPears.tsx";
import { GoalVsOutcome } from "./goal/GoalVsOutcome.tsx";

registerSceneComponent("GoalVsOutcome", GoalVsOutcome);
registerSceneComponent("ApplesAndPears", ApplesAndPears);
