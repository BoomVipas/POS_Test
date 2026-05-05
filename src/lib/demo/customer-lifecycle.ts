// Customer lifecycle stage + LTV helpers.
//
// Pattern source: HubSpot lifecycle stages, Klaviyo RFM segmentation,
// Shopify customer reports (first-time vs returning vs at-risk).
// Booth-seller-relevant subset:
//   new        → 1 order ever
//   returning  → 2-4 orders
//   vip        → 5+ orders OR lifetime spend ≥ 5,000 THB
//   dormant    → 90+ days since last order, regardless of count
// We intentionally avoid HubSpot's "MQL/SQL" funnel — booth sellers
// don't have a marketing pipeline to gate. Dormant takes precedence so
// "VIP last seen 6 months ago" surfaces correctly.

import type { CustomerProfile } from "./customers";
import { phoneKey } from "./customers";
import { effectiveTotalSatang, type DemoOrder } from "./sales";
import { isoDateInTZ } from "@/lib/date";

export type LifecycleStage = "new" | "returning" | "vip" | "dormant";

const VIP_ORDER_COUNT = 5;
const VIP_LIFETIME_SATANG = 500_000; // 5,000 THB
const DORMANT_DAYS = 90;

/** Days between two ISO timestamps, computed in TH timezone so the
 *  "lastSeen 5 days ago" semantic doesn't drift across midnight UTC. */
export function daysBetween(
  fromIso: string,
  toIso: string = new Date().toISOString(),
): number {
  const a = isoDateInTZ(fromIso);
  const b = isoDateInTZ(toIso);
  const ms = Date.parse(b) - Date.parse(a);
  return Math.floor(ms / 86400000);
}

export function lifecycleStageFor(
  profile: CustomerProfile,
  now: Date = new Date(),
): LifecycleStage {
  const days = daysBetween(profile.lastSeenAt, now.toISOString());
  if (days >= DORMANT_DAYS) return "dormant";
  if (
    profile.orderCount >= VIP_ORDER_COUNT ||
    profile.totalSatang >= VIP_LIFETIME_SATANG
  ) {
    return "vip";
  }
  if (profile.orderCount >= 2) return "returning";
  return "new";
}

/** Top product for one customer across all their orders. Returns null if
 *  the profile has no orders (shouldn't happen for derived profiles). */
export function topProductForCustomer(
  profile: CustomerProfile,
  orders: DemoOrder[],
): {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  revenueSatang: number;
} | null {
  const k = phoneKey(profile.phone);
  if (!k) return null;
  const matches = orders.filter((o) => {
    if ((o.status ?? "completed") === "voided") return false;
    return phoneKey(o.customerPhone) === k;
  });
  const bySku = new Map<
    string,
    { productId: string; sku: string; name: string; qty: number; revenueSatang: number }
  >();
  for (const o of matches) {
    for (const it of o.items) {
      const cur = bySku.get(it.productId) ?? {
        productId: it.productId,
        sku: it.sku,
        name: it.productName,
        qty: 0,
        revenueSatang: 0,
      };
      cur.qty += it.qty;
      cur.revenueSatang += it.lineTotalSatang;
      bySku.set(it.productId, cur);
    }
  }
  if (bySku.size === 0) return null;
  return [...bySku.values()].sort(
    (a, b) => b.revenueSatang - a.revenueSatang,
  )[0];
}

/** First-seen timestamp for one customer (oldest non-voided order). */
export function firstSeenAt(
  profile: CustomerProfile,
  orders: DemoOrder[],
): string | null {
  const k = phoneKey(profile.phone);
  if (!k) return null;
  const matches = orders
    .filter(
      (o) =>
        (o.status ?? "completed") !== "voided" &&
        phoneKey(o.customerPhone) === k,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return matches[0]?.createdAt ?? null;
}

/** Net revenue (after refunds) attributable to one customer. Useful when
 *  a profile's totalSatang in CustomerProfile counts gross — we want net
 *  for honest LTV. */
export function netRevenueForCustomer(
  profile: CustomerProfile,
  orders: DemoOrder[],
): number {
  const k = phoneKey(profile.phone);
  if (!k) return 0;
  let total = 0;
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    if (phoneKey(o.customerPhone) !== k) continue;
    total += effectiveTotalSatang(o);
  }
  return total;
}

export function lifecycleLabel(stage: LifecycleStage): string {
  switch (stage) {
    case "new":
      return "New";
    case "returning":
      return "Returning";
    case "vip":
      return "VIP";
    case "dormant":
      return "Dormant";
  }
}
