"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoPreOrders } from "@/lib/demo/useDemoPreOrders";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ListSkeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/provider";
import { formatDateTimeTH } from "@/lib/date";
import {
  countByStatus,
  filterByStatus,
  type PreOrderStatus,
} from "@/lib/demo/pre-orders";

const STATUSES: Array<PreOrderStatus | "all"> = [
  "all",
  "pending",
  "notified",
  "fulfilled",
  "cancelled",
];

const TONE: Record<PreOrderStatus, PillTone> = {
  pending: "warn",
  notified: "accent",
  fulfilled: "ok",
  cancelled: "danger",
};

export function PreOrderList() {
  const { items, ready, setStatus } = useDemoPreOrders();
  const { t } = useT();
  const { push } = useToast();
  const [filter, setFilter] = useState<PreOrderStatus | "all">("pending");
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  if (!ready) {
    return (
      <ListSkeleton className="mt-5" />
    );
  }

  const counts = countByStatus(items);
  const visible = filterByStatus(items, filter);

  if (items.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-[var(--lavender-100)] text-2xl" aria-hidden>
          ⏳
        </span>
        <p className="font-display text-xl text-accent-strong">
          No pre-orders yet.
        </p>
        <p className="mt-2 text-sm text-muted">
          When a sold-out product gets tapped at the booth, you can capture
          the customer&rsquo;s info. They appear here for follow-up.
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

  function statusLabel(s: PreOrderStatus): string {
    if (s === "pending") return t.preOrders.statusPending;
    if (s === "notified") return t.preOrders.statusNotified;
    if (s === "fulfilled") return t.preOrders.statusFulfilled;
    return t.preOrders.statusCancelled;
  }

  function confirmCancel() {
    const id = pendingCancelId;
    if (!id) return;
    const po = items.find((p) => p.id === id);
    setStatus(id, "cancelled");
    if (po) {
      push({
        kind: "info",
        title: t.preOrders.statusCancelled,
        message: po.customerName,
      });
    }
    setPendingCancelId(null);
  }

  const pendingCancel =
    pendingCancelId !== null
      ? (items.find((p) => p.id === pendingCancelId) ?? null)
      : null;

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={
              s === filter
                ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
            }
          >
            {s === "all" ? `${t.common.all} (${counts.all})` : `${statusLabel(s)} (${counts[s]})`}
          </button>
        ))}
      </div>

      <ul className="mt-5 grid gap-3">
        {visible.map((p) => (
          <li
            key={p.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <Pill tone={TONE[p.status]}>{statusLabel(p.status)}</Pill>
                  <span className="num text-xs font-bold text-muted">
                    {p.sku}
                  </span>
                  <span className="font-extrabold text-text">
                    {p.productName}
                  </span>
                  <span className="text-xs text-muted">×{p.qty}</span>
                </div>
                <p className="mt-1 text-sm text-text/85">
                  {p.customerName} · {p.customerPhone}
                  {p.customerEmail && ` · ${p.customerEmail}`}
                </p>
                {p.note && (
                  <p className="mt-1 text-xs italic text-muted">
                    “{p.note}”
                  </p>
                )}
              </div>
              <p className="text-[11px] text-muted">
                {formatDateTimeTH(p.createdAt)}
              </p>
            </div>

            {p.status !== "fulfilled" && p.status !== "cancelled" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setStatus(p.id, "notified");
                      push({
                        kind: "success",
                        title: t.preOrders.statusNotified,
                        message: `${p.customerName}`,
                      });
                    }}
                  >
                    {t.preOrders.markNotified}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setStatus(p.id, "fulfilled");
                    push({
                      kind: "success",
                      title: t.preOrders.statusFulfilled,
                      message: `${p.sku} → ${p.customerName}`,
                    });
                  }}
                >
                  {t.preOrders.markFulfilled}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setPendingCancelId(p.id)}
                >
                  {t.preOrders.markCancelled}
                </Button>
              </div>
            )}
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-sm text-muted">
            No pre-orders with status &ldquo;{filter}&rdquo;.
          </li>
        )}
      </ul>

      <ConfirmDialog
        open={pendingCancelId !== null}
        destructive
        title={
          pendingCancel
            ? `Cancel pre-order for ${pendingCancel.customerName}?`
            : "Cancel pre-order?"
        }
        body="The pre-order is marked cancelled. The customer won't be notified automatically."
        confirmLabel="Cancel pre-order"
        cancelLabel="Keep it"
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancelId(null)}
      />
    </>
  );
}
