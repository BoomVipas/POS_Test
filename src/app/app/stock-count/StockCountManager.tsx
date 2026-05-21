"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoStockCount } from "@/lib/demo/useDemoStockCount";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import {
  STOCK_COUNT_REASONS,
  lineCommittable,
  lineVariance,
  sessionCommittable,
  sessionVarianceSummary,
  type StockCountLine,
  type StockCountReason,
  type StockCountSession,
} from "@/lib/demo/stock-count";
import { formatDateTimeTH } from "@/lib/date";

export function StockCountManager() {
  const catalog = useDemoCatalog();
  const counts = useDemoStockCount();
  const audit = useDemoAudit();
  const { push } = useToast();

  const open = counts.sessions.find((s) => s.status === "open") ?? null;
  const history = useMemo(
    () =>
      [...counts.sessions]
        .filter((s) => s.status !== "open")
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
        .slice(0, 8),
    [counts.sessions],
  );

  function handleOpen() {
    if (!catalog.ready) return;
    const active = catalog.items.filter((p) => p.is_active);
    if (active.length === 0) {
      push({
        kind: "warn",
        title: "No products",
        message: "Add at least one active product before opening a count.",
      });
      return;
    }
    const session = counts.open(catalog.items);
    audit.log({
      action: "stock_count_open",
      targetTable: "stock_counts",
      targetId: session.id,
      summary: `Stock count opened · ${session.lines.length} SKU${session.lines.length === 1 ? "" : "s"}`,
      newValue: { lines: session.lines.length },
    });
    push({
      kind: "info",
      title: "Count session opened",
      message: `${session.lines.length} active SKUs to count.`,
    });
  }

  function handleCommit() {
    if (!open) return;
    const guard = sessionCommittable(open);
    if (!guard.ok) {
      push({
        kind: "warn",
        title: "Cannot commit",
        message: guard.reason ?? "",
      });
      return;
    }
    // Apply each counted line: set product current_qty and write per-line
    // audit. Skip lines that weren't counted (countedQty === null).
    const sum = sessionVarianceSummary(open);
    let applied = 0;
    for (const line of open.lines) {
      if (line.countedQty === null) continue;
      const v = lineVariance(line) ?? 0;
      catalog.update(line.productId, { current_qty: line.countedQty });
      if (v !== 0) {
        audit.log({
          action: "stock_count_commit",
          targetTable: "products",
          targetId: line.productId,
          summary: `${line.sku} · ${line.expectedQty} → ${line.countedQty} (${v > 0 ? "+" : ""}${v}) · ${line.reason ?? "n/a"}`,
          oldValue: { current_qty: line.expectedQty },
          newValue: {
            current_qty: line.countedQty,
            variance: v,
            reason: line.reason,
            note: line.reasonNote ?? null,
          },
        });
      }
      applied++;
    }
    counts.commit(open.id);
    audit.log({
      action: "stock_count_commit",
      targetTable: "stock_counts",
      targetId: open.id,
      summary: `Stock count committed · ${applied} line${applied === 1 ? "" : "s"} · net ${sum.netUnits >= 0 ? "+" : ""}${sum.netUnits}`,
      newValue: {
        appliedLines: applied,
        unitsLost: sum.unitsLost,
        unitsFound: sum.unitsFound,
        netUnits: sum.netUnits,
      },
    });
    push({
      kind: "success",
      title: "Stock count committed",
      message: `${applied} SKU${applied === 1 ? "" : "s"} adjusted. Net ${sum.netUnits >= 0 ? "+" : ""}${sum.netUnits} unit${Math.abs(sum.netUnits) === 1 ? "" : "s"}.`,
    });
  }

  function handleCancel() {
    if (!open) return;
    if (
      !confirm(
        "Discard this count? Any entered counts will be lost; product stock is unchanged.",
      )
    )
      return;
    counts.cancel(open.id);
    audit.log({
      action: "stock_count_cancel",
      targetTable: "stock_counts",
      targetId: open.id,
      summary: "Stock count cancelled (no adjustments applied)",
    });
    push({
      kind: "info",
      title: "Count cancelled",
      message: "No adjustments were applied.",
    });
  }

  if (!catalog.ready || !counts.ready) {
    return (
      <p className="mt-8 rounded-2xl border border-line bg-panel px-4 py-6 text-center text-sm text-muted">
        Loading…
      </p>
    );
  }

  return (
    <>
      {open ? (
        <OpenSessionCard
          session={open}
          onSetCount={(productId, qty) =>
            counts.setLineCount(open.id, productId, qty)
          }
          onSetReason={(productId, reason, note) =>
            counts.setLineReason(open.id, productId, reason, note)
          }
          onSetNotes={(notes) => counts.setNotes(open.id, notes)}
          onCommit={handleCommit}
          onCancel={handleCancel}
        />
      ) : (
        <div className="panel mt-6 p-5 text-center">
          <p className="text-sm text-text/85">
            No open count session. Start one when you finish a multi-day
            event or whenever warehouse stock looks off.
          </p>
          <Button onClick={handleOpen} className="mt-3">
            + Open new count session
          </Button>
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Recent counts
          </p>
          <ul className="mt-2 grid gap-2">
            {history.map((s) => {
              const sum = sessionVarianceSummary(s);
              return (
                <li
                  key={s.id}
                  className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-muted">
                        {formatDateTimeTH(s.openedAt)}
                      </span>
                      {s.status === "committed" && (
                        <span className="ml-2">
                          <Pill tone="ok">committed</Pill>
                        </span>
                      )}
                      {s.status === "cancelled" && (
                        <span className="ml-2">
                          <Pill tone="neutral">cancelled</Pill>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-muted">
                      {sum.countedLines} of {sum.totalLines} counted ·{" "}
                      <span
                        className={
                          sum.netUnits === 0
                            ? "text-muted"
                            : sum.netUnits > 0
                              ? "text-[var(--color-ok-soft-fg)]"
                              : "text-[var(--color-warn-soft-fg)]"
                        }
                      >
                        net {sum.netUnits >= 0 ? "+" : ""}
                        {sum.netUnits}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function OpenSessionCard({
  session,
  onSetCount,
  onSetReason,
  onSetNotes,
  onCommit,
  onCancel,
}: {
  session: StockCountSession;
  onSetCount: (productId: string, qty: number | null) => void;
  onSetReason: (
    productId: string,
    reason: StockCountReason | undefined,
    note?: string,
  ) => void;
  onSetNotes: (notes: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const sum = sessionVarianceSummary(session);
  const guard = sessionCommittable(session);
  return (
    <section className="mt-6">
      <header className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Open count session
            </p>
            <p className="mt-1 text-sm font-extrabold text-accent-strong">
              {sum.countedLines} of {sum.totalLines} SKUs counted
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold text-[var(--color-ok-soft-fg)]">
              +{sum.unitsFound} found
            </span>
            <span className="font-bold text-[var(--color-warn-soft-fg)]">
              −{sum.unitsLost} lost
            </span>
            <span
              className={
                sum.netUnits === 0
                  ? "font-extrabold text-muted"
                  : sum.netUnits > 0
                    ? "font-extrabold text-[var(--color-ok-soft-fg)]"
                    : "font-extrabold text-[var(--color-warn-soft-fg)]"
              }
            >
              net {sum.netUnits >= 0 ? "+" : ""}
              {sum.netUnits}
            </span>
          </div>
        </div>
      </header>

      <ul className="mt-3 grid gap-2">
        {session.lines.map((line) => (
          <CountLineRow
            key={line.productId}
            line={line}
            onSetCount={(qty) => onSetCount(line.productId, qty)}
            onSetReason={(reason, note) =>
              onSetReason(line.productId, reason, note)
            }
          />
        ))}
      </ul>

      <textarea
        value={session.notes ?? ""}
        onChange={(e) => onSetNotes(e.currentTarget.value)}
        placeholder="Session notes (optional) — e.g. 'After Pet Expo Bitec May 2026 load-in'"
        rows={2}
        className="mt-4 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {guard.ok
            ? "Ready to commit. Stock will be set to counted qty and audit log will record per-line variance."
            : guard.reason}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onCommit} disabled={!guard.ok}>
            Commit count
          </Button>
        </div>
      </div>
    </section>
  );
}

function CountLineRow({
  line,
  onSetCount,
  onSetReason,
}: {
  line: StockCountLine;
  onSetCount: (qty: number | null) => void;
  onSetReason: (
    reason: StockCountReason | undefined,
    note?: string,
  ) => void;
}) {
  const v = lineVariance(line);
  const committable = lineCommittable(line);
  const tone =
    v === null
      ? "border-line bg-panel"
      : v === 0
        ? "border-[var(--color-ok-soft-fg)]/40 bg-[var(--color-ok-soft-bg)]/40"
        : "border-[var(--color-warn-soft-fg)]/40 bg-[var(--color-warn-soft-bg)]/40";
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[var(--radius-lg)] border ${tone} px-3 py-2`}
    >
      <div className="min-w-0">
        <p className="num text-[10px] font-bold text-muted">{line.sku}</p>
        <p className="line-clamp-1 text-sm font-extrabold text-text">
          {line.name}
        </p>
        <p className="text-[11px] text-muted">
          expected <span className="num">{line.expectedQty}</span>
          {v !== null && v !== 0 && (
            <>
              {" · variance "}
              <span
                className={
                  v > 0
                    ? "num font-extrabold text-[var(--color-ok-soft-fg)]"
                    : "num font-extrabold text-[var(--color-warn-soft-fg)]"
                }
              >
                {v > 0 ? "+" : ""}
                {v}
              </span>
            </>
          )}
          {v === 0 && (
            <span className="ml-1 font-bold text-[var(--color-ok-soft-fg)]">
              · match
            </span>
          )}
        </p>
        {v !== null && v !== 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {STOCK_COUNT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onSetReason(r, line.reasonNote)}
                className={
                  line.reason === r
                    ? "rounded-full bg-[#2a2557] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                    : "rounded-full bg-panel px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-accent-strong"
                }
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <input
          type="number"
          min={0}
          step={1}
          value={line.countedQty ?? ""}
          onChange={(e) => {
            const v = e.currentTarget.value;
            if (v === "") return onSetCount(null);
            const n = Number(v);
            if (!Number.isFinite(n)) return;
            onSetCount(Math.max(0, Math.floor(n)));
          }}
          placeholder="—"
          aria-label={`Counted qty for ${line.sku}`}
          className="num w-20 rounded-md border border-line bg-white px-2 py-1.5 text-right text-sm font-extrabold focus:border-accent focus:outline-none"
        />
        {v !== null && v !== 0 && !committable && (
          <span className="text-[10px] font-bold text-[var(--color-warn-soft-fg)]">
            pick reason
          </span>
        )}
      </div>
    </li>
  );
}
