"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { rangePreset, type RangePresetId } from "@/lib/demo/dashboard-range";
import { rangeToWindow } from "@/lib/dashboard/window";
import { getDashboardMetrics } from "./metrics-actions";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";
import { formatTHB } from "@/lib/money/format";
import { PaymentSplitTile } from "./PaymentSplitTile";

// Configured-mode dashboard (#48) — renders REAL workspace metrics from
// getDashboardMetrics (#47 seam). Demo/illustrative view stays in DashboardLive
// for the unconfigured build. Scope is the core "see your sales" set the
// backend provides (revenue · orders · avg · hourly · top products · payment
// split); richer tiles (margin/source/reorder) remain demo-only until their
// own real-data backends land.

const PRESETS: Array<{ id: RangePresetId; label: string }> = [
  { id: "today", label: "Today" },
  { id: "last7", label: "7 days" },
  { id: "last30", label: "30 days" },
  { id: "this_month", label: "This month" },
];

const EMPTY_SPLIT = { cash: 0, promptpay: 0, transfer: 0, card: 0, other: 0 };

export function DashboardConfigured() {
  const [rangeId, setRangeId] = useState<RangePresetId>("today");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const win = rangeToWindow(rangePreset(rangeId));
    getDashboardMetrics(win)
      .then((m) => {
        if (!active) return;
        setMetrics(m);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [rangeId]);

  const empty = !loading && (!metrics || metrics.bills === 0);
  const hourly = metrics?.hourly ?? [];
  const topSellers = metrics?.topSellers ?? [];
  const maxHour = Math.max(1, ...hourly.map((h) => h.total));
  const maxTopQty = Math.max(1, ...topSellers.map((s) => s.qty));

  return (
    <main className="mx-auto max-w-[1320px] px-6 py-8 pb-14 sm:px-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--lavender-700)]">
            Mochi POS · live
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-text">
            Today&apos;s takings
          </h1>
          <p className="mt-1 text-sm text-muted">
            {rangePreset(rangeId).label}
            {loading ? " · loading…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setRangeId(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                rangeId === p.id
                  ? "bg-[var(--color-accent)] text-white"
                  : "border border-line bg-panel text-muted hover:text-text"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {empty && (
        <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-panel-strong px-4 py-3">
          <Image
            src="/mochi-mascot.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <p className="text-sm text-muted">
            No sales in this range yet — record one at{" "}
            <Link href="/app/pos" className="font-bold text-accent">
              /app/pos
            </Link>
            .
          </p>
        </div>
      )}

      <section className="mb-6 grid gap-4">
        <div
          className="overflow-hidden rounded-[24px] p-6 text-white shadow-[var(--shadow-card)] sm:p-7"
          style={{ background: "var(--grad-primary)" }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/75">
            Revenue
          </div>
          <div className="num mt-2 text-[44px] font-black leading-none tracking-[-0.03em] sm:text-[52px]">
            ฿{formatTHB(metrics?.totalSatang ?? 0)}
          </div>
          <div className="mt-2.5 text-xs font-bold text-white/80">
            {metrics?.bills ?? 0} order{(metrics?.bills ?? 0) === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            label="Orders"
            value={String(metrics?.bills ?? 0)}
            sub={`Avg ฿${formatTHB(metrics?.avgBillSatang ?? 0)} per order`}
          />
          <Stat
            label="Avg bill"
            value={`฿${formatTHB(metrics?.avgBillSatang ?? 0)}`}
            sub={`${metrics?.bills ?? 0} order${(metrics?.bills ?? 0) === 1 ? "" : "s"} in range`}
          />
          <Stat
            label="Top product"
            value={topSellers[0]?.name ?? "—"}
            sub={topSellers[0] ? `${topSellers[0].qty} sold` : "no sales yet"}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[20px] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-extrabold text-text">Sales by hour</h3>
          <div className="mt-4 flex h-[200px] items-end gap-1.5 border-b border-line pb-3">
            {hourly.map((h) => {
              const pct = Math.max(3, Math.round((h.total / maxHour) * 100));
              const peak = h.total === maxHour && h.total > 0;
              return (
                <div
                  key={h.hour}
                  className="flex-1 rounded-t-lg"
                  style={{
                    height: `${pct}%`,
                    background: peak ? "var(--lavender)" : "var(--lavender-300)",
                  }}
                  title={`${h.hour}:00 · ฿${formatTHB(h.total)}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 text-[10px] font-bold text-muted">
            {hourly.map((h) => (
              <span key={h.hour} className="flex-1 text-center">
                {h.hour}
              </span>
            ))}
          </div>

          <h3 className="mt-8 text-sm font-extrabold text-text">Top products</h3>
          <div className="mt-3 grid gap-2.5">
            {topSellers.map((s, i) => (
              <div
                key={s.productId}
                className="grid grid-cols-[28px_1fr_auto_90px] items-center gap-3"
              >
                <div
                  className="grid h-7 w-7 place-items-center rounded-lg text-xs font-extrabold"
                  style={{ background: "var(--lavender-100)", color: "var(--color-accent)" }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-text">{s.name}</div>
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
            {topSellers.length === 0 && (
              <p className="text-xs text-muted">No products sold in this range.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <PaymentSplitTile split={metrics?.paymentSplit ?? EMPTY_SPLIT} />
        </div>
      </div>

      <Link href="/app" className="mt-8 inline-block text-sm font-bold text-accent-strong">
        ← App home
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
      <div className="num mt-1.5 truncate text-[32px] font-black leading-none tracking-[-0.025em] text-text">
        {value}
      </div>
      <div className="mt-2 text-xs text-muted">{sub}</div>
    </div>
  );
}
