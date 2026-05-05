import { describe, it, expect } from "vitest";
import { getUpsellProducts, getCombinedUpsells } from "@/lib/pos/upsell";
import type { Product } from "@/lib/pos/types";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? "p-1",
    workspace_id: "ws",
    sku: overrides.sku ?? "SKU-1",
    name: "Item",
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

describe("upsell/getUpsellProducts", () => {
  it("returns empty when anchor has no upsellSkus", () => {
    const a = product({ id: "a", sku: "A" });
    expect(getUpsellProducts(a, [a])).toEqual([]);
  });

  it("returns the configured upsells, in order, by SKU", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["B", "C"] });
    const b = product({ id: "b", sku: "B" });
    const c = product({ id: "c", sku: "C" });
    const out = getUpsellProducts(a, [a, b, c]);
    expect(out.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("skips sold-out products", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["B", "C"] });
    const b = product({ id: "b", sku: "B", current_qty: 0 });
    const c = product({ id: "c", sku: "C" });
    expect(getUpsellProducts(a, [a, b, c]).map((p) => p.id)).toEqual(["c"]);
  });

  it("skips inactive products", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["B", "C"] });
    const b = product({ id: "b", sku: "B", is_active: false });
    const c = product({ id: "c", sku: "C" });
    expect(getUpsellProducts(a, [a, b, c]).map((p) => p.id)).toEqual(["c"]);
  });

  it("skips itself if its own SKU is listed", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["A", "B"] });
    const b = product({ id: "b", sku: "B" });
    expect(getUpsellProducts(a, [a, b]).map((p) => p.id)).toEqual(["b"]);
  });

  it("skips ids in excludeIds", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["B", "C"] });
    const b = product({ id: "b", sku: "B" });
    const c = product({ id: "c", sku: "C" });
    const out = getUpsellProducts(a, [a, b, c], {
      excludeIds: new Set(["b"]),
    });
    expect(out.map((p) => p.id)).toEqual(["c"]);
  });

  it("respects max", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["B", "C", "D"] });
    const b = product({ id: "b", sku: "B" });
    const c = product({ id: "c", sku: "C" });
    const d = product({ id: "d", sku: "D" });
    expect(
      getUpsellProducts(a, [a, b, c, d], { max: 2 }).map((p) => p.id),
    ).toEqual(["b", "c"]);
  });

  it("ignores unknown SKUs", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["GHOST", "B"] });
    const b = product({ id: "b", sku: "B" });
    expect(getUpsellProducts(a, [a, b]).map((p) => p.id)).toEqual(["b"]);
  });
});

describe("upsell/getCombinedUpsells", () => {
  it("merges across anchors and de-dupes", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["X", "Y"] });
    const b = product({ id: "b", sku: "B", upsellSkus: ["Y", "Z"] });
    const x = product({ id: "x", sku: "X" });
    const y = product({ id: "y", sku: "Y" });
    const z = product({ id: "z", sku: "Z" });
    const out = getCombinedUpsells([a, b], [a, b, x, y, z]);
    expect(out.map((p) => p.id)).toEqual(["x", "y", "z"]);
  });

  it("excludes anchors themselves and excludeIds", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["B", "C"] });
    const b = product({ id: "b", sku: "B", upsellSkus: ["A"] });
    const c = product({ id: "c", sku: "C" });
    const out = getCombinedUpsells([a, b], [a, b, c], {
      excludeIds: new Set(["c"]),
    });
    expect(out.map((p) => p.id)).toEqual([]);
  });

  it("caps at max across all anchors", () => {
    const a = product({ id: "a", sku: "A", upsellSkus: ["X", "Y"] });
    const b = product({ id: "b", sku: "B", upsellSkus: ["Z", "W"] });
    const x = product({ id: "x", sku: "X" });
    const y = product({ id: "y", sku: "Y" });
    const z = product({ id: "z", sku: "Z" });
    const w = product({ id: "w", sku: "W" });
    expect(
      getCombinedUpsells([a, b], [a, b, x, y, z, w], { max: 2 }).map(
        (p) => p.id,
      ),
    ).toEqual(["x", "y"]);
  });
});
