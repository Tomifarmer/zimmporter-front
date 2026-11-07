import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    css: true,
  },
  resolve: {
    // Resolve ESM builds so Vitest matches how Next.js bundles Mantle UI.
    // Its CJS build does not expose the default config object (zIndex, etc.).
    mainFields: ["module", "main"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
