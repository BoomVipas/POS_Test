"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { ReceiptText } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import { MIN_VOID_REASON } from "@/lib/orders/void";
import {
  voidOrder,
  getOrderRefundLines,
  refundOrderItems,
  type CorrectionOrder,
  type RefundLine,
} from "./actions";

export function CorrectionListLive({
  orders,
  canManage,
}: {
  orders: CorrectionOrder[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  // Void state
  const [voiding, setVoiding] = useState<CorrectionOrder | null>(null);
  const [reason, setReason] = useState("");

  // Refund state
  const [refunding, setRefunding] = useState<CorrectionOrder | null>(null);
  const [refundLines, setRefundLines] = useState<RefundLine[] | null>(null);
  const [refundQty, setRefundQty] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState("");

  function confirmVoid() {
    const order = voiding;
    if (!order) return;
    if (reason.trim().length < MIN_VOID_REASON) {
      push({ kind: "warn", title: "Reason required", message: `At least ${MIN_VOID_REASON} characters.` });
      return;
    }
    startTransition(async () => {
      const res = await voidOrder({ orderId: order.id, reason });
      if (res.ok) {
        push({ kind: "success", title: "Voided", message: `${order.orderNumber} voided. Stock restored.` });
        setVoiding(null);
        setReason("");
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't void", message: res.error });
      }
    });
  }

  function openRefund(order: CorrectionOrder) {
    setRefunding(order);
    setRefundLines(null);
    setRefundQty({});
    setRefundReason("");
    startTransition(async () => {
      setRefundLines(await getOrderRefundLines(order.id));
    });
  }

  function confirmRefund() {
    const order = refunding;
    if (!order || !refundLines) return;
    if (refundReason.trim().length < MIN_VOID_REASON) {
      push({ kind: "warn", title: "Reason required", message: `At least ${MIN_VOID_REASON} characters.` });
      return;
    }
    const lines = Object.entries(refundQty)
      .map(([orderItemId, qty]) => ({ orderItemId, qty }))
      .filter((l) => l.qty > 0);
    if (lines.length === 0) {
      push({ kind: "warn", title: "Nothing selected", message: "Pick a line and a quantity to refund." });
      return;
    }
    startTransition(async () => {
      const res = await refundOrderItems({ orderId: order.id, lines, reason: refundReason });
      if (res.ok) {
        push({
          kind: "success",
          title: "Refunded",
          message: `฿${formatTHB(res.refundedAmountSatang)} · ${res.refundedQty} item${res.refundedQty === 1 ? "" : "s"}. Stock restored.`,
        });
        setRefunding(null);
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't refund", message: res.error });
      }
    });
  }

  if (orders.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<ReceiptText className="h-6 w-6 text-[var(--lavender-700)]" />}
          title="No sales yet."
          body="Confirm a sale in the POS and it will appear here for correction."
          action={
            <Link href="/app/pos" className="btn-accent inline-flex rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold">
              Open POS
            </Link>
          }
        />
      </div>
    );
  }

  const refundTotal = refundLines
    ? refundLines.reduce((s, l) => s + (refundQty[l.orderItemId] ?? 0) * l.unitPriceSatang, 0)
    : 0;

  return (
    <>
      <ul className="mt-6 grid gap-2">
        {orders.map((o) => {
          const isVoided = o.status === "voided";
          return (
            <li
              key={o.id}
              className={`rounded-[var(--radius-lg)] border px-4 py-3 ${
                isVoided
                  ? "border-[var(--color-danger-soft-fg)]/30 bg-[var(--color-danger-soft-bg)]/30"
                  : "border-line bg-panel"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="num text-xs font-bold text-muted">{o.orderNumber}</span>
                    {isVoided && <Pill tone="danger">voided</Pill>}
                    {o.status === "corrected" && <Pill tone="warn">corrected</Pill>}
                    <span className="text-xs text-muted">{formatDateTimeTH(o.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {o.lineCount} line{o.lineCount === 1 ? "" : "s"} · {o.paymentMethod}
                  </p>
                  {o.voidReason && (
                    <p className="mt-1 text-xs text-[var(--color-danger-soft-fg)]">
                      Void reason: <strong>{o.voidReason}</strong>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`num text-base font-extrabold ${isVoided ? "text-muted line-through" : "text-accent-strong"}`}>
                    {formatTHB(o.totalSatang)} THB
                  </span>
                  {canManage && !isVoided && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => openRefund(o)}>
                        Refund
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => { setVoiding(o); setReason(""); }}>
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

      <p className="mt-4 text-xs text-muted">
        <strong>Refund</strong> returns specific items (restores their stock);{" "}
        <strong>Void</strong> reverses the whole order. Both are recorded in the
        audit log.
      </p>

      {/* Void modal */}
      <Modal
        open={voiding !== null}
        onClose={() => (pending ? undefined : setVoiding(null))}
        title={`Void ${voiding?.orderNumber ?? ""}`}
        size="sm"
      >
        <p className="text-sm text-text/85">
          Restores inventory for every line, cancels any open send-later
          fulfillment, and excludes the order from dashboard totals. Recorded in
          the audit log; cannot be undone.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          placeholder={`Reason (required, min ${MIN_VOID_REASON} chars)`}
          rows={3}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setVoiding(null)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmVoid} loading={pending}>
            Confirm void
          </Button>
        </div>
      </Modal>

      {/* Refund modal */}
      <Modal
        open={refunding !== null}
        onClose={() => (pending ? undefined : setRefunding(null))}
        title={`Refund ${refunding?.orderNumber ?? ""}`}
        size="md"
      >
        <p className="text-sm text-text/85">
          Pick which items to refund and how many. Stock is restored for the
          refunded quantities; the order stays in the audit trail.
        </p>

        {refundLines === null ? (
          <p className="mt-4 text-sm text-muted">Loading items…</p>
        ) : refundLines.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No line items found for this order.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {refundLines.map((l) => (
              <li
                key={l.orderItemId}
                className="grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 rounded-xl border border-line bg-panel p-3"
              >
                <div className="min-w-0">
                  <p className="num text-[10px] font-bold text-muted">{l.sku}</p>
                  <p className="truncate text-sm font-extrabold text-text">{l.name}</p>
                  <p className="text-xs text-muted">
                    {l.remaining}/{l.qty} refundable ·{" "}
                    <span className="num">{formatTHB(l.unitPriceSatang)}</span> each
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={l.remaining}
                  step={1}
                  value={refundQty[l.orderItemId] ?? 0}
                  disabled={l.remaining === 0}
                  onChange={(e) => {
                    const n = Number(e.currentTarget.value);
                    setRefundQty((m) => ({
                      ...m,
                      [l.orderItemId]: Number.isFinite(n)
                        ? Math.max(0, Math.min(l.remaining, Math.floor(n)))
                        : 0,
                    }));
                  }}
                  className="num w-full rounded-md border border-line bg-white px-2 py-1.5 text-right text-sm font-extrabold disabled:opacity-50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </li>
            ))}
          </ul>
        )}

        <textarea
          value={refundReason}
          onChange={(e) => setRefundReason(e.currentTarget.value)}
          placeholder={`Reason (required, min ${MIN_VOID_REASON} chars)`}
          rows={2}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="num text-sm font-extrabold text-accent-strong">
            Refund ฿{formatTHB(refundTotal)}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setRefunding(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={confirmRefund} loading={pending}>
              Confirm refund
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
