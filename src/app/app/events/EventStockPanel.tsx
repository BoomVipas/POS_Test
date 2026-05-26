"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getEventStock,
  adjustEventStock,
  type EventStockRow,
} from "./stock-actions";

// #46 — per-product restock control for one event. Loads the event's stock on
// open, then ±adjusts each product via adjustEventStock (#17 RPC). Optimistic
// row update on success.
export function EventStockPanel({
  eventId,
  canAdjust,
}: {
  eventId: string;
  canAdjust: boolean;
}) {
  const [rows, setRows] = useState<EventStockRow[] | null>(null);
  const [deltas, setDeltas] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { push } = useToast();

  useEffect(() => {
    let active = true;
    getEventStock(eventId).then((r) => {
      if (active) setRows(r);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  async function apply(productId: string) {
    const delta = parseInt(deltas[productId] ?? "", 10);
    if (!Number.isInteger(delta) || delta === 0) {
      push({
        kind: "error",
        title: "Invalid amount",
        message: "Enter a non-zero whole number.",
      });
      return;
    }
    setBusy(productId);
    const res = await adjustEventStock({
      eventId,
      productId,
      delta,
      reason: "manual adjust",
    });
    if (res.ok) {
      setRows(
        (rs) =>
          rs?.map((r) =>
            r.productId === productId ? { ...r, currentQty: res.currentQty } : r,
          ) ?? rs,
      );
      setDeltas((d) => ({ ...d, [productId]: "" }));
      push({
        kind: "success",
        title: "Stock updated",
        message: `${delta > 0 ? "+" : ""}${delta}`,
      });
    } else {
      push({ kind: "error", title: "Couldn't adjust stock", message: res.error });
    }
    setBusy(null);
  }

  if (rows === null) {
    return <p className="mt-2 text-xs text-muted">Loading stock…</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="mt-2 text-xs text-muted">
        No products allocated yet — use “Sync active products”.
      </p>
    );
  }

  return (
    <div className="mt-2 grid gap-1.5 rounded-[var(--radius-md)] border border-line bg-panel-strong p-3">
      {rows.map((r) => (
        <div key={r.productId} className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate">
            <span className="font-bold text-text">{r.name}</span>{" "}
            <span className="num text-xs text-muted">{r.sku}</span>
          </span>
          <span className="num w-12 text-right font-extrabold text-text">
            {r.currentQty}
          </span>
          {canAdjust && (
            <>
              <input
                type="number"
                inputMode="numeric"
                value={deltas[r.productId] ?? ""}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setDeltas((d) => ({ ...d, [r.productId]: value }));
                }}
                placeholder="±"
                aria-label={`Adjust ${r.name} stock`}
                className="num w-16 rounded-[var(--radius-md)] border border-line bg-panel px-2 py-1 text-sm"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => apply(r.productId)}
                loading={busy === r.productId}
              >
                Adjust
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
