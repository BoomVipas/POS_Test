"use client";

import Link from "next/link";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import type { ReceiptView } from "@/lib/pos/receipt";

// DD-67 — real receipt for a Supabase order. Visual parity with the demo
// SuccessClient, rendered from the fetched order. (PromptPay QR + the customer
// registration QR come with workspace settings / Wave 40d — M3 — so they're not
// here yet.)
export function RealReceipt({ view }: { view: ReceiptView }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <div className="panel p-6">
        <div className="text-center">
          <span className="success-pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-3xl text-[var(--color-ok-soft-fg)] shadow-rest ring-4 ring-[color-mix(in_oklch,var(--color-ok-soft-fg)_15%,transparent)]">
            ✓
          </span>
          <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ok-soft-fg)]">
            Sale complete
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-accent-strong">
            {view.orderNumber}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {formatDateTimeTH(view.createdAt)} · {view.paymentMethod}
          </p>
        </div>

        <ul className="mt-5 grid gap-2">
          {view.items.map((it, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted">{it.sku}</p>
                <p className="font-extrabold text-text">{it.productName}</p>
                <p className="text-xs text-muted">
                  {it.qty} × {formatTHB(it.unitPriceSatang)}
                  {it.fulfillment === "send_later" && " · send later"}
                  {it.isSample && " · sample"}
                </p>
                {it.note && (
                  <p className="mt-0.5 text-[11px] italic text-[#2a2557]">
                    “{it.note}”
                  </p>
                )}
              </div>
              <p className="num shrink-0 text-sm font-extrabold text-accent-strong">
                {formatTHB(it.lineTotalSatang)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-1 text-sm">
          {view.subtotalSatang !== view.totalSatang && (
            <Row label="Subtotal" value={formatTHB(view.subtotalSatang)} muted />
          )}
          {view.shippingFeeSatang > 0 && (
            <Row label="Shipping" value={formatTHB(view.shippingFeeSatang)} muted />
          )}
          {view.discountSatang > 0 && (
            <Row label="Discount" value={`-${formatTHB(view.discountSatang)}`} muted />
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2">
            <span className="font-display text-lg text-accent-strong">Total</span>
            <span className="num text-2xl font-black text-accent-strong">
              {formatTHB(view.totalSatang)} THB
            </span>
          </div>
          {view.payments.length > 0 && (
            <ul className="mt-1 grid gap-0.5 rounded-xl bg-soft px-3 py-2 text-xs">
              {view.payments.map((p, i) => (
                <li key={i} className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-muted">{p.method}</span>
                  <span className="num font-bold">{formatTHB(p.amountSatang)} THB</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent-strong"
          >
            Print
          </button>
          <Link
            href="/app/pos"
            className="btn-accent rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-bold"
          >
            Next sale
          </Link>
          <Link
            href="/app/dashboard"
            className="rounded-[var(--radius-md)] border border-line bg-panel px-5 py-2.5 text-sm font-bold text-accent-strong"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={muted ? "font-bold text-muted" : "font-bold"}>{label}</span>
      <span className="num font-bold">{value}</span>
    </div>
  );
}
