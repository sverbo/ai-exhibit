// Registers the "agents" scene components. See README.md for props and reveal steps.
import { registerSceneComponent } from "../contract.ts";
import { ContextStack } from "./context/ContextStack.tsx";
import { AgentLoop } from "./loop/AgentLoop.tsx";
import { PermissionsBoard } from "./permissions/PermissionsBoard.tsx";
import { ToolCallDemo } from "./toolcall/ToolCallDemo.tsx";

registerSceneComponent("AgentLoop", AgentLoop);
registerSceneComponent("ContextStack", ContextStack);
registerSceneComponent("ToolCallDemo", ToolCallDemo);
registerSceneComponent("PermissionsBoard", PermissionsBoard);
