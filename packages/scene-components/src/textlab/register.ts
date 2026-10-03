// Registers the "textlab" scene components. See README.md for props and reveal steps.
import { registerSceneComponent } from "../contract.ts";
import { TextClassifierLab } from "./TextClassifierLab.tsx";

registerSceneComponent("TextClassifierLab", TextClassifierLab);
