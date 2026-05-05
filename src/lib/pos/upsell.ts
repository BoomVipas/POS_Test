// Pure upsell logic: given an "anchor" product (just added) and a catalog,
// return the suggested upsell products (excluding sold-out, inactive, and
// the anchor itself). Tested independently of UI.
//
// Upsells are stored as SKUs on the anchor product (Product.upsellSkus).
// Looking up by SKU keeps demo seed data stable even when product ids are
// generated at runtime.

import type { Product } from "./types";

export function getUpsellProducts(
  anchor: Product,
  catalog: Product[],
  options: { excludeIds?: Set<string>; max?: number } = {},
): Product[] {
  const { excludeIds, max = 3 } = options;
  const skus = anchor.upsellSkus ?? [];
  if (skus.length === 0) return [];

  const bySku = new Map(catalog.map((p) => [p.sku, p]));
  const out: Product[] = [];
  for (const sku of skus) {
    if (out.length >= max) break;
    const p = bySku.get(sku);
    if (!p) continue;
    if (p.id === anchor.id) continue;
    if (excludeIds?.has(p.id)) continue;
    if (!p.is_active) continue;
    if (p.current_qty <= 0) continue;
    out.push(p);
  }
  return out;
}

/** Combined upsells for a list of anchor products (de-duplicated, capped). */
export function getCombinedUpsells(
  anchors: Product[],
  catalog: Product[],
  options: { excludeIds?: Set<string>; max?: number } = {},
): Product[] {
  const { excludeIds, max = 3 } = options;
  const seen = new Set<string>(excludeIds ?? []);
  for (const a of anchors) seen.add(a.id);
  const out: Product[] = [];
  for (const anchor of anchors) {
    for (const p of getUpsellProducts(anchor, catalog, {
      excludeIds: seen,
      max: max - out.length,
    })) {
      if (out.length >= max) break;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
    if (out.length >= max) break;
  }
  return out;
}
