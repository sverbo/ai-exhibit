import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["{apps,packages,presentations,scripts}/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
