import "server-only";

import { TH_TZ, isoDateInTZ } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export type TodayStats = {
  revenue_satang: number;
  order_count: number;
  avg_order_satang: number;
};

export type RevenueByDay = {
  date: string;
  revenue_satang: number;
  order_count: number;
};

export type PaymentBreakdown = {
  method: string;
  total_satang: number;
  count: number;
};

export type TopProduct = {
  product_name: string;
  qty_sold: number;
  revenue_satang: number;
};

export type LiveStock = {
  total_current: number;
  total_sold: number;
  low_stock_count: number;
};

type OrderTotalRow = {
  id: string;
  total_satang: number;
  created_at: string;
};

type PaymentRecordRow = {
  order_id: string;
  payment_method: string;
  amount_satang: number;
};

type OrderItemRow = {
  order_id: string;
  product_name: string;
  qty: number;
  line_total_satang: number;
};

type EventInventoryRow = {
  event_id: string;
  current_qty: number;
  sold_qty: number;
};

type EventRow = {
  id: string;
  status: string;
  start_date: string;
  created_at: string;
};

const MS_PER_DAY = 86_400_000;
const BANGKOK_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 5;

export async function getTodayStats(workspaceId: string): Promise<TodayStats> {
  const range = todayRange();
  const orders = await fetchCompletedOrders(workspaceId, range.startISO, range.endISO);
  const revenue_satang = sum(orders.map((o) => o.total_satang));
  const order_count = orders.length;

  return {
    revenue_satang,
    order_count,
    avg_order_satang: order_count > 0 ? Math.round(revenue_satang / order_count) : 0,
  };
}

export async function getRevenueByDay(
  workspaceId: string,
  days = 7,
): Promise<RevenueByDay[]> {
  const range = trailingRange(days);
  const orders = await fetchCompletedOrders(workspaceId, range.startISO, range.endISO);
  const byDate = new Map<string, RevenueByDay>(
    range.dates.map((date) => [date, { date, revenue_satang: 0, order_count: 0 }]),
  );

  for (const order of orders) {
    const date = isoDateInTZ(order.created_at, TH_TZ);
    const row = byDate.get(date);
    if (!row) continue;
    row.revenue_satang += order.total_satang;
    row.order_count += 1;
  }

  return [...byDate.values()];
}

export async function getPaymentBreakdown(
  workspaceId: string,
  days = 7,
): Promise<PaymentBreakdown[]> {
  const range = trailingRange(days);
  const orders = await fetchCompletedOrders(workspaceId, range.startISO, range.endISO);
  if (orders.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_records")
    .select("order_id, payment_method, amount_satang")
    .eq("workspace_id", workspaceId)
    .in(
      "order_id",
      orders.map((order) => order.id),
    );

  if (error) throw new Error(`getPaymentBreakdown failed: ${error.message}`);

  const byMethod = new Map<string, PaymentBreakdown>();
  for (const payment of (data ?? []) as PaymentRecordRow[]) {
    const method = payment.payment_method || "other";
    const row = byMethod.get(method) ?? { method, total_satang: 0, count: 0 };
    row.total_satang += payment.amount_satang;
    row.count += 1;
    byMethod.set(method, row);
  }

  return [...byMethod.values()].sort((a, b) => b.total_satang - a.total_satang);
}

export async function getTopProducts(
  workspaceId: string,
  days = 7,
  limit = 5,
): Promise<TopProduct[]> {
  const range = trailingRange(days);
  const orders = await fetchCompletedOrders(workspaceId, range.startISO, range.endISO);
  if (orders.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("order_id, product_name, qty, line_total_satang")
    .eq("workspace_id", workspaceId)
    .in(
      "order_id",
      orders.map((order) => order.id),
    )
    .eq("is_sample", false);

  if (error) throw new Error(`getTopProducts failed: ${error.message}`);

  const byName = new Map<string, TopProduct>();
  for (const item of (data ?? []) as OrderItemRow[]) {
    const row = byName.get(item.product_name) ?? {
      product_name: item.product_name,
      qty_sold: 0,
      revenue_satang: 0,
    };
    row.qty_sold += item.qty;
    row.revenue_satang += item.line_total_satang;
    byName.set(item.product_name, row);
  }

  return [...byName.values()]
    .sort((a, b) => b.revenue_satang - a.revenue_satang)
    .slice(0, limit);
}

export async function getLiveStock(workspaceId: string): Promise<LiveStock> {
  const supabase = await createClient();
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, status, start_date, created_at")
    .eq("workspace_id", workspaceId)
    .in("status", ["planned", "running"]);

  if (eventsError) throw new Error(`getLiveStock events failed: ${eventsError.message}`);

  const activeEventId = chooseActiveEventId((events ?? []) as EventRow[]);
  if (!activeEventId) {
    return { total_current: 0, total_sold: 0, low_stock_count: 0 };
  }

  const { data, error } = await supabase
    .from("event_inventory")
    .select("event_id, current_qty, sold_qty")
    .eq("workspace_id", workspaceId)
    .eq("event_id", activeEventId);

  if (error) throw new Error(`getLiveStock failed: ${error.message}`);

  const activeRows = (data ?? []) as EventInventoryRow[];
  return {
    total_current: sum(activeRows.map((row) => row.current_qty)),
    total_sold: sum(activeRows.map((row) => row.sold_qty)),
    low_stock_count: activeRows.filter((row) => row.current_qty <= LOW_STOCK_THRESHOLD).length,
  };
}

async function fetchCompletedOrders(
  workspaceId: string,
  startISO: string,
  endISO: string,
): Promise<OrderTotalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, total_satang, created_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "voided")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (error) throw new Error(`fetchCompletedOrders failed: ${error.message}`);
  return (data ?? []) as OrderTotalRow[];
}

function todayRange(): { startISO: string; endISO: string } {
  const today = isoDateInTZ(new Date(), TH_TZ);
  const start = startOfBangkokDate(today);
  return {
    startISO: start.toISOString(),
    endISO: new Date(start.getTime() + MS_PER_DAY - 1).toISOString(),
  };
}

function trailingRange(days: number): {
  startISO: string;
  endISO: string;
  dates: string[];
} {
  const safeDays = Math.max(1, Math.floor(days));
  const today = isoDateInTZ(new Date(), TH_TZ);
  const todayStart = startOfBangkokDate(today);
  const start = new Date(todayStart.getTime() - (safeDays - 1) * MS_PER_DAY);
  const dates = Array.from({ length: safeDays }, (_, index) =>
    isoDateInTZ(new Date(start.getTime() + index * MS_PER_DAY), TH_TZ),
  );

  return {
    startISO: start.toISOString(),
    endISO: new Date(todayStart.getTime() + MS_PER_DAY - 1).toISOString(),
    dates,
  };
}

function startOfBangkokDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) - BANGKOK_UTC_OFFSET_MS);
}

function chooseActiveEventId(events: EventRow[]): string | null {
  return (
    [...events].sort((a, b) => {
      if (a.status !== b.status) return a.status === "running" ? -1 : 1;
      return `${a.start_date}${a.created_at}`.localeCompare(`${b.start_date}${b.created_at}`);
    })[0]?.id ?? null
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
