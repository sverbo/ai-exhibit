// Server-side tokenization for the tokenizer scene: the real tokenizer of the
// cloud model (Llama 3.1), plus GPT-2's for comparison. Files come from the
// Hugging Face Hub at pinned revisions, are checked against their sha256, and
// stay in memory for the life of the server or function instance.
//
// Llama 3.1's own repository is gated; unsloth/Meta-Llama-3.1-8B-Instruct is a
// public copy with the same tokenizer (checked against the token counts the
// Hugging Face router reports, see content/assets/recordings).
import { Tokenizer } from "@huggingface/tokenizers";
import { byteLevelSpans, bytesLabel } from "../../ml-runtime/src/lm/byteLevel.js";

export type CloudTokenizerId = "llama-3.1" | "gpt2";

interface PinnedFile {
  path: string;
  size: number;
  sha256: string;
}

export interface CloudTokenizerSpec {
  id: CloudTokenizerId;
  label: string;
  repo: string;
  revision: string;
  files: { tokenizer: PinnedFile; config: PinnedFile };
}

export const CLOUD_TOKENIZERS: Record<CloudTokenizerId, CloudTokenizerSpec> = {
  "llama-3.1": {
    id: "llama-3.1",
    label: "Llama 3.1",
    repo: "unsloth/Meta-Llama-3.1-8B-Instruct",
    revision: "a2856192dd7c25b842431f39c179a6c2c2f627d1",
    files: {
      tokenizer: { path: "tokenizer.json", size: 17209920, sha256: "6b9e4e7fb171f92fd137b777cc2714bf87d11576700a1dcd7a399e7bbe39537b" },
      config: { path: "tokenizer_config.json", size: 55493, sha256: "4d18eae3017839b17cb3598f589b62ec212652d183582ee0fc33a4f1e8b3da67" },
    },
  },
  gpt2: {
    id: "gpt2",
    label: "GPT-2",
    repo: "Xenova/gpt2",
    revision: "bf2c7f02e0b826c60d03af341171bde20893da66",
    files: {
      tokenizer: { path: "tokenizer.json", size: 2107653, sha256: "cda20b8ca044949aa07ac4078420c80d1a57139d5f9f33700e46fb2d891e7c66" },
      config: { path: "tokenizer_config.json", size: 234, sha256: "551e26ec611d8d0c8edc3ef72e518a38418cb71f40de1347dd486a595e1557d7" },
    },
  },
};

export function isCloudTokenizerId(v: unknown): v is CloudTokenizerId {
  return typeof v === "string" && Object.hasOwn(CLOUD_TOKENIZERS, v);
}

export interface CloudToken {
  id: number;
  /** UTF-16 offsets into the input text, end exclusive. */
  start: number;
  end: number;
  /** Only some bytes of a character (emoji, rare symbols); `bytes` holds them in hex. */
  partial?: boolean;
  bytes?: string;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchPinned(spec: CloudTokenizerSpec, file: PinnedFile, doFetch: typeof fetch): Promise<unknown> {
  const url = `https://huggingface.co/${spec.repo}/resolve/${spec.revision}/${file.path}`;
  const res = await doFetch(url);
  if (!res.ok) throw new Error(`${spec.repo}/${file.path}: Hugging Face answered ${res.status}`);
  const bytes = await res.arrayBuffer();
  const hash = await sha256Hex(bytes);
  if (hash !== file.sha256) throw new Error(`${spec.repo}/${file.path}: sha256 mismatch`);
  return JSON.parse(new TextDecoder().decode(bytes));
}

const loaded = new Map<CloudTokenizerId, Promise<Tokenizer>>();

/** Loads a tokenizer once per process; a failed load is retried next time. */
export function loadCloudTokenizer(id: CloudTokenizerId, doFetch: typeof fetch = fetch): Promise<Tokenizer> {
  let p = loaded.get(id);
  if (!p) {
    const spec = CLOUD_TOKENIZERS[id];
    p = Promise.all([fetchPinned(spec, spec.files.tokenizer, doFetch), fetchPinned(spec, spec.files.config, doFetch)]).then(
      ([json, config]) => new Tokenizer(json as object, config as object),
    );
    p.catch(() => loaded.delete(id));
    loaded.set(id, p);
  }
  return p;
}

/** Tests only. */
export function forgetCloudTokenizers(): void {
  loaded.clear();
}

/** Token IDs and the slice of text each one covers (byte-level BPE, so offsets are exact). */
export function tokenizeWith(tokenizer: Tokenizer, text: string): CloudToken[] {
  const { ids, tokens } = tokenizer.encode(text, { add_special_tokens: false });
  const spans = byteLevelSpans(text, tokens);
  if (!spans) throw new Error("This tokenizer is not byte-level");
  return ids.map((id, i) => {
    const s = spans[i]!;
    return { id, start: s.start, end: s.end, ...(s.partial ? { partial: true, bytes: bytesLabel(s.bytes) } : {}) };
  });
}
