"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import {
  buildCreateOrderPayload,
  type OrderCartLine,
  type OrderSplit,
  type OrderCustomer,
} from "@/lib/pos/order-payload";
import type { Json } from "@/lib/database.types";

export type SubmitOrderInput = {
  eventId: string;
  lines: OrderCartLine[];
  paymentMethod: string;
  splits: OrderSplit[];
  discountSatang: number;
  customer: OrderCustomer;
  clientRequestId?: string;
};

export type SubmitOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

// Translate the RPC's RAISE messages into something a cashier can act on.
function friendlyOrderError(message: string): string {
  if (/insufficient stock/i.test(message)) {
    return "Not enough stock for one or more items — refresh and try again.";
  }
  if (/forbidden/i.test(message)) {
    return "You don't have permission to record sales.";
  }
  if (/event .* status|not in workspace/i.test(message)) {
    return "This event isn't open for sales.";
  }
  if (/no inventory row/i.test(message)) {
    return "One of these products isn't allocated to this event yet.";
  }
  if (/payments sum|requires a non-empty payments/i.test(message)) {
    return "Split payments must add up to the total.";
  }
  if (/not active/i.test(message)) {
    return "One of these products is no longer active.";
  }
  return "Couldn't complete the sale. Please try again.";
}

// DD-65 — record a sale through the create_order RPC. The cashier never touches
// stock or totals; the security-definer RPC does it all atomically (FOR UPDATE
// lock + insufficient-stock guard = DD-66) and writes order/items/payments/audit
// in one transaction. workspace_id is resolved server-side from the session
// (never trusted from the client); the RPC re-checks membership + the event.
export async function submitOrder(
  input: SubmitOrderInput,
): Promise<SubmitOrderResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };

  if (!input.eventId) {
    return { ok: false, error: "No active event — open or create one in Events." };
  }
  if (!input.lines || input.lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (input.splits.length === 0 && !input.paymentMethod) {
    return { ok: false, error: "Choose a payment method first." };
  }

  const payload = buildCreateOrderPayload({
    workspaceId: ws.workspaceId,
    eventId: input.eventId,
    lines: input.lines,
    paymentMethod: input.paymentMethod,
    splits: input.splits,
    discountSatang: input.discountSatang,
    customer: input.customer,
    clientRequestId: input.clientRequestId,
  });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    payload: payload as unknown as Json,
  });
  if (error) {
    console.error("[pos] create_order failed:", error.message);
    return { ok: false, error: friendlyOrderError(error.message) };
  }

  return { ok: true, orderId: data as string };
}
