"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import type { DemoOrder } from "@/lib/demo/sales";

export function CorrectionList() {
  const { orders, ready, update } = useDemoSales();
  const { items: catalog, update: updateProduct } = useDemoCatalog();
  const audit = useDemoAudit();
  const { push } = useToast();
  const [voiding, setVoiding] = useState<DemoOrder | null>(null);
  const [reason, setReason] = useState("");

  if (!ready) {
    return (
      <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-muted">
        Loading…
      </p>
    );
  }

  // Show most-recent first; 30 latest.
  const recent = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  function startVoid(o: DemoOrder) {
    setVoiding(o);
    setReason("");
  }

  function confirmVoid() {
    if (!voiding) return;
    if (reason.trim().length < 3) {
      push({
        kind: "warn",
        title: "Reason required",
        message: "At least 3 characters.",
      });
      return;
    }

    update(voiding.id, {
      status: "voided",
      voidedAt: new Date().toISOString(),
      voidReason: reason.trim(),
    });

    // Restore demo catalog stock for each item.
    const incrementBy = new Map<string, number>();
    for (const it of voiding.items) {
      incrementBy.set(it.productId, (incrementBy.get(it.productId) ?? 0) + it.qty);
    }
    for (const [productId, qty] of incrementBy) {
      const p = catalog.find((c) => c.id === productId);
      if (p) {
        updateProduct(productId, { current_qty: p.current_qty + qty });
      }
    }

    audit.log({
      action: "order_void",
      targetTable: "orders",
      targetId: voiding.id,
      summary: `${voiding.orderNumber} voided · ${formatTHB(voiding.totalSatang)} THB · reason: ${reason.trim()}`,
      oldValue: { totalSatang: voiding.totalSatang, status: "completed" },
      newValue: { status: "voided", voidReason: reason.trim() },
    });

    push({
      kind: "success",
      title: "Voided",
      message: `${voiding.orderNumber} voided. Stock restored.`,
    });
    setVoiding(null);
    setReason("");
  }

  if (recent.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <p className="font-display text-xl text-accent-strong">No sales yet.</p>
        <p className="mt-2 text-sm text-muted">
          Confirm a sale at /app/pos and it will appear here for correction.
        </p>
        <Link
          href="/app/pos"
          className="btn-accent mt-4 inline-flex rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold"
        >
          Open POS
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-6 grid gap-2">
        {recent.map((o) => {
          const isVoided = (o.status ?? "completed") === "voided";
          return (
            <li
              key={o.id}
              className={`rounded-[var(--radius-lg)] border ${isVoided ? "border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)]/30" : "border-line bg-panel"} px-4 py-3`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="num text-xs font-bold text-muted">
                      {o.orderNumber}
                    </span>
                    {isVoided && <Pill tone="danger">voided</Pill>}
                    <span className="text-xs text-muted">
                      {formatDateTimeTH(o.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {o.items.length} line
                    {o.items.length === 1 ? "" : "s"} · {o.paymentMethod}
                  </p>
                  {o.voidReason && (
                    <p className="mt-1 text-xs text-[var(--color-danger-soft-fg)]">
                      Void reason: <strong>{o.voidReason}</strong>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-base font-extrabold text-accent-strong">
                    {formatTHB(o.totalSatang)} THB
                  </span>
                  {!isVoided && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => startVoid(o)}
                    >
                      Void
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal
        open={voiding !== null}
        onClose={() => setVoiding(null)}
        title={`Void ${voiding?.orderNumber ?? ""}`}
        size="sm"
      >
        <p className="text-sm text-text/85">
          This restores inventory for each line and excludes the order from
          dashboard totals. Cannot be undone in demo mode.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          placeholder="Reason (required, min 3 chars)"
          rows={3}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setVoiding(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmVoid}>
            Confirm void
          </Button>
        </div>
      </Modal>
    </>
  );
}
