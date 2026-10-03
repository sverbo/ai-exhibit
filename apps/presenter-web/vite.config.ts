import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const runtime = `http://127.0.0.1:${process.env.RUNTIME_PORT ?? 4317}`;

/**
 * Talk content (scene lists, sources, data) changes reload every open page.
 * Hot-replacing it left windows running a stale scene list that disagreed
 * with the shared session; a reload also refreshes the content version the
 * session uses to spot windows that are out of date.
 */
function reloadOnContentChange(): Plugin {
  const content = /[\\/](presentations|content)[\\/]/;
  return {
    name: "ai-exhibit:reload-on-content-change",
    handleHotUpdate({ file, server }) {
      if (!content.test(file)) return;
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}

export default defineConfig({
  plugins: [react(), reloadOnContentChange()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // xfwd + original Host let the runtime tell LAN clients from this machine,
    // which guards the cloud endpoints (this machine only).
    proxy: {
      "/api": { target: runtime, xfwd: true },
    },
    fs: { allow: ["../.."] },
  },
});
