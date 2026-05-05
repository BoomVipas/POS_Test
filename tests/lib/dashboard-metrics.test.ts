import { describe, it, expect } from "vitest";
import {
  computeDemoMetrics,
  ordersForToday,
} from "@/lib/demo/dashboardMetrics";
import type { DemoOrder } from "@/lib/demo/sales";

function order(opts: Partial<DemoOrder> = {}): DemoOrder {
  return {
    id: opts.id ?? "demo-1",
    orderNumber: opts.orderNumber ?? "event_001",
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: opts.paymentMethod ?? "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: opts.totalSatang ?? 0,
    note: null,
    createdAt: opts.createdAt ?? new Date().toISOString(),
    items: opts.items ?? [],
    ...opts,
  };
}

describe("dashboardMetrics/ordersForToday", () => {
  it("returns only orders dated today (TH timezone)", () => {
    const todayIso = new Date().toISOString();
    const yesterdayIso = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const today = order({ id: "today", createdAt: todayIso });
    const yesterday = order({ id: "yesterday", createdAt: yesterdayIso });
    const out = ordersForToday([today, yesterday]);
    expect(out.map((o) => o.id)).toEqual(["today"]);
  });
});

describe("dashboardMetrics/computeDemoMetrics", () => {
  const now = new Date().toISOString();

  it("zero orders → zero totals", () => {
    const m = computeDemoMetrics([]);
    expect(m).toMatchObject({
      totalSatang: 0,
      bills: 0,
      avgBillSatang: 0,
    });
    expect(m.paymentSplit.cash).toBe(0);
    expect(m.topSellers).toEqual([]);
  });

  it("sums totalSatang across today's orders", () => {
    const m = computeDemoMetrics([
      order({ id: "1", totalSatang: 89000, createdAt: now }),
      order({ id: "2", totalSatang: 19000, createdAt: now }),
    ]);
    expect(m.totalSatang).toBe(108000);
    expect(m.bills).toBe(2);
    expect(m.avgBillSatang).toBe(54000);
  });

  it("partitions paymentSplit by method", () => {
    const m = computeDemoMetrics([
      order({ totalSatang: 50000, paymentMethod: "cash", createdAt: now }),
      order({ totalSatang: 30000, paymentMethod: "promptpay", createdAt: now }),
      order({ totalSatang: 20000, paymentMethod: "card", createdAt: now }),
    ]);
    expect(m.paymentSplit.cash).toBe(50000);
    expect(m.paymentSplit.promptpay).toBe(30000);
    expect(m.paymentSplit.card).toBe(20000);
    expect(m.paymentSplit.transfer).toBe(0);
  });

  it("ranks top sellers by revenue", () => {
    const m = computeDemoMetrics([
      order({
        id: "o1",
        totalSatang: 89000,
        createdAt: now,
        items: [
          {
            productId: "p1",
            sku: "A",
            productName: "Hoodie",
            qty: 1,
            unitPriceSatang: 89000,
            lineTotalSatang: 89000,
            fulfillmentType: "take_now",
          },
        ],
      }),
      order({
        id: "o2",
        totalSatang: 38000,
        createdAt: now,
        items: [
          {
            productId: "p2",
            sku: "B",
            productName: "Toy",
            qty: 2,
            unitPriceSatang: 19000,
            lineTotalSatang: 38000,
            fulfillmentType: "take_now",
          },
        ],
      }),
    ]);
    expect(m.topSellers[0]).toMatchObject({ sku: "A", revenueSatang: 89000 });
    expect(m.topSellers[1]).toMatchObject({ sku: "B", revenueSatang: 38000, qty: 2 });
  });

  it("ignores orders not dated today", () => {
    const yesterday = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const m = computeDemoMetrics([
      order({ id: "old", totalSatang: 99999, createdAt: yesterday }),
    ]);
    expect(m.totalSatang).toBe(0);
    expect(m.bills).toBe(0);
  });
});
