"use client";

import { useMemo, useState } from "react";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoSampleBucket } from "@/lib/demo/useDemoSampleBucket";
import { useToast } from "@/components/ui/Toast";
import { ListSkeleton } from "@/components/ui/States";

/** Demo event id — matches the seed event in pos-for-sell/database/seed.sql. */
const DEMO_EVENT_ID = "demo-event-1";

/** Demo "available event stock" cap — for now the demo doesn't track per-event
 *  stock independently, so we use product.current_qty as the ceiling
 *  for "not enough event stock" validation. When real event_inventory wires
 *  up post-Wave-39a, this becomes a live `current_qty` read. */
function defaultAvailable(qty: number): number {
  return Math.max(0, qty);
}

export function SampleBucketManager() {
  const catalog = useDemoCatalog();
  const samples = useDemoSampleBucket();
  const { push } = useToast();
  const [busySku, setBusySku] = useState<string | null>(null);

  const products = useMemo(
    () =>
      [...catalog.items]
        .filter((p) => p.is_active)
        .sort((a, b) => a.sku.localeCompare(b.sku)),
    [catalog.items],
  );

  if (!catalog.ready || !samples.ready) {
    return (
      <ListSkeleton rows={4} />
    );
  }

  if (products.length === 0) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-sm text-muted">
          No products yet. Add a few in{" "}
          <a
            href="/app/setup/products"
            className="font-bold text-accent-strong underline-offset-2 hover:underline"
          >
            Product setup
          </a>{" "}
          first.
        </p>
      </div>
    );
  }

  function handleMake(productId: string, productName: string, sku: string) {
    setBusySku(sku);
    const product = products.find((p) => p.id === productId);
    const cap = defaultAvailable(product?.current_qty ?? 0);
    const result = samples.make(DEMO_EVENT_ID, productId, 1, cap);
    setBusySku(null);
    if (result.ok) {
      push({
        kind: "info",
        message: `+1 sample · ${productName}`,
      });
    } else if (result.reason === "not-enough-event-stock") {
      push({
        kind: "warn",
        message: `Not enough event stock for ${productName} (cap ${cap}).`,
      });
    } else {
      push({ kind: "warn", message: `Could not make sample (${result.reason}).` });
    }
  }

  function handleReturn(productId: string, productName: string, sku: string) {
    setBusySku(sku);
    const result = samples.returnToEvent(DEMO_EVENT_ID, productId, 1);
    setBusySku(null);
    if (result.ok) {
      push({
        kind: "info",
        message: `-1 sample · returned to event stock · ${productName}`,
      });
    } else if (result.reason === "not-enough-sample") {
      push({
        kind: "warn",
        message: `${productName} has no sample to return.`,
      });
    } else {
      push({ kind: "warn", message: `Could not return sample (${result.reason}).` });
    }
  }

  const totalSampleQty = products.reduce(
    (sum, p) => sum + samples.qtyFor(DEMO_EVENT_ID, p.id),
    0,
  );

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Total samples on display
        </p>
        <p className="num mt-1 font-display text-3xl text-accent-strong">
          {totalSampleQty}
        </p>
      </div>

      <div className="panel overflow-hidden p-0">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-soft text-left text-[11px] font-extrabold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 w-[12%]">SKU</th>
              <th className="px-4 py-3 w-[40%]">Product</th>
              <th className="px-4 py-3 w-[12%]">Cap</th>
              <th className="px-4 py-3 w-[12%]">Sample</th>
              <th className="px-4 py-3 w-[24%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cap = defaultAvailable(p.current_qty ?? 0);
              const qty = samples.qtyFor(DEMO_EVENT_ID, p.id);
              const canMake = !busySku && cap > 0;
              const canReturn = !busySku && qty > 0;
              return (
                <tr key={p.id} className="border-t border-line/60">
                  <td className="px-4 py-3 font-bold text-muted">{p.sku}</td>
                  <td className="px-4 py-3 font-extrabold text-text">
                    {p.name}
                  </td>
                  <td className="num px-4 py-3 text-muted">{cap}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        qty > 0
                          ? "num inline-flex min-w-[2ch] justify-center rounded-full bg-[var(--color-warn-soft-bg)] px-2 py-0.5 font-extrabold text-[var(--color-warn-soft-fg)]"
                          : "num text-muted"
                      }
                    >
                      {qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canMake}
                        onClick={() => handleMake(p.id, p.name, p.sku)}
                        className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft disabled:opacity-40"
                      >
                        +1 Make
                      </button>
                      <button
                        type="button"
                        disabled={!canReturn}
                        onClick={() => handleReturn(p.id, p.name, p.sku)}
                        className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft disabled:opacity-40"
                      >
                        -1 Return
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        <strong>Cap</strong> shows the product&apos;s default event stock — a
        proxy for available event-sellable qty in this demo. When real
        event_inventory wires up after Wave 39a (PR #4) merges, this becomes
        a live <code>current_qty</code> read from the database.
      </p>
    </section>
  );
}
