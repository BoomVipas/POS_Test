import Link from "next/link";
import type { Product } from "@/lib/pos/types";

export function ReorderTile({ catalog }: { catalog: Product[] }) {
  const flagged = catalog
    .filter((p) => p.is_active)
    .filter(
      (p) =>
        typeof p.reorder_point === "number" &&
        p.reorder_point > 0 &&
        p.current_qty <= p.reorder_point,
    )
    .sort((a, b) => a.current_qty - b.current_qty);

  if (flagged.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)]/40 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-warn-soft-fg)]">
          Reorder needed
        </p>
        <span className="rounded-full bg-[var(--color-warn-soft-bg)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--color-warn-soft-fg)]">
          {flagged.length} product{flagged.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="mt-3 grid gap-1.5 text-sm">
        {flagged.slice(0, 6).map((p) => (
          <li
            key={p.id}
            className="flex items-baseline justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2"
          >
            <div className="min-w-0">
              <p className="num text-[10px] font-bold text-muted">{p.sku}</p>
              <p className="line-clamp-1 font-extrabold text-text">{p.name}</p>
            </div>
            <p className="num shrink-0 text-xs font-extrabold text-[var(--color-warn-soft-fg)]">
              {p.current_qty} / {p.reorder_point}
            </p>
          </li>
        ))}
      </ul>
      {flagged.length > 6 && (
        <p className="mt-2 text-[11px] text-muted">
          +{flagged.length - 6} more below reorder point.
        </p>
      )}
      <Link
        href="/app/setup/products"
        className="mt-3 inline-block text-xs font-bold text-accent-strong"
      >
        Manage catalog →
      </Link>
    </div>
  );
}
