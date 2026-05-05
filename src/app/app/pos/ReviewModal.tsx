"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { formatTHB } from "@/lib/money/format";
import type { Product } from "@/lib/pos/types";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import {
  newDemoOrderId,
  nextOrderNumber,
  type DemoOrder,
  type DemoOrderItem,
} from "@/lib/demo/sales";
import type { OrderType, PaymentMethod } from "@/lib/database.types";
import { useToast } from "@/components/ui/Toast";

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
  const { push } = useToast();

  const [confirmed, setConfirmed] = useState(false);
  const productIndex = new Map(products.map((p) => [p.id, p]));
  const hasSendLater = cart.lines.some((l) => l.fulfillment === "send_later");
  const hasTakeNow = cart.lines.some((l) => l.fulfillment === "take_now");

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
        } satisfies DemoOrderItem;
      })
      .filter((x): x is DemoOrderItem => x !== null);

    const orderType = deriveOrderType();
    const isSendLater = orderType === "send_later" || orderType === "mixed";
    return {
      id: newDemoOrderId(),
      orderNumber: nextOrderNumber(),
      customerName: cart.customer.name || null,
      customerPhone: cart.customer.phone || null,
      customerEmail: cart.customer.email || null,
      orderType,
      paymentMethod: (cart.paymentMethod ?? "cash") as PaymentMethod,
      subtotalSatang: subtotal,
      discountSatang: cart.discountSatang,
      shippingFeeSatang: shipping,
      totalSatang: total,
      note: null,
      createdAt: new Date().toISOString(),
      items,
      ...(isSendLater
        ? {
            sendLaterStatus: "pending" as const,
            trackingNumber: null,
            shippingAddress: cart.customer.address || null,
          }
        : {}),
    };
  }

  function handleConfirm() {
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
              {cart.paymentMethod ?? "—"}
            </strong>
          </p>
          {hasSendLater && (
            <p className="rounded-xl border border-[#ddc4a2] bg-[#fff7ec] px-3 py-2 text-xs text-[#6d4c28]">
              Send-later: customer info will be required at confirm (DD-76).
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmed}
          className="btn-accent mt-5 w-full rounded-2xl px-5 py-3 text-base font-extrabold"
        >
          {confirmed ? "Saved" : "Confirm sale"}
        </button>

        <p className="mt-2 text-center text-xs text-muted">
          Demo mode: persists to localStorage. DD-65 swaps in the real{" "}
          <code>create_order</code> RPC.
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
