"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ListSkeleton } from "@/components/ui/States";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCustomers } from "@/lib/demo/useDemoCustomers";
import { useDemoCustomerNotes } from "@/lib/demo/useDemoCustomerNotes";
import { useDemoPets } from "@/lib/demo/useDemoPets";
import { petSummary, speciesEmoji } from "@/lib/demo/pets";
import {
  daysBetween,
  firstSeenAt,
  lifecycleLabel,
  lifecycleStageFor,
  netRevenueForCustomer,
  topProductForCustomer,
  type LifecycleStage,
} from "@/lib/demo/customer-lifecycle";
import { phoneKey } from "@/lib/demo/customers";
import { formatTHB } from "@/lib/money/format";
import { formatDateTH } from "@/lib/date";

const STAGE_TONE: Record<LifecycleStage, PillTone> = {
  new: "accent",
  returning: "ok",
  vip: "warn",
  dormant: "neutral",
};

const ALL_STAGES: Array<LifecycleStage | "all"> = [
  "all",
  "new",
  "returning",
  "vip",
  "dormant",
];

export function CustomersList() {
  const customers = useDemoCustomers();
  const { orders, ready } = useDemoSales();
  const notes = useDemoCustomerNotes();
  const pets = useDemoPets();
  const [filter, setFilter] = useState<LifecycleStage | "all">("all");

  const all = useMemo(
    () => (customers.ready ? customers.all() : []),
    [customers],
  );

  const enriched = useMemo(
    () =>
      all.map((p) => ({
        profile: p,
        stage: lifecycleStageFor(p),
        net: netRevenueForCustomer(p, orders),
        top: topProductForCustomer(p, orders),
        firstAt: firstSeenAt(p, orders),
        days: daysBetween(p.lastSeenAt),
      })),
    [all, orders],
  );

  const filtered = enriched.filter((e) =>
    filter === "all" ? true : e.stage === filter,
  );

  const counts = enriched.reduce<Record<LifecycleStage, number>>(
    (acc, e) => {
      acc[e.stage] = (acc[e.stage] ?? 0) + 1;
      return acc;
    },
    { new: 0, returning: 0, vip: 0, dormant: 0 },
  );

  if (!customers.ready || !ready) {
    return (
      <ListSkeleton className="mt-8" rows={5} />
    );
  }

  if (all.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-[var(--lavender-100)] text-2xl" aria-hidden>
          🐾
        </span>
        <p className="font-display text-xl text-accent-strong">No customers yet</p>
        <p className="mt-2 text-sm text-muted">
          Customers appear here when a sale captures a phone number. Try
          adding a phone in the POS, or convert a QR self-order claim.
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

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {ALL_STAGES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={
              filter === s
                ? "rounded-full bg-[#2a2557] px-3 py-1 text-xs font-extrabold text-white"
                : "rounded-full bg-panel px-3 py-1 text-xs font-bold text-muted hover:text-accent-strong"
            }
          >
            {s === "all"
              ? `All ${enriched.length}`
              : `${lifecycleLabel(s)} ${counts[s] ?? 0}`}
          </button>
        ))}
      </div>

      <ul className="mt-4 grid gap-2">
        {filtered.map(({ profile, stage, net, top, firstAt, days }) => {
          const k = phoneKey(profile.phone);
          const note = k ? notes.get(profile.phone) : null;
          return (
            <li
              key={k ?? profile.phone}
              className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-extrabold text-text">
                      {profile.name ?? "—"}
                    </span>
                    <span className="num text-xs text-muted">
                      {profile.phone}
                    </span>
                    <Pill tone={STAGE_TONE[stage]}>{lifecycleLabel(stage)}</Pill>
                    {note?.tags?.slice(0, 2).map((t) => (
                      <Pill key={t} tone="neutral">
                        {t}
                      </Pill>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {profile.orderCount} order
                    {profile.orderCount === 1 ? "" : "s"} · last{" "}
                    {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}
                    {firstAt && (
                      <>
                        {" · since "}
                        {formatDateTH(firstAt)}
                      </>
                    )}
                  </p>
                  {top && (
                    <p className="mt-0.5 text-xs text-muted">
                      Top SKU: <strong className="font-extrabold text-text">{top.name}</strong>{" "}
                      <span className="num">×{top.qty}</span>
                    </p>
                  )}
                  {(() => {
                    const petList = pets.forPhone(profile.phone);
                    if (petList.length === 0) return null;
                    return (
                      <p className="mt-0.5 text-xs text-muted">
                        {petList.slice(0, 3).map((pp, i) => (
                          <span key={pp.id}>
                            {i > 0 && " · "}
                            {speciesEmoji(pp.species)}{" "}
                            <strong className="font-extrabold text-text">
                              {petSummary(pp)}
                            </strong>
                          </span>
                        ))}
                        {petList.length > 3 && (
                          <span> +{petList.length - 3} more</span>
                        )}
                      </p>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <p className="num text-base font-extrabold text-accent-strong">
                    {formatTHB(net)} THB
                  </p>
                  <p className="text-[11px] text-muted">net lifetime</p>
                  {profile.pointsAvailable > 0 && (
                    <p className="text-[11px] font-bold text-[var(--color-warn-soft-fg)]">
                      ★ {profile.pointsAvailable} pts
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
