"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import { computeExpectedCash } from "@/lib/close-day/reconcile";
import {
  buildCloseDaySalesExportRows,
  type CloseDaySalesExportRow,
} from "@/lib/close-day/sales-export";
import { isoDateInTZ } from "@/lib/date";

export type { CloseDaySalesExportRow } from "@/lib/close-day/sales-export";

export type CloseDayReconciliation = {
  isoDate: string;
  expectedCashSatang: number;
  cashPaymentCount: number;
  ordersToday: number;
};

function bangkokDayWindow(isoDate: string) {
  return {
    startISO: new Date(`${isoDate}T00:00:00.000+07:00`).toISOString(),
    endISO: new Date(`${isoDate}T23:59:59.999+07:00`).toISOString(),
  };
}

// Read-only cash reconciliation for today (Bangkok day). Sums the real cash
// payment_records for the workspace's non-voided orders created today — the
// same orders/payment_records the dashboard reads (getDashboardMetrics pattern),
// scoped by workspace_id (hard rule #2) on top of RLS. Returns null when there's
// no workspace so the page can fall back to the demo view. Persisting the close
// record + audit row is done via closeDay below (DD-92).
export async function getCloseDayReconciliation(): Promise<CloseDayReconciliation | null> {
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const todayISO = isoDateInTZ(new Date());
  // Bangkok is UTC+7 with no DST, so the day boundaries are exact.
  const { startISO, endISO } = bangkokDayWindow(todayISO);

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

export type CloseDayRecord = {
  id: string;
  isoDate: string;
  expectedCashSatang: number;
  countedCashSatang: number;
  discrepancySatang: number;
  reason: string | null;
  createdAt: string;
};

type CloseDayRow = {
  id: string;
  iso_date: string;
  expected_cash_satang: number;
  counted_cash_satang: number;
  discrepancy_satang: number;
  reason: string | null;
  created_at: string;
};

function mapRecord(r: CloseDayRow): CloseDayRecord {
  return {
    id: r.id,
    isoDate: r.iso_date,
    expectedCashSatang: r.expected_cash_satang,
    countedCashSatang: r.counted_cash_satang,
    discrepancySatang: r.discrepancy_satang,
    reason: r.reason,
    createdAt: r.created_at,
  };
}

export type CloseDayResult =
  | { ok: true; record: CloseDayRecord }
  | { ok: false; error: string; needsReason?: boolean };

// Persist an end-of-day close through the close_day RPC: it recomputes expected
// cash from real payment_records and writes the record + an audit row in one
// transaction (hard rule #7). Role-gated owner/manager/cashier (the RPC
// re-checks). Degrades gracefully if the migration isn't applied yet.
export async function closeDay(input: {
  isoDate: string;
  countedCashSatang: number;
  reason?: string;
}): Promise<CloseDayResult> {
  const ws = await getActiveWorkspace();
  if (!ws) return { ok: false, error: "No workspace found for your account." };
  if (!["owner", "manager", "cashier"].includes(ws.role)) {
    return { ok: false, error: "You don't have permission to close the day." };
  }
  if (
    !Number.isInteger(input.countedCashSatang) ||
    input.countedCashSatang < 0
  ) {
    return {
      ok: false,
      error: "Counted cash must be a whole, non-negative amount.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_day", {
    p_workspace_id: ws.workspaceId,
    p_iso_date: input.isoDate,
    p_counted_cash_satang: input.countedCashSatang,
    p_reason: input.reason?.trim() || null,
  });
  if (error) {
    console.error("[close-day] close_day failed:", error.message);
    const notSetUp =
      error.code === "42883" ||
      error.code === "42P01" ||
      /does not exist/i.test(error.message);
    if (notSetUp) {
      return {
        ok: false,
        error:
          "Close-day isn't set up yet — an admin needs to apply the close_day migration.",
      };
    }
    if (/forbidden/i.test(error.message)) {
      return { ok: false, error: "You don't have permission to close the day." };
    }
    if (/reason.*required/i.test(error.message)) {
      // The RPC recomputed a non-zero discrepancy (cash moved since the preview)
      // and there was no reason. Tell the UI to resync + require a reason.
      return {
        ok: false,
        needsReason: true,
        error:
          "Cash changed since you loaded this screen — recalculated. Add a reason for the difference, then close again.",
      };
    }
    return { ok: false, error: "Couldn't record the close. Please try again." };
  }

  const row = (Array.isArray(data) ? data[0] : data) as CloseDayRow;
  revalidatePath("/app/close-day");
  return { ok: true, record: mapRecord(row) };
}

// Recent close-day records for the workspace (history). Workspace-scoped on top
// of the close_day_records member-select RLS policy.
export async function getCloseDayHistory(
  limit = 10,
): Promise<CloseDayRecord[]> {
  const ws = await getActiveWorkspace();
  if (!ws) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("close_day_records")
    .select(
      "id, iso_date, expected_cash_satang, counted_cash_satang, discrepancy_satang, reason, created_at",
    )
    .eq("workspace_id", ws.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapRecord);
}

// Accounting export for the selected Bangkok day. This is intentionally a
// sales ledger, not a close-day cash summary: each sold item line becomes one
// CSV row, with order totals and split payment columns attached.
export async function getCloseDaySalesExport(
  isoDate = isoDateInTZ(new Date()),
): Promise<CloseDaySalesExportRow[]> {
  const ws = await getActiveWorkspace();
  if (!ws) return [];

  const { startISO, endISO } = bangkokDayWindow(isoDate);
  const supabase = await createClient();
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, customer_email, order_type, payment_method, payment_status, subtotal_satang, discount_satang, shipping_fee_satang, total_satang, status, note, created_at",
    )
    .eq("workspace_id", ws.workspaceId)
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .neq("status", "voided")
    .order("created_at", { ascending: true });

  if (ordersError || !orders) {
    console.error(
      "[close-day] sales export orders read failed:",
      ordersError?.message,
    );
    return [];
  }
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => order.id);
  const [{ data: items, error: itemsError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          "id, order_id, sku, product_name, qty, unit_price_satang, line_total_satang, fulfillment_type, is_sample, note",
        )
        .eq("workspace_id", ws.workspaceId)
        .in("order_id", orderIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("payment_records")
        .select("order_id, payment_method, amount_satang")
        .eq("workspace_id", ws.workspaceId)
        .in("order_id", orderIds),
    ]);

  if (itemsError) {
    console.error("[close-day] sales export items read failed:", itemsError.message);
  }
  if (paymentsError) {
    console.error(
      "[close-day] sales export payments read failed:",
      paymentsError.message,
    );
  }

  return buildCloseDaySalesExportRows({
    isoDate,
    orders,
    items: items ?? [],
    payments: payments ?? [],
  });
}
