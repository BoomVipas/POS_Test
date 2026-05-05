"use client";

import { useState } from "react";
import { formatTHB } from "@/lib/money/format";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import type { Product, PaymentMethod } from "@/lib/pos/types";
import { CartLine } from "./CartLine";
import { PaymentPicker } from "./PaymentPicker";
import { ReviewModal } from "./ReviewModal";
import { PromptPayDisplay } from "./PromptPayDisplay";
import { useDemoSettings } from "@/lib/demo/useDemoSettings";

const METHODS: PaymentMethod[] = [
  "cash",
  "promptpay",
  "transfer",
  "card",
  "other",
];

export function CartPanel({
  products,
  compact = false,
}: {
  products: Product[];
  compact?: boolean;
}) {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const { settings } = useDemoSettings();
  const [reviewOpen, setReviewOpen] = useState(false);

  const productIndex = new Map(products.map((p) => [p.id, p]));

  const subtotal = cart.lines.reduce((sum, l) => {
    const p = productIndex.get(l.productId);
    return p ? sum + p.price_satang * l.qty : sum;
  }, 0);

  const shipping = cart.lines.reduce((sum, l) => {
    const p = productIndex.get(l.productId);
    return p && l.fulfillment === "send_later"
      ? sum + p.shipping_fee_satang * l.qty
      : sum;
  }, 0);

  const total = Math.max(0, subtotal + shipping - cart.discountSatang);

  const cta =
    cart.lines.length === 0
      ? "Add a product"
      : !cart.paymentMethod
        ? "Pick a payment method"
        : "Review & confirm";
  const ctaDisabled = cart.lines.length === 0 || !cart.paymentMethod;

  return (
    <div className={compact ? "p-4" : "panel p-5"}>
      {!compact && (
        <header className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-accent-strong">Cart</h2>
          {cart.lines.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "CLEAR" })}
              className="rounded-full bg-[#f2e6d7] px-3 py-1 text-xs font-extrabold text-[#6a4a26]"
            >
              Clear
            </button>
          )}
        </header>
      )}

      {cart.lines.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">
          Tap a product to add it.
        </p>
      ) : (
        <ul className="grid gap-2">
          {cart.lines.map((line) => {
            const p = productIndex.get(line.productId);
            if (!p) return null;
            return <CartLine key={line.productId} line={line} product={p} />;
          })}
        </ul>
      )}

      <div className="mt-4 grid gap-3">
        <DiscountInput
          satang={cart.discountSatang}
          onChange={(s) => dispatch({ type: "SET_DISCOUNT", satang: s })}
        />

        <div className="grid gap-2 rounded-2xl border border-line bg-[#fffdf9] p-4 text-sm">
          <Row label="Subtotal" value={formatTHB(subtotal)} muted />
          {shipping > 0 && (
            <Row
              label="Shipping (send-later)"
              value={formatTHB(shipping)}
              muted
            />
          )}
          {cart.discountSatang > 0 && (
            <Row
              label="Discount"
              value={`-${formatTHB(cart.discountSatang)}`}
              muted
            />
          )}
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2">
            <span className="font-display text-lg text-accent-strong">
              Total
            </span>
            <span className="num text-2xl font-black text-accent-strong">
              {formatTHB(total)}
            </span>
          </div>
        </div>

        <PaymentPicker
          methods={METHODS}
          selected={cart.paymentMethod}
          onSelect={(m) =>
            dispatch({ type: "SET_PAYMENT_METHOD", method: m })
          }
        />

        {cart.paymentMethod === "promptpay" && total > 0 && (
          <PromptPayDisplay
            proxy={{ kind: "phone", value: settings.promptpayPhone }}
            amountSatang={total}
          />
        )}

        <button
          type="button"
          disabled={ctaDisabled}
          onClick={() => setReviewOpen(true)}
          className="btn-accent rounded-2xl px-5 py-3 text-base font-extrabold"
        >
          {cta}
        </button>
      </div>

      {reviewOpen && (
        <ReviewModal
          products={products}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          onClose={() => setReviewOpen(false)}
        />
      )}
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

function DiscountInput({
  satang,
  onChange,
}: {
  satang: number;
  onChange: (s: number) => void;
}) {
  const presets = [0, 5000, 10000]; // 0, 50, 100 THB
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line bg-panel px-3 py-2">
      <span className="text-xs font-extrabold uppercase tracking-wider text-muted">
        Discount
      </span>
      <input
        type="number"
        min={0}
        step={50}
        value={satang === 0 ? "" : (satang / 100).toString()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(0);
          const n = Number(v);
          if (Number.isFinite(n)) onChange(Math.max(0, Math.round(n * 100)));
        }}
        placeholder="0"
        className="num w-20 rounded-lg border border-line bg-white px-2 py-1 text-right text-sm font-extrabold focus:border-accent focus:outline-none"
      />
      <div className="ml-auto flex gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={
              satang === p && p > 0
                ? "rounded-full bg-[#e7dbc6] px-2 py-1 text-[11px] font-extrabold text-[#5d3f1e]"
                : "rounded-full bg-[#fff8ef] px-2 py-1 text-[11px] font-extrabold text-[#6a4a26]"
            }
          >
            {p === 0 ? "0" : `${p / 100}`}
          </button>
        ))}
      </div>
    </div>
  );
}
