"use client";

import { useState } from "react";
import { Minus, Plus, X, StickyNote } from "lucide-react";
import { formatTHB } from "@/lib/money/format";
import { useCartDispatch } from "@/lib/pos/cart-store";
import type { CartLine as CartLineType, Product } from "@/lib/pos/types";
import { useT } from "@/lib/i18n/provider";

export function CartLine({
  line,
  product,
}: {
  line: CartLineType;
  product: Product;
}) {
  const dispatch = useCartDispatch();
  const { t } = useT();
  const lineTotal = product.price_satang * line.qty;
  const isLater = line.fulfillment === "send_later";
  const [showNoteInput, setShowNoteInput] = useState(Boolean(line.note));

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border border-line p-3 ${
        isLater
          ? "bg-gradient-to-b from-[#fffdf8] to-[#f8efe2]"
          : "bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-muted">{product.sku}</p>
        <p className="line-clamp-2 text-sm font-extrabold text-text">
          {product.name}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "SET_FULFILLMENT",
                productId: product.id,
                fulfillment: isLater ? "take_now" : "send_later",
              })
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              isLater
                ? "border-[#ddc4a2] bg-[#fff7ec] text-[#6d4c28]"
                : "border-[#b8d2ab] bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)]"
            }`}
          >
            {isLater ? t.pos.sendLater : t.pos.takeNow}
          </button>
          {!showNoteInput && !line.note && (
            <button
              type="button"
              onClick={() => setShowNoteInput(true)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted hover:text-accent-strong"
            >
              <StickyNote size={11} />
              {t.pos.addNote}
            </button>
          )}
        </div>
        {(showNoteInput || line.note) && (
          <input
            type="text"
            value={line.note ?? ""}
            onChange={(e) =>
              dispatch({
                type: "SET_LINE_NOTE",
                productId: product.id,
                note: e.currentTarget.value,
              })
            }
            placeholder={t.pos.notePlaceholder}
            maxLength={120}
            autoFocus={showNoteInput && !line.note}
            className="mt-2 w-full rounded-md border border-line bg-white px-2 py-1 text-xs text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        )}
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Decrease"
            onClick={() =>
              dispatch({
                type: "SET_QTY",
                productId: product.id,
                qty: Math.max(0, line.qty - 1),
              })
            }
            className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-fg)]"
          >
            <Minus size={14} />
          </button>
          <span className="num min-w-[1.5rem] text-center text-sm font-black">
            {line.qty}
          </span>
          <button
            type="button"
            aria-label="Increase"
            onClick={() =>
              dispatch({
                type: "SET_QTY",
                productId: product.id,
                qty: line.qty + 1,
              })
            }
            className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)]"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="num text-sm font-extrabold text-accent-strong">
          {formatTHB(lineTotal)}
        </p>
        <button
          type="button"
          aria-label="Remove from cart"
          onClick={() => dispatch({ type: "REMOVE", productId: product.id })}
          className="grid h-6 w-6 place-items-center rounded-full bg-[#f6edde] text-muted hover:text-text"
        >
          <X size={12} />
        </button>
      </div>
    </li>
  );
}
