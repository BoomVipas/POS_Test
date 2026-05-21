"use client";

import Link from "next/link";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoSettings } from "@/lib/demo/useDemoSettings";
import { useT } from "@/lib/i18n/provider";
import { PromptPayDisplay } from "../../PromptPayDisplay";
import { RegistrationLinkBlock } from "./RegistrationLinkBlock";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import { Skeleton } from "@/components/ui/States";

export function SuccessClient({ orderId }: { orderId: string }) {
  const { orders, ready } = useDemoSales();
  const { settings } = useDemoSettings();
  const { t } = useT();
  const order = ready ? orders.find((o) => o.id === orderId) : undefined;

  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <Skeleton className="h-72" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <div className="panel p-6 text-center">
          <span className="success-pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-3xl text-[var(--color-ok-soft-fg)] shadow-rest ring-4 ring-[color-mix(in_oklch,var(--color-ok-soft-fg)_15%,transparent)]">
            ✓
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-accent-strong">
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
          <span className="success-pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-3xl text-[var(--color-ok-soft-fg)] shadow-rest ring-4 ring-[color-mix(in_oklch,var(--color-ok-soft-fg)_15%,transparent)]">
            ✓
          </span>
          <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-ok-soft-fg)]">
            Sale complete
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-accent-strong">
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
              {t.pos.total}
            </span>
            <span className="num text-2xl font-black text-accent-strong">
              {formatTHB(order.totalSatang)} THB
            </span>
          </div>
          {order.paymentMethod === "cash" &&
            order.cashTenderedSatang !== undefined &&
            order.cashTenderedSatang > 0 && (
              <div className="mt-1 grid gap-0.5 rounded-xl bg-[var(--color-ok-soft-bg)] px-3 py-2 text-xs text-[var(--color-ok-soft-fg)]">
                <Row
                  label={t.pos.amountTendered}
                  value={`${formatTHB(order.cashTenderedSatang)} THB`}
                  muted
                />
                <Row
                  label={t.pos.changeDue}
                  value={`${formatTHB(order.changeDueSatang ?? 0)} THB`}
                  muted
                />
              </div>
            )}
          {order.payments && order.payments.length > 0 && (
            <ul className="mt-1 grid gap-0.5 rounded-xl bg-soft px-3 py-2 text-xs">
              {order.payments.map((p, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="font-bold text-muted">{p.method}</span>
                  <span className="num font-bold">
                    {formatTHB(p.amountSatang)} THB
                  </span>
                </li>
              ))}
            </ul>
          )}
          {order.pointsEarned !== undefined && order.pointsEarned > 0 && (
            <p className="mt-1 rounded-xl bg-[var(--color-warn-soft-bg)] px-3 py-2 text-center text-xs font-extrabold text-[var(--color-warn-soft-fg)]">
              ★ {t.pos.loyaltyEarnsPoints(order.pointsEarned)}
            </p>
          )}
        </div>

        {order.paymentMethod === "promptpay" && order.totalSatang > 0 && (
          <div className="mt-5">
            <PromptPayDisplay
              proxy={{ kind: "phone", value: settings.promptpayPhone }}
              amountSatang={order.totalSatang}
            />
            <p className="mt-2 text-center text-xs text-muted">
              {t.pos.receiptScanAgain}
            </p>
          </div>
        )}

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

        <RegistrationLinkBlock orderId={order.id} />
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
