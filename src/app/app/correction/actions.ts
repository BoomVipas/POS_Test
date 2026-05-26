"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, canManageOrders } from "@/lib/auth/workspace";
import { validateVoidReason } from "@/lib/orders/void";

export type CorrectionOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalSatang: number;
  createdAt: string;
  voidReason: string | null;
  lineCount: number;
};

// The workspace's recent orders for the correction screen. Two queries joined in
// JS (orders + a line-count from order_items), workspace-scoped on top of RLS.
export async function getRecentOrders(): Promise<CorrectionOrder[]> {
  const ws = await getActiveWorkspace();
  if (!ws) return [];

  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_method, total_satang, created_at, void_reason",
    )
    .eq("workspace_id", ws.workspaceId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    console.error("[correction] orders read failed:", error.message);
    return [];
  }
  if (!orders || orders.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("workspace_id", ws.workspaceId)
    .in(
      "order_id",
      orders.map((o) => o.id),
    );
  const countByOrder = new Map<string, number>();
  for (const it of items ?? []) {
    countByOrder.set(it.order_id, (countByOrder.get(it.order_id) ?? 0) + 1);
  }

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentMethod: o.payment_method,
    totalSatang: o.total_satang,
    createdAt: o.created_at,
    voidReason: o.void_reason,
    lineCount: countByOrder.get(o.id) ?? 0,
  }));
}

export type VoidResult = { ok: true } | { ok: false; error: string };

// Void a recorded order through the void_order RPC: restores event_inventory,
// marks the order voided, cancels any open send-later fulfillment, and writes an
// audit row — all in one transaction (hard rules #6/#7). Role-gated owner/manager
// (the RPC re-checks). Degrades gracefully if the RPC isn't applied.
export async function voidOrder(input: {
  orderId: string;
  reason: string;
}): Promise<VoidResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!canManageOrders(ws.role)) {
    return { ok: false, error: "You don't have permission to void orders." };
  }

  const v = validateVoidReason(input.reason);
  if (!v.ok) return v;

  const supabase = await createClient();
  const { error } = await supabase.rpc("void_order", {
    p_order_id: input.orderId,
    p_reason: input.reason.trim(),
  });

  if (error) {
    console.error("[correction] void_order failed:", error.message);
    const notSetUp =
      error.code === "42883" ||
      /function .* does not exist/i.test(error.message);
    if (notSetUp) {
      return {
        ok: false,
        error:
          "Void isn't set up yet — an admin needs to apply the void_order RPC.",
      };
    }
    if (/already voided/i.test(error.message)) {
      return { ok: false, error: "That order is already voided." };
    }
    if (/forbidden/i.test(error.message)) {
      return { ok: false, error: "You don't have permission to void orders." };
    }
    if (/not found/i.test(error.message)) {
      return { ok: false, error: "Order not found." };
    }
    return { ok: false, error: "Couldn't void the order. Please try again." };
  }

  revalidatePath("/app/correction");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/pos");
  return { ok: true };
}

export type RefundLine = {
  orderItemId: string;
  sku: string;
  name: string;
  qty: number;
  unitPriceSatang: number;
  alreadyRefunded: number;
  remaining: number;
};

// An order's line items with how much of each is still refundable
// (qty − already-refunded). Drives the refund modal. Workspace-scoped + RLS.
export async function getOrderRefundLines(
  orderId: string,
): Promise<RefundLine[]> {
  const ws = await getActiveWorkspace();
  if (!ws) return [];

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("order_items")
    .select("id, sku, product_name, qty, unit_price_satang")
    .eq("workspace_id", ws.workspaceId)
    .eq("order_id", orderId);
  if (!items || items.length === 0) return [];

  const { data: refunds } = await supabase
    .from("order_refunds")
    .select("order_item_id, qty")
    .eq("workspace_id", ws.workspaceId)
    .eq("order_id", orderId);
  const refundedByItem = new Map<string, number>();
  for (const r of refunds ?? []) {
    refundedByItem.set(
      r.order_item_id,
      (refundedByItem.get(r.order_item_id) ?? 0) + r.qty,
    );
  }

  return items.map((it) => {
    const already = refundedByItem.get(it.id) ?? 0;
    return {
      orderItemId: it.id,
      sku: it.sku,
      name: it.product_name,
      qty: it.qty,
      unitPriceSatang: it.unit_price_satang,
      alreadyRefunded: already,
      remaining: Math.max(0, it.qty - already),
    };
  });
}

export type RefundResult =
  | { ok: true; refundedAmountSatang: number; refundedQty: number }
  | { ok: false; error: string };

// Partial per-line refund via the refund_order_items RPC (caps qty at remaining,
// records the refund, restores inventory, audits — one transaction). Role-gated
// owner/manager; reason required. Degrades gracefully if the RPC isn't applied.
export async function refundOrderItems(input: {
  orderId: string;
  lines: Array<{ orderItemId: string; qty: number }>;
  reason: string;
}): Promise<RefundResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!canManageOrders(ws.role)) {
    return { ok: false, error: "You don't have permission to refund orders." };
  }
  const v = validateVoidReason(input.reason);
  if (!v.ok) return v;
  const lines = input.lines.filter((l) => l.qty > 0);
  if (lines.length === 0) {
    return {
      ok: false,
      error: "Pick at least one line and a quantity to refund.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("refund_order_items", {
    p_order_id: input.orderId,
    p_lines: lines.map((l) => ({ order_item_id: l.orderItemId, qty: l.qty })),
    p_reason: input.reason.trim(),
  });
  if (error) {
    console.error("[correction] refund_order_items failed:", error.message);
    const notSetUp =
      error.code === "42883" ||
      /function .* does not exist/i.test(error.message);
    if (notSetUp) {
      return {
        ok: false,
        error:
          "Refunds aren't set up yet — an admin needs to apply the refund_order_items RPC.",
      };
    }
    if (/voided/i.test(error.message)) {
      return { ok: false, error: "That order is voided — nothing to refund." };
    }
    if (/exceeds remaining/i.test(error.message)) {
      return {
        ok: false,
        error: "A line exceeds its refundable quantity — refresh and try again.",
      };
    }
    if (/forbidden/i.test(error.message)) {
      return { ok: false, error: "You don't have permission to refund orders." };
    }
    if (/reason/i.test(error.message)) {
      return { ok: false, error: "A reason is required for a refund." };
    }
    return { ok: false, error: "Couldn't record the refund. Please try again." };
  }

  const summary = (
    typeof data === "object" && data !== null ? data : {}
  ) as { refunded_amount_satang?: number; refunded_qty?: number };
  revalidatePath("/app/correction");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/pos");
  return {
    ok: true,
    refundedAmountSatang: summary.refunded_amount_satang ?? 0,
    refundedQty: summary.refunded_qty ?? 0,
  };
}
