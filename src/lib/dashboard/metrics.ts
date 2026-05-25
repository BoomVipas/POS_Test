import { TH_TZ } from "@/lib/date";

// Real-data dashboard metrics — the configured-mode counterpart to the demo's
// `computeMetricsFor` (lib/demo/dashboardMetrics.ts), aggregated from real
// `orders` + `order_items` rows. Same shape so the UI renders either source.
// Pure + side-effect-free → unit-tested without a DB; the server action
// (metrics-actions.ts) just fetches RLS-scoped rows and delegates here.

export type DashboardPaymentSplit = {
  cash: number;
  promptpay: number;
  transfer: number;
  card: number;
  other: number;
};

export type DashboardTopSeller = {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  revenueSatang: number;
};

export type DashboardMetrics = {
  totalSatang: number;
  bills: number;
  avgBillSatang: number;
  paymentSplit: DashboardPaymentSplit;
  topSellers: DashboardTopSeller[];
  hourly: Array<{ hour: number; total: number }>;
};

// Narrow inputs — only the columns we aggregate, so the pure fn is decoupled
// from the full DB Row types and trivially testable.
export type MetricsOrderRow = {
  id: string;
  total_satang: number;
  payment_method: string;
  status: string;
  created_at: string;
};
export type MetricsItemRow = {
  order_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty: number;
  line_total_satang: number;
  is_sample: boolean;
};

const VOIDED = "voided";

export function computeDashboardMetrics(
  orders: MetricsOrderRow[],
  items: MetricsItemRow[],
): DashboardMetrics {
  const live = orders.filter((o) => o.status !== VOIDED);
  const liveIds = new Set(live.map((o) => o.id));

  const totalSatang = live.reduce((s, o) => s + o.total_satang, 0);
  const bills = live.length;
  const avgBillSatang = bills > 0 ? Math.round(totalSatang / bills) : 0;

  const paymentSplit: DashboardPaymentSplit = {
    cash: 0,
    promptpay: 0,
    transfer: 0,
    card: 0,
    other: 0,
  };
  for (const o of live) {
    const v = o.total_satang;
    switch (o.payment_method) {
      case "cash":
        paymentSplit.cash += v;
        break;
      case "promptpay":
        paymentSplit.promptpay += v;
        break;
      case "transfer":
        paymentSplit.transfer += v;
        break;
      case "card":
        paymentSplit.card += v;
        break;
      default:
        // mixed / sample / anything unmapped
        paymentSplit.other += v;
    }
  }

  // Top sellers by revenue — only items on non-voided orders, excluding free
  // samples (they carry no revenue).
  const bySku = new Map<string, DashboardTopSeller>();
  for (const it of items) {
    if (!liveIds.has(it.order_id) || it.is_sample) continue;
    const cur = bySku.get(it.product_id) ?? {
      productId: it.product_id,
      sku: it.sku,
      name: it.product_name,
      qty: 0,
      revenueSatang: 0,
    };
    cur.qty += it.qty;
    cur.revenueSatang += it.line_total_satang;
    bySku.set(it.product_id, cur);
  }
  const topSellers = [...bySku.values()]
    .sort((a, b) => b.revenueSatang - a.revenueSatang)
    .slice(0, 5);

  // Booth-hour buckets 9..18 in Thailand time (matches the demo dashboard).
  const hourly: Array<{ hour: number; total: number }> = [];
  for (let h = 9; h <= 18; h++) hourly.push({ hour: h, total: 0 });
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: TH_TZ,
  });
  for (const o of live) {
    const h = Number(hourFmt.format(new Date(o.created_at)));
    const slot = hourly.find((b) => b.hour === h);
    if (slot) slot.total += o.total_satang;
  }

  return { totalSatang, bills, avgBillSatang, paymentSplit, topSellers, hourly };
}
