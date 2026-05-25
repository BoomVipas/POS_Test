"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { validateStockDelta } from "@/lib/inventory/restock";

// #17 — manual event-stock adjustment (restock / mid-sale correction). Routes
// through the adjust_event_stock RPC so the qty change + audit row commit in one
// transaction (hard rules #6/#7). Role-gated owner/manager/stock_staff (the RPC
// re-checks). Degrades gracefully if the RPC hasn't been applied yet.
const STOCK_ROLES = ["owner", "manager", "stock_staff"];

export type AdjustStockResult =
  | { ok: true; currentQty: number }
  | { ok: false; error: string };

export async function adjustEventStock(input: {
  eventId: string;
  productId: string;
  delta: number;
  reason?: string;
}): Promise<AdjustStockResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!STOCK_ROLES.includes(ws.role)) {
    return { ok: false, error: "You don't have permission to adjust stock." };
  }

  const v = validateStockDelta(input.delta, input.reason);
  if (!v.ok) return v;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_event_stock", {
    p_event_id: input.eventId,
    p_product_id: input.productId,
    p_delta: input.delta,
    p_reason: input.reason ?? null,
  });

  if (error) {
    const notSetUp =
      error.code === "42883" ||
      /function .*adjust_event_stock.* does not exist/i.test(error.message);
    console.error("[inventory] adjust_event_stock failed:", error.message);
    if (notSetUp) {
      return {
        ok: false,
        error:
          "Stock adjustment isn't set up yet — an admin needs to apply the adjust_event_stock migration.",
      };
    }
    if (/below zero/i.test(error.message)) {
      return { ok: false, error: "That would take stock below zero." };
    }
    return { ok: false, error: "Couldn't adjust stock. Please try again." };
  }

  revalidatePath("/app/events");
  revalidatePath("/app/pos");
  return { ok: true, currentQty: data?.current_qty ?? 0 };
}

export type EventStockRow = {
  productId: string;
  sku: string;
  name: string;
  currentQty: number;
};

// Per-product stock for one event (workspace-scoped), for the restock UI (#46).
// Two simple queries joined in JS (same pattern as the POS loader) to stay clean
// with the hand-rolled types.
export async function getEventStock(eventId: string): Promise<EventStockRow[]> {
  const ws = await getActiveWorkspace();
  if (!ws) return [];

  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("event_inventory")
    .select("product_id, current_qty")
    .eq("workspace_id", ws.workspaceId)
    .eq("event_id", eventId);
  if (!inv || inv.length === 0) return [];

  const { data: prods } = await supabase
    .from("products")
    .select("id, sku, name")
    .eq("workspace_id", ws.workspaceId)
    .in(
      "id",
      inv.map((r) => r.product_id),
    );
  const byId = new Map((prods ?? []).map((p) => [p.id, p]));

  return inv
    .map((r) => {
      const p = byId.get(r.product_id);
      return {
        productId: r.product_id,
        sku: p?.sku ?? "",
        name: p?.name ?? "",
        currentQty: r.current_qty,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
