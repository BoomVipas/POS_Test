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
import { voidOrder, type CorrectionOrder } from "./actions";

export function CorrectionListLive({
  orders,
  canManage,
}: {
  orders: CorrectionOrder[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [voiding, setVoiding] = useState<CorrectionOrder | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmVoid() {
    const order = voiding;
    if (!order) return;
    if (reason.trim().length < MIN_VOID_REASON) {
      push({
        kind: "warn",
        title: "Reason required",
        message: `At least ${MIN_VOID_REASON} characters.`,
      });
      return;
    }
    startTransition(async () => {
      const res = await voidOrder({ orderId: order.id, reason });
      if (res.ok) {
        push({
          kind: "success",
          title: "Voided",
          message: `${order.orderNumber} voided. Stock restored.`,
        });
        setVoiding(null);
        setReason("");
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't void", message: res.error });
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
            <Link
              href="/app/pos"
              className="btn-accent inline-flex rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold"
            >
              Open POS
            </Link>
          }
        />
      </div>
    );
  }

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
                    <span className="num text-xs font-bold text-muted">
                      {o.orderNumber}
                    </span>
                    {isVoided && <Pill tone="danger">voided</Pill>}
                    {o.status === "corrected" && <Pill tone="warn">corrected</Pill>}
                    <span className="text-xs text-muted">
                      {formatDateTimeTH(o.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {o.lineCount} line{o.lineCount === 1 ? "" : "s"} ·{" "}
                    {o.paymentMethod}
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
                      isVoided
                        ? "text-muted line-through"
                        : "text-accent-strong"
                    }`}
                  >
                    {formatTHB(o.totalSatang)} THB
                  </span>
                  {canManage && !isVoided && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setVoiding(o);
                        setReason("");
                      }}
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

      <p className="mt-4 text-xs text-muted">
        Voiding restores inventory and excludes the order from dashboard totals.
        Partial refunds (per-line) arrive in a later batch — for now, void the
        whole order and re-ring the correct items.
      </p>

      <Modal
        open={voiding !== null}
        onClose={() => (pending ? undefined : setVoiding(null))}
        title={`Void ${voiding?.orderNumber ?? ""}`}
        size="sm"
      >
        <p className="text-sm text-text/85">
          Restores inventory for every line, cancels any open send-later
          fulfillment, and excludes the order from dashboard totals. This is
          recorded in the audit log and cannot be undone.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          placeholder={`Reason (required, min ${MIN_VOID_REASON} chars)`}
          rows={3}
          className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm text-text shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setVoiding(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmVoid} loading={pending}>
            Confirm void
          </Button>
        </div>
      </Modal>
    </>
  );
}
