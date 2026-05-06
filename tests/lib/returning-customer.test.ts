import { describe, it, expect } from "vitest";
import {
  hasRecognizedCustomer,
  lookupReturningCustomer,
  matchToCustomerPatch,
} from "@/lib/demo/returning-customer";
import type { DemoOrder } from "@/lib/demo/sales";
import type { DemoPortalCustomer } from "@/lib/demo/customer-tokens";

const baseOrder: DemoOrder = {
  id: "ord_1",
  orderNumber: "EVT-001",
  createdAt: "2026-04-01T10:00:00Z",
  status: "completed",
  paymentMethod: "cash",
  orderType: "take_now",
  totalSatang: 80000,
  subtotalSatang: 80000,
  shippingFeeSatang: 0,
  discountSatang: 0,
  customerName: "Pim",
  customerPhone: "0812345678",
  customerEmail: null,
  shippingAddress: null,
  note: null,
  items: [
    {
      productId: "p_1",
      sku: "001",
      productName: "Cardboard scratcher",
      qty: 1,
      unitPriceSatang: 80000,
      lineTotalSatang: 80000,
      fulfillmentType: "take_now",
    },
  ],
  pointsEarned: 8,
  pointsRedeemed: 0,
  source: "booth",
};

const portalCustomer: DemoPortalCustomer = {
  id: "cust_a",
  registeredAt: "2026-04-15T12:00:00Z",
  tokenId: "tok_a",
  orderId: "ord_1",
  displayName: "Pim S.",
  preferredContactMethod: "phone",
  consentMarketing: true,
  contacts: [
    { channel: "phone", value: "081-234-5678", isPrimary: true },
    { channel: "line", value: "pim_loves_cats", isPrimary: false },
  ],
  pets: [
    {
      name: "Milo",
      species: "cat",
      breed: "Bombay",
      allergies: "chicken",
      preferences: "cardboard scratchers",
    },
  ],
};

describe("Wave 40c — lookupReturningCustomer", () => {
  it("returns null for invalid phone", () => {
    expect(lookupReturningCustomer("", [], [])).toBeNull();
    expect(lookupReturningCustomer("123", [baseOrder], [portalCustomer])).toBeNull();
  });

  it("returns null when phone matches nothing", () => {
    expect(lookupReturningCustomer("0999999999", [], [])).toBeNull();
  });

  it("returns past-sales-only match when no portal registration", () => {
    const m = lookupReturningCustomer("0812345678", [baseOrder], []);
    expect(m).not.toBeNull();
    expect(m!.pastSales?.orderCount).toBe(1);
    expect(m!.pastSales?.pointsAvailable).toBe(8);
    expect(m!.portal).toBeNull();
    expect(m!.lastProductNames).toEqual(["Cardboard scratcher"]);
    expect(m!.name).toBe("Pim");
  });

  it("returns portal-only match when no past sales", () => {
    const m = lookupReturningCustomer("0812345678", [], [portalCustomer]);
    expect(m).not.toBeNull();
    expect(m!.portal?.pets[0].name).toBe("Milo");
    expect(m!.portal?.pets[0].allergies).toBe("chicken");
    expect(m!.pastSales).toBeNull();
    expect(m!.name).toBe("Pim S."); // portal display name preferred
  });

  it("merges past sales + portal when both exist; portal name wins", () => {
    const m = lookupReturningCustomer(
      "0812345678",
      [baseOrder],
      [portalCustomer],
    );
    expect(m).not.toBeNull();
    expect(m!.name).toBe("Pim S.");
    expect(m!.pastSales?.orderCount).toBe(1);
    expect(m!.portal?.pets).toHaveLength(1);
    expect(m!.lastProductNames).toEqual(["Cardboard scratcher"]);
  });

  it("matches phone numbers across formatting differences (canonical key)", () => {
    // 081-234-5678 vs 0812345678 vs +66812345678 all key to 812345678.
    const m1 = lookupReturningCustomer("081-234-5678", [baseOrder], []);
    const m2 = lookupReturningCustomer("+66812345678", [baseOrder], []);
    const m3 = lookupReturningCustomer("0812345678", [baseOrder], []);
    expect(m1?.pastSales?.orderCount).toBe(1);
    expect(m2?.pastSales?.orderCount).toBe(1);
    expect(m3?.pastSales?.orderCount).toBe(1);
  });

  it("excludes voided orders from past-sales aggregation", () => {
    const voided = { ...baseOrder, status: "voided" as const };
    const m = lookupReturningCustomer("0812345678", [voided], []);
    expect(m).toBeNull();
  });
});

describe("Wave 40c — hasRecognizedCustomer", () => {
  it("returns false for null match", () => {
    expect(hasRecognizedCustomer(null)).toBe(false);
  });

  it("returns true when match has past sales", () => {
    const m = lookupReturningCustomer("0812345678", [baseOrder], []);
    expect(hasRecognizedCustomer(m)).toBe(true);
  });

  it("returns true when match has portal registration", () => {
    const m = lookupReturningCustomer("0812345678", [], [portalCustomer]);
    expect(hasRecognizedCustomer(m)).toBe(true);
  });
});

describe("Wave 40c — matchToCustomerPatch", () => {
  it("produces a SET_CUSTOMER-shaped patch from a match", () => {
    const m = lookupReturningCustomer(
      "0812345678",
      [baseOrder],
      [portalCustomer],
    )!;
    const patch = matchToCustomerPatch(m);
    expect(patch.name).toBe("Pim S.");
    expect(patch.phone).toBe("0812345678");
    expect(patch.email).toBe("");
    expect(patch.address).toBe("");
  });

  it("falls back to empty strings when fields are missing", () => {
    const minimal: DemoPortalCustomer = {
      ...portalCustomer,
      displayName: null,
      contacts: [{ channel: "phone", value: "081-234-5678", isPrimary: true }],
      pets: [],
    };
    const m = lookupReturningCustomer("0812345678", [], [minimal])!;
    const patch = matchToCustomerPatch(m);
    expect(patch.name).toBe("");
    expect(patch.email).toBe("");
  });
});
