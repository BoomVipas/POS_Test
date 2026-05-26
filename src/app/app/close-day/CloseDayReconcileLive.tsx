"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatTHB, bahtToSatang } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import { computeDiscrepancy } from "@/lib/close-day/reconcile";
import {
  closeDay,
  type CloseDayReconciliation,
  type CloseDayRecord,
} from "./actions";

const MIN_REASON = 3;

export function CloseDayReconcileLive({
  initial,
  history,
}: {
  initial: CloseDayReconciliation;
  history: CloseDayRecord[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [counted, setCounted] = useState("");
  const [reason, setReason] = useState("");

  const expected = initial.expectedCashSatang;
  const countedSatang =
    counted.trim() === "" ? 0 : bahtToSatang(Number(counted));
  const discrepancy = computeDiscrepancy(countedSatang, expected);
  const hasCounted = counted.trim() !== "" && Number.isFinite(Number(counted));

  function handleClose() {
    if (!hasCounted) {
      push({
        kind: "warn",
        title: "Counted amount required",
        message: "Type the amount you actually counted.",
      });
      return;
    }
    if (discrepancy !== 0 && reason.trim().length < MIN_REASON) {
      push({
        kind: "warn",
        title: "Reason required",
        message: `Discrepancies need at least ${MIN_REASON} characters of explanation.`,
      });
      return;
    }
    startTransition(async () => {
      const res = await closeDay({
        isoDate: initial.isoDate,
        countedCashSatang: countedSatang,
        reason: reason.trim() || undefined,
      });
      if (res.ok) {
        const d = res.record.discrepancySatang;
        push({
          kind: d === 0 ? "success" : "warn",
          title:
            d === 0
              ? "Day closed — drawer matches"
              : `Day closed — ${d > 0 ? "surplus" : "short"} ${formatTHB(Math.abs(d))} THB`,
          message: `Recorded against ${initial.isoDate}.`,
        });
        setCounted("");
        setReason("");
        router.refresh();
      } else {
        // Recomputed discrepancy needs a reason → resync expected so the
        // discrepancy + reason field appear, then the cashier retries.
        if (res.needsReason) router.refresh();
        push({ kind: "error", title: "Couldn't close the day", message: res.error });
      }
    });
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Today" value={initial.isoDate} subtle />
        <Tile label="Expected cash" value={`${formatTHB(expected)} THB`} accent />
        <Tile label="Orders today" value={String(initial.ordersToday)} subtle />
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

        {hasCounted && discrepancy !== 0 && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            placeholder="Reason (e.g. wrong change given; cash in apron pocket)"
            rows={2}
            className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        )}

        <Button onClick={handleClose} className="mt-4" loading={pending} disabled={!hasCounted}>
          Close day
        </Button>
        <p className="mt-2 text-xs text-muted">
          Recorded against today&apos;s real cash sales, with an audit entry.
          Re-counts are allowed (each is saved).
        </p>
      </div>

      {history.length > 0 && (
        <div className="panel mt-6 p-5">
          <h2 className="font-display text-lg text-accent-strong">History</h2>
          <ul className="mt-3 grid gap-2">
            {history.map((r) => (
              <li
                key={r.id}
                className="grid gap-0.5 rounded-xl border border-line bg-panel px-4 py-2 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="num font-bold text-accent-strong">
                    {r.isoDate}
                  </span>
                  <span className="text-muted">{formatDateTimeTH(r.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-text">
                  <span>
                    expected{" "}
                    <span className="num font-bold">
                      {formatTHB(r.expectedCashSatang)}
                    </span>
                  </span>
                  <span>
                    counted{" "}
                    <span className="num font-bold">
                      {formatTHB(r.countedCashSatang)}
                    </span>
                  </span>
                  <span
                    className={
                      r.discrepancySatang === 0
                        ? "font-bold text-[var(--color-ok-soft-fg)]"
                        : "font-bold text-[var(--color-warn-soft-fg)]"
                    }
                  >
                    {r.discrepancySatang >= 0 ? "+" : "−"}
                    <span className="num">
                      {formatTHB(Math.abs(r.discrepancySatang))}
                    </span>
                  </span>
                </div>
                {r.reason && <p className="text-muted italic">“{r.reason}”</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
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
