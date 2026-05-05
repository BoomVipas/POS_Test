// Aggregate sales by acquisition channel.
// Pattern source: Zort multi-channel breakdown, Shopee Seller Center
// channel attribution. Lets a booth seller see "60% booth / 30% qr_menu /
// 10% LINE chat" instead of a single revenue blob.

import type { DemoOrder, OrderSource } from "./sales";
import { effectiveTotalSatang } from "./sales";

export type SourceSplitRow = {
  source: OrderSource;
  bills: number;
  revenueSatang: number;
};

const ALL: OrderSource[] = [
  "booth",
  "qr_menu",
  "line",
  "shopee",
  "lazada",
  "tiktok",
  "phone",
  "other",
];

export function splitBySource(orders: DemoOrder[]): SourceSplitRow[] {
  const totals = new Map<OrderSource, SourceSplitRow>();
  for (const s of ALL) {
    totals.set(s, { source: s, bills: 0, revenueSatang: 0 });
  }
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    const src: OrderSource = o.source ?? "booth";
    const row = totals.get(src) ?? {
      source: src,
      bills: 0,
      revenueSatang: 0,
    };
    row.bills += 1;
    row.revenueSatang += effectiveTotalSatang(o);
    totals.set(src, row);
  }
  return [...totals.values()]
    .filter((r) => r.bills > 0)
    .sort((a, b) => b.revenueSatang - a.revenueSatang);
}
