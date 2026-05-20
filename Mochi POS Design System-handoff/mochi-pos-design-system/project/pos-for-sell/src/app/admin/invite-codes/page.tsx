import { createClient } from "@/lib/supabase/server";
import type { Database, InviteCodeStatus } from "@/lib/database.types";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { formatDateTimeTH } from "@/lib/date";

type Row = Database["public"]["Tables"]["invite_codes"]["Row"];

const STATUSES: InviteCodeStatus[] = ["active", "used", "expired", "cancelled"];

const toneFor = (s: InviteCodeStatus): PillTone =>
  s === "active" ? "ok" : s === "used" ? "neutral" : s === "expired" ? "warn" : "danger";

const MOCK: Row[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    application_id: "00000000-0000-0000-0000-000000000010",
    code: "CATBOOTH-WJ7Y-GZKD",
    email: "owner@meowhouse.example",
    brand_name: "Meow House",
    status: "active",
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    used_at: null,
    used_by_user_id: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_by: null,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    application_id: "00000000-0000-0000-0000-000000000011",
    code: "CATBOOTH-FN3X-PY8K",
    email: "hello@cattokyo.example",
    brand_name: "Cat Tokyo",
    status: "used",
    expires_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    used_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    used_by_user_id: null,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    created_by: null,
  },
];

export default async function InviteCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = STATUSES.includes(params.status as InviteCodeStatus)
    ? (params.status as InviteCodeStatus)
    : "active";

  let rows: Row[] = [];
  let isMock = false;
  let errorMsg: string | null = null;

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      isMock = true;
      rows = MOCK.filter((r) => r.status === filter);
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("status", filter)
        .order("created_at", { ascending: false });
      if (error) throw error;
      rows = data ?? [];
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Failed to load invite codes.";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            Pilot intake
          </p>
          <h1 className="font-display text-[32px] font-black leading-tight tracking-[-0.02em] text-accent-strong">
            Invite codes
          </h1>
          {isMock && (
            <p className="mt-1.5 inline-block rounded-full bg-[color:var(--color-warn-soft-bg)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[color:var(--color-warn-soft-fg)]">
              Demo mode — connect Supabase to load real codes
            </p>
          )}
        </div>
        <p className="text-[13px] text-muted">
          {rows.length} {rows.length === 1 ? "code" : "codes"}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/invite-codes?status=${s}`}
            className={
              s === filter
                ? "rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm"
                : "rounded-full border border-line bg-panel px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-strong hover:border-accent/40"
            }
          >
            {s}
          </a>
        ))}
      </div>

      {errorMsg && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]">
          {errorMsg}
        </p>
      )}

      <ul className="mt-6 grid gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4 shadow-sm transition hover:border-accent/30 hover:shadow-md"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-display text-[18px] font-extrabold leading-tight text-accent-strong">
                {row.brand_name}
              </p>
              <Pill tone={toneFor(row.status)}>{row.status}</Pill>
            </div>
            <p className="num mt-2 rounded-[var(--radius-md)] bg-[color:var(--color-soft)] px-3 py-2 text-[14px] font-extrabold tracking-[0.05em] text-accent-strong">
              {row.code}
            </p>
            <p className="mt-2 text-[12px] text-muted">
              <a href={`mailto:${row.email}`} className="font-bold text-accent-strong hover:underline">
                {row.email}
              </a>
              <span> · created {formatDateTimeTH(row.created_at)} · expires {formatDateTimeTH(row.expires_at)}</span>
              {row.used_at && <span> · used {formatDateTimeTH(row.used_at)}</span>}
            </p>
          </li>
        ))}
        {!errorMsg && rows.length === 0 && (
          <li className="rounded-[var(--radius-lg)] border border-dashed border-line bg-panel/50 px-6 py-10 text-center">
            <p className="text-[15px] font-bold text-accent-strong">
              No {filter} invite codes
            </p>
            <p className="mt-1 text-sm text-muted">
              Approve an application to generate one.
            </p>
          </li>
        )}
      </ul>
    </div>
  );
}
