import { describe, it, expect } from "vitest";
import {
  allocationTotal,
  buildDraftFromCatalog,
  clampDays,
  computeEventSummary,
  syncToCatalog,
  withDayCount,
  DEFAULT_DAYS,
  MAX_DAYS,
  MIN_DAYS,
  type EventSetup,
} from "@/lib/demo/event-setup";
import type { Product } from "@/lib/pos/types";

function p(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    workspace_id: "demo",
    sku: "X1",
    name: "Test",
    category: "x",
    price_satang: 10000,
    shipping_fee_satang: 0,
    send_later_enabled: false,
    is_active: true,
    image_path: null,
    current_qty: 10,
    ...overrides,
  };
}

describe("buildDraftFromCatalog", () => {
  it("creates a zeroed allocation per active product, days = dayCount", () => {
    const draft = buildDraftFromCatalog(
      [
        p({ id: "a", sku: "A" }),
        p({ id: "b", sku: "B" }),
        p({ id: "c", sku: "C", is_active: false }),
      ],
      4,
    );
    expect(draft.dayCount).toBe(4);
    expect(draft.allocations.map((a) => a.productId)).toEqual(["a", "b"]); // inactive excluded
    expect(draft.allocations[0].days).toEqual([0, 0, 0, 0]);
    expect(draft.allocations[0].sample).toBe(0);
    expect(draft.status).toBe("draft");
  });

  it("clamps out-of-range day counts", () => {
    expect(buildDraftFromCatalog([], 99).dayCount).toBe(MAX_DAYS);
    expect(buildDraftFromCatalog([], 0).dayCount).toBe(MIN_DAYS);
  });
});

describe("clampDays", () => {
  it("clamps, rounds, and falls back on NaN", () => {
    expect(clampDays(0)).toBe(MIN_DAYS);
    expect(clampDays(99)).toBe(MAX_DAYS);
    expect(clampDays(3.6)).toBe(4);
    expect(clampDays(NaN)).toBe(DEFAULT_DAYS);
  });
});

describe("allocationTotal", () => {
  it("sums booth days and ignores the sample column", () => {
    expect(
      allocationTotal({ productId: "a", days: [2, 3, 0, 1], sample: 5 }),
    ).toBe(6);
  });
});

describe("computeEventSummary", () => {
  it("counts allocated SKUs, booth units, samples, and estimated retail", () => {
    const catalog = [
      p({ id: "a", price_satang: 10000 }),
      p({ id: "b", price_satang: 5000 }),
    ];
    const setup: EventSetup = {
      id: "e",
      name: "",
      startDate: "",
      location: "",
      dayCount: 2,
      status: "draft",
      createdAt: "",
      updatedAt: "",
      allocations: [
        { productId: "a", days: [3, 2], sample: 1 }, // 5 booth units × 10000
        { productId: "b", days: [0, 0], sample: 2 }, // 0 booth → not "allocated"
      ],
    };
    const s = computeEventSummary(setup, catalog);
    expect(s.skusAllocated).toBe(1);
    expect(s.totalBoothUnits).toBe(5);
    expect(s.sampleTotal).toBe(3);
    expect(s.estimatedRetailSatang).toBe(50000);
  });
});

describe("syncToCatalog", () => {
  it("returns the same reference when already in sync", () => {
    const setup = buildDraftFromCatalog([p({ id: "a", sku: "A" })], 4);
    expect(syncToCatalog(setup, [p({ id: "a", sku: "A" })])).toBe(setup);
  });

  it("adds allocations for new active SKUs and drops removed ones", () => {
    const setup = buildDraftFromCatalog([p({ id: "a", sku: "A" })], 4);
    const next = syncToCatalog(setup, [
      p({ id: "a", sku: "A" }),
      p({ id: "b", sku: "B" }),
    ]);
    expect(next).not.toBe(setup);
    expect(next.allocations.map((x) => x.productId)).toEqual(["a", "b"]);
    const dropped = syncToCatalog(next, [p({ id: "b", sku: "B" })]);
    expect(dropped.allocations.map((x) => x.productId)).toEqual(["b"]);
  });
});

describe("withDayCount", () => {
  it("resizes day arrays, preserving values and padding with 0", () => {
    const setup = buildDraftFromCatalog([p({ id: "a" })], 2);
    setup.allocations[0].days = [4, 5];
    const grown = withDayCount(setup, 4);
    expect(grown.dayCount).toBe(4);
    expect(grown.allocations[0].days).toEqual([4, 5, 0, 0]);
    expect(withDayCount(grown, 1).allocations[0].days).toEqual([4]);
  });

  it("returns the same reference when dayCount is unchanged", () => {
    const setup = buildDraftFromCatalog([p()], 3);
    expect(withDayCount(setup, 3)).toBe(setup);
  });
});
