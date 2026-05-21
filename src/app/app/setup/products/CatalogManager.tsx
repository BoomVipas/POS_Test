"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pill } from "@/components/ui/Pill";
import { EmptyState, ListSkeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { useT } from "@/lib/i18n/provider";
import { forecastProduct } from "@/lib/demo/forecast";
import { ProductFormModal } from "./ProductFormModal";
import { SAMPLE_CATALOG } from "@/lib/demo/sample-catalog";
import type { Product } from "@/lib/pos/types";

const DEMO_WORKSPACE_ID = "demo-workspace";

export function CatalogManager() {
  const { items, ready, create, update, remove, setActive } = useDemoCatalog();
  const audit = useDemoAudit();
  const { orders } = useDemoSales();
  const { t } = useT();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Product | null>(null);
  const { push } = useToast();

  const forecastsByProduct = useMemo(() => {
    const out = new Map<string, ReturnType<typeof forecastProduct>>();
    for (const p of items) {
      out.set(
        p.id,
        forecastProduct({
          orders,
          productId: p.id,
          currentQty: p.current_qty,
        }),
      );
    }
    return out;
  }, [items, orders]);

  function add() {
    setEditing(null);
    setOpen(true);
  }

  function edit(p: Product) {
    setEditing(p);
    setOpen(true);
  }

  function handleSubmit(values: Omit<Product, "id">, originalId: string | null) {
    if (originalId) {
      update(originalId, values);
      audit.log({
        action: "catalog_update",
        targetTable: "products",
        targetId: originalId,
        summary: `${values.sku} — ${values.name}`,
        newValue: {
          sku: values.sku,
          name: values.name,
          price_satang: values.price_satang,
          cost_satang: values.cost_satang ?? null,
          current_qty: values.current_qty,
          reorder_point: values.reorder_point ?? null,
        },
      });
    } else {
      const id = create(values);
      audit.log({
        action: "catalog_create",
        targetTable: "products",
        targetId: id,
        summary: `+${values.sku} — ${values.name}`,
        newValue: {
          sku: values.sku,
          name: values.name,
          price_satang: values.price_satang,
          cost_satang: values.cost_satang ?? null,
          current_qty: values.current_qty,
          reorder_point: values.reorder_point ?? null,
        },
      });
    }
  }

  function confirmRemove() {
    const p = pendingRemove;
    if (!p) return;
    remove(p.id);
    audit.log({
      action: "catalog_delete",
      targetTable: "products",
      targetId: p.id,
      summary: `−${p.sku} — ${p.name}`,
      oldValue: { sku: p.sku, name: p.name },
    });
    push({
      kind: "info",
      title: "Removed",
      message: `${p.sku} deleted from demo catalog.`,
    });
    setPendingRemove(null);
  }

  function handleSetActive(p: Product, isActive: boolean) {
    setActive(p.id, isActive);
    audit.log({
      action: "catalog_set_active",
      targetTable: "products",
      targetId: p.id,
      summary: `${p.sku} → ${isActive ? "active" : "inactive"}`,
      oldValue: { is_active: p.is_active },
      newValue: { is_active: isActive },
    });
  }

  function handleSetPinned(p: Product, pinned: boolean) {
    update(p.id, { pinned });
    audit.log({
      action: "catalog_update",
      targetTable: "products",
      targetId: p.id,
      summary: `${p.sku} → ${pinned ? "pinned" : "unpinned"}`,
      oldValue: { pinned: p.pinned ?? false },
      newValue: { pinned },
    });
  }

  function handleSeed() {
    if (
      items.length > 0 &&
      !confirm(
        "Adding sample products on top of your existing catalog. Continue?",
      )
    ) {
      return;
    }
    let created = 0;
    for (const p of SAMPLE_CATALOG) {
      if (items.some((existing) => existing.sku === p.sku)) continue;
      create(p);
      created++;
    }
    audit.log({
      action: "demo_seed",
      targetTable: "products",
      targetId: null,
      summary: `Loaded ${created} sample product${created === 1 ? "" : "s"}`,
      newValue: { added: created, total: SAMPLE_CATALOG.length },
    });
    push({
      kind: "success",
      title: "Sample catalog loaded",
      message: `${created} product${created === 1 ? "" : "s"} added.`,
    });
  }

  if (!ready) {
    return (
      <ListSkeleton className="mt-8" />
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            icon="🏷️"
            title="No products yet."
            body="Add your first product card, or load the sample catalog to skip ahead and see the POS in action."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={add}>+ Add product</Button>
                <Button variant="secondary" onClick={handleSeed}>
                  Load sample catalog
                </Button>
              </div>
            }
          />
        </div>
        <Link
          href="/app/pos"
          className="mt-6 inline-block text-sm font-bold text-accent-strong"
        >
          Try the POS with bundled demo products →
        </Link>
        <ProductFormModal
          open={open}
          onClose={() => setOpen(false)}
          initial={editing}
          workspaceId={DEMO_WORKSPACE_ID}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length} product{items.length === 1 ? "" : "s"} ·{" "}
          {items.filter((p) => p.is_active).length} active
        </p>
        <Button onClick={add}>+ Add product</Button>
      </div>

      <ul className="mt-4 grid gap-2">
        {items.map((p) => (
          <li
            key={p.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[var(--radius-lg)] border border-line ${p.is_active ? "bg-panel" : "bg-soft/40"} px-4 py-3`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="num text-xs font-bold text-muted">{p.sku}</span>
                <span className="font-extrabold text-text">{p.name}</span>
                {p.pinned && <Pill tone="accent">★ {t.setupProducts.pinned}</Pill>}
                {!p.is_active && <Pill tone="neutral">inactive</Pill>}
                {p.send_later_enabled && <Pill tone="ok">send-later</Pill>}
              </div>
              <p className="mt-1 text-xs text-muted">
                {p.category} ·{" "}
                <span className="num">
                  {formatTHB(p.price_satang)} THB
                </span>
                {p.cost_satang && p.cost_satang > 0 && (
                  <>
                    {" · cost "}
                    <span className="num">
                      {formatTHB(p.cost_satang)}
                    </span>
                    {" · margin "}
                    <span className="num font-extrabold text-[var(--color-ok-soft-fg)]">
                      {Math.round(
                        ((p.price_satang - p.cost_satang) / p.price_satang) *
                          100,
                      )}
                      %
                    </span>
                  </>
                )}
                {p.shipping_fee_satang > 0 && (
                  <>
                    {" · ship "}
                    <span className="num">
                      {formatTHB(p.shipping_fee_satang)} THB
                    </span>
                  </>
                )}
                {" · stock "}
                <span
                  className={
                    typeof p.reorder_point === "number" &&
                    p.reorder_point > 0 &&
                    p.current_qty <= p.reorder_point
                      ? "num font-extrabold text-[var(--color-warn-soft-fg)]"
                      : "num"
                  }
                >
                  {p.current_qty}
                </span>
                {typeof p.reorder_point === "number" &&
                  p.reorder_point > 0 && (
                    <>
                      {" / reorder@"}
                      <span className="num">{p.reorder_point}</span>
                    </>
                  )}
              </p>
              {(() => {
                const f = forecastsByProduct.get(p.id);
                if (!f || f.window.qtySold === 0) return null;
                return (
                  <p className="mt-1 text-[11px] font-bold text-[var(--color-warn-soft-fg)]">
                    {t.pos.forecastSold(f.window.qtySold, 30)}
                    {f.suggestRestockQty > 0 && (
                      <>
                        {" · "}
                        {t.pos.forecastSuggestRestock(f.suggestRestockQty)}
                      </>
                    )}
                  </p>
                );
              })()}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => edit(p)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSetPinned(p, !p.pinned)}
              >
                {p.pinned ? t.setupProducts.unpin : t.setupProducts.pin}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSetActive(p, !p.is_active)}
              >
                {p.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setPendingRemove(p)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/app/pos"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        Open POS →
      </Link>

      <ProductFormModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        workspaceId={DEMO_WORKSPACE_ID}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        destructive
        title={
          pendingRemove
            ? `Remove ${pendingRemove.sku} — ${pendingRemove.name}?`
            : "Remove product?"
        }
        body="This deletes the product from your demo catalog. It cannot be undone in demo mode."
        confirmLabel="Remove product"
        cancelLabel="Keep it"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}
