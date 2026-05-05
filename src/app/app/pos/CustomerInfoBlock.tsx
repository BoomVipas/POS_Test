"use client";

import { useEffect, useState } from "react";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { useDemoCustomers } from "@/lib/demo/useDemoCustomers";
import { useDemoCustomerNotes } from "@/lib/demo/useDemoCustomerNotes";
import { SUGGESTED_TAGS, toggleTag } from "@/lib/demo/customer-notes";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useT } from "@/lib/i18n/provider";
import { formatDateTimeTH } from "@/lib/date";
import type { CustomerProfile } from "@/lib/demo/customers";
import {
  lifecycleLabel,
  lifecycleStageFor,
} from "@/lib/demo/customer-lifecycle";
import { PetCardsBlock } from "./PetCardsBlock";

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
  const notes = useDemoCustomerNotes();
  const [match, setMatch] = useState<CustomerProfile | null>(null);
  const [customTagDraft, setCustomTagDraft] = useState("");

  const debouncedPhone = useDebouncedValue(cart.customer.phone, 350);

  useEffect(() => {
    if (!customers.ready || !debouncedPhone.trim()) {
      setMatch(null);
      return;
    }
    setMatch(customers.findByPhone(debouncedPhone));
  }, [debouncedPhone, customers]);

  const existingNote = match
    ? notes.get(cart.customer.phone) ?? { note: "", tags: [], updatedAt: "" }
    : null;

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
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-ok-soft-fg)]/30 bg-[var(--color-ok-soft-bg)] px-3 py-2 text-[var(--color-ok-soft-fg)]">
              <div className="text-xs">
                <p className="font-extrabold">
                  ★ {t.pos.returningCustomer} ·{" "}
                  {t.pos.ordersCount(match.orderCount)}
                  {" · "}
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] uppercase">
                    {lifecycleLabel(lifecycleStageFor(match))}
                  </span>
                  {match.pointsAvailable > 0 && (
                    <>
                      {" · "}
                      {t.pos.loyaltyPointsAvailable(match.pointsAvailable)}
                    </>
                  )}
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

            <PetCardsBlock phone={cart.customer.phone} />

            {existingNote && notes.ready && (
              <div className="rounded-xl border border-line bg-panel p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {t.pos.customerNotesHeader}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {t.pos.customerTags}:
                  </span>
                  {[...new Set([...SUGGESTED_TAGS, ...existingNote.tags])].map(
                    (tag) => {
                      const active = existingNote.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            notes.set(cart.customer.phone, {
                              tags: toggleTag(existingNote.tags, tag),
                            })
                          }
                          className={
                            active
                              ? "rounded-full bg-gradient-to-b from-[#a9763f] to-[#7e552a] px-2 py-0.5 text-[10px] font-extrabold text-white"
                              : "rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] font-extrabold text-accent-strong hover:bg-soft"
                          }
                        >
                          {tag}
                        </button>
                      );
                    },
                  )}
                  <input
                    type="text"
                    value={customTagDraft}
                    onChange={(e) => setCustomTagDraft(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const tag = customTagDraft.trim().toLowerCase();
                        if (!tag) return;
                        notes.set(cart.customer.phone, {
                          tags: toggleTag(existingNote.tags, tag),
                        });
                        setCustomTagDraft("");
                      }
                    }}
                    placeholder={t.pos.addCustomTag}
                    className="w-20 rounded-full border border-line bg-white px-2 py-0.5 text-[10px] focus:border-accent focus:outline-none"
                  />
                </div>
                <textarea
                  value={existingNote.note}
                  onChange={(e) =>
                    notes.set(cart.customer.phone, {
                      note: e.currentTarget.value,
                    })
                  }
                  placeholder={t.pos.customerNotePlaceholder}
                  rows={2}
                  className="mt-2 w-full rounded-md border border-line bg-white px-2 py-1 text-xs text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </div>
            )}
          </>
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
