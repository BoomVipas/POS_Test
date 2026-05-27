import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import {
  APPLICATION_STATUSES,
  adminApplicationsHref,
  applicationMatchesSearch,
  normalizeApplicationSearch,
  parseApplicationStatus,
} from "@/lib/admin/application-search";
import { ApproveRejectButtons } from "./ApproveRejectButtons";

type App = Database["public"]["Tables"]["applications"]["Row"];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filterStatus = parseApplicationStatus(params.status);
  const search = normalizeApplicationSearch(params.q);

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
  const filteredRows = rows.filter((row) => applicationMatchesSearch(row, search));

  return (
    <div>
      <h1 className="font-display text-3xl text-accent-strong">Applications</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {APPLICATION_STATUSES.map((s) => {
          const active = s === filterStatus;
          return (
            <a
              key={s}
              href={adminApplicationsHref({ status: s, search })}
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

      <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <input type="hidden" name="status" value={filterStatus} />
        <label htmlFor="application-search" className="flex-1">
          <span className="mb-1.5 block text-sm font-bold text-accent-strong">
            Search applications
          </span>
          <input
            id="application-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Brand, owner, email, phone, category, or status"
            className="w-full rounded-[var(--radius-md)] border border-line bg-panel px-3 py-2.5 text-base text-text shadow-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold btn-accent"
          >
            Search
          </button>
          {search && (
            <a
              href={adminApplicationsHref({ status: filterStatus })}
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2.5 text-sm font-bold text-accent-strong hover:bg-soft"
            >
              Clear
            </a>
          )}
        </div>
      </form>

      {errorMsg && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-fg)]">
          {errorMsg}
        </p>
      )}

      {!errorMsg && filteredRows.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          {search
            ? `No ${filterStatus} applications match "${search}".`
            : `No applications with status "${filterStatus}".`}
        </p>
      )}

      <ul className="mt-6 grid gap-3">
        {filteredRows.map((row) => (
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
