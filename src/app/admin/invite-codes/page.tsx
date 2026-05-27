import { createClient } from "@/lib/supabase/server";
import type { Database, InviteCodeStatus } from "@/lib/database.types";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { formatDateTimeTH } from "@/lib/date";
import { CancelInviteButton } from "./CancelInviteButton";
import { ResendInviteButton } from "./ResendInviteButton";

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
      <h1 className="font-display text-3xl text-accent-strong">Invite codes</h1>
      {isMock && (
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--color-warn-soft-fg)]">
          Demo mode — connect Supabase to load real codes
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/invite-codes?status=${s}`}
            className={
              s === filter
                ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
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
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-lg text-accent-strong">
                {row.brand_name}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {!isMock && row.status === "active" && (
                  <>
                    <ResendInviteButton
                      inviteCodeId={row.id}
                      brandName={row.brand_name}
                    />
                    <CancelInviteButton
                      inviteCodeId={row.id}
                      brandName={row.brand_name}
                    />
                  </>
                )}
                <Pill tone={toneFor(row.status)}>{row.status}</Pill>
              </div>
            </div>
            <p className="num mt-1 text-sm font-extrabold tracking-wide text-text">
              {row.code}
            </p>
            <p className="mt-1 text-xs text-muted">
              {row.email} · created {formatDateTimeTH(row.created_at)} · expires {formatDateTimeTH(row.expires_at)}
              {row.used_at && ` · used ${formatDateTimeTH(row.used_at)}`}
            </p>
          </li>
        ))}
        {!errorMsg && rows.length === 0 && (
          <li className="text-sm text-muted">No invite codes with status &ldquo;{filter}&rdquo;.</li>
        )}
      </ul>
    </div>
  );
}
