// Vercel function for /api/tokenize, see packages/cloud-api/src/vercel.ts.
// Relative import with a .js extension: Vercel compiles the TypeScript
// sources and runs them as ES modules, without the workspace's path tricks.
import { handleVercel, warmTokenizer } from "../packages/cloud-api/src/vercel.js";

// The tokenizer file is large (17 MB): start fetching it as the instance starts.
warmTokenizer();

export function POST(request: Request): Promise<Response> {
  return handleVercel(request);
}
