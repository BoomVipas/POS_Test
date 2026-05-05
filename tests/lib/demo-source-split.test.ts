import { describe, it, expect } from "vitest";
import { splitBySource } from "@/lib/demo/source-split";
import type { DemoOrder, OrderSource } from "@/lib/demo/sales";

function order(
  total: number,
  source: OrderSource | undefined = undefined,
  status: "completed" | "voided" = "completed",
): DemoOrder {
  return {
    id: `o-${total}-${source ?? "x"}`,
    orderNumber: "e_1",
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: total,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: total,
    note: null,
    createdAt: new Date().toISOString(),
    items: [],
    status,
    ...(source ? { source } : {}),
  };
}

describe("splitBySource", () => {
  it("groups by source", () => {
    const rows = splitBySource([
      order(1000, "booth"),
      order(500, "booth"),
      order(2000, "qr_menu"),
      order(700, "line"),
    ]);
    expect(rows.map((r) => r.source)).toEqual(["qr_menu", "booth", "line"]);
    expect(rows[1].bills).toBe(2);
    expect(rows[1].revenueSatang).toBe(1500);
  });

  it("treats undefined source as booth (legacy orders)", () => {
    const rows = splitBySource([order(1000), order(500, "booth")]);
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("booth");
    expect(rows[0].bills).toBe(2);
    expect(rows[0].revenueSatang).toBe(1500);
  });

  it("excludes voided orders", () => {
    const rows = splitBySource([
      order(1000, "booth"),
      order(5000, "booth", "voided"),
    ]);
    expect(rows[0].revenueSatang).toBe(1000);
    expect(rows[0].bills).toBe(1);
  });

  it("returns empty when no completed orders", () => {
    expect(splitBySource([])).toEqual([]);
    expect(splitBySource([order(1000, "booth", "voided")])).toEqual([]);
  });
});
