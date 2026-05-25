// DD-67 — pure mapper: real `orders` / `order_items` / `payment_records` rows →
// the receipt view model the success page renders. Kept pure (no Supabase) so
// the shaping (snake_case → camelCase, defaults) is unit-testable; the page does
// the workspace-scoped fetch and hands the rows here.

export type ReceiptItem = {
  sku: string;
  productName: string;
  qty: number;
  unitPriceSatang: number;
  lineTotalSatang: number;
  fulfillment: "take_now" | "send_later";
  isSample: boolean;
  note: string | null;
};

export type ReceiptPayment = { method: string; amountSatang: number };

export type ReceiptView = {
  orderNumber: string;
  createdAt: string;
  paymentMethod: string;
  subtotalSatang: number;
  discountSatang: number;
  shippingFeeSatang: number;
  totalSatang: number;
  items: ReceiptItem[];
  payments: ReceiptPayment[];
};

// DB row shapes — exactly the columns the page selects.
export type OrderRow = {
  order_number: string;
  created_at: string;
  payment_method: string;
  subtotal_satang: number;
  discount_satang: number;
  shipping_fee_satang: number;
  total_satang: number;
};
export type OrderItemRow = {
  sku: string;
  product_name: string;
  qty: number;
  unit_price_satang: number;
  line_total_satang: number;
  fulfillment_type: string;
  is_sample: boolean;
  note: string | null;
};
export type PaymentRow = { payment_method: string; amount_satang: number };

export function toReceiptView(
  order: OrderRow,
  items: OrderItemRow[] | null,
  payments: PaymentRow[] | null,
): ReceiptView {
  return {
    orderNumber: order.order_number,
    createdAt: order.created_at,
    paymentMethod: order.payment_method,
    subtotalSatang: order.subtotal_satang,
    discountSatang: order.discount_satang,
    shippingFeeSatang: order.shipping_fee_satang,
    totalSatang: order.total_satang,
    items: (items ?? []).map((i) => ({
      sku: i.sku,
      productName: i.product_name,
      qty: i.qty,
      unitPriceSatang: i.unit_price_satang,
      lineTotalSatang: i.line_total_satang,
      fulfillment: i.fulfillment_type === "send_later" ? "send_later" : "take_now",
      isSample: Boolean(i.is_sample),
      note: i.note ?? null,
    })),
    payments: (payments ?? []).map((p) => ({
      method: p.payment_method,
      amountSatang: p.amount_satang,
    })),
  };
}
