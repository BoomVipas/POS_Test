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
