// Customer profile aggregation derived from past demo sales.
// Pure logic; no localStorage I/O. Used by useDemoCustomers (which feeds it
// from useDemoSales). Replaced by Supabase customer table later, but the
// pattern stays the same: aggregate by normalized phone.

import type { DemoOrder } from "./sales";

export type CustomerProfile = {
  /** As entered (e.g. "081-234-5678" or "+66812345678"). */
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  /** Number of non-voided orders this phone has placed. */
  orderCount: number;
  /** ISO timestamp of the most-recent non-voided order. */
  lastSeenAt: string;
  /** Lifetime total in satang. */
  totalSatang: number;
};

/**
 * Canonicalize a phone for matching. Strips non-digits, drops leading "0" or
 * "66", returns the core 8-9 digit number. Returns null if the input is too
 * short to match safely (avoid false-positive merges).
 */
export function phoneKey(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  let core = digits;
  if (core.startsWith("66")) core = core.slice(2);
  else if (core.startsWith("0")) core = core.slice(1);
  if (core.length < 8 || core.length > 10) return null;
  return core;
}

export function deriveCustomerProfiles(
  orders: DemoOrder[],
): Map<string, CustomerProfile> {
  const out = new Map<string, CustomerProfile>();
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    const k = phoneKey(o.customerPhone);
    if (!k) continue;
    const existing = out.get(k);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSatang += o.totalSatang;
      // Keep the most-recent non-empty fields visible.
      if (o.createdAt > existing.lastSeenAt) {
        existing.lastSeenAt = o.createdAt;
        existing.phone = o.customerPhone ?? existing.phone;
        if (o.customerName) existing.name = o.customerName;
        if (o.customerEmail) existing.email = o.customerEmail;
        if (o.shippingAddress) existing.address = o.shippingAddress;
      }
    } else {
      out.set(k, {
        phone: o.customerPhone ?? "",
        name: o.customerName,
        email: o.customerEmail,
        address: o.shippingAddress ?? null,
        orderCount: 1,
        lastSeenAt: o.createdAt,
        totalSatang: o.totalSatang,
      });
    }
  }
  return out;
}

export function findCustomerByPhone(
  orders: DemoOrder[],
  phone: string,
): CustomerProfile | null {
  const k = phoneKey(phone);
  if (!k) return null;
  return deriveCustomerProfiles(orders).get(k) ?? null;
}
