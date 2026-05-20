import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationStatus,
  Database,
} from "@/lib/database.types";
import { ApproveRejectButtons } from "./Actions";

type App = Database["public"]["Tables"]["applications"]["Row"];

const STATUSES: ApplicationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "invited",
  "registered",
];

// Per-status soft-tint pill, in token vars only.
const STATUS_TINT: Record<ApplicationStatus, { bg: string; fg: string }> = {
  pending:    { bg: "var(--color-warn-soft-bg)",   fg: "var(--color-warn-soft-fg)" },
  approved:   { bg: "var(--color-ok-soft-bg)",     fg: "var(--color-ok-soft-fg)" },
  rejected:   { bg: "var(--color-danger-soft-bg)", fg: "var(--color-danger-soft-fg)" },
  invited:    { bg: "var(--color-soft)",           fg: "var(--color-accent-strong)" },
  registered: { bg: "var(--color-soft)",           fg: "var(--color-accent-strong)" },
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filterStatus =
    (STATUSES as readonly string[]).includes(params.status ?? "")
      ? (params.status as ApplicationStatus)
      : "pending";

  let rows: App[] = [];
  let errorMsg: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("status", filterStatus)
      .order("created_at", { ascending: false });
    if (error) throw error;
    rows = data ?? [];
  } catch (e) {
    errorMsg =
      e instanceof Error
        ? e.message
        : "Failed to load applications.";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            Pilot intake
          </p>
          <h1 className="font-display text-[32px] font-black leading-tight tracking-[-0.02em] text-accent-strong">
            Applications
          </h1>
        </div>
        <p className="text-[13px] text-muted">
          {rows.length} {rows.length === 1 ? "result" : "results"}
        </p>
      </div>

      {/* Status filter pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = s === filterStatus;
          const tint = STATUS_TINT[s];
          return (
            <a
              key={s}
              href={`/admin/applications?status=${s}`}
              className={
                active
                  ? "rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm"
                  : "rounded-full border border-line bg-panel px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-strong hover:border-accent/40"
              }
              style={
                active
                  ? undefined
                  : { background: tint.bg, color: tint.fg, borderColor: "transparent" }
              }
            >
              {s}
            </a>
          );
        })}
      </div>

      {errorMsg && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]">
          {errorMsg}
        </p>
      )}

      {!errorMsg && rows.length === 0 && (
        <div className="mt-7 rounded-[var(--radius-lg)] border border-dashed border-line bg-panel/50 px-6 py-10 text-center">
          <p className="text-[15px] font-bold text-accent-strong">
            No {filterStatus} applications
          </p>
          <p className="mt-1 text-sm text-muted">
            New ones land here as soon as they&rsquo;re submitted.
          </p>
        </div>
      )}

      <ul className="mt-6 grid gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4 shadow-sm transition hover:border-accent/30 hover:shadow-md"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-[18px] font-extrabold leading-tight text-accent-strong">
                {row.brand_name}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted tabular-nums">
                {new Date(row.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <p className="mt-1 text-[13px] text-text/85">
              <span className="font-bold">{row.owner_name}</span>
              <span className="text-muted"> · </span>
              <a
                href={`mailto:${row.email}`}
                className="text-accent-strong hover:underline"
              >
                {row.email}
              </a>
              <span className="text-muted"> · </span>
              <span className="tabular-nums">{row.phone}</span>
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.06em] text-muted">
              {row.product_category}
            </p>
            {row.message && (
              <p className="mt-3 rounded-[var(--radius-md)] bg-[color:var(--color-soft)] px-3.5 py-2.5 text-[13px] leading-relaxed text-text/85">
                {row.message}
              </p>
            )}
            {filterStatus === "pending" && (
              <div className="mt-3.5 border-t border-line pt-3.5">
                <ApproveRejectButtons applicationId={row.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
