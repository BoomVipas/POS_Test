"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCloseDay } from "@/lib/demo/useDemoCloseDay";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import { useT } from "@/lib/i18n/provider";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/States";
import { isoDateInTZ } from "@/lib/date";
import { formatTHB, bahtToSatang } from "@/lib/money/format";
import {
  computeExpectedCashFor,
  newCloseDayId,
  type DemoCloseDayRecord,
} from "@/lib/demo/close-day";
import { formatDateTimeTH } from "@/lib/date";

export function CloseDayWorkspace() {
  const { orders, ready: salesReady } = useDemoSales();
  const closeDay = useDemoCloseDay();
  const audit = useDemoAudit();
  const { push } = useToast();
  const { t } = useT();

  const today = isoDateInTZ(new Date());
  const expected = useMemo(
    () => computeExpectedCashFor(orders, today),
    [orders, today],
  );

  const [counted, setCounted] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  if (!salesReady) {
    return (
      <ListSkeleton rows={3} />
    );
  }

  const countedSatang =
    counted.trim() === "" ? 0 : bahtToSatang(Number(counted));
  const discrepancy = countedSatang - expected;
  const closedToday = closeDay.records.filter((r) => r.isoDate === today);
  const lastClose = closedToday[0];

  function handleClose() {
    if (counted.trim() === "") {
      push({
        kind: "warn",
        title: "Counted amount required",
        message: "Type the amount you actually counted.",
      });
      return;
    }
    if (discrepancy !== 0 && reason.trim().length < 3) {
      push({
        kind: "warn",
        title: "Reason required",
        message: "Discrepancies need at least 3 characters of explanation.",
      });
      return;
    }
    const record: DemoCloseDayRecord = {
      id: newCloseDayId(),
      isoDate: today,
      expectedSatang: expected,
      countedSatang,
      discrepancySatang: discrepancy,
      reason: reason.trim(),
      closedAt: new Date().toISOString(),
    };
    closeDay.append(record);
    audit.log({
      action: "demo_seed",
      targetTable: "close_day",
      targetId: record.id,
      summary: `Closed ${today} · expected ${formatTHB(expected)} · counted ${formatTHB(countedSatang)} · discrepancy ${discrepancy >= 0 ? "+" : ""}${formatTHB(discrepancy)}`,
      newValue: record,
    });
    push({
      kind: discrepancy === 0 ? "success" : "warn",
      title:
        discrepancy === 0
          ? "Day closed — drawer matches"
          : `Day closed — ${discrepancy > 0 ? "surplus" : "short"} ${formatTHB(Math.abs(discrepancy))} THB`,
      message: `Recorded against ${today}.`,
    });
    setCounted("");
    setReason("");
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          label="Today"
          value={today}
          subtle
        />
        <Tile
          label="Expected cash"
          value={`${formatTHB(expected)} THB`}
          accent
        />
        <Tile
          label="Closes today"
          value={String(closedToday.length)}
          subtle
        />
      </div>

      <div className="panel mt-6 p-5">
        <h2 className="font-display text-lg text-accent-strong">
          Counted cash
        </h2>
        <p className="mt-1 text-xs text-muted">
          Type the THB amount actually in the drawer.
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

        {counted.trim() !== "" && (
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
                ? `0 THB · drawer matches`
                : `${discrepancy > 0 ? "+" : "−"}${formatTHB(Math.abs(discrepancy))} THB · ${discrepancy > 0 ? "surplus" : "short"}`}
            </span>
          </div>
        )}

        {counted.trim() !== "" && discrepancy !== 0 && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            placeholder="Reason (e.g. wrong change given to one customer; cash in apron pocket)"
            rows={3}
            className="mt-3 w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        )}

        <Button
          onClick={handleClose}
          className="mt-4"
          disabled={counted.trim() === ""}
        >
          Close day
        </Button>

        {lastClose && (
          <p className="mt-3 text-xs text-muted">
            Last close today: {formatDateTimeTH(lastClose.closedAt)} ·{" "}
            counted{" "}
            <span className="num">{formatTHB(lastClose.countedSatang)}</span>{" "}
            · discrepancy{" "}
            <span className="num">
              {lastClose.discrepancySatang >= 0 ? "+" : "−"}
              {formatTHB(Math.abs(lastClose.discrepancySatang))}
            </span>
          </p>
        )}
      </div>

      {closeDay.records.length > 0 && (
        <div className="panel mt-6 p-5">
          <h2 className="font-display text-lg text-accent-strong">History</h2>
          <ul className="mt-3 grid gap-2">
            {closeDay.records.slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="grid gap-0.5 rounded-xl border border-line bg-panel px-4 py-2 text-xs"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="num font-bold text-accent-strong">
                    {r.isoDate}
                  </span>
                  <span className="text-muted">
                    {formatDateTimeTH(r.closedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-text">
                  <span>
                    expected{" "}
                    <span className="num font-bold">
                      {formatTHB(r.expectedSatang)}
                    </span>
                  </span>
                  <span>
                    counted{" "}
                    <span className="num font-bold">
                      {formatTHB(r.countedSatang)}
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
                {r.reason && (
                  <p className="text-muted italic">“{r.reason}”</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/app"
        className="mt-6 inline-block text-sm font-bold text-accent-strong"
      >
        ← {t.chrome.appHome}
      </Link>
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
