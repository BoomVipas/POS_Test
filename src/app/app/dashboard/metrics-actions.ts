"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import {
  computeDashboardMetrics,
  type DashboardMetrics,
} from "@/lib/dashboard/metrics";

// The seam between #47 (this, backend) and #48 (dashboard UI): real dashboard
// metrics for the signed-in workspace within [startISO, endISO]. RLS scopes
// every row to the workspace; we also filter on workspace_id explicitly
// (hard rule #2). Returns null when Supabase isn't configured or there's no
// workspace, so the UI can fall back to the demo/illustrative view.
export async function getDashboardMetrics(range: {
  startISO: string;
  endISO: string;
}): Promise<DashboardMetrics | null> {
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createClient();

  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("id, total_satang, payment_method, status, created_at")
    .eq("workspace_id", ws.workspaceId)
    .gte("created_at", range.startISO)
    .lte("created_at", range.endISO);
  if (ordersErr || !orders) return null;
  if (orders.length === 0) return computeDashboardMetrics([], []);

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select(
      "order_id, product_id, sku, product_name, qty, line_total_satang, is_sample",
    )
    .eq("workspace_id", ws.workspaceId)
    .in(
      "order_id",
      orders.map((o) => o.id),
    );
  if (itemsErr) return null;

  return computeDashboardMetrics(orders, items ?? []);
}
