"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { formatTHB } from "@/lib/money/format";
import type { Product } from "@/lib/pos/types";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import { useDemoSettings } from "@/lib/demo/useDemoSettings";
import { pointsForSale } from "@/lib/demo/loyalty";
import {
  newDemoOrderId,
  nextOrderNumber,
  type DemoOrder,
  type DemoOrderItem,
} from "@/lib/demo/sales";
import type { OrderType, PaymentMethod } from "@/lib/database.types";
import { useT } from "@/lib/i18n/provider";
import { useToast } from "@/components/ui/Toast";
import { usePOSMode } from "@/lib/pos/pos-mode";
import { resolveSubmit, shouldClearCart } from "@/lib/pos/confirm-state";
import { submitOrder, type SubmitOrderResult } from "./actions";

export function ReviewModal({
  products,
  subtotal,
  shipping,
  total,
  onClose,
}: {
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const cart = useCart();
  const dispatch = useCartDispatch();
  const sales = useDemoSales();
  const catalog = useDemoCatalog();
  const audit = useDemoAudit();
  const { settings } = useDemoSettings();
  const { t } = useT();
  const { push } = useToast();
  const posMode = usePOSMode();

  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Idempotency key for this confirm session — stable across retries so a
  // resubmit after a lost response can't create a duplicate sale. A fresh key is
  // minted when the modal remounts (a new review of a fresh/edited cart).
  const [requestId] = useState(() => crypto.randomUUID());
  const productIndex = new Map(products.map((p) => [p.id, p]));
  const hasSendLater = cart.lines.some((l) => l.fulfillment === "send_later");
  const hasTakeNow = cart.lines.some((l) => l.fulfillment === "take_now");
  const pointsToEarn = pointsForSale(total, settings.loyaltyPointsPer100Baht);

  function deriveOrderType(): OrderType {
    if (hasSendLater && hasTakeNow) return "mixed";
    if (hasSendLater) return "send_later";
    return "take_now";
  }

  function buildOrder(): DemoOrder {
    const items: DemoOrderItem[] = cart.lines
      .map((l) => {
        const p = productIndex.get(l.productId);
        if (!p) return null;
        return {
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          qty: l.qty,
          unitPriceSatang: p.price_satang,
          lineTotalSatang: p.price_satang * l.qty,
          fulfillmentType: l.fulfillment,
          ...(l.note ? { note: l.note } : {}),
          ...(p.cost_satang && p.cost_satang > 0
            ? { unitCostSatang: p.cost_satang }
            : {}),
        } satisfies DemoOrderItem;
      })
      .filter((x): x is DemoOrderItem => x !== null);

    const orderType = deriveOrderType();
    const isSendLater = orderType === "send_later" || orderType === "mixed";
    const usingSplits = cart.splits.length > 0;
    const effectiveMethod: PaymentMethod = usingSplits
      ? "mixed"
      : (cart.paymentMethod ?? "cash");
    const isCash = effectiveMethod === "cash";
    const tendered = cart.cashTenderedSatang;
    const change = isCash && tendered > total ? tendered - total : 0;

    return {
      id: newDemoOrderId(),
      orderNumber: nextOrderNumber(),
      customerName: cart.customer.name || null,
      customerPhone: cart.customer.phone || null,
      customerEmail: cart.customer.email || null,
      orderType,
      paymentMethod: effectiveMethod,
      subtotalSatang: subtotal,
      discountSatang: cart.discountSatang,
      shippingFeeSatang: shipping,
      totalSatang: total,
      note: null,
      createdAt: new Date().toISOString(),
      items,
      ...(isCash && tendered > 0
        ? { cashTenderedSatang: tendered, changeDueSatang: change }
        : {}),
      ...(usingSplits
        ? {
            payments: cart.splits.map((sp) => ({
              method: sp.method,
              amountSatang: sp.amountSatang,
            })),
          }
        : {}),
      ...(pointsToEarn > 0 ? { pointsEarned: pointsToEarn } : {}),
      source: cart.source,
      ...(isSendLater
        ? {
            sendLaterStatus: "pending" as const,
            trackingNumber: null,
            shippingAddress: cart.customer.address || null,
          }
        : {}),
    };
  }

  // DD-65 — live path: record the sale through the create_order RPC. The client
  // sends only intent (lines, payment, customer); the RPC owns prices, stock and
  // totals. No localStorage, no client-side stock math.
  async function handleLiveConfirm() {
    if (posMode.mode !== "live") return;
    if (!posMode.eventId) {
      push({
        kind: "error",
        title: "No active event",
        message: "Open or create an event before selling.",
      });
      return;
    }
    setConfirmed(true);
    setError(null);

    // Connectivity hedge: a wifi drop makes the Server Action call THROW (not
    // return a result). Catch it so the cashier gets a retryable error instead
    // of a button stuck on "Saved" — and the cart is never lost. resolveSubmit
    // maps success / RPC-rejection / transport-failure; only success clears.
    let res: SubmitOrderResult | null = null;
    try {
      res = await submitOrder({
        eventId: posMode.eventId,
        lines: cart.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          fulfillment: l.fulfillment,
          ...(l.note ? { note: l.note } : {}),
        })),
        paymentMethod: cart.paymentMethod ?? "cash",
        splits: cart.splits.map((s) => ({
          method: s.method,
          amountSatang: s.amountSatang,
        })),
        discountSatang: cart.discountSatang,
        customer: {
          name: cart.customer.name,
          phone: cart.customer.phone,
          email: cart.customer.email,
          address: cart.customer.address,
        },
        clientRequestId: requestId,
      });
    } catch (e) {
      console.error("[pos] submitOrder threw (transport):", e);
      res = null;
    }

    const resolution = resolveSubmit(res);
    if (resolution.kind === "success") {
      push({
        kind: "success",
        title: "Sale recorded",
        message: `${formatTHB(total)} THB`,
      });
      if (shouldClearCart(resolution)) dispatch({ type: "CLEAR" });
      onClose();
      router.push(`/app/pos/success/${resolution.orderId}`);
    } else {
      // Failure of any kind: keep the cart, surface a persistent retryable error
      // (plus a toast), and re-enable the button so the cashier can retry.
      setConfirmed(false);
      setError(resolution.message);
      push({
        kind: "error",
        title: "Sale not recorded",
        message: resolution.message,
      });
    }
  }

  function handleConfirm() {
    if (posMode.mode === "live") {
      void handleLiveConfirm();
      return;
    }
    setConfirmed(true);
    const order = buildOrder();
    sales.append(order);

    // Decrement demo catalog stock for each line. Real Supabase RPC will do
    // this atomically server-side (DD-66).
    const itemsByProduct = new Map<string, number>();
    for (const it of order.items) {
      itemsByProduct.set(
        it.productId,
        (itemsByProduct.get(it.productId) ?? 0) + it.qty,
      );
    }
    for (const [productId, qty] of itemsByProduct) {
      const p = productIndex.get(productId);
      if (!p) continue;
      // Only decrement demo-catalog products (not the bundled mockProducts).
      if (catalog.items.some((c) => c.id === productId)) {
        catalog.update(productId, {
          current_qty: Math.max(0, p.current_qty - qty),
        });
      }
    }

    audit.log({
      action: "order_create",
      targetTable: "orders",
      targetId: order.id,
      summary: `${order.orderNumber} · ${formatTHB(order.totalSatang)} THB · ${order.paymentMethod}`,
      newValue: {
        orderNumber: order.orderNumber,
        totalSatang: order.totalSatang,
        paymentMethod: order.paymentMethod,
        items: order.items.length,
      },
    });

    push({
      kind: "success",
      title: "Sale recorded",
      message: `${order.orderNumber} · ${formatTHB(order.totalSatang)} THB`,
    });

    setTimeout(() => {
      dispatch({ type: "CLEAR" });
      onClose();
      router.push(`/app/pos/success/${order.id}`);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-3 py-6">
      <div className="panel relative w-full max-w-lg p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-soft px-3 py-1 text-sm font-extrabold text-muted"
        >
          ✕
        </button>

        <h2 className="font-display text-2xl text-accent-strong">
          Review sale
        </h2>

        <ul className="mt-4 grid gap-2">
          {cart.lines.map((line) => {
            const p = productIndex.get(line.productId);
            if (!p) return null;
            return (
              <li
                key={line.productId}
                className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted">{p.sku}</p>
                  <p className="font-extrabold text-text">{p.name}</p>
                  <p className="text-xs text-muted">
                    {line.qty} × {formatTHB(p.price_satang)}
                    {line.fulfillment === "send_later" && " · send later"}
                  </p>
                  {line.note && (
                    <p className="mt-0.5 text-[11px] italic text-[#2a2557]">
                      “{line.note}”
                    </p>
                  )}
                </div>
                <p className="num shrink-0 text-sm font-extrabold text-accent-strong">
                  {formatTHB(p.price_satang * line.qty)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 grid gap-1 text-sm">
          <Row label="Subtotal" value={formatTHB(subtotal)} muted />
          {shipping > 0 && (
            <Row label="Shipping" value={formatTHB(shipping)} muted />
          )}
          {cart.discountSatang > 0 && (
            <Row
              label="Discount"
              value={`-${formatTHB(cart.discountSatang)}`}
              muted
            />
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2">
            <span className="font-display text-lg">Total</span>
            <span className="num text-2xl font-black text-accent-strong">
              {formatTHB(total)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Payment method:{" "}
            <strong className="text-accent-strong">
              {cart.splits.length > 0
                ? `mixed · ${cart.splits.length} method${cart.splits.length === 1 ? "" : "s"}`
                : (cart.paymentMethod ?? "—")}
            </strong>
          </p>
          {cart.splits.length > 0 && (
            <ul className="mt-1 grid gap-0.5 rounded-xl bg-soft px-3 py-2 text-xs">
              {cart.splits.map((s, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="font-bold text-muted">{s.method}</span>
                  <span className="num font-bold">
                    {formatTHB(s.amountSatang)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {cart.splits.length === 0 &&
            cart.paymentMethod === "cash" &&
            cart.cashTenderedSatang > 0 && (
              <div className="mt-1 grid gap-0.5 rounded-xl bg-[var(--color-ok-soft-bg)] px-3 py-2 text-xs text-[var(--color-ok-soft-fg)]">
                <Row
                  label="Tendered"
                  value={formatTHB(cart.cashTenderedSatang)}
                  muted
                />
                <Row
                  label="Change due"
                  value={formatTHB(
                    Math.max(0, cart.cashTenderedSatang - total),
                  )}
                  muted
                />
              </div>
            )}
          {pointsToEarn > 0 && (
            <p className="mt-1 rounded-xl bg-[var(--color-warn-soft-bg)] px-3 py-2 text-xs font-extrabold text-[var(--color-warn-soft-fg)]">
              ★ {t.pos.loyaltyEarnsPoints(pointsToEarn)}
              {cart.customer.phone.trim() === "" &&
                " — add a customer phone to bank them"}
            </p>
          )}
          {hasSendLater && (
            <p className="rounded-xl border border-[#e5dff0] bg-[#faf8fd] px-3 py-2 text-xs text-[#2a2557]">
              Send-later: customer info will be required at confirm (DD-76).
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)] px-3 py-2 text-sm font-bold text-[var(--color-danger-soft-fg)]"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmed}
          className="btn-accent mt-5 w-full rounded-2xl px-5 py-3 text-base font-extrabold"
        >
          {confirmed ? "Saved" : error ? "Try again" : "Confirm sale"}
        </button>

        <p className="mt-2 text-center text-xs text-muted">
          {posMode.mode === "live" ? (
            <>
              Records the sale atomically via the <code>create_order</code> RPC.
            </>
          ) : (
            <>
              Demo mode: persists to localStorage. Configure Supabase to record
              real sales via <code>create_order</code>.
            </>
          )}
        </p>
      </div>
    </div>
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
