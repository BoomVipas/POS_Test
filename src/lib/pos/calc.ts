import type { CartLine, Product } from "./types";

export type CartTotals = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

/**
 * Pure cart total calculator. All math in satang.
 * - subtotal = sum(price * qty) across lines
 * - shipping = sum(shipping_fee * qty) for send_later lines only
 * - discount is clamped to [0, subtotal+shipping]
 * - total = max(0, subtotal + shipping - discount)
 */
export function calculateCart(
  lines: CartLine[],
  products: Map<string, Product> | Record<string, Product>,
  discountSatang: number = 0,
): CartTotals {
  const get = (id: string): Product | undefined =>
    products instanceof Map ? products.get(id) : products[id];

  let subtotal = 0;
  let shipping = 0;
  for (const l of lines) {
    const p = get(l.productId);
    if (!p) continue;
    if (l.qty <= 0) continue;
    subtotal += p.price_satang * l.qty;
    if (l.fulfillment === "send_later") {
      shipping += p.shipping_fee_satang * l.qty;
    }
  }
  const discount = Math.max(0, Math.min(discountSatang, subtotal + shipping));
  const total = Math.max(0, subtotal + shipping - discount);
  return { subtotal, shipping, discount, total };
}

export function lineTotal(price_satang: number, qty: number): number {
  return price_satang * qty;
}

/**
 * Cap a typed discount at the cart's `subtotal+shipping` ceiling.
 *
 * `capped` is true only when the user typed *more* than the ceiling — at the
 * lower bound (negative → 0) and at the empty-cart bound (max=0 → 0), the
 * value is simply normalised and `capped` stays false. UI uses `capped` to
 * decide whether to render an inline "capped to total" hint.
 */
export function capDiscount(
  typedSatang: number,
  maxSatang: number,
): { satang: number; capped: boolean } {
  if (!Number.isFinite(typedSatang)) return { satang: 0, capped: false };
  if (maxSatang <= 0) return { satang: 0, capped: false };
  if (typedSatang <= 0) return { satang: 0, capped: false };
  if (typedSatang > maxSatang) return { satang: maxSatang, capped: true };
  return { satang: typedSatang, capped: false };
}
