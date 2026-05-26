// Wave 49 — the invite-gated Google sign-in guard. This is the security boundary
// that keeps a Google account from redeeming an invite issued to a different
// address, so the match rule is tested directly.

import { describe, expect, it } from "vitest";
import { inviteEmailMatches, normalizeEmail } from "@/lib/auth/invite-email";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Booth@Example.COM ")).toBe("booth@example.com");
  });
  it("treats null/undefined/empty as the empty string", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail("   ")).toBe("");
  });
});

describe("inviteEmailMatches", () => {
  it("matches the same address regardless of case or surrounding space", () => {
    expect(inviteEmailMatches("Booth@Example.com", "booth@example.com")).toBe(true);
    expect(inviteEmailMatches(" booth@example.com ", "booth@example.com")).toBe(true);
  });

  it("rejects a different address", () => {
    expect(inviteEmailMatches("someone@gmail.com", "booth@example.com")).toBe(false);
  });

  it("does NOT fold Gmail dots or +tags (strict by design)", () => {
    // These are the same Gmail inbox, but the invite was issued to an exact
    // string — we don't widen the gate to cover address variants.
    expect(inviteEmailMatches("b.o.o.t.h@gmail.com", "booth@gmail.com")).toBe(false);
    expect(inviteEmailMatches("booth+expo@gmail.com", "booth@gmail.com")).toBe(false);
  });

  it("never matches when either side is empty", () => {
    expect(inviteEmailMatches("", "booth@example.com")).toBe(false);
    expect(inviteEmailMatches("booth@example.com", "")).toBe(false);
    expect(inviteEmailMatches(null, null)).toBe(false);
    expect(inviteEmailMatches(undefined, "booth@example.com")).toBe(false);
  });
});
