// DD-43/44 — product form parse/normalise.

import { describe, expect, it } from "vitest";
import { parseProductInput, type ProductInput } from "@/lib/products/parse";

const base: ProductInput = {
  sku: "hoodie-001",
  name: "  Cat Hoodie  ",
  category: "Apparel",
  priceBaht: "890",
  shippingFeeBaht: "50",
  startingQty: "30",
  sendLaterEnabled: true,
  note: "  warm  ",
};

describe("parseProductInput", () => {
  it("normalises a valid product into satang integers", () => {
    const r = parseProductInput(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({
        sku: "HOODIE-001", // uppercased by validateSku
        name: "Cat Hoodie", // trimmed
        category: "Apparel",
        price_satang: 89000,
        shipping_fee_satang: 5000,
        default_starting_qty: 30,
        send_later_enabled: true,
        note: "warm",
      });
    }
  });

  it("defaults empty shipping/qty to 0 and blank category to uncategorized", () => {
    const r = parseProductInput({
      ...base,
      category: "",
      shippingFeeBaht: "",
      startingQty: "",
      note: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.category).toBe("uncategorized");
      expect(r.value.shipping_fee_satang).toBe(0);
      expect(r.value.default_starting_qty).toBe(0);
      expect(r.value.note).toBeNull();
    }
  });

  it("rejects a bad SKU", () => {
    const r = parseProductInput({ ...base, sku: "!!" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.sku).toBeTruthy();
  });

  it("requires a name", () => {
    const r = parseProductInput({ ...base, name: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.name).toBeTruthy();
  });

  it("rejects a negative price", () => {
    const r = parseProductInput({ ...base, priceBaht: "-5" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.priceBaht).toBeTruthy();
  });

  it("rejects a non-integer starting qty", () => {
    const r = parseProductInput({ ...base, startingQty: "3.5" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.startingQty).toBeTruthy();
  });

  it("rejects an over-long note", () => {
    const r = parseProductInput({ ...base, note: "x".repeat(501) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors.note).toBeTruthy();
  });

  it("collects multiple field errors at once", () => {
    const r = parseProductInput({
      ...base,
      sku: "",
      name: "",
      priceBaht: "abc",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.fieldErrors).sort()).toEqual(["name", "priceBaht", "sku"]);
    }
  });
});
