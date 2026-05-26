"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock3,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  Store,
} from "lucide-react";
import { rangePreset, type RangePresetId } from "@/lib/demo/dashboard-range";
import { rangeToWindow } from "@/lib/dashboard/window";
import { getDashboardMetrics } from "./metrics-actions";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";
import { formatTHB } from "@/lib/money/format";
import { PaymentSplitTile } from "./PaymentSplitTile";

// Configured-mode dashboard (#48) renders real workspace metrics from
// getDashboardMetrics (#47). This screen keeps the data surface small and
// booth-focused: revenue, orders, average bill, hourly demand, top sellers, and
// payment split. Richer demo-only analytics stay in DashboardLive until their
// real backends exist.

const PRESETS: Array<{ id: RangePresetId; label: string }> = [
  { id: "today", label: "Today" },
  { id: "last7", label: "7 days" },
  { id: "last30", label: "30 days" },
  { id: "this_month", label: "This month" },
];

const EMPTY_SPLIT = { cash: 0, promptpay: 0, transfer: 0, card: 0, other: 0 };

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

export function DashboardConfigured() {
  const [rangeId, setRangeId] = useState<RangePresetId>("today");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const win = rangeToWindow(rangePreset(rangeId));
    getDashboardMetrics(win)
      .then((m) => {
        if (!active) return;
        setMetrics(m);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setMetrics(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [rangeId]);

  const range = rangePreset(rangeId);
  const empty = !loading && (!metrics || metrics.bills === 0);
  const hourly = useMemo(() => metrics?.hourly ?? [], [metrics]);
  const topSellers = useMemo(() => metrics?.topSellers ?? [], [metrics]);
  const maxHour = Math.max(1, ...hourly.map((h) => h.total));
  const maxTopRevenue = Math.max(1, ...topSellers.map((s) => s.revenueSatang));

  const peakHour = useMemo(() => {
    const peak = hourly.reduce(
      (best, row) => (row.total > best.total ? row : best),
      { hour: 0, total: 0 },
    );
    return peak.total > 0 ? `${peak.hour}:00` : "No sales yet";
  }, [hourly]);

  const total = metrics?.totalSatang ?? 0;
  const bills = metrics?.bills ?? 0;
  const avg = metrics?.avgBillSatang ?? 0;

  return (
    <main className="mx-auto max-w-[1320px] px-4 py-6 pb-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-panel shadow-[var(--shadow-card)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,#f7f4ff_0%,#ebe6ff_48%,#fff_100%)]" />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[10px] bg-[var(--lavender-100)] px-3 py-1 text-xs font-black text-[var(--lavender-700)]">
                Live dashboard
              </span>
              <span className="text-sm font-bold text-muted">
                {range.label}
                {loading ? " - loading" : ""}
              </span>
            </div>

            <h1 className="mt-5 font-display text-4xl font-black leading-[0.98] tracking-tight text-accent-strong sm:text-5xl">
              Today&apos;s sales, stock, and close-day signal.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-text/80">
              See booth revenue clearly, spot the busy hours, and jump straight
              into the next operational action.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = rangeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setRangeId(preset.id)}
                    className={
                      active
                        ? "rounded-[12px] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-extrabold text-white shadow-[var(--shadow-rest)]"
                        : "rounded-[12px] border border-line bg-white/80 px-3.5 py-2 text-sm font-extrabold text-muted transition hover:text-accent-strong"
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Revenue" value={`${formatTHB(total)} THB`} />
              <HeroMetric label="Orders" value={String(bills)} />
              <HeroMetric label="Avg bill" value={`${formatTHB(avg)} THB`} />
            </div>
          </div>

          <div className="rounded-[22px] bg-[var(--color-accent)] p-5 text-white shadow-[var(--shadow-lift)]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">
              Booth pulse
            </p>
            <div className="mt-5 grid gap-4">
              <PulseRow icon={Clock3} label="Peak hour" value={peakHour} />
              <PulseRow
                icon={BarChart3}
                label="Top product"
                value={topSellers[0]?.name ?? "No sales yet"}
              />
              <PulseRow
                icon={PackageCheck}
                label="Next step"
                value={empty ? "Record first sale" : "Review close day"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((item) => (
          <QuickAction key={item.href} {...item} />
        ))}
      </section>

      {empty ? (
        <EmptyState />
      ) : (
        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
          <div className="grid gap-5">
            <ChartPanel hourly={hourly} maxHour={maxHour} />
            <TopProducts rows={topSellers} maxRevenue={maxTopRevenue} />
          </div>

          <aside className="grid content-start gap-5">
            <PaymentSplitTile split={metrics?.paymentSplit ?? EMPTY_SPLIT} />
            <CloseDayPanel bills={bills} totalSatang={total} />
          </aside>
        </section>
      )}

      <Link
        href="/app"
        className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-accent-strong hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        App home
      </Link>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-white/85 px-4 py-3 shadow-[var(--shadow-rest)] backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className="num mt-1 truncate text-2xl font-black text-accent-strong">
        {value}
      </p>
    </div>
  );
}

function PulseRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-white/12 text-white">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/55">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-extrabold text-white">
          {value}
        </p>
      </div>
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

function EmptyState() {
  return (
    <section className="mt-5 rounded-[var(--radius-xl)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="font-display text-2xl font-black text-accent-strong">
            No sales in this range yet
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Once the booth records orders, this page will show revenue, hourly
            demand, payment split, and top-selling products for the selected
            range.
          </p>
        </div>
        <Link
          href="/app/pos"
          className="btn-accent inline-flex items-center justify-center rounded-[var(--radius-md)] px-5 py-3 text-sm font-extrabold"
        >
          Open POS
        </Link>
      </div>
    </section>
  );
}

function ChartPanel({
  hourly,
  maxHour,
}: {
  hourly: DashboardMetrics["hourly"];
  maxHour: number;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-line bg-panel p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black text-accent-strong">
            Sales by hour
          </h2>
          <p className="mt-1 text-sm text-muted">
            Booth-hour demand from 09:00 to 18:00.
          </p>
        </div>
        <p className="text-sm font-extrabold text-muted">
          Peak:{" "}
          <span className="text-accent-strong">
            {formatTHB(maxHour)} THB
          </span>
        </p>
      </div>

      <div className="mt-6 flex h-[240px] items-end gap-2 border-b border-line pb-4">
        {hourly.map((h) => {
          const pct = Math.max(4, Math.round((h.total / maxHour) * 100));
          const peak = h.total === maxHour && h.total > 0;
          return (
            <div key={h.hour} className="flex h-full min-w-0 flex-1 items-end">
              <div
                className="w-full rounded-t-[14px] transition-[height,background] duration-200"
                style={{
                  height: `${pct}%`,
                  background: peak
                    ? "var(--grad-primary)"
                    : "linear-gradient(180deg, var(--lavender-300), var(--lavender-100))",
                }}
                title={`${h.hour}:00 - ${formatTHB(h.total)} THB`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2 text-[11px] font-black text-muted">
        {hourly.map((h) => (
          <span key={h.hour} className="flex-1 text-center">
            {h.hour}
          </span>
        ))}
      </div>
    </section>
  );
}

function TopProducts({
  rows,
  maxRevenue,
}: {
  rows: DashboardMetrics["topSellers"];
  maxRevenue: number;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-line bg-panel p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="font-display text-2xl font-black text-accent-strong">
        Top products
      </h2>
      <p className="mt-1 text-sm text-muted">
        Ranked by revenue in the selected range.
      </p>

      <div className="mt-5 grid gap-3">
        {rows.map((row, index) => (
          <div
            key={row.productId}
            className="grid gap-3 rounded-[18px] border border-line bg-panel-strong p-3 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-[var(--lavender-100)] text-sm font-black text-[var(--lavender-700)]">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="truncate font-display text-base font-black text-accent-strong">
                  {row.name}
                </p>
                <p className="num text-xs font-bold text-muted">{row.sku}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--grad-accent)]"
                  style={{
                    width: `${Math.max(
                      4,
                      Math.round((row.revenueSatang / maxRevenue) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="num text-sm font-black text-accent-strong">
                {formatTHB(row.revenueSatang)} THB
              </p>
              <p className="text-xs font-bold text-muted">{row.qty} sold</p>
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-line bg-panel-strong px-4 py-5 text-sm font-bold text-muted">
            No products sold in this range.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CloseDayPanel({
  bills,
  totalSatang,
}: {
  bills: number;
  totalSatang: number;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-xl font-black text-accent-strong">
        Close-day readiness
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Before leaving the booth, reconcile counted cash against today&apos;s
        recorded sales and keep the record for later review.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="Orders" value={String(bills)} />
        <MiniStat label="Sales" value={`${formatTHB(totalSatang)} THB`} />
      </div>
      <Link
        href="/app/close-day"
        className="mt-4 inline-flex w-full items-center justify-center rounded-[var(--radius-md)] border border-line bg-panel-strong px-4 py-3 text-sm font-extrabold text-accent-strong transition hover:bg-soft"
      >
        Review close day
      </Link>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--indigo-50)] px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className="num mt-1 truncate text-sm font-black text-accent-strong">
        {value}
      </p>
    </div>
  );
}
