// Registers the "agents" scene components. See README.md for props and reveal steps.
import { registerSceneComponent } from "../contract.ts";
import { ToolCallDemo } from "./toolcall/ToolCallDemo.tsx";

registerSceneComponent("ToolCallDemo", ToolCallDemo);
