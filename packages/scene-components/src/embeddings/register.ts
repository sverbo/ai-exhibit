// Registers the "embeddings" scene components. Props and reveal steps: ./README.md.
import { registerSceneComponent } from "../contract.ts";
import { EmbeddingExplorer } from "./EmbeddingExplorer.tsx";

registerSceneComponent("EmbeddingExplorer", EmbeddingExplorer);
