"use client";

import Link from "next/link";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";

export function SuccessClient({ orderId }: { orderId: string }) {
  const { orders, ready } = useDemoSales();
  const order = ready ? orders.find((o) => o.id === orderId) : undefined;

  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <div className="panel p-6 text-center text-sm text-muted">
          Loading…
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <div className="panel p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-2xl text-[var(--color-ok-soft-fg)]">
            ✓
          </span>
          <h1 className="mt-4 font-display text-3xl text-accent-strong">
            Sale recorded
          </h1>
          <p className="num mt-2 text-sm text-muted">{orderId}</p>
          <p className="mt-3 text-text/85">
            Demo order not found in this browser. (Could happen if you cleared
            demo data, or this is a real Supabase order ID — DD-67 will render
            real details.)
          </p>
          <div className="mt-6 flex justify-center gap-3">
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

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <div className="panel p-6">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-2xl text-[var(--color-ok-soft-fg)]">
            ✓
          </span>
          <h1 className="mt-3 font-display text-3xl text-accent-strong">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {formatDateTimeTH(order.createdAt)} · {order.paymentMethod}
          </p>
        </div>

        <ul className="mt-5 grid gap-2">
          {order.items.map((it, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted">{it.sku}</p>
                <p className="font-extrabold text-text">{it.productName}</p>
                <p className="text-xs text-muted">
                  {it.qty} × {formatTHB(it.unitPriceSatang)}
                  {it.fulfillmentType === "send_later" && " · send later"}
                </p>
              </div>
              <p className="num shrink-0 text-sm font-extrabold text-accent-strong">
                {formatTHB(it.lineTotalSatang)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-1 text-sm">
          {order.subtotalSatang !== order.totalSatang && (
            <Row label="Subtotal" value={formatTHB(order.subtotalSatang)} muted />
          )}
          {order.shippingFeeSatang > 0 && (
            <Row label="Shipping" value={formatTHB(order.shippingFeeSatang)} muted />
          )}
          {order.discountSatang > 0 && (
            <Row
              label="Discount"
              value={`-${formatTHB(order.discountSatang)}`}
              muted
            />
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2">
            <span className="font-display text-lg text-accent-strong">
              Total
            </span>
            <span className="num text-2xl font-black text-accent-strong">
              {formatTHB(order.totalSatang)} THB
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
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
      <span className={muted ? "font-bold text-muted" : "font-bold"}>
        {label}
      </span>
      <span className="num font-bold">{value}</span>
    </div>
  );
}
