// Wave 41f — app-level rate limit for `/apply` (finding L2).
//
// `checkRateLimit` is the pure policy core: given a store, a key, the current
// time, a max, and a window in milliseconds, it returns whether the request
// is allowed and (when not) when the window resets. Pure so tests pass `now`
// explicitly — no real clock, no flakes.
//
// The Server Action wires this to `Date.now()` + the `x-forwarded-for` header
// (or `unknown` in local dev). DD-16 ships a Supabase-backed version; this is
// the in-process bridge.

import { describe, expect, it } from "vitest";
import { checkRateLimit, createRateLimitStore } from "@/lib/rate-limit";

const WINDOW = 60 * 60 * 1000; // 1 hour

describe("checkRateLimit (Wave 41f, finding L2)", () => {
  it("allows the first hit", () => {
    const store = createRateLimitStore();
    const result = checkRateLimit(store, "ip:1.2.3.4", 1_000_000, {
      max: 5,
      windowMs: WINDOW,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows hits up to and including `max`", () => {
    const store = createRateLimitStore();
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(store, "ip:1.2.3.4", 1_000_000 + i, {
        max: 5,
        windowMs: WINDOW,
      });
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the 6th hit when max is 5", () => {
    const store = createRateLimitStore();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(store, "ip:1.2.3.4", 1_000_000 + i, {
        max: 5,
        windowMs: WINDOW,
      });
    }
    const blocked = checkRateLimit(store, "ip:1.2.3.4", 1_000_000 + 6, {
      max: 5,
      windowMs: WINDOW,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(1_000_000);
  });

  it("isolates keys (different IP has its own counter)", () => {
    const store = createRateLimitStore();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(store, "ip:1.1.1.1", 1_000_000 + i, {
        max: 5,
        windowMs: WINDOW,
      });
    }
    // Same time, different key — should still be allowed.
    const other = checkRateLimit(store, "ip:2.2.2.2", 1_000_010, {
      max: 5,
      windowMs: WINDOW,
    });
    expect(other.allowed).toBe(true);
  });

  it("expires hits outside the window", () => {
    const store = createRateLimitStore();
    // Five hits at t=1_000_000.
    for (let i = 0; i < 5; i++) {
      checkRateLimit(store, "ip:1.2.3.4", 1_000_000, {
        max: 5,
        windowMs: WINDOW,
      });
    }
    // One window-plus-one-ms later, the old hits are gone.
    const later = checkRateLimit(store, "ip:1.2.3.4", 1_000_000 + WINDOW + 1, {
      max: 5,
      windowMs: WINDOW,
    });
    expect(later.allowed).toBe(true);
  });

  it("handles a hit at exactly the window boundary as expired", () => {
    const store = createRateLimitStore();
    checkRateLimit(store, "ip:1.2.3.4", 0, { max: 1, windowMs: WINDOW });
    // First hit blocks the next within window:
    const within = checkRateLimit(store, "ip:1.2.3.4", WINDOW - 1, {
      max: 1,
      windowMs: WINDOW,
    });
    expect(within.allowed).toBe(false);
    // Exactly at the window boundary: hit at t=WINDOW means the t=0 hit is
    // (now - hit) = WINDOW old, which is >= windowMs and should expire.
    const atBoundary = checkRateLimit(store, "ip:1.2.3.4", WINDOW, {
      max: 1,
      windowMs: WINDOW,
    });
    expect(atBoundary.allowed).toBe(true);
  });
});
