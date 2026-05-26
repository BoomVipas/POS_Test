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
    // file. Those boots are CPU+memory heavy; when many run at once on a
    // multi-core box they thrash and each can take >60s, blowing the hook
    // timeout. Capping parallel workers keeps each boot fast (~2s) and
    // deterministic; fast unit tests (ms) are unaffected. hookTimeout stays
    // generous as a safety net (CI 2-vCPU runners are naturally low-parallelism).
    testTimeout: 30000,
    hookTimeout: 120000,
    maxWorkers: 4,
  },
});
