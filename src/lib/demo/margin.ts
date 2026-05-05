// Pure margin / COGS helpers. Stateless and testable without React or window.
//
// Pattern source: QuickBooks "Initial cost" + COGS-at-sale snapshot, Cin7
// Core gross-margin reports. We snapshot unit_cost_satang on each order item
// at sale time so future cost edits don't rewrite history.

import type { DemoOrder, DemoOrderItem } from "./sales";
import { effectiveTotalSatang } from "./sales";

/** Cost contribution of a single line. Falls back to 0 when cost is unknown. */
export function lineCostSatang(item: DemoOrderItem): number {
  const cost = item.unitCostSatang ?? 0;
  if (cost <= 0) return 0;
  return cost * item.qty;
}

/** Total cost of goods sold for one order, ignoring shipping fees and
 *  discount. If a line has no cost recorded, it contributes 0 (treat as
 *  unknown, not free). */
export function orderCogsSatang(order: DemoOrder): number {
  if ((order.status ?? "completed") === "voided") return 0;
  // Refunds: reduce cost proportionally to refunded qty per line so margin
  // math stays honest when a partial refund happens.
  const refundedByLine = new Map<number, number>();
  for (const r of order.refunds ?? []) {
    refundedByLine.set(
      r.lineIndex,
      (refundedByLine.get(r.lineIndex) ?? 0) + r.qty,
    );
  }
  let cogs = 0;
  order.items.forEach((item, idx) => {
    const refunded = refundedByLine.get(idx) ?? 0;
    const sellableQty = Math.max(0, item.qty - refunded);
    const unit = item.unitCostSatang ?? 0;
    cogs += unit * sellableQty;
  });
  return cogs;
}

/** Gross profit = effective revenue − COGS. Excludes shipping fees from both
 *  sides (shipping is pass-through). */
export function orderGrossProfitSatang(order: DemoOrder): number {
  const rev = effectiveTotalSatang(order) - (order.shippingFeeSatang ?? 0);
  return rev - orderCogsSatang(order);
}

/** Margin percent (0..100) for an order. Returns null when the order has
 *  no recoverable cost data (every line missing cost) so the UI can render
 *  a neutral "—" instead of a misleading 100%. */
export function orderMarginPct(order: DemoOrder): number | null {
  const anyCost = order.items.some(
    (it) => (it.unitCostSatang ?? 0) > 0,
  );
  if (!anyCost) return null;
  const rev = effectiveTotalSatang(order) - (order.shippingFeeSatang ?? 0);
  if (rev <= 0) return 0;
  const profit = orderGrossProfitSatang(order);
  return Math.round((profit / rev) * 1000) / 10; // one decimal
}

/** Aggregate gross profit + COGS across many orders. */
export function aggregateMargin(orders: DemoOrder[]): {
  revenueSatang: number;
  cogsSatang: number;
  profitSatang: number;
  marginPct: number | null;
  ordersWithCost: number;
} {
  let revenue = 0;
  let cogs = 0;
  let withCost = 0;
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    revenue += effectiveTotalSatang(o) - (o.shippingFeeSatang ?? 0);
    const c = orderCogsSatang(o);
    cogs += c;
    if (c > 0) withCost++;
  }
  const profit = revenue - cogs;
  const marginPct =
    withCost === 0 || revenue <= 0
      ? null
      : Math.round((profit / revenue) * 1000) / 10;
  return {
    revenueSatang: revenue,
    cogsSatang: cogs,
    profitSatang: profit,
    marginPct,
    ordersWithCost: withCost,
  };
}

/** Per-product margin breakdown for a list of orders. Used by Top Sellers
 *  to surface profit alongside revenue. */
export function marginByProduct(orders: DemoOrder[]): Map<
  string,
  { qty: number; revenueSatang: number; cogsSatang: number; profitSatang: number }
> {
  const out = new Map<
    string,
    { qty: number; revenueSatang: number; cogsSatang: number; profitSatang: number }
  >();
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    const refundedByLine = new Map<number, number>();
    for (const r of o.refunds ?? []) {
      refundedByLine.set(
        r.lineIndex,
        (refundedByLine.get(r.lineIndex) ?? 0) + r.qty,
      );
    }
    o.items.forEach((it, idx) => {
      const refunded = refundedByLine.get(idx) ?? 0;
      const liveQty = Math.max(0, it.qty - refunded);
      if (liveQty === 0) return;
      const cur = out.get(it.productId) ?? {
        qty: 0,
        revenueSatang: 0,
        cogsSatang: 0,
        profitSatang: 0,
      };
      const lineRev = it.unitPriceSatang * liveQty;
      const lineCost = (it.unitCostSatang ?? 0) * liveQty;
      cur.qty += liveQty;
      cur.revenueSatang += lineRev;
      cur.cogsSatang += lineCost;
      cur.profitSatang += lineRev - lineCost;
      out.set(it.productId, cur);
    });
  }
  return out;
}
