"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tags } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { ProductFormLive } from "./ProductFormLive";
import {
  createProduct,
  updateProduct,
  setProductActive,
  type ProductActionResult,
} from "./actions";
import type { ProductInput } from "@/lib/products/parse";
import type { LiveProduct } from "./product-row";

export function CatalogManagerLive({
  products,
  canWrite,
}: {
  products: LiveProduct[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LiveProduct | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<LiveProduct | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const activeCount = products.filter((p) => p.is_active).length;

  function add() {
    setEditing(null);
    setOpen(true);
  }
  function edit(p: LiveProduct) {
    setEditing(p);
    setOpen(true);
  }

  // Returns the action result so the modal can surface field errors (e.g. a
  // duplicate SKU caught by the unique constraint).
  async function handleSubmit(
    input: ProductInput,
    id: string | null,
  ): Promise<ProductActionResult> {
    const res = id ? await updateProduct(id, input) : await createProduct(input);
    if (res.ok) router.refresh();
    return res;
  }

  function toggleActive(p: LiveProduct) {
    startTransition(async () => {
      const res = await setProductActive(p.id, !p.is_active);
      if (res.ok) {
        router.refresh();
        push({
          kind: "info",
          title: p.is_active ? "Deactivated" : "Activated",
          message: `${p.sku} ${p.is_active ? "hidden from the POS" : "back in the POS"}.`,
        });
      } else {
        push({ kind: "error", title: "Couldn't update", message: res.error });
      }
      setPendingDeactivate(null);
    });
  }

  if (products.length === 0) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            icon={<Tags className="h-6 w-6 text-[var(--lavender-700)]" />}
            title="No products yet."
            body={
              canWrite
                ? "Add your first product to start building your catalog."
                : "No products yet. Ask a manager to add some."
            }
            action={canWrite ? <Button onClick={add}>+ Add product</Button> : undefined}
          />
        </div>
        <ProductFormLive
          key={open ? (editing?.id ?? "new") : "closed"}
          open={open}
          onClose={() => setOpen(false)}
          initial={editing}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {products.length} product{products.length === 1 ? "" : "s"} ·{" "}
          {activeCount} active
        </p>
        {canWrite && <Button onClick={add}>+ Add product</Button>}
      </div>

      <ul className="mt-4 grid gap-2">
        {products.map((p) => (
          <li
            key={p.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[var(--radius-lg)] border border-line ${p.is_active ? "bg-panel" : "bg-soft/40"} px-4 py-3`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="num text-xs font-bold text-muted">{p.sku}</span>
                <span className="font-extrabold text-text">{p.name}</span>
                {!p.is_active && <Pill tone="neutral">inactive</Pill>}
                {p.send_later_enabled && <Pill tone="ok">send-later</Pill>}
              </div>
              <p className="mt-1 text-xs text-muted">
                {p.category} ·{" "}
                <span className="num">{formatTHB(p.price_satang)} THB</span>
                {p.shipping_fee_satang > 0 && (
                  <>
                    {" · ship "}
                    <span className="num">
                      {formatTHB(p.shipping_fee_satang)} THB
                    </span>
                  </>
                )}
                {" · starting stock "}
                <span className="num">{p.default_starting_qty}</span>
              </p>
              {p.note && (
                <p className="mt-1 truncate text-[11px] text-muted/80">{p.note}</p>
              )}
            </div>
            {canWrite && (
              <div className="flex flex-col gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => edit(p)}>
                  Edit
                </Button>
                {p.is_active ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setPendingDeactivate(p)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                    Activate
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="/app/pos"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        Open POS →
      </Link>

      <ProductFormLive
        key={open ? (editing?.id ?? "new") : "closed"}
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDeactivate !== null}
        destructive
        title={
          pendingDeactivate
            ? `Deactivate ${pendingDeactivate.sku} — ${pendingDeactivate.name}?`
            : "Deactivate product?"
        }
        body="It will be hidden from the POS but kept in your records (past sales still reference it). You can reactivate it anytime."
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        onConfirm={() => pendingDeactivate && toggleActive(pendingDeactivate)}
        onCancel={() => setPendingDeactivate(null)}
      />
    </>
  );
}
