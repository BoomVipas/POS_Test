import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationStatus,
  Database,
} from "@/lib/database.types";
import { ApproveRejectButtons } from "./ApproveRejectButtons";

type App = Database["public"]["Tables"]["applications"]["Row"];

const STATUSES: ApplicationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "invited",
  "registered",
];

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
      <h1 className="font-display text-3xl text-accent-strong">Applications</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = s === filterStatus;
          return (
            <a
              key={s}
              href={`/admin/applications?status=${s}`}
              className={
                active
                  ? "rounded-full border border-accent-strong bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                  : "rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-strong"
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
        <p className="mt-6 text-sm text-muted">
          No applications with status &ldquo;{filterStatus}&rdquo;.
        </p>
      )}

      <ul className="mt-6 grid gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-bold text-accent-strong">{row.brand_name}</p>
              <p className="text-xs text-muted">
                {new Date(row.created_at).toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-sm text-text/85">
              {row.owner_name} · {row.email} · {row.phone}
            </p>
            <p className="mt-1 text-xs text-muted">{row.product_category}</p>
            {row.message && (
              <p className="mt-2 text-sm text-text/80">{row.message}</p>
            )}
            {filterStatus === "pending" && (
              <div className="mt-3">
                <ApproveRejectButtons
                  applicationId={row.id}
                  brandName={row.brand_name}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
