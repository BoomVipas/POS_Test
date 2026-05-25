// The real `products` columns the setup UI reads/writes (subset selected
// server-side). Distinct from the demo `Product` type in lib/pos/types, which
// also carries demo-only fields (cost_satang, reorder_point, pinned,
// current_qty/upsellSkus) that the schema doesn't have.
export type LiveProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price_satang: number;
  shipping_fee_satang: number;
  default_starting_qty: number;
  send_later_enabled: boolean;
  is_active: boolean;
  note: string | null;
  image_path: string | null;
};
