// Registers the "language" scene components (spec §6). Reveal steps: see README.md.
import { registerSceneComponent } from "../contract.ts";
import { BaseModelPlayground } from "./BaseModelPlayground.tsx";
import { ChatPlayground } from "./ChatPlayground.tsx";
import { TokenizerPlayground } from "./TokenizerPlayground.tsx";
import { ThenAndNow } from "./ThenAndNow.tsx";

registerSceneComponent("TokenizerPlayground", TokenizerPlayground);
registerSceneComponent("BaseModelPlayground", BaseModelPlayground);
registerSceneComponent("ThenAndNow", ThenAndNow);
registerSceneComponent("ChatPlayground", ChatPlayground);
