// QR self-order "claim cart" — a customer's phone builds a cart on /qr-menu
// and submits it. The cashier at /app/pos enters the 4-char code to import.
//
// In demo mode the storage is a shared localStorage entry (works for the
// single-device demo). When real Supabase ships, the claim becomes a row in
// a `qr_claims` table; the API is the same shape.

import type { CartLine } from "@/lib/pos/types";

export const DEMO_CLAIMS_KEY = "pos-for-sell:demo-qr-claims:v1";

/** 4-char alphanumeric (ambiguity-safe alphabet). */
const CLAIM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export type ClaimStatus = "open" | "redeemed" | "cancelled" | "expired";

export type DemoClaim = {
  id: string;
  /** 4-char short code shown to the customer (A-Z0-9, no I/L/O/0/1). */
  code: string;
  /** Cart at the time of submission. */
  lines: CartLine[];
  /** Optional contact info for the staff to recognize the customer. */
  customerName: string;
  status: ClaimStatus;
  createdAt: string;
  /** ISO timestamp set when the cashier imports the claim. */
  redeemedAt: string | null;
  /** ISO timestamp when this claim auto-expires. Default 4 hours after creation. */
  expiresAt: string;
};

export const DEFAULT_TTL_MINUTES = 4 * 60; // 4 hours — covers a long booth shift

export function readClaims(): DemoClaim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CLAIMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoClaim[]) : [];
  } catch {
    return [];
  }
}

export function writeClaims(claims: DemoClaim[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_CLAIMS_KEY, JSON.stringify(claims));
  } catch {
    // quota — silently drop
  }
}

export function clearClaims(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_CLAIMS_KEY);
}

/** Pure: generate a code that is not in the existing list. */
export function generateUniqueCode(
  existing: ReadonlyArray<{ code: string }>,
  length: number = 4,
  rng: () => number = Math.random,
): string {
  const used = new Set(existing.map((c) => c.code));
  // Up to 32 attempts to avoid astronomical collision after many claims.
  for (let i = 0; i < 32; i++) {
    let s = "";
    for (let j = 0; j < length; j++) {
      s += CLAIM_ALPHABET[Math.floor(rng() * CLAIM_ALPHABET.length)];
    }
    if (!used.has(s)) return s;
  }
  // Last resort: extend by one character.
  return generateUniqueCode(existing, length + 1, rng);
}

/** Pure: lookup an open, unexpired claim by code. */
export function findRedeemableClaim(
  claims: ReadonlyArray<DemoClaim>,
  code: string,
  now: Date = new Date(),
): DemoClaim | null {
  const c = claims.find(
    (x) => x.code === code.toUpperCase().trim() && x.status === "open",
  );
  if (!c) return null;
  if (Date.parse(c.expiresAt) < now.getTime()) return null;
  return c;
}

export function newClaimId(): string {
  return `claim-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
