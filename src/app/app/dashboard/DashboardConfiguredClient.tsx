"use client";

import Link from "next/link";
import { formatTHB } from "@/lib/money/format";
import { PaymentSplitTile } from "./PaymentSplitTile";
import type {
  LiveStock,
  PaymentBreakdown,
  RevenueByDay,
  TodayStats,
  TopProduct,
} from "@/lib/dashboard/queries";

type Props = {
  todayStats: TodayStats;
  revenueByDay: RevenueByDay[];
  paymentBreakdown: PaymentBreakdown[];
  topProducts: TopProduct[];
  liveStock: LiveStock;
};

const PAYMENT_KEYS = ["cash", "promptpay", "transfer", "card", "other"] as const;

type PaymentKey = (typeof PAYMENT_KEYS)[number];

export function DashboardConfiguredClient({
  todayStats,
  revenueByDay,
  paymentBreakdown,
  topProducts,
  liveStock,
}: Props) {
  const maxDailyRevenue = Math.max(1, ...revenueByDay.map((row) => row.revenue_satang));
  const maxProductQty = Math.max(1, ...topProducts.map((row) => row.qty_sold));
  const paymentSplit = toPaymentSplit(paymentBreakdown);

  return (
    <main className="mx-auto max-w-[1320px] px-6 py-8 pb-14 sm:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--lavender-700)]">
            Mochi POS live
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-text">
            Today&apos;s takings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Real Supabase data for your active workspace.
          </p>
        </div>
        <Link
          href="/app/pos"
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white"
        >
          Record sale
        </Link>
      </div>

      {todayStats.order_count === 0 && (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-line bg-panel-strong px-4 py-3">
          <p className="text-sm text-muted">
            No orders recorded today yet. Once the pilot seller records sales, this
            dashboard will show live revenue and stock movement.
          </p>
        </div>
      )}

      <section className="mb-6 grid gap-4">
        <div
          className="overflow-hidden rounded-[24px] p-6 text-white shadow-[var(--shadow-card)] sm:p-7"
          style={{ background: "var(--grad-primary)" }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/75">
            Today&apos;s revenue
          </div>
          <div className="num mt-2 text-[44px] font-black leading-none sm:text-[52px]">
            THB {formatTHB(todayStats.revenue_satang)}
          </div>
          <div className="mt-2.5 text-xs font-bold text-white/80">
            {todayStats.order_count} order
            {todayStats.order_count === 1 ? "" : "s"} today
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Orders" value={String(todayStats.order_count)} sub="Today only" />
          <Stat
            label="Avg order"
            value={`THB ${formatTHB(todayStats.avg_order_satang)}`}
            sub="Revenue divided by order count"
          />
          <Stat
            label="Stock on hand"
            value={String(liveStock.total_current)}
            sub={`${liveStock.total_sold} sold from active event`}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[20px] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-extrabold text-text">Revenue by day</h3>
          <p className="mt-0.5 text-xs text-muted">Last 7 days</p>
          <div className="mt-4 flex h-[200px] items-end gap-1.5 border-b border-line pb-3">
            {revenueByDay.map((row) => {
              const pct = Math.max(3, Math.round((row.revenue_satang / maxDailyRevenue) * 100));
              return (
                <div
                  key={row.date}
                  className="flex-1 rounded-t-lg"
                  style={{
                    height: `${pct}%`,
                    background:
                      row.revenue_satang === maxDailyRevenue && row.revenue_satang > 0
                        ? "var(--lavender)"
                        : "var(--lavender-300)",
                  }}
                  title={`${row.date}: THB ${formatTHB(row.revenue_satang)}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10px] font-bold text-muted">
            {revenueByDay.map((row) => (
              <span key={row.date} className="flex-1 truncate text-center">
                {row.date.slice(5)}
              </span>
            ))}
          </div>

          <h3 className="mt-8 text-sm font-extrabold text-text">Top products</h3>
          <div className="mt-3 grid gap-2.5">
            {topProducts.map((row, index) => (
              <div
                key={row.product_name}
                className="grid grid-cols-[28px_1fr_auto_90px] items-center gap-3"
              >
                <div
                  className="grid h-7 w-7 place-items-center rounded-lg text-xs font-extrabold"
                  style={{
                    background: "var(--lavender-100)",
                    color: "var(--color-accent)",
                  }}
                >
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-text">
                    {row.product_name}
                  </div>
                  <div className="num text-[11px] text-muted">
                    THB {formatTHB(row.revenue_satang)}
                  </div>
                </div>
                <div className="text-xs font-bold text-muted">{row.qty_sold} sold</div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: "var(--color-soft)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((row.qty_sold / maxProductQty) * 100)}%`,
                      background: "var(--grad-accent)",
                    }}
                  />
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-xs text-muted">No products sold in the last 7 days.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <StockTile stock={liveStock} />
          <PaymentSplitTile split={paymentSplit} />
        </div>
      </div>

      <Link href="/app" className="mt-8 inline-block text-sm font-bold text-accent-strong">
        Back to app home
      </Link>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-rest">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="num mt-1.5 truncate text-[32px] font-black leading-none text-text">
        {value}
      </div>
      <div className="mt-2 text-xs text-muted">{sub}</div>
    </div>
  );
}

function StockTile({ stock }: { stock: LiveStock }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Live stock</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <MiniStat label="Current" value={stock.total_current} />
        <MiniStat label="Sold" value={stock.total_sold} />
        <MiniStat label="Low" value={stock.low_stock_count} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="num mt-1 text-base font-black text-accent-strong">{value}</p>
    </div>
  );
}

function toPaymentSplit(rows: PaymentBreakdown[]): Record<PaymentKey, number> {
  const split: Record<PaymentKey, number> = {
    cash: 0,
    promptpay: 0,
    transfer: 0,
    card: 0,
    other: 0,
  };

  for (const row of rows) {
    const key = PAYMENT_KEYS.includes(row.method as PaymentKey)
      ? (row.method as PaymentKey)
      : "other";
    split[key] += row.total_satang;
  }

  return split;
}
