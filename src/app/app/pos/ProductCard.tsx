"use client";

import { formatTHB } from "@/lib/money/format";
import { useT } from "@/lib/i18n/provider";
import type { Product } from "@/lib/pos/types";

export function ProductCard({
  product,
  remaining,
  onAdd,
  onPreOrder,
}: {
  product: Product;
  remaining: number;
  onAdd: () => void;
  /** Called when staff taps a sold-out product. If omitted, sold-out is just disabled. */
  onPreOrder?: (product: Product) => void;
}) {
  const { t } = useT();
  const soldout = remaining <= 0;
  const low = remaining > 0 && remaining <= 5;

  const stockClass = soldout
    ? "bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-fg)]"
    : low
      ? "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn-soft-fg)]"
      : "bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)]";

  const handleClick = () => {
    if (soldout) {
      onPreOrder?.(product);
    } else {
      onAdd();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={soldout && !onPreOrder}
      className="group grid gap-1 rounded-2xl border border-[color-mix(in_oklch,var(--color-accent)_12%,transparent)] bg-gradient-to-b from-[#ffffff] via-[#faf8fd] to-[#efeafd] p-2 text-left shadow-[0_10px_20px_rgba(77,53,29,0.05)] transition hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(77,53,29,0.10)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_10px_20px_rgba(77,53,29,0.05)]"
    >
      <div className="relative grid aspect-[5/1.95] place-items-center overflow-hidden rounded-xl border border-[color-mix(in_oklch,var(--color-accent)_10%,transparent)] bg-gradient-to-b from-[#ffffff] to-[#efeafd]">
        {product.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_path}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-3 text-center text-xs font-extrabold leading-tight text-[#6b6489]">
            {product.name}
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full border border-[color-mix(in_oklch,var(--color-accent)_10%,transparent)] bg-[rgba(255,251,245,0.94)] px-1.5 py-0.5 text-[11px] font-extrabold text-[#1c1838]">
          {product.sku}
        </span>
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stockClass}`}
        >
          {soldout
            ? onPreOrder
              ? `★ ${t.preOrders.soldOutCta}`
              : "sold out"
            : remaining}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 px-1 pt-1">
        <span className="line-clamp-2 text-[13px] font-extrabold leading-tight text-text">
          {product.name}
        </span>
        <span className="num shrink-0 text-[15px] font-extrabold text-accent-strong/95">
          {formatTHB(product.price_satang)}
        </span>
      </div>
    </button>
  );
}
