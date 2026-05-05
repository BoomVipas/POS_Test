"use client";

import { useEffect, useState } from "react";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { useDemoCustomers } from "@/lib/demo/useDemoCustomers";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useT } from "@/lib/i18n/provider";
import { formatDateTimeTH } from "@/lib/date";
import type { CustomerProfile } from "@/lib/demo/customers";

const fieldCls =
  "w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

/**
 * Renders only when cart contains send-later items. Captures shipping info
 * (name, phone, address). Optional email. Persists into the cart store so
 * ReviewModal can build the order with these fields.
 *
 * Looks up the entered phone against past demo orders. If the phone has been
 * seen before, shows a "Returning customer" badge with an autofill button.
 */
export function CustomerInfoBlock() {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const { t } = useT();
  const customers = useDemoCustomers();
  const [match, setMatch] = useState<CustomerProfile | null>(null);

  const debouncedPhone = useDebouncedValue(cart.customer.phone, 350);

  useEffect(() => {
    if (!customers.ready || !debouncedPhone.trim()) {
      setMatch(null);
      return;
    }
    setMatch(customers.findByPhone(debouncedPhone));
  }, [debouncedPhone, customers]);

  const hasSendLater = cart.lines.some((l) => l.fulfillment === "send_later");
  if (!hasSendLater) return null;

  const missing =
    !cart.customer.name.trim() ||
    !cart.customer.phone.trim() ||
    !cart.customer.address.trim();

  function autofill() {
    if (!match) return;
    dispatch({
      type: "SET_CUSTOMER",
      patch: {
        name: match.name ?? cart.customer.name,
        email: match.email ?? cart.customer.email,
        address: match.address ?? cart.customer.address,
      },
    });
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        missing
          ? "border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)]/40"
          : "border-line bg-panel-strong"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {t.pos.customerHeading}
      </p>
      <p className="mt-1 text-xs text-muted">{t.pos.customerHint}</p>

      <div className="mt-3 grid gap-2">
        <input
          type="text"
          value={cart.customer.name}
          onChange={(e) =>
            dispatch({ type: "SET_CUSTOMER", patch: { name: e.currentTarget.value } })
          }
          placeholder={t.pos.customerName}
          autoComplete="name"
          className={fieldCls}
        />
        <input
          type="tel"
          value={cart.customer.phone}
          onChange={(e) =>
            dispatch({ type: "SET_CUSTOMER", patch: { phone: e.currentTarget.value } })
          }
          placeholder={t.pos.customerPhone}
          autoComplete="tel"
          inputMode="tel"
          className={fieldCls}
        />

        {match && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-ok-soft-fg)]/30 bg-[var(--color-ok-soft-bg)] px-3 py-2 text-[var(--color-ok-soft-fg)]">
            <div className="text-xs">
              <p className="font-extrabold">
                ★ {t.pos.returningCustomer} · {t.pos.ordersCount(match.orderCount)}
              </p>
              <p className="opacity-80">
                {match.name ?? "—"} · {t.pos.lastSeen}{" "}
                {formatDateTimeTH(match.lastSeenAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={autofill}
              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[var(--color-ok-soft-fg)] shadow-sm"
            >
              {t.pos.autofillCustomer}
            </button>
          </div>
        )}

        <input
          type="email"
          value={cart.customer.email}
          onChange={(e) =>
            dispatch({ type: "SET_CUSTOMER", patch: { email: e.currentTarget.value } })
          }
          placeholder={t.pos.customerEmail}
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
          placeholder={t.pos.customerAddress}
          rows={3}
          className={fieldCls}
        />
      </div>
      {missing && (
        <p className="mt-2 text-xs text-[var(--color-warn-soft-fg)]">
          {t.pos.customerMissing}
        </p>
      )}
    </div>
  );
}
