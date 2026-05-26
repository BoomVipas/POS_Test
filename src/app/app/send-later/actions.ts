"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canManageEvents } from "@/lib/auth/workspace";
import {
  canTransition,
  isSendLaterStatus,
} from "@/lib/send-later/transitions";
import type { Database, SendLaterStatus } from "@/lib/database.types";

export type SendLaterLine = {
  sku: string;
  productName: string;
  qty: number;
  lineTotalSatang: number;
};

export type SendLaterEntry = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingFeeSatang: number;
  status: SendLaterStatus;
  trackingNumber: string | null;
  createdAt: string;
  items: SendLaterLine[];
};

// Read the workspace's send-later queue: the send_later_orders rows plus the
// originating order number and the send-later line items, assembled in JS (same
// two-query-join style as the POS/stock loaders, which keeps the hand-rolled
// types simple). Workspace-scoped; RLS also enforces it.
export async function getSendLaterQueue(): Promise<SendLaterEntry[]> {
  const ws = await getActiveWorkspace();
  if (!ws) return [];

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("send_later_orders")
    .select(
      "id, order_id, customer_name, customer_phone, shipping_address, shipping_fee_satang, fulfillment_status, tracking_number, created_at",
    )
    .eq("workspace_id", ws.workspaceId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[send-later] queue read failed:", error.message);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  const orderIds = [...new Set(rows.map((r) => r.order_id))];
  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number")
      .eq("workspace_id", ws.workspaceId)
      .in("id", orderIds),
    supabase
      .from("order_items")
      .select("order_id, sku, product_name, qty, line_total_satang, fulfillment_type")
      .eq("workspace_id", ws.workspaceId)
      .in("order_id", orderIds),
  ]);

  const orderNumberById = new Map(
    (orders ?? []).map((o) => [o.id, o.order_number]),
  );
  const itemsByOrder = new Map<string, SendLaterLine[]>();
  for (const it of items ?? []) {
    if (it.fulfillment_type !== "send_later") continue;
    const arr = itemsByOrder.get(it.order_id) ?? [];
    arr.push({
      sku: it.sku,
      productName: it.product_name,
      qty: it.qty,
      lineTotalSatang: it.line_total_satang,
    });
    itemsByOrder.set(it.order_id, arr);
  }

  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    orderNumber: orderNumberById.get(r.order_id) ?? "—",
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    shippingAddress: r.shipping_address,
    shippingFeeSatang: r.shipping_fee_satang,
    status: r.fulfillment_status,
    trackingNumber: r.tracking_number,
    createdAt: r.created_at,
    items: itemsByOrder.get(r.order_id) ?? [],
  }));
}

export type SendLaterActionResult =
  | { ok: true; status: SendLaterStatus }
  | { ok: false; error: string };

type SendLaterUpdate = Database["public"]["Tables"]["send_later_orders"]["Update"];

// Advance/cancel a fulfillment. The client sends only the target status; the
// current status is re-read server-side and the move validated with the shared
// canTransition rules (never trust a client-supplied "from"). Direct RLS-gated
// UPDATE — the send_later_orders_owner_manager_update policy restricts this to
// owner/manager, and we gate the same roles here for a clean error. No money or
// stock changes here, so this mirrors events.setEventStatus (no RPC needed).
export async function setSendLaterStatus(input: {
  id: string;
  to: SendLaterStatus;
  trackingNumber?: string;
}): Promise<SendLaterActionResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!canManageEvents(ws.role)) {
    return {
      ok: false,
      error: "You don't have permission to update fulfillment.",
    };
  }
  if (!isSendLaterStatus(input.to)) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await createClient();
  const { data: current, error: readErr } = await supabase
    .from("send_later_orders")
    .select("fulfillment_status")
    .eq("id", input.id)
    .eq("workspace_id", ws.workspaceId)
    .maybeSingle();
  if (readErr) {
    console.error("[send-later] status read failed:", readErr.message);
    return { ok: false, error: "Couldn't load that order. Please try again." };
  }
  if (!current) return { ok: false, error: "Fulfillment not found." };

  const check = canTransition(current.fulfillment_status, input.to);
  if (!check.ok) {
    return {
      ok: false,
      error:
        check.reason === "terminal"
          ? "This order is already completed or cancelled."
          : "That status change isn't allowed.",
    };
  }

  const now = new Date().toISOString();
  const patch: SendLaterUpdate = { fulfillment_status: input.to };
  if (input.to === "packed") patch.packed_at = now;
  else if (input.to === "shipped") {
    patch.shipped_at = now;
    const tracking = input.trackingNumber?.trim();
    if (tracking) patch.tracking_number = tracking;
  } else if (input.to === "completed") patch.completed_at = now;
  else if (input.to === "cancelled") patch.cancelled_at = now;

  const { error } = await supabase
    .from("send_later_orders")
    .update(patch)
    .eq("id", input.id)
    .eq("workspace_id", ws.workspaceId);
  if (error) {
    console.error("[send-later] status update failed:", error.message);
    return {
      ok: false,
      error: "Couldn't update fulfillment. Please try again.",
    };
  }

  revalidatePath("/app/send-later");
  return { ok: true, status: input.to };
}
