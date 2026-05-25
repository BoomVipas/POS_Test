import { describe, it, expect } from "vitest";
import {
  computeDashboardMetrics,
  type MetricsOrderRow,
  type MetricsItemRow,
} from "@/lib/dashboard/metrics";

const order = (over: Partial<MetricsOrderRow>): MetricsOrderRow => ({
  id: "o1",
  total_satang: 10000,
  payment_method: "cash",
  status: "completed",
  created_at: "2026-05-26T03:00:00Z", // 10:00 in Asia/Bangkok (UTC+7)
  ...over,
});

const item = (over: Partial<MetricsItemRow>): MetricsItemRow => ({
  order_id: "o1",
  product_id: "p1",
  sku: "SKU1",
  product_name: "Cat Scratcher",
  qty: 1,
  line_total_satang: 10000,
  is_sample: false,
  ...over,
});

describe("computeDashboardMetrics (real data)", () => {
  it("empty input → all zeros", () => {
    const m = computeDashboardMetrics([], []);
    expect(m.totalSatang).toBe(0);
    expect(m.bills).toBe(0);
    expect(m.avgBillSatang).toBe(0);
    expect(m.topSellers).toEqual([]);
    expect(m.hourly.every((h) => h.total === 0)).toBe(true);
  });

  it("sums totals, counts bills, rounds the average", () => {
    const m = computeDashboardMetrics(
      [order({ id: "a", total_satang: 10000 }), order({ id: "b", total_satang: 5001 })],
      [],
    );
    expect(m.totalSatang).toBe(15001);
    expect(m.bills).toBe(2);
    expect(m.avgBillSatang).toBe(7501); // round(15001/2)
  });

  it("excludes voided orders from totals, bills, and top sellers", () => {
    const orders = [
      order({ id: "a", total_satang: 10000 }),
      order({ id: "v", total_satang: 9999, status: "voided" }),
    ];
    const items = [
      item({ order_id: "a", product_id: "p1", line_total_satang: 10000 }),
      item({ order_id: "v", product_id: "p9", line_total_satang: 9999 }),
    ];
    const m = computeDashboardMetrics(orders, items);
    expect(m.totalSatang).toBe(10000);
    expect(m.bills).toBe(1);
    expect(m.topSellers.map((t) => t.productId)).toEqual(["p1"]);
  });

  it("buckets revenue by payment method; unmapped → other", () => {
    const m = computeDashboardMetrics(
      [
        order({ id: "a", payment_method: "cash", total_satang: 100 }),
        order({ id: "b", payment_method: "promptpay", total_satang: 200 }),
        order({ id: "c", payment_method: "transfer", total_satang: 300 }),
        order({ id: "d", payment_method: "card", total_satang: 400 }),
        order({ id: "e", payment_method: "mixed", total_satang: 500 }),
      ],
      [],
    );
    expect(m.paymentSplit).toEqual({
      cash: 100,
      promptpay: 200,
      transfer: 300,
      card: 400,
      other: 500,
    });
  });

  it("groups top sellers by product, sorts by revenue, excludes samples, caps at 5", () => {
    const orders = [order({ id: "a" })];
    const items = [
      item({ order_id: "a", product_id: "p1", qty: 1, line_total_satang: 300 }),
      item({ order_id: "a", product_id: "p1", qty: 2, line_total_satang: 600 }),
      item({ order_id: "a", product_id: "p2", qty: 5, line_total_satang: 5000 }),
      item({ order_id: "a", product_id: "free", qty: 1, line_total_satang: 0, is_sample: true }),
    ];
    const m = computeDashboardMetrics(orders, items);
    expect(m.topSellers[0].productId).toBe("p2"); // highest revenue first
    expect(m.topSellers.find((t) => t.productId === "p1")).toMatchObject({
      qty: 3,
      revenueSatang: 900,
    });
    expect(m.topSellers.some((t) => t.productId === "free")).toBe(false);
  });

  it("buckets revenue into the correct Bangkok hour", () => {
    // 03:00Z → 10:00 Asia/Bangkok
    const m = computeDashboardMetrics(
      [order({ id: "a", created_at: "2026-05-26T03:00:00Z", total_satang: 1000 })],
      [],
    );
    expect(m.hourly.find((h) => h.hour === 10)?.total).toBe(1000);
    expect(m.hourly.find((h) => h.hour === 11)?.total).toBe(0);
  });
});
