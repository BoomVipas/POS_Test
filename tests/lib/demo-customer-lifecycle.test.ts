import { describe, it, expect } from "vitest";
import {
  daysBetween,
  firstSeenAt,
  lifecycleLabel,
  lifecycleStageFor,
  netRevenueForCustomer,
  topProductForCustomer,
} from "@/lib/demo/customer-lifecycle";
import type { CustomerProfile } from "@/lib/demo/customers";
import type { DemoOrder } from "@/lib/demo/sales";

const NOW = new Date("2026-05-04T12:00:00Z");

function profile(o: Partial<CustomerProfile> = {}): CustomerProfile {
  return {
    phone: "+66812345678",
    name: "Tester",
    email: null,
    address: null,
    orderCount: 1,
    lastSeenAt: NOW.toISOString(),
    totalSatang: 50000,
    pointsEarned: 0,
    pointsRedeemed: 0,
    pointsAvailable: 0,
    ...o,
  };
}

function order(
  date: string,
  total: number,
  phone: string = "+66812345678",
  status: "completed" | "voided" = "completed",
  items: DemoOrder["items"] = [],
): DemoOrder {
  return {
    id: `o-${date}-${total}`,
    orderNumber: "e_1",
    customerName: null,
    customerPhone: phone,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: total,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: total,
    note: null,
    createdAt: `${date}T05:00:00Z`,
    items,
    status,
  };
}

describe("daysBetween", () => {
  it("computes whole days in TH tz", () => {
    expect(daysBetween("2026-04-30T05:00:00Z", "2026-05-04T05:00:00Z")).toBe(4);
  });
});

describe("lifecycleStageFor", () => {
  it("first single recent order = new", () => {
    expect(
      lifecycleStageFor(
        profile({ orderCount: 1, lastSeenAt: NOW.toISOString() }),
        NOW,
      ),
    ).toBe("new");
  });

  it("2+ orders = returning", () => {
    expect(
      lifecycleStageFor(profile({ orderCount: 2 }), NOW),
    ).toBe("returning");
  });

  it("5+ orders = vip", () => {
    expect(lifecycleStageFor(profile({ orderCount: 5 }), NOW)).toBe("vip");
  });

  it("lifetime spend >= 5000 THB = vip even at 1 order", () => {
    expect(
      lifecycleStageFor(
        profile({ orderCount: 1, totalSatang: 600_000 }),
        NOW,
      ),
    ).toBe("vip");
  });

  it("90+ days inactive = dormant regardless of orderCount", () => {
    expect(
      lifecycleStageFor(
        profile({
          orderCount: 10,
          lastSeenAt: new Date("2025-12-01T05:00:00Z").toISOString(),
        }),
        NOW,
      ),
    ).toBe("dormant");
  });
});

describe("topProductForCustomer", () => {
  it("returns highest revenue SKU", () => {
    const orders = [
      order("2026-04-01", 5000, "+66812345678", "completed", [
        {
          productId: "pA",
          sku: "A",
          productName: "Treat",
          qty: 2,
          unitPriceSatang: 2500,
          lineTotalSatang: 5000,
          fulfillmentType: "take_now",
        },
      ]),
      order("2026-04-15", 10000, "+66812345678", "completed", [
        {
          productId: "pB",
          sku: "B",
          productName: "Bed",
          qty: 1,
          unitPriceSatang: 10000,
          lineTotalSatang: 10000,
          fulfillmentType: "take_now",
        },
      ]),
    ];
    const top = topProductForCustomer(profile(), orders);
    expect(top?.sku).toBe("B");
    expect(top?.revenueSatang).toBe(10000);
  });

  it("returns null when no matching orders", () => {
    expect(topProductForCustomer(profile(), [])).toBeNull();
  });
});

describe("firstSeenAt", () => {
  it("returns oldest non-voided order timestamp", () => {
    const orders = [
      order("2026-04-15", 1000),
      order("2026-04-01", 1000),
      order("2026-04-10", 1000),
    ];
    expect(firstSeenAt(profile(), orders)).toContain("2026-04-01");
  });
});

describe("netRevenueForCustomer", () => {
  it("uses effectiveTotal (excludes voids)", () => {
    const orders = [
      order("2026-05-01", 1000),
      order("2026-05-02", 5000, "+66812345678", "voided"),
      order("2026-05-03", 2000),
    ];
    expect(netRevenueForCustomer(profile(), orders)).toBe(3000);
  });
});

describe("lifecycleLabel", () => {
  it("maps stages to user-facing strings", () => {
    expect(lifecycleLabel("new")).toBe("New");
    expect(lifecycleLabel("vip")).toBe("VIP");
  });
});
