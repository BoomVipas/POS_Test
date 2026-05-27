import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/auth/workspace";
import type { Database } from "@/lib/database.types";
import { formatDateTimeTH } from "@/lib/date";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

type Row = Database["public"]["Tables"]["audit_logs"]["Row"];

const LIMIT = 150;

// Wave 58b: the canonical action-type list. Used both for tone lookup and for
// validating the ?action= URL param (unknown values fall back to null).
const KNOWN_ACTIONS = [
  "create_order",
  "void_order",
  "refund_order_items",
  "close_day",
  "adjust_event_stock",
  "correct_order",
  "claim_registration_token",
  "create_registration_token",
  "approve_application",
  "reject_application",
  "redeem_invite_code",
] as const;

export type KnownAction = (typeof KNOWN_ACTIONS)[number];

export function isKnownAction(s: string | null): s is KnownAction {
  return KNOWN_ACTIONS.includes(s as KnownAction);
}

const TONE: Record<KnownAction, PillTone> = {
  create_order: "accent",
  void_order: "danger",
  refund_order_items: "warn",
  close_day: "ok",
  adjust_event_stock: "neutral",
  correct_order: "warn",
  claim_registration_token: "accent",
  create_registration_token: "accent",
  approve_application: "ok",
  reject_application: "danger",
  redeem_invite_code: "ok",
};

function toneFor(action: string): PillTone {
  return (TONE as Record<string, PillTone>)[action] ?? "neutral";
}

function summaryFor(r: Row): string {
  const nv = r.new_value as Record<string, unknown> | null;
  if (!nv) return r.target_id ?? "";
  if ("order_number" in nv) {
    const total =
      typeof nv.total_satang === "number"
        ? ` · ฿${(nv.total_satang / 100).toFixed(0)}`
        : "";
    return `${nv.order_number}${total}`;
  }
  if ("reason" in nv && typeof nv.reason === "string") return nv.reason;
  if ("brand_name" in nv && typeof nv.brand_name === "string")
    return nv.brand_name;
  return r.target_id ?? "";
}

export async function AuditLogConfiguredServer({
  filter,
}: {
  // Wave 58b: callers must validate the filter against isKnownAction() before
  // passing it here; unknown values should be coerced to null by page.tsx.
  filter: KnownAction | null;
}) {
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("workspace_id", ws.workspaceId)
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (filter) query = query.eq("action", filter);

  const { data: rows, error } = await query;

  if (error) {
    return (
      <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]">
        Failed to load audit log: {error.message}
      </p>
    );
  }

  // Wave 58a: always run an unfiltered pass for the distinct action types so
  // the filter nav remains visible (and navigable) when a filter is active.
  // The filtered `rows` above is cheap (≤150 rows); this second query is
  // action-column-only and also ≤150 rows — acceptable for the pilot scale.
  const distinctQuery = await supabase
    .from("audit_logs")
    .select("action")
    .eq("workspace_id", ws.workspaceId)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  const distinct = [
    ...new Set((distinctQuery.data ?? []).map((r) => r.action)),
  ].sort();

  if (!rows || rows.length === 0) {
    return (
      <div className="panel mt-8 p-8 text-center">
        <span
          className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-[var(--lavender-100)]"
          aria-hidden
        >
          <ClipboardList className="h-6 w-6 text-[var(--lavender-700)]" />
        </span>
        <p className="font-display text-xl text-accent-strong">
          {filter ? `No "${filter}" entries.` : "No audit entries yet."}
        </p>
        <p className="mt-2 text-sm text-muted">
          Sales, voids, stock adjustments, and corrections will appear here.
        </p>
        {filter && (
          <Link
            href="/app/audit-log"
            className="mt-4 inline-block text-sm font-bold text-accent-strong underline underline-offset-4"
          >
            Clear filter
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Wave 58a: show nav whenever distinct actions exist — not only when
          distinct.length > 1. Previously the nav disappeared when a filter
          was active because distinct was derived from the filtered rows. */}
      {distinct.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/app/audit-log"
            className={
              !filter
                ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
            }
          >
            all
          </a>
          {distinct.map((a) => {
            const count = rows.filter((r) => r.action === a).length;
            return (
              <a
                key={a}
                href={`/app/audit-log?action=${encodeURIComponent(a)}`}
                className={
                  a === filter
                    ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                    : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
                }
              >
                {a} ({count})
              </a>
            );
          })}
        </div>
      )}

      <ul className="mt-5 grid gap-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <Pill tone={toneFor(r.action)}>{r.action}</Pill>
                <span className="text-xs text-muted">on {r.target_table}</span>
              </div>
              <span className="text-[11px] text-muted">
                {formatDateTimeTH(r.created_at)}
              </span>
            </div>
            <p className="mt-1 text-sm font-extrabold text-text">
              {summaryFor(r)}
            </p>
            {(r.old_value !== null || r.new_value !== null) && (
              <pre className="num mt-1 max-h-24 overflow-x-auto overflow-y-auto rounded-md bg-soft px-2 py-1 text-[11px] text-text">
                {JSON.stringify({ old: r.old_value, new: r.new_value }, null, 0)}
              </pre>
            )}
          </li>
        ))}
      </ul>
      {rows.length === LIMIT && (
        <p className="mt-4 text-xs text-muted">
          Showing the most recent {LIMIT} entries.
        </p>
      )}
    </>
  );
}
