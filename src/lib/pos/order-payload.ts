// DD-65 — pure builder: cart state → the `create_order` RPC payload.
//
// Kept pure (no Supabase, no cart-store import) so the shape/mapping is unit-
// testable and reused by both the Server Action and tests. The RPC is the sole
// authority on prices, stock, totals and discount caps — this only forwards the
// cashier's intent (which products, how many, how they're paid). The client
// NEVER computes or decrements stock (hard rule #6).

export type OrderCartLine = {
  productId: string;
  qty: number;
  fulfillment: "take_now" | "send_later";
  note?: string;
};

export type OrderSplit = { method: string; amountSatang: number };

export type OrderCustomer = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type BuildPayloadInput = {
  workspaceId: string;
  eventId: string;
  lines: OrderCartLine[];
  /** Single-tender method; ignored when `splits` is non-empty (→ "mixed"). */
  paymentMethod: string;
  splits: OrderSplit[];
  discountSatang: number;
  customer: OrderCustomer;
  /** Idempotency key for this confirm attempt (stable across retries). */
  clientRequestId?: string;
};

export type CreateOrderPayload = {
  workspace_id: string;
  event_id: string;
  items: Array<{
    product_id: string;
    qty: number;
    fulfillment: "take_now" | "send_later";
    note?: string;
  }>;
  payment_method: string;
  discount_satang: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  payments?: Array<{ method: string; amount_satang: number }>;
  client_request_id?: string;
};

export function buildCreateOrderPayload(
  input: BuildPayloadInput,
): CreateOrderPayload {
  const hasSendLater = input.lines.some((l) => l.fulfillment === "send_later");
  const usingSplits = input.splits.length > 0;

  const payload: CreateOrderPayload = {
    workspace_id: input.workspaceId,
    event_id: input.eventId,
    items: input.lines.map((l) => ({
      product_id: l.productId,
      qty: l.qty,
      fulfillment: l.fulfillment,
      ...(l.note && l.note.trim() ? { note: l.note.trim() } : {}),
    })),
    payment_method: usingSplits ? "mixed" : input.paymentMethod,
    discount_satang: Math.max(0, Math.round(input.discountSatang || 0)),
  };

  const name = input.customer.name?.trim();
  const phone = input.customer.phone?.trim();
  const email = input.customer.email?.trim();
  const address = input.customer.address?.trim();
  if (name) payload.customer_name = name;
  if (phone) payload.customer_phone = phone;
  if (email) payload.customer_email = email;
  // The RPC requires shipping_address when any line is send_later.
  if (hasSendLater && address) payload.shipping_address = address;

  if (usingSplits) {
    payload.payments = input.splits.map((s) => ({
      method: s.method,
      amount_satang: s.amountSatang,
    }));
  }

  if (input.clientRequestId) {
    payload.client_request_id = input.clientRequestId;
  }

  return payload;
}
