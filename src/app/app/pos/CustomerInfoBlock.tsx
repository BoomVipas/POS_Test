"use client";

import { useCart, useCartDispatch } from "@/lib/pos/cart-store";

const fieldCls =
  "w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/**
 * Renders only when cart contains send-later items. Captures shipping info
 * (name, phone, address). Optional email. Persists into the cart store so
 * ReviewModal can build the order with these fields.
 */
export function CustomerInfoBlock() {
  const cart = useCart();
  const dispatch = useCartDispatch();

  const hasSendLater = cart.lines.some((l) => l.fulfillment === "send_later");
  if (!hasSendLater) return null;

  const missing =
    !cart.customer.name.trim() ||
    !cart.customer.phone.trim() ||
    !cart.customer.address.trim();

  return (
    <div
      className={`rounded-2xl border p-4 ${
        missing
          ? "border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)]/40"
          : "border-line bg-panel-strong"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Send-later customer
      </p>
      <p className="mt-1 text-xs text-muted">
        Required for shipping. Saved to the order on confirm.
      </p>

      <div className="mt-3 grid gap-2">
        <input
          type="text"
          value={cart.customer.name}
          onChange={(e) =>
            dispatch({ type: "SET_CUSTOMER", patch: { name: e.currentTarget.value } })
          }
          placeholder="Customer name"
          autoComplete="name"
          className={fieldCls}
        />
        <input
          type="tel"
          value={cart.customer.phone}
          onChange={(e) =>
            dispatch({ type: "SET_CUSTOMER", patch: { phone: e.currentTarget.value } })
          }
          placeholder="Phone (08x-xxx-xxxx)"
          autoComplete="tel"
          inputMode="tel"
          className={fieldCls}
        />
        <input
          type="email"
          value={cart.customer.email}
          onChange={(e) =>
            dispatch({ type: "SET_CUSTOMER", patch: { email: e.currentTarget.value } })
          }
          placeholder="Email (optional)"
          autoComplete="email"
          className={fieldCls}
        />
        <textarea
          value={cart.customer.address}
          onChange={(e) =>
            dispatch({
              type: "SET_CUSTOMER",
              patch: { address: e.currentTarget.value },
            })
          }
          placeholder="Shipping address"
          rows={3}
          className={fieldCls}
        />
      </div>
      {missing && (
        <p className="mt-2 text-xs text-[var(--color-warn-soft-fg)]">
          Name, phone, and address are required to confirm.
        </p>
      )}
    </div>
  );
}
