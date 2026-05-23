// Wave 41k — D-series coverage guard.
//
// The Wave 41 Phase B/C audit produced findings D1–D6. Each one shipped with a
// pinning test (in 41g–41j). This guard fails if any finding loses its pin —
// e.g. someone deletes a case during a future refactor — so the regression
// suite can't silently shrink below the audit it was built to lock down.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const SELF = "d-series-coverage.test.ts";

// Read every db test file except this one, concatenated.
const corpus = readdirSync(here)
  .filter((f) => f.endsWith(".test.ts") && f !== SELF)
  .map((f) => readFileSync(path.join(here, f), "utf8"))
  .join("\n");

describe("D-series regression coverage (Wave 41k)", () => {
  const findings = ["D1", "D2", "D3", "D4", "D5", "D6"] as const;

  it.each(findings)("finding %s has at least one pinning test", (finding) => {
    // Match the tag as a word so "D1" doesn't accidentally match "D12".
    const tagged = new RegExp(`\\b${finding}\\b`).test(corpus);
    expect(tagged).toBe(true);
  });

  it("covers all six D-series findings", () => {
    const covered = findings.filter((f) => new RegExp(`\\b${f}\\b`).test(corpus));
    expect(covered.length).toBe(6);
  });
});
