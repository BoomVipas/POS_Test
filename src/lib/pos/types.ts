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
