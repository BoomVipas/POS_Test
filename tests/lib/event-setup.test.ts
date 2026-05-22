import { describe, it, expect } from "vitest";
import {
  allocationTotal,
  buildDraftFromCatalog,
  clampDays,
  computeEventSummary,
  giftRuleIsActive,
  migrateSetup,
  syncToCatalog,
  withDayCount,
  DEFAULT_BOOTH_RULES,
  DEFAULT_DAYS,
  DEFAULT_GIFT_RULE,
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

function baseSetup(
  dayCount: number,
  overrides: Partial<EventSetup> = {},
): EventSetup {
  return {
    id: "e",
    name: "",
    startDate: "",
    location: "",
    dayCount,
    allocations: [],
    boothRules: { ...DEFAULT_BOOTH_RULES },
    giftRule: { ...DEFAULT_GIFT_RULE },
    status: "draft",
    createdAt: "",
    updatedAt: "",
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

  it("seeds default booth rules and a disabled gift rule", () => {
    const draft = buildDraftFromCatalog([p()], 4);
    expect(draft.boothRules).toEqual(DEFAULT_BOOTH_RULES);
    expect(draft.giftRule).toEqual(DEFAULT_GIFT_RULE);
    expect(draft.giftRule.enabled).toBe(false);
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
    const setup = baseSetup(2, {
      allocations: [
        { productId: "a", days: [3, 2], sample: 1 }, // 5 booth units × 10000
        { productId: "b", days: [0, 0], sample: 2 }, // 0 booth → not "allocated"
      ],
    });
    const s = computeEventSummary(setup, catalog);
    expect(s.skusAllocated).toBe(1);
    expect(s.totalBoothUnits).toBe(5);
    expect(s.sampleTotal).toBe(3);
    expect(s.estimatedRetailSatang).toBe(50000);
  });

  it("reserves warehouse value at cost over booth + sample units", () => {
    const catalog = [
      p({ id: "a", price_satang: 10000, cost_satang: 4000 }),
      p({ id: "b", price_satang: 5000 }), // no cost → contributes 0
    ];
    const setup = baseSetup(2, {
      allocations: [
        { productId: "a", days: [3, 2], sample: 1 }, // (5 + 1) × 4000
        { productId: "b", days: [1, 0], sample: 4 }, // no cost → 0
      ],
    });
    const s = computeEventSummary(setup, catalog);
    expect(s.reservedWarehouseSatang).toBe(24000);
  });

  it("reserves 0 when the catalog carries no cost", () => {
    const catalog = [p({ id: "a", price_satang: 10000 })];
    const setup = baseSetup(1, {
      allocations: [{ productId: "a", days: [5], sample: 2 }],
    });
    expect(computeEventSummary(setup, catalog).reservedWarehouseSatang).toBe(0);
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

describe("migrateSetup", () => {
  it("backfills booth rules and gift rule on an older draft", () => {
    // Simulate a v1 draft persisted before these fields existed.
    const legacy = {
      id: "e",
      name: "Old",
      startDate: "",
      location: "",
      dayCount: 2,
      allocations: [{ productId: "a", days: [1, 1], sample: 0 }],
      status: "draft",
      createdAt: "",
      updatedAt: "",
    } as unknown as EventSetup;

    const migrated = migrateSetup(legacy);
    expect(migrated.boothRules).toEqual(DEFAULT_BOOTH_RULES);
    expect(migrated.giftRule).toEqual(DEFAULT_GIFT_RULE);
    expect(migrated.name).toBe("Old"); // preserves existing fields
    expect(migrated.allocations).toBe(legacy.allocations);
  });

  it("preserves partially-set rules while filling gaps", () => {
    const partial = baseSetup(2, {
      boothRules: { ...DEFAULT_BOOTH_RULES, cashDrawer: true },
      giftRule: { ...DEFAULT_GIFT_RULE, enabled: true, giftProductId: "a" },
    });
    const migrated = migrateSetup(partial);
    expect(migrated.boothRules.cashDrawer).toBe(true);
    expect(migrated.boothRules.sendLater).toBe(true); // untouched default
    expect(migrated.giftRule.enabled).toBe(true);
    expect(migrated.giftRule.giftProductId).toBe("a");
    expect(migrated.giftRule.giftQty).toBe(DEFAULT_GIFT_RULE.giftQty);
  });
});

describe("giftRuleIsActive", () => {
  it("is inactive unless enabled, pointed at a product, qty>0, threshold>0", () => {
    expect(giftRuleIsActive(DEFAULT_GIFT_RULE)).toBe(false); // disabled
    expect(
      giftRuleIsActive({
        enabled: true,
        thresholdSatang: 50000,
        giftProductId: null,
        giftQty: 1,
      }),
    ).toBe(false); // no product
    expect(
      giftRuleIsActive({
        enabled: true,
        thresholdSatang: 0,
        giftProductId: "a",
        giftQty: 1,
      }),
    ).toBe(false); // zero threshold
    expect(
      giftRuleIsActive({
        enabled: true,
        thresholdSatang: 50000,
        giftProductId: "a",
        giftQty: 0,
      }),
    ).toBe(false); // zero qty
    expect(
      giftRuleIsActive({
        enabled: true,
        thresholdSatang: 50000,
        giftProductId: "a",
        giftQty: 1,
      }),
    ).toBe(true);
  });
});
