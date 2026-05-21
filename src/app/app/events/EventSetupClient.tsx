"use client";

// English-first MVP copy — flagged for Thai translation (owner sign-off), per
// the i18n rule. Mirrors the stock-allocation centerpiece of the event-setup
// mockup; booth-rule toggles + free-gift editor are deferred (see "Coming next").

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoEventSetup } from "@/lib/demo/useDemoEventSetup";
import {
  allocationTotal,
  computeEventSummary,
  MAX_DAYS,
  MIN_DAYS,
} from "@/lib/demo/event-setup";
import { formatTHB } from "@/lib/money/format";
import type { Product } from "@/lib/pos/types";

export function EventSetupClient({
  fallbackProducts,
}: {
  fallbackProducts: Product[];
}) {
  const { items, ready: catReady } = useDemoCatalog();
  const products = useMemo(
    () => (items.length > 0 ? items : fallbackProducts),
    [items, fallbackProducts],
  );

  const {
    setup,
    ready: evReady,
    ensureDraft,
    setName,
    setStartDate,
    setLocation,
    setDayCount,
    setDayQty,
    setSample,
    reset,
  } = useDemoEventSetup();

  useEffect(() => {
    if (!evReady || !catReady) return;
    ensureDraft(products);
  }, [evReady, catReady, ensureDraft, products]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const summary = useMemo(
    () => (setup ? computeEventSummary(setup, products) : null),
    [setup, products],
  );

  if (!evReady || !catReady || !setup || !summary) {
    return (
      <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
        <div className="panel p-6 text-sm text-muted">Loading…</div>
      </div>
    );
  }

  const dayCols = Array.from({ length: setup.dayCount }, (_, i) => i);
  const gridTemplate = `52px minmax(0,1.6fr) 78px repeat(${setup.dayCount}, 52px) 60px 84px`;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-extrabold uppercase tracking-[0.14em]"
            style={{ color: "var(--lavender-700)" }}
          >
            New event
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-accent-strong sm:text-4xl">
            Set up your booth
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Allocate inventory across event days and set a separate sample
            bucket. Changes save automatically — you can adjust everything
            mid-event.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-ok-soft-fg)]"
            style={{ background: "var(--color-ok-soft-bg)" }}
          >
            Auto-saved
          </span>
          <Link
            href="/app/pos"
            className="btn-accent rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-extrabold"
          >
            Open booth →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* LEFT */}
        <div className="grid gap-6">
          {/* Event details */}
          <section className="panel p-6">
            <h2 className="font-display text-lg font-extrabold tracking-tight text-accent-strong">
              Event details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Event name">
                <input
                  type="text"
                  value={setup.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pet Expo Thailand · Q2 2026"
                  className={inputCls}
                />
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  value={setup.startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Event days">
                <input
                  type="number"
                  min={MIN_DAYS}
                  max={MAX_DAYS}
                  value={setup.dayCount}
                  onChange={(e) => setDayCount(Number(e.target.value))}
                  className={`num ${inputCls}`}
                />
              </Field>
              <Field label="Location (optional)">
                <input
                  type="text"
                  value={setup.location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. IMPACT Muang Thong Thani"
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          {/* Stock allocation */}
          <section className="panel p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold tracking-tight text-accent-strong">
                  Stock allocation · {setup.dayCount}{" "}
                  {setup.dayCount === 1 ? "day" : "days"}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Pull from warehouse per day. The sample column comes off
                  warehouse but is shown separately. Totals over warehouse stock
                  are flagged.
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft"
              >
                Reset allocation
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Header */}
                <div
                  className="grid items-center gap-3 rounded-t-2xl border border-line bg-soft px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-muted"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  <span />
                  <span>Product</span>
                  <span className="text-right">Whse</span>
                  {dayCols.map((d) => (
                    <span key={d} className="text-center">
                      D{d + 1}
                    </span>
                  ))}
                  <span className="text-center">Smpl</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Rows */}
                <div className="rounded-b-2xl border border-t-0 border-line">
                  {setup.allocations.map((a) => {
                    const p = productById.get(a.productId);
                    if (!p) return null;
                    const booth = allocationTotal(a);
                    const pulled = booth + a.sample;
                    const over = pulled > p.current_qty;
                    return (
                      <div
                        key={a.productId}
                        className="grid items-center gap-3 border-t border-[var(--color-line-quiet,var(--line))] px-4 py-3 first:border-t-0 hover:bg-soft/60"
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        <Thumb product={p} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold leading-tight text-text">
                            {p.name}
                          </p>
                          <p className="num mt-0.5 text-[10px] font-bold text-muted">
                            {p.sku} · {formatTHB(p.price_satang)}
                          </p>
                        </div>
                        <span
                          className={`num text-right text-xs font-bold ${
                            over
                              ? "text-[var(--color-danger-soft-fg)]"
                              : "text-muted"
                          }`}
                        >
                          {p.current_qty}
                        </span>
                        {dayCols.map((d) => (
                          <CellInput
                            key={d}
                            value={a.days[d] ?? 0}
                            onChange={(v) => setDayQty(a.productId, d, v)}
                          />
                        ))}
                        <CellInput
                          value={a.sample}
                          tone="sample"
                          onChange={(v) => setSample(a.productId, v)}
                        />
                        <span
                          className={`num text-right text-[13px] font-extrabold ${
                            over ? "text-[var(--color-danger-soft-fg)]" : "text-accent-strong"
                          }`}
                          title={
                            over
                              ? `Over warehouse stock by ${pulled - p.current_qty}`
                              : undefined
                          }
                        >
                          {booth}
                          {a.sample > 0 && (
                            <span className="text-muted"> +{a.sample}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {setup.allocations.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted">
                      No active products yet. Add products in Setup → Products
                      first.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="grid content-start gap-6">
          <section className="panel p-6">
            <h2 className="font-display text-lg font-extrabold tracking-tight text-accent-strong">
              Event summary
            </h2>
            <div className="mt-3">
              <SummaryRow
                label="SKUs allocated"
                value={String(summary.skusAllocated)}
              />
              <SummaryRow
                label="Total units to booth"
                value={String(summary.totalBoothUnits)}
              />
              <SummaryRow
                label="Sample bucket"
                value={String(summary.sampleTotal)}
              />
              <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-bold text-text">
                  Estimated retail
                </span>
                <span className="num text-lg font-black text-accent-strong">
                  {formatTHB(summary.estimatedRetailSatang)}
                </span>
              </div>
            </div>
          </section>

          <section
            className="rounded-[var(--radius-lg)] border border-line p-5"
            style={{ background: "var(--indigo-50)" }}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent">
              Coming next
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-text/80">
              Schedule, booth-rule toggles (Send Later, QR pet registration,
              offline mode) and free-gift promo rules land in a follow-up. This
              MVP covers event details + per-day stock allocation.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-line bg-panel px-3 py-2.5 text-base text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function CellInput({
  value,
  onChange,
  tone,
}: {
  value: number;
  onChange: (v: number) => void;
  tone?: "sample";
}) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      value={value === 0 ? "" : value}
      placeholder="0"
      onChange={(e) => onChange(Number(e.target.value))}
      className={`num w-full rounded-lg border px-1.5 py-1.5 text-center text-[13px] font-bold text-text outline-none focus:border-accent ${
        tone === "sample"
          ? "border-[var(--lavender-200)] bg-[var(--lavender-100)]"
          : "border-line bg-panel"
      }`}
    />
  );
}

function Thumb({ product }: { product: Product }) {
  return (
    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-[10px] border border-line bg-soft">
      {product.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_path}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[11px] font-extrabold text-muted">
          {product.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="num font-extrabold text-text">{value}</span>
    </div>
  );
}
