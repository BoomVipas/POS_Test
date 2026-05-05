import { describe, it, expect } from "vitest";
import {
  aggregateMargin,
  lineCostSatang,
  marginByProduct,
  orderCogsSatang,
  orderGrossProfitSatang,
  orderMarginPct,
} from "@/lib/demo/margin";
import type { DemoOrder } from "@/lib/demo/sales";

function makeOrder(partial: Partial<DemoOrder> = {}): DemoOrder {
  return {
    id: "o1",
    orderNumber: "event_001",
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: 0,
    note: null,
    createdAt: new Date().toISOString(),
    items: [],
    ...partial,
  };
}

describe("lineCostSatang", () => {
  it("returns 0 when no cost is recorded", () => {
    expect(
      lineCostSatang({
        productId: "p",
        sku: "S",
        productName: "x",
        qty: 3,
        unitPriceSatang: 10000,
        lineTotalSatang: 30000,
        fulfillmentType: "take_now",
      }),
    ).toBe(0);
  });

  it("multiplies cost by qty", () => {
    expect(
      lineCostSatang({
        productId: "p",
        sku: "S",
        productName: "x",
        qty: 3,
        unitPriceSatang: 10000,
        lineTotalSatang: 30000,
        fulfillmentType: "take_now",
        unitCostSatang: 4000,
      }),
    ).toBe(12000);
  });
});

describe("orderCogsSatang", () => {
  it("sums cost across lines", () => {
    const o = makeOrder({
      items: [
        {
          productId: "p1",
          sku: "A",
          productName: "A",
          qty: 2,
          unitPriceSatang: 10000,
          lineTotalSatang: 20000,
          fulfillmentType: "take_now",
          unitCostSatang: 4000,
        },
        {
          productId: "p2",
          sku: "B",
          productName: "B",
          qty: 1,
          unitPriceSatang: 5000,
          lineTotalSatang: 5000,
          fulfillmentType: "take_now",
          unitCostSatang: 2000,
        },
      ],
    });
    expect(orderCogsSatang(o)).toBe(2 * 4000 + 1 * 2000);
  });

  it("voided order has zero COGS", () => {
    const o = makeOrder({
      status: "voided",
      items: [
        {
          productId: "p1",
          sku: "A",
          productName: "A",
          qty: 2,
          unitPriceSatang: 10000,
          lineTotalSatang: 20000,
          fulfillmentType: "take_now",
          unitCostSatang: 4000,
        },
      ],
    });
    expect(orderCogsSatang(o)).toBe(0);
  });

  it("subtracts cost for refunded qty", () => {
    const o = makeOrder({
      items: [
        {
          productId: "p1",
          sku: "A",
          productName: "A",
          qty: 3,
          unitPriceSatang: 10000,
          lineTotalSatang: 30000,
          fulfillmentType: "take_now",
          unitCostSatang: 4000,
        },
      ],
      refunds: [
        {
          id: "r1",
          lineIndex: 0,
          qty: 1,
          amountSatang: 10000,
          reason: "broken",
          refundedAt: new Date().toISOString(),
        },
      ],
    });
    // 2 sellable units * 4000 cost = 8000
    expect(orderCogsSatang(o)).toBe(8000);
  });
});

describe("orderGrossProfitSatang", () => {
  it("excludes shipping from both revenue and cogs", () => {
    const o = makeOrder({
      shippingFeeSatang: 5000,
      totalSatang: 30000, // includes the shipping
      items: [
        {
          productId: "p1",
          sku: "A",
          productName: "A",
          qty: 1,
          unitPriceSatang: 25000,
          lineTotalSatang: 25000,
          fulfillmentType: "send_later",
          unitCostSatang: 10000,
        },
      ],
    });
    // revenue (effective - shipping) = 30000 - 5000 = 25000
    // cogs = 10000
    expect(orderGrossProfitSatang(o)).toBe(15000);
  });
});

describe("orderMarginPct", () => {
  it("returns null when no line has cost", () => {
    const o = makeOrder({
      totalSatang: 10000,
      items: [
        {
          productId: "p",
          sku: "A",
          productName: "A",
          qty: 1,
          unitPriceSatang: 10000,
          lineTotalSatang: 10000,
          fulfillmentType: "take_now",
        },
      ],
    });
    expect(orderMarginPct(o)).toBeNull();
  });

  it("returns one-decimal percent", () => {
    const o = makeOrder({
      totalSatang: 10000,
      items: [
        {
          productId: "p",
          sku: "A",
          productName: "A",
          qty: 1,
          unitPriceSatang: 10000,
          lineTotalSatang: 10000,
          fulfillmentType: "take_now",
          unitCostSatang: 4000,
        },
      ],
    });
    // (10000 - 4000) / 10000 = 60.0
    expect(orderMarginPct(o)).toBe(60);
  });
});

describe("aggregateMargin", () => {
  it("aggregates revenue, cogs, profit across orders", () => {
    const o1 = makeOrder({
      id: "o1",
      totalSatang: 10000,
      items: [
        {
          productId: "p",
          sku: "A",
          productName: "A",
          qty: 1,
          unitPriceSatang: 10000,
          lineTotalSatang: 10000,
          fulfillmentType: "take_now",
          unitCostSatang: 4000,
        },
      ],
    });
    const o2 = makeOrder({
      id: "o2",
      totalSatang: 5000,
      items: [
        {
          productId: "p2",
          sku: "B",
          productName: "B",
          qty: 1,
          unitPriceSatang: 5000,
          lineTotalSatang: 5000,
          fulfillmentType: "take_now",
          unitCostSatang: 2000,
        },
      ],
    });
    const m = aggregateMargin([o1, o2]);
    expect(m.revenueSatang).toBe(15000);
    expect(m.cogsSatang).toBe(6000);
    expect(m.profitSatang).toBe(9000);
    expect(m.marginPct).toBe(60);
    expect(m.ordersWithCost).toBe(2);
  });

  it("returns null margin when no order has cost data", () => {
    const o = makeOrder({
      totalSatang: 10000,
      items: [
        {
          productId: "p",
          sku: "A",
          productName: "A",
          qty: 1,
          unitPriceSatang: 10000,
          lineTotalSatang: 10000,
          fulfillmentType: "take_now",
        },
      ],
    });
    const m = aggregateMargin([o]);
    expect(m.marginPct).toBeNull();
    expect(m.cogsSatang).toBe(0);
  });
});

describe("marginByProduct", () => {
  it("groups by productId across orders", () => {
    const a1 = {
      productId: "p1",
      sku: "A",
      productName: "A",
      qty: 2,
      unitPriceSatang: 10000,
      lineTotalSatang: 20000,
      fulfillmentType: "take_now" as const,
      unitCostSatang: 4000,
    };
    const a2 = { ...a1, qty: 3, lineTotalSatang: 30000 };
    const out = marginByProduct([
      makeOrder({ id: "x", items: [a1] }),
      makeOrder({ id: "y", items: [a2] }),
    ]);
    const p = out.get("p1");
    expect(p).toBeDefined();
    expect(p!.qty).toBe(5);
    expect(p!.revenueSatang).toBe(50000);
    expect(p!.cogsSatang).toBe(20000);
    expect(p!.profitSatang).toBe(30000);
  });
});
