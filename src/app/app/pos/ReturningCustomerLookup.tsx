"use client";

import { useMemo, useState } from "react";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCustomerTokens } from "@/lib/demo/useDemoCustomerTokens";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import {
  lookupReturningCustomer,
  matchToCustomerPatch,
} from "@/lib/demo/returning-customer";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";

/**
 * Wave 40c — Returning-customer lookup at the cart-panel top.
 *
 * Cashier types a phone (or pastes one from a customer's loyalty card / Line
 * message). The widget aggregates past-sales + portal-registrations and
 * surfaces a "Returning customer" badge with name, last purchase, pet
 * preview, and allergy hints. One click attaches the matched customer to
 * the current cart (writes to cart.customer via SET_CUSTOMER).
 *
 * Per VISION.md: this is what makes the post-purchase Customer Portal
 * useful at the booth. Without it, registration is data with no payoff.
 *
 * The widget is COLLAPSED by default — a single text input. When phone
 * matches, the panel expands. When no match, a quiet "Not seen before"
 * note appears. Cashier can ignore it entirely.
 */
export function ReturningCustomerLookup() {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const { orders, ready: salesReady } = useDemoSales();
  const { portalCustomers, ready: tokensReady } = useDemoCustomerTokens();
  const [phone, setPhone] = useState(cart.customer.phone || "");
  const debouncedPhone = useDebouncedValue(phone, 300);

  const match = useMemo(() => {
    if (!salesReady || !tokensReady) return null;
    if (!debouncedPhone || debouncedPhone.trim().length < 6) return null;
    return lookupReturningCustomer(debouncedPhone, orders, portalCustomers);
  }, [debouncedPhone, orders, portalCustomers, salesReady, tokensReady]);

  function handleAttach() {
    if (!match) return;
    dispatch({ type: "SET_CUSTOMER", patch: matchToCustomerPatch(match) });
  }

  const showEmptyMatch =
    debouncedPhone.trim().length >= 6 && match === null && salesReady && tokensReady;

  return (
    <section className="grid gap-2 rounded-2xl border border-line bg-soft px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="returning-customer-phone"
          className="text-xs font-extrabold uppercase tracking-wide text-muted"
        >
          🔍 Customer phone / เบอร์ลูกค้า
        </label>
        {phone && (
          <button
            type="button"
            onClick={() => setPhone("")}
            className="text-[11px] font-bold text-muted hover:text-accent-strong"
          >
            Clear
          </button>
        )}
      </div>
      <input
        id="returning-customer-phone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="08xx-xxx-xxxx"
        className="num w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />

      {showEmptyMatch && (
        <p className="text-xs text-muted">
          New phone — not seen before. Complete the sale; the receipt QR will
          let them register after.
        </p>
      )}

      {match && (
        <div className="grid gap-2 rounded-xl border border-accent/30 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-[var(--color-warn-soft-bg)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-warn-soft-fg)]">
              ★ Returning customer
            </span>
            {match.portal && (
              <span className="text-[10px] font-bold text-accent">
                Portal-registered
              </span>
            )}
          </div>
          <div className="text-sm">
            <p className="font-extrabold text-accent-strong">
              {match.name || "(no name on file)"}
            </p>
            {match.pastSales && (
              <p className="num mt-0.5 text-xs text-muted">
                {match.pastSales.orderCount} past order
                {match.pastSales.orderCount === 1 ? "" : "s"} ·{" "}
                {formatTHB(match.pastSales.totalSatang)} lifetime · last seen{" "}
                {formatDateTimeTH(match.pastSales.lastSeenAt)}
              </p>
            )}
            {match.pastSales && match.pastSales.pointsAvailable > 0 && (
              <p className="mt-0.5 text-xs font-bold text-[var(--color-warn-soft-fg)]">
                ★ {match.pastSales.pointsAvailable} loyalty points available
              </p>
            )}
            {match.lastProductNames.length > 0 && (
              <p className="mt-1 text-xs text-text/85">
                Last bought:{" "}
                <span className="font-bold">
                  {match.lastProductNames.join(", ")}
                </span>
              </p>
            )}
          </div>

          {match.portal && match.portal.pets.length > 0 && (
            <div className="rounded-lg border border-line bg-soft px-3 py-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">
                Pets / สัตว์เลี้ยง
              </p>
              <ul className="mt-1 grid gap-1 text-xs">
                {match.portal.pets.map((pet, i) => (
                  <li key={i}>
                    <span className="font-extrabold text-accent-strong">
                      {pet.name}
                    </span>{" "}
                    <span className="text-muted">
                      ({pet.species}
                      {pet.breed ? `, ${pet.breed}` : ""})
                    </span>
                    {pet.allergies && (
                      <span className="ml-1 rounded bg-[var(--color-bad-soft-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-bad-soft-fg)]">
                        ⚠ {pet.allergies}
                      </span>
                    )}
                    {pet.preferences && (
                      <span className="ml-1 text-[11px] text-text/85">
                        likes: {pet.preferences}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleAttach}
            className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft"
          >
            Attach this customer to sale →
          </button>
        </div>
      )}
    </section>
  );
}
