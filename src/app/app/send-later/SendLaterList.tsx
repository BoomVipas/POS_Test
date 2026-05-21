"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import type { SendLaterStatus } from "@/lib/database.types";

const STATUSES: SendLaterStatus[] = [
  "pending",
  "packed",
  "shipped",
  "completed",
  "cancelled",
];

const NEXT: Partial<Record<SendLaterStatus, SendLaterStatus>> = {
  pending: "packed",
  packed: "shipped",
  shipped: "completed",
};

const TONE: Record<SendLaterStatus, PillTone> = {
  pending: "warn",
  packed: "neutral",
  shipped: "accent",
  completed: "ok",
  cancelled: "danger",
};

export function SendLaterList() {
  const { orders, ready, update } = useDemoSales();
  const { push } = useToast();
  const [filter, setFilter] = useState<SendLaterStatus | "all">("pending");
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>(
    {},
  );
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  if (!ready) {
    return (
      <p className="rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-muted">
        Loading…
      </p>
    );
  }

  const sendLaterOrders = orders.filter(
    (o) => o.orderType === "send_later" || o.orderType === "mixed",
  );

  const visible =
    filter === "all"
      ? sendLaterOrders
      : sendLaterOrders.filter((o) => (o.sendLaterStatus ?? "pending") === filter);

  function advance(orderId: string, currentStatus: SendLaterStatus) {
    const next = NEXT[currentStatus];
    if (!next) return;
    const patch: { sendLaterStatus: SendLaterStatus; trackingNumber?: string } = {
      sendLaterStatus: next,
    };
    if (next === "shipped") {
      const t = trackingDraft[orderId]?.trim();
      if (t) patch.trackingNumber = t;
    }
    update(orderId, patch);
    push({
      kind: "success",
      title: `Marked ${next}`,
      message: `Order updated.`,
    });
  }

  function cancel(orderId: string) {
    setPendingCancelId(orderId);
  }

  function confirmCancel() {
    const orderId = pendingCancelId;
    if (!orderId) return;
    update(orderId, { sendLaterStatus: "cancelled" });
    push({ kind: "info", title: "Cancelled", message: "Order marked cancelled." });
    setPendingCancelId(null);
  }

  if (sendLaterOrders.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <p className="font-display text-xl text-accent-strong">
          No send-later orders yet.
        </p>
        <p className="mt-2 text-sm text-muted">
          Toggle a cart line to &ldquo;Send later&rdquo; in /app/pos and complete
          a sale; it will appear here.
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

  const pendingCancelOrder =
    pendingCancelId !== null
      ? (orders.find((o) => o.id === pendingCancelId) ?? null)
      : null;

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`all (${sendLaterOrders.length})`}
        />
        {STATUSES.map((s) => {
          const count = sendLaterOrders.filter(
            (o) => (o.sendLaterStatus ?? "pending") === s,
          ).length;
          return (
            <FilterChip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={`${s} (${count})`}
            />
          );
        })}
      </div>

      <ul className="mt-5 grid gap-3">
        {visible.map((o) => {
          const status = o.sendLaterStatus ?? "pending";
          const next = NEXT[status];
          const sendLaterItems = o.items.filter(
            (it) => it.fulfillmentType === "send_later",
          );
          return (
            <li
              key={o.id}
              className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="num text-xs font-bold text-muted">
                    {o.orderNumber}
                  </p>
                  <p className="font-extrabold text-text">
                    {o.customerName || "—"}
                    {o.customerPhone && (
                      <span className="ml-2 text-xs text-muted">
                        {o.customerPhone}
                      </span>
                    )}
                  </p>
                  {o.shippingAddress && (
                    <p className="mt-1 text-xs text-muted">
                      {o.shippingAddress}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={TONE[status]}>{status}</Pill>
                  <p className="text-[11px] text-muted">
                    {formatDateTimeTH(o.createdAt)}
                  </p>
                </div>
              </div>

              <ul className="mt-3 grid gap-1 text-sm">
                {sendLaterItems.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2">
                    <span>
                      <span className="num text-[10px] text-muted">
                        {it.sku}
                      </span>{" "}
                      {it.productName}{" "}
                      <span className="text-xs text-muted">×{it.qty}</span>
                    </span>
                    <span className="num text-xs font-bold text-accent-strong">
                      {formatTHB(it.lineTotalSatang)}
                    </span>
                  </li>
                ))}
              </ul>

              {o.trackingNumber && (
                <p className="num mt-2 text-xs text-muted">
                  Tracking: <strong>{o.trackingNumber}</strong>
                </p>
              )}

              {status !== "completed" && status !== "cancelled" && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {next === "shipped" && (
                    <input
                      type="text"
                      placeholder="tracking #"
                      value={trackingDraft[o.id] ?? ""}
                      onChange={(e) =>
                        setTrackingDraft((s) => ({
                          ...s,
                          [o.id]: e.currentTarget.value,
                        }))
                      }
                      className="rounded-[var(--radius-md)] border border-line bg-white px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                  )}
                  {next && (
                    <Button size="sm" onClick={() => advance(o.id, status)}>
                      Mark {next}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => cancel(o.id)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="text-sm text-muted">
            No orders with status &ldquo;{filter}&rdquo;.
          </li>
        )}
      </ul>

      <ConfirmDialog
        open={pendingCancelId !== null}
        destructive
        title={
          pendingCancelOrder
            ? `Cancel fulfillment ${pendingCancelOrder.orderNumber}?`
            : "Cancel fulfillment?"
        }
        body="The order is marked cancelled. In demo mode this does NOT refund the customer or restock inventory."
        confirmLabel="Cancel fulfillment"
        cancelLabel="Keep it"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancelId(null)}
      />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
          : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
      }
    >
      {label}
    </button>
  );
}
