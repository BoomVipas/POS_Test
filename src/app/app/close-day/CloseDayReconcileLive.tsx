"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatTHB, bahtToSatang } from "@/lib/money/format";
import { computeDiscrepancy } from "@/lib/close-day/reconcile";
import type { CloseDayReconciliation } from "./actions";

export function CloseDayReconcileLive({
  initial,
}: {
  initial: CloseDayReconciliation;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [counted, setCounted] = useState("");

  const expected = initial.expectedCashSatang;
  const countedSatang =
    counted.trim() === "" ? 0 : bahtToSatang(Number(counted));
  const discrepancy = computeDiscrepancy(countedSatang, expected);
  const hasCounted = counted.trim() !== "" && Number.isFinite(Number(counted));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Today" value={initial.isoDate} subtle />
        <Tile label="Expected cash" value={`${formatTHB(expected)} THB`} accent />
        <Tile
          label="Orders today"
          value={String(initial.ordersToday)}
          subtle
        />
      </div>

      <div className="panel mt-6 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg text-accent-strong">Counted cash</h2>
          <Button
            size="sm"
            variant="ghost"
            loading={pending}
            onClick={() => startTransition(() => router.refresh())}
          >
            Recalculate
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Type the THB amount actually in the drawer.{" "}
          <span className="num">{initial.cashPaymentCount}</span> cash payment
          {initial.cashPaymentCount === 1 ? "" : "s"} counted today (voided
          orders excluded).
        </p>
        <input
          type="number"
          min={0}
          step={1}
          value={counted}
          onChange={(e) => setCounted(e.currentTarget.value)}
          placeholder={`${formatTHB(expected)} THB`}
          className="num mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-4 py-3 text-right text-2xl font-black text-accent-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />

        {hasCounted && (
          <div
            className={`mt-3 flex items-baseline justify-between rounded-xl px-4 py-3 ${
              discrepancy === 0
                ? "bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)]"
                : "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn-soft-fg)]"
            }`}
          >
            <span className="text-sm font-extrabold uppercase tracking-wider">
              Discrepancy
            </span>
            <span className="num text-xl font-black">
              {discrepancy === 0
                ? "0 THB · drawer matches"
                : `${discrepancy > 0 ? "+" : "−"}${formatTHB(Math.abs(discrepancy))} THB · ${discrepancy > 0 ? "surplus" : "short"}`}
            </span>
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          Live reconciliation against today&apos;s recorded cash sales. Saving the
          close-day record (history + audit) arrives in DD-92.
        </p>
      </div>
    </>
  );
}

function Tile({
  label,
  value,
  accent,
  subtle,
}: {
  label: string;
  value: string;
  accent?: boolean;
  subtle?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-line ${subtle ? "bg-panel/70" : "bg-panel-strong"} px-4 py-3`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`num mt-1 ${accent ? "text-3xl font-black text-accent-strong" : "text-2xl font-extrabold text-text"}`}
      >
        {value}
      </p>
    </div>
  );
}
