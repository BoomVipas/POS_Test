"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { makeSample, returnSample } from "./actions";

export type SampleRow = {
  productId: string;
  sku: string;
  name: string;
  currentQty: number;
  sampleQty: number;
};

export function SampleBucketManagerLive({
  eventId,
  rows,
  canManage,
}: {
  eventId: string;
  rows: SampleRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function move(
    kind: "make" | "return",
    row: SampleRow,
  ) {
    setBusyId(row.productId);
    startTransition(async () => {
      const fn = kind === "make" ? makeSample : returnSample;
      const available = kind === "make" ? row.currentQty : row.sampleQty;
      const res = await fn({
        eventId,
        productId: row.productId,
        qty: 1,
        available,
      });
      if (res.ok) {
        push({
          kind: "info",
          message:
            kind === "make"
              ? `+1 sample · ${row.name}`
              : `-1 sample · returned to event stock · ${row.name}`,
        });
        router.refresh();
      } else {
        push({ kind: "warn", message: res.error });
      }
      setBusyId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-sm text-muted">
          No products allocated to this event yet. Allocate stock in{" "}
          <a
            href="/app/events"
            className="font-bold text-accent-strong underline-offset-2 hover:underline"
          >
            Events
          </a>{" "}
          first.
        </p>
      </div>
    );
  }

  const totalSampleQty = rows.reduce((sum, r) => sum + r.sampleQty, 0);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Total samples on display
        </p>
        <p className="num mt-1 font-display text-3xl text-accent-strong">
          {totalSampleQty}
        </p>
      </div>

      <div className="panel overflow-hidden p-0">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-soft text-left text-[11px] font-extrabold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 w-[12%]">SKU</th>
              <th className="px-4 py-3 w-[40%]">Product</th>
              <th className="px-4 py-3 w-[12%]">Event stock</th>
              <th className="px-4 py-3 w-[12%]">Sample</th>
              <th className="px-4 py-3 w-[24%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const busy = busyId === r.productId && pending;
              const canMake = canManage && !busy && r.currentQty > 0;
              const canReturn = canManage && !busy && r.sampleQty > 0;
              return (
                <tr key={r.productId} className="border-t border-line/60">
                  <td className="px-4 py-3 font-bold text-muted">{r.sku}</td>
                  <td className="px-4 py-3 font-extrabold text-text">{r.name}</td>
                  <td className="num px-4 py-3 text-muted">{r.currentQty}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.sampleQty > 0
                          ? "num inline-flex min-w-[2ch] justify-center rounded-full bg-[var(--color-warn-soft-bg)] px-2 py-0.5 font-extrabold text-[var(--color-warn-soft-fg)]"
                          : "num text-muted"
                      }
                    >
                      {r.sampleQty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={!canMake}
                          onClick={() => move("make", r)}
                          className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft disabled:opacity-40"
                        >
                          +1 Make
                        </button>
                        <button
                          type="button"
                          disabled={!canReturn}
                          onClick={() => move("return", r)}
                          className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft disabled:opacity-40"
                        >
                          -1 Return
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Moving stock to <strong>sample</strong> reduces sellable event stock; it
        stays on display through the event. <strong>Return</strong> moves it back
        to sellable when staff want to sell a sample as a normal product. Each
        move is recorded in the audit log.
      </p>
    </section>
  );
}
