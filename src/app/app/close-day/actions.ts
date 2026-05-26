"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { computeExpectedCash } from "@/lib/close-day/reconcile";
import { isoDateInTZ } from "@/lib/date";

export type CloseDayReconciliation = {
  isoDate: string;
  expectedCashSatang: number;
  cashPaymentCount: number;
  ordersToday: number;
};

// Read-only cash reconciliation for today (Bangkok day). Sums the real cash
// payment_records for the workspace's non-voided orders created today — the
// same orders/payment_records the dashboard reads (getDashboardMetrics pattern),
// scoped by workspace_id (hard rule #2) on top of RLS. Returns null when there's
// no workspace so the page can fall back to the demo view. Persisting the close
// record (close_day_records table + audit RPC) is the DD-92 follow-up.
export async function getCloseDayReconciliation(): Promise<CloseDayReconciliation | null> {
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const todayISO = isoDateInTZ(new Date());
  // Bangkok is UTC+7 with no DST, so the day boundaries are exact.
  const startISO = new Date(`${todayISO}T00:00:00.000+07:00`).toISOString();
  const endISO = new Date(`${todayISO}T23:59:59.999+07:00`).toISOString();

  const empty: CloseDayReconciliation = {
    isoDate: todayISO,
    expectedCashSatang: 0,
    cashPaymentCount: 0,
    ordersToday: 0,
  };

  const supabase = await createClient();
  const { data: orders, error: oErr } = await supabase
    .from("orders")
    .select("id, status, created_at")
    .eq("workspace_id", ws.workspaceId)
    .gte("created_at", startISO)
    .lte("created_at", endISO);
  if (oErr) {
    console.error("[close-day] orders read failed:", oErr.message);
    return empty;
  }
  if (!orders || orders.length === 0) return empty;

  const { data: payments, error: pErr } = await supabase
    .from("payment_records")
    .select("order_id, payment_method, amount_satang")
    .eq("workspace_id", ws.workspaceId)
    .in(
      "order_id",
      orders.map((o) => o.id),
    );
  if (pErr) {
    console.error("[close-day] payments read failed:", pErr.message);
    return { ...empty, ordersToday: orders.length };
  }

  const { expectedCashSatang, cashPaymentCount } = computeExpectedCash(
    payments ?? [],
    orders,
  );
  return {
    isoDate: todayISO,
    expectedCashSatang,
    cashPaymentCount,
    ordersToday: orders.length,
  };
}
