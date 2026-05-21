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
import {
  effectiveTotalSatang,
  newRefundId,
  remainingQty,
  orderSourceLabel,
  type DemoOrder,
  type DemoRefund,
} from "@/lib/demo/sales";

export function CorrectionList() {
  const { orders, ready, update } = useDemoSales();
  const { items: catalog, update: updateProduct } = useDemoCatalog();
  const audit = useDemoAudit();
  const { push } = useToast();

  const [voiding, setVoiding] = useState<DemoOrder | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const [refunding, setRefunding] = useState<DemoOrder | null>(null);
  const [refundQty, setRefundQty] = useState<Record<number, number>>({});
  const [refundReason, setRefundReason] = useState("");

  if (!ready) {
    return (
      <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-muted">
        Loading…
      </p>
    );
  }

  const recent = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  function startVoid(o: DemoOrder) {
    setVoiding(o);
    setVoidReason("");
  }

  function confirmVoid() {
    if (!voiding) return;
    if (voidReason.trim().length < 3) {
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
      voidReason: voidReason.trim(),
    });

    // Restore demo catalog stock — only for qty NOT already refunded.
    const incrementBy = new Map<string, number>();
    voiding.items.forEach((it, idx) => {
      const remaining = remainingQty(voiding, idx);
      if (remaining > 0) {
        incrementBy.set(
          it.productId,
          (incrementBy.get(it.productId) ?? 0) + remaining,
        );
      }
    });
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
      summary: `${voiding.orderNumber} voided · ${formatTHB(voiding.totalSatang)} THB · reason: ${voidReason.trim()}`,
      oldValue: { totalSatang: voiding.totalSatang, status: "completed" },
      newValue: { status: "voided", voidReason: voidReason.trim() },
    });

    push({
      kind: "success",
      title: "Voided",
      message: `${voiding.orderNumber} voided. Stock restored.`,
    });
    setVoiding(null);
    setVoidReason("");
  }

  function startRefund(o: DemoOrder) {
    setRefunding(o);
    setRefundQty({});
    setRefundReason("");
  }

  function confirmRefund() {
    if (!refunding) return;
    if (refundReason.trim().length < 3) {
      push({
        kind: "warn",
        title: "Reason required",
        message: "At least 3 characters.",
      });
      return;
    }
    const newRefunds: DemoRefund[] = [];
    let totalRefundedSatang = 0;
    Object.entries(refundQty).forEach(([idxStr, qty]) => {
      const idx = Number(idxStr);
      const q = Math.max(0, Math.floor(qty));
      if (q <= 0) return;
      const item = refunding.items[idx];
      if (!item) return;
      const remaining = remainingQty(refunding, idx);
      const cap = Math.min(q, remaining);
      if (cap <= 0) return;
      newRefunds.push({
        id: newRefundId(),
        lineIndex: idx,
        qty: cap,
        amountSatang: item.unitPriceSatang * cap,
        reason: refundReason.trim(),
        refundedAt: new Date().toISOString(),
      });
      totalRefundedSatang += item.unitPriceSatang * cap;
    });
    if (newRefunds.length === 0) {
      push({
        kind: "warn",
        title: "Nothing to refund",
        message: "Pick at least one line and a qty.",
      });
      return;
    }
    update(refunding.id, {
      refunds: [...(refunding.refunds ?? []), ...newRefunds],
    });
    // Restore demo catalog stock for the refunded qtys.
    const incrementBy = new Map<string, number>();
    for (const r of newRefunds) {
      const item = refunding.items[r.lineIndex];
      if (!item) continue;
      incrementBy.set(
        item.productId,
        (incrementBy.get(item.productId) ?? 0) + r.qty,
      );
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
      targetId: refunding.id,
      summary: `${refunding.orderNumber} partial refund · ${formatTHB(totalRefundedSatang)} THB · ${newRefunds.length} line${newRefunds.length === 1 ? "" : "s"} · reason: ${refundReason.trim()}`,
      newValue: { refunds: newRefunds, totalRefundedSatang },
    });
    push({
      kind: "success",
      title: "Refunded",
      message: `${formatTHB(totalRefundedSatang)} THB refunded. Stock restored for those lines.`,
    });
    setRefunding(null);
    setRefundQty({});
    setRefundReason("");
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
          const refundCount = (o.refunds ?? []).length;
          const effective = effectiveTotalSatang(o);
          const isFullyRefunded = !isVoided && effective === 0 && refundCount > 0;
          const refundedTotal = (o.refunds ?? []).reduce(
            (s, r) => s + r.amountSatang,
            0,
          );
          return (
            <li
              key={o.id}
              className={`rounded-[var(--radius-lg)] border ${
                isVoided
                  ? "border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)]/30"
                  : refundCount > 0
                    ? "border-[var(--color-warn-soft-fg)]/30 bg-[var(--color-warn-soft-bg)]/30"
                    : "border-line bg-panel"
              } px-4 py-3`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="num text-xs font-bold text-muted">
                      {o.orderNumber}
                    </span>
                    {o.source && o.source !== "booth" && (
                      <Pill tone="accent">{orderSourceLabel(o.source)}</Pill>
                    )}
                    {isVoided && <Pill tone="danger">voided</Pill>}
                    {isFullyRefunded && (
                      <Pill tone="warn">fully refunded</Pill>
                    )}
                    {!isFullyRefunded && refundCount > 0 && (
                      <Pill tone="warn">partial refund</Pill>
                    )}
                    <span className="text-xs text-muted">
                      {formatDateTimeTH(o.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {o.items.length} line
                    {o.items.length === 1 ? "" : "s"} · {o.paymentMethod}
                    {refundCount > 0 && (
                      <>
                        {" · refunded "}
                        <span className="num">{formatTHB(refundedTotal)}</span>
                      </>
                    )}
                  </p>
                  {o.voidReason && (
                    <p className="mt-1 text-xs text-[var(--color-danger-soft-fg)]">
                      Void reason: <strong>{o.voidReason}</strong>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`num text-base font-extrabold ${
                      effective < o.totalSatang
                        ? "text-[var(--color-warn-soft-fg)]"
                        : "text-accent-strong"
                    }`}
                  >
                    {formatTHB(effective)} THB
                    {effective < o.totalSatang && (
                      <span className="ml-1 text-[10px] font-bold text-muted">
                        / {formatTHB(o.totalSatang)}
                      </span>
                    )}
                  </span>
                  {!isVoided && !isFullyRefunded && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startRefund(o)}
                      >
                        Refund
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => startVoid(o)}
                      >
                        Void
                      </Button>
                    </>
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
          Restores inventory for each remaining line and excludes the order
          from dashboard totals. Cannot be undone in demo mode.
        </p>
        <textarea
          value={voidReason}
          onChange={(e) => setVoidReason(e.currentTarget.value)}
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

      <Modal
        open={refunding !== null}
        onClose={() => setRefunding(null)}
        title={`Refund ${refunding?.orderNumber ?? ""}`}
        size="md"
      >
        <p className="text-sm text-text/85">
          Pick which lines to refund and how many of each. Stock is restored
          for the refunded quantities. The order stays in the audit trail; the
          dashboard total adjusts.
        </p>
        <ul className="mt-3 grid gap-2">
          {refunding?.items.map((it, idx) => {
            const remaining = remainingQty(refunding, idx);
            return (
              <li
                key={idx}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,90px)] gap-3 rounded-xl border border-line bg-panel p-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted">{it.sku}</p>
                  <p className="text-sm font-extrabold text-text">
                    {it.productName}
                  </p>
                  <p className="text-xs text-muted">
                    {remaining}/{it.qty} refundable ·{" "}
                    <span className="num">{formatTHB(it.unitPriceSatang)}</span>{" "}
                    each
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={remaining}
                  step={1}
                  value={refundQty[idx] ?? 0}
                  onChange={(e) => {
                    const n = Number(e.currentTarget.value);
                    setRefundQty((m) => ({
                      ...m,
                      [idx]: Number.isFinite(n)
                        ? Math.max(0, Math.min(remaining, Math.floor(n)))
                        : 0,
                    }));
                  }}
                  disabled={remaining === 0}
                  className="num w-full rounded-md border border-line bg-white px-2 py-1.5 text-right text-sm font-extrabold disabled:opacity-50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </li>
            );
          })}
        </ul>
        <textarea
          value={refundReason}
          onChange={(e) => setRefundReason(e.currentTarget.value)}
          placeholder="Reason (required, min 3 chars)"
          rows={2}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRefunding(null)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={confirmRefund}>
            Confirm refund
          </Button>
        </div>
      </Modal>
    </>
  );
}
