// Domain types used by the POS UI.
// Money is bigint satang at the schema layer; we use number here because
// realistic THB totals (max ~10M baht = 1e9 satang) fit safely inside JS Number.

export type Money = number;

export type Product = {
  id: string;
  workspace_id: string;
  sku: string;
  name: string;
  category: string;
  price_satang: Money;
  shipping_fee_satang: Money;
  send_later_enabled: boolean;
  is_active: boolean;
  image_path: string | null;
  current_qty: number; // remaining at the active event
  pinned?: boolean; // pinned-first in POS grid (Shopify Smart Grid pattern)
  /** SKUs to suggest when this product is added to the cart. SKUs survive
   *  seeding (where ids are generated at runtime) and are easier to author
   *  in the catalog UI. */
  upsellSkus?: string[];
  /** Unit landed cost in satang. Optional — when present, enables margin
   *  reporting and per-event profit. Pattern from QuickBooks "Initial cost"
   *  and Cin7 cost-on-receive; we snapshot at sale time. */
  cost_satang?: Money;
  /** Reorder threshold per product. When current_qty <= reorder_point, the
   *  dashboard's low-stock tile flags this product. Pattern from
   *  Square/Zoho/Cin7 reorder points. */
  reorder_point?: number;
};

export type CartLine = {
  productId: string;
  qty: number;
  fulfillment: "take_now" | "send_later";
  note?: string;
};

export type PaymentMethod =
  | "cash"
  | "promptpay"
  | "transfer"
  | "card"
  | "other";
