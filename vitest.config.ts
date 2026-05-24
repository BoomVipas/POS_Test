import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: ["default"],
    // The tests/db/ layer boots a fresh pglite (Postgres-in-WASM) instance per
    // file. Cold starts on CI (2-vCPU runners) can exceed vitest's default 10s
    // hook timeout when several boot in parallel, so give it headroom. Fast
    // unit tests are unaffected (they finish in ms).
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
