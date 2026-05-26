"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Store,
} from "lucide-react";
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
import { splitBySource } from "@/lib/demo/source-split";
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

const ACTIONS = [
  {
    href: "/app/pos",
    title: "Open POS",
    body: "Start selling",
    icon: Store,
  },
  {
    href: "/app/close-day",
    title: "Close day",
    body: "Reconcile cash",
    icon: ReceiptText,
  },
  {
    href: "/app/correction",
    title: "Corrections",
    body: "Void or refund",
    icon: RotateCcw,
  },
  {
    href: "/app/setup/products",
    title: "Products",
    body: "Update stock",
    icon: PackageCheck,
  },
];

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
      ? catalog.map((product) => ({
          sku: product.sku,
          name: product.name,
          current: product.current_qty,
          starting: Math.max(product.current_qty, product.current_qty),
        }))
      : mockToday.inventoryRemaining;

  const totals = live ?? {
    totalSatang: mockToday.totalSatang,
    bills: mockToday.bills,
    avgBillSatang: mockToday.avgBillSatang,
    paymentSplit: mockToday.paymentSplit,
    topSellers: mockToday.topSellers.map((seller) => ({
      productId: seller.sku,
      sku: seller.sku,
      name: seller.name,
      qty: seller.qty,
      revenueSatang: seller.revenueSatang,
    })),
    hourly: mockToday.hourly.map((hour) => ({
      hour: hour.hour,
      today: hour.today,
    })),
  };

  const isMultiDay = daysInRange(range) > 1;
  const daily =
    isMultiDay && hasLiveData ? dailyRevenueSeries(orders, range) : null;
  const chartBars = daily
    ? daily.map((day) => ({ label: day.date.slice(5), value: day.totalSatang }))
    : (hasLiveData && live ? live.hourly : mockToday.hourly).map((hour) => ({
        label: String(hour.hour),
        value: hour.today,
      }));
  const maxBar = Math.max(1, ...chartBars.map((bar) => bar.value));
  const chartTitle = daily ? "Sales by day" : "Sales by hour";

  const topProducts = totals.topSellers.slice(0, 5);
  const maxTopRevenue = Math.max(
    1,
    ...topProducts.map((seller) => seller.revenueSatang),
  );

  const sendLaterCount = ordersHere.filter((order) =>
    order.items.some((item) => item.fulfillmentType === "send_later"),
  ).length;

  const dRev = deltaPct(live?.totalSatang ?? 0, prevMetrics?.totalSatang ?? 0);
  const compareLabel = `vs prev ${
    daysInRange(range) === 1 ? "day" : `${daysInRange(range)}d`
  }`;
  const revDelta = !hasLiveData
    ? "illustrative"
    : dRev.pct === null
      ? "first period - no comparison"
      : `${dRev.pct >= 0 ? "+" : "-"}${Math.abs(dRev.pct)}% ${compareLabel}`;

  return (
    <main className="mx-auto max-w-[1320px] px-4 py-6 pb-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-panel shadow-[var(--shadow-card)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,#f7f4ff_0%,#ebe6ff_48%,#fff_100%)]" />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[10px] bg-[var(--lavender-100)] px-3 py-1 text-xs font-black text-[var(--lavender-700)]">
                Demo dashboard
              </span>
              <span className="text-sm font-bold text-muted">
                {hasLiveData ? "Live demo data" : "Illustrative data"}
              </span>
            </div>
            <h1 className="mt-5 font-display text-4xl font-black leading-[0.98] tracking-tight text-accent-strong sm:text-5xl">
              Today&apos;s sales, stock, and close-day signal.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-text/80">
              See booth revenue clearly, spot the busy hours, and jump straight
              into the next operational action.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <DateRangePicker value={rangeId} onChange={setRangeId} />
              <ExportCsvButton />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <HeroMetric
                label="Revenue"
                value={`${formatTHB(totals.totalSatang)} THB`}
                sub={revDelta}
              />
              <HeroMetric
                label="Orders"
                value={String(totals.bills)}
                sub={`Avg ${formatTHB(totals.avgBillSatang)} THB per order`}
              />
              <HeroMetric
                label="Avg bill"
                value={`${formatTHB(totals.avgBillSatang)} THB`}
                sub={`${totals.bills} order${totals.bills === 1 ? "" : "s"} in range`}
              />
            </div>
          </div>

          <div className="rounded-[22px] bg-[var(--color-accent)] p-5 text-white shadow-[var(--shadow-lift)]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">
              Booth pulse
            </p>
            <div className="mt-5">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/55">
                {chartTitle}
              </p>
              <Sparkline
                values={chartBars.map((bar) => bar.value)}
                fill="rgba(255,255,255,0.14)"
                className="mt-2 h-16 w-full text-white/85"
              />
            </div>
            <p className="mt-5 text-sm font-bold leading-relaxed text-white/80">
              {hasLiveData
                ? `${ordersHere.length} orders in this range, compared with ${ordersPrev.length} in the previous period.`
                : "Record a sale in /app/pos to replace these illustrative numbers with live booth data."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((item) => (
          <QuickAction key={item.href} {...item} />
        ))}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <div className="grid gap-5">
          <section className="rounded-[var(--radius-xl)] border border-line bg-panel p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-black text-accent-strong">
                  {chartTitle}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {range.label}
                  {!hasLiveData ? " - illustrative" : ""}
                </p>
              </div>
              <p className="text-sm font-extrabold text-muted">
                Peak:{" "}
                <span className="text-accent-strong">
                  {formatTHB(maxBar)} THB
                </span>
              </p>
            </div>

            <div className="mt-6 flex h-[230px] items-end gap-2 border-b border-line pb-4">
              {chartBars.map((bar) => {
                const pct = Math.max(4, Math.round((bar.value / maxBar) * 100));
                const peak = bar.value === maxBar;
                return (
                  <div key={bar.label} className="flex h-full min-w-0 flex-1 items-end">
                    <div
                      className="w-full rounded-t-[14px]"
                      style={{
                        height: `${pct}%`,
                        background: peak
                          ? "var(--grad-primary)"
                          : "linear-gradient(180deg, var(--lavender-300), var(--lavender-100))",
                      }}
                      title={`${bar.label} - ${formatTHB(bar.value)} THB`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2 text-[11px] font-black text-muted">
              {chartBars.map((bar) => (
                <span key={bar.label} className="flex-1 truncate text-center">
                  {bar.label}
                </span>
              ))}
            </div>

            <h2 className="mt-8 font-display text-2xl font-black text-accent-strong">
              Top products
            </h2>
            <div className="mt-4 grid gap-3">
              {topProducts.map((seller, index) => (
                <div
                  key={seller.sku}
                  className="grid gap-3 rounded-[18px] border border-line bg-panel-strong p-3 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-[var(--lavender-100)] text-sm font-black text-[var(--lavender-700)]">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="truncate font-display text-base font-black text-accent-strong">
                        {seller.name}
                      </p>
                      <p className="num text-xs font-bold text-muted">
                        {seller.sku}
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--grad-accent)]"
                        style={{
                          width: `${Math.max(
                            4,
                            Math.round(
                              (seller.revenueSatang / maxTopRevenue) * 100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="num text-sm font-black text-accent-strong">
                      {formatTHB(seller.revenueSatang)} THB
                    </p>
                    <p className="text-xs font-bold text-muted">
                      {seller.qty} sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded-[var(--radius-xl)] border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-black text-accent-strong">
                Send Later queue
              </h2>
              <Link
                href="/app/send-later"
                className="text-xs font-bold text-[var(--indigo-600)] hover:underline"
              >
                All
              </Link>
            </div>
            <p className="num mt-3 text-3xl font-black text-accent-strong">
              {sendLaterCount}
            </p>
            <p className="text-sm text-muted">
              order{sendLaterCount === 1 ? "" : "s"} to fulfill after the event
            </p>
          </section>

          <InventoryTile rows={inventoryRows} />
        </aside>
      </div>

      <div className="mt-8 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
        More insights
      </div>
      <div className="mt-3 grid gap-5">
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
          <SourceSplitTile rows={sourceRows} totalSatang={live?.totalSatang ?? 0} />
        )}

        {catalogReady && catalog.length > 0 && <ReorderTile catalog={catalog} />}

        <ActivityFeedTile />
      </div>

      <Link
        href="/app"
        className="mt-8 inline-block text-sm font-bold text-accent-strong"
      >
        App home
      </Link>
    </main>
  );
}

function HeroMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[18px] border border-line bg-white/85 px-4 py-3 shadow-[var(--shadow-rest)] backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className="num mt-1 truncate text-2xl font-black text-accent-strong">
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-muted">{sub}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  body,
  icon: Icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: typeof Store;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3 shadow-[var(--shadow-rest)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--lavender-300)] hover:shadow-[var(--shadow-lift)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[var(--indigo-50)] text-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-black text-accent-strong">
          {title}
        </span>
        <span className="block truncate text-sm font-bold text-muted">
          {body}
        </span>
      </span>
    </Link>
  );
}
