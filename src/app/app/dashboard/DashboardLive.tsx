"use client";

import Link from "next/link";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import {
  computeDemoMetrics,
  ordersForToday,
} from "@/lib/demo/dashboardMetrics";
import { mockToday } from "./mock";
import { PaceStrip } from "./PaceStrip";
import { TodayMetricsTile } from "./TodayMetricsTile";
import { PaymentSplitTile } from "./PaymentSplitTile";
import { TopSellersTile } from "./TopSellersTile";
import { InventoryTile } from "./InventoryTile";
import { HourBars } from "./HourBars";
import { ExportCsvButton } from "./ExportCsvButton";

export function DashboardLive() {
  const { orders, ready: salesReady } = useDemoSales();
  const { items: catalog, ready: catalogReady } = useDemoCatalog();

  const todayOrders = ordersForToday(orders);
  const hasLiveData = salesReady && todayOrders.length > 0;
  const live = hasLiveData ? computeDemoMetrics(orders) : null;

  // Inventory: prefer the demo catalog when populated; fall back to the mock.
  const inventoryRows =
    catalogReady && catalog.length > 0
      ? catalog.map((p) => ({
          sku: p.sku,
          name: p.name,
          current: p.current_qty,
          starting: Math.max(p.current_qty, p.current_qty + (live ? 0 : 0)),
        }))
      : mockToday.inventoryRemaining;

  // Today metrics: live if any, else mock.
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
  };

  // Hourly: blend live today (per-hour) with the mock previous-day ghost.
  const hourly = live
    ? live.hourly.map((h) => ({
        hour: h.hour,
        today: h.today,
        prev: mockToday.hourly.find((m) => m.hour === h.hour)?.prev ?? 0,
      }))
    : mockToday.hourly;

  // Goal stays as a mock target until DD-91 wires settings-driven goals.
  const goal = mockToday.goal;
  const achieved = live ? live.totalSatang : goal.achievedSatang;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-accent-strong">Dashboard</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {hasLiveData ? "Live demo · today" : "Demo · illustrative"}
          </p>
        </div>
        <ExportCsvButton />
      </div>
      <p className="mt-1 text-sm text-muted">
        {hasLiveData
          ? `${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"} recorded today in this browser.`
          : "Numbers are illustrative. Record a sale at /app/pos to see your own data here."}
      </p>

      <div className="mt-6 grid gap-4">
        <PaceStrip achievedSatang={achieved} targetSatang={goal.targetSatang} />

        <TodayMetricsTile
          totalSatang={totals.totalSatang}
          bills={totals.bills}
          avgBillSatang={totals.avgBillSatang}
        />

        <PaymentSplitTile split={totals.paymentSplit} />

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

        <HourBars hourly={hourly} />
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
