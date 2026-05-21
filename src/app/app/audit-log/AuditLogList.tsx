"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import type { DemoAuditAction } from "@/lib/demo/audit";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ListSkeleton } from "@/components/ui/States";
import { formatDateTimeTH } from "@/lib/date";

const ACTION_TONE: Record<DemoAuditAction, PillTone> = {
  settings_update: "neutral",
  catalog_create: "ok",
  catalog_update: "neutral",
  catalog_delete: "danger",
  catalog_set_active: "neutral",
  order_create: "accent",
  order_void: "danger",
  send_later_status_change: "warn",
  stock_count_open: "neutral",
  stock_count_commit: "ok",
  stock_count_cancel: "neutral",
  pet_create: "accent",
  pet_update: "neutral",
  pet_delete: "neutral",
  demo_reset: "danger",
  demo_seed: "ok",
};

const ACTIONS: Array<DemoAuditAction | "all"> = [
  "all",
  "order_create",
  "order_void",
  "catalog_create",
  "catalog_update",
  "catalog_delete",
  "settings_update",
  "send_later_status_change",
  "stock_count_commit",
  "demo_seed",
  "demo_reset",
];

export function AuditLogList() {
  const { entries, ready } = useDemoAudit();
  const [filter, setFilter] = useState<DemoAuditAction | "all">("all");

  if (!ready) {
    return (
      <ListSkeleton className="mt-5" />
    );
  }

  const visible = filter === "all" ? entries : entries.filter((e) => e.action === filter);

  if (entries.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <p className="font-display text-xl text-accent-strong">
          No audit entries yet.
        </p>
        <p className="mt-2 text-sm text-muted">
          Settings changes, catalog edits, sales, and voids will appear here.
        </p>
        <Link
          href="/app"
          className="btn-accent mt-4 inline-flex rounded-[var(--radius-md)] px-4 py-2 text-sm font-bold"
        >
          App home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const count =
            a === "all"
              ? entries.length
              : entries.filter((e) => e.action === a).length;
          if (a !== "all" && count === 0) return null;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setFilter(a)}
              className={
                a === filter
                  ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                  : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
              }
            >
              {a} ({count})
            </button>
          );
        })}
      </div>

      <ul className="mt-5 grid gap-2">
        {visible.map((e) => (
          <li
            key={e.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <Pill tone={ACTION_TONE[e.action]}>{e.action}</Pill>
                <span className="text-xs text-muted">on {e.targetTable}</span>
              </div>
              <span className="text-[11px] text-muted">
                {formatDateTimeTH(e.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm font-extrabold text-text">{e.summary}</p>
            {Boolean(e.oldValue !== undefined || e.newValue !== undefined) && (
              <pre className="num mt-1 max-h-24 overflow-x-auto overflow-y-auto rounded-md bg-soft px-2 py-1 text-[11px] text-text">
                {JSON.stringify(
                  { old: e.oldValue, new: e.newValue },
                  null,
                  0,
                )}
              </pre>
            )}
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-sm text-muted">
            No entries with action &ldquo;{filter}&rdquo;.
          </li>
        )}
      </ul>
    </>
  );
}
