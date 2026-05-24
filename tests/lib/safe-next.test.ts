// DD-39 — post-login `?next=` sanitiser (open-redirect guard).
//
// The /app guard deep-links unauthenticated users to /login?next=<path>, so we
// honour a same-origin absolute path but must reject anything that could bounce
// a freshly authenticated seller off our origin (a classic phishing primitive).

import { describe, expect, it } from "vitest";
import { safeNextPath, DEFAULT_NEXT } from "@/lib/auth/safe-next";

describe("safeNextPath", () => {
  it("falls back to /app for nullish / empty input", () => {
    expect(safeNextPath(null)).toBe("/app");
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath("   ")).toBe("/app");
    expect(DEFAULT_NEXT).toBe("/app");
  });

  it("honours a same-origin absolute path", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/pos")).toBe("/app/pos");
    expect(safeNextPath("/admin/applications")).toBe("/admin/applications");
    expect(safeNextPath("/app/dashboard?day=2")).toBe("/app/dashboard?day=2");
  });

  it("trims surrounding whitespace before validating", () => {
    expect(safeNextPath("  /app/pos  ")).toBe("/app/pos");
  });

  it("rejects an absolute off-site URL", () => {
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath("http://evil.example/app")).toBe("/app");
  });

  it("rejects protocol-relative URLs (// and /\\)", () => {
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("//evil.example/app")).toBe("/app");
    expect(safeNextPath("/\\evil.example")).toBe("/app");
  });

  it("rejects a bare relative path (no leading slash)", () => {
    expect(safeNextPath("app/pos")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)")).toBe("/app");
  });

  it("rejects smuggled control characters", () => {
    expect(safeNextPath("/ap\x00p")).toBe("/app");
    expect(safeNextPath("/app\n/evil")).toBe("/app");
    expect(safeNextPath("/app\t/evil")).toBe("/app");
  });

  it("respects a caller-supplied fallback", () => {
    expect(safeNextPath(null, "/login")).toBe("/login");
    expect(safeNextPath("//evil.example", "/login")).toBe("/login");
  });
});
