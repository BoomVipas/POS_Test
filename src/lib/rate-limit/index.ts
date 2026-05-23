// Wave 41f — app-level rate limit for public forms (finding L2).
//
// `checkRateLimit` is the pure policy core: a sliding-window counter keyed by an
// arbitrary string. It takes `now` explicitly so tests never touch the real
// clock, and it mutates the store only when a request is allowed.
//
// This is an in-process bridge for the pre-Supabase pilot. DD-16 ships the
// Supabase-backed version (shared across serverless instances); until then a
// single Vercel instance gets best-effort protection — enough to stop the
// trivial "POST in a loop" abuse the `/apply` form is open to today.

import { createHash } from "node:crypto";

export type RateLimitStore = Map<string, number[]>;

export interface RateLimitOptions {
  /** Max allowed hits within the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Hits remaining in the current window after this one (0 when blocked). */
  remaining: number;
  /** Epoch ms when the oldest in-window hit expires (i.e. when capacity frees). */
  resetAt: number;
}

export function createRateLimitStore(): RateLimitStore {
  return new Map();
}

/**
 * Sliding-window check. A hit at time `t` counts against the window while
 * `now - t < windowMs`; at exactly `windowMs` old it has expired (boundary is
 * exclusive). Only allowed requests are recorded, so a blocked caller cannot
 * push its own reset further out.
 */
export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  now: number,
  { max, windowMs }: RateLimitOptions,
): RateLimitResult {
  const prior = store.get(key) ?? [];
  const inWindow = prior.filter((t) => now - t < windowMs);

  if (inWindow.length >= max) {
    // Keep the trimmed list so the store doesn't accrete expired hits.
    store.set(key, inWindow);
    const oldest = inWindow[0];
    return { allowed: false, remaining: 0, resetAt: oldest + windowMs };
  }

  inWindow.push(now);
  store.set(key, inWindow);
  return {
    allowed: true,
    remaining: max - inWindow.length,
    resetAt: inWindow[0] + windowMs,
  };
}

// --- Server Action bridge -------------------------------------------------

// Process-wide store. Resets on cold start, which is acceptable for a pilot
// abuse-control measure (the attacker also loses their accumulated count).
const defaultStore = createRateLimitStore();

/** Stable, non-reversible identity for an applicant: IP + hashed email. */
export function rateLimitKey(ip: string, email: string): string {
  const emailHash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
  return `apply:${ip}:${emailHash}`;
}

/** Pull the best-effort client IP from forwarding headers. */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Convenience wrapper for Server Actions. Permissive in tests so unit suites
 * for unrelated flows never trip the limiter.
 */
export function checkApplyRateLimit(
  ip: string,
  email: string,
  opts: RateLimitOptions = { max: 5, windowMs: 60 * 60 * 1000 },
  now: number = Date.now(),
): RateLimitResult {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return { allowed: true, remaining: opts.max, resetAt: now };
  }
  return checkRateLimit(defaultStore, rateLimitKey(ip, email), now, opts);
}
