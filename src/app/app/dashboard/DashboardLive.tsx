"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { computeMetricsFor } from "@/lib/demo/dashboardMetrics";
import { aggregateMargin } from "@/lib/demo/margin";
import {
  daysInRange,
  deltaPct,
  ordersInRange,
  previousRange,
  rangePreset,
  dailyRevenueSeries,
  type RangePresetId,
} from "@/lib/demo/dashboard-range";
import { formatTHB } from "@/lib/money/format";
import { Sparkline } from "@/components/ui/Sparkline";
import { mockToday } from "./mock";
import { PaymentSplitTile } from "./PaymentSplitTile";
import { InventoryTile } from "./InventoryTile";
import { ExportCsvButton } from "./ExportCsvButton";
import { ActivityFeedTile } from "./ActivityFeedTile";
import { ProfitTile } from "./ProfitTile";
import { ReorderTile } from "./ReorderTile";
import { DateRangePicker } from "./DateRangePicker";
import { SourceSplitTile } from "./SourceSplitTile";
import { splitBySource } from "@/lib/demo/source-split";

export function DashboardLive() {
  const { orders, ready: salesReady } = useDemoSales();
  const { items: catalog, ready: catalogReady } = useDemoCatalog();
  const [rangeId, setRangeId] = useState<RangePresetId>("today");

  const range = useMemo(() => rangePreset(rangeId), [rangeId]);
  const prev = useMemo(() => previousRange(range), [range]);

  const ordersHere = useMemo(
    () => (salesReady ? ordersInRange(orders, range) : []),
    [orders, range, salesReady],
  );
  const ordersPrev = useMemo(
    () => (salesReady ? ordersInRange(orders, prev) : []),
    [orders, prev, salesReady],
  );

  const hasLiveData = salesReady && ordersHere.length > 0;
  const live = hasLiveData ? computeMetricsFor(ordersHere) : null;
  const prevMetrics =
    ordersPrev.length > 0 ? computeMetricsFor(ordersPrev) : null;
  const margin = hasLiveData ? aggregateMargin(ordersHere) : null;
  const sourceRows = hasLiveData ? splitBySource(ordersHere) : [];

  const inventoryRows =
    catalogReady && catalog.length > 0
      ? catalog.map((p) => ({
          sku: p.sku,
          name: p.name,
          current: p.current_qty,
          starting: Math.max(p.current_qty, p.current_qty),
        }))
      : mockToday.inventoryRemaining;

  const totals = live ?? {
    totalSatang: mockToday.totalSatang,
    bills: mockToday.bills,
    avgBillSatang: mockToday.avgBillSatang,
    paymentSplit: mockToday.paymentSplit,
    topSellers: mockToday.topSellers.map((s) => ({
      productId: s.sku,
      sku: s.sku,
      name: s.name,
      qty: s.qty,
      revenueSatang: s.revenueSatang,
    })),
    hourly: mockToday.hourly.map((h) => ({ hour: h.hour, today: h.today })),
  };

  const isMultiDay = daysInRange(range) > 1;
  const daily =
    isMultiDay && hasLiveData ? dailyRevenueSeries(orders, range) : null;
  // Chart: real daily series for a multi-day live range, real hourly for today,
  // and mock hourly ONLY when there is no live data (clearly illustrative) —
  // never mock bars under a live multi-day label.
  const chartBars = daily
    ? daily.map((d) => ({ label: d.date.slice(5), value: d.totalSatang }))
    : (hasLiveData && live ? live.hourly : mockToday.hourly).map((h) => ({
        label: String(h.hour),
        value: h.today,
      }));
  const maxBar = Math.max(1, ...chartBars.map((b) => b.value));
  const chartTitle = daily ? "Sales by day" : "Sales by hour";

  const topProducts = totals.topSellers.slice(0, 5);
  const maxTopQty = Math.max(1, ...topProducts.map((s) => s.qty));

  const sendLaterCount = ordersHere.filter((o) =>
    o.items.some((it) => it.fulfillmentType === "send_later"),
  ).length;

  const goal = mockToday.goal;
  const dRev = deltaPct(live?.totalSatang ?? 0, prevMetrics?.totalSatang ?? 0);
  const compareLabel = `vs prev ${daysInRange(range) === 1 ? "day" : `${daysInRange(range)}d`}`;
  const revDelta = !hasLiveData
    ? "illustrative"
    : dRev.pct === null
      ? "first period — no comparison"
      : `${dRev.pct >= 0 ? "▲" : "▼"} ${Math.abs(dRev.pct)}% ${compareLabel}`;

  return (
    <main className="mx-auto max-w-[1320px] px-6 py-8 pb-14 sm:px-10">
      {/* Hero — mockup screens/dashboard.html */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--lavender-700)]">
            Mochi POS · {hasLiveData ? "live demo" : "illustrative"}
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-text">
            Today&apos;s takings
          </h1>
          <p className="mt-1 text-sm text-muted">
            {range.label}
            {hasLiveData && (
              <>
                {" · "}
                <strong className="font-bold text-text">
                  {ordersHere.length}
                </strong>{" "}
                orders · vs {ordersPrev.length} prev-period
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={rangeId} onChange={setRangeId} />
          <ExportCsvButton />
        </div>
      </div>

      {!hasLiveData && (
        <p className="mb-4 text-sm text-muted">
          No sales in this range — record one at{" "}
          <Link href="/app/pos" className="font-bold text-accent">
            /app/pos
          </Link>{" "}
          to see live numbers. Figures below are illustrative.
        </p>
      )}

      {/* Hero revenue card (full-width) + 3-metric strip */}
      <section className="mb-6 grid gap-4">
        <div
          className="overflow-hidden rounded-[24px] p-6 text-white shadow-[var(--shadow-card)] sm:p-7"
          style={{ background: "var(--grad-primary)" }}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/75">
                {rangeId === "today" ? "Today's revenue" : "Revenue"}
              </div>
              <div className="num mt-2 text-[44px] font-black leading-none tracking-[-0.03em] sm:text-[52px]">
                ฿{formatTHB(totals.totalSatang)}
              </div>
              <div className="mt-2.5 text-xs font-bold text-white/80">
                {revDelta}
                {goal.targetSatang > 0 &&
                  ` · target ฿${formatTHB(goal.targetSatang)}`}
              </div>
            </div>
            <div className="w-full shrink-0 sm:w-[260px]">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
                {chartTitle}
              </div>
              <Sparkline
                values={chartBars.map((b) => b.value)}
                fill="rgba(255,255,255,0.14)"
                className="mt-1.5 h-12 w-full text-white/85"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-rest">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
              Orders
            </div>
            <div className="num mt-1.5 text-[32px] font-black leading-none tracking-[-0.025em] text-text">
              {totals.bills}
            </div>
            <div className="mt-2 text-xs text-muted">
              Avg ฿{formatTHB(totals.avgBillSatang)} per order
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-rest">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
              Gross margin
            </div>
            <div
              className="num mt-1.5 text-[32px] font-black leading-none tracking-[-0.025em]"
              style={{ color: "var(--color-ok-soft-fg)" }}
            >
              {margin && margin.marginPct !== null
                ? `${Math.round(margin.marginPct)}%`
                : "—"}
            </div>
            <div className="mt-2 text-xs text-muted">
              {margin && margin.marginPct !== null
                ? `After COGS · ฿${formatTHB(margin.profitSatang)} profit`
                : "Add product cost to see margin"}
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-rest">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
              Avg bill
            </div>
            <div className="num mt-1.5 text-[32px] font-black leading-none tracking-[-0.025em] text-text">
              ฿{formatTHB(totals.avgBillSatang)}
            </div>
            <div className="mt-2 text-xs text-muted">
              {totals.bills} order{totals.bills === 1 ? "" : "s"} in range
            </div>
          </div>
        </div>
      </section>

      {/* Two-column body — left: sales chart + top products; right rail. */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[20px] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-extrabold text-text">{chartTitle}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {range.label}
            {!hasLiveData && " · illustrative"}
          </p>

          <div className="mt-4 flex h-[200px] items-end gap-1.5 border-b border-line pb-3">
            {chartBars.map((b, i) => {
              const pct = Math.max(3, Math.round((b.value / maxBar) * 100));
              const isPeak = b.value === maxBar;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg transition-colors"
                  style={{
                    height: `${pct}%`,
                    background: isPeak
                      ? "var(--lavender)"
                      : "var(--lavender-300)",
                  }}
                  title={`${b.label}: ฿${formatTHB(b.value)}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10px] font-bold text-muted">
            {chartBars.map((b, i) => (
              <span key={i} className="flex-1 truncate text-center">
                {b.label}
              </span>
            ))}
          </div>

          <h3 className="mt-8 text-sm font-extrabold text-text">
            Top products
          </h3>
          <div className="mt-3 grid gap-2.5">
            {topProducts.map((s, i) => (
              <div
                key={s.sku}
                className="grid grid-cols-[28px_1fr_auto_90px] items-center gap-3"
              >
                <div
                  className="grid h-7 w-7 place-items-center rounded-lg text-xs font-extrabold"
                  style={{
                    background: "var(--lavender-100)",
                    color: "var(--color-accent)",
                  }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-text">
                    {s.name}
                  </div>
                  <div className="num text-[11px] text-muted">
                    {s.sku} · ฿{formatTHB(s.revenueSatang)}
                  </div>
                </div>
                <div className="text-xs font-bold text-muted">{s.qty} sold</div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: "var(--color-soft)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((s.qty / maxTopQty) * 100)}%`,
                      background: "var(--grad-accent)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[20px] border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-extrabold text-text">
                Send Later queue
              </h3>
              <Link
                href="/app/send-later"
                className="text-xs font-bold text-[var(--indigo-600)] hover:underline"
              >
                All →
              </Link>
            </div>
            <p className="num mt-2 text-2xl font-black text-text">
              {sendLaterCount}
            </p>
            <p className="text-xs text-muted">
              order{sendLaterCount === 1 ? "" : "s"} to fulfill after the event
            </p>
          </div>

          <InventoryTile rows={inventoryRows} />
        </div>
      </div>

      {/* More insights — analytics not in the mockup, kept available. */}
      <div className="mt-8 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
        More insights
      </div>
      <div className="mt-3 grid gap-4">
        <PaymentSplitTile split={totals.paymentSplit} />

        {margin && (
          <ProfitTile
            revenueSatang={margin.revenueSatang}
            cogsSatang={margin.cogsSatang}
            profitSatang={margin.profitSatang}
            marginPct={margin.marginPct}
            ordersWithCost={margin.ordersWithCost}
            totalOrders={ordersHere.length}
          />
        )}

        {sourceRows.length > 1 && (
          <SourceSplitTile
            rows={sourceRows}
            totalSatang={live?.totalSatang ?? 0}
          />
        )}

        {catalogReady && catalog.length > 0 && (
          <ReorderTile catalog={catalog} />
        )}

        <ActivityFeedTile />
      </div>

      <Link
        href="/app"
        className="mt-8 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
