import { describe, it, expect } from "vitest";
import {
  effectiveTotalSatang,
  remainingQty,
  type DemoOrder,
  type DemoOrderItem,
  type DemoRefund,
} from "@/lib/demo/sales";

function item(overrides: Partial<DemoOrderItem> = {}): DemoOrderItem {
  return {
    productId: "p-001",
    sku: "DEMO-001",
    productName: "Cat Hoodie",
    qty: 1,
    unitPriceSatang: 89000,
    lineTotalSatang: 89000,
    fulfillmentType: "take_now",
    ...overrides,
  };
}

function order(p: Partial<DemoOrder> = {}): DemoOrder {
  return {
    id: p.id ?? "demo-1",
    orderNumber: p.orderNumber ?? "event_001",
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: p.totalSatang ?? 100000,
    note: null,
    createdAt: new Date().toISOString(),
    items: p.items ?? [item()],
    ...p,
  };
}

const refund = (lineIndex: number, qty: number, amountSatang: number): DemoRefund => ({
  id: `r-${lineIndex}-${qty}`,
  lineIndex,
  qty,
  amountSatang,
  reason: "test",
  refundedAt: new Date().toISOString(),
});

describe("sales/effectiveTotalSatang", () => {
  it("returns full total when no refunds", () => {
    expect(effectiveTotalSatang(order({ totalSatang: 89000 }))).toBe(89000);
  });

  it("returns 0 for voided orders, regardless of refunds", () => {
    expect(
      effectiveTotalSatang(
        order({
          totalSatang: 89000,
          status: "voided",
          refunds: [refund(0, 1, 89000)],
        }),
      ),
    ).toBe(0);
  });

  it("subtracts a partial refund", () => {
    expect(
      effectiveTotalSatang(
        order({ totalSatang: 100000, refunds: [refund(0, 1, 30000)] }),
      ),
    ).toBe(70000);
  });

  it("sums multiple refunds across the same order", () => {
    expect(
      effectiveTotalSatang(
        order({
          totalSatang: 100000,
          refunds: [refund(0, 1, 20000), refund(1, 1, 30000)],
        }),
      ),
    ).toBe(50000);
  });

  it("clamps to 0 (no negative effective total)", () => {
    expect(
      effectiveTotalSatang(
        order({
          totalSatang: 50000,
          refunds: [refund(0, 1, 99999)],
        }),
      ),
    ).toBe(0);
  });
});

describe("sales/remainingQty", () => {
  const items = [
    item({ qty: 3 }),
    item({ qty: 1, productId: "p-002", sku: "DEMO-002" }),
  ];

  it("returns full qty when no refunds", () => {
    expect(remainingQty(order({ items }), 0)).toBe(3);
    expect(remainingQty(order({ items }), 1)).toBe(1);
  });

  it("subtracts refunds against the same line index", () => {
    expect(
      remainingQty(
        order({
          items,
          refunds: [refund(0, 2, 0)],
        }),
        0,
      ),
    ).toBe(1);
  });

  it("ignores refunds for other line indices", () => {
    expect(
      remainingQty(
        order({
          items,
          refunds: [refund(1, 1, 0)],
        }),
        0,
      ),
    ).toBe(3);
  });

  it("returns 0 for unknown line index", () => {
    expect(remainingQty(order({ items }), 99)).toBe(0);
  });

  it("clamps to 0 even when refunds exceed original (defensive)", () => {
    expect(
      remainingQty(
        order({
          items,
          refunds: [refund(0, 999, 0)],
        }),
        0,
      ),
    ).toBe(0);
  });
});
