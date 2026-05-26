"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/States";
import { Package } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import {
  SEND_LATER_STATUSES,
  nextStatus,
} from "@/lib/send-later/transitions";
import type { SendLaterStatus } from "@/lib/database.types";
import { setSendLaterStatus, type SendLaterEntry } from "./actions";

const TONE: Record<SendLaterStatus, PillTone> = {
  pending: "warn",
  packed: "neutral",
  shipped: "accent",
  completed: "ok",
  cancelled: "danger",
};

export function SendLaterQueueLive({
  initial,
  canManage,
}: {
  initial: SendLaterEntry[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [filter, setFilter] = useState<SendLaterStatus | "all">("pending");
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<SendLaterEntry | null>(null);
  const [pending, startTransition] = useTransition();

  function run(
    entry: SendLaterEntry,
    to: SendLaterStatus,
    trackingNumber: string | undefined,
    successTitle: string,
  ) {
    setBusyId(entry.id);
    startTransition(async () => {
      const res = await setSendLaterStatus({ id: entry.id, to, trackingNumber });
      if (res.ok) {
        push({ kind: "success", title: successTitle, message: entry.orderNumber });
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't update", message: res.error });
      }
      setBusyId(null);
    });
  }

  function advance(entry: SendLaterEntry) {
    const next = nextStatus(entry.status);
    if (!next) return;
    const tracking =
      next === "shipped" ? trackingDraft[entry.id]?.trim() || undefined : undefined;
    run(entry, next, tracking, `Marked ${next}`);
  }

  function confirmCancel() {
    const entry = pendingCancel;
    if (!entry) return;
    setPendingCancel(null);
    run(entry, "cancelled", undefined, "Cancelled");
  }

  if (initial.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<Package className="h-6 w-6 text-[var(--lavender-700)]" />}
          title="No send-later orders yet."
          body="Toggle a cart line to “Send later” in the POS and complete a sale; it will appear here."
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

  const visible =
    filter === "all" ? initial : initial.filter((o) => o.status === filter);

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`all (${initial.length})`}
        />
        {SEND_LATER_STATUSES.map((s) => {
          const count = initial.filter((o) => o.status === s).length;
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
          const next = nextStatus(o.status);
          const busy = busyId === o.id && pending;
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
                    <p className="mt-1 text-xs text-muted">{o.shippingAddress}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={TONE[o.status]}>{o.status}</Pill>
                  <p className="text-[11px] text-muted">
                    {formatDateTimeTH(o.createdAt)}
                  </p>
                </div>
              </div>

              <ul className="mt-3 grid gap-1 text-sm">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2">
                    <span>
                      <span className="num text-[10px] text-muted">{it.sku}</span>{" "}
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

              {canManage && o.status !== "completed" && o.status !== "cancelled" && (
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
                    <Button size="sm" onClick={() => advance(o)} loading={busy}>
                      Mark {next}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setPendingCancel(o)}
                    disabled={busy}
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
        open={pendingCancel !== null}
        destructive
        title={
          pendingCancel
            ? `Cancel fulfillment ${pendingCancel.orderNumber}?`
            : "Cancel fulfillment?"
        }
        body="The order is marked cancelled. This does NOT refund the customer or restock inventory — handle those separately (refund/restock flow)."
        confirmLabel="Cancel fulfillment"
        cancelLabel="Keep it"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
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
