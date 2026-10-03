// Vercel function for /api/llm/chat, see packages/cloud-api/src/vercel.ts.
// Relative import with a .js extension: Vercel compiles the TypeScript
// sources and runs them as ES modules, without the workspace's path tricks.
import { handleVercel } from "../../packages/cloud-api/src/vercel.js";

export function POST(request: Request): Promise<Response> {
  return handleVercel(request);
}
