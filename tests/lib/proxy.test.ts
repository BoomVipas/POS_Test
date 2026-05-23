// Wave 41d — verify src/proxy.ts exposes the shape Next.js 16 expects.
//
// Finding L4 (audit 2026-05-24) suspected the named `export async function
// proxy(...)` in `src/proxy.ts` might not be picked up by Next 16 (we assumed
// the new `proxy.ts` convention required `export default`, like the old
// `middleware.ts`). Empirical check via `npm run build` (Next 16.2.4 +
// Turbopack):
//
//   - The route table prints `ƒ Proxy (Middleware)`.
//   - `.next/server/functions-config-manifest.json` contains a `/_middleware`
//     entry whose `matchers[0].originalSource` equals the matcher we exported
//     from `src/proxy.ts`. (Note: the legacy `middleware-manifest.json` is
//     EMPTY in Next 16/Turbopack — it's a stale-but-still-emitted v3 artifact;
//     the real registration lives in `functions-config-manifest.json`.)
//
// Conclusion: named export works. No code change. These tests pin the shape
// so a future refactor that drops the export, removes the matcher, or renames
// the file fails loudly.
//
// If Next.js ever changes the convention and the matcher disappears from
// `functions-config-manifest.json`, the integration test at the bottom of
// this file will fail after a build and tell the next engineer where to look.

import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as proxyMod from "../../src/proxy";

describe("proxy.ts module shape (Wave 41d, finding L4)", () => {
  it("exports a function named `proxy`", () => {
    expect(typeof proxyMod.proxy).toBe("function");
  });

  it("exports a `config` object with a non-empty matcher array", () => {
    expect(proxyMod.config).toBeTypeOf("object");
    expect(Array.isArray(proxyMod.config.matcher)).toBe(true);
    expect(proxyMod.config.matcher.length).toBeGreaterThan(0);
  });

  it("matcher excludes Next.js static + image + favicon + image extensions", () => {
    const pattern = proxyMod.config.matcher[0];
    expect(typeof pattern).toBe("string");
    // The matcher must skip `_next/static`, `_next/image`, `favicon.ico`,
    // and image extensions so the session-refresh middleware doesn't fire on
    // every asset request.
    for (const skip of [
      "_next/static",
      "_next/image",
      "favicon.ico",
      "svg",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
    ]) {
      expect(pattern).toContain(skip);
    }
  });
});

// Build-output assertion: only runs when `.next/server/functions-config-manifest.json`
// is present (i.e. after `npm run build`). Skipped in normal `npm test` runs to
// keep the suite fast. Run with `npm run build && npm test` to engage.
const manifestPath = join(
  __dirname,
  "..",
  "..",
  ".next",
  "server",
  "functions-config-manifest.json",
);
const haveBuild = existsSync(manifestPath);

describe.runIf(haveBuild)(
  "build output registers proxy.ts as middleware (Wave 41d, integration)",
  () => {
    it("functions-config-manifest.json has a /_middleware entry", () => {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      expect(manifest.functions).toBeDefined();
      expect(manifest.functions["/_middleware"]).toBeDefined();
      expect(manifest.functions["/_middleware"].matchers).toBeDefined();
      expect(manifest.functions["/_middleware"].matchers.length).toBeGreaterThan(0);
    });

    it("the registered matcher equals the one exported from src/proxy.ts", () => {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const registered =
        manifest.functions["/_middleware"].matchers[0].originalSource;
      expect(registered).toBe(proxyMod.config.matcher[0]);
    });
  },
);
