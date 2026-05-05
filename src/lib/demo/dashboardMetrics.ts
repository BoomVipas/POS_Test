import type { DemoOrder } from "./sales";
import { isoDateInTZ, TH_TZ } from "@/lib/date";

export type DemoDashboardMetrics = {
  totalSatang: number;
  bills: number;
  avgBillSatang: number;
  paymentSplit: {
    cash: number;
    promptpay: number;
    transfer: number;
    card: number;
    other: number;
  };
  topSellers: Array<{
    productId: string;
    sku: string;
    name: string;
    qty: number;
    revenueSatang: number;
  }>;
  hourly: Array<{ hour: number; today: number }>;
};

export function ordersForToday(orders: DemoOrder[]): DemoOrder[] {
  const today = isoDateInTZ(new Date());
  return orders.filter((o) => isoDateInTZ(o.createdAt) === today);
}

export function computeDemoMetrics(
  orders: DemoOrder[],
): DemoDashboardMetrics {
  const today = ordersForToday(orders);

  const totalSatang = today.reduce((s, o) => s + o.totalSatang, 0);
  const bills = today.length;
  const avgBillSatang = bills > 0 ? Math.round(totalSatang / bills) : 0;

  const paymentSplit = {
    cash: 0,
    promptpay: 0,
    transfer: 0,
    card: 0,
    other: 0,
  };
  for (const o of today) {
    const m = o.paymentMethod;
    if (m === "cash") paymentSplit.cash += o.totalSatang;
    else if (m === "promptpay") paymentSplit.promptpay += o.totalSatang;
    else if (m === "transfer") paymentSplit.transfer += o.totalSatang;
    else if (m === "card") paymentSplit.card += o.totalSatang;
    else paymentSplit.other += o.totalSatang;
  }

  // Top sellers, by revenue
  const bySku = new Map<
    string,
    {
      productId: string;
      sku: string;
      name: string;
      qty: number;
      revenueSatang: number;
    }
  >();
  for (const o of today) {
    for (const it of o.items) {
      const k = it.productId;
      const cur = bySku.get(k) ?? {
        productId: it.productId,
        sku: it.sku,
        name: it.productName,
        qty: 0,
        revenueSatang: 0,
      };
      cur.qty += it.qty;
      cur.revenueSatang += it.lineTotalSatang;
      bySku.set(k, cur);
    }
  }
  const topSellers = [...bySku.values()]
    .sort((a, b) => b.revenueSatang - a.revenueSatang)
    .slice(0, 5);

  // Hour buckets 9..18 (booth hours), in TH timezone
  const hourly: Array<{ hour: number; today: number }> = [];
  for (let h = 9; h <= 18; h++) hourly.push({ hour: h, today: 0 });
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: TH_TZ,
  });
  for (const o of today) {
    const h = Number(hourFmt.format(new Date(o.createdAt)));
    const slot = hourly.find((b) => b.hour === h);
    if (slot) slot.today += o.totalSatang;
  }

  return {
    totalSatang,
    bills,
    avgBillSatang,
    paymentSplit,
    topSellers,
    hourly,
  };
}
