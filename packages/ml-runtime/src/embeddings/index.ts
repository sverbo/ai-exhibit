// Embeddings helpers: pure geometry, fuzzy matching and the decoder for the
// precomputed vocabulary (content/assets/embeddings). Live query vectors come
// from the server (/api/embed, see ../lm/cloud.ts).
export * from "./geometry.ts";
export * from "./fuzzy.ts";
export * from "./canonical.ts";
