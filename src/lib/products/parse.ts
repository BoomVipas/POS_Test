// DD-43/44 — pure parse + normalise of product form input into the real
// `products` table shape. Kept pure (no Supabase) so the validation/money/SKU
// rules are unit-testable; the Server Actions call this before writing.
//
// Only the columns the schema actually has are produced here. (The demo
// Product type also carries cost_satang / reorder_point / pinned / current_qty,
// but those are demo-only — `current_qty` is per-event `event_inventory`, not a
// product column. The schema product field is `default_starting_qty`.)

import { validateSku } from "@/lib/sku";
import { bahtToSatang } from "@/lib/money/format";

export type ProductInput = {
  sku: string;
  name: string;
  category: string;
  priceBaht: string;
  shippingFeeBaht: string;
  startingQty: string;
  sendLaterEnabled: boolean;
  note: string;
};

export type ProductFields = {
  sku: string;
  name: string;
  category: string;
  price_satang: number;
  shipping_fee_satang: number;
  default_starting_qty: number;
  send_later_enabled: boolean;
  note: string | null;
};

export type ParseProductResult =
  | { ok: true; value: ProductFields }
  | { ok: false; fieldErrors: Record<string, string> };

export function parseProductInput(input: ProductInput): ParseProductResult {
  const fieldErrors: Record<string, string> = {};

  const sku = validateSku(input.sku ?? "");
  if (!sku.ok) fieldErrors.sku = sku.reason;

  const name = (input.name ?? "").trim();
  if (!name) fieldErrors.name = "Name is required";
  else if (name.length > 160) fieldErrors.name = "Name is too long (max 160)";

  const category = (input.category ?? "").trim() || "uncategorized";
  if (category.length > 80) {
    fieldErrors.category = "Category is too long (max 80)";
  }

  const price = Number((input.priceBaht ?? "").trim());
  if (!Number.isFinite(price) || price < 0) {
    fieldErrors.priceBaht = "Price must be a number ≥ 0";
  }

  const shipRaw = (input.shippingFeeBaht ?? "").trim();
  const shipping = shipRaw === "" ? 0 : Number(shipRaw);
  if (!Number.isFinite(shipping) || shipping < 0) {
    fieldErrors.shippingFeeBaht = "Shipping fee must be a number ≥ 0";
  }

  const qtyRaw = (input.startingQty ?? "").trim();
  const qty = qtyRaw === "" ? 0 : Number(qtyRaw);
  if (!Number.isInteger(qty) || qty < 0) {
    fieldErrors.startingQty = "Starting stock must be a whole number ≥ 0";
  }

  const note = (input.note ?? "").trim();
  if (note.length > 500) fieldErrors.note = "Note is too long (max 500)";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    value: {
      sku: sku.ok ? sku.normalized : input.sku,
      name,
      category,
      price_satang: bahtToSatang(price),
      shipping_fee_satang: bahtToSatang(shipping),
      default_starting_qty: qty,
      send_later_enabled: Boolean(input.sendLaterEnabled),
      note: note === "" ? null : note,
    },
  };
}
