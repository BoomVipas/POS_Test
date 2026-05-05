"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/pos/types";
import { ProductCard } from "./ProductCard";
import { useCart, useCartDispatch } from "@/lib/pos/cart-store";
import { useT } from "@/lib/i18n/provider";

export function ProductGrid({ products }: { products: Product[] }) {
  const cart = useCart();
  const dispatch = useCartDispatch();
  const { t } = useT();
  const reservedById = new Map(cart.lines.map((l) => [l.productId, l.qty]));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) set.add(p.category);
    return ["all" as const, ...[...set].sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
    // Pinned-first, then alphabetic by name (Shopify Smart Grid pattern).
    return [...matches].sort((a, b) => {
      const aPin = a.pinned ? 1 : 0;
      const bPin = b.pinned ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return a.name.localeCompare(b.name);
    });
  }, [products, query, category]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder={t.pos.searchPlaceholder}
          className="flex-1 min-w-[180px] rounded-[var(--radius-md)] border border-line bg-panel px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                c === category
                  ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                  : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
              }
            >
              {c === "all" ? t.common.all : c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-muted">
          {t.pos.noMatch}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const reserved = reservedById.get(p.id) ?? 0;
            const remaining = Math.max(0, p.current_qty - reserved);
            return (
              <ProductCard
                key={p.id}
                product={p}
                remaining={remaining}
                onAdd={() => dispatch({ type: "ADD", productId: p.id })}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
