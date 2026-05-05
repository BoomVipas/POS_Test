"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { computeMetricsFor } from "@/lib/demo/dashboardMetrics";
import { aggregateMargin } from "@/lib/demo/margin";
import {
  dailyRevenueSeries,
  daysInRange,
  deltaPct,
  ordersInRange,
  previousRange,
  rangePreset,
  type RangePresetId,
} from "@/lib/demo/dashboard-range";
import { mockToday } from "./mock";
import { PaceStrip } from "./PaceStrip";
import { TodayMetricsTile } from "./TodayMetricsTile";
import { PaymentSplitTile } from "./PaymentSplitTile";
import { TopSellersTile } from "./TopSellersTile";
import { InventoryTile } from "./InventoryTile";
import { HourBars } from "./HourBars";
import { DailyBars } from "./DailyBars";
import { ExportCsvButton } from "./ExportCsvButton";
import { ActivityFeedTile } from "./ActivityFeedTile";
import { ProfitTile } from "./ProfitTile";
import { ReorderTile } from "./ReorderTile";
import { DateRangePicker } from "./DateRangePicker";
import { DeltaChip } from "./DeltaChip";
import { SourceSplitTile } from "./SourceSplitTile";
import { splitBySource } from "@/lib/demo/source-split";

export function DashboardLive() {
  const { orders, ready: salesReady } = useDemoSales();
  const { items: catalog, ready: catalogReady } = useDemoCatalog();
  const [rangeId, setRangeId] = useState<RangePresetId>("today");

  const range = useMemo(() => rangePreset(rangeId), [rangeId]);
  const prev = useMemo(() => previousRange(range), [range]);
  const isMultiDay = daysInRange(range) > 1;

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
  const prevMetrics = ordersPrev.length > 0 ? computeMetricsFor(ordersPrev) : null;
  const margin = hasLiveData ? aggregateMargin(ordersHere) : null;
  const prevMargin =
    ordersPrev.length > 0 ? aggregateMargin(ordersPrev) : null;
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

  const hourly =
    rangeId === "today" && live
      ? live.hourly.map((h) => ({
          hour: h.hour,
          today: h.today,
          prev: mockToday.hourly.find((m) => m.hour === h.hour)?.prev ?? 0,
        }))
      : mockToday.hourly;

  const daily =
    isMultiDay && hasLiveData
      ? dailyRevenueSeries(orders, range)
      : null;

  const goal = mockToday.goal;
  const achieved = live ? live.totalSatang : goal.achievedSatang;

  // Period-over-period deltas
  const dRev = deltaPct(
    live?.totalSatang ?? 0,
    prevMetrics?.totalSatang ?? 0,
  );
  const dBills = deltaPct(live?.bills ?? 0, prevMetrics?.bills ?? 0);
  const dProfit = deltaPct(
    margin?.profitSatang ?? 0,
    prevMargin?.profitSatang ?? 0,
  );

  const compareLabel = `vs prev ${daysInRange(range) === 1 ? "day" : `${daysInRange(range)}d`}`;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-accent-strong">Dashboard</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {range.label}
            {hasLiveData ? " · live demo" : " · illustrative"}
          </p>
        </div>
        <ExportCsvButton />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker value={rangeId} onChange={setRangeId} />
        {hasLiveData && (
          <p className="text-xs text-muted">
            {ordersHere.length} order{ordersHere.length === 1 ? "" : "s"} ·
            comparing to {ordersPrev.length} previous-period
          </p>
        )}
      </div>
      {!hasLiveData && (
        <p className="mt-2 text-sm text-muted">
          No sales recorded in this range. Record a sale at /app/pos to see
          your own data here.
        </p>
      )}

      <div className="mt-6 grid gap-4">
        {rangeId === "today" && (
          <PaceStrip achievedSatang={achieved} targetSatang={goal.targetSatang} />
        )}

        <div className="grid gap-2">
          <TodayMetricsTile
            totalSatang={totals.totalSatang}
            bills={totals.bills}
            avgBillSatang={totals.avgBillSatang}
          />
          {hasLiveData && (
            <div className="flex flex-wrap gap-2">
              <DeltaChip pct={dRev.pct} label={`revenue ${compareLabel}`} />
              <DeltaChip pct={dBills.pct} label={`bills ${compareLabel}`} />
              {margin?.marginPct !== null && (
                <DeltaChip pct={dProfit.pct} label={`profit ${compareLabel}`} />
              )}
            </div>
          )}
        </div>

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

        <div className="grid gap-4 lg:grid-cols-2">
          <TopSellersTile
            sellers={totals.topSellers.map((s) => ({
              sku: s.sku,
              name: s.name,
              qty: s.qty,
              revenueSatang: s.revenueSatang,
            }))}
          />
          <InventoryTile rows={inventoryRows} />
        </div>

        <ActivityFeedTile />

        {isMultiDay && daily ? (
          <DailyBars series={daily} />
        ) : (
          <HourBars hourly={hourly} />
        )}
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
